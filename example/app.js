// +++
// o.js example
//
// An example for o.js.
//
// By Jan Hommes
// Date: 01.03.2016
// +++

//knockout view model
function ViewModel() {
    var self = this;

    //ko observables
    self.People = ko.observableArray([]);
    //self.currentPeople=ko.observable(null);
    self.route = ko.observable('');
    self.skip = ko.observable(0);
    self.total = ko.observable(0);
    self.detailPeople = ko.observable();
    self.isLoading = ko.observable(false);

    self.remove = function (d) {
        o('People(\'' + self.detailPeople().UserName + '\')/Trips(' + d.TripId + ')').remove().save(function () {
            o('People(\'' + self.detailPeople().UserName + '\')').expand('Trips').get(function (d) {
                self.detailPeople(d);
            });
        });
    }

    //o.js init
    o().config({
        endpoint: 'http://services.odata.org/V4/%28S%28wptr35qf3bz4kb5oatn432ul%29%29/TripPinServiceRW/',
        version: 4,
        strictMode: true,
        start: function () {
            self.isLoading(true);
        },
        ready: function () {
            self.isLoading(false);
        },
        headers: [{ name: 'If-Match', value: '*' }]
    });


    //+++ initialize the routes +++

    //get top 3 People on start TODO: At filter for best selling!
    o('People').take(3).route('Home', function (data) {
        self.route('Home');
        self.People(data);
    }).triggerRoute(window.location.hash === '' ? '#Home' : window.location.hash);

    //get a People list on People click
    o('People').take(9).inlineCount().route('People', function (data) {
        self.route('People');
        self.People(data);
        self.skip(0);
        self.total(this.inlinecount);
    });

    //People pagination
    o('People').skip(':0').take(9).inlineCount().route('People/Page/:0', function (data) {
        self.skip(parseInt(this.param[0]));
        self.route('People');
        self.People(data);
        self.total(this.inlinecount);
    });

    //People detail
    o('People').filter('UserName == \':0\'').expand('Trips').first().route('People/Detail/:0', function (data) {
        self.route('Detail');
        self.detailPeople(data);
    });
}

//append the viewmodel
ko.applyBindings(new ViewModel());