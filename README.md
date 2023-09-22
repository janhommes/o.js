# o.js

o.js is a isomorphic Odata Javascript library to simplify the request of data. The main goal is to build a **standalone, lightweight and easy** to understand Odata lib.

## Install

```
npm install odata
```

> Or you can use `npm install o.js` which will resolve the same package

## Usage in browser

### In a module or Typescript
```javascript
import { o } from 'odata';

(async () => {
  // chaining
  const data1 = await o('http://my.url')
    .get('resource')
    .query({ $top: 3 });

  // handler
  const oHandler = o('http://my.url');
  const data2 = await oHandler
    .get('resource')
    .query({ $top: 3 });
})();
```

### Or in a script tag
```html
<script src="node_modules/odata/dist/umd/o.js">
```

It's then placed on the `window.odata`: 
```javascript
window.odata
  .o('http://my.url')
  .get('resource')
  .query({ $top: 3 })
  .then(function (data) {});
```


## Usage in node
```javascript
const o = require('odata').o;

// promise example
o('http://my.url')
  .get('resource')
  .then((data) => console.log(data));
```

## CRUD examples
> The following examples using async/await but for simplicity we removed the async deceleration. To make that work this example must be wrapped in an async function or use promise.

### **C**reate (POST):
```javascript
const data = {
  FirstName: "Bar",
  LastName: "Foo",
  UserName: "foobar",
}

const response = await o('http://my.url')
  .post('User', data)
  .query(); 

console.log(response); // E.g. the user 
```

### **R**ead (GET):
```javascript
const response = await o('http://my.url')
  .get('User')
  .query({$filter: `UserName eq 'foobar'`}); 

console.log(response); // If one -> the exact user, otherwise an array of users
```

### **U**pdate (Patch):
```javascript
const data = {
  FirstName: 'John'
}

const response = await o('http://my.url')
  .patch(`User('foobar')`, data)
  .query(); 

console.log(response); // The result of the patch, e.g. the status code
```

### **D**elete:
```javascript
const response = await o('http://my.url')
  .delete(`User('foobar')`)
  .query(); 

console.log(response); // The status code
```


## Options
You can pass as a second option into the `o` constructor options. The signature is:
```typescript
function o(rootUrl: string | URL, config?: OdataConfig | any)
```

The `rootUrl` can be used to directly query a resource:
```javascript
o('http://my.url/some-resource').query().then();
``` 

But mostly better is to create a handler with a `rootUrl` in the configuration. Then you are able to use the handler multiple times:

```javascript
const oHandler = o('', { rootUrl: 'http://my.url' });
// requesting http://my.url/some-resource
oHandler.get('some-resource').query().then();
``` 

When creating a oHandler with a configured `rootUrl` in config and as first property, the two are getting merged:

```javascript
const oHandler = o('v1', { rootUrl: 'http://my.url' });
// requesting http://my.url/v1/some-resource
oHandler.get('some-resource').query().then();
``` 

In a browser you can also use only a resource and the `rootUrl` tries pointing to the current browser:
```javascript
const oHandler = o('v1');
// requesting http://current-url/v1/some-resource
oHandler.get('some-resource').query().then();
``` 

Basic configuration is based on [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request) and additional [odata config](src/OdataConfig.ts). By default o.js sets the following values:
```
{
    batch: {
      boundaryPrefix: "batch_",
      changsetBoundaryPrefix: "changset_",
      endpoint: "$batch",
      headers: new Headers({
        "Content-Type": "multipart/mixed",
      }),
      useChangset: false,
      useRelativeURLs: false,
    },
    credentials: "omit",
    fragment: "value",
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    mode: "cors",
    redirect: "follow",
    referrer: "client",
    onStart: () => null,
    onFinish: () => null,
    onError: () => null,
  }
```

## Query
> Since version 2.0.0 we support the use of [odata-query](https://www.npmjs.com/package/odata-query). You can simply add a
`buildQuery` property to any `query()` and `fetch()` request (if only used as filter):

```typescript
import buildQuery from 'odata-query'

const filter = {
  not: {
    and:[
      { SomeProp: 1 }, 
      { AnotherProp: 2 }
    ]
  }
};

// using only filter in query() or fetch():
oHandler.get('People')
  .query(buildQuery({ filter }))
  .then((filteredPeople) => {});


// using more features of odata-query in get:
oHandler.get('People' + buildQuery({ filter, key: 1, top: 10 }))
  .query()
  .then((filteredPeople) => {});
``

The following query options are supported by `query()`, `fetch()` and `batch()` by simply adding them as object:

```typescript
$filter?: string;
$orderby?: string;
$expand?: string;
$select?: string;

$skip?: number;
$top?: number;
$count?: boolean;
$search?: string;
$format?: string;
$compute?: string;
$index?: number;
[key: string]: any; // allows to add anything that is missing
```
> The $count flag will add an inline count property as metadata to a query response. In order to just retrieve the count, you'll have query the $count resource, such as

```typescript
oHandler.get('People/$count').query().then((count) => {})
```
   
The queries are always attached as the [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).

## Just fetching
The lib tries to parse the data on each request. Sometimes that is not wanted (e.g. when you need a status-code or need to access odata meta data), therefor you can use the `.fetch` method that acts like the default [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

## Batching
By default o.js chains request in sequent. You can batch them together by using `batch()`. They are then send to the defined batch endpoint in the config. Changsets are at the moment in a experimental phase and needs to be enabled in the config.

## Polyfills
If you like polyfills to support IE11 please include the `dist/umd/o.polyfill.js` file. Version < 2 adds polyfills for node automatically. Version 2.0.0 and bigger only supports node 18 and higher where fetch and URL is included.
