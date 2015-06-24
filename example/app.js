// +++
// o.js example
//
// An example for o.js.
//
// By Jan Hommes 
// Date: 15.06.2015
// +++

//knockout view model
function ViewModel() {
	var self=this;
	
	//ko observables
	self.products=ko.observableArray([]);
	self.groups=ko.observableArray([]);
	self.currentProduct=ko.observable(null);
	self.route=ko.observable('');
	self.skip=ko.observable(0);
	self.total=ko.observable(0);
	self.detailProduct=ko.observable();
	self.isLoading=ko.observable(false);
	
	//a complex observable used for the shopping card
	self.shoppingCard={
		items:ko.observableArray([]),
		total:function() {
			var total=0;
			for(var i=0;i<this.items().length;i++) 
				total+=this.items()[i].Total();
			return(total);
		}
	}
	
	//o.js init
	o().config({
		endpoint:'http://services.odata.org/V4/OData/OData.svc',
		version:4,
		strictMode:true,
		start:function() {
			self.isLoading(true);
		},
		ready:function() {
			self.isLoading(false);
		}
	});
	
		
	//+++ initialize the routes +++

	//get top 3 products on start TODO: At filter for best selling!
	o('Products').take(3).route('Home', function(data) {
		self.route('Home');
		self.products(data);
	}).triggerRoute(window.location.hash === '' ? '#Home' : window.location.hash);
	
	//get a product list on product click
	o('Products').take(9).inlineCount().route('Product',function(data) {
		self.route('Product');
		self.products(data);
		self.skip(0);
		self.total(this.inlinecount);
	});
	
	//product pagination
	o('Products').skip(':0').take(9).inlineCount().route('Product/Page/:0',function(data) {
		console.log(this.param);
		self.skip(parseInt(this.param[0]));
		self.route('Product');
		self.products(data);
		self.total(this.inlinecount);
	});
	
	//product detail
	o('Products').find(':0').route('Product/Detail/:0/:1',function(data) {
		self.route('Detail');
		self.detailProduct(data);
	});

	//open the shopping card
	o('').route('Card',function(data) {
		self.route('Card');
	});
	
	//add to shopping card
	self.addToCard=function(product) {
		//push a temp ProductOrder element into the items. 
		self.shoppingCard.items.push({ 
			Amount:ko.observable(1),
			Product:product,
			Total:function() {
				return(this.Amount()*this.Product.Price);
			},
			Remove:function() {
				var index = self.shoppingCard.items.indexOf(this);
				self.shoppingCard.items.splice(index, 1);
			}
		});
	}

}

//append the viewmodel
ko.applyBindings(new ViewModel());

