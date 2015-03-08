// +++
// o.js tests
//
// simple test to make some quick test without the complexity of quint
//
// By Jan Hommes 
// Date: 20.01.2015
// +++

//helper function for debuging
function printResult(o,data) {
	//console.log(o);
	//console.log(data);
	try{
		return('Passed! Lenght: '+(typeof data.length !== 'undefined'? data.length :1) +'  |  JSON Result: '+JSON.stringify(data));
	} catch(e) {
		return('Failed! Exception: '+e);
	}
} 


o().config({
	//endpoint:'https://secure.pointsale.de/Service.svc',
	endpoint:'http://localhost:1000/Api.svc',
	version:3,
	strictMode:true,
	username:'psapi',
	password:'demo'
	//headers:[{name:'X-Custom-Headers', value: 'value'}]
});


// ----------------------------------------------- Tests ----------------------------------------------------
/*o('Product(2)').delete().save(function(data) {
	console.log(printResult(this,data));
	
	o("Product(2)").get(function(data) {
		console.log(data);
	});
});*/

/*o('Product').find(':id').route('Product/:id',function(data) {
	console.log("Product route");
	console.log(data);
});

o('Group').find(':gid').route('Product/:id/Group/:gid',function(data) {
	console.log("Group route");
	console.log(data);
});*/

o('Product').find(':0').route([/#Product\/(\w+|\W+)\/Edit\/(\w+|\W+)/,'Product/:0/Group/:gid'] ,function(data) {
	console.log("edit route & product route");
	console.log(this.param);
});

o('Product').search(['Name','Description'],':searchword').route('Product/Search/:searchword',function(data) {
	console.log("search route");
	console.log(this.param);
	console.log(data);
});



/*o('Group').filter('Name eq :f').route('Product/:f',function(data) {
	console.log("Group route with filter");
	console.log(data);
});*/

