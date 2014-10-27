# stream-to-messages (NodeJS)

Parses a stream of buffers into messages

## Basic Example

Get the package from NPM

    npm install stream-to-messages

Now create an instance inside your application which simply logs the finalized
messages to the console, and has a prefix of 2 bytes indicating the size of the
message.

    var Converter = require('stream-to-messages');

    var converter = new Converter(2, function(message) {
      console.log('got message:', message.toString());
    });

We're all set up, lets feed the converter some data:

    converter.process(new Buffer([0, 4]));

    converter.process(new Buffer('tes'));

    converter.process(new Buffer('t'));
    >> got message: test

    var message = converter.create(new Buffer('test again'));

    converter.process(message);
    >> got message: test again

## License

MIT
