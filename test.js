var Converter = require('./');

describe('bufferToInt', function() {
  it('Should transform a 1-byte buffer into an integer', function() {
    Converter.bufferToInt(new Buffer([1])).should.equal(1);
  });
  it('Should transform a 2-byte buffer into an integer', function() {
    Converter.bufferToInt(new Buffer([0, 1])).should.equal(1);
  });
  it('Should transform a 4-byte buffer into an integer', function() {
    Converter.bufferToInt(new Buffer([0,0,0,1])).should.equal(1);
  });
});

describe('intToBuffer', function() {
  it('Should transform an integer into a 1-byte buffer', function() {
    Converter.intToBuffer(1, 1).should.eql(new Buffer([1]));
  });
  it('Should transform an integer into a 2-byte buffer', function() {
    Converter.intToBuffer(1, 2).should.eql(new Buffer([0, 1]));
  });
  it('Should transform an integer into a 4-byte buffer', function() {
    Converter.intToBuffer(1, 4).should.eql(new Buffer([0, 0,0, 1]));
  });
});

describe('remaining', function() {
  it('Should return remaining entries in buffer', function() {
    Converter.remaining(new Buffer(16), 8).should.equal(8);
    Converter.remaining(new Buffer(2), 1).should.equal(1);
  });
});
