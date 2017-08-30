var o = require('../o.js');

jasmine.getEnv().defaultTimeoutInterval = 60000;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

describe('o.js tests:', function () {

    it('GET People - no endpoint - no query', function (done) {
        o('http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/People').get(function (data) {
            expect(data.length).not.toBe(0);
            done();

        }, function (e) {
            expect(e).toBe(200);
            done();
        });
    });

    it('GET People - no endpoint - no query', function (done) {
        o('http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/People').get(function (data) {
            expect(data.length).not.toBe(0);
            done();
        }, function (e) {
            expect(e).toBe(200);
            done()
        });
    });

    it('GET Orders - no endpoint - filter by date', function (done) {
        var url = 'http://services.odata.org/V4/Northwind/Northwind.svc/Orders';

        var handleErrors = function (e) {
            expect(e).toBe(200);
            done();
        };

        o(url).inlineCount(true).get().then(function (oHandler) {
            var total = oHandler.inlinecount;
            o(url).where('RequiredDate gt 1996-08-16').inlineCount(true).get().then(function (oHandler) {
                expect(oHandler.inlinecount).toBeLessThan(total);
                done();
            }).fail(handleErrors);
        }).fail(handleErrors);
    });

    xit('POST with string output', function(done) {
      var url = '';
  		var data = {};

      o(url).post(data).save().then(function(oHandler) {
        expect(typeof oHandler.data === 'string').toBe(true);
        done();
      }).fail(function(e) {
        expect(e).toBe(200);
        done();
      });
    });

    xit('POST with no output', function(done) {
      var url = '';
  		var data = {};

      o(url).post(data).save().then(function(oHandler) {
        expect(oHandler.data).toEqual('');
        done();
      }).fail(function(e) {
        expect(e).toBe(200);
        done();
      });
    });

    var testEntity = null;

    describe('with endpoint:', function () {

        beforeAll(function (done) {
            o().config({
                endpoint: 'http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/',
                version: 4,
                strictMode: true,
                headers: [{ name: 'If-Match', value: '*' }]
            });

            var name = 'Test_' + Math.random();
            o('People').post({ UserName: name, FirstName: name, LastName: name }).save(function (data) {
                testEntity = data;
                done();
            }, function (e) {
                expect(e).toBe(200);
            });
        });

        it('POST People as the test person - endpoint - no query', function (done) {
            var name = 'Test_' + Math.random();
            o('People').post({ UserName: name, FirstName: name, LastName: name }).save(function (data) {
                expect(data.UserName).toBe(name);
                done();
            }, function (e) {
                expect(e).toBe(200);
                done();
            });
        });

        it('GET People - endpoint - .top(1)', function (done) {
            o('People').top(1).get(function (data) {
                expect(data.length).not.toBe(0);
                done();
            }, function (e) {
                expect(e).toBe(200);
                done();
            });
        });

        it('GET People(testEntity) - endpoint - no query', function (done) {
            o('People(\'' + testEntity.UserName + '\')').get(function (data) {
                expect(data.UserName).toBe(testEntity.UserName);
                done();
            }, function (e) {
                expect(e).toBe(200);
                done();
            });
        });

        it('GET People - endpoint - query: .take(5) and .skip(2)', function (done) {
            o('People').take(5).skip(2).get(function (data) {
                expect(data.length).not.toBe(0);
                done();
            }, function (e) {
                expect(e).toBe(200);
                done();
            });
        });

        it('GET People - endpoint - query: .take(5) and .expand("Trips")', function (done) {
            o('People').take(5).expand('Trips').get(function (data) {
                expect(data.length).not.toBe(0);
                expect(typeof data[0]).not.toBe('undefined');
                expect(typeof data[0].Trips).not.toBe('undefined');
                done();
            }, function (e) {
                expect(e).toBe(200);
                done()
            });
        });

        it('GET People(testEntity) with q.js promise - endpoint - no query', function (done) {
            o('People(\'' + testEntity.UserName + '\')').get().then(function (o) {
                expect(o.data.UserName).toBe(testEntity.UserName);
                done();
            }, function (e) {
                expect(e).toBe(200);
                done()
            });
        });

        it('GET People(testEntity) and  Group with q.js promise all - endpoint - no query', function (done) {
            var Q = require('q');
            Q.all([
                o('People(\'' + testEntity.UserName + '\')').get(),
                o('People?$filter=UserName eq \'Yeah\'')
            ]).then(function (o) {
                expect(o[0].data.UserName).toBe(testEntity.UserName);
                expect(o[1].data.length).toBe(0);
                done();
            }).fail(function (err) {
                expect(true).toBe(false);
                done();
            });
        });

        it('GET People(testEntity) and PATCH People(testEntity), change and save() it with q.js promise - endpoint - no query', function (done) {
            var name = 'Test_' + Math.random();

            o('People(\'' + testEntity.UserName + '\')').get().then(function (o) {
                o.data.FirstName = name;
                expect(o.data.UserName).toBe(testEntity.UserName);
                return (o.save());
            }).then(function (o) {
                expect(o.data.UserName).toBe(testEntity.UserName);
                expect(o.data.FirstName).toBe(name);
                done();
            }).fail(function (err) {
                expect(true).toBe(false);
                done();
            });
        });

        /*done('GET People(\''+testEntity.UserName+'\') and PATCH People(X), change and save() it with q.js promise but provoke error - endpoint - no query', function(assert) {
            var done1 = assert.async();
            var done2 = assert.async();
            var name='Test_'+Math.random();

            o('People(\''+testEntity.UserName+'\')').get().then(function(o) {
                expect(o.data.UserName===testEntity.UserName, printResult(o,o.data));
                o.data.Gender = 1;
                done1();
                return(o.save());
            }).then(function(o) {
                //not reachable because of error
            }).fail(function(err) {
                expect(err, 'Passed! Error as expected.');
                done2();
            });
        });*/

        it('PATCH People(testEntity) - endpoint - no query', function (done) {
            var name = 'Test_' + Math.random();
            o('People(\'' + testEntity.UserName + '\')').patch({ FirstName: name }).save(function (data) {
                expect(data.length).toBe(0);
                done();
            }, function (e) {
                expect(e).toBe(200);
                done();
            });
        });


        it('PATCH People(testEntity) - no endpoint - no query', function (done) {
            var name = 'Test_' + Math.random();
            o('http://services.odata.org/V4/(S(ms4wufavzmwsg3fjo3eqdgak))/TripPinServiceRW/People(\'' + testEntity.UserName + '\')').patch({ FirstName: name }).save(function (data) {
                expect(data.length).toBe(0);
                done();
            }, function (e) {
                expect(e).toBe(200);
                done();
            });
        });

        //DELETES the test data, move it to the end of this file!
        it('DELETE Products(testEntity) - endpoint - no query', function (done) {
            var name = 'Test_' + Math.random();
            o('People(\'' + testEntity.UserName + '\')').delete().save(function (data) {
                expect(data.length).toBe(0);
                done();
            }, function (e) {
                expect(e).toBe(200);
                done();
            });
        });

        it('Route -> error', function (done) {
            var name = 'Test_' + Math.random();
            try {
                o('People').route('test', function (data) {
                });
            }
            catch (ex) {
                done();
                expect(true).toBe(true);
            }

        });
    });

});
