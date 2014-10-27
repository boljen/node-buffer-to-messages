// Integration testing
//


var Processor = require('./');

var p = new Processor(4, function(msg) {
  console.log('MESSAGE:: ', msg.toString());
});


p.process(new Buffer([0]));
p.process(new Buffer([0, 0, 1]));
p.process(new Buffer([54, 0, 0, 0, 2]))
p.process(new Buffer('t'))
p.process(new Buffer('e'))
var message = p.create(new Buffer('test again'));
p.process(message);
