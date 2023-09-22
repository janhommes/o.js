// global-mocks.js
const fetchPolyfill = require('whatwg-fetch');

global.fetch = fetchPolyfill.fetch;
global.Request = fetchPolyfill.Request;
global.Headers = fetchPolyfill.Headers;
global.Response = fetchPolyfill.Response;

// let's simulate browser for tests.
window = {};