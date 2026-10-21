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

  function articleCard(item, uiLang, apiLocale) {
    const article = document.createElement('article');
    article.className = 'latest-news-card';

    const art = document.createElement('div');
    art.className = 'latest-news-art';
    art.setAttribute('aria-hidden', 'true');
    art.textContent = 'FQ';

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
    title.appendChild(titleLink);

    const summary = document.createElement('p');
    summary.textContent = item.summary;

    const read = document.createElement('a');
    read.className = 'latest-news-read';
    read.href = titleLink.href;
    read.textContent = `${translations[uiLang]?.latest_news_read || 'Read article'} →`;

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
