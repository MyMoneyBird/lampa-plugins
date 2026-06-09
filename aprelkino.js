/**
 * Lampa Plugin — AprelKino балансер
 * Версия: 4.0.0
 *
 * Использует тот же интерфейс что videocdn.js / rezka.js из исходников Lampa:
 *   search(), extendChoice(), reset(), filter(), destroy()
 * Регистрируется через Lampa.Listener('full') — стандартный способ.
 */

(function () {
  'use strict';

  var PLUGIN_NAME  = 'aprelkino';
  var PLUGIN_TITLE = 'AprelKino';
  var BASE         = 'https://aprelteam.gokino.by';

  // ─── Простой кэш ─────────────────────────────────
  var CACHE = {};
  function cacheSet(k, v) { CACHE[k] = { t: Date.now(), v: v }; }
  function cacheGet(k) {
    var c = CACHE[k];
    if (!c) return null;
    if (Date.now() - c.t > 1800000) { delete CACHE[k]; return null; }
    return c.v;
  }

  // ─── HTTP через встроенный Lampa.Reguest ─────────
  function fetch(url, callback, fallback) {
    var network = new Lampa.Reguest();
    network.timeout(10000);
    network.native(url, callback, fallback, false);
    return network;
  }

  // ─── Парсим карточки из HTML поиска ──────────────
  function parseCards(html) {
    var out = [];
    // Ищем ссылки /films/123-title.html или /serials/...
    var re  = /href="(\/(?:films|serials|mults|anime)\/(\d+)-[^"]+\.html)"/gi;
    var seen = {};
    var m;
    while ((m = re.exec(html)) !== null && out.length < 8) {
      if (seen[m[2]]) continue;
      seen[m[2]] = 1;
      out.push({ path: m[1], id: m[2] });
    }
    return out;
  }

  // ─── Ищем iframe плеера ───────────────────────────
  function findIframe(html) {
    var skip = /youtube|youtu\.be|vk\.com|ok\.ru|kinopoisk\.ru/i;
    var re   = /<iframe[^>]+src="([^"]{15,})"[^>]*>/gi;
    var m;
    while ((m = re.exec(html)) !== null) {
      if (!skip.test(m[1])) return m[1];
    }
    // data-iframe (альтернативный вариант в DLE-темах)
    var di = html.match(/data-iframe="([^"]{15,})"/i);
    if (di) return di[1];
    return null;
  }

  // ─── KP ID из HTML страницы ───────────────────────
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
    if (!url) return url;
    return url.indexOf('//') === 0 ? 'https:' + url : url;
  }

  function withEp(url, s, e) {
    if (!s) return url;
    var sep = url.indexOf('?') >= 0 ? '&' : '?';
    return url + sep + 'season=' + s + '&episode=' + (e || 1);
  }

  // ════════════════════════════════════════════════
  //  БАЛАНСЕР — конструктор с интерфейсом Lampa
  // ════════════════════════════════════════════════

  function Balancer(object, comp) {
    // object — карточка фильма { movie: {...}, s, e }
    // comp   — ссылка на компонент Online (для вызова comp.activity, comp.append и т.д.)
    var self    = this;
    var network = new Lampa.Reguest();
    var active  = true;

    this.network = network;

    // Получаем данные фильма
    var movie  = object.movie || object;
    var title  = movie.title || movie.name || '';
    var origTitle = movie.original_title || movie.original_name || '';
    var kpId   = movie.kinopoisk_id
              || (movie.external_ids && movie.external_ids.kinopoisk)
              || null;
    var season  = object.s || null;
    var episode = object.e || null;

    // search() вызывается компонентом при инициализации
    this.search = function (movie_data) {
      if (!active) return;

      // Шаг 1 — пробуем xfsearch по KP ID
      if (kpId) {
        var kpUrl = BASE + '/xfsearch/kinopoisk_id/' + kpId + '/';
        var ck = cacheGet(kpUrl);
        if (ck !== null) {
          if (ck) { self._loadPage(ck); return; }
          // null = уже пробовали, не нашли — идём к текстовому поиску
        } else {
          network.timeout(10000);
          network.native(kpUrl, function (html) {
            if (!active) return;
            var cards = parseCards(html);
            if (cards.length > 0) {
              cacheSet(kpUrl, BASE + cards[0].path);
              self._loadPage(BASE + cards[0].path);
            } else {
              cacheSet(kpUrl, false);
              self._textSearch(title, origTitle);
            }
          }, function () {
            if (active) self._textSearch(title, origTitle);
          }, false);
          return;
        }
      }

      self._textSearch(title, origTitle);
    };

    this._textSearch = function (t, orig) {
      if (!active) return;
      var q   = encodeURIComponent(t);
      var url = BASE + '/?do=search&subaction=search&story=' + q;
      var ck  = cacheGet(url);

      if (ck !== null) {
        if (ck) { self._loadPage(ck); return; }
        // Попробуем оригинальное название
        if (orig && orig !== t) {
          self._textSearch(orig, '');
        } else {
          self._empty();
        }
        return;
      }

      network.timeout(10000);
      network.native(url, function (html) {
        if (!active) return;
        var cards = parseCards(html);
        if (cards.length > 0) {
          cacheSet(url, BASE + cards[0].path);
          self._loadPage(BASE + cards[0].path);
        } else {
          cacheSet(url, false);
          if (orig && orig !== t) {
            self._textSearch(orig, '');
          } else {
            self._empty();
          }
        }
      }, function () {
        if (active) self._empty();
      }, false);
    };

    this._loadPage = function (pageUrl) {
      if (!active) return;
      var ck = cacheGet('page_' + pageUrl);
      if (ck !== null) {
        self._render(ck);
        return;
      }

      network.timeout(10000);
      network.native(pageUrl, function (html) {
        if (!active) return;
        var iframe = findIframe(html);
        var kp     = findKpId(html);

        if (!iframe && kp) {
          iframe = 'https://hdvb.ru/embed/' + kp;
        }

        if (!iframe) { self._empty(); return; }

        iframe = fixProto(iframe);
        cacheSet('page_' + pageUrl, iframe);
        self._render(iframe);
      }, function () {
        if (active) self._empty();
      }, false);
    };

    this._render = function (iframeBase) {
      if (!active) return;

      var streams = [];

      if (season) {
        var ep = episode || 1;
        streams.push({
          title:   'С' + season + ' Е' + ep + ' — FHD',
          url:     withEp(iframeBase, season, ep),
          quality: '1080p',
          iframe:  true
        });
        streams.push({
          title:   'Встроенный плеер (выбор серии)',
          url:     iframeBase,
          quality: '1080p',
          iframe:  true
        });
      } else {
        streams.push({
          title:   'FHD 1080p',
          url:     iframeBase,
          quality: '1080p',
          iframe:  true
        });
      }

      // Передаём потоки в компонент
      comp.activity(streams);
    };

    this._empty = function () {
      if (!active) return;
      comp.activity([]);
      Lampa.Noty.show(PLUGIN_TITLE + ': не найдено');
    };

    // Обязательные методы интерфейса балансера
    this.extendChoice = function () {};
    this.reset        = function () {};
    this.filter       = function () {};
    this.destroy      = function () {
      active = false;
      network.clear();
    };
  }

  // ════════════════════════════════════════════════
  //  РЕГИСТРАЦИЯ через Lampa.Listener('full')
  //  Именно так делает встроенный online.js
  // ════════════════════════════════════════════════

  function register() {
    // Добавляем кнопку "AprelKino" на страницу фильма
    Lampa.Listener.follow('full', function (e) {
      if (e.type === 'complite') {
        // e.object — карточка фильма
        // e.element — DOM-элемент страницы
        // Добавляем в список источников онлайн-просмотра
        if (Lampa.Api && Lampa.Api.sources) {
          Lampa.Api.sources[PLUGIN_NAME] = {
            title:   PLUGIN_TITLE,
            search:  function (obj, comp) {
              return new Balancer(obj, comp);
            },
            search_two: function (obj, comp) {
              return new Balancer(obj, comp);
            }
          };
        }
      }
    });

    // Регистрируем балансер в онлайн-плагине (если уже загружен)
    try {
      Lampa.Api.sources[PLUGIN_NAME] = {
        title:      PLUGIN_TITLE,
        search:     function (obj, comp) { return new Balancer(obj, comp); },
        search_two: function (obj, comp) { return new Balancer(obj, comp); }
      };
    } catch (e) {
      // Онлайн-плагин ещё не загружен, добавим через Listener выше
    }

    // Добавляем в UI список источников
    Lampa.Listener.follow('online', function (e) {
      if (e.type === 'start') {
        e.object.sources[PLUGIN_NAME] = {
          title:      PLUGIN_TITLE,
          search:     function (obj, comp) { return new Balancer(obj, comp); },
          search_two: function (obj, comp) { return new Balancer(obj, comp); }
        };
      }
    });

    console.log('[AprelKino] v4.0 registered');
  }

  // Ждём готовности приложения
  if (window.appready) {
    register();
  } else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type === 'ready') register();
    });
  }

})();
