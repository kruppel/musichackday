var trivialert = function(e) {
  var self = this;
  window.setTimeout(function() {
    alert('Music Hack Day! WOOOOOOO!');
    window.removeEventListener('load', self, false);
  }, 0);
};

window.addEventListener('load', trivialert, false);
