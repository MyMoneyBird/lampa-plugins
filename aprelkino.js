/**
 * Lampa Plugin — AprelKino
 * Версия: 5.1.1
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

  // ─── Новый поиск через matrix ───────────────────
  function parseMatrixSearch(html) {
    var out = [];
    var re = /https:\/\/aprelteam\.gokino\.by\/team\/(\d+)-[^"\s'<>)]+/gi;
    var seen = {};
    var m;
    while ((m = re.exec(html)) !== null && out.length < 6) {
      if (seen[m[1]]) continue;
      seen[m[1]] = 1;
      out.push(BASE + '/team/' + m[1] + '-aprel-1998.html');
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
    var self = this;
    var network = new Lampa.Reguest();
    var active = true;
    var html = Lampa.Template.get('lampac_content_loading', {}, true);

    this.start = function () {
      self.activity.loader(true);

      var movie = object.movie || {};
      var title = object.search || object.search_one || movie.title || movie.name || '';
      var origTitle = object.search_two || movie.original_title || movie.original_name || '';
      var kpId = movie.kinopoisk_id || (movie.external_ids && movie.external_ids.kinopoisk) || null;
      var season = object.s || null;
      var episode = object.e || null;

      function done(iframeUrl) {
        if (!active) return;
        self.activity.loader(false);
        if (!iframeUrl) return self.empty();

        var streams = [];
        if (season) {
          var ep = episode || 1;
          streams.push({ title: 'С' + season + ' Е' + ep, url: withEp(iframeUrl, season, ep), quality: '1080p' });
          streams.push({ title: 'Плеер (навигация)', url: iframeUrl, quality: '1080p' });
        } else {
          streams.push({ title: 'FHD 1080p', url: iframeUrl, quality: '1080p' });
        }

        var scroll = new Lampa.Scroll({ horizontal: false });
        var files = new Lampa.Files(scroll.render(true));

        streams.forEach(s => {
          var item = files.add({ title: s.title, quality: s.quality, view: 0 });
          item.on('hover:enter', () => {
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
        if (ck !== null) return done(ck || null);

        network.timeout(12000);
        network.native(pageUrl, pageHtml => {
          if (!active) return;
          var iframe = findIframe(pageHtml);
          var kp = findKpId(pageHtml);
          if (!iframe && kp) iframe = 'https://hdvb.ru/embed/' + kp;
          iframe = fixProto(iframe);
          cacheSet('pg_' + pageUrl, iframe || false);
          done(iframe);
        }, fail, false);
      }

      function matrixSearch(q) {
        if (!q) return fail();
        var url = SEARCH_BASE + '?q=' + encodeURIComponent(q);
        var ck = cacheGet('m_' + q);
        if (ck !== null) return ck && ck.length ? loadPage(ck[0]) : fail();

        network.timeout(12000);
        network.native(url, html => {
          if (!active) return;
          var links = parseMatrixSearch(html);
          cacheSet('m_' + q, links);
          links.length ? loadPage(links[0]) : fail();
        }, fail, false);
      }

      // Основная логика
      if (kpId) {
        var kpUrl = BASE + '/xfsearch/kinopoisk_id/' + kpId + '/';
        network.native(kpUrl, html3 => {
          var links = parseMatrixSearch(html3);
          if (links.length) {
            cacheSet('kp_' + kpId, links[0]);
            loadPage(links[0]);
          } else {
            matrixSearch(title || origTitle);
          }
        }, () => matrixSearch(title || origTitle), false);
      } else {
        matrixSearch(title || origTitle);
      }

      return html;
    };

    this.empty = function () {
      html.empty().append(`<div class="empty"><div class="empty__title">${PLUGIN_TITLE}: не найдено</div></div>`);
      self.activity.loader(false);
      self.activity.toggle();
    };

    this.render = () => html;
    this.pause = () => {};
    this.resume = () => {};
    this.stop = () => { active = false; network.clear(); };
    this.destroy = () => { active = false; network.clear(); html.remove(); };
  }

  // ════════════════════════════════════════════════
  //  ЗАПУСК ПЛАГИНА
  // ════════════════════════════════════════════════
  function startPlugin() {
    Lampa.Component.add(COMP_NAME, AprelComponent);

    var manifest = {
      type: 'online',
      component: COMP_NAME,
      name: PLUGIN_TITLE,
      version: '5.1.1',
      description: 'Онлайн-просмотр через AprelKino (FHD без рекламы)'
    };

    function register() {
      Lampa.Component.add(COMP_NAME, AprelComponent);
      if (!Lampa.Manifest.plugins) Lampa.Manifest.plugins = [];
      if (!Array.isArray(Lampa.Manifest.plugins)) Lampa.Manifest.plugins = [Lampa.Manifest.plugins];

      if (!Lampa.Manifest.plugins.some(p => p.component === COMP_NAME)) {
        Lampa.Manifest.plugins.push(manifest);
      }
    }

    register();
    Lampa.Listener.follow('app', e => { if (e.type === 'ready') setTimeout(register, 500); });
    setTimeout(register, 1500);

    // Кнопка на странице фильма
    var btnHtml = `<div class="full-start__button selector view--online aprelkino-btn" data-subtitle="FHD без рекламы">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <path d="M8 5v14l11-7z"/>
      </svg>
      <span>${PLUGIN_TITLE}</span>
    </div>`;

    function addButton(container, movie) {
      if (!container || !container.length || container.find('.aprelkino-btn').length) return;

      var btn = $(btnHtml);
      btn.on('hover:enter', () => {
        Lampa.Activity.push({
          component: COMP_NAME,
          title: PLUGIN_TITLE,
          search: movie.title || movie.name || '',
          search_one: movie.title || movie.name || '',
          search_two: movie.original_title || movie.original_name || '',
          movie: movie
        });
      });

      container.after(btn);
    }

    // Надёжная подписка на кнопку
    Lampa.Listener.follow('full', e => {
      if (e.type === 'complite' && e.object?.activity) {
        setTimeout(() => {
          var container = e.object.activity.render().find('.view--torrent');
          if (container.length) addButton(container, e.data?.movie || e.object.card);
        }, 300);
      }
    });

    // Попытка добавить кнопку сразу, если уже открыт фильм
    setTimeout(() => {
      try {
        if (Lampa.Activity.active()?.component === 'full') {
          var cont = Lampa.Activity.active().activity.render().find('.view--torrent');
          if (cont.length) addButton(cont, Lampa.Activity.active().card);
        }
      } catch (e) {}
    }, 800);

    console.log('[AprelKino] v5.1.1 успешно загружен');
  }

  if (window.appready) startPlugin();
  else Lampa.Listener.follow('app', e => { if (e.type === 'ready') startPlugin(); });

  function withEp(url, s, e) {
    if (!s) return url;
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'season=' + s + '&episode=' + (e || 1);
  }
})();