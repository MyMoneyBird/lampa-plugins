/**
 * ╔══════════════════════════════════════════════════════╗
 * ║          Lampa Plugin — AprelKino Source             ║
 * ║  • Поиск по названию + сопоставление по KP ID        ║
 * ║  • Поддержка сезонов и серий                         ║
 * ║  • CORS-прокси через OpenWrt (опционально)           ║
 * ║  Версия: 2.0.0                                       ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * УСТАНОВКА:
 *   Lampa → Настройки → Расширения → Добавить плагин
 *   URL: http://192.168.1.1/lampa-plugins/aprelkino.js
 */

(function () {
  'use strict';

  // ════════════════════════════════════════════════
  //  КОНФИГУРАЦИЯ
  // ════════════════════════════════════════════════

  var CFG = {
    // Базовый URL сайта.
    // Если используете CORS-прокси на роутере — замените на:
    //   'http://192.168.1.1/aprelkino'
    base: 'https://aprelteam.gokino.by',

    name:      'AprelKino',
    timeout:   8000,
    cacheTime: 30 * 60 * 1000   // 30 минут
  };

  // ════════════════════════════════════════════════
  //  КЭШ
  // ════════════════════════════════════════════════

  var _cache = {};

  function cacheSet(key, val) {
    _cache[key] = { ts: Date.now(), val: val };
  }

  function cacheGet(key) {
    var item = _cache[key];
    if (!item) return null;
    if (Date.now() - item.ts > CFG.cacheTime) { delete _cache[key]; return null; }
    return item.val;
  }

  // ════════════════════════════════════════════════
  //  HTTP-ПОМОЩНИК
  // ════════════════════════════════════════════════

  function fetchUrl(url) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = CFG.timeout;
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 400) resolve(xhr.responseText);
        else reject(new Error('HTTP ' + xhr.status));
      };
      xhr.onerror   = function () { reject(new Error('Network error')); };
      xhr.ontimeout = function () { reject(new Error('Timeout')); };
      xhr.send();
    });
  }

  // ════════════════════════════════════════════════
  //  ПАРСИНГ HTML
  // ════════════════════════════════════════════════

  /**
   * Парсит карточки из страницы поиска DLE.
   * DLE выдаёт блоки <article class="short ...">
   */
  function parseSearchCards(html) {
    var results = [];
    var articleRe = /<article[^>]+class="[^"]*short[^"]*"[^>]*>([\s\S]+?)<\/article>/gi;
    var m;
    while ((m = articleRe.exec(html)) !== null) {
      var block = m[1];

      var urlMatch   = block.match(/href=["'](\/(?:films|serials|mults|anime)\/[^"']+)["']/i);
      var imgMatch   = block.match(/src=["']([^"']+(?:jpg|png|webp)[^"']*)["']/i);
      var titleMatch = block.match(/class="[^"]*(?:card-title|film-name|short-title)[^"]*"[^>]*>\s*(?:<[^>]+>)?([^<]+)/i)
                    || block.match(/<h2[^>]*>([^<]+)<\/h2>/i)
                    || block.match(/<a[^>]+title=["']([^"']{3,80})["']/i);

      if (urlMatch && titleMatch) {
        results.push({
          url:    CFG.base + urlMatch[1],
          poster: imgMatch ? imgMatch[1] : '',
          title:  titleMatch[1].trim().replace(/&amp;/g, '&')
        });
      }
      if (results.length >= 12) break;
    }

    // Fallback: ищем ссылки напрямую если <article> не нашлось
    if (results.length === 0) {
      var linkRe = /href=["'](\/(?:films|serials|mults|anime)\/(\d+)-[^"']+)["'][^>]*>([^<]{3,80})</gi;
      while ((m = linkRe.exec(html)) !== null && results.length < 12) {
        results.push({
          url:    CFG.base + m[1],
          poster: '',
          title:  m[3].trim()
        });
      }
    }

    return results;
  }

  /**
   * Ищет KinopoiskID на странице фильма.
   * DLE хранит его в data-атрибутах, JS-переменных или meta-тегах.
   */
  function extractKpId(html) {
    var patterns = [
      /data-kinopoisk[_-]?id=["'](\d+)["']/i,
      /kinopoisk[_-]id["'\s:=]+(\d+)/i,
      /kp[_-]?id["'\s:=]+(\d+)/i,
      /kinopoisk\.ru\/(?:film|series)\/(\d+)/i,
      /"kp"\s*:\s*["']?(\d+)/i,
      /\bkpid\s*=\s*["']?(\d+)/i,
      /data-kp=["'](\d+)["']/i,
      /kinopoisk_id['":\s=]+(\d+)/i
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = html.match(patterns[i]);
      if (m) return m[1];
    }
    return null;
  }

  /**
   * Ищет iframe плеера на странице.
   * Aprel использует HDRezka, VideoCDN, HDVB и подобные.
   */
  function extractPlayerIframe(html) {
    var skipDomains = /youtube|youtu\.be|vk\.com|ok\.ru|kinopoisk\.ru|googlevideo/i;

    // Ищем все <iframe src="...">
    var iframeRe = /<iframe[^>]+src=["']([^"']{10,})["']/gi;
    var m;
    while ((m = iframeRe.exec(html)) !== null) {
      if (!skipDomains.test(m[1])) return m[1];
    }

    // JS-переменные с URL плеера
    var jsSrc = html.match(/(?:playerSrc|iframe_url|player_url|embedUrl)\s*[=:]\s*["']([^"']{15,})["']/i);
    if (jsSrc) return jsSrc[1];

    // data-iframe атрибут
    var dataIframe = html.match(/data-iframe=["']([^"']{15,})["']/i);
    if (dataIframe) return dataIframe[1];

    return null;
  }

  /**
   * Добавляет season/episode к URL плеера.
   * Все популярные балансеры поддерживают query-параметры.
   */
  function buildSerialUrl(iframeUrl, season, episode) {
    if (!season) return iframeUrl;
    var sep = iframeUrl.indexOf('?') >= 0 ? '&' : '?';
    return iframeUrl + sep + 'season=' + season + '&episode=' + episode;
  }

  // ════════════════════════════════════════════════
  //  ПОИСК ПО KINOPOISK ID
  // ════════════════════════════════════════════════

  /**
   * Ищет страницу фильма по KP ID через xfsearch DLE.
   * Это стандартный модуль поиска по дополнительным полям.
   */
  function findByKpId(kpId) {
    var cached = cacheGet('kp_' + kpId);
    if (cached !== null) return Promise.resolve(cached);

    // DLE xfsearch по полю kinopoisk_id
    var url = CFG.base + '/xfsearch/kinopoisk_id/' + kpId + '/';

    return fetchUrl(url).then(function (html) {
      var cards = parseSearchCards(html);
      var result = cards.length > 0 ? cards[0] : null;
      cacheSet('kp_' + kpId, result);
      return result;
    }).catch(function () {
      cacheSet('kp_' + kpId, null);
      return null;
    });
  }

  // ════════════════════════════════════════════════
  //  ОСНОВНАЯ ЛОГИКА
  // ════════════════════════════════════════════════

  var AprelSource = {

    /**
     * search(params, callback)
     *
     * params из Lampa содержат:
     *   .query / .title   — строка поиска
     *   .id               — KinopoiskID (если Lampa передаёт)
     *   .movie.kinopoisk_id — KP ID из карточки TMDB
     *   .year             — год (не обязательно)
     */
    search: function (params, callback) {
      var title = params.query || params.title || '';

      // Пытаемся получить KP ID из разных мест, куда Lampa его кладёт
      var kpId = params.id
               || params.kp_id
               || (params.movie && (params.movie.kinopoisk_id || params.movie.external_ids && params.movie.external_ids.kinopoisk))
               || null;

      if (kpId) kpId = String(kpId);

      // Шаг 1: точный поиск по KP ID
      var p = kpId ? findByKpId(kpId) : Promise.resolve(null);

      p.then(function (exact) {
        if (exact) {
          callback([{
            title:   exact.title,
            poster:  exact.poster,
            url:     exact.url,
            source:  CFG.name,
            quality: 'FHD',
            exact:   true
          }]);
          return;
        }

        // Шаг 2: текстовый поиск
        if (!title) { callback([]); return; }

        var key = 'search_' + title.toLowerCase();
        var cached = cacheGet(key);
        if (cached) { callback(cached); return; }

        var searchUrl = CFG.base + '/?do=search&subaction=search&story='
          + encodeURIComponent(title);

        fetchUrl(searchUrl).then(function (html) {
          var cards = parseSearchCards(html);
          var results = cards.map(function (c) {
            return { title: c.title, poster: c.poster, url: c.url,
                     source: CFG.name, quality: 'FHD' };
          });
          cacheSet(key, results);
          callback(results);
        }).catch(function () { callback([]); });

      }).catch(function () { callback([]); });
    },

    /**
     * video(params, callback)
     *
     * params:
     *   .url     — URL страницы фильма/сериала
     *   .season  — номер сезона (для сериалов)
     *   .episode — номер серии
     *
     * callback получает массив объектов потоков:
     *   [{ title, url, quality, iframe }]
     */
    video: function (params, callback) {
      var pageUrl = params.url;
      var season  = params.season  || params.s || null;
      var episode = params.episode || params.e || (season ? 1 : null);

      if (!pageUrl) { callback([]); return; }

      // Для iframe кэшируем базовый URL (без season/ep)
      var key = 'video_' + pageUrl;
      var cached = cacheGet(key);
      if (cached) {
        callback(buildStreams(cached, season, episode));
        return;
      }

      fetchUrl(pageUrl).then(function (html) {
        var iframe = extractPlayerIframe(html);
        var kpId   = extractKpId(html);

        // Нет iframe, но есть KP ID — пробуем популярные балансеры
        if (!iframe && kpId) {
          // Список балансеров для фолбека (без токенов — только публичные)
          iframe = 'https://hdvb.ru/embed/' + kpId;
        }

        if (!iframe) {
          Lampa.Noty.show(CFG.name + ': плеер не найден');
          callback([]);
          return;
        }

        if (iframe.indexOf('//') === 0) iframe = 'https:' + iframe;

        cacheSet(key, iframe);
        callback(buildStreams(iframe, season, episode));

      }).catch(function (e) {
        console.error('[AprelKino] video error:', e);
        callback([]);
      });
    }
  };

  // ════════════════════════════════════════════════
  //  ФОРМИРОВАНИЕ ПОТОКОВ
  // ════════════════════════════════════════════════

  function buildStreams(iframeBase, season, episode) {
    if (season) {
      var ep = episode || 1;
      return [
        {
          title:   'AprelKino — С' + season + ' Е' + ep + ' (FHD)',
          url:     buildSerialUrl(iframeBase, season, ep),
          quality: '1080p',
          iframe:  true
        },
        {
          title:   'AprelKino — Встроенный плеер (выбор серии)',
          url:     iframeBase,
          quality: '1080p',
          iframe:  true
        }
      ];
    }
    return [{
      title:   'AprelKino — FHD 1080p',
      url:     iframeBase,
      quality: '1080p',
      iframe:  true
    }];
  }

  // ════════════════════════════════════════════════
  //  РЕГИСТРАЦИЯ В LAMPA
  // ════════════════════════════════════════════════

  function register() {
    try {
      var api = Lampa.Source || Lampa.Balancer;
      if (!api) throw new Error('Lampa.Source not found');

      api.add(CFG.name, {
        search: function (p, cb) { AprelSource.search(p, cb); },
        video:  function (p, cb) { AprelSource.video(p, cb);  }
      });

      Lampa.Noty.show('✅ ' + CFG.name + ' v2.0 подключён');
      console.log('[AprelKino] registered, base:', CFG.base);
    } catch (e) {
      console.error('[AprelKino] registration error:', e);
    }
  }

  if (window.appready) {
    register();
  } else {
    try {
      Lampa.Listener.follow('app', function (e) {
        if (e.type === 'ready') register();
      });
    } catch (_) {
      var t = setInterval(function () {
        if (typeof Lampa !== 'undefined' && (Lampa.Source || Lampa.Balancer)) {
          clearInterval(t);
          register();
        }
      }, 500);
    }
  }

})();

/*
════════════════════════════════════════════════════════════════
  OpenWrt — CORS-прокси + раздача плагина

  1. opkg update && opkg install nginx

  2. /etc/nginx/conf.d/lampa.conf:

      server {
        listen 80;

        # Отдаём плагин
        location /lampa-plugins/ {
          root /www;
          add_header Access-Control-Allow-Origin *;
        }

        # Прокси к AprelKino (решает CORS)
        location /aprelkino/ {
          proxy_pass         https://aprelteam.gokino.by/;
          proxy_ssl_server_name on;
          proxy_set_header   Host aprelteam.gokino.by;
          proxy_set_header   Referer https://aprelteam.gokino.by/;
          add_header         Access-Control-Allow-Origin *;
          add_header         Access-Control-Allow-Methods "GET, OPTIONS";
        }
      }

  3. /etc/init.d/nginx restart

  4. Скопируйте aprelkino.js в /www/lampa-plugins/

  5. В плагине замените строку CFG.base на:
        base: 'http://192.168.1.1/aprelkino'

  6. В Lampa → Настройки → Расширения → Добавить плагин:
        http://192.168.1.1/lampa-plugins/aprelkino.js
════════════════════════════════════════════════════════════════
*/
