// +++
// o.js  v0.2a
// o.js is a simple oData wrapper for JavaScript.
// Currently supporting the following operations: 
// .find() / .first() / .add() / .take() / .skip() / .filter() / .search() (only oData v4) / .remove() / .orderBy() / .orderByDesc() / .select() // .count()
//
// By Jan Hommes 
// Date: 09.12.2014
// +++
function o(res) {
	base=this;

	//base config object
	base.oConfig  = base.oConfig || {
		endpoint:null,
		json:true, 			//currently only json is supported
		version:3, 			// currently only tested for Version 3, this var is not used at the moment, but can be used for special version futures
		strictMode:true, 	//strict mode throws exception, non strict mode only logs them
		start:null, 		//a function which is executed on loading
		ready:null,			//a function which is executed on ready
		headers:[],			// a array of additional headers [{name:'headername',value:'headervalue'}]
		username:null, 		//the basic auth username
		password:null		//the basic auth password
	};
	
	// +++
	// Configuration of the oData endpoint
	// endpoint: Name of the endpoint e.g. http(s)://MyDomain/ServiceName.svc
	// json: use json, true or false (currently only json supported)
	// version: define the oData Version. (currently only Version 3 and 4 are supported)
	// strictMode: in strict mode exceptios are thrown, else they are logged
	// +++
	base.config=function(config) {
		base.oConfig=merge(base.oConfig,config);
	}
	
	// +++
	// To merge x object together
	// +++
	function merge() {
		var obj = {},
			i = 0,
			il = arguments.length,
			key;
		for (; i < il; i++) {
			for (key in arguments[i]) {
				if (arguments[i].hasOwnProperty(key)) {
					obj[key] = arguments[i][key];
				}
			}
		}
		return obj;
	}
	
	if(typeof res === 'undefined') {
		return(base);
	}
	else {
		return(new oData(res,base.oConfig));
	}
}
	

