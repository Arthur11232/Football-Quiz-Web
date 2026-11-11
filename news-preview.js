(() => {
  const section = document.getElementById('latest-news');
  const grid = document.getElementById('latest-news-grid');
  if (!section || !grid) return;

  const localApi = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
  const apiBase = localApi
    ? 'http://127.0.0.1:8080'
    : window.location.hostname === 'staging.footballquiz.club'
      ? 'https://api-staging.footballquiz.club'
      : 'https://api.footballquiz.club';
  let controller = null;

  function localeForApi(lang) {
    return lang === 'am' ? 'hy' : lang;
  }

  function currentLanguage() {
    const stored = localStorage.getItem('football_quiz_lang') || 'en';
    return ['en', 'ru', 'am'].includes(stored) ? stored : 'en';
  }

  function articleVisual(item) {
    const title = item.title || '';
    const score = title.match(/\b\d{1,2}\s*[-:]\s*\d{1,2}\b/u)?.[0]?.replace('-', ':');
    const award = item.slug?.includes('player-of-the-week') || /\bplayer of the week\b/iu.test(title)
      ? 'POTW'
      : /(?:rising-star|(?:player|goal|save|young-player)-of-the-(?:month|season|year))/.test(item.slug || '')
          || /\b(?:player|goal|save|rising star|young player) of the (?:month|season|year)\b/iu.test(title)
        ? 'AWARD'
        : '';
    const category = item.categories?.[0]?.category_key || '';
    const competition = item.competitions?.[0]?.competition_key || '';
    const visuals = {
      uefa: { variant: 'category-uefa', metric: 'UEFA', label: 'UEFA' },
      'world-cup': { variant: 'category-world-cup', metric: 'WC', label: 'World Cup' },
      'premier-league': { variant: 'league-premier', metric: 'PL', label: 'Premier League' },
      'la-liga': { variant: 'league-la-liga', metric: 'LL', label: 'La Liga' },
      'serie-a': { variant: 'league-serie-a', metric: 'SA', label: 'Serie A' },
      bundesliga: { variant: 'league-bundesliga', metric: 'BL', label: 'Bundesliga' },
      'ligue-1': { variant: 'league-ligue-1', metric: 'L1', label: 'Ligue 1' }
    };
    const visual = visuals[competition] || visuals[category] || { variant: 'brand-news', metric: 'NEWS', label: 'Football Quiz' };
    return { ...visual, metric: score || award || visual.metric };
  }

  function articleCard(item, uiLang, apiLocale) {
    const article = document.createElement('article');
    article.className = 'latest-news-card';

    const art = document.createElement('div');
    art.className = 'latest-news-art';
    art.setAttribute('aria-hidden', 'true');
    if (item.hero_image_url) {
      art.classList.add('latest-news-art--image');
      const image = document.createElement('img');
      image.src = item.hero_image_url;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      art.append(image);
    } else {
      const visual = articleVisual(item);
      art.classList.add(`latest-news-art--${visual.variant}`);
      const label = document.createElement('span');
      label.textContent = visual.label;
      const metric = document.createElement('strong');
      metric.textContent = visual.metric;
      art.append(label, metric);
    }

    const body = document.createElement('div');
    body.className = 'latest-news-card-body';

    const meta = document.createElement('div');
    meta.className = 'latest-news-meta';
    const date = new Date(item.published_at);
    if (Number.isNaN(date.getTime())) {
      meta.textContent = '';
    } else if (apiLocale === 'en') {
      meta.textContent = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
    } else {
      meta.textContent = [
        String(date.getUTCDate()).padStart(2, '0'),
        String(date.getUTCMonth() + 1).padStart(2, '0'),
        date.getUTCFullYear()
      ].join('.');
    }

    const title = document.createElement('h3');
    const titleLink = document.createElement('a');
    titleLink.href = localApi
      ? `/news/article.php?locale=${apiLocale}&slug=${encodeURIComponent(item.slug)}`
      : `/${apiLocale}/news/${encodeURIComponent(item.slug)}/`;
    titleLink.textContent = item.title;
    titleLink.dataset.newsPlacement = 'latest_news_card';
    title.appendChild(titleLink);

    const summary = document.createElement('p');
    summary.textContent = item.summary;

    const read = document.createElement('a');
    read.className = 'latest-news-read';
    read.href = titleLink.href;
    read.textContent = `${translations[uiLang]?.latest_news_read || 'Read article'} →`;
    read.dataset.newsPlacement = 'latest_news_card';

    body.append(meta, title, summary, read);
    article.append(art, body);
    return article;
  }

  async function load(lang = currentLanguage()) {
    controller?.abort();
    controller = new AbortController();
    const apiLocale = localeForApi(lang);

    try {
      const response = await fetch(`${apiBase}/v1/news?locale=${apiLocale}&limit=3`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`News API ${response.status}`);
      const payload = await response.json();
      const items = payload?.success === true && Array.isArray(payload?.data?.items)
        ? payload.data.items
        : [];
      if (items.length === 0) {
        section.hidden = true;
        grid.replaceChildren();
        return;
      }

      grid.replaceChildren(...items.map(item => articleCard(item, lang, apiLocale)));
      section.hidden = false;
      section.classList.add('active');
    } catch (error) {
      if (error.name !== 'AbortError') {
        section.hidden = true;
        grid.replaceChildren();
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => load());
  window.addEventListener('footballquiz:language', event => load(event.detail?.lang || currentLanguage()));
})();
