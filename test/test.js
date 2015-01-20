// +++
// o.js tests
//
// o.js unit test with quint.js
// http://qunitjs.com/
//
// By Jan Hommes 
// Date: 14.01.2015
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

//helper function to configure endpoint
function configureEndpoint() {
	if(!o().isEndpoint()) {
		o().config({
			endpoint:'https://secure.pointsale.de/Service.svc',
			//endpoint:'http://localhost:1000/Api.svc',
			version:3,
			strictMode:true,
			/*username:'psapi',
			password:'demo'*/
			//headers:[{name:'X-Custom-Headers', value: 'value'}]
		});
	}
}

// ----------------------------------------------- Tests ----------------------------------------------------

QUnit.test('No resource or endpoint throw error', function(assert) {
	 assert.throws(
		function() {
			o('');
		},
		'Passed no resource!'
	);
	assert.throws(
		function() {
			o('Product');
		},
		'Passed no endpoint!'
	);
});

QUnit.test('GET Product - no endpoint - no query', function(assert) {
	var done = assert.async();
	o('https://secure.pointsale.de/Service.svc/Product').get(function(data) {
		assert.ok(data.length >= 0, printResult(this,data));
		done();
	});
});

QUnit.test('GET Product - no endpoint - query: $top=1', function(assert) {
	var done = assert.async();
	o('https://secure.pointsale.de/Service.svc/Product?$top=1').get(function(data) {
		assert.ok(data.length === 1, printResult(this,data));
		done();
	});
});

QUnit.test('CONFIG PS - endpoint', function(assert) {
	configureEndpoint();
	assert.ok(o().isEndpoint(), 'Passed! Endpoint is: '+o('').query());
	createTestData();
});

// ------------------------------------------------- Endpoint tests -------------------------------------------------------------

//create test data with a test
var testProduct=null;
function createTestData() {
	QUnit.test('POST Product as the test product - endpoint - no query', function(assert) {
		var done = assert.async();
		o('Product').post({Name:'Yeah',Price:'99.00'}).save(function(o) {
			assert.ok(o.Name=='Yeah', printResult(this,o));
			done();
			testProduct=o;
			console.log(testProduct);
			startEndpointTests();
		});
	});
}
	
