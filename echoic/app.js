var express = require('express'),
    jade = require('jade'),
    echonest = require('./public/scripts/echonestjs/echonest'),
    app = express.createServer();

echonest.api_key = 'FQVXQRSHUQNJQILM3';

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

app.configure('development', function() {
  app.use(express.static(__dirname + '/public'));
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

require('./routes/all')(app, echonest);

app.listen(3000);

