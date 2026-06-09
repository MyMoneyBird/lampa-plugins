/**
 * Lampa Plugin — AprelKino
 * Версия: 5.0.1
 *
 * Структура взята из реального рабочего плагина:
 * - Lampa.Component.add() — регистрация компонента-экрана
 * - Lampa.Manifest.plugins — регистрация в манифесте
 * - Lampa.Listener('full') — кнопка на странице фильма
 * - Lampa.Activity.push() — открытие экрана просмотра
 */

(function () {
  'use strict';

  var COMP_NAME  = 'aprelkino_online';
  var PLUGIN_TITLE = 'AprelKino';
  var BASE = 'https://aprelteam.gokino.by';

  // ─── Кэш ────────────────────────────────────────
  var CACHE = {};
  function cacheSet(k, v) { CACHE[k] = { t: Date.now(), v: v }; }
  function cacheGet(k) {
    var c = CACHE[k];
    if (!c) return null;
    if (Date.now() - c.t > 1800000) { delete CACHE[k]; return null; }
    return c.v;
  }

  // ─── Парсинг карточек из HTML ────────────────────
  function parseCards(html) {
    var out = [];
    var re = /href="(\/(?:films|serials|mults|anime)\/(\d+)-[^"]+\.html)"/gi;
    var seen = {};
    var m;
    while ((m = re.exec(html)) !== null && out.length < 6) {
      if (seen[m[2]]) continue;
      seen[m[2]] = 1;
      out.push({ path: m[1], id: m[2] });
    }
    return out;
  }

  // ─── Поиск iframe плеера ─────────────────────────
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
  //  КОМПОНЕНТ — экран онлайн-просмотра
  //  Lampa вызывает start() при открытии Activity
  // ════════════════════════════════════════════════

  function AprelComponent(object) {
    var self    = this;
    var network = new Lampa.Reguest();
    var active  = true;

    // Корневой элемент экрана
    var html = Lampa.Template.get('lampac_content_loading', {}, true);

    // ИСПРАВЛЕНО: Метод переименован в start() для совместимости с Lampa
    this.start = function () {
      self.activity.loader(true);

      var movie   = object.movie || {};
      var title   = object.search || object.search_one || movie.title || movie.name || '';
      var origTitle = object.search_two || movie.original_title || movie.original_name || '';
      var kpId    = movie.kinopoisk_id
                 || (movie.external_ids && movie.external_ids.kinopoisk)
                 || null;
      var season  = object.s || null;
      var episode = object.e || null;

      function done(iframeUrl) {
        if (!active) return;
        self.activity.loader(false);

        if (!iframeUrl) {
          self.empty();
          return;
        }

        // Строим список качеств/серий
        var streams = [];
        if (season) {
          var ep = episode || 1;
          streams.push({ title: 'С' + season + ' Е' + ep, url: withEp(iframeUrl, season, ep), quality: '1080p' });
          streams.push({ title: 'Плеер (навигация)', url: iframeUrl, quality: '1080p' });
        } else {
          streams.push({ title: 'FHD 1080p', url: iframeUrl, quality: '1080p' });
        }

        // Показываем список — при выборе запускаем iframe в плеере Lampa
        var scroll = new Lampa.Scroll({ horizontal: false });
        var files  = new Lampa.Files(scroll.render(true));

        streams.forEach(function (s) {
          var item = files.add({
            title:    s.title,
            quality:  s.quality,
            view:     0
          });
          item.on('hover:enter', function () {
            Lampa.Player.play({ url: s.url, title: PLUGIN_TITLE + ' — ' + s.title });
            Lampa.Player.playlist([{ url: s.url, title: s.title }]);
          });
        });

        html.empty().append(scroll.render(true));
        self.activity.loader(false);
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

      function textSearch(q, fallback) {
        var url = BASE + '/?do=search&subaction=search&story=' + encodeURIComponent(q);
        var ck  = cacheGet('s_' + q);
        if (ck !== null) {
          if (ck) loadPage(ck);
          else if (fallback) textSearch(fallback, '');
          else fail();
          return;
        }
        network.timeout(10000);
        network.native(url, function (html2) {
          if (!active) return;
          var cards = parseCards(html2);
          if (cards.length) {
            var pageUrl = BASE + cards[0].path;
            cacheSet('s_' + q, pageUrl);
            loadPage(pageUrl);
          } else {
            cacheSet('s_' + q, false);
            if (fallback) textSearch(fallback, '');
            else fail();
          }
        }, fail, false);
      }

      // Сначала пробуем xfsearch по KP ID
      if (kpId) {
        var kpUrl = BASE + '/xfsearch/kinopoisk_id/' + kpId + '/';
        var kpCk  = cacheGet('kp_' + kpId);
        if (kpCk !== null) {
          if (kpCk) loadPage(kpCk);
          else textSearch(title, origTitle);
        } else {
          network.timeout(10000);
          network.native(kpUrl, function (html3) {
            if (!active) return;
            var cards = parseCards(html3);
            if (cards.length) {
              var pu = BASE + cards[0].path;
              cacheSet('kp_' + kpId, pu);
              loadPage(pu);
            } else {
              cacheSet('kp_' + kpId, false);
              textSearch(title, origTitle);
            }
          }, function () {
            if (active) textSearch(title, origTitle);
          }, false);
        }
      } else {
        textSearch(title, origTitle);
      }

      return html;
    };

    this.empty = function () {
      var emptyEl = $('<div class="empty"><div class="empty__title">' + PLUGIN_TITLE + ': не найдено</div></div>');
      html.empty().append(emptyEl);
      self.activity.loader(false);
      self.activity.toggle();
    };

    this.render  = function () { return html; };
    this.pause   = function () {};
    this.resume  = function () {};
    this.stop    = function () { active = false; network.clear(); };
    this.destroy = function () { active = false; network.clear(); html.remove(); };
  }

  // ════════════════════════════════════════════════
  //  ЗАПУСК
  // ════════════════════════════════════════════════

  function startPlugin() {
    Lampa.Component.add(COMP_NAME, AprelComponent);

    var manifst = {
      type:        'online',
      component:   COMP_NAME,
      name:        PLUGIN_TITLE,
      version:     '5.0.1',
      description: 'Онлайн-просмотр через AprelKino (FHD без рекламы)'
    };

    function registerManifest() {
      Lampa.Component.add(COMP_NAME, AprelComponent);
      var plugins = Lampa.Manifest.plugins || [];
      if (Object.prototype.toString.call(plugins) !== '[object Array]') {
        plugins = plugins ? [plugins] : [];
      }
      var found = false;
      for (var i = plugins.length - 1; i >= 0; i--) {
        if (plugins[i] && plugins[i].component === COMP_NAME) { found = true; break; }
      }
      if (!found) plugins.push(manifst);
      Lampa.Manifest.plugins = plugins;
    }

    registerManifest();
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') setTimeout(registerManifest, 0);
    });
    setTimeout(registerManifest, 1000);

    var btnHtml = '<div class="full-start__button selector view--online aprelkino--btn" data-subtitle="FHD без рекламы">'
      + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">'
      + '<path d="M8 5v14l11-7z"/></svg>'
      + '<span>' + PLUGIN_TITLE + '</span></div>';

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
            url:        '',
            title:      PLUGIN_TITLE,
            component:  COMP_NAME,
            search:     movie.title || movie.name || movie.original_title || '',
            search_one: movie.title || movie.name || '',
            search_two: movie.original_title || movie.original_name || '',
            movie:      movie,
            page:       1
          });
        });

        e.render.after(btn);
      } catch (ex) {
        console.error('[AprelKino] addButton error:', ex);
      }
    }

    Lampa.Listener.follow('full', function (e) {
      if (e.type === 'complite') {
        addButton({
          render: e.object.activity.render().find('.view--torrent'),
          movie:  e.data.movie
        });
      }
    });

    try {
      if (Lampa.Activity.active().component === 'full') {
        addButton({
          render: Lampa.Activity.active().activity.render().find('.view--torrent'),
          movie:  Lampa.Activity.active().card
        });
      }
    } catch (ex) {}

    console.log('[AprelKino] v5.0.1 ready');
  }

  if (window.appready) {
    startPlugin();
  } else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') startPlugin();
    });
  }

  function withEp(url, s, e) {
    if (!s) return url;
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'season=' + s + '&episode=' + (e || 1);
  }

})();