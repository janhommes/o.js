// +++
// o.js tests
//
// o.js unit test with quint.js
// http://qunitjs.com/
//
// By Jan Hommes 
// Date: 15.06.2015
// +++

//helper function for debuging
function printResult(o,data) {
	try{
		if(data.message) {
			return('JSON Result: '+JSON.stringify(data));	
		}
		return('Lenght: '+(typeof data.length !== 'undefined'? data.length :1) +'  |  JSON Result: '+JSON.stringify(data));
	} catch(e) {
		return('Exception: '+e);
	}
} 

//helper function to configure endpoint
function configureEndpoint() {
	if(!o().isEndpoint()) {
		o().config({
			endpoint:'http://services.odata.org/V4/%28S%28wptr35qf3bz4kb5oatn432ul%29%29/TripPinServiceRW/',
			version:4,
			strictMode:true
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

QUnit.test('CONFIG - endpoint', function(assert) {
	configureEndpoint();
	assert.ok(o().isEndpoint(), 'Passed! Endpoint is: '+o('').query());
	createTestData();
});

// ------------------------------------------------- Endpoint tests -------------------------------------------------------------

//create test data with a test
var testEntity=null;
function createTestData() {
	QUnit.test('POST People as the test person - endpoint - no query', function(assert) {
		var done = assert.async();
		var name='Test_'+Math.random();
		o('People').post({UserName:name,FirstName:name,LastName:name}).save(function(data) {
			assert.ok(data.UserName === name, printResult(this, data));
			done();
			testEntity = data;
			startEndpointTests();
		}, function(e) { 
			assert.ok(e === 200, printResult(this, e));
			done()
		});
	});
}
	
// Start this test if the endpoint is configured
function startEndpointTests() {
	QUnit.test('GET People - endpoint - no query', function(assert) {
		var done = assert.async();
		o('People').get(function(data) {
			assert.ok(data.length >= 0, printResult(this,data));
			done();
		}, function(e) { 
			assert.ok(e === 200, printResult(this, e));
			done()
		});
	});

	QUnit.test('GET People - endpoint - .top(1)', function(assert) {
		var done = assert.async();
		o('People').top(1).get(function(data) {
			assert.ok(data.length >= 0, printResult(this,data));
			done();
		}, function(e) { 
			assert.ok(e === 200, printResult(this, e));
			done()
		});
	});

	QUnit.test('GET People(\''+testEntity.UserName+'\') - endpoint - no query', function(assert) {
		var done = assert.async();
		o('People(\''+testEntity.UserName+'\')').get(function(data) {
			assert.ok(data.UserName === testEntity.UserName, printResult(this,data));
			done();
		}, function(e) { 
			assert.ok(e === 200, printResult(this, e));
			done()
		});
	});

	QUnit.test('GET People - endpoint - query: .take(5) and .skip(2)', function(assert) {
		var done = assert.async();
		o('People').take(5).skip(2).get(function(data) {
			assert.ok(data.length >= 0, printResult(this,data));
			done();
		}, function(e) { 
			assert.ok(e === 200, printResult(this, e));
			done()
		});
	});

	QUnit.test('GET People - endpoint - query: .take(5) and .expand("Trips")', function(assert) {
		var done = assert.async();
		o('People').take(5).expand('Trips').get(function(data) {
			assert.ok(data.length  >= 0 && (data[0] && data[0].Trips), printResult(this,data));
			done();
		}, function(e) { 
			assert.ok(e === 200, printResult(this, e));
			done()
		});
	});

	QUnit.test('GET People(\''+testEntity.UserName+'\') with q.js promise - endpoint - no query', function(assert) {
		var done = assert.async();
		o('People(\''+testEntity.UserName+'\')').get().then(function(o) {
			assert.ok(o.data.UserName === testEntity.UserName, printResult(o,o.data));
			done();
		}, function(e) { 
			assert.ok(e === 200, printResult(this, e));
			done()
		});
	});

	QUnit.test('GET People(\''+testEntity.UserName+'\') and  Group with q.js promise all - endpoint - no query', function(assert) {
		var done = assert.async();
		Q.all([
			o('People(\''+testEntity.UserName+'\')').get(),
			o('People?$filter=UserName eq \'Yeah\'')
		]).then(function(o) {
			assert.ok(o[0].data.UserName==testEntity.UserName, printResult(o[0],o[0].data));
			assert.ok(o[1].data.length >=0, printResult(o[1],o[1].data));
			done();
		}).fail(function(err) {
			assert.ok(false, printResult(this, err));
			done();
		});
	});

	QUnit.test('GET People(\''+testEntity.UserName+'\') and PATCH AAA People(\''+testEntity.UserName+'\'), change and save() it with q.js promise - endpoint - no query', function(assert) {
		var done1 = assert.async();
		var done2 = assert.async();	
		var name='Test_'+Math.random();
		
		o('People(\''+testEntity.UserName+'\')').get().then(function(o) {
			o.data.FirstName=name;
			assert.ok(o.data.UserName===testEntity.UserName, printResult(o,o.data));
			done1();
			return(o.save());
		}).then(function(o) {
			assert.ok(o.data.UserName === testEntity.UserName && o.data.FirstName===name, printResult(o,o.data));
			done2();
		}).fail(function(err) {
			assert.ok(false, printResult(this, err));
			done1();
			done2();
		});
	});
	
	QUnit.test('GET People(\''+testEntity.UserName+'\') and PATCH People(2), change and save() it with q.js promise but provoke error - endpoint - no query', function(assert) {
		var done1 = assert.async();
		var done2 = assert.async();	
		var name='Test_'+Math.random();
		
		o('People(\''+testEntity.UserName+'\')').get().then(function(o) {
			assert.ok(o.data.UserName===testEntity.UserName, printResult(o,o.data));
			o.data.Gender = 1;
			done1();
			return(o.save());
		}).then(function(o) {
			//not reachable because of error
		}).fail(function(err) {
			assert.ok(err, 'Passed! Error as expected.');
			done2();
		});
	});

	QUnit.test('PATCH People(\''+testEntity.UserName+'\') - endpoint - no query', function(assert) {
		var done = assert.async();
		var name='Test_'+Math.random();
		o('People(\''+testEntity.UserName+'\')').patch({FirstName:name}).save(function(data) {
			assert.ok(data.length===0, printResult(this,data));
			done();
		}, function(e) { 
			assert.ok(e === 200, printResult(this, e));
			done()
		});
	});

	//DELETES the test data, move it to the end of this file!
	QUnit.test('DELETE Products(\''+testEntity.UserName+'\') - endpoint - no query', function(assert) {
		var done = assert.async();
		var name='Test_'+Math.random();
		o('People(\''+testEntity.UserName+'\')').delete().save(function(data) {
			assert.ok(data.length===0, printResult(this,data));
			done();			
		}, function(e) { 
			assert.ok(e === 200, printResult(this, e));
			done()
		});
	});
}
