(function() {
'use strict';
function aprelkinoEs3Polyfills() {
if (!Date.now) {
Date.now = function() {
return new Date().getTime();
};
}
if (!Array.isArray) {
  Array.isArray = function(object) {
    return Object.prototype.toString.call(object) == '[object Array]';
  };
}

if (!Object.keys) {
  Object.keys = function(object) {
    var keys = [];
    var key;

    for (key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) keys.push(key);
    }

    return keys;
  };
}
 
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(search, from) {
    var length = this.length >>> 0;
    var i = from || 0;

    if (i < 0) i = Math.max(0, length + i);

    for (; i < length; i++) {
      if (i in this && this[i] === search) return i;
    }

    return -1;
  };
}

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(callback, thisArg) {
    var length = this.length >>> 0;
    var i;

    if (typeof callback != 'function') throw new TypeError('callback must be a function');

    for (i = 0; i < length; i++) {
      if (i in this) callback.call(thisArg, this[i], i, this);
    }
  };
}

if (!Array.prototype.map) {
  Array.prototype.map = function(callback, thisArg) {
     var length = this.length >>> 0;
    var result = new Array(length);
    var i;

    if (typeof callback != 'function') throw new TypeError('callback must be a function');

    for (i = 0; i < length; i++) {
      if (i in this) result[i] = callback.call(thisArg, this[i], i, this);
    }

    return result;
  };
}

if (!Array.prototype.filter) {
  Array.prototype.filter = function(callback, thisArg) {
    var length = this.length >>> 0;
    var result = [];
    var i;

    if (typeof callback != 'function') throw new TypeError('callback must be a function');

    for (i = 0; i < length; i++) {
      if (i in this && callback.call(thisArg, this[i], i, this)) result.push(this[i]);
    }

    return result;
  };
}

if (!Array.prototype.find) {
  Array.prototype.find = function(callback, thisArg) {
    var length = this.length >>> 0;
    var i;
    var value;

    if (typeof callback != 'function') throw new TypeError('callback must be a function');

    for (i = 0; i < length; i++) {
      value = this[i];
      if (callback.call(thisArg, value, i, this)) return value;
    }

    return undefined;
  };
}

if (!Function.prototype.bind) {
  Function.prototype.bind = function(context) {
    var fn = this;
    var preset = Array.prototype.slice.call(arguments, 1);

    return function() {
      return fn.apply(context, preset.concat(Array.prototype.slice.call(arguments)));
    };
  };
}

var root = typeof window != 'undefined' ? window : (typeof global != 'undefined' ? global : null);
if (root && typeof root.Promise == 'undefined') {
  var SimplePromise = function(executor) {
    var self = this;
    self._state = 'pending';
    self._value = null;
    self._handlers = [];

    function settle(state, value) {
      if (self._state != 'pending') return;
      self._state = state;
      self._value = value;
      setTimeout(function() {
        runHandlers(self);
      }, 0);
    }

    function resolve(value) {
      try {
        if (value && typeof value.then == 'function') {
          value.then(resolve, reject);
          return;
        }
      } catch (e) {
        reject(e);
        return;
      }

      settle('fulfilled', value);
    }

    function reject(reason) {
      settle('rejected', reason);
    }

    try {
      executor(resolve, reject);
    } catch (e2) {
      reject(e2);
     }
  };

  var runHandlers = function(promise) {
    var handlers = promise._handlers;
    var handler;
    var callback;
    var result;

    promise._handlers = [];

    while (handlers.length) {
      handler = handlers.shift();
      callback = promise._state == 'fulfilled' ? handler.onFulfilled : handler.onRejected;

      if (typeof callback != 'function') {
        if (promise._state == 'fulfilled') handler.resolve(promise._value);
        else handler.reject(promise._value);
        continue;
      }

      try {
        result = callback(promise._value);
        handler.resolve(result);
      } catch (e) {
        handler.reject(e);
      }
    }
  };

  SimplePromise.prototype.then = function(onFulfilled, onRejected) {
    var self = this;

    return new SimplePromise(function(resolve, reject) {
      self._handlers.push({
        onFulfilled: onFulfilled,
        onRejected: onRejected,
        resolve: resolve,
        reject: reject
      });

      if (self._state != 'pending') {
        setTimeout(function() {
          runHandlers(self);
         }, 0);
      }
    });
  };

  SimplePromise.prototype['catch'] = function(onRejected) {
    return this.then(null, onRejected);
  };

  SimplePromise.resolve = function(value) { 
    return new SimplePromise(function(resolve) {
      resolve(value);
    });
  };

  SimplePromise.reject = function(reason) {
    return new SimplePromise(function(resolve, reject) {
      reject(reason);
    });
  };

  root.Promise = SimplePromise;
}
}
aprelkinoEs3Polyfills();

var aprelkinoHost = (function() {
try {
var src = document.currentScript && document.currentScript.src || '';
if (!src && document.getElementsByTagName) {
var scripts = document.getElementsByTagName('script');
for (var i = scripts.length - 1; i >= 0; i--) {
var scriptSrc = scripts[i].src || '';
if (scriptSrc.indexOf('/m.js') >= 0) {
src = scriptSrc;
break;
}
}
}
var match = src.match(/^(https?:\/\/[^/]+)/i);
if (match) return match[1].replace(/^https:/i, 'http:');
} catch (e) {}
return 'http://showy.online';
})();

