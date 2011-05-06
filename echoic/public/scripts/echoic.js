/**
 * References:
 * - http://wiki.songbirdnest.com/Developer/Articles/Getting_Started/Web_Integration_with_the_Webpage_API
 * - http://src.songbirdnest.com/xref/trunk/components/remoteapi/public/sbIRemotePlayer.idl
 */

var Echoic = (function() {
  var birdable = false,
      observer = {
        observe: function(subject, topic, data) {
          switch(subject) {
            case 'metadata.artist':
              var url = '/artist/' + encodeURIComponent(topic);

              $('div#artistname span').text(topic);

              $.getJSON(url, {}, function(res) {
                var r = res.response,
                    artist = (r) ? r.artist : null;

                if (!artist) { return; }

              });
              break;
            case 'metadata.title':
              $('div#trackname > span').text(topic);
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
          $('div#content').append('<a href="' + href + ' />');
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
