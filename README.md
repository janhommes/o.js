# o.js
*o.js beta v0.1*

o.js is a client side Odata Javascript library to simplify the request of data. The main goal is to build a **standalone, lightweight and easy** to understand Odata lib. 


##### Samples #####
------------
For alle samples we are using the test odata service from <a href="http://www.odata.org">Odata.org</a>. You can find the metadata of this service <a href="http://services.odata.org/V4/OData/OData.svc">here</a>. 

###### Simple Odata query with o.js ######
----------------------
```js
  o('http://services.odata.org/V4/OData/OData.svc/Products').get(function(data) {
  		console.log(data); //returns an array of Product data
  });
``` 
o.js uses a jQuery like syntax to determine which resource you want to access. You can define any Odata service url (or any json web service) in the o-function: `o('<your odata service resource>')`. This only holds a handler to this resource and dosn't start the ajax call. If you want to get the resource, you need to call `.get()`. Get accepts a function callback which contains the data as the first parameter.

###### Methods ######
--------
By adding some chained functions to the o-handler you can add query options:
```js
o('http://services.odata.org/V4/OData/OData.svc/Products').take(5).skip(2).get(function(data) {
	console.log(data); //An array of 5 products skiped by 2
});
``` 

###### Routing ######
--------
You can use hash routes to map your Odata service endpoint to your website:
```js
  o('http://services.odata.org/V4/OData/OData.svc/Products').find(':0').route('Product/Detail/:0/:1',function(data) {
	console.log('Route Product/Detail/'+this.param[0]+'/'+this.param[1]+' triggered. Result:');
	console.log(data);
  });
```
Instead of manual getting your data with the `get()` function, this routing function always returns the data when somebody navigates to an URL with the hash value `index.html#Product/Detail/1/Some more parameter`. The `find()` method automatically maps the right parameter (in this example *1*). <a href="https://github.com/janhommes/o.js/tree/master/example">See this</a> demonstration for more examples. 

###### Get data (details) ######
--------
If you want to get data you need to call the `get()` function. This functions returns an async callback function which holds an array as it's parameter. If you use `first()` or the `find()` method it only returns the data because an array is not needed. 
You can also save your o-function to call it later:
```js
var oHandler=o('http://services.odata.org/V4/OData/OData.svc/Products');
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
	o('http://services.odata.org/V4/OData/OData.svc/Products(4)').get(),
	o('http://services.odata.org/V4/OData/OData.svc/Categories').take(2).get()
]).then(function(oHandlerArray) {
	//The oHandler array contains the Product oHandler and the Group oHandler:
	oHandlerArray[0].data); // 1 Product with id 4
	oHandlerArray[1].data.length); // 2 Categories
});
```

You can also use promise for only one resource. The main advantage is, that you can use a fail-function:
```js
o('http://services.odata.org/V4/OData/OData.svc/Products(2)').get().then(function(oHandler) {
	console.log(oHandler.data);
}).fail(function(ex) {
	console.log(ex);
}
``` 
 


#### Add and change data ####
---------
To add and change data you can use the http verb in kombination with the `save()` method:

###### Post: ######
---------
You can use the `post()` function in combination with the `save()` method to add data:
```js
o('http://services.odata.org/V4/OData/OData.svc/Products').post({Name:'Example 1',Description:'a'}).post({Name:'Example 2',Description:'b'}).save(function(data) {
	console.log("Two Products added");
}
```` 

###### Patch/Put: ######
---------
Changing (PATCH or PUT) data is nearly the same:
```js
o('http://services.odata.org/V4/OData/OData.svc/Products(1)').patch({Name:'NewName'}).save(function(data) {
	console.log("Product Name changed"); 
});
```` 

###### Delete: ######
---------
To remove (DELETE) data you need to call `remove()`:
```js
o('http://services.odata.org/V4/OData/OData.svc/Products(1)').remove().save(function(data) {
	console.log("Product deleted"); 
});
```` 

###### Reference: ######
---------
To add an reference to an other resource use `ref` (to remove it simply use `removeRef` the same way):
```js
o('http://services.odata.org/V4/OData/OData.svc/Products(1)').ref('Categories', 2).save(function(data) {
	console.log("Product(1) associated with Categories(2)"); 
});
```` 

