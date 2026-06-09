/**
 * Lampa Plugin — AprelKino
 * Версия: 5.2.1
 * Добавлены логи для отладки
 */

(function () {
  'use strict';

  var COMP_NAME  = 'aprelkino_online';
  var PLUGIN_TITLE = 'AprelKino';
  var BASE = 'https://aprelteam.gokino.by';
  var SEARCH_BASE = 'https://gokino.by/matrix/search.php';

  var CACHE = {};
  function cacheSet(k, v) { CACHE[k] = { t: Date.now(), v: v }; }
  function cacheGet(k) {
    var c = CACHE[k];
    if (!c) return null;
    if (Date.now() - c.t > 1800000) { delete CACHE[k]; return null; }
    return c.v;
  }

  // Улучшенный парсер Markdown-ссылок
  function parseMatrixSearch(html) {
    console.log('[AprelKino] parseMatrixSearch: html length =', html.length);
    var out = [];
    var re = /https:\/\/aprelteam\.gokino\.by\/team\/(\d+)-[^"\s'<>)]+/gi;
    var seen = {};
    var m;
    while ((m = re.exec(html)) !== null && out.length < 8) {
      if (seen[m[1]]) continue;
      seen[m[1]] = 1;
      var fullUrl = BASE + '/team/' + m[1] + '-aprel-1998.html';
      out.push(fullUrl);
      console.log('[AprelKino] Found link:', fullUrl);
    }
    console.log('[AprelKino] parseMatrixSearch found', out.length, 'links');
    return out;
  }

  // Улучшенный поиск iframe (учитывает not-xfgiven теги)
  function findIframe(html) {
    console.log('[AprelKino] findIframe: html length =', html ? html.length : 0);

    var skip = /youtube|youtu\.be|vk\.com|ok\.ru|kinopoisk\.ru/i;

    // Прямой поиск iframe
    var re = /<iframe[^>]+src="([^"]{15,})"[^>]*>/gi;
    var m;
    while ((m = re.exec(html)) !== null) {
      if (!skip.test(m[1])) {
        console.log('[AprelKino] Found direct iframe:', m[1]);
        return m[1];
      }
    }

    // Поиск в скрытых тегах alloha / turbo / vcdn
    var hidden = html.match(/\[not-xfgiven_iframe_(\w+)\](.*?)\[\/not-xfgiven_iframe_\w+\]/is);
    if (hidden && hidden[2]) {
      var hiddenRe = /src=["']([^"']{15,})["']/i;
      var hm = hiddenRe.exec(hidden[2]);
      if (hm && !skip.test(hm[1])) {
        console.log('[AprelKino] Found hidden iframe:', hm[1]);
        return hm[1];
      }
    }

    // data-iframe
    var di = html.match(/data-iframe=["']([^"']{15,})["']/i);
    if (di) {
      console.log('[AprelKino] Found data-iframe:', di[1]);
      return di[1];
    }

    console.log('[AprelKino] No iframe found');
    return null;
  }

  function findKpId(html) {
    // ... (оставляем как было)
    var pp = [/kinopoisk[_-]id['":\s=]+(\d+)/i, /data-kp=["'](\d+)["']/i, /kinopoisk\.ru\/(?:film|series)\/(\d+)/i];
    for (var i = 0; i < pp.length; i++) {
      var m = html.match(pp[i]);
      if (m) return m[1];
    }
    return null;
  }

  function fixProto(url) {
    return url && url.indexOf('//') === 0 ? 'https:' + url : url;
  }

  // ====================== КОМПОНЕНТ ======================
  function AprelComponent(object) {
    var self = this;
    var network = new Lampa.Reguest();
    var active = true;
    var html = Lampa.Template.get('lampac_content_loading', {}, true);

    this.start = function () {
      console.log('[AprelKino] start() called with object:', object);
      self.activity.loader(true);

      var movie = object.movie || {};
      var title = (object.search || object.search_one || movie.title || movie.name || '').trim();
      var origTitle = (object.search_two || movie.original_title || movie.original_name || '').trim();
      var kpId = movie.kinopoisk_id || (movie.external_ids && movie.external_ids.kinopoisk) || null;

      console.log('[AprelKino] Search params:', {title, origTitle, kpId});

      function done(iframeUrl) {
        console.log('[AprelKino] done() iframeUrl =', iframeUrl);
        if (!active) return;
        self.activity.loader(false);
        if (!iframeUrl) return self.empty();

        var streams = [{ title: 'FHD 1080p', url: iframeUrl, quality: '1080p' }];
        if (object.s) {
          var ep = object.e || 1;
          streams.unshift({ title: 'С' + object.s + ' Е' + ep, url: withEp(iframeUrl, object.s, ep), quality: '1080p' });
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

      function fail(msg) {
        console.log('[AprelKino] FAIL:', msg);
        if (!active) return;
        self.activity.loader(false);
        self.empty();
      }

      function loadPage(pageUrl) {
        console.log('[AprelKino] loadPage:', pageUrl);
        var ck = cacheGet('pg_' + pageUrl);
        if (ck !== null) return done(ck || null);

        network.timeout(15000);
        network.native(pageUrl, pageHtml => {
          var iframe = findIframe(pageHtml);
          if (!iframe) {
            var kp = findKpId(pageHtml);
            if (kp) iframe = 'https://hdvb.ru/embed/' + kp;
          }
          iframe = fixProto(iframe);
          cacheSet('pg_' + pageUrl, iframe || false);
          done(iframe);
        }, () => fail('loadPage error'), false);
      }

      function matrixSearch(q) {
        if (!q) return fail('no query');
        
        var url = SEARCH_BASE + '?q=' + encodeURIComponent(q);
        console.log('[AprelKino] matrixSearch:', url);

        var ck = cacheGet('m_' + q);
        if (ck !== null) return ck.length ? loadPage(ck[0]) : fail('no results in cache');

        network.timeout(15000);
        network.native(url, html => {
          var links = parseMatrixSearch(html);
          cacheSet('m_' + q, links);
          links.length ? loadPage(links[0]) : fail('matrixSearch: no links');
        }, () => fail('matrixSearch network error'), false);
      }

      // Запуск поиска
      if (kpId) {
        console.log('[AprelKino] Trying KP ID:', kpId);
        var kpUrl = BASE + '/xfsearch/kinopoisk_id/' + kpId + '/';
        network.native(kpUrl, html3 => {
          var links = parseMatrixSearch(html3);
          if (links.length) loadPage(links[0]);
          else matrixSearch(title || origTitle);
        }, () => matrixSearch(title || origTitle), false);
      } else {
        matrixSearch(title || origTitle);
      }

      return html;
    };

    this.empty = function () {
      html.empty().append(`<div class="empty"><div class="empty__title">${PLUGIN_TITLE}: ничего не найдено</div></div>`);
      self.activity.loader(false);
      self.activity.toggle();
    };

    this.render = () => html;
    this.stop = () => { active = false; network.clear(); };
    this.destroy = () => { active = false; network.clear(); html.remove(); };
  }

  // ====================== ЗАПУСК ======================
  function startPlugin() {
    Lampa.Component.add(COMP_NAME, AprelComponent);

    var manifest = { type: 'online', component: COMP_NAME, name: PLUGIN_TITLE, version: '5.2.1', description: 'AprelKino с отладкой' };

    function register() {
      Lampa.Component.add(COMP_NAME, AprelComponent);
      if (!Lampa.Manifest.plugins) Lampa.Manifest.plugins = [];
      if (!Array.isArray(Lampa.Manifest.plugins)) Lampa.Manifest.plugins = [Lampa.Manifest.plugins];
      var idx = Lampa.Manifest.plugins.findIndex(function(p) { return p.component === COMP_NAME; });
      if (idx === -1) {
        Lampa.Manifest.plugins.push(manifest);
      } else {
        Lampa.Manifest.plugins[idx] = manifest;
      }
    }

    register();
    Lampa.Listener.follow('app', e => { if (e.type === 'ready') setTimeout(register, 300); });

    console.log('[AprelKino] v5.2.1 загружен — смотри логи в консоли браузера');
  }

  if (window.appready) startPlugin();
  else Lampa.Listener.follow('app', e => { if (e.type === 'ready') startPlugin(); });

  function withEp(url, s, e) {
    if (!s) return url;
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'season=' + s + '&episode=' + (e || 1);
  }
})();
