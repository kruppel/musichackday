module.exports = function(app, echonest) {
  app.get('/', function(req, res) {
    var ua = req.header('user-agent');

    if (ua.indexOf('Songbird') !== -1) {
      res.render('birdnest');
    } else {
      res.render('gtfo');
    }
  });

  app.get('/artist/:name', function(req, res) {
    echonest.apiCall('artist',
                     'profile',
                     { name: req.params.name,
                       buckets: [ 'audio',
                                  'biographies',
                                  'blogs',
                                  'hotttnesss',
                                  'images',
                                  'news',
                                  'reviews',
                                  'urls' ]
                     },
                     function(error, response, body) {
                       res.send(body);
                     });

  });

  app.get('/similar/:id', function(req, res) {
    echonest.apiCall('artist',
                     'similar',
                     { id: req.params.id,
                       buckets: [ 'audio' ]
                     },
                     function(error, response, body) {
                       res.send(body);
                     });
  });

  app.get('/feed/:id', function(req, res) {
    echonest.apiCall('catalog',
                     'feed',
                     { id: req.params.id,
                       results: 50,
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
