/**
 * References:
 * - http://wiki.songbirdnest.com/Developer/Articles/Getting_Started/Web_Integration_with_the_Webpage_API
 */

var Echoic = (function() {
  var birdable = false,
      observer = {
        observe: function(subject, topic, data) {
          switch(topic) {
            case 'metadata.artist':
              break;
            case 'metadata.title':
              break;
            default:
              break;
          }
        }
      };;

  if (typeof(songbird) != 'undefined') {
    birdable = true;
  }

  return {
    onload: function() {
      if (this.birdable) {
        songbird.addListener('metadata.artist', observer);
      }
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
