// o test file


// runs in an exception because of strict mode
//o("Product");
//o("");

//this should work
/*o("https://secure.pointsale.de/Service.svc/Product?$top=1&$skip=2").get(function(data) {
	console.log(data);
});

//this should work
/*o("https://secure.pointsale.de/Service.svc/Product(2)").get(function(data) {
	console.log(data);
});*/


//o configuration
// strict mode is disabled to display errors in the console log instead of throwing them as an exception

o().config({
	endpoint:'http://localhost:1000/Api.svc',
	version:3,
	strictMode:true,
	username:'PSAPI',
	password:'rewerse'
	//headers:[{name:'X-Custom-Headers', value: 'value'}]
});

/*o("Product").first().route("",function(data) {
	console.log(data);
});

o("Product").route("Change",function(data) {
	console.log(data);
});*/

o("Product").take(10).get(function(data) {
	console.log(data);
});

/*o("Product").first().route("Change",function() {
	this.data.Identifier=Math.random()+"";
	console.log(this.data.Identifier);
	this.save(function(data) {
		//console.log(data);
	});
});*/





/*o("Product").find(2).filter("Name eq 'Bla'").get(function(data) {
		console.log(data);
});*/

/*o("Product").post({Name:'XXXX',Description:'AAA'}).post({Name:'XXXX2',Description:'AAA'}).save(function(data) {
	//console.log(data);
	//console.log(this);
});*/

/*o("Product").filter("Name eq 'XXXX'").get(function(data) {
	console.log(data.length);
});*/

//route test (alternative route)
/*o("Product").route("AddProduct",function(data) {
	this.post({Name:'XXXX',Description:'AAA'});
	this.save(function(o) {
		console.log("SAVED :)");
	});
});

//route test (alternative route)
o("Product").filter("Name eq 'XXXX'").route("GetProducts",function(o) {
	console.log(this);
	console.log(o);
	console.log(o.data);
});*/
/*
//route test with trigger
o("Group").route(function(data) {
	console.log(data);
}).triggerRoute("Group");
*/

//test filter
/*o("Group").take(10).skip(10).filter("Name eq 'Testgruppe'").get(function(data) {
	console.log(data);
});*/

//test query return
//console.log(o("Group").filter("Name eq 'Testgruppe'").query());


//auto expand in combination with batch 
/*o("Shop").find(4).get(function(data) {
	console.log(this);
});*/
/*
//test .first()
o("Group").first().get(function(data) {
	console.log(data);
});

//test .count()

o("ProductGroup").count().get(function(data) {
	console.log(data);
});

//test batch
o("Product").batch("Group").get(function(data) {
	console.log(data);
});
*/


/*
//test resource identifier
o("meertelSP?$filter=(SMSMT_WinLogon eq 'hommejan')").get(function(data) {
	console.log(data);
});

//test resource identifier
o("Feedback?$filter=(userid eq 'hommejan')").get(function(data) {
	console.log(data);
})
*/;

/*
//test .take()
o("Feedback").find(1002).get(function(data) {
	console.log(data);
});

//test .get()
o("Feedback").find(1002).get(function(data) {
	console.log(data);
});

//test .skip()
o("Feedback").skip(3).get(function(data) {
	console.log(data);
});
*/


//test nothing
//runs into an error
/*o().get(function(data) {
	console.log(data);
});
//returns the metadata
o("").get(function(data) {
	console.log(data);
});

//test direct
o("https://secure.pointsale.de/Service.svc/Feedback(1)?$format=json").get(function(data) {
	console.log(data);
});
*/



