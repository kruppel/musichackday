/*
 * \file main.js
 *
 * \author kurt <kurt@songbirdnest.com>
 */

var Cc = Cc || Components.classes,
    Ci = Ci || Components.interfaces,
    Cu = Cu || Components.utils;

// Songbird namespaces
var DATA_NS = DATA_NS || 'http://songbirdnest.com/data/1.0#',
    SP_NS = SP_NS || 'http://songbirdnest.com/rdf/servicepane#';

/*
 * Imports for JS code modules
 * doc: https://developer.mozilla.org/en/JavaScript_code_modules/Using
 */
Cu.import('resource://echoic/RequestUtils.jsm');

// Setup Echo Nest API wrapper
echonest.api_key = 'FQVXQRSHUQNJQILM3';

// Create an sbEchoic namespace
var sbEchoic = sbEchoic || {};

sbEchoic.onLoad = function(event) {
  // Create the catalog
  sbEchoic.createCatalog();
  sbEchoic.createSPSNodes();
};

sbEchoic.createCatalog = function() {
  echonest.apiCall('catalog',
                   'create',
                   { name: 'Songbird Echoic Catalog',
                     type: 'song' },
                   function(response) {
                     Cu.reportError(response);
                   });
};

/*
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
  echoicNode.url = 'http://localhost:3000/';
  echoicNode.id = echoicId;
  echoicNode.name = 'Echoic';
  echoicNode.image = 'chrome://echoic/skin/echonest.png';
  echoicNode.editable = false;
  echoicNode.hidden = false;
  servicesNode.appendChild(echoicNode);
};

window.addEventListener('load', sbEchoic.onLoad, false);
