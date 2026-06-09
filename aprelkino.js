/**
 * AprelKino DEBUG — показывает в консоли каждый шаг
 * Используй временно чтобы найти где обрывается поиск
 */

(function () {
  'use strict';

  var COMP_NAME    = 'aprelkino_online';
  var PLUGIN_TITLE = 'AprelKino';
  var BASE         = 'https://aprelteam.gokino.by';

  var CACHE = {};
  function cacheSet(k, v) { CACHE[k] = { t: Date.now(), v: v }; }
  function cacheGet(k) {
    var c = CACHE[k];
    if (!c) return null;
    if (Date.now() - c.t > 1800000) { delete CACHE[k]; return null; }
    return c.v;
  }

  function log(msg) {
    console.log('[AprelKino] ' + msg);
    // Также показываем в уведомлении Lampa для удобства
    try { Lampa.Noty.show('[AK] ' + msg); } catch(e) {}
  }

  function parseCards(html) {
    var out = [];
    var re  = /href="(\/(?:films|serials|mults|anime)\/(\d+)-[^"]+\.html)"/gi;
    var seen = {}, m;
    while ((m = re.exec(html)) !== null && out.length < 6) {
      if (seen[m[2]]) continue;
      seen[m[2]] = 1;
      out.push({ path: m[1], id: m[2] });
    }
    log('parseCards нашёл: ' + out.length + ' карточек');
    return out;
  }

  function findIframe(html) {
    var skip = /youtube|youtu\.be|vk\.com|ok\.ru|kinopoisk\.ru/i;
    var re = /<iframe[^>]+src="([^"]{15,})"[^>]*>/gi;
    var m;
    while ((m = re.exec(html)) !== null) {
      if (!skip.test(m[1])) {
        log('Найден iframe: ' + m[1].substring(0, 60));
        return m[1];
      }
    }
    var di = html.match(/data-iframe="([^"]{15,})"/i);
    if (di) { log('Найден data-iframe: ' + di[1].substring(0, 60)); return di[1]; }
    log('iframe НЕ найден в HTML (длина HTML: ' + html.length + ')');
    return null;
  }

  function findKpId(html) {
    var pp = [
      /kinopoisk[_-]id['":\s=]+(\d+)/i,
      /data-kp=["'](\d+)["']/i,
      /kinopoisk\.ru\/(?:film|series)\/(\d+)/i,
      /"kp"\s*:\s*(\d+)/i
    ];
    for (var i = 0; i < pp.length; i++) {
      var m = html.match(pp[i]);
      if (m) { log('KP ID найден: ' + m[1]); return m[1]; }
    }
    log('KP ID не найден');
    return null;
  }

  function fixProto(url) {
    return url && url.indexOf('//') === 0 ? 'https:' + url : url;
  }

  function withEp(url, s, e) {
    if (!s) return url;
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'season=' + s + '&episode=' + (e || 1);
  }

  function AprelComponent(object) {
    var self    = this;
    var network = new Lampa.Reguest();
    var active  = true;
    var html    = $('<div class="aprelkino-loading" style="padding:2em;color:#fff">Загрузка AprelKino...</div>');

    this.create = function () {
      self.activity.loader(true);

      var movie     = object.movie || {};
      var title     = object.search || object.search_one || movie.title || movie.name || '';
      var origTitle = object.search_two || movie.original_title || movie.original_name || '';
      var kpId      = movie.kinopoisk_id
                   || (movie.external_ids && movie.external_ids.kinopoisk)
                   || null;
      var season    = object.s || null;
      var episode   = object.e || null;

      log('Старт: title="' + title + '" orig="' + origTitle + '" kpId=' + kpId);

      function done(iframeUrl) {
        if (!active) return;
        self.activity.loader(false);

        if (!iframeUrl) {
          log('done: iframeUrl пустой — показываем empty');
          self.empty();
          return;
        }

        log('done: строим список потоков для ' + iframeUrl.substring(0, 60));

        var streams = [];
        if (season) {
          var ep = episode || 1;
          streams.push({ title: 'С' + season + ' Е' + ep, url: withEp(iframeUrl, season, ep), quality: '1080p' });
          streams.push({ title: 'Плеер (навигация)', url: iframeUrl, quality: '1080p' });
        } else {
          streams.push({ title: 'FHD 1080p', url: iframeUrl, quality: '1080p' });
        }

        var scroll = new Lampa.Scroll({ horizontal: false });
        var files  = new Lampa.Files(scroll.render(true));

        streams.forEach(function (s) {
          var item = files.add({ title: s.title, quality: s.quality, view: 0 });
          item.on('hover:enter', function () {
            Lampa.Player.play({ url: s.url, title: PLUGIN_TITLE + ' — ' + s.title });
            Lampa.Player.playlist([{ url: s.url, title: s.title }]);
          });
        });

        html.empty().append(scroll.render(true));
        self.activity.loader(false);
        self.activity.toggle();
      }

      function fail(e) {
        if (!active) return;
        log('ОШИБКА запроса: ' + (e && e.message ? e.message : JSON.stringify(e)));
        self.activity.loader(false);
        self.empty();
      }

      function loadPage(pageUrl) {
        log('loadPage: ' + pageUrl);
        var ck = cacheGet('pg_' + pageUrl);
        if (ck !== null) { log('loadPage: из кэша'); done(ck || null); return; }

        network.timeout(10000);
        network.native(pageUrl, function (pageHtml) {
          if (!active) return;
          log('loadPage: получен HTML ' + pageHtml.length + ' байт');
          var iframe = findIframe(pageHtml);
          var kp     = findKpId(pageHtml);
          if (!iframe && kp) {
            iframe = 'https://hdvb.ru/embed/' + kp;
            log('loadPage: используем HDVB fallback: ' + iframe);
          }
          iframe = fixProto(iframe);
          cacheSet('pg_' + pageUrl, iframe || false);
          done(iframe);
        }, fail, false);
      }

      function textSearch(q, fallback) {
        if (!q) { log('textSearch: пустой запрос'); fail(); return; }
        var url = BASE + '/?do=search&subaction=search&story=' + encodeURIComponent(q);
        log('textSearch: ' + url);
        var ck = cacheGet('s_' + q);
        if (ck !== null) {
          log('textSearch: из кэша, результат=' + ck);
          if (ck) loadPage(ck);
          else if (fallback) textSearch(fallback, '');
          else fail();
          return;
        }
        network.timeout(10000);
        network.native(url, function (html2) {
          if (!active) return;
          log('textSearch: ответ ' + html2.length + ' байт');
          var cards = parseCards(html2);
          if (cards.length) {
            var pu = BASE + cards[0].path;
            log('textSearch: нашли страницу ' + pu);
            cacheSet('s_' + q, pu);
            loadPage(pu);
          } else {
            log('textSearch: карточки не найдены' + (fallback ? ', пробуем "' + fallback + '"' : ''));
            cacheSet('s_' + q, false);
            if (fallback) textSearch(fallback, '');
            else fail();
          }
        }, fail, false);
      }

      if (kpId) {
        var kpUrl = BASE + '/xfsearch/kinopoisk_id/' + kpId + '/';
        log('xfsearch: ' + kpUrl);
        var kpCk = cacheGet('kp_' + kpId);
        if (kpCk !== null) {
          log('xfsearch: из кэша=' + kpCk);
          if (kpCk) loadPage(kpCk); else textSearch(title, origTitle);
        } else {
          network.timeout(10000);
          network.native(kpUrl, function (html3) {
            if (!active) return;
            log('xfsearch: ответ ' + html3.length + ' байт');
            var cards = parseCards(html3);
            if (cards.length) {
              var pu = BASE + cards[0].path;
              log('xfsearch: нашли ' + pu);
              cacheSet('kp_' + kpId, pu);
              loadPage(pu);
            } else {
              log('xfsearch: не нашли, переходим к textSearch');
              cacheSet('kp_' + kpId, false);
              textSearch(title, origTitle);
            }
          }, function (e) {
            log('xfsearch: ошибка запроса, переходим к textSearch');
            if (active) textSearch(title, origTitle);
          }, false);
        }
      } else {
        textSearch(title, origTitle);
      }

      return html;
    };

    this.empty = function () {
      html.empty().append($('<div style="padding:2em;color:#fff">' + PLUGIN_TITLE + ': ничего не найдено.<br>Смотри консоль Lampa для деталей.</div>'));
      self.activity.loader(false);
      self.activity.toggle();
    };

    this.render  = function () { return html; };
    this.pause   = function () {};
    this.resume  = function () {};
    this.stop    = function () { active = false; network.clear(); };
    this.destroy = function () { active = false; network.clear(); html.remove(); };
  }

  function startPlugin() {
    Lampa.Component.add(COMP_NAME, AprelComponent);

    var manifst = {
      type: 'online', component: COMP_NAME,
      name: PLUGIN_TITLE + ' DEBUG', version: '5.1-debug',
      description: 'Debug версия'
    };

    function registerManifest() {
      Lampa.Component.add(COMP_NAME, AprelComponent);
      var plugins = Lampa.Manifest.plugins || [];
      if (Object.prototype.toString.call(plugins) !== '[object Array]') plugins = plugins ? [plugins] : [];
      var found = false;
      for (var i = plugins.length - 1; i >= 0; i--) {
        if (plugins[i] && plugins[i].component === COMP_NAME) { found = true; break; }
      }
      if (!found) plugins.push(manifst);
      Lampa.Manifest.plugins = plugins;
    }

    registerManifest();
    Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') setTimeout(registerManifest, 0); });
    setTimeout(registerManifest, 1000);

    var btnHtml = '<div class="full-start__button selector view--online aprelkino--btn" data-subtitle="FHD debug">'
      + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">'
      + '<path d="M8 5v14l11-7z"/></svg><span>' + PLUGIN_TITLE + '</span></div>';

    function addButton(e) {
      try {
        if (!e || !e.render || !e.render.length) return;
        if (e.render.find('.aprelkino--btn').length) return;
        var btn = $(btnHtml);
        btn.on('hover:enter', function () {
          var movie = e.movie;
          if (!movie) return;
          Lampa.Component.add(COMP_NAME, AprelComponent);
          Lampa.Activity.push({
            url: '', title: PLUGIN_TITLE, component: COMP_NAME,
            search:     movie.title || movie.name || '',
            search_one: movie.title || movie.name || '',
            search_two: movie.original_title || movie.original_name || '',
            movie: movie, page: 1
          });
        });
        e.render.after(btn);
      } catch (ex) { console.error('[AprelKino] addButton:', ex); }
    }

    Lampa.Listener.follow('full', function (e) {
      if (e.type === 'complite') {
        addButton({ render: e.object.activity.render().find('.view--torrent'), movie: e.data.movie });
      }
    });

    try {
      if (Lampa.Activity.active().component === 'full') {
        addButton({ render: Lampa.Activity.active().activity.render().find('.view--torrent'), movie: Lampa.Activity.active().card });
      }
    } catch (ex) {}

    log('v5.1-debug загружен');
  }

  if (window.appready) startPlugin();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });

})();
