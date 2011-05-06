/**
 * \file main.js
 *
 * \author kurt <kurt@songbirdnest.com>
 */

/**
 * Background
 * ==========
 * This script is embedded in browserOverlay.xul. It is primarily responsible
 * for creating/updating/deleting catalog items, as according to what's found
 * in the main library.
 */

var Cc = Cc || Components.classes,
    Ci = Ci || Components.interfaces,
    Cu = Cu || Components.utils;

// Songbird namespaces
var DATA_NS = DATA_NS || 'http://songbirdnest.com/data/1.0#',
    SP_NS = SP_NS || 'http://songbirdnest.com/rdf/servicepane#';

// Songbird mediacore manager
var gMM = gMM || Cc['@songbirdnest.com/Songbird/Mediacore/Manager;1']
                   .getService(Ci.sbIMediacoreManager);

// Songbird JS code modules
Cu.import('resource://app/jsmodules/sbLibraryUtils.jsm');
Cu.import('resource://app/jsmodules/sbProperties.jsm');

// Setup Echo Nest API wrapper
// XXX - There's some bugginess with the catalog APIs, similar to a mongoid
//       issue I've encountered in the past.
echonest.api_key = 'FQVXQRSHUQNJQILM3';

// Create an sbEchoic namespace
var sbEchoic = sbEchoic || {};

sbEchoic.onLoad = function(event) {
  var self = this;

  this.prefs = Cc['@mozilla.org/preferences-service;1']
                 .getService(Ci.nsIPrefService)
                 .getBranch('extensions.echoic.');

  // Main library listener to track library changes
  this.listener = {
    onItemAdded: function(list, item, index) {
      self.updateItem(item);
    },
    onBeforeItemRemoved: function(list, item, index) {},
    onAfterItemRemoved: function(list, item, index) {
      self.updateItem(item, 'delete');
    },
    onItemUpdated: function(list, item, properties) {
      var index = 0,
          length = properties.length,
          pstring = properties.toString().toLowerCase();

      // [hack] Exclude certain property updates.
      if (pstring.indexOf('download') !== -1 ||
          pstring.indexOf('duration') !== -1 ||
          pstring.indexOf('play') !== -1) {
        return;
      }
      Cu.reportError(properties.toString());
      self.updateItem(item);
    },
    onItemMoved: function(list, fromIndex, toIndex) {},
    onListCleared: function(list, excludeLists) {},
    onBatchBegin: function(list) {},
    onBatchEnd: function(list) {}
  };

  LibraryUtils.mainLibrary.addListener(this.listener, false);

  // Mediacore manager listener to track playback
  this.mmListener = {
    onMediacoreEvent: function(event) {
      switch(event.type) {
        case Ci.sbIMediacoreEvent.EXPLICIT_TRACK_CHANGE:
          var item = gMM.sequencer.currentItem;
          self.updateItem(item, 'skip');
          break;
        case Ci.sbIMediacoreEvent.TRACK_CHANGE:
          var item = gMM.sequencer.currentItem;
          self.updateItem(item, 'play');
          break;
        default:
      }
    }
  };

  gMM.addListener(this.mmListener);

  // Initialize the Echoic catalog
  this.getCatalog();
};

/**
 * \brief Gets or creates an Echo Nest catalog.
 */
sbEchoic.getCatalog = function() {
  var self = this,
      guid = LibraryUtils.mainLibrary.guid,
      catstr = (this.prefs.prefHasUserValue('catalog')) ?
                this.prefs.getCharPref('catalog') : null;

  if (catstr) {
    this.getCatalogProfile(guid);
  } else {
    echonest.apiCall('catalog',
                     'create',
                     { name: guid,
                       type: 'song' },
                     function(error, response, body) {
                       self.prefs.setBoolPref('forceUpdate', true);
                       self.getCatalogProfile(guid);
                     });
  }
};

/**
 * \brief Gets the catalog profile to validate its existence.
 */
sbEchoic.getCatalogProfile = function(name) {
  var self = this,
      forceUpdate = this.prefs.getBoolPref('forceUpdate');

  echonest.apiCall('catalog',
                   'profile',
                   { name: LibraryUtils.mainLibrary.guid },
                   function(error, response, body) {
                     var reso = JSON.parse(body).response,
                         catalog = reso.catalog;

                     if (!catalog) { return; }

                     // Cache the stringified catalog object so as to not
                     // unnecessarily attempt to re-create the catalog.
                     self.prefs.setCharPref('catalog', JSON.stringify(catalog));
                     self.catalog = catalog;
                     self.createSPSNodes();

                     if (forceUpdate) {
                       self.prefs.setBoolPref('forceUpdate', false);
                       self.updateAllCatalogItems();
                     }
                   });
};