var Defined = {
api: 'lampac',
localhost: aprelkinoHost + '/',
apn: ''
};
var balansers_with_search;
var unic_id = Lampa.Storage.get('lampac_unic_id', '');
if (!unic_id) {
unic_id = Lampa.Utils.uid(8).toLowerCase();
Lampa.Storage.set('lampac_unic_id', unic_id);
}
function getAndroidVersion() {
if (Lampa.Platform.is('android')) {
try {
var current = AndroidJS.appVersion().split('-');
return parseInt(current.pop());
} catch (e) {
return 0;
}
} else {
return 0;
}
}
var hostkey = aprelkinoHost.replace('http://', '').replace('https://', '');
if (!window.rch_nws || !window.rch_nws[hostkey]) {
if (!window.rch_nws) window.rch_nws = {};
window.rch_nws[hostkey] = {
type: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : undefined,
startTypeInvoke: false,
rchRegistry: false,
apkVersion: getAndroidVersion()
};
}
window.rch_nws[hostkey].typeInvoke = function rchtypeInvoke(host, call) {
if (!window.rch_nws[hostkey].startTypeInvoke) {
window.rch_nws[hostkey].startTypeInvoke = true;
var check = function check(good) {
  window.rch_nws[hostkey].type = Lampa.Platform.is('android') ? 'apk' : good ? 'cors' : 'web';
  call();
};

if (Lampa.Platform.is('android') || Lampa.Platform.is('tizen')) check(true);
else {
  var net = new Lampa.Reguest();
  net.silent(aprelkinoHost.indexOf(location.host) >= 0 ? 'https://github.com/' : host + '/cors/check', function() {
    check(true);
  }, function() {
    check(false);
  }, false, {
    dataType: 'text'
  });
}
} else call();
};
window.rch_nws[hostkey].Registry = function RchRegistry(client, startConnection) {
window.rch_nws[hostkey].typeInvoke(aprelkinoHost, function() {
client.invoke("RchRegistry", {
  host: location.host,
  rchtype: Lampa.Platform.is('android') ? 'apk' : Lampa.Platform.is('tizen') ? 'cors' : (window.rch_nws[hostkey].type || 'web'),
  apkVersion: Lampa.Platform.is('android') ? (window.rch_nws[hostkey].apkVersion || 0) : 0,
  player: Lampa.Storage.field('player')
});

if (window.rch_nws[hostkey].rchRegistry)
  return;

window.rch_nws[hostkey].rchRegistry = true;

var handled = false;
client.on('RchRegistry', function (clientIp, connectionId, rchtype) {
  if (startConnection && !handled) {
    handled = true;
    startConnection();
  }
});

client.on("RchClient", function(rchId, url, data, headers, returnHeaders) {
  var network = new Lampa.Reguest();
  
  function sendResult(uri, html) {
    $.ajax({
      url: aprelkinoHost + '/rch/' + uri + '?id=' + rchId,
      type: 'POST',
      data: html,
      async: true,
      cache: false,
      contentType: false,
      processData: false,
      success: function(j) { },
      error: function() {
        client.invoke("RchResult", rchId, '');
      }
    });
  }

  function result(html) {
    if (Lampa.Arrays.isObject(html) || Lampa.Arrays.isArray(html)) {
      html = JSON.stringify(html);
    }

    if (typeof CompressionStream !== 'undefined' && html && html.length > 1000) {
      var compressionStream = new CompressionStream('gzip');
      var encoder = new TextEncoder();
      var readable = new ReadableStream({
        start: function(controller) {
          controller.enqueue(encoder.encode(html));
          controller.close();
        }
      });
      var compressedStream = readable.pipeThrough(compressionStream);
      new Response(compressedStream).arrayBuffer()
        .then(function(compressedBuffer) {
          var compressedArray = new Uint8Array(compressedBuffer);
          if (compressedArray.length > html.length) {
            sendResult('result', html);
          } else {
            sendResult('gzresult', compressedArray);
          }
        })
        ["catch"](function() {
          sendResult('result', html);
        });

    } else {
      sendResult('result', html);
    }
  }

  if (url == 'eval') {
    console.log('RCH', url, data);
    result(eval(data));
  } else if (url == 'evalrun') {
    console.log('RCH', url, data);
    eval(data);
  } else if (url == 'ping') {
    result('pong');
  } else {
    console.log('RCH', url);
    network["native"](url, result, function(e) {
      console.log('RCH', 'result empty, ' + e.status);
      result('');
    }, data, {
      dataType: 'text',
      timeout: 1000 * 8,
      headers: headers,
      returnHeaders: returnHeaders
    });
  }
});

client.on('Connected', function(connectionId) {
  console.log('RCH', 'ConnectionId: ' + connectionId);
  window.rch_nws[hostkey].connectionId = connectionId;
});
client.on('Closed', function() {
  console.log('RCH', 'Connection closed');
});
client.on('Error', function(err) {
  console.log('RCH', 'error:', err);
});
});
};
window.rch_nws[hostkey].typeInvoke(aprelkinoHost, function() {});
function rchInvoke(json, call) {
if (!window.nwsClient)
window.nwsClient = {};
var client = window.nwsClient[hostkey];
if (client && client.connectionId != null) {
  call();
}
else if (client) {
  console.log('RCH', 'Reconnecting...');
  client.reconnect(function() {
    call();
  });
}
else {
  window.nwsClient[hostkey] = new NativeWsClient(json.nws, {
    autoReconnect: true
  });

  window.nwsClient[hostkey].on('Connected', function(connectionId) {
    window.rch_nws[hostkey].Registry(window.nwsClient[hostkey], function() {
      call();
    });
  });

  window.nwsClient[hostkey].connect();
}
}
function rchRun(json, call) {
if (typeof NativeWsClient == 'undefined') {
Lampa.Utils.putScript([aprelkinoHost + "/js/nws-client-es5.js?v21042026"], function() {}, false, function() {
rchInvoke(json, call);
}, true);
} else {
rchInvoke(json, call);
}
}
function account(url) {
url = url + '';
if (url.indexOf('account_email=') == -1) {
var email = Lampa.Storage.get('account_email');
if (email) url = Lampa.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
}
if (url.indexOf('uid=') == -1) {
var uid = Lampa.Storage.get('lampac_unic_id', '');
if (uid) url = Lampa.Utils.addUrlComponent(url, 'uid=' + encodeURIComponent(uid));
}
if (url.indexOf('token=') == -1) {
var token = '';
if (token != '') url = Lampa.Utils.addUrlComponent(url, 'token=');
}
if (url.indexOf('nws_id=') == -1) {
var nws_id = Lampa.Storage.get('lampac_nws_id', '');
if (nws_id) url = Lampa.Utils.addUrlComponent(url, 'nws_id=' + encodeURIComponent(nws_id));
}
return url;
}