// Start this test if the endpoint is configured
function startEndpointTests() {
	QUnit.test('GET Product - endpoint - no query', function(assert) {
		var done = assert.async();
		o('Product').get(function(data) {
			assert.ok(data.length >= 0, printResult(this,data));
			done();
		});
	});

	QUnit.test('GET Product - endpoint - .top(1)', function(assert) {
		var done = assert.async();
		o('Product').top(1).get(function(data) {
			assert.ok(data.length >= 0, printResult(this,data));
			done();
		});
	});

	QUnit.test('GET Product - no endpoint - query: $filter=Price lt 100 and $top=1', function(assert) {
		var done = assert.async();
		o('https://secure.pointsale.de/Service.svc/Product?$filter=Price lt 100&$top=1').get(function(data) {
			assert.ok(data.length === 1, printResult(this,data));
			done();
		});
	});

	QUnit.test('GET Product('+testProduct.id+') - no endpoint - query: $filter=Price lt 100', function(assert) {
		var done = assert.async();
		o('https://secure.pointsale.de/Service.svc/Product('+testProduct.id+')?$filter=Price lt 100').get(function(data) {
			assert.ok(data.id === testProduct.id, printResult(this,data));
			done();
		});
	});

	QUnit.test('GET Product('+testProduct.id+') - endpoint - query: $filter=Price lt 100', function(assert) {
		var done = assert.async();
		o('Product('+testProduct.id+')?$filter=Price lt 100').get(function(data) {
			assert.ok(data.id === testProduct.id, printResult(this,data));
			done();
		});
	});

	QUnit.test('GET Product - endpoint - query: .take(5) and .skip(2)', function(assert) {
		var done = assert.async();
		o('Product').take(5).skip(2).get(function(data) {
			assert.ok(data.length >= 0, printResult(this,data));
			done();
		});
	});

	QUnit.test('GET Product - endpoint - query: .take(5) and .expand("ProductGroup")', function(assert) {
		var done = assert.async();
		o('Product').take(5).expand('ProductGroup').get(function(data) {
			assert.ok(data.length  >= 0 && (data[0] && data[0].ProductGroup), printResult(this,data));
			done();
		});
	});

	QUnit.test('GET Product('+testProduct.id+') with q.js promise - endpoint - no query', function(assert) {
		var done = assert.async();
		o('Product('+testProduct.id+')').get().then(function(o) {
			assert.ok(o.data.id === testProduct.id, printResult(o,o.data));
			done();
		});
	});

	QUnit.test('GET Product('+testProduct.id+') and  Group with q.js promise all - endpoint - no query', function(assert) {
		var done = assert.async();
		Q.all([
			o('Product('+testProduct.id+')').get(),
			o('Product?$filter=Price lt 100')
		]).then(function(o) {
			assert.ok(o[0].data.id==testProduct.id, printResult(o[0],o[0].data));
			assert.ok(o[1].data.length >=0, printResult(o[1],o[1].data));
			done();
		});
	});

	QUnit.test('GET Product('+testProduct.id+') and PATCH Product(2), change and save() it with q.js promise - endpoint - no query', function(assert) {
		var done1 = assert.async();
		var done2 = assert.async();	
		var name='Test_'+Math.random();
		
		o('Product('+testProduct.id+')').get().then(function(o) {
			o.data.Name=name;
			assert.ok(o.data.id===testProduct.id, printResult(o,o.data));
			done1();
			return(o.save());
		}).then(function(o) {
			assert.ok(o.data.id === testProduct.id && o.data.Name===name, printResult(o,o.data));
			done2();
		});
		/*.fail(function(err) {
			console.log(err);
		});*/
	});
	
	QUnit.test('GET Product('+testProduct.id+') and PATCH Product(2), change and save() it with q.js promise but provoke error - endpoint - no query', function(assert) {
		var done1 = assert.async();
		var done2 = assert.async();	
		var name='Test_'+Math.random();
		
		o('Product('+testProduct.id+')').get().then(function(o) {
			o.data.Name=name;
			//this is not allowed, must be:
			//o.data.Price='12.12';
			o.data.Price=12.12;
			assert.ok(o.data.id===testProduct.id, printResult(o,o.data));
			done1();
			return(o.save());
		}).then(function(o) {
			//not reachable because of error
		}).fail(function(err) {
			assert.ok(err, 'Passed! Error as expected.');
			done2();
		});
	});

	QUnit.test('PATCH Product('+testProduct.id+') - endpoint - no query', function(assert) {
		var done = assert.async();
		var name='Test_'+Math.random();
		o('Product('+testProduct.id+')').patch({Name:name}).save(function(data) {
			assert.ok(data.length===0, printResult(this,data));
			done();
		});
	});
	
	QUnit.test('PATCH Product and provoke error because of bulk updates are not supported - endpoint - no query', function(assert) {
		var done = assert.async();
		var name='Test_'+Math.random();
		try {
			o('Product').patch({Name:name}).save(function(data) {
								
			});
		}
		catch(ex) {
			assert.ok(true, ex);
			done();
		}
	});
	
	
	//DELETES the test data, move it to the end of this file!
	QUnit.test('DELETE Product('+testProduct.id+') - endpoint - no query', function(assert) {
		var done = assert.async();
		var name='Test_'+Math.random();
		o('Product('+testProduct.id+')').delete().save(function(data) {
			assert.ok(data.length===0, printResult(this,data));
			done();			
		});
	});
}





//------------------------------------------------------ old test ----------------------------------------------------


// runs in an exception because of strict mode
/*o('Product');
o('');

//this should work
o('https://secure.pointsale.de/Service.svc/Product?$top=1&$skip=2').get(function(data) {
	console.log('GET test without endpoint:');
	console.log(data.length);
});

//this should work
o('https://secure.pointsale.de/Service.svc/Product').take(1).get(function(data) {
	console.log('GET test without endpoint and take:');
	console.log(data.length);
});


//o configuration
// strict mode is disabled to display errors in the console log instead of throwing them as an exception


o().config({
	endpoint:'https://secure.pointsale.de/Service.svc',
	version:3,
	strictMode:true,
	//username:'demo@pointsale.de',
	//password:'demo'
	//headers:[{name:'X-Custom-Headers', value: 'value'}]
});

*/

