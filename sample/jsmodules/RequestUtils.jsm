/*
 *=BEGIN SONGBIRD GPL
 *
 * This file is part of the Songbird web player.
 *
 * Copyright(c) 2005-2011 POTI, Inc.
 * http://www.songbirdnest.com
 *
 * This file may be licensed under the terms of of the
 * GNU General Public License Version 2 (the ``GPL'').
 *
 * Software distributed under the License is distributed
 * on an ``AS IS'' basis, WITHOUT WARRANTY OF ANY KIND, either
 * express or implied. See the GPL for the specific language
 * governing rights and limitations.
 *
 * You should have received a copy of the GPL along with this
 * program. If not, go to http://www.gnu.org/licenses/gpl.html
 * or write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 *=END SONGBIRD GPL
 */

/**
 * \file  RequestUtils.jsm
 * \brief JavaScript source for the Request utility services.
 */

EXPORTED_SYMBOLS = [ "Request" ];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

/**
 * Utilities for JavaScript components to construct simplified HTTP requests.
 */
var Request = Request || {};

/**
 * \brief Request function
 *
 * \param options HTTP request options
 * \param callback Response callback function
 *   arguments:
 *     error - Error status from XMLHttpRequest response
 *     response - XMLHttpRequest that received the response
 *     body - The response entity body
 *
 * Usage:
 *   Components.utils.import("resource://echoic/RequestUtils.jsm");
 *   Request.request({ uri: "http://www.google.com" },
 *                   function(error, response, body) {
 *                     if (!error && response.status == 200) {
 *                       // SUCCESS
 *                     }
 *                   });
 */
Request.request = function(options, callback) {
  var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
              .createInstance(Ci.nsIXMLHttpRequest),
      method = options.method || 'GET',
      async = options.hasOwnProperty('async') ? options.async : true,
      // Headers
      headers = options.headers || {},
      // Request body 
      params = options.body;

  // Initialize request
  xhr.open(method, options.uri, async);

  // JSON request body
  if (options.json) {
    headers['content-type'] = 'application/json';
    params = options.json;
  }

  if (params) {
    headers['content-length'] = params.length;
  }

  for (var header in headers) {
    xhr.setRequestHeader(header, headers[header]);
  }

  xhr.onload = xhr.onerror = function(event) {
    var type = options.response_type,
        body = (type && type === 'xml') ?
                 xhr.responseXML : xhr.responseText;

    return callback(event.target.status, xhr, body);
  }

  // Send request
  xhr.send(params);
};