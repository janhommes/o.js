# o.js

_o.js beta v0.3.6_

o.js is a client side Odata Javascript library to simplify the request of data. The main goal is to build a **standalone, lightweight and easy** to understand Odata lib.

## Install

Download the _o.js_ or _o.min.js_ file or install it via _bower_:

```
bower install o.js
```

Then you can add the script into your file (`<script src="bower_components/o.js/o.js"></script>`), or load it with your favorite AMD loader:

```javascript
require.config({paths: {'odata': 'bower_components/o.js/o'}});
define(['odata'], function(o) {...});
```

You can use o.js in node.js as well, by installing the `odata` package:

```
npm install odata
```

```javascript
var o = require('odata');
```

## Samples

For all samples we are using the test odata service from [Odata.org](http://www.odata.org). You can find the metadata of this service [here](http://services.odata.org/V4/OData/OData.svc).

### Simple Odata query with o.js

```javascript
o('http://services.odata.org/V4/OData/OData.svc/Products').get(function(data) {
  console.log(data); //returns an array of Product data
});
```

o.js uses a jQuery like syntax to determine which resource you want to access. You can define any Odata service url (or any json web service) in the o-function: `o('<your odata service resource>')`. This only holds a handler to this resource and doesn't start the ajax call. If you want to get the resource, you need to call `.get()`. Get accepts a function callback which contains the data as the first parameter.

### Methods

By adding some chained functions to the o-handler you can add query options:

```javascript
o('http://services.odata.org/V4/OData/OData.svc/Products').take(5).skip(2).get(function(data) {
  console.log(data); //An array of 5 products skipped by 2
});
```

### Routing

You can use hash routes to map your Odata service endpoint to your website:

```javascript
o('http://services.odata.org/V4/OData/OData.svc/Products').find(':0').route('Product/Detail/:0/:1',function(data) {
  console.log('Route Product/Detail/'+this.param[0]+'/'+this.param[1]+' triggered. Result:');
  console.log(data);
});
```

Instead of manual getting your data with the `get()` function, this routing function always returns the data when somebody navigates to an URL with the hash value `index.html#Product/Detail/1/Some more parameter`. The `find()` method automatically maps the right parameter (in this example _1_). [See this](https://github.com/janhommes/o.js/tree/master/example) demonstration for more examples.

### Get data (details)

If you want to get data you need to call the `get()` function. This functions returns an async callback function which holds an array as it's parameter. If you use `first()` or the `find()` method it only returns the data because an array is not needed. You can also save your o-function to call it later:

```javascript
var oHandler = o('http://services.odata.org/V4/OData/OData.svc/Products');
//do something
oHandler.find(1);
// do some more

//get the data
oHandler.get(function(data) {
  console.log(data);
  //or the saved var also contains the data:
  console.log(oHandler.data);
});
```

If you need to get several data you can use promise. Currently o.js only supports [q.js](https://github.com/kriskowal/q). The following example show how you can get the data of two different resources:

```javascript
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

```javascript
o('http://services.odata.org/V4/OData/OData.svc/Products(2)').get().then(function(oHandler) {
  console.log(oHandler.data);
}).fail(function(ex) {
  console.log(ex);
});
```

## Add and change data

To add and change data you can use the http verb in combination with the `save()` method:

### Post:

You can use the `post()` function in combination with the `save()` method to add data:

```javascript
o('http://services.odata.org/V4/OData/OData.svc/Products').post({Name:'Example 1',Description:'a'}).post({Name:'Example 2',Description:'b'}).save(function(data) {
  console.log("Two Products added");
});
```

### Patch/Put:

Changing (PATCH or PUT) data is nearly the same:

```javascript
o('http://services.odata.org/V4/OData/OData.svc/Products(1)').patch({Name:'NewName'}).save(function(data) {
  console.log("Product Name changed");
});
```

### Delete:

To remove (DELETE) data you need to call `remove()`:

```javascript
o('http://services.odata.org/V4/OData/OData.svc/Products(1)').remove().save(function(data) {
  console.log("Product deleted");
});
```

### Reference:

To add an reference to an other resource use `ref` (to remove it simply use `removeRef` the same way):

```javascript
o('http://services.odata.org/V4/OData/OData.svc/Products(1)').ref('Categories', 2).save(function(data) {
  console.log("Product(1) associated with Categories(2)");
});
```

You can also combine a single data request (`first()` or `find()`) with the save method and chain it:

```javascript
o('http://services.odata.org/V4/OData/OData.svc/Products').find(2).get().then(function(oHandler) {
  oHandler.data.Name="NewName";
  return(o.save());
}).then(function(oHandler) {
  console.log(oHandler.data.Name); //NewName
}).fail(function(ex) {
  console.log("error");
});
```

### Endpoint configuration

You can configure a endpoint with the `o().config()` function. This configuration is persistent over all off your o.js calls. Example:

```javascript
// set an endpoint
o().config({
  endpoint:'http://services.odata.org/V4/OData/OData.svc'
});

// after you have set an endpoint, you can shorten your queries:
o('Products').get(function(data) {
  //same result like the first example on this page
});
```

However, if you have set an endpoint you can still do a full endpoint request for example to another domain `o('http://odata.example.de/Customer')`. With this function you can also do some more basic configs:

```javascript
//basic config
o().config({
    endpoint: null,   // The default endpoint to use.
    format: 'json', 	// The media format. Default is JSON.
    autoFormat: true,   // Will always append a $format=json to each query if set to true.
    version: 4, 		// currently only tested for Version 4. Most will work in version 3 as well.
    strictMode: true, 	// strict mode throws exception, non strict mode only logs them
    start: null, 		// a function which is executed on loading
    ready: null,		// a function which is executed on ready
    error: null,		// a function which is executed on error
    headers: [],		// an array of additional headers [{name:'headername',value:'headervalue'}]
    username: null, 	// the basic auth username
    password: null,		// the basic auth password
    isAsync: true		// set this to false to enable sync requests. Only usable without basic auth
	isCors: true,       // set this to false to disable CORS
    isHashRoute: true,  // set this var to false to disable automatic #-hash setting on routes
    appending: ''		// set this value to append something to a any request. eg.: [{name:'apikey', value:'xyz'}]
});
```

### Full list of supported functions

Currently the following queries are supported:

`.find(int)` - returns the object with the given id. (Odata: Products_(1)_)

`.top(int)` - returns the top x objects (Odata: Products/?_$top=2_) - Synonym: `.take`

`.skip(int)` - returns the objects skipped by the given value (Odata: Products/?_$skip=2_)

`.first()` - returns the first object which is found (Odata: Products/?_$top=1_)

`.filter(string)` - adds a filter string (o.js can converted simple JS-Syntax. If you need something complex use the plain Odata $filter syntax: [see the Odata doc](http://www.odata.org/documentation/odata-version-3-0/url-conventions/) for more information) (Odata: Products/?_$filter=Name eq 'Example'_) - Synonym: `.where`

`.any(string, string)` - applies an any filter to an resource (Odata: Products/?_$filter=Categories/any(x:x/Name eq 'Test')_)

`.search(array, string)` - builds up a search $filter. The first parameter defines the columns to search in the second the search word (e.g.: `.search(['Name', 'Description'], 'Test')`)

`.orderBy(string, direction)` - orders the data (Odata: Products/?_$orderBy=Name_)

`.orderByDesc(string)` - orders the data descending (Odata: Products/?_$orderBy=Name_)

`.count()` - only counts the result (Odata: Products/_$count_)

`.inlineCount(string)` - adds a inlinecount to the result. (Odata: Products/?_$count=true_)

`.batch(string)` - adds a second resource to the request (Odata: $batch)

`.expand(string)` - expands a related resource (Odata: Products/?_$expand=ProductUnit_)

`.select(string)` - selects only certain properties (Odata: Products/?_$select=Name)

`.ref(string, string)` - expands a related resource (Odata: Products/_$ref=Categories(1)_)

`.deleteRef(string, string)` - expands a related resource (Odata: Products/_$ref=Categories(1)_)

`.post(object)` - Post data to an endpoint

`.patch(object)` - PATCH data on an endpoint

`.put(object)` - PUT data on an endpoint

`.remove(object)` - DELETE data on an endpoint (You must define only one resource: e.g: Products(1) )