/*o('Tenant').first().route('',function(data) {
	console.log(data);
});
*/
/*
o('Product').take(20).route(['Change?','Foo','Bar'],function(data) {
	console.log(data);
});*/

/*o('Product').take(5).get(function(data) {
	console.log(data);
});*/

/*o('Product').expand('ProductGroup').take(0).route('Change?',function(data) {
	this.data.Identifier=Math.random()+'';
	console.log(this.data.Identifier);
	this.save(function(data) {
		//console.log(data);
	});
	console.log(data);
});*/

//prommise test

/*o('Product(1)').get().then(function(o) {
	console.log(o.data);
	o.data.Name='YZX';
	console.log('Save added');
	o.save();
}).then(function() {
	console.log('DRIN 2 :)');
}).fail(function(err) {
	console.log(err);
});*/

/*
var test=null
Q.all([
	o('Product(1)').get(test),
	o('Group').get()
]).then(function(o) {
	//console.log(o[0].data);
	//console.log(o[1].data);
	
	console.log(test);
});*/



/*o('Product').find(2).filter('Name eq 'Bla'').get(function(data) {
		console.log(data);
});*/
/*
o('Product').post({Name:'Testprodukt 1',Description:'AAA'}).post({Name:'XXXX2',Description:'AAA'}).save(function(data) {
	console.log(data);
	console.log(this);
});
*/

/*o('Product').filter('Name eq 'XXXX'').get(function(data) {
	console.log(data.length);
});*/

//route test (alternative route)
/*o('Product').route('AddProduct',function(o) {
	this.post({Name:'XXXX',Description:'AAA',Price:'11.11'});
	this.save(function(o) {
		console.log('SAVED :)');
	});
});

o('Product(3)').route('ChangeProduct',function(o) {
	console.log(this.query());
	this.data.Description='11.11';
	this.save(function(o) {
		console.log('SAVED :)');
	});
});

//route test (alternative route)
o('Product').filter('Name eq 'XXXX'').route('GetProducts',function(o) {
	console.log(this);
	console.log(o);
	console.log(o.data);
});*/
/*
//route test with trigger
o('Group').route(function(data) {
	console.log(data);
}).triggerRoute('Group');
*/

//test filter
/*o('Group').take(10).skip(10).filter('Name eq 'Testgruppe'').get(function(data) {
	console.log(data);
});*/

//test query return
//console.log(o('Group').filter('Name eq 'Testgruppe'').query());


//auto expand in combination with batch 
/*o('Shop').find(4).get(function(data) {
	console.log(this);
});*/
/*
//test .first()
o('Group').first().get(function(data) {
	console.log(data);
});

//test .count()

o('ProductGroup').count().get(function(data) {
	console.log(data);
});

//test batch
o('Product').batch('Group').get(function(data) {
	console.log(data);
});
*/


/*
//test resource identifier
o('meertelSP?$filter=(SMSMT_WinLogon eq 'hommejan')').get(function(data) {
	console.log(data);
});

//test resource identifier
o('Feedback?$filter=(userid eq 'hommejan')').get(function(data) {
	console.log(data);
});
*/

/*
//test .take()
o('Feedback').find(1002).get(function(data) {
	console.log(data);
});

//test .get()
o('Feedback').find(1002).get(function(data) {
	console.log(data);
});

//test .skip()
o('Feedback').skip(3).get(function(data) {
	console.log(data);
});
*/


//test nothing
//runs into an error
/*o().get(function(data) {
	console.log(data);
});
//returns the metadata
o('').get(function(data) {
	console.log(data);
});

//test direct
o('https://secure.pointsale.de/Service.svc/Feedback(1)?$format=json').get(function(data) {
	console.log(data);
});
*/



