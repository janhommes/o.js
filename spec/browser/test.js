// +++
// o.js tests
//
// o.js unit test with quint.js
// http://qunitjs.com/
//
// By Jan Hommes
// Date: 01.03.2016
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
			endpoint: 'http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/',
			version:4,
			strictMode:true,
			headers: [{name: 'If-Match', value: '*'}]
		});
	}
}


// ----------------------------------------------- Tests ----------------------------------------------------

test('No resource or endpoint throw error', function(assert) {
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


QUnit.test('GET People - no endpoint - no query', function(assert) {
    var done = assert.async();

    o('http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/People').get(function(data) {
        assert.ok(data.length >= 0, printResult(this,data));
        done();
    }, function(e) {
        assert.ok(e === 200, printResult(this, e));
        done();
    });
});

QUnit.test('GET People - $format off - autoFormat=false', function(assert) {
    var done = assert.async();

	o().config({ autoFormat: false });

    o('http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/People').get(function(data) {
        assert.ok(this.query().indexOf('$format') === -1, printResult(this, data));
        done();
    }, function(e) {
        assert.ok(e === 200, printResult(this, e));
        done();
    });
});


QUnit.skip('GET People - custom headers', function(assert) {
    var done = assert.async();

	o().config({ headers: [ { name: 'Content-Type',  value: 'json' }] });

    o('http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/People').headers([ { name: 'Content-Type',  value: 'xml' }]).get(function(data) {
        assert.ok(this.oConfig.headers[0].value === 'xml', printResult(this, data));
        done();
    }, function(e) {
        assert.ok(e === 200, printResult(this, e));
        done();
    });

	o('http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/People').headers();
	assert.ok(o().oConfig.headers[0].value === 'json');
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
    QUnit.test('POST People as the test person - endpoint - no query', function(assert) {
		var done = assert.async();
		var name='Test_'+Math.random();
		o('People').post({UserName:name,FirstName:name,LastName:name}).save(function(data) {
			assert.ok(data.UserName === name, printResult(this, data));
			done();
		}, function(e) {
			assert.ok(e === 200, printResult(this, e));
			done()
		});
	});

	QUnit.test('GET People - no endpoint - no query', function(assert) {
		var done = assert.async();
		o('http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/People').get(function(data) {
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

	QUnit.test('GET People - endpoint - .count()', function(assert) {
		var done = assert.async();
		o('People').count().get(function(data) {
			console.log(data);
			assert.ok(data >= 0, printResult(this,data));
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

	QUnit.test('GET Orders - custom endpoint - filter by date', function(assert) {
	  var done = assert.async();

		o().config({
			endpoint: 'http://services.odata.org/V4/Northwind/Northwind.svc/',
			headers: [],
			isCors: false
		});

	  var handleErrors = function(err) {
	    assert.ok(false, printResult(this, err));
			o().config({
				endpoint: 'http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/',
				headers: [{name: 'If-Match', value: '*'}],
				isCors: true
			});
	    done();
	  };

	  o('Orders').inlineCount(true).get().then(function(oHandler) {
	    var total = oHandler.inlinecount;
	    o('Orders').where('RequiredDate gt 1996-08-16').inlineCount(true).get().then(function(oHandler) {
	      assert.ok(oHandler.inlinecount < total, printResult(oHandler.inlinecount, total));
				o().config({
					endpoint: 'http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/',
					headers: [{name: 'If-Match', value: '*'}],
					isCors: true
				});
	      done();
	    }).fail(handleErrors);
	  }).fail(handleErrors);
	});

	QUnit.skip('POST Action with string output', function(assert) {
		var done = assert.async();

		var url = '';
		var data = {};

		o(url).post(data).save().then(function(oHandler) {
			assert.ok(typeof oHandler.data === 'string');
			done();
		}).fail(function(e) {
			assert.ok(false, printResult(this, err));
			done();
		});
	});

	QUnit.skip('POST Action with no output', function(assert) {
		var done = assert.async();

		var url = '';
		var data = {};

		o(url).post(data).save().then(function(oHandler) {
			assert.ok(oHandler.data === '');
			done();
		}).fail(function(e) {
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

	QUnit.test('POST, PUT and DELETE it with q.js promise - endpoint - no query', function(assert) {
		var done1 = assert.async();
		var done2 = assert.async();
        var done3 = assert.async();
		var name='Test_'+Math.random();

		o('People').post({
            UserName:name,
            FirstName:'foo',
            LastName:'bar'
        }).save().then(function(result) {
            done1();
            var oHandler = o('People').find(('\'' + result.data.UserName + '\'')).patch({ FirstName: 'fooBAAAR' });
            return(oHandler.save());
        }).then(function(result) {
            done2();
            result.delete();
            return(result.save());
        }).then(function() {
            expect(0);
            done3();
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
			done();
		});
	});


	QUnit.test('PATCH People(\''+testEntity.UserName+'\') - no endpoint - no query', function(assert) {
		var done = assert.async();
		var name='Test_'+Math.random();
		o('http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/People(\''+testEntity.UserName+'\')').patch({FirstName:name}).save(function(data) {
			assert.ok(data.length===0, printResult(this,data));
			done();
		}, function(e) {
			assert.ok(e === 200, printResult(this, e));
			done();
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
			done();
		});
	});


    QUnit.test('Route #test', function(assert) {
		var done = assert.async();
		o('People').route('test', function(data) {
			assert.ok(data.length > 0);
			done();
		});
        window.location.hash = "test";
	});

    QUnit.test('Route #test/:0 -> where :0 is ' + testEntity.UserName, function(assert) {
		var done = assert.async();
		o('People').filter('UserName == \':0\'').route('person/:0', function(data) {
			assert.ok(data.length > 0);
            //assert.ok(this.param[0] === testEntity.UserName);
            assert.ok(this.param[0] === 'russellwhyte');
			done();
		});
        window.location.hash = "person/russellwhyte";
	});
}