function addHeaders() {
var kit_aesgcmkey = Lampa.Storage.get('kit_aesgcmkey', '');
if (kit_aesgcmkey) return { 'X-Kit-AesGcm': Lampa.Storage.get('kit_aesgcmkey', '') };
return {};
}
function formatEpisodeNumber(episodeNumber) {
return (episodeNumber < 10 ? '0' : '') + episodeNumber;
}
var Network = Lampa.Reguest;
function component(object) {
var network = new Network();
var scroll = new Lampa.Scroll({
mask: true,
over: true
});
var files = new Lampa.Explorer(object);
var filter = new Lampa.Filter(object);
var sources = {};
var last;
var source;
var balanser;
var initialized;
var balanser_timer;
var images = [];
var number_of_requests = 0;
var number_of_requests_timer;
var life_wait_times = 0;
var life_wait_timer;
var filter_sources = {};
var filter_translate = {
season: Lampa.Lang.translate('torrent_serial_season'),
voice: Lampa.Lang.translate('torrent_parser_voice'),
source: Lampa.Lang.translate('settings_rest_source')
};
var filter_find = {
season: [],
voice: []
};
if (balansers_with_search == undefined) {
  network.timeout(10000);
  network.silent(account(aprelkinoHost + '/lite/withsearch'), function(json) {
    balansers_with_search = json; 
  }, function() {
	  balansers_with_search = [];
  });
}

function balanserName(j) {
  var bals = j.balanser;
  var name = j.name.split(' ')[0];
  return (bals || name).toLowerCase();
}

function clarificationSearchAdd(value){
	var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
	var all = Lampa.Storage.get('clarification_search','{}');
	
	all[id] = value;
	
	Lampa.Storage.set('clarification_search',all);
}

function clarificationSearchDelete(){
	var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
	var all = Lampa.Storage.get('clarification_search','{}');
	
	delete all[id];
	
	Lampa.Storage.set('clarification_search',all);
}

function clarificationSearchGet(){
	var id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
	var all = Lampa.Storage.get('clarification_search','{}');
	
	return all[id];
}

this.initialize = function() {
  var _this = this;
  this.loading(true);
  filter.onSearch = function(value) {
	clarificationSearchAdd(value);
    Lampa.Activity.replace({
      search: value,
      clarification: true,
      similar: true
    });
  }; 
  filter.onBack = function() {
    _this.start();
  };
  filter.render().find('.selector').on('hover:enter', function() {
    clearInterval(balanser_timer);
  });
  filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
  filter.onSelect = function(type, a, b) {
    if (type == 'filter') {
      if (a.reset) {
		  clarificationSearchDelete();
        _this.replaceChoice({
          season: 0,
          voice: 0,
          voice_url: '',
          voice_name: ''
        });
        setTimeout(function() {
          Lampa.Select.close();
          Lampa.Activity.replace({
			  clarification: 0,
			  similar: 0
		  });
        }, 10);
      } else {
        var url = filter_find[a.stype][b.index].url;
        var choice = _this.getChoice();
        if (a.stype == 'voice') {
          choice.voice_name = filter_find.voice[b.index].title;
          choice.voice_url = url;
        }
        choice[a.stype] = b.index;
        _this.saveChoice(choice);
        _this.reset();
        _this.request(url);
        setTimeout(Lampa.Select.close, 10);
      }
    } else if (type == 'sort') {
      Lampa.Select.close();
      object.lampac_custom_select = a.source;
      _this.changeBalanser(a.source);
    }
  };
   if (filter.addButtonBack) filter.addButtonBack();
  filter.render().find('.filter--sort span').text(Lampa.Lang.translate('lampac_balanser'));
  scroll.body().addClass('torrent-list');
  files.appendFiles(scroll.render());
  files.appendHead(filter.render());
  scroll.minus(files.render().find('.explorer__files-head'));
  scroll.body().append(Lampa.Template.get('lampac_content_loading'));
  Lampa.Controller.enable('content');
  this.loading(false);
  if(object.balanser){
	  files.render().find('.filter--search').remove();
	  sources = {};
	  sources[object.balanser] = {name: object.balanser};
	  balanser = object.balanser;
	  filter_sources = [];
	  
	  return network["native"](account(object.url.replace('rjson=','nojson=')), this.parse.bind(this), function(){
		  files.render().find('.torrent-filter').remove();
		  _this.empty();
	  }, false, {
         dataType: 'text',
		headers: addHeaders()
	  });
  } 
  this.externalids().then(function() {
    return _this.createSource();
  }).then(function(json) {
    if (!balansers_with_search.find(function(b) {
        return balanser.slice(0, b.length) == b;
      })) {
      filter.render().find('.filter--search').addClass('hide');
    }
    _this.search();
  })["catch"](function(e) {
    _this.noConnectToServer(e);
  });
};
this.rch = function(json, noreset) {
  var _this2 = this;
  rchRun(json, function() {
    if (!noreset) _this2.find();
     else noreset();
  });
};
this.externalids = function() {
  return new Promise(function(resolve, reject) {
    if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
      var query = [];
      query.push('id=' + encodeURIComponent(object.movie.id));
      query.push('serial=' + (object.movie.name ? 1 : 0));
      if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
      if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
      var url = Defined.localhost + 'externalids?' + query.join('&');
      network.timeout(10000);
      network.silent(account(url), function(json) {
        for (var name in json) {
          object.movie[name] = json[name];
        }
         resolve();
      }, function() {
        resolve();
      }, false, {
          headers: addHeaders()
	  });
    } else resolve();
  });
};
this.updateBalanser = function(balanser_name) {
  var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
  last_select_balanser[object.movie.id] = balanser_name;
  Lampa.Storage.set('online_last_balanser', last_select_balanser);
};
this.changeBalanser = function(balanser_name) {
  this.updateBalanser(balanser_name);
  Lampa.Storage.set('online_balanser', balanser_name); 
  var to = this.getChoice(balanser_name);
  var from = this.getChoice();
  if (from.voice_name) to.voice_name = from.voice_name;
  this.saveChoice(to, balanser_name);
  Lampa.Activity.replace();
};
this.requestParams = function(url) {
  var query = [];
  var card_source = object.movie.source || 'tmdb'; 
  query.push('id=' + encodeURIComponent(object.movie.id));

  if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
  if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
  if (object.movie.tmdb_id) query.push('tmdb_id=' + (object.movie.tmdb_id || ''));

  if (object.movie.keywords && object.movie.keywords.results) {
     for (var i = 0, a = object.movie.keywords.results; i < a.length; i++) {
        if (a[i].name == 'anime') {
            query.push('anime=1');
            break;
        }
     }
  }

  query.push('title=' + encodeURIComponent(object.clarification ? object.search : object.movie.title || object.movie.name));
  query.push('original_title=' + encodeURIComponent(object.movie.original_title || object.movie.original_name));
  query.push('serial=' + (object.movie.name ? 1 : 0));
  query.push('original_language=' + (object.movie.original_language || ''));
  query.push('year=' + ((object.movie.release_date || object.movie.first_air_date || '0000') + '').slice(0, 4));
  query.push('source=' + card_source);
  query.push('clarification=' + (object.clarification ? 1 : 0));
   query.push('similar=' + (object.similar ? true : false));
  query.push('rchtype=' + (((window.rch_nws && window.rch_nws[hostkey]) ? window.rch_nws[hostkey].type : (window.rch && window.rch[hostkey]) ? window.rch[hostkey].type : '') || ''));
  if (Lampa.Storage.get('account_email', '')) query.push('cub_id=' + Lampa.Utils.hash(Lampa.Storage.get('account_email', '')));
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
};
this.getLastChoiceBalanser = function() {
  var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
  if (last_select_balanser[object.movie.id]) { 
    return last_select_balanser[object.movie.id];
  } else {
    return Lampa.Storage.get('online_balanser', filter_sources.length ? filter_sources[0] : '');
  }
};
this.startSource = function(json) {
  return new Promise(function(resolve, reject) {
    json.forEach(function(j) {
      var name = balanserName(j);
      sources[name] = {
        url: j.url,
         name: j.name,
        show: typeof j.show == 'undefined' ? true : j.show
      };
    });
    filter_sources = Lampa.Arrays.getKeys(sources);
    if (filter_sources.length) {
      var last_select_balanser = Lampa.Storage.cache('online_last_balanser', 3000, {});
      if (last_select_balanser[object.movie.id]) {
        balanser = last_select_balanser[object.movie.id];
      } else {
        balanser = Lampa.Storage.get('online_balanser', filter_sources[0]);
      }
      if (!sources[balanser]) balanser = filter_sources[0];
       if (!sources[balanser].show && !object.lampac_custom_select) balanser = filter_sources[0];
      source = sources[balanser].url;
      Lampa.Storage.set('active_balanser', balanser);
      resolve(json);
    } else {
      reject();
    }
  });
};
this.lifeSource = function() {
  var _this3 = this;
  return new Promise(function(resolve, reject) {
    var url = _this3.requestParams(Defined.localhost + 'lifeevents?memkey=' + (_this3.memkey || ''));
    var red = false;
    var gou = function gou(json, any) {
      if (json.accsdb) return reject(json);
      var last_balanser = _this3.getLastChoiceBalanser();
      if (!red) {
        var _filter = json.online.filter(function(c) {
          return any ? c.show : c.show && c.name.toLowerCase() == last_balanser;
        });
        if (_filter.length) {
          red = true;
          resolve(json.online.filter(function(c) {
            return c.show;
          }));
        } else if (any) {
          reject();
        }
      }
    };
    var fin = function fin(call) {
      network.timeout(3000);
      network.silent(account(url), function(json) {
        life_wait_times++;
        filter_sources = [];
        sources = {};
        json.online.forEach(function(j) {
          var name = balanserName(j);
          sources[name] = {
            url: j.url,
            name: j.name,
            show: typeof j.show == 'undefined' ? true : j.show
          };
        });
        filter_sources = Lampa.Arrays.getKeys(sources);
        filter.set('sort', filter_sources.map(function(e) {
          return {
            title: sources[e].name,
            source: e,
            selected: e == balanser,
            ghost: !sources[e].show
          };
        }));
        filter.chosen('sort', [sources[balanser] ? sources[balanser].name : balanser]);
        gou(json);
        var lastb = _this3.getLastChoiceBalanser();
        if (life_wait_times > 15 || json.ready) {
          filter.render().find('.lampac-balanser-loader').remove();
          gou(json, true);
        } else if (!red && sources[lastb] && sources[lastb].show) {
          gou(json, true);
          life_wait_timer = setTimeout(fin, 1000);
        } else {
          life_wait_timer = setTimeout(fin, 1000);
        } 
      }, function() {
        life_wait_times++;
        if (life_wait_times > 15) {
          reject();
        } else {
          life_wait_timer = setTimeout(fin, 1000);
        }
      }, false, {
          headers: addHeaders()
	  });
    };
    fin(); 
  });
};
this.createSource = function() {
  var _this4 = this;
  return new Promise(function(resolve, reject) {
    var url = _this4.requestParams(Defined.localhost + 'lite/events?life=true');
    network.timeout(15000);
    network.silent(account(url), function(json) {
      if (json.accsdb) return reject(json);
      if (json.life) {
		_this4.memkey = json.memkey;
		if (json.title) {
          if (object.movie.name) object.movie.name = json.title;
          if (object.movie.title) object.movie.title = json.title;
		}
        filter.render().find('.filter--sort').append('<span class="lampac-balanser-loader" style="width: 1.2em; height: 1.2em; margin-top: 0; background: url(./img/loader.svg) no-repeat 50% 50%; background-size: contain; margin-left: 0.5em"></span>');
        _this4.lifeSource().then(_this4.startSource).then(resolve)["catch"](reject);
      } else {
        _this4.startSource(json).then(resolve)["catch"](reject);
      }
    }, reject, false, {
        headers: addHeaders()
	  });
  });
};
this.create = function() {
  return this.render();
};
this.search = function() { 
  this.filter({
    source: filter_sources
  }, this.getChoice());
  this.find();
};
this.find = function() {
  this.request(this.requestParams(source));
};
this.request = function(url) {
  number_of_requests++;
  if (number_of_requests < 10) {
    network["native"](account(url), this.parse.bind(this), this.doesNotAnswer.bind(this), false, {
      dataType: 'text',
	  headers: addHeaders()
    });
    clearTimeout(number_of_requests_timer); 
    number_of_requests_timer = setTimeout(function() {
      number_of_requests = 0;
    }, 4000);
  } else this.empty();
};
this.parseJsonDate = function(str, name) {
  try {
     var html = $('<div>' + str + '</div>');
    var elems = [];
    html.find(name).each(function() {
      var item = $(this);
      var data = JSON.parse(item.attr('data-json'));
      var season = item.attr('s');
       var episode = item.attr('e');
      var text = item.text();
      if (!object.movie.name) {
        if (text.match(/\d+p/i)) {
          if (!data.quality) {
            data.quality = {};
            data.quality[text] = data.url;
          }
          text = object.movie.title;
        }
        if (text == 'По умолчанию') {
          text = object.movie.title;
        }
      }
      if (episode) data.episode = parseInt(episode);
      if (season) data.season = parseInt(season);
      if (text) data.text = text;
       data.active = item.hasClass('active');
      elems.push(data);
    });
    return elems;
  } catch (e) {
    return [];
  }
};
this.getFileUrl = function(file, call, waiting_rch) {
  var _this = this;
  
  if(Lampa.Storage.field('player') !== 'inner' && file.stream && Lampa.Platform.is('apple')){
	  var newfile = Lampa.Arrays.clone(file);
	  newfile.method = 'play';
	  newfile.url = file.stream;
	  call(newfile, {});
  }
  else if (file.method == 'play') call(file, {});
  else {
    Lampa.Loading.start(function() {
      Lampa.Loading.stop();
      Lampa.Controller.toggle('content');
      network.clear();
    });
    network["native"](account(file.url), function(json) {
		if(json.rch){
			if(waiting_rch) {
				waiting_rch = false;
				Lampa.Loading.stop();
				call(false, {});
			}
			else {
				_this.rch(json,function(){
					Lampa.Loading.stop();
					_this.getFileUrl(file, call, true);
				});
			}
		}
		else{
			Lampa.Loading.stop();
			call(json, json);
		}
    }, function() {
      Lampa.Loading.stop();
      call(false, {});
    }, false, {
        headers: addHeaders()
	  });
  }
};
this.toPlayElement = function(file) {
  var play = {
    title: file.title,
    url: file.url,
    quality: file.qualitys,
    timeline: file.timeline,
    subtitles: file.subtitles,
	segments: file.segments,
    callback: file.mark,
	season: file.season,
	episode: file.episode,
	voice_name: file.voice_name,
	thumbnail: file.thumbnail
  };
  return play;
};
this.orUrlReserve = function(data) {
  if (data.url && typeof data.url == 'string' && data.url.indexOf(" or ") !== -1) {
    var urls = data.url.split(" or ");
    data.url = urls[0];
    data.url_reserve = urls[1];
  }
};
this.setDefaultQuality = function(data) {
  if (Lampa.Arrays.getKeys(data.quality).length) {
    for (var q in data.quality) {
      if (parseInt(q) == Lampa.Storage.field('video_quality_default')) {
        data.url = data.quality[q];
        this.orUrlReserve(data);
      }
      if (data.quality[q].indexOf(" or ") !== -1)
        data.quality[q] = data.quality[q].split(" or ")[0];
    }
  }
};
this.display = function(videos) {
  var _this5 = this;
  this.draw(videos, {
    onEnter: function onEnter(item, html) {
      _this5.getFileUrl(item, function(json, json_call) {
        if (json && json.url) {
          var playlist = [];
          var first = _this5.toPlayElement(item);
          first.url = json.url;
          first.headers = json_call.headers || json.headers;
          first.quality = json_call.quality || item.qualitys;
		  first.segments = json_call.segments || item.segments;
          first.hls_manifest_timeout = json_call.hls_manifest_timeout || json.hls_manifest_timeout;
          first.subtitles = json.subtitles;
		  first.subtitles_call = json_call.subtitles_call || json.subtitles_call;
		  if (json.vast && json.vast.url) {
            first.vast_url = json.vast.url;
            first.vast_msg = json.vast.msg;
            first.vast_region = json.vast.region;
            first.vast_platform = json.vast.platform;
            first.vast_screen = json.vast.screen;
		  }
          _this5.orUrlReserve(first);
          _this5.setDefaultQuality(first);
          if (item.season) {
            videos.forEach(function(elem) {
              var cell = _this5.toPlayElement(elem);
              if (elem == item) cell.url = json.url;
               else {
                if (elem.method == 'call') {
                  if (Lampa.Storage.field('player') !== 'inner') {
                    cell.url = elem.stream;
					delete cell.quality;
                  } else {
                    cell.url = function(call) {
                      _this5.getFileUrl(elem, function(stream, stream_json) {
                         if (stream.url) {
                          cell.url = stream.url;
                          cell.quality = stream_json.quality || elem.qualitys;
						  cell.segments = stream_json.segments || elem.segments;
                          cell.subtitles = stream.subtitles;
                          _this5.orUrlReserve(cell);
                          _this5.setDefaultQuality(cell);
                          elem.mark();
                        } else {
                          cell.url = '';
                          Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
                        }
                        call();
                      }, function() {
                        cell.url = '';
                         call();
                      });
                    };
                  }
                } else {
                  cell.url = elem.url;
                } 
              }
              _this5.orUrlReserve(cell);
              _this5.setDefaultQuality(cell);
              playlist.push(cell);
            }); 
          } else {
            playlist.push(first);
          }
          if (playlist.length > 1) first.playlist = playlist;
          if (first.url) {
            var element = first;
			element.isonline = true;
            
            Lampa.Player.play(element);
             Lampa.Player.playlist(playlist);
			if(element.subtitles_call) _this5.loadSubtitles(element.subtitles_call)
            item.mark();
            _this5.updateBalanser(balanser);
          } else {
            Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
          }
        } else Lampa.Noty.show(Lampa.Lang.translate('lampac_nolink'));
      }, true);
    },
    onContextMenu: function onContextMenu(item, html, data, call) {
      _this5.getFileUrl(item, function(stream) {
        call({
          file: stream.url,
           quality: item.qualitys
        });
      }, true);
    }
  });
  this.filter({
    season: filter_find.season.map(function(s) {
      return s.title;
    }),
    voice: filter_find.voice.map(function(b) {
      return b.title;
    })
  }, this.getChoice());
};
this.loadSubtitles = function(link){
	network.silent(account(link), function(subs){
		Lampa.Player.subtitles(subs)
	}, function() {},false, {
        headers: addHeaders()
	  })
}
this.parse = function(str) {
  var json = Lampa.Arrays.decodeJson(str, {});
  if (Lampa.Arrays.isObject(str) && str.rch) json = str;
  if (json.rch) return this.rch(json);
  try {
    var items = this.parseJsonDate(str, '.videos__item');
    var buttons = this.parseJsonDate(str, '.videos__button');
    if (items.length == 1 && items[0].method == 'link' && !items[0].similar) {
      filter_find.season = items.map(function(s) {
        return {
          title: s.text,
          url: s.url
        };
      });
      this.replaceChoice({
        season: 0
      });
      this.request(items[0].url);
    } else {
      this.activity.loader(false);
      var videos = items.filter(function(v) {
        return v.method == 'play' || v.method == 'call';
      });
      var similar = items.filter(function(v) {
        return v.similar;
      });
      if (videos.length) {
        if (buttons.length) {
          filter_find.voice = buttons.map(function(b) {
            return {
              title: b.text,
              url: b.url
            };
          });
          var select_voice_url = this.getChoice(balanser).voice_url;
          var select_voice_name = this.getChoice(balanser).voice_name;
          var find_voice_url = buttons.find(function(v) {
            return v.url == select_voice_url;
          });
          var find_voice_name = buttons.find(function(v) {
            return v.text == select_voice_name;
           });
          var find_voice_active = buttons.find(function(v) {
            return v.active;
          }); 
          if (find_voice_url && !find_voice_url.active) {
            this.replaceChoice({
              voice: buttons.indexOf(find_voice_url),
              voice_name: find_voice_url.text
            });
            this.request(find_voice_url.url);
          } else if (find_voice_name && !find_voice_name.active) {
            this.replaceChoice({
              voice: buttons.indexOf(find_voice_name),
              voice_name: find_voice_name.text
            });
            this.request(find_voice_name.url);
          } else {
            if (find_voice_active) {
               this.replaceChoice({
                voice: buttons.indexOf(find_voice_active),
                voice_name: find_voice_active.text
              });
            }
             this.display(videos);
          }
        } else {
          this.replaceChoice({
            voice: 0,
            voice_url: '',
            voice_name: ''
          });
           this.display(videos);
        }
      } else if (items.length) {
        if (similar.length) {
          this.similars(similar);
          this.activity.loader(false);
        } else { 
          filter_find.season = items.map(function(s) {
            return {
              title: s.text,
              url: s.url
            };
          });
          var select_season = this.getChoice(balanser).season;
          var season = filter_find.season[select_season];
          if (!season) season = filter_find.season[0];
          this.request(season.url);
        }
      } else {
        this.doesNotAnswer(json);
      }
    }
   } catch (e) {
    this.doesNotAnswer(e);
  }
};
this.similars = function(json) {
  var _this6 = this;
  scroll.clear();
  json.forEach(function(elem) {
    elem.title = elem.text;
    elem.info = '';
    var info = [];
    var year = ((elem.start_date || elem.year || object.movie.release_date || object.movie.first_air_date || '') + '').slice(0, 4);
    if (year) info.push(year);
    if (elem.details) info.push(elem.details);
    var name = elem.title || elem.text;
    elem.title = name; 
    elem.time = elem.time || '';
    elem.info = info.join('<span class="online-prestige-split">●</span>');
    var item = Lampa.Template.get('lampac_prestige_folder', elem);
	if (elem.img) {
	  var image = $('<img style="height: 7em; width: 7em; border-radius: 0.3em;"/>');
	  item.find('.online-prestige__folder').empty().append(image);

	  if (elem.img !== undefined) {
	    if (elem.img.charAt(0) === '/')
	      elem.img = Defined.localhost + elem.img.substring(1);
	    if (elem.img.indexOf('/proxyimg') !== -1)
	      elem.img = account(elem.img);
	  }

	  Lampa.Utils.imgLoad(image, elem.img);
	}
    item.on('hover:enter', function() {
      _this6.reset();
      _this6.request(elem.url);
    }).on('hover:focus', function(e) {
      last = e.target;
      scroll.update($(e.target), true);
    });
     scroll.append(item);
  });
  this.filter({
    season: filter_find.season.map(function(s) {
      return s.title;
    }),
    voice: filter_find.voice.map(function(b) {
      return b.title;
    })
  }, this.getChoice());
  Lampa.Controller.enable('content');
};
this.getChoice = function(for_balanser) {
  var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
  var save = data[object.movie.id] || {};
  Lampa.Arrays.extend(save, {
    season: 0,
    voice: 0,
    voice_name: '',
    voice_id: 0,
     episodes_view: {},
    movie_view: ''
  });
  return save;
};
this.saveChoice = function(choice, for_balanser) {
  var data = Lampa.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
  data[object.movie.id] = choice;
  Lampa.Storage.set('online_choice_' + (for_balanser || balanser), data);
  this.updateBalanser(for_balanser || balanser);
};
this.replaceChoice = function(choice, for_balanser) {
  var to = this.getChoice(for_balanser);
  Lampa.Arrays.extend(to, choice, true);
  this.saveChoice(to, for_balanser);
}; 
this.clearImages = function() {
  images.forEach(function(img) {
    img.onerror = function() {};
    img.onload = function() {};
    img.src = '';
  });
  images = [];
};
this.reset = function() {
  last = false;
  clearInterval(balanser_timer);
  network.clear();
  this.clearImages();
  scroll.render().find('.empty').remove();
  scroll.clear();
  scroll.reset();
  scroll.body().append(Lampa.Template.get('lampac_content_loading'));
};
this.loading = function(status) {
  if (status) this.activity.loader(true);
  else {
    this.activity.loader(false);
    this.activity.toggle();
  }
};
this.filter = function(filter_items, choice) {
  var _this7 = this;
  var select = [];
  var add = function add(type, title) {
    var need = _this7.getChoice();
    var items = filter_items[type];
    var subitems = [];
    var value = need[type];
    items.forEach(function(name, i) {
      subitems.push({
        title: name,
        selected: value == i,
         index: i
      });
    });
    select.push({
      title: title,
      subtitle: items[value],
      items: subitems,
      stype: type
    });
  };
  filter_items.source = filter_sources;
  select.push({
    title: Lampa.Lang.translate('torrent_parser_reset'),
    reset: true
  });
  this.saveChoice(choice);
  if (filter_items.voice && filter_items.voice.length) add('voice', Lampa.Lang.translate('torrent_parser_voice'));
  if (filter_items.season && filter_items.season.length) add('season', Lampa.Lang.translate('torrent_serial_season'));
  filter.set('filter', select);
  filter.set('sort', filter_sources.map(function(e) {
     return {
      title: sources[e].name,
      source: e,
      selected: e == balanser,
      ghost: !sources[e].show
    };
  }));
  this.selected(filter_items);
};
this.selected = function(filter_items) {
  var need = this.getChoice(),
    select = [];
  for (var i in need) {
    if (filter_items[i] && filter_items[i].length) {
      if (i == 'voice') {
        select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
      } else if (i !== 'source') {
        if (filter_items.season.length >= 1) {
          select.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
        }
      }
    }
  }
  filter.chosen('filter', select);
  filter.chosen('sort', [sources[balanser].name]);
};
this.getEpisodes = function(season, call) {
  var episodes = [];
  var tmdb_id = object.movie.id;
  if (['cub', 'tmdb'].indexOf(object.movie.source || 'tmdb') == -1) 
    tmdb_id = object.movie.tmdb_id;
  if (typeof tmdb_id == 'number' && object.movie.name) {
	  Lampa.Api.sources.tmdb.get('tv/' + tmdb_id + '/season/' + season, {}, function(data){
		  episodes = data.episodes || [];
		  call(episodes);
	  }, function(){
		  call(episodes);
	  })
  } else call(episodes);
};
this.watched = function(set) {
  var file_id = Lampa.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
  var watched = Lampa.Storage.cache('online_watched_last', 5000, {});
  if (set) {
    if (!watched[file_id]) watched[file_id] = {};
    Lampa.Arrays.extend(watched[file_id], set, true);
    Lampa.Storage.set('online_watched_last', watched);
    this.updateWatched();
  } else {
    return watched[file_id];
  }
};
this.updateWatched = function() {
  var watched = this.watched();
  var body = scroll.body().find('.online-prestige-watched .online-prestige-watched__body').empty();
  if (watched) {
     var line = [];
    if (watched.balanser_name) line.push(watched.balanser_name);
    if (watched.voice_name) line.push(watched.voice_name);
    if (watched.season) line.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + watched.season);
    if (watched.episode) line.push(Lampa.Lang.translate('torrent_serial_episode') + ' ' + watched.episode);
    line.forEach(function(n) {
      body.append('<span>' + n + '</span>');
    });
  } else body.append('<span>' + Lampa.Lang.translate('lampac_no_watch_history') + '</span>');
};
this.draw = function(items) {
  var _this8 = this;
  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (!items.length) return this.empty();
  scroll.clear();
  if(!object.balanser)scroll.append(Lampa.Template.get('lampac_prestige_watched', {}));
  this.updateWatched();
  this.getEpisodes(items[0].season, function(episodes) {
    var viewed = Lampa.Storage.cache('online_view', 5000, []);
    var serial = object.movie.name ? true : false;
    var choice = _this8.getChoice();
    var fully = window.innerWidth > 480;
    var scroll_to_element = false;
    var scroll_to_mark = false;
    items.forEach(function(element, index) {
      var episode = serial && episodes.length && !params.similars ? episodes.find(function(e) {
        return e.episode_number == element.episode;
      }) : false;
      var episode_num = element.episode || index + 1;
      var episode_last = choice.episodes_view[element.season];
      var voice_name = choice.voice_name || (filter_find.voice[0] ? filter_find.voice[0].title : false) || element.voice_name || (serial ? 'Неизвестно' : element.text) || 'Неизвестно';
      if (element.quality) {
        element.qualitys = element.quality;
        element.quality = Lampa.Arrays.getKeys(element.quality)[0];
      }
      Lampa.Arrays.extend(element, {
        voice_name: voice_name,
        info: voice_name.length > 60 ? voice_name.substr(0, 60) + '...' : voice_name,
        quality: '',
        time: Lampa.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true)
       });
      var hash_timeline = Lampa.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title].join('') : object.movie.original_title);
      var hash_behold = Lampa.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title, element.voice_name].join('') : object.movie.original_title + element.voice_name);
      var data = {
        hash_timeline: hash_timeline,
        hash_behold: hash_behold
      };
      var info = [];
      if (element.season) {
        element.translate_episode_end = _this8.getLastEpisode(items);
        element.translate_voice = element.voice_name;
      }
      if (element.text && !episode) element.title = element.text;
      element.timeline = Lampa.Timeline.view(hash_timeline);
      if (episode) {
        element.title = episode.name;
        if (element.info.length < 30 && episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', {
          rate: parseFloat(episode.vote_average + '').toFixed(1)
        }, true));
        if (episode.air_date && fully) info.push(Lampa.Utils.parseTime(episode.air_date).full);
      } else if (object.movie.release_date && fully) {
        info.push(Lampa.Utils.parseTime(object.movie.release_date).full);
      }
      if (!serial && object.movie.tagline && element.info.length < 30) info.push(object.movie.tagline);
      if (element.info) info.push(element.info);
      if (info.length) element.info = info.map(function(i) {
        return '<span>' + i + '</span>';
      }).join('<span class="online-prestige-split">●</span>');
      var html = Lampa.Template.get('lampac_prestige_full', element);
      var loader = html.find('.online-prestige__loader');
      var image = html.find('.online-prestige__img');
	  if(object.balanser) image.hide();
      if (!serial) {
        if (choice.movie_view == hash_behold) scroll_to_element = html;
      } else if (typeof episode_last !== 'undefined' && episode_last == episode_num) {
        scroll_to_element = html;
      }
      if (serial && !episode) {
        image.append('<div class="online-prestige__episode-number">' + formatEpisodeNumber(element.episode || index + 1) + '</div>');
        loader.remove();
      }
	  else if (!serial && object.movie.backdrop_path == 'undefined') loader.remove();
      else {
        var img = html.find('img')[0];
        img.onerror = function() {
          img.src = './img/img_broken.svg';
        };
        img.onload = function() {
          image.addClass('online-prestige__img--loaded');
          loader.remove();
          if (serial) image.append('<div class="online-prestige__episode-number">' + formatEpisodeNumber(element.episode || index + 1) + '</div>');
        };
        img.src = Lampa.TMDB.image('t/p/w300' + (episode ? episode.still_path : object.movie.backdrop_path));
        images.push(img);
		element.thumbnail = img.src
      }
      html.find('.online-prestige__timeline').append(Lampa.Timeline.render(element.timeline));
      if (viewed.indexOf(hash_behold) !== -1) {
        scroll_to_mark = html;
        html.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
      }
      element.mark = function() {
        viewed = Lampa.Storage.cache('online_view', 5000, []);
        if (viewed.indexOf(hash_behold) == -1) {
          viewed.push(hash_behold);
          Lampa.Storage.set('online_view', viewed);
          if (html.find('.online-prestige__viewed').length == 0) {
            html.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
          }
        }
        choice = _this8.getChoice();
        if (!serial) {
          choice.movie_view = hash_behold;
        } else {
          choice.episodes_view[element.season] = episode_num;
        }
        _this8.saveChoice(choice);
        var voice_name_text = choice.voice_name || element.voice_name || element.title;
        if (voice_name_text.length > 30) voice_name_text = voice_name_text.slice(0, 30) + '...';
        _this8.watched({
          balanser: balanser,
          balanser_name: Lampa.Utils.capitalizeFirstLetter(sources[balanser] ? sources[balanser].name.split(' ')[0] : balanser),
          voice_id: choice.voice_id,
          voice_name: voice_name_text,
          episode: element.episode,
           season: element.season
        });
      };
      element.unmark = function() {
        viewed = Lampa.Storage.cache('online_view', 5000, []);
        if (viewed.indexOf(hash_behold) !== -1) {
          Lampa.Arrays.remove(viewed, hash_behold);
          Lampa.Storage.set('online_view', viewed);
          Lampa.Storage.remove('online_view', hash_behold);
          html.find('.online-prestige__viewed').remove();
        }
      };
      element.timeclear = function() {
        element.timeline.percent = 0;
        element.timeline.time = 0;
        element.timeline.duration = 0;
        Lampa.Timeline.update(element.timeline);
      };
      html.on('hover:enter', function() {
        if (object.movie.id) Lampa.Favorite.add('history', object.movie, 100);
        if (params.onEnter) params.onEnter(element, html, data);
      }).on('hover:focus', function(e) {
        last = e.target;
        if (params.onFocus) params.onFocus(element, html, data);
        scroll.update($(e.target), true);
      });
      if (params.onRender) params.onRender(element, html, data);
      _this8.contextMenu({
        html: html,
        element: element,
        onFile: function onFile(call) {
          if (params.onContextMenu) params.onContextMenu(element, html, data, call);
        },
        onClearAllMark: function onClearAllMark() {
          items.forEach(function(elem) {
            elem.unmark();
          });
        },
         onClearAllTime: function onClearAllTime() {
          items.forEach(function(elem) {
            elem.timeclear();
          });
        }
      });
      scroll.append(html);
    });
    if (serial && episodes.length > items.length && !params.similars) {
      var left = episodes.slice(items.length);
      left.forEach(function(episode) {
        var info = [];
        if (episode.vote_average) info.push(Lampa.Template.get('lampac_prestige_rate', {
          rate: parseFloat(episode.vote_average + '').toFixed(1)
        }, true));
        if (episode.air_date) info.push(Lampa.Utils.parseTime(episode.air_date).full);
        var air = new Date((episode.air_date + '').replace(/-/g, '/'));
        var now = Date.now();
        var day = Math.round((air.getTime() - now) / (24 * 60 * 60 * 1000));
        var txt = Lampa.Lang.translate('full_episode_days_left') + ': ' + day;
        var html = Lampa.Template.get('lampac_prestige_full', {
           time: Lampa.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true),
          info: info.length ? info.map(function(i) {
            return '<span>' + i + '</span>';
          }).join('<span class="online-prestige-split">●</span>') : '',
          title: episode.name,
          quality: day > 0 ? txt : ''
        });
        var loader = html.find('.online-prestige__loader');
        var image = html.find('.online-prestige__img');
        var season = items[0] ? items[0].season : 1;
        html.find('.online-prestige__timeline').append(Lampa.Timeline.render(Lampa.Timeline.view(Lampa.Utils.hash([season, episode.episode_number, object.movie.original_title].join('')))));
        var img = html.find('img')[0];
        if (episode.still_path) {
          img.onerror = function() {
            img.src = './img/img_broken.svg';
          };
          img.onload = function() {
            image.addClass('online-prestige__img--loaded');
            loader.remove();
            image.append('<div class="online-prestige__episode-number">' + formatEpisodeNumber(episode.episode_number) + '</div>');
          };
          img.src = Lampa.TMDB.image('t/p/w300' + episode.still_path);
          images.push(img);
        } else {
          loader.remove();
          image.append('<div class="online-prestige__episode-number">' + formatEpisodeNumber(episode.episode_number) + '</div>');
        }
        html.on('hover:focus', function(e) {
          last = e.target;
          scroll.update($(e.target), true);
        });
        html.css('opacity', '0.5');
         scroll.append(html);
      });
    }
    if (scroll_to_element) {
      last = scroll_to_element[0];
    } else if (scroll_to_mark) {
      last = scroll_to_mark[0];
    }
     Lampa.Controller.enable('content');
  });
};
this.contextMenu = function(params) {
  params.html.on('hover:long', function() {
    function show(extra) {
       var enabled = Lampa.Controller.enabled().name;
      var menu = [];
      if (Lampa.Platform.is('webos')) {
        menu.push({
          title: Lampa.Lang.translate('player_lau