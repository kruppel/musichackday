module.exports = function(app, echonest) {
  app.get('/', function(req, res) {
    var ua = req.header('user-agent');

    if (ua.indexOf('Songbird') !== -1) {
      res.render('birdnest');
    } else {
      res.render('gtfo');
    }
  });

  app.get('/feed/:id', function(req, res) {
    echonest.apiCall('catalog',
                     'feed',
                     { id: req.params.id,
                       results: 100,
                       bucket: 'audio'
                     },
                     function(error, response, body) {
                       res.send(body);
                     });
  });

  app.get('/echoes/:id', function(req, res) {
    res.render('catalog', { id: req.params.id});
  });
};
