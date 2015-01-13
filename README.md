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
```js
  o('https://secure.pointsale.de/Service.svc/Product').take(5).skip(2).get(function(data) {
			console.log(data); //An array of 5 products skiped by 2
	});
```

Extended Odata query with endpoint configuration:
---------
You can configure a endpoint with the `o().config()` function. This config is persistent over all off your o.js calls.
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

Example:
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
However, if you have set an endpoint you can still do a full endpoint request for example to another domain `o('http://odata.example.de/Customer')`.







