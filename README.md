# o.js
*o.js alpha v0.4*

o.js is a clientside Odata Javascript libary to simplify the request of data from Odata web services. The main goal is to build a standalone, lighwight and easy to understand Odata lib. It is currently under deployment and not suitable for production.

Samples
------------
For alle samples we are using oure odata service from <a href="http://www.pointsale.de">Pointsale</a>. Pointsale is a Javascript based e-commerce API currenly in development. 

Simple Odata query with o.js:
-----------
```js
  o('https://secure.pointsale.de/Service.svc/Product').get(function(data) {
  		console.log(data); //returns an array of Product data
  });
```
o.js uses a jQuery like syntax to determine which resource you want to access. You can define any Odata service url in the o-function: `o('<your odata service resource>')`. This only holds a handler to this resource and dosn't start the ajax call. If you want to get the resource, you need to call `.get()`. Get accepts a function callback which contains the data as the first parameter.

Method chaining:
--------
By adding some chained functions to the o-function you can add query options:
```js
o('https://secure.pointsale.de/Service.svc/Product').take(5).skip(2).get(function(data) {
	console.log(data); //An array of 5 products skiped by 2
});
```

Currently the following queries are supported:
 * **find(int)** -> returns the object with the given id. (Odata: Product*(1)*)
 * **top(int)** -> returns the top x objects (Odata: Product/?*$top=2*)
 * **skip(int)** -> returns the objects skipped by the given value (Odata: Product/?*$skip=2*)
 * **first()** -> returns the first object which is found (Odata: Product/?*$top=1*)
 * **filter(string)** -> adds a filter string (currently only a plain string filter is supported, [see the Odata doc](http://www.odata.org/documentation/odata-version-3-0/url-conventions/) for more information) (Odata: Product/?*$filter=Name eq 'Example'*)
 * **orderBy(string)** -> orders the data (Odata: Product/?*$orderBy=Name*)
 * **inlineCount()** -> adds a inlinecount to the resilt (Odata: Product/?*$inlinecount=allpages*)
 * **batch(string)** -> adds a second resource to the request (Odata: $batch)
 * **expand(string)** -> expands a related resource (Odata: Product/?*$expand=ProductUnit*)

Get data:
--------
If you want to get data you need to call the `get()` function. This functions returns an async callback function which holds an array as it's parameter. If you use `first()` or the `find()` method it only returns the data because an array is not needed. 
You can also save your o-function to call it later:
```js
var oHandler=o('https://secure.pointsale.de/Service.svc/Product');
//do somehtting
oHandler.find(1);
// do some more

//get the data
oHandler.get(function(data) {
  console.log(data);
  //or the saved var also contains the data:
  console.log(oHandler.data);
});
```

If you need to get several data you can use promise. Currently o.js only suports [q.js](https://github.com/kriskowal/q). The following example show how you can get the data of two differend resources:
```js
Q.all([
	o('https://secure.pointsale.de/Service.svc/Product(4)').get(),
	o('https://secure.pointsale.de/Service.svc/Group').take(2).get()
]).then(function(oHandlerArray) {
	//The oHandler array contains the Product oHandler and the Group oHandler:
	oHandlerArray[0].data); // 1 Product with id 4
	oHandlerArray[1].data.length); // 2 Groups
});
```

You can also use promise for only one resource. The main advantage is, that you can use a fail-function:
```js
o('https://secure.pointsale.de/Service.svc/Product(2)').get().then(function(oHandler) {
	console.log(oHandler.data);
}).fail(function(ex) {
	console.log(ex);
}
```

Add and change data:
---------
You can use the `post()` function in combination with the `save()` method to add data:
```js
o('https://secure.pointsale.de/Service.svc/Product').post({Name:'Example 1',Description:'a'}).post({Name:'Example 2',Description:'b'}).save(function(data) {
	console.log("Two Products added");
}
````

Changing (PATCH or PUT) data is nearly the same:
```js
o('https://secure.pointsale.de/Service.svc/Product(1)').patch({Name:'NewName'}).save(function(data) {
	console.log("Product Name changed"); 
});
````

You can also combine a single data request (`first()` or `find()`) with the save method and chain it:
```js
o('Product').find(2).get().then(function(oHandler) {
	oHandler.data.Name="NewName";
	return(o.save());
}).then(function(oHandler) {
	console.log(oHandler.data.Name); //NewName
}).fail(function(ex) {
	console.log("error");
});
```


Endpoint configuration:
---------
You can configure a endpoint with the `o().config()` function. This config is persistent over all off your o.js calls. Example:
```js
  // set an endpoint
  o().config({
    endpoint:'https://secure.pointsale.de/Service.svc'
  });
  
  // after you have set an endpoint, you can shorten your queries:
  o('Product').get(function(data) {
  	//same result like the first exmple on this page
  });
```
However, if you have set an endpoint you can still do a full endpoint request for example to another domain `o('http://odata.example.de/Customer')`. With this function you can also do some more basic configs:
```js
  //basic config
  o().config({
	  endpoint:null,    //your odata endpoint for the service
	  json:true,        //currently only json is supported
	  version:3,        //version
	  strictMode:true,  //strict mode throws exception, non strict mode only logs them
	  start:null,       //a function which is executed on loading
	  ready:null,       //a function which is executed on ready
	  headers:[],	      //a array of additional headers e.g.: [{name:'headername',value:'headervalue'}]
	  username:null,    //the basic auth username
	  password:null,    //the basic auth password
	  isAsync:true      //set this to true to make synced (a)jax calls. (dosn't work with basic auth!)
  });
```







