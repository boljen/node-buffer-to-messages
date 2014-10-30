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

describe('.Converter', function() {

  var converter
    , throwError = function() {
      throw new Error("unwanted callback");
    };

  describe('constructor', function() {

    it('Should construct', function() {
      converter = new Converter(4, function() {});
      converter = new Converter(1, function() {});
      converter = new Converter(2, function() {});
      converter = new Converter(function() {});
    });

    it('Should not construct with invalid arguments', function() {
      (function() {
        new Converter();
      }).should.throw();
      (function() {
        new Converter(2);
      }).should.throw();
      (function() {
        new Converter(5, function() {});
      }).should.throw();
    });

  });

  /**
   * This is a continuous test with a single instance
   */
  describe('process', function() {

    beforeEach(function() {
      converter = new Converter(2, throwError);
    });

    // Basic hypothesis: full message length + message
    it('Should process full message and call back', function(done) {
      converter.process(new Buffer([0, 1, 123]), function(m) {
        m.should.eql(new Buffer([123]));
        done();
      });
    });

    it('Should process two full messages and call back twice', function(done) {
      var d= 0;
      converter.process(new Buffer([0, 1, 100, 0, 1, 111]), function(msg) {
        if (d=== 0) {
          msg[0].should.equal(100);
          d++;
        } else {
          msg[0].should.equal(111);
          done();
        }
      });
    });

    it('Should cache the partial length', function(done) {
      // Default callback throws an error
      converter.process(new Buffer([0]));

      // Check if new message is parsed correctly
      converter.process(new Buffer([1, 1]), function(msg) {
        msg[0].should.equal(1);
        done();
      });
    });

    it('Should cache the entire length', function(done) {
      // Default callback throws an error
      converter.process(new Buffer([0, 2]));

      // Check if new message is parsed correctly
      converter.process(new Buffer([1, 1]), function(msg) {
        msg[0].should.equal(1);
        msg[1].should.equal(1);
        done();
      });
    });

    it('Should cache the content', function(done) {
      // Default callback throws an error
      converter.process(new Buffer([0, 2, 1]));

      // Check if new message is parsed correctly
      converter.process(new Buffer([3, 1]), function(msg) {
        msg[0].should.equal(1);
        msg[1].should.equal(3);
        done();
      });
    });

    it('Should not call back if empty message', function(done) {
      // Default callback throws an error
      converter.process(new Buffer([0, 0, 0, 1]));

      // Check if empty message is sanitized and new message is parsed correctly
      converter.process(new Buffer([1]), function(msg) {
        msg[0].should.equal(1);
        done();
      });
    });

  });

  describe('flush', function() {

    it('Should reset the state and clear the caches', function(done) {
      converter = new Converter(2, throwError);

      // Will call back when processing the next
      converter.process(new Buffer([0, 1]));
      converter.flush();
      // Should not call back
      converter.process(new Buffer([0, 1]));

      converter.process(new Buffer([255, 0, 3, 1, 2]), function(msg) {
        msg[0].should.equal(255);
        msg.length.should.equal(1);
        converter.flush();
        // Should not call back
        converter.process(new Buffer([3]));
        done();
      });
    });

  });

  describe('create', function() {

  });

  describe('createPrefix', function() {

    it('Should create a valid prefix', function() {

      converter = new Converter(2, throwError);

      message = new Buffer('testMessage');
      prefix = converter.createPrefix(message);

      converter.process(prefix);

      converter.process(message, function(msg) {
        msg.toString().should.equal('testMessage');
      });

    });
  });

  describe('flush', function() {

  });

});