function oData(res,config){
	base=this;
	
	//base internal variables
	var resource=null; //the main resource string
	var resourceList=[];
	var routeName="";
	var routeCallback=null;
	var isEndpoint=true;
	
	//base external variables 
	base.data=[];
	base.inlinecount=null; 
	base.param=[];
	base.oConfig=config;
	
	// ---------------------+++ PUBLICS +++----------------------------
	
	// +++
	// route is a little extra function to enable rest-like routing on the client side
	// +++
	base.route=function(route,callback) {
		if(typeof callback==='undefined') {
			routeCallback=route;
		}
		else {
			routeName=route;
			routeCallback=callback;
		}
		var tempBase=base;
		
		//TODO: Is there any way to use the build an on hash update function?! Onhaschange can't be bound multiple times. Also a problem: if the hash is called a second time the route is not triggered
		var prevHash = window.location.hash;
		setInterval(function () {
			if (window.location.hash != prevHash) {
				prevHash = window.location.hash;
				//tempBase.triggerRoute(window.location.hash,routeCallback);
				checkRoute(window.location.hash);
			} 
		}, 100);
		
		//trigger on init if the hash is the same like current
		tempBase.triggerRoute(window.location.hash,routeCallback);

		return(base);
	}
		
	// +++
	// triggers a route
	// +++
	base.triggerRoute=function(hash) {
		checkRoute(hash);
		return(base);
	}
	
	// +++
	// returns the object with the given id
	// +++
	base.find=function(getId) {
		resource.path[resource.path.length-1].get=checkIntAndPos(getId,'get()');
		return(base);
	}
	
	// +++
	// returns the top x objects
	// +++
	base.take=function(takeAmount) {
		if(!isQueryThrowEx(['$top'])) {
			addQuery('$top',checkIntAndPos(takeAmount,'take()'));
		}
		return(base);
	}
	
	// +++
	// returns the x objects skipped by the property value
	// +++
	base.skip=function(skipAmount) {
		if(!isQueryThrowEx('$skip')) {
			addQuery('$skip',checkIntAndPos(skipAmount,'skip()'));
		}
		return(base);
	}
	
	// +++
	// returns the first object which is found
	// +++
	base.first=function() {
		if(!isQueryThrowEx(['$top','$first'])) {
			addQuery('$top',1,'$first');
		}
		return(base);
	}
	
	// +++
	// add a filter
	//TODO: parse a JavaScript function to it)
	// +++
	base.filter=function(filterStr) {
		//if(!isQueryThrowEx('$first')) {
			addQuery('$filter',checkEmpty(filterStr));
		//}
		return(base);
	}
	
	// +++
	// returns the first object which is found
	// +++
	base.count=function() {
		removeQuery('$format');
		resource.appending='$count';
		return(base);
	}	
	
	// +++
	// returns the first object which is found
	// +++
	base.inlineCount=function(countOption) {
		countOption=countOption||'allpages';
		if(!isQueryThrowEx('$inlinecount')) {
			addQuery('$inlinecount',countOption);
		}
		return(base);
	}
	
	// +++
	// adds a second resource to the request list to batch it
	// +++
	base.batch=function(res) {
		//add a new resource
		addNewResource(res);
		return(base);
	}	
	
	// +++
	// returns the top x objects
	// +++
	base.expand=function(expandStr) {
		expandResource(expandStr);
		return(base);
	}
	
	
	// +++
	// This function actually queries the oData service with a GET request
	// TODO: maybe add some pseudonyms...
	// +++
	base.get = function(callback) {		
		//start the request
		startRequest(callback,false);

		return(base);
	}
	
	// +++
	// adds a dataset to the current selected resource 
	// if o("Product/ProductGroup").post(...) will post a dataset to the Product resource
	// alternative you can define a new resource by using .post({data},'OtherResource');
	// +++
	base.post=function(data,res) {
		//add a new resource as a copy of the current resource // or use the given resource
		res=res || resource.path[0].resource;

		//add the resource
		addNewResource(res);
		
		//set the method and data
		resource.method='POST';
		resource.data=data;

		return(base);
	}
	
	// +++
	// does a update with the given Data to the current dataset
	// always uses the PATCH http method
	// +++
	base.patch=base.put=function(data,res) {
	
		//add the resource
		if(res)
			addNewResource(res);
		
		//set the method and data
		resource.method='PATCH';
		resource.data=data;

		return(base);
	}	
	
	// +++
	// adds a dataset to the current selected resource 
	// if o("Product/ProductGroup").post(...) will post a dataset to the Product resource
	// +++
	base.save = function(callback) {
		//if base.data is set and the user saves, we copying this resource as a Patch
		//this allows a fast edit mode after a get request
		if(resource.method==='GET' && base.data!==null)  {
			var newResource=deepCopy(resource);
			//set the method and data
			newResource.method='PATCH';
			newResource.data=base.data;
			addNewResource(newResource);
			
			console.log("------------");
			console.log(resourceList);
			console.log(resource);
		}
		
		//start the request
		startRequest(callback,true);

		return(base);
	}
	
	// +++
	// Returns the current query 
	// +++
	base.query = function(overrideRes) {
		return(buildQuery(overrideRes));
	}
	
	// ---------------------+++ INTERNALS +++----------------------------
	
	// +++
	// checks if a route exist and starts the request and adds the parameters
	// +++
	function checkRoute(hash) {
		var tempRoute=(startsWith(hash,'#')?'#':'')+routeName;
		var isAutoParameter=false;
		
		if(endsWith(tempRoute,'?')) {
			tempRoute=tempRoute.substring(0,tempRoute.length-1)
			isAutoParameter=true;
		}	
		
		//check if hash is equal route
		if(!isAutoParameter && tempRoute===hash) { 			
			//start the request
			startRouteRequest(routeCallback);
		}

		//check if we have a auto parameter route (marked with a question mark at the end)
		if(isAutoParameter && startsWith(hash,tempRoute)) {
			//auto parameter
			var routeParameter=hash.substring(tempRoute.length+1).split('\/');
			var m=0;
			base.param=[];
			for(var i=0;i<resource.path.length;i++) {
				if(resource.path[i].get!==null) {
					resource.path[i].get=routeParameter[m];
					m=i;
				}
			}
			
			for(var i=0;i<resource.queryList.length;i++) {
				if(resource.query[resource.queryList[i].name]!==null && resource.queryList[i].name!=='$format') {
					if(typeof routeParameter[m] !== 'undefined' && routeParameter[m]!=="") { 
						resource.queryList[i].value=routeParameter[m];
						base.param.push(routeParameter[m]);
					}
					m++;
				}
			}	

			//start the request if there is a resource defined
			startRouteRequest(routeCallback);			
		}
	}
	
	// +++
	// performs a deep copy on an object with JSON
	// +++
	function deepCopy(obj) {
		if(JSON) {
			return(JSON.parse(JSON.stringify(obj)));
		}
		else {
			throwEx('No JSON Support.');
		}
	}
			
	// +++
	// adds an new resource to the resouce list
	// +++
	function addNewResource(res) {
		//add the predefined resource to the history resource list
		if(resource)
			resourceList.push(resource);	
			
		//build the resource array
		if(typeof res==='string')
			resource=parseUri(res);		
		else
			resource=res;
		
		//add the json config (TODO: Currently only json is supported. Should we add more?)
		if(base.oConfig.json) {
			addQuery('$format','json');
		}
	}
	
	// +++
	// starts a request to the service
	// +++
	function startRequest(callback,isSave) {
		//check if resource is defined
		if(resource===null) {
			throwEx('You must define a resource to perform a get(), post(), put() or delete() function. Define a resource with o("YourODataResource").');
		}
	
		if(resourceList.length===0 && !isSave) {
			startAjaxReq('GET',buildQuery(),null,callback,false);
		}
		//else check if we need to make a $batch request
		else {
			//add the last resource to the history
			resourceList.push(resource);
			
			console.log(resource);
			//check if we only have one request
			if(countMethod(['POST','PATCH','DELETE'])<=1 && isSave) {
				startAjaxReq(resource.method,buildQuery(),stringify(resource.data),callback,false,
					[{name:'Accept',value:'application/json;'},
					{name:'Content-Type',value:'application/json;'},
					{name:'Content-Length',value:stringify(resource.data).length}]
				);
				//because the post/put/delete is done, we remove the resource to assume that it will not be posted again
				removeResource(['POST','PATCH','DELETE']);
			}
			//do a $batch request
			else {			
				//generate a uui for this batch
				var guid=generateUUID();
				//start the request
				startAjaxReq('POST',base.oConfig.endpoint+(endsWith(base.oConfig.endpoint,'/')?'':'/')+'$batch',buildBatchBody(guid,isSave),callback,true,
					//add the necessary headers
					[{name:'Content-Type',value:'multipart/mixed; boundary=batch_'+guid}]
				);
				if(isSave) {
					//because the post/put/delete is done, we remove the resource to assume that it will not be posted again
					removeResource(['POST','PUT','DELETE']);
				}
			}
		}
	}
	
	// +++
	// starts a request triggered by a route
	// +++
	function startRouteRequest(callback) {
		//console.log(resource.path[0].resource);
		if(resource.path[0].resource!=="")
			startRequest(callback);
		else {
			callback(null);
		}
	}
	
	// +++
	// This functions interprets the given resource and returns the base object. It is called by the o-return.
	// +++
	function init(res) {
		//if no resource defined, just return the base object
		if(typeof res==='undefined')
			return(base);
		
		//Check if we have a endpoint and save it to the var
		if((res.toUpperCase().indexOf('HTTP://') > -1 || res.toUpperCase().indexOf('HTTPS://') > -1)) {
			isEndpoint=false;
		} 
		else {
			//check if endpoint is defined
			if(!base.oConfig.endpoint) {
				throwEx('You can not use resource query without defining your oData endpoint. Use o().config({endpoint:youeEndpoint}) to define your oData endpoint.');
			}
		}
		
		//set the route name
		routeName=res;
		
		//add the basic resource
		addNewResource(res);
		
		return(base);
	}
	
	// +++
	// expands a resource by the given resource string (separated by /)
	// +++
	function expandResource(expandStr) {
		if(isQuery('$expand')) {
			resource.queryList[resource.query.$expand]+=(endsWith(resource.queryList[resource.query.$expand],'/')?'':'/')+expandStr;
		}
		else {
			addQuery('$expand',expandStr);
		}
	}
	
	// +++
	// builds the URI for this query
	// +++
	function buildQuery(overrideRes) {
		var res=overrideRes || resource;
		
		//check if there is a resource defined
		if(!res || res.path.length===0)
			throwEx('No resource defined. Define a resource first with o("YourResourcePath").');
		
		//get the full query
		var queryStr='';
		//var isEndpoint=false;
		
		//add the configured endpoint
		if(isEndpoint) {
			queryStr=base.oConfig.endpoint+(endsWith(base.oConfig.endpoint,'/')?'':'/');
		}
		
		//combine the uri
		for(var i=0;i<res.path.length;i++) {
			//check for automatic expand
			if(isEndpoint && i!==0 && res.path[i].get===null) {
				expandResource(res.path[i].resource);
			}
			else {
				queryStr+=res.path[i].resource;
			
				if(res.path[i].get)
					queryStr+='('+res.path[i].get+')';
			
				queryStr+='/';
			}
		}
		
		return(queryStr+resource.appending+getQuery());
	}
	
	// +++
	// internal function to parse the Uri and extrude the resource
	// +++
	function parseUri(resource) {
		var resSplit=resource.split('?');
		var uri=resource;
		var query='';
		var reqObj={
			path:[], //array of all without the base
			appending:'', // e.g. $count or $batch
			query:{}, //the query Array --> use base.queryArray		
			queryList:[],
			method:'GET',
			data:null
		};
		
		//query
		if(resSplit.length===2) {
			uri=resSplit[0];
			query=resSplit[1];
			var querySplit=query.split('&');
			for(var i=0;i<querySplit.length;i++) {
				var pair = querySplit[i].split('=');
				//addQuery(pair[0],querySplit[i]);
				reqObj.query[pair[0]]=querySplit[i];
			}
		}
		
		//uri
		var uriSplit=uri.split('/');
		for(var i=0; i<uriSplit.length; i++) {
			if(startsWith(uriSplit[i],'$')) {
				reqObj.appending=uriSplit[i];
			}
			else {
				var index=uriSplit[i].split('(');
				if(index.length===1) {
					reqObj.path.push({'resource':uriSplit[i], 'get':null});
				}
				else {
					reqObj.path.push({'resource':index[0], 'get':index[1].substring(0,index[1].length-1)});
				}
			}
		}
		
		return(reqObj);
	}
		
	// +++
	// internal function to add a query parameter
	// +++
	function addQuery(queryName,queryValue,queryPseudonym) {
		resource.queryList.push({name:queryName,value:queryValue});
		resource.query[queryPseudonym || queryName]=resource.queryList.length-1;
	}
	
	// +++
	// internal function to remove a query parameter
	// +++
	function removeQuery(queryName) {
		resource.queryList.splice(resource.query[queryName],1);
		resource.query[queryName]=null;
	}
	
	// +++
	// internal function which builds the url get parameter
	// +++
	function getQuery() {
		var tempStr='';
		for(queryName in resource.query) {
			if(resource.query.hasOwnProperty(queryName) && resource.query[queryName]!=null) {
				tempStr+='&'+resource.queryList[resource.query[queryName]].name+'='+resource.queryList[resource.query[queryName]].value;
			}
		}
		if(tempStr.length>0)
			return('?'+tempStr.substring(1));
		return("");
	}
	
	// +++
	// internal function to check if a query exist. Otherwith throwEx a exception
	// queries: Could be an array or an string
	// returns true if 
	// +++
	function isQueryThrowEx(queries) {
		if(isQuery(queries)) {
			var queryName=queries;
			if(isArray(queryName)) {
				queryName=queryName.join(",");
			}
			throwEx('There is already a depending query. You can not use them together/twice: '+queryName)
			return(true);
		}
		return(false);
	}
	
	// +++
	// internal function to check if a query exist
	// queries:  Could be an array or an string
	// returns true if the query is already in the query array
	// +++
	function isQuery(queries) {
		var queryNames=(isArray(queries)?queries:[queries]);
		var isIn=false;
		for(var i=0;i<queryNames.length;i++) {
			if(resource.query.hasOwnProperty(queryNames[i])) {
				isIn=true;
			}
		}
		return(isIn);
	}

	// +++
	// returns a  RFC4122 version 4 compliant  UUID
	// http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
	// +++
	function generateUUID(){
		var d = new Date().getTime();
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (d + Math.random()*16)%16 | 0;
			d = Math.floor(d/16);
			return (c=='x' ? r : (r&0x7|0x8)).toString(16);
		});
		return uuid;
	}
	
	// +++
	// Checks if a value is positiv and a integer
	// +++
	function checkIntAndPos(intVal,throwName) {
		var intParse=tryParseInt(intVal,null);
		if(intParse!==null && intParse >= 0)
			return intParse;
		else
			throwEx(throwName+': Parameter must be an integer value and positive.');	
	}
	
	// +++
	// Checks if a value is positiv and a integer
	// +++
	function checkEmpty(str,throwName) {
		if(typeof str !== 'undefined' && str!==null && str.length > 0)
			return(str);
		else
			throwEx(throwName+': Parameter must be set.');	
	}
	
	// +++
	// Helper function for trying to parse from this page: http://pietschsoft.com/post/2008/01/14/JavaScript-intTryParse-Equivalent
	// +++
	function tryParseInt(str,defaultValue) {
		if(typeof str === 'number')
			return(str);
		 var retValue = defaultValue;
		 if(str) {
			 if(str.length > 0) {
				 if (!isNaN(str)) {
					 retValue = parseInt(str);
				 }
			 }
		 }
		 return(retValue);
	}
	
	// +++
	// helper to count the current length of all methods in the resourceList
	// +++
	function countMethod(methodNames) {
		var count=0;
		for(var i=0;i<resourceList.length;i++) {
			if(methodNames.indexOf(resourceList[i].method) > -1) 
				count++;
		}
		return(count);
	}
	
	// +++
	// removes resources out of the resourceList by it's method name
	// +++
	function removeResource(methodNames) {
		//TODO:  Add a future detection here for .filter() can help to increase performance. This is a overall function to work in all common browsers. A better way is to use .filter(), but it is not supported by all browsers.
		var spliceArr=[];
		//search for them
		for(var i=0;i<resourceList.length;i++) {
			if(methodNames.indexOf(resourceList[i].method) > -1) 
				spliceArr.push(i);
		}
		//and after that, remove them by reverse looping
		for(var i=spliceArr.length-1;i>=0;i--) {
			resourceList.splice(spliceArr[i],1);
		}
		//pack the last resource in the current resource
		if(resourceList[0])
			resource=resourceList[0];
	}
	
	
	// +++
	// helper that stringify data. Checks for JSON support
	// +++
	function stringify(data) {
		if(JSON)
			return(JSON.stringify(data));
		else {
			//Throw exception
			//TODO: Is there any other solution for non JSON? caniuse say there is a 96.58% coverage for JSON parsing...
			throwEx('No JSON support.');
			return(data);				
		}
	}
	
	// +++
	// Helper function to check if a given object is an array
	// +++
	function isArray(obj) {
		//fall back for older browsers
		if (typeof Array.isArray === 'undefined') {
			return(Object.toString.call(obj) === '[object Array]');
		}
		//the checking
		return(Array.isArray(obj));
	}
	
	// +++
	// helper function to check if a string ends with something
	// +++
	function endsWith(str, suffix) {
		return (str?str.indexOf(suffix, str.length - suffix.length) !== -1:false);
	}
		
	// +++
	// helper function to check if a string starts with something
	// +++
	function startsWith(s,str) {
		return(s.indexOf(str) === 0);
	}

	// +++
	// Throws an exception
	// +++
	function throwEx(msg) {
		function oException(msg) {
			this.message = msg;
			this.name='o.js exception';
		}
		oException.prototype = new Error();
		if(base.oConfig.strictMode===true)
			throw new oException(msg);
		else 
			console.log('o.js exception: '+msg);
	}
	
	// +++
	// builds a oData $batch http body
	// +++
	function buildBatchBody(batchGuid,isSave) {
		var body='';
		var changsetGuid=generateUUID();
		var isChangeset=false;
		if(isSave) {
			body+='--batch_'+batchGuid+'\n';
			body+='Content-Type: multipart/mixed; boundary=changeset_'+changsetGuid+'\n\n';
		}
		
		//loop over the resourceList
		for(var i=0;i<resourceList.length;i++) {
			var res=resourceList[i];
			//set the current resource to the resouceList-Element resource to enable addQuery and expand functions
			resource=res;
			//only do get if not saving is choosen
			if(res.method==='GET' && !isSave) {
				body+='--batch_'+batchGuid+'\n';
				body+='Content-Type: application/http\n';
				body+='Content-Transfer-Encoding: binary\n\n';
				body+=res.method+' '+buildQuery(res)+' HTTP/1.1\n';
				body+='Host: '+base.oConfig.endpoint+'\n\n';
			}
			//do POST if the base.save() function was called
			//TODO:  || res.method==='PUT' || res.method==='DELETE'
			else if((res.method==='POST') && isSave) {
				var stringData=stringify(res.data);
				body+='--changeset_'+changsetGuid+'\n';
				body+='Content-Type: application/http\n';
				body+='Content-Transfer-Encoding: binary\n\n';
				body+=res.method+' '+buildQuery(res)+' HTTP/1.1\n';
				body+='Host: '+base.oConfig.endpoint+'\n';
				body+='Content-Type: application/json\n';
				body+='Content-Length:'+stringData.length+'\n\n';
				body+=stringify(resource.data)+'\n\n\n';
				isChangeset=true;
			}
		}
		if(isChangeset)
			body+='--changeset_'+changsetGuid+'--\n\n';
		body+='--batch_'+batchGuid+'--';

		return(body);
	}
	
	// +++
	// start a ajax request. data should be null if nothing to send
	// +++
	function startAjaxReq(method,query,data,callback,isBatch,headers) {
		if(base.oConfig.start) 
			base.oConfig.start();
		var ajaxRequest;  // The variable that makes Ajax possible!
	
		//AJAX compatibility check
		try{
			// Opera 8.0+, Firefox, Safari
			ajaxRequest = new XMLHttpRequest();
		} catch (e){
			// Internet Explorer Browsers
			try{
				ajaxRequest = new ActiveXObject('Msxml2.XMLHTTP');
			} catch (e) {
				try{
					ajaxRequest = new ActiveXObject('Microsoft.XMLHTTP');
				} catch (e){
					// Something went wrong
					throwEx('Your browser does not support AJAX.');
					return false;
				}
			}
		}
		
		//is a callback defined?
		if(!callback) 
			callback=function(data) {};
			
		var tempBase=base;
		// The on ready state event handler
		ajaxRequest.onreadystatechange = function(){
			//check the http status
			if(ajaxRequest.readyState===4){
				if(ajaxRequest.status>=200 && ajaxRequest.status<300) {
					
					//handling no-content returns
					if(ajaxRequest.status===204) {
						callback.call(tempBase,tempBase.data);
					}
					//dealing with normal response
					else if(!isBatch) {
						parseResponse(ajaxRequest.responseText,tempBase);
						callback.call(tempBase,tempBase.data);
					}
					//else, handling a $batch response
					else {
											
						//split every line and look for startsWith({)
						var batchLines=ajaxRequest.responseText.split('\n');
						var resCount=0;
						var dataArray=[];
						for(var i=0;i<batchLines.length;i++) {
							if(startsWith(batchLines[i],'{')) {
								parseResponse(batchLines[i],tempBase);
								dataArray.push(tempBase.data);
								resCount++;
							}
						}
						tempBase.data=dataArray;
						
						callback.call(tempBase,dataArray);
					}
					
					//call the basic ready method
					if(tempBase.oConfig.ready) 
						tempBase.oConfig.ready();
				}
				else {
					var errResponse=ajaxRequest.responseText;
					if(JSON)
						errResponse=JSON.parse(ajaxRequest.responseText);
						
					if(errResponse['odata.error']) {
						var errorMsg=errResponse['odata.error'].message.value +' | HTTP Status: '+ajaxRequest.status+' | oData Code: '+errResponse['odata.error'].code;
						throwEx(errorMsg);
					}
					else
						throwEx('Request failed with HTTP status '+ajaxRequest.status+' on ready state '+ajaxRequest.readyState);
					
				}
			}
		}
		
		// start the ajax request
		ajaxRequest.open(method, query, true, base.oConfig.username, base.oConfig.password);
		if(headers) {
			//normal headers
			for(var i=0;i<headers.length;i++) {
				ajaxRequest.setRequestHeader(headers[i].name,headers[i].value);
			}
			//additional headers 
			//TODO: merge both normal and additional headers?!
			for(var i=0;i<base.oConfig.headers.length;i++) {
				ajaxRequest.setRequestHeader(base.oConfig.headers[i].name,headers[i].value);
			}
		}
		ajaxRequest.send(data); 
	}
	
	// +++
	// this function parses a normal response to a JSON response
	// +++
	function parseResponse(response,tempBase) {
		var count = tryParseInt(response, null); 
		if(count) {
			//base.data=count;
			return(count);
		}
		else {
			if(JSON) {
				var data=JSON.parse(response);
				if(data.hasOwnProperty('value')) {
					if(isQuery(['$first']) && data.value.length && data.value.length<=1) {
						tempBase.data=data.value[0];
					}
					else {
						tempBase.data=data.value;
					}
					if(data.hasOwnProperty('odata.count')) {
						tempBase.inlinecount=data['odata.count'];
					}
					//return(data.value);
				}
				else {
					tempBase.data=data;
				}
			}
			else {
				tempBase.data=response;
			}
		}
		
	}
	
	return(init(res));
}