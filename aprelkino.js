(function() {
  'use strict';


  function showyFreeEs3Polyfills() {
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

  showyFreeEs3Polyfills();

  var showyFreeHost = (function() {
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
      var match = src.match(/^(https?:\/\/[^\/]+)/i);
      if (match) return match[1].replace(/^https:/i, 'http:');
    } catch (e) {}
    return 'http://showy.online';
  })();
  var Defined = {
    api: 'lampac',
    localhost: showyFreeHost + '/',
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

var hostkey = showyFreeHost.replace('http://', '').replace('https://', '');

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
      net.silent(showyFreeHost.indexOf(location.host) >= 0 ? 'https://github.com/' : host + '/cors/check', function() {
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
  window.rch_nws[hostkey].typeInvoke(showyFreeHost, function() {

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
	      url: showyFreeHost + '/rch/' + uri + '?id=' + rchId,
	      type: 'POST',
	      data: html,
	      async: true,
	      cache: false,
	      contentType: false,
	      processData: false,
	      success: function(j) {},
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

  window.rch_nws[hostkey].typeInvoke(showyFreeHost, function() {});

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
      Lampa.Utils.putScript([showyFreeHost + "/js/nws-client-es5.js?v21042026"], function() {}, false, function() {
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

  function trimCompat(value) {
    return (value + '').replace(/^\s+|\s+$/g, '');
  }



  var aprelkinoPluginVersion = '1.7.5';

  function startPlugin() {
    window.aprelkino_plugin = true;
    window.aprelkino_plugin_version = aprelkinoPluginVersion;
    var manifst = {
      type: 'video',
      version: aprelkinoPluginVersion,
      name: 'Aprelkino',
      description: 'ÐŸÐ»Ð°Ð³Ð¸Ð½ Ð´Ð»Ñ Ð¿Ñ€Ð¾ÑÐ¼Ð¾Ñ‚Ñ€Ð° Ð¾Ð½Ð»Ð°Ð¹Ð½ ÑÐµÑ€Ð¸Ð°Ð»Ð¾Ð² Ð¸ Ñ„Ð¸Ð»ÑŒÐ¼Ð¾Ð²',
      component: 'aprelkino',
      onContextMenu: function onContextMenu(object) {
        return {
          name: 'Aprelkino',
          description: Lampa.Lang.translate('lampac_watch')
        };
      },
      onContextLauch: function onContextLauch(object) {
        openShowyFree(object);
      }
    };

    function pushShowyFreeActivity(activity) {
      (function() {
        resetTemplates();
        Lampa.Component.add('aprelkino', component);
        Lampa.Activity.push(activity);
      })();
    }

    function openShowyFree(object) {
      if (!object) return;

      var original = object.number_of_seasons ? object.original_name : object.original_title;
      var id = Lampa.Utils.hash(original || object.original_title || object.original_name || object.title || object.name || '');
      var all = Lampa.Storage.get('clarification_search','{}');

      pushShowyFreeActivity({
        url: '',
        title: 'Aprelkino',
        component: 'aprelkino',
        search: all[id] ? all[id] : (object.title || object.name || object.original_title || object.original_name || ''),
        search_one: object.title || object.name,
        search_two: object.original_title || object.original_name,
        movie: object,
        page: 1,
        clarification: all[id] ? true : false
      });
    }
    if (!window.aprelkinoSearchSourcesReady) {
	  addSourceSearch('Aprelkino', 'spider');
	  addSourceSearch('Aprelkino - Anime', 'spider/anime');
      window.aprelkinoSearchSourcesReady = true;
    }

    // Showy FREE card button on the movie page (mirrors online.js); click launches Showy FREE (with auth)
    var showyFreeCardButtonHtml = '<div class="full-start__button selector view--online aprelkino--button" data-subtitle="ÑÐ¼Ð¾Ñ‚Ñ€ÐµÑ‚ÑŒ Filmix/Rezka/Kodik"><svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 392.697 392.697" xml:space="preserve"> <path d="M21.837,83.419l36.496,16.678L227.72,19.886c1.229-0.592,2.002-1.846,1.98-3.209c-0.021-1.365-0.834-2.592-2.082-3.145 L197.766,0.3c-0.903-0.4-1.933-0.4-2.837,0L21.873,77.036c-1.259,0.559-2.073,1.803-2.081,3.18 C19.784,81.593,20.584,82.847,21.837,83.419z" fill="currentColor"></path> <path d="M185.689,177.261l-64.988-30.01v91.617c0,0.856-0.44,1.655-1.167,2.114c-0.406,0.257-0.869,0.386-1.333,0.386 c-0.368,0-0.736-0.082-1.079-0.244l-68.874-32.625c-0.869-0.416-1.421-1.293-1.421-2.256v-92.229L6.804,95.5 c-1.083-0.496-2.344-0.406-3.347,0.238c-1.002,0.645-1.608,1.754-1.608,2.944v208.744c0,1.371,0.799,2.615,2.045,3.185 l178.886,81.768c0.464,0.211,0.96,0.315,1.455,0.315c0.661,0,1.318-0.188,1.892-0.555c1.002-0.645,1.608-1.754,1.608-2.945 V180.445C187.735,179.076,186.936,177.831,185.689,177.261z" fill="currentColor"></path> <path d="M389.24,95.74c-1.002-0.644-2.264-0.732-3.347-0.238l-178.876,81.76c-1.246,0.57-2.045,1.814-2.045,3.185v208.751 c0,1.191,0.606,2.302,1.608,2.945c0.572,0.367,1.23,0.555,1.892,0.555c0.495,0,0.991-0.104,1.455-0.315l178.876-81.768 c1.246-0.568,2.045-1.813,2.045-3.185V98.685C390.849,97.494,390.242,96.384,389.24,95.74z" fill="currentColor"></path> <path d="M372.915,80.216c-0.009-1.377-0.823-2.621-2.082-3.18l-60.182-26.681c-0.938-0.418-2.013-0.399-2.938,0.045 l-173.755,82.992l60.933,29.117c0.462,0.211,0.958,0.316,1.455,0.316s0.993-0.105,1.455-0.316l173.066-79.092 C372.122,82.847,372.923,81.593,372.915,80.216z" fill="currentColor"></path> </svg><span>Aprelkino</span></div>';
    function addShowyFreeCardButton(e) {
      try {
        if (!e || !e.render || !e.render.length) return;
        if (e.render.find('.aprelkino--button').length) return;
        var btn = $(showyFreeCardButtonHtml);
        btn.on('hover:enter', function() {
          var movie = e.movie;
          try { if (!movie) { var act = Lampa.Activity.active() || {}; movie = act.card || act.movie || (act.activity && act.activity.card) || null; } } catch (err) {}
          if (!movie) return;
          // Open Showy FREE directly (no Telegram auth) â€” content served by .49 with ShowyAuth off, like online.js
          try { resetTemplates(); } catch (e1) {}
          try { Lampa.Component.add('aprelkino', component); } catch (e2) {}
          var id = Lampa.Utils.hash(movie.number_of_seasons ? movie.original_name : movie.original_title);
          var all = Lampa.Storage.get('clarification_search', '{}');
          Lampa.Activity.push({
            url: '',
            title: 'Aprelkino',
            component: 'aprelkino',
            search: all[id] ? all[id] : (movie.title || movie.name || movie.original_title || movie.original_name || ''),
            search_one: movie.title || movie.name,
            search_two: movie.original_title || movie.original_name,
            movie: movie,
            page: 1,
            clarification: all[id] ? true : false
          });
        });
        e.render.after(btn);
      } catch (ex) {}
    }
    if (Lampa.Listener && Lampa.Listener.follow) {
      Lampa.Listener.follow('full', function(e) {
        if (e.type == 'complite') {
          addShowyFreeCardButton({ render: e.object.activity.render().find('.view--torrent'), movie: e.data.movie });
        }
      });
    }
    try {
      if (Lampa.Activity.active().component == 'full') {
        addShowyFreeCardButton({ render: Lampa.Activity.active().activity.render().find('.view--torrent'), movie: Lampa.Activity.active().card });
      }
    } catch (ex) {}

    function refreshShowyFreeRuntime() {
      Lampa.Component.add('aprelkino', component);
    }

    function registerShowyFreeManifest() {
      var plugins = Lampa.Manifest.plugins || [];
      var found = false;

      refreshShowyFreeRuntime();

      if (Object.prototype.toString.call(plugins) != '[object Array]') {
        plugins = plugins ? [plugins] : [];
      }

      for (var i = plugins.length - 1; i >= 0; i--) {
        if (plugins[i] && plugins[i].component == manifst.component) {
          if (found) {
            plugins.splice(i, 1);
            continue;
          }

          plugins[i].type = manifst.type;
          plugins[i].version = manifst.version;
          plugins[i].name = manifst.name;
          plugins[i].description = manifst.description;
          plugins[i].onContextMenu = manifst.onContextMenu;
          plugins[i].onContextLauch = manifst.onContextLauch;
          found = true;
        }
      }

      if (!found) plugins.push(manifst);

      Lampa.Manifest.plugins = plugins;
    }

    registerShowyFreeManifest();
    if (Lampa.Listener && Lampa.Listener.follow) {
      Lampa.Listener.follow('app', function(e) {
        if (e.type == 'ready') setTimeout(registerShowyFreeManifest, 0);
      });
    }
    setTimeout(registerShowyFreeManifest, 1000);
    setTimeout(registerShowyFreeManifest, 3000);

    Lampa.Lang.add({
      lampac_watch: { //
        ru: 'Ð¡Ð¼Ð¾Ñ‚Ñ€ÐµÑ‚ÑŒ Ð¾Ð½Ð»Ð°Ð¹Ð½',
        en: 'Watch online',
        uk: 'Ð”Ð¸Ð²Ð¸Ñ‚Ð¸ÑÑ Ð¾Ð½Ð»Ð°Ð¹Ð½',
        zh: 'åœ¨çº¿è§‚çœ‹'
      },
      lampac_video: { //
        ru: 'Ð’Ð¸Ð´ÐµÐ¾',
        en: 'Video',
        uk: 'Ð’Ñ–Ð´ÐµÐ¾',
        zh: 'è§†é¢‘'
      },
      lampac_no_watch_history: {
        ru: 'ÐÐµÑ‚ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ð¸ Ð¿Ñ€Ð¾ÑÐ¼Ð¾Ñ‚Ñ€Ð°',
        en: 'No browsing history',
        ua: 'ÐÐµÐ¼Ð°Ñ” Ñ–ÑÑ‚Ð¾Ñ€Ñ–Ñ— Ð¿ÐµÑ€ÐµÐ³Ð»ÑÐ´Ñƒ',
        zh: 'æ²¡æœ‰æµè§ˆåŽ†å²'
      },
      lampac_nolink: {
        ru: 'ÐÐµ ÑƒÐ´Ð°Ð»Ð¾ÑÑŒ Ð¸Ð·Ð²Ð»ÐµÑ‡ÑŒ ÑÑÑ‹Ð»ÐºÑƒ',
        uk: 'ÐÐµÐ¼Ð¾Ð¶Ð»Ð¸Ð²Ð¾ Ð¾Ñ‚Ñ€Ð¸Ð¼Ð°Ñ‚Ð¸ Ð¿Ð¾ÑÐ¸Ð»Ð°Ð½Ð½Ñ',
        en: 'Failed to fetch link',
        zh: 'èŽ·å–é“¾æŽ¥å¤±è´¥'
      },
      lampac_balanser: { //
        ru: 'Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº',
        uk: 'Ð”Ð¶ÐµÑ€ÐµÐ»Ð¾',
        en: 'Source',
        zh: 'æ¥æº'
      },
      helper_online_file: { //
        ru: 'Ð£Ð´ÐµÑ€Ð¶Ð¸Ð²Ð°Ð¹Ñ‚Ðµ ÐºÐ»Ð°Ð²Ð¸ÑˆÑƒ "ÐžÐš" Ð´Ð»Ñ Ð²Ñ‹Ð·Ð¾Ð²Ð° ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚Ð½Ð¾Ð³Ð¾ Ð¼ÐµÐ½ÑŽ',
        uk: 'Ð£Ñ‚Ñ€Ð¸Ð¼ÑƒÐ¹Ñ‚Ðµ ÐºÐ»Ð°Ð²Ñ–ÑˆÑƒ "ÐžÐš" Ð´Ð»Ñ Ð²Ð¸ÐºÐ»Ð¸ÐºÑƒ ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚Ð½Ð¾Ð³Ð¾ Ð¼ÐµÐ½ÑŽ',
        en: 'Hold the "OK" key to bring up the context menu',
        zh: 'æŒ‰ä½â€œç¡®å®šâ€é”®è°ƒå‡ºä¸Šä¸‹æ–‡èœå•'
      },
      title_online: { //
        ru: 'ÐžÐ½Ð»Ð°Ð¹Ð½',
        uk: 'ÐžÐ½Ð»Ð°Ð¹Ð½',
        en: 'Online',
        zh: 'åœ¨çº¿çš„'
      },
      lampac_voice_subscribe: { //
        ru: 'ÐŸÐ¾Ð´Ð¿Ð¸ÑÐ°Ñ‚ÑŒÑÑ Ð½Ð° Ð¿ÐµÑ€ÐµÐ²Ð¾Ð´',
        uk: 'ÐŸÑ–Ð´Ð¿Ð¸ÑÐ°Ñ‚Ð¸ÑÑ Ð½Ð° Ð¿ÐµÑ€ÐµÐºÐ»Ð°Ð´',
        en: 'Subscribe to translation',
        zh: 'è®¢é˜…ç¿»è¯‘'
      },
      lampac_voice_success: { //
        ru: 'Ð’Ñ‹ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ Ð¿Ð¾Ð´Ð¿Ð¸ÑÐ°Ð»Ð¸ÑÑŒ',
        uk: 'Ð’Ð¸ ÑƒÑÐ¿Ñ–ÑˆÐ½Ð¾ Ð¿Ñ–Ð´Ð¿Ð¸ÑÐ°Ð»Ð¸ÑÑ',
        en: 'You have successfully subscribed',
        zh: 'æ‚¨å·²æˆåŠŸè®¢é˜…'
      },
      lampac_voice_error: { //
        ru: 'Ð’Ð¾Ð·Ð½Ð¸ÐºÐ»Ð° Ð¾ÑˆÐ¸Ð±ÐºÐ°',
        uk: 'Ð’Ð¸Ð½Ð¸ÐºÐ»Ð° Ð¿Ð¾Ð¼Ð¸Ð»ÐºÐ°',
        en: 'An error has occurred',
        zh: 'å‘ç”Ÿäº†é”™è¯¯'
      },
      lampac_clear_all_marks: { //
        ru: 'ÐžÑ‡Ð¸ÑÑ‚Ð¸Ñ‚ÑŒ Ð²ÑÐµ Ð¼ÐµÑ‚ÐºÐ¸',
        uk: 'ÐžÑ‡Ð¸ÑÑ‚Ð¸Ñ‚Ð¸ Ð²ÑÑ– Ð¼Ñ–Ñ‚ÐºÐ¸',
        en: 'Clear all labels',
        zh: 'æ¸…é™¤æ‰€æœ‰æ ‡ç­¾'
      },
      lampac_clear_all_timecodes: { //
        ru: 'ÐžÑ‡Ð¸ÑÑ‚Ð¸Ñ‚ÑŒ Ð²ÑÐµ Ñ‚Ð°Ð¹Ð¼-ÐºÐ¾Ð´Ñ‹',
        uk: 'ÐžÑ‡Ð¸ÑÑ‚Ð¸Ñ‚Ð¸ Ð²ÑÑ– Ñ‚Ð°Ð¹Ð¼-ÐºÐ¾Ð´Ð¸',
        en: 'Clear all timecodes',
        zh: 'æ¸…é™¤æ‰€æœ‰æ—¶é—´ä»£ç '
      },
      lampac_change_balanser: { //
        ru: 'Ð˜Ð·Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ Ð±Ð°Ð»Ð°Ð½ÑÐµÑ€',
        uk: 'Ð—Ð¼Ñ–Ð½Ð¸Ñ‚Ð¸ Ð±Ð°Ð»Ð°Ð½ÑÐµÑ€',
        en: 'Change balancer',
        zh: 'æ›´æ”¹å¹³è¡¡å™¨'
      },
      lampac_balanser_dont_work: { //
        ru: 'ÐŸÐ¾Ð¸ÑÐº Ð½Ð° ({balanser}) Ð½Ðµ Ð´Ð°Ð» Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚Ð¾Ð²',
        uk: 'ÐŸÐ¾ÑˆÑƒÐº Ð½Ð° ({balanser}) Ð½Ðµ Ð´Ð°Ð² Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚Ñ–Ð²',
        en: 'Search on ({balanser}) did not return any results',
        zh: 'æœç´¢ ({balanser}) æœªè¿”å›žä»»ä½•ç»“æžœ'
      },
      lampac_balanser_timeout: { //
        ru: 'Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº Ð±ÑƒÐ´ÐµÑ‚ Ð¿ÐµÑ€ÐµÐºÐ»ÑŽÑ‡ÐµÐ½ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸ Ñ‡ÐµÑ€ÐµÐ· <span class="timeout">10</span> ÑÐµÐºÑƒÐ½Ð´.',
        uk: 'Ð”Ð¶ÐµÑ€ÐµÐ»Ð¾ Ð±ÑƒÐ´Ðµ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡Ð½Ð¾ Ð¿ÐµÑ€ÐµÐºÐ»ÑŽÑ‡ÐµÐ½Ð¾ Ñ‡ÐµÑ€ÐµÐ· <span class="timeout">10</span> ÑÐµÐºÑƒÐ½Ð´.',
        en: 'The source will be switched automatically after <span class="timeout">10</span> seconds.',
        zh: 'å¹³è¡¡å™¨å°†åœ¨<span class="timeout">10</span>ç§’å†…è‡ªåŠ¨åˆ‡æ¢ã€‚'
      },
      lampac_does_not_answer_text: {
        ru: 'ÐŸÐ¾Ð¸ÑÐº Ð½Ð° ({balanser}) Ð½Ðµ Ð´Ð°Ð» Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚Ð¾Ð²',
        uk: 'ÐŸÐ¾ÑˆÑƒÐº Ð½Ð° ({balanser}) Ð½Ðµ Ð´Ð°Ð² Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚Ñ–Ð²',
        en: 'Search on ({balanser}) did not return any results',
        zh: 'æœç´¢ ({balanser}) æœªè¿”å›žä»»ä½•ç»“æžœ'
      }
    });
    Lampa.Template.add('lampac_css', "\n        <style>\n        @charset 'UTF-8';.online-prestige{position:relative;-webkit-border-radius:.3em;border-radius:.3em;background-color:rgba(0,0,0,0.3);display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-prestige__body{padding:1.2em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;-moz-box-flex:1;-ms-flex-positive:1;flex-grow:1;position:relative}@media screen and (max-width:480px){.online-prestige__body{padding:.8em 1.2em}}.online-prestige__img{position:relative;width:13em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;min-height:8.2em}.online-prestige__img>img{position:absolute;top:0;left:0;width:100%;height:100%;-o-object-fit:cover;object-fit:cover;-webkit-border-radius:.3em;border-radius:.3em;opacity:0;-webkit-transition:opacity .3s;-o-transition:opacity .3s;-moz-transition:opacity .3s;transition:opacity .3s}.online-prestige__img--loaded>img{opacity:1}@media screen and (max-width:480px){.online-prestige__img{width:7em;min-height:6em}}.online-prestige__folder{padding:1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige__folder>svg{width:4.4em !important;height:4.4em !important}.online-prestige__viewed{position:absolute;top:1em;left:1em;background:rgba(0,0,0,0.45);-webkit-border-radius:100%;border-radius:100%;padding:.25em;font-size:.76em}.online-prestige__viewed>svg{width:1.5em !important;height:1.5em !important}.online-prestige__episode-number{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-moz-box-pack:center;-ms-flex-pack:center;justify-content:center;font-size:2em}.online-prestige__loader{position:absolute;top:50%;left:50%;width:2em;height:2em;margin-left:-1em;margin-top:-1em;background:url(./img/loader.svg) no-repeat center center;-webkit-background-size:contain;-o-background-size:contain;background-size:contain}.online-prestige__head,.online-prestige__footer{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;-moz-box-pack:justify;-ms-flex-pack:justify;justify-content:space-between;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__timeline{margin:.8em 0}.online-prestige__timeline>.time-line{display:block !important}.online-prestige__title{font-size:1.7em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}@media screen and (max-width:480px){.online-prestige__title{font-size:1.4em}}.online-prestige__time{padding-left:2em}.online-prestige__info{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige__info>*{overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}.online-prestige__quality{padding-left:1em;white-space:nowrap}.online-prestige__scan-file{position:absolute;bottom:0;left:0;right:0}.online-prestige__scan-file .broadcast__scan{margin:0}.online-prestige .online-prestige-split{font-size:.8em;margin:0 1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige.focus::after{content:'';position:absolute;top:-0.6em;left:-0.6em;right:-0.6em;bottom:-0.6em;-webkit-border-radius:.7em;border-radius:.7em;border:solid .3em #fff;z-index:-1;pointer-events:none}.online-prestige+.online-prestige{margin-top:1.5em}.online-prestige--folder .online-prestige__footer{margin-top:.8em}.online-prestige-watched{padding:1em}.online-prestige-watched__icon>svg{width:1.5em;height:1.5em}.online-prestige-watched__body{padding-left:1em;padding-top:.1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap}.online-prestige-watched__body>span+span::before{content:' â— ';vertical-align:top;display:inline-block;margin:0 .5em}.online-prestige-rate{display:-webkit-inline-box;display:-webkit-inline-flex;display:-moz-inline-box;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center}.online-prestige-rate>svg{width:1.3em !important;height:1.3em !important}.online-prestige-rate>span{font-weight:600;font-size:1.1em;padding-left:.7em}.online-empty{line-height:1.4}.online-empty__title{font-size:1.8em;margin-bottom:.3em}.online-empty__time{font-size:1.2em;font-weight:300;margin-bottom:1.6em}.online-empty__buttons{display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex}.online-empty__buttons>*+*{margin-left:1em}.online-empty__button{background:rgba(0,0,0,0.3);font-size:1.2em;padding:.5em 1.2em;-webkit-border-radius:.2em;border-radius:.2em;margin-bottom:2.4em}.online-empty__button.focus{background:#fff;color:black}.online-empty__templates .online-empty-template:nth-child(2){opacity:.5}.online-empty__templates .online-empty-template:nth-child(3){opacity:.2}.online-empty-template{background-color:rgba(255,255,255,0.3);padding:1em;display:-webkit-box;display:-webkit-flex;display:-moz-box;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-moz-box-align:center;-ms-flex-align:center;align-items:center;-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template>*{background:rgba(0,0,0,0.3);-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template__ico{width:4em;height:4em;margin-right:2.4em}.online-empty-template__body{height:1.7em;width:70%}.online-empty-template+.online-empty-template{margin-top:1em}\n        </style>\n    ");
    $('body').append(Lampa.Template.get('lampac_css', {}, true));

    function resetTemplates() {
      Lampa.Template.add('lampac_prestige_full', "<div class=\"online-prestige online-prestige--full selector\">\n            <div class=\"online-prestige__img\">\n                <img alt=\"\">\n                <div class=\"online-prestige__loader\"></div>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n\n                <div class=\"online-prestige__timeline\"></div>\n\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                    <div class=\"online-prestige__quality\">{quality}</div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_content_loading', "<div class=\"online-empty\">\n            <div class=\"broadcast__scan\"><div></div></div>\n\t\t\t\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template selector\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_does_not_answer', "<div class=\"online-empty\">\n            <div class=\"online-empty__title\">\n                #{lampac_balanser_dont_work}\n            </div>\n            <div class=\"online-empty__time\">\n                #{lampac_balanser_timeout}\n            </div>\n            <div class=\"online-empty__buttons\">\n                <div class=\"online-empty__button selector cancel\">#{cancel}</div>\n                <div class=\"online-empty__button selector change\">#{lampac_change_balanser}</div>\n            </div>\n            <div class=\"online-empty__templates\">\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n                <div class=\"online-empty-template\">\n                    <div class=\"online-empty-template__ico\"></div>\n                    <div class=\"online-empty-template__body\"></div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_prestige_rate', "<div class=\"online-prestige-rate\">\n            <svg width=\"17\" height=\"16\" viewBox=\"0 0 17 16\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path d=\"M8.39409 0.192139L10.99 5.30994L16.7882 6.20387L12.5475 10.4277L13.5819 15.9311L8.39409 13.2425L3.20626 15.9311L4.24065 10.4277L0 6.20387L5.79819 5.30994L8.39409 0.192139Z\" fill=\"#fff\"></path>\n            </svg>\n            <span>{rate}</span>\n        </div>");
      Lampa.Template.add('lampac_prestige_folder', "<div class=\"online-prestige online-prestige--folder selector\">\n            <div class=\"online-prestige__folder\">\n                <svg viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"></rect>\n                    <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"></path>\n                    <rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"></rect>\n                </svg>\n            </div>\n            <div class=\"online-prestige__body\">\n                <div class=\"online-prestige__head\">\n                    <div class=\"online-prestige__title\">{title}</div>\n                    <div class=\"online-prestige__time\">{time}</div>\n                </div>\n\n                <div class=\"online-prestige__footer\">\n                    <div class=\"online-prestige__info\">{info}</div>\n                </div>\n            </div>\n        </div>");
      Lampa.Template.add('lampac_prestige_watched', "<div class=\"online-prestige online-prestige-watched selector\">\n            <div class=\"online-prestige-watched__icon\">\n                <svg width=\"21\" height=\"21\" viewBox=\"0 0 21 21\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                    <circle cx=\"10.5\" cy=\"10.5\" r=\"9\" stroke=\"currentColor\" stroke-width=\"3\"/>\n                    <path d=\"M14.8477 10.5628L8.20312 14.399L8.20313 6.72656L14.8477 10.5628Z\" fill=\"currentColor\"/>\n                </svg>\n            </div>\n            <div class=\"online-prestige-watched__body\">\n                \n            </div>\n        </div>");
    }
    Lampa.Component.add('aprelkino', component);
    resetTemplates();

    if (Lampa.Manifest.app_digital >= 177) {
        var balansers_sync = [
            "filmix",
            "filmixtv",
            "fxapi",
            "filmixrezka",
            "rezka",
            "pizdatoehd",
            "getstv",
            "kinopub",
            "zetflixdb",
            "collaps",
            "hdvb",
            "kodik",
            "bamboo",
            "eneyida",
            "kinoukr",
            "uafilm",
            "uakino",
            "kinotochka",
            "remux",
            "anilibria",
            "animedia",
            "animego",
            "animevost",
            "animebesst",
            "alloha",
            "mirage",
            "phantom",
            "animelib",
            "moonanime",
            "vibix",
            "fancdn",
            "cdnvideohub",
            "vokino",
            "hydraflix",
            "videasy",
            "vidsrc",
            "movpi",
            "vidlink",
            "smashystream",
            "autoembed",
            "pidtor",
            "videoseed",
            "iptvonline",
            "veoveo",
            "kinoflix",
            "leproduction",
            "vkmovie",
            "videoseed",
            "veoveo",
            "kinogo",
            "kinobase",
            "fancdn",
            "asiage",
            "geosaitebi",
            "mikai",
            "dreamerscast"
        ];
      balansers_sync.forEach(function(name) {
        Lampa.Storage.sync('online_choice_' + name, 'object_object');
      });
      Lampa.Storage.sync('online_watched_last', 'object_object');
    }

  }

  if (!window.aprelkino_plugin || window.aprelkino_plugin_version != aprelkinoPluginVersion) startPlugin();

})();