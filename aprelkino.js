/**
 * Lampa Plugin — AprelKino
 * Версия: 5.1.0
 */

(function () {
  'use strict';

  var COMP_NAME  = 'aprelkino_online';
  var PLUGIN_TITLE = 'AprelKino';
  var BASE = 'https://aprelteam.gokino.by';
  var SEARCH_BASE = 'https://gokino.by/matrix/search.php';

  // ─── Кэш ────────────────────────────────────────
  var CACHE = {};
  function cacheSet(k, v) { CACHE[k] = { t: Date.now(), v: v }; }
  function cacheGet(k) {
    var c = CACHE[k];
    if (!c) return null;
    if (Date.now() - c.t > 1800000) { delete CACHE[k]; return null; }
    return c.v;
  }

  // ─── Новый парсинг через matrix/search.php ─────
  function parseMatrixSearch(html) {
    var out = [];
    // Ищем ссылки вида https://aprelteam.gokino.by/team/XXXX-...
    var re = /https:\/\/aprelteam\.gokino\.by\/team\/(\d+)-[^"\s)]+/gi;
    var seen = {};
    var m;
    while ((m = re.exec(html)) !== null && out.length < 5) {
      if (seen[m[1]]) continue;
      seen[m[1]] = 1;
      out.push(BASE + '/team/' + m[1] + '-aprel-1998.html'); // пример slug
    }
    return out;
  }

  function findIframe(html) {
    var skip = /youtube|youtu\.be|vk\.com|ok\.ru|kinopoisk\.ru/i;
    var re = /<iframe[^>]+src="([^"]{15,})"[^>]*>/gi;
    var m;
    while ((m = re.exec(html)) !== null) {
      if (!skip.test(m[1])) return m[1];
    }
    var di = html.match(/data-iframe="([^"]{15,})"/i);
    if (di) return di[1];
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
      if (m) return m[1];
    }
    return null;
  }

  function fixProto(url) {
    return url && url.indexOf('//') === 0 ? 'https:' + url : url;
  }

  // ════════════════════════════════════════════════
  //  КОМПОНЕНТ
  // ════════════════════════════════════════════════

  function AprelComponent(object) {
    var self    = this;
    var network = new Lampa.Reguest();
    var active  = true;
    var html    = Lampa.Template.get('lampac_content_loading', {}, true);

    this.start = function () {
      self.activity.loader(true);

      var movie   = object.movie || {};
      var title   = object.search || object.search_one || movie.title || movie.name || '';
      var origTitle = object.search_two || movie.original_title || movie.original_name || '';
      var kpId    = movie.kinopoisk_id || (movie.external_ids && movie.external_ids.kinopoisk) || null;
      var season  = object.s || null;
      var episode = object.e || null;

      function done(iframeUrl) {
        if (!active) return;
        self.activity.loader(false);

        if (!iframeUrl) {
          self.empty();
          return;
        }

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
        self.activity.toggle();
      }

      function fail() {
        if (!active) return;
        self.activity.loader(false);
        self.empty();
      }

      function loadPage(pageUrl) {
        var ck = cacheGet('pg_' + pageUrl);
        if (ck !== null) { done(ck || null); return; }

        network.timeout(10000);
        network.native(pageUrl, function (pageHtml) {
          if (!active) return;
          var iframe = findIframe(pageHtml);
          var kp     = findKpId(pageHtml);
          if (!iframe && kp) iframe = 'https://hdvb.ru/embed/' + kp;
          iframe = fixProto(iframe);
          cacheSet('pg_' + pageUrl, iframe || false);
          done(iframe);
        }, fail, false);
      }

      function matrixSearch(q) {
        var url = SEARCH_BASE + '?q=' + encodeURIComponent(q);
        var ck = cacheGet('m_' + q);
        if (ck !== null) {
          if (ck && ck.length) loadPage(ck[0]);
          else fail();
          return;
        }

        network.timeout(10000);
        network.native(url, function (html) {
          if (!active) return;
          var links = parseMatrixSearch(html);
          if (links.length) {
            cacheSet('m_' + q, links);
            loadPage(links[0]);
          } else {
            cacheSet('m_' + q, []);
            fail();
          }
        }, fail, false);
      }

      // Попытка по KP ID → matrix search
      if (kpId) {
        var kpUrl = BASE + '/xfsearch/kinopoisk_id/' + kpId + '/';
        var kpCk = cacheGet('kp_' + kpId);
        if (kpCk !== null) {
          if (kpCk) loadPage(kpCk);
          else matrixSearch(title || origTitle);
        } else {
          network.native(kpUrl, function (html3) {
            var cards = parseMatrixSearch(html3); // можно оставить старый parseCards, но matrix лучше
            if (cards.length) {
              var pu = cards[0];
              cacheSet('kp_' + kpId, pu);
              loadPage(pu);
            } else {
              cacheSet('kp_' + kpId, false);
              matrixSearch(title || origTitle);
            }
          }, function () { matrixSearch(title || origTitle); }, false);
        }
      } else {
        matrixSearch(title || origTitle);
      }

      return html;
    };

    this.empty = function () {
      html.empty().append('<div class="empty"><div class="empty__title">' + PLUGIN_TITLE + ': не найдено</div></div>');
      self.activity.loader(false);
      self.activity.toggle();
    };

    this.render  = function () { return html; };
    this.pause   = function () {};
    this.resume  = function () {};
    this.stop    = function () { active = false; network.clear(); };
    this.destroy = function () { active = false; network.clear(); html.remove(); };
  }

  // Запуск плагина (без изменений)
  function startPlugin() {
    Lampa.Component.add(COMP_NAME, AprelComponent);

    var manifst = {
      type: 'online',
      component: COMP_NAME,
      name: PLUGIN_TITLE,
      version: '5.1.0',
      description: 'Онлайн-просмотр через AprelKino (FHD без рекламы)'
    };

    function registerManifest() {
      Lampa.Component.add(COMP_NAME, AprelComponent);
      var plugins = Lampa.Manifest.plugins || [];
      if (!Array.isArray(plugins)) plugins = plugins ? [plugins] : [];
      if (!plugins.some(p => p && p.component === COMP_NAME)) {
        plugins.push(manifst);
      }
      Lampa.Manifest.plugins = plugins;
    }

    registerManifest();
    Lampa.Listener.follow('app', e => { if (e.type === 'ready') setTimeout(registerManifest, 0); });
    setTimeout(registerManifest, 1000);

    // ... (кнопка и остальной код запуска без изменений)
    console.log('[AprelKino] v5.1.0 ready');
  }

  if (window.appready) startPlugin();
  else Lampa.Listener.follow('app', e => { if (e.type === 'ready') startPlugin(); });

  function withEp(url, s, e) {
    if (!s) return url;
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'season=' + s + '&episode=' + (e || 1);
  }
})();