var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var amqp = require('amqplib/callback_api');

app.use(bodyParser.json());

app.post('/speak', function(req, res){
  console.log("/speak :" + req.body.key);
  console.log("/speak :" + req.body.msg);

  amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
      var ex = 'hw3';
      var msg = req.body.msg;
      var key = req.body.key;

      ch.assertExchange(ex, 'direct', {durable: false});

      ch.publish(ex, key, new Buffer(msg));
      console.log(" [x] Sent %s", msg);
    });
    setTimeout(function() { conn.close(); res.send("OK"); }, 500);
  });
});

app.post('/listen', function(req, res){
  console.log("/listen: " + req.body.keys);
  amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {
      var ex = 'hw3';
      var keys = req.body.keys;
      ch.assertExchange(ex, 'direct', {durable: false});
      ch.assertQueue('', {exclusive: true}, function(err, q) {
        console.log(" [*] Waiting for messages in %s. ", q.queue);

        for (var i = 0; i < keys.length; i++)
          ch.bindQueue(q.queue, ex, keys[i]);
        
        ch.consume(q.queue, function(msg) {
          var msg1 = msg.content.toString();
          console.log(" [x] %s", msg1);
          res.json({"msg": msg1});
	        conn.close();
        }, {noAck: true} );
      });
    });
  });
});

app.listen(80, function () {
  console.log('App listening on port 80!');
});