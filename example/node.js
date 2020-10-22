const odata = require('odata');


const oHandler = odata.o('https://services.odata.org/V4/%28S%28wptr35qf3bz4kb5oatn432ul%29%29/TripPinServiceRW/', {
  headers: {
    'If-Match': '*'
  }
});

oHandler.get('People').query().then((data) => {
  console.log(data);
});
