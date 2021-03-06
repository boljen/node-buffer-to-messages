var STATE_LENGTH_IN_PROGRESS = 1
  , STATE_CONTENT_IN_PROGRESS = 2;

/**
 * Takes in a series of Buffers and calls back whenever a fixed-length
 * message has been completely processed.
 *
 * @param {Integer} [prefixLength] - The length in bytes of the size prefix.
 * This argument is optional. The default length is 2 bytes, but can also be 1
 * or 4 bytes.
 *
 * @param {Function} callback - This will be called every time a new message has
 * been completely processed.
 */
var Converter = function Converter() {

  // Validate arguments
  if (arguments.length === 1) {

    this._bl = 2;

    if (typeof arguments[0] !== "function")
      throw new TypeError("Converter requires at least a callback function");
    else
      this._fx = arguments[0];

  } else if (arguments.length >= 2) {

    this._bl = arguments[0];
    if (this._bl !== 1 && this._bl !== 2 && this._bl !== 4)
      throw new TypeError("Prefix length must be 1, 2 or 4");

    if (typeof arguments[1] !== "function")
      throw new TypeError("Converter requires a callback function");
    else
      this._fx = arguments[1];

  } else {
    throw new Error("cannot construct a converter without a callback");
  }

  this.flush();
};

Converter.bufferToInt = function(buffer) {
  var length = buffer.length;

  if (length === 1) {
    return buffer.readUInt8(0);
  } else if (length ===2) {
    return buffer.readUInt16BE(0);
  } else if (length === 4) {
    return buffer.readUInt32BE(0);
  } else {
    throw new Error("Invalid length");
  }
};

Converter.intToBuffer = function(int, length) {
  var b = new Buffer(length);
  if (length === 1) {
    b.writeUInt8(int, 0);
  } else if (length ===2) {
    b.writeUInt16BE(int, 0);
  } else if (length === 4) {
    b.writeUInt32BE(int, 0);
  } else {console.log(cb);
    throw new Error("Invalid length");
  }
  return b;
};

Converter.remaining = function(buffer, index) {
  return buffer.length - index;
};

/**
 * Process the given buffer.
 * @param  {Buffer}   buffer - Process a new buffer snippet
 * @param  {Function} [cb] - Override the callback just for this snippet. This
 * is used for testing purposes.
 */
Converter.prototype.process = function(b, cb) {
  if (!cb)
    cb = this._fx;

  var i = 0;
  var l = b.length;
  //console.log('Processing ', b);
  while (i < l) {
    //console.log('--Iterating at ', i);
    i = this._exhaust(b, i, cb);
  }
};

Converter.prototype._exhaust = function(b, i, cb) {
  if (this._state === STATE_LENGTH_IN_PROGRESS) {
    //console.log('\tparsing length');
    return this._parseLength(b, i);
  } else {
    //console.log('\tparsing content');
    return this._parseContent(b, i, cb);
  }
};

Converter.prototype._parseLength = function(b, i) {

  var needed, available;
  available = Converter.remaining(b, i);

  // Parse with previous length cache
  if (this._lengthCache) {
    needed= this._bl - this._lengthCache.length;

    if (needed > available) {
      var r = b.slice(i, i+needed);
      //console.log('\t -- Cache with not enough needed, storing ', r);
      this._lengthCache = Buffer.concat([this._lengthCache, r]);
    } else {
      //console.log('\t -- Cache with enough needed');
      var lb = b.slice(i, i+needed);
      lb = Buffer.concat([this._lengthCache, lb]);
      this._setLength(Converter.bufferToInt(lb));
      return i + needed;
    }
  } else {
    needed = this._bl;
    if (needed > available) {
      var r = b.slice(i, i+needed);
      //console.log('\t -- No cache, not enough, storing ', r);
      this._lengthCache = r;
      return b.length;
    } else {
      //console.log('\t -- No cache, length is enough');
      var lb = b.slice(i, i+this._bl);
      this._setLength(Converter.bufferToInt(lb));
      return i + needed;
    }
  }

};

Converter.prototype._setLength = function(l) {
  //console.log('\t -- Setting length ', l);
  this._lengthCache = null;
  this._contentLength = l;
  this._state = STATE_CONTENT_IN_PROGRESS;
};

Converter.prototype._reset = function() {
  this._contentLength = null;
  this._contentCache = null;
};

Converter.prototype._parseContent = function(b, i, cb) {

  var needed, available;

  available = Converter.remaining(b, i);

  // Parse with previous length cache
  if (this._contentCache) {

    needed=  this._contentLength - this._contentCache.length;

    if (needed > available) {
      var r = b.slice(i, i+needed);
      //console.log('\t -- Cache with not enough needed, storing ', r);
      this._contentCache = Buffer.concat([this._contentCache, r]);
    } else {
      //console.log('\t -- Cache with enough needed');
      var lb = b.slice(i, i+needed);
      lb = Buffer.concat([this._contentCache, lb]);
      this._messageDone(lb, cb);
      return i + needed;
    }

  } else {
    needed = this._contentLength;
    if (needed > available) {
      var r = b.slice(i, i+needed);
      //console.log('\t -- No cache, not enough, storing ', r);
      this._contentCache = r;
      return b.length;
    } else {
      //console.log('\t -- No cache, length is enough');
      var lb = b.slice(i, i+needed);
      this._messageDone(lb, cb);
      return i + needed;
    }
  }
};

Converter.prototype._messageDone = function(msg, cb) {
  this._contentCache = null;
  this._contentLength = null;
  this._state = STATE_LENGTH_IN_PROGRESS;
  if (msg.length > 0)
    cb(msg);
  //console.log('\t -- Message completed, sending', msg);
};

/**
 * Create a new message buffer with an appropriate length prefix
 * (Note: necessary?)
 * @param  {Buffer} buffer
 */
Converter.prototype.create = function(buffer) {
  var l = Converter.intToBuffer(buffer.length, this._bl);
  return Buffer.concat([l, buffer]);
};

/**
 * This creates a new buffer containing the length prefix of the given buffer
 *
 * @param {Buffer} buffer
 * @return {Buffer} - A buffer containing a compatible length-prefix
 */
Converter.prototype.createPrefix = function(buffer) {
  return Converter.intToBuffer(buffer.length, this._bl);
};

/**
 * This flushes the converter instance. It clears all the cached strings and
 * resets the state. Use this whenever the processor might go out of sync (e.g.
 * when a tcp connection times out and you reconnect)
 */
Converter.prototype.flush = function() {
  this._state = STATE_LENGTH_IN_PROGRESS;
  this._lengthCache = null;
  this._contentCache = null;
  this._contentLength = null;
};

module.exports = Converter;
