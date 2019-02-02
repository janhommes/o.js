/**
 * An example how to use o.js in a browser.
 */

// knockout view model
function ViewModel() {
    var self = this;

    // ko observables
    self.People = ko.observableArray([]);
    self.route = ko.observable('');
    self.skip = ko.observable(0);
    self.total = ko.observable(0);
    self.detailPeople = ko.observable();
    self.isLoading = ko.observable(false);

    // o.js init
    var o = odata.o;
    var oHandler = o('https://services.odata.org/V4/%28S%28wptr35qf3bz4kb5oatn432ul%29%29/TripPinServiceRW/', {
        headers: {
            'If-Match': '*'
        }
    });

    // initialize the routes
    window.addEventListener("hashchange", hashChange, false);

    // trigger on startup
    hashChange();

    // react to each hash change
    function hashChange() {
        var hash = window.location.hash;

        if (hash === "" || hash === "#Home") {
            self.isLoading(true);
            oHandler.get('People').query({
                $top: 3
            }).then(function (data) {
                self.route('Home');
                self.People(data);
                self.isLoading(false);
            });
        }

        if (hash === "#People") {
            self.isLoading(true);
            oHandler.get('People').query({
                $top: 6
            }).then(function (data) {
                oHandler.get('People/$count').query().then(function (count) {
                    self.route('People');
                    self.People(data);
                    self.skip(0);
                    self.total(count);
                    self.isLoading(false);
                });
            });
        }

        if (/People\/Page/.test(hash)) {
            var skip = hash.match(/\d+/);
            self.isLoading(true);
            oHandler.get('People').query({
                $top: 6,
                $skip: skip
            }).then(function (data) {
                self.route('People');
                self.People(data);
                self.skip(parseInt(skip));
                self.isLoading(false);
            });
        }

        if (/People\/Detail/.test(hash)) {
            var name = hash.replace("#People/Detail/", "");
            self.isLoading(true);
            oHandler.get("People('" + name + "')").query({
                $expand: 'Trips'
            }).then(function (data) {
                self.route('Detail');
                self.detailPeople(data);
                self.isLoading(false);
            });
        }
    }

    // allows to remove a trip
    self.remove = function (d) {
        oHandler.delete('People(\'' + self.detailPeople().UserName + '\')/Trips(' + d.TripId + ')').query().then(function () {
            oHandler.get('People(\'' + self.detailPeople().UserName + '\')').query({
                $expand: 'Trips'
            }).then(function (d) {
                self.detailPeople(d);
            });
        });
    }
}

//append the viewmodel
ko.applyBindings(new ViewModel());