/**
 * \brief Updates catalog items (all library mediaitems).
 */
sbEchoic.updateAllCatalogItems = function() {
  var self = this,
      mainLibrary = LibraryUtils.mainLibrary,
      items = [];

  mainLibrary.enumerateAllItems({
    onEnumerationBegin: function(list) {
      Cu.reportError('we be enumerating.');
    },
    onEnumeratedItem: function(list, item) {
      var enitem = generateItem(item);

      if (!enitem) { return; }

      items.push(enitem);
    },
    onEnumerationEnd: function(list) {
      Cu.reportError('o yay we r done. that wasnt that bad.');
    }
  });

  echonest.apiCall('catalog',
                   'update',
                   { id: this.catalog.id,
                     data: JSON.stringify(items) },
                   function(error, response, body) {
                     var reso = JSON.parse(body).response;

                     self.ticket = (reso) ? reso.ticket : null;
                     Cu.reportError(self.ticket);
                   });
};

/**
 * \brief Update an Echo Nest catalog entry given a Songbird media item.
 */
sbEchoic.updateItem = function(item, action) {
  var idonly = (action && action !== 'update'),
      enitem = this.generateItem(item, idonly);

  enitem['action'] = action || 'update';

  echonest.apiCall('catalog',
                   'update',
                   { id: this.catalog.id,
                     data: JSON.stringify([enitem]) },
                   function(error, response, body) {
                     Cu.reportError(body);
                   });
};

/**
 * \brief Returns an Echo Nest JS object from a given mediaitem.
 */
sbEchoic.generateItem = function(mediaitem, idonly) {
  var item = { item: {} },
      inner = item['item'],
      name = mediaitem.getProperty(SBProperties.trackName),
      genre = mediaitem.getProperty(SBProperties.genre),
      rating = mediaitem.getProperty(SBProperties.rating);

  if (!name) {
    return null;
  }

  inner['item_id'] = mediaitem.guid;
  if (idonly) { return item; }

  inner['song_name'] = encodeURIComponent(name);
  inner['artist_name'] =
    encodeURIComponent(mediaitem.getProperty(SBProperties.artistName));
  inner['release'] =
    encodeURIComponent(mediaitem.getProperty(SBProperties.albumName));
  if (genre) {
    inner['genre'] = encodeURIComponent(genre);
  }
  inner['play_count'] =
    parseInt(mediaitem.getProperty(SBProperties.playCount)) || 0;
  inner['skip_count'] =
    parseInt(mediaitem.getProperty(SBProperties.skipCount)) || 0;
  if (rating) {
    inner['rating'] = parseInt(rating) * 2;
  }

  return item;
};

/**
 * \brief Sets up the Echoic service pane node.
 */
sbEchoic.createSPSNodes = function() {
  var echoicId = 'SB:Echoic',
      servicesId = 'SB:Services',
      sps = Cc['@songbirdnest.com/servicepane/service;1']
              .getService(Ci.sbIServicePaneService),
      servicesNode = sps.getNode(servicesId),
      echoicNode = sps.getNode(echoicId);

  if (echoicNode) { return; }

  if (!servicesNode) {
    servicesNode = sps.createNode();
    servicesNode.id = servicesId;
    servicesNode.className = 'folder services';
    servicesNode.name = SBString('servicesource.services');
    servicesNode.editable = false;
    servicesNode.setAttributeNS(DATA_NS, 'servicesFolder', 1);
    servicesNode.setAttributeNS(SP_NS, 'Weight', 1);
    sps.root.appendChild(servicesNode);
  }

  echoicNode = sps.createNode();
  echoicNode.url = 'http://localhost:3000/echoes/' + this.catalog.id + '/';
  echoicNode.id = echoicId;
  echoicNode.name = 'Echoic';
  echoicNode.image = 'chrome://echoic/skin/echonest.png';
  echoicNode.editable = false;
  echoicNode.hidden = false;
  servicesNode.appendChild(echoicNode);
};

sbEchoic.onUnload = function() {
  LibraryUtils.mainLibrary.removeListener(this.listener);
  gMM.removeListener(this.mmListener);
};

window.addEventListener('load', function() { sbEchoic.onLoad(); }, false);
window.addEventListener('unload', function() { sbEchoic.onUnload(); }, false);
