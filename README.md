# buffer-to-messages (NodeJS)

Small helper class to go about sending messages through and recovering messages
from a bufferstream, using length-prefixes.

*This is built with TCP sockets in mind, where the order of delivery is fixed,
but where the actual packets might be split up or merged arbitrarily.*

## Setup

Get the package from NPM

    npm install buffer-to-messages

Now get the class in your application

    var Converter = require('buffer-to-messages');

## API & walkthrough

### Constructing an instance

    /**
     * @param {Integer} [prefixLength] - The length in bytes of the size prefix.
     * This argument is optional. The default length is 2 bytes, but can also be 1
     * or 4 bytes.
     *
     * @param {Function} callback - This will be called every time a new message has
     * been completely processed.
     */
    var Converter = function Converter()

Every message needs to be prefixed with a buffer containing it's length. By
default the size of that prefix is 2 bytes (16bit) but you can configure it to
be 1 byte (8bit) or 4 bytes (32bit) as well.

    var prefixLength = 2;

    var converter = new Converter(prefixLength, function(message) {
      console.log('got message: ', message.toString());
    });

### Converter.process

    /**
     * Process the given buffer.
     * @param  {Buffer}   buffer - Process a new buffer snippet
     * @param  {Function} [cb] - Override the callback just for this snippet. This
     * is used for testing purposes.
     */
    Converter.prototype.process = function(b, cb)

Your messages require a 1, 2 or 4-byte prefix indicating their length. The class
provides methods to generate such a prefix from an existing buffer, but for now
we'll do it manually.

    // A 2-byte length prefix, indicating a message length of 4
    converter.process(new Buffer([0]));
    converter.process(new Buffer([4]));

    // Also process the message,in two parts
    converter.process(new Buffer('tes'));
    converter.process(new Buffer('t'));

The message has been completely processed, so our callback is executed:

    >> got message: test

### Converter.flush

    /**
     * This flushes the converter instance. It clears all the cached bytes and
     * resets the state. Use this whenever the processor might go out of sync (e.g.
     * when a tcp connection times out and you reconnect)
     */
    Converter.prototype.flush = function()

Illustration:

    socket.on('end', function() {
      converter.flush();
      // reconnect
    });

### Converter.createPrefix

    /**
     * This creates a new buffer containing the length prefix of the given buffer
     *
     * @param {Buffer} buffer
     * @return {Buffer} - A buffer containing a compatible length-prefix
     */
    Converter.prototype.createPrefix = function(buffer)

Illustration:

    message = new Buffer('testMessage');
    prefix = converter.createPrefix(message);

    converter.process(prefix);

    converter.process(message);

This will successfully parse your message

    >> got message: testMessage

## License

MIT