You can also combine a single data request (`first()` or `find()`) with the save method and chain it:
```js
o('http://services.odata.org/V4/OData/OData.svc/Products').find(2).get().then(function(oHandler) {
	oHandler.data.Name="NewName";
	return(o.save());
}).then(function(oHandler) {
	console.log(oHandler.data.Name); //NewName
}).fail(function(ex) {
	console.log("error");
});
``` 
 


##### Endpoint configuration #####
---------
You can configure a endpoint with the `o().config()` function. This config is persistent over all off your o.js calls. Example:
```js
  // set an endpoint
  o().config({
    endpoint:'http://services.odata.org/V4/OData/OData.svc'
  });
  
  // after you have set an endpoint, you can shorten your queries:
  o('Products').get(function(data) {
  	//same result like the first exmple on this page
  });
```
However, if you have set an endpoint you can still do a full endpoint request for example to another domain `o('http://odata.example.de/Customer')`. With this function you can also do some more basic configs:
```js
  //basic config
  o().config({
	  endpoint:null,    // your odata endpoint for the service
	  json:true,        // currently only json is supported
	  version:4,        // oData version (currently supported version 4. However most also work with version 3.)
	  strictMode:true,  // strict mode throws exception, non strict mode only logs them
	  start:null,       // a function which is executed on loading
	  ready:null,       // a function which is executed on ready
	  error:null,       // a function which is executed on error
	  headers:[],	    // a array of additional headers e.g.: [{name:'headername',value:'headervalue'}]
	  username:null,    // a basic auth username
	  password:null,    // a basic auth password
	  isAsync:true      //set this to false to make synced (a)jax calls. (dosn't work with basic auth!)
  });
``` 
 


##### Full list of supported functions #####
---------

Currently the following queries are supported:

 `.find(int)`	 	- returns the object with the given id. (Odata: Products*(1)*)
 
 `.top(int)`	 	- returns the top x objects (Odata: Products/?*$top=2*) - Synonym: `.take`
 
 `.skip(int)` 		- returns the objects skipped by the given value (Odata: Products/?*$skip=2*)
 
 `.first()`		- returns the first object which is found (Odata: Products/?*$top=1*)
 
 `.filter(string)`	- adds a filter string (o.js can convered simple JS-Syntax. If you need something complex use the plain Odata $filter syntax: [see the Odata doc](http://www.odata.org/documentation/odata-version-3-0/url-conventions/) for more information) (Odata: Products/?*$filter=Name eq 'Example'*)  - Synonym: `.where`
 
 `.any(string, string)` - applies an any filter to an resource (Odata: Products/?*$filter=Categories/any(x:x/Name eq 'Test')*)
 
 `.search(array, string)` - builds up a search $filter. The first parameter defines the columns to search in the second the searchword (e.g.: `.search(['Name', 'Description'], 'Test')`)
 
 `.orderBy(string)`	- orders the data (Odata: Products/?*$orderBy=Name*)
 
 `.orderByDesc(string)`	- orders the data descading (Odata: Products/?*$orderBy=Name*)
 
 `.count()` 		- only counts the result (Odata: Products/*$count*)
 
 `.inlineCount(string)`	- adds a inlinecount to the result. (Odata: Products/?*$count=true*)
 
 `.batch(string)` 	- adds a second resource to the request (Odata: $batch)
 
 `.expand(string)` 	- expands a related resource (Odata: Products/?*$expand=ProductUnit*)
 
 `.ref(string, string)` - expands a related resource (Odata: Products/*$ref=Categories(1)*)
 
 `.deleteRef(string, string)` - expands a related resource (Odata: Products/*$ref=Categories(1)*)
 
 `.post(object)` 	- Post data to an endpoint
 
 `.patch(object)` 	- PATCH data on an endpoint
 
 `.put(object)` 	- PUT data on an endpoint
 
 `.remove(object)` 	- DELETE data on an endpoint (You must define only one resource: e.g: Products(1) )





