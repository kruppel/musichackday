/**
 * References:
 * - http://wiki.songbirdnest.com/Developer/Articles/Getting_Started/Web_Integration_with_the_Webpage_API
 * - http://src.songbirdnest.com/xref/trunk/components/remoteapi/public/sbIRemotePlayer.idl
 */

var session = {
  artists: [],
  getLinks: function(name) {
    var links = this.artists[name],
        href;

    if (!links) { return; }

    $('div#locker').children().remove();
    $('div#rocker').children().remove();

    links.forEach(function(link) {
      var href = link['url'];

      $('div#rocker').append('<a href="' + href + ' />');
    });
  }
};

var Echoic = (function() {
  var birdable = false,
      observer = {
        observe: function(subject, topic, data) {
          switch(subject) {
            case 'metadata.artist':
              var url = '/artist/' + encodeURIComponent(topic);
              $('div#artistname').text(topic);

              $.getJSON(url, {}, function(res) {
                var r = res.response,
                    artist = (r) ? r.artist : null,
                    news = artist.news,
                    articleno = 1,
                    images = (artist) ? artist.images : null,
                    ilength = (images) ? images.length : null,
                    icount = 0,
                    hotttnesss,
                    red, green, blue, rgb;

                if (!artist) { return; }

                $('div#news').children().remove();
                news.forEach(function(story) {
                  $('div#news').append('<div class="story">' + articleno++ +
                                       '. <a href="' + story.url +
                                       '" class="headline" target="_blank">' +
                                         story.name + '</a></div>');
                });

                $('div#similar').children().remove();
                $.getJSON('/similar/' + artist.id, {}, function(res) {
                  var r = res.response,
                      artists = r.artists;

                  if (!artists) { return; }

                  session.artists = artists;

                  artists.forEach(function(artist) {
                    var name = artist.name,
                        link = '<div class="rec" onclick="session.getLinks' + "('" +
                                name + "')" + '">' + name + '</div>';

                    session.artists[name] = artist.audio;
                    $('div#similar').append(link);
                  });
                });

                // Hot or not!
                ilength = Math.min(ilength, 5);
                $('div#images').children().remove();
                while (icount < ilength) {
                  var src = images[icount++].url;
                  $('div#images').append('<img src="' + src + '" width="200" />');
                }

                hotttnesss = Math.floor(artist.hotttnesss * 100);

                if (typeof(hotttnesss) === 'number') {
                  if (hotttnesss >= 50) {
                    red = 255;
                    green = blue = Math.floor(255 * (1 - artist.hotttnesss) * 2 - 10);
                  } else {
                    red = green = Math.floor(255 * artist.hotttnesss * 2 - 10);
                    blue = 255;
                  }

                  rgb = 'rgb(' + red + ',' + green + ',' + blue + ')';
                  $('div#hotttnesss').css('color', rgb);
                  $('div#hotttnesss').text(hotttnesss);
                }
              });
              break;
            case 'metadata.title':
              $('div#trackname').text(topic);
              break;
            default:
              break;
          }
        }
      };;

  // Determine if Songbird
  if (typeof(songbird) != 'undefined') {
    birdable = true;
  }

  return {
    onload: function() {
      if (birdable) {
        // Listen to artist data remote
        songbird.addListener('metadata.artist', observer);
        songbird.addListener('metadata.title', observer);
      }

      startup = true;
    },
    echoes: function($, id) {
      var url = '/feed/' + id;

      $.getJSON(url, {}, function(res) {
        var r = res.response,
            feed = (r) ? r.feed : null;

        if (!feed) { return; }

        feed.forEach(function(entry) {
          var href = entry.url;
          $('div#locker').append('<a href="' + href + ' />');
        });
      });
    },
    onunload: function() {
      if (this.birdable) {
        songbird.removeListener('metadata.artist', observer);
        songbird.removeListener('metadata.title', observer);
      }
    }
  }
})();

$(function() {
  Echoic.onload();
});

$(window).unload(function() {
  Echoic.onunload();
});
