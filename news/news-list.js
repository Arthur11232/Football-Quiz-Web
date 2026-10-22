(() => {
  const button = document.getElementById('news-load-more');
  const grid = document.querySelector('.news-grid');
  if (!button || !grid) return;

  const localApi = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
  const apiBase = localApi
    ? 'http://127.0.0.1:8080'
    : window.location.hostname === 'staging.footballquiz.club'
      ? 'https://api-staging.footballquiz.club'
      : 'https://api.footballquiz.club';

  function articleUrl(locale, slug) {
    return localApi
      ? `/news/article.php?locale=${locale}&slug=${encodeURIComponent(slug)}`
      : `/${locale}/news/${encodeURIComponent(slug)}/`;
  }

  function listUrl(locale, category = '', competition = '', club = '') {
    if (localApi) {
      const params = new URLSearchParams({ locale });
      if (category) params.set('category', category);
      if (competition) params.set('competition', competition);
      if (club) params.set('club', club);
      return `/news/index.php?${params}`;
    }
    let path = `/${locale}/news/`;
    if (category) path += `${encodeURIComponent(category)}/`;
    if (competition) path += `${encodeURIComponent(competition)}/`;
    if (club) path += `club/${encodeURIComponent(club)}/`;
    return path;
  }

  function categoryLabel(locale, key) {
    const labels = {
      en: { 'top-5': 'Top 5 leagues', uefa: 'UEFA', 'world-cup': 'World Cup' },
      ru: { 'top-5': 'Топ-5 лиг', uefa: 'UEFA', 'world-cup': 'Чемпионат мира' },
      hy: { 'top-5': 'Թոփ 5 լիգաներ', uefa: 'UEFA', 'world-cup': 'Աշխարհի առաջնություն' }
    };
    return labels[locale]?.[key] || key;
  }

  function competitionLabel(locale, key) {
    const labels = {
      en: { 'premier-league': 'Premier League', 'la-liga': 'La Liga', 'serie-a': 'Serie A', bundesliga: 'Bundesliga', 'ligue-1': 'Ligue 1' },
      ru: { 'premier-league': 'Премьер-лига', 'la-liga': 'Ла Лига', 'serie-a': 'Серия А', bundesliga: 'Бундеслига', 'ligue-1': 'Лига 1' },
      hy: { 'premier-league': 'Պրեմիեր լիգա', 'la-liga': 'Լա Լիգա', 'serie-a': 'Սերիա A', bundesliga: 'Բունդեսլիգա', 'ligue-1': 'Լիգա 1' }
    };
    return labels[locale]?.[key] || key;
  }

  function formattedDate(value, locale) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    if (locale === 'en') {
      return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
    }

    return [
      String(date.getUTCDate()).padStart(2, '0'),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      date.getUTCFullYear()
    ].join('.');
  }

  function articleVisual(item) {
    const visuals = {
      'real-madrid-five-match-october-run': { variant: 'real-schedule', metric: 5, marks: 5 },
      'barcelona-three-golden-boy-finalists': { variant: 'barcelona-talents', metric: 3, marks: 3 },
      'arsenal-2025-26-premier-league-champions': { variant: 'arsenal-champions', metric: 14, marks: 1 },
      'bayern-seven-matches-in-22-days': { variant: 'bayern-schedule', metric: 7, marks: 7 },
      'inter-nine-matches-in-29-days': { variant: 'inter-schedule', metric: 9, marks: 9 },
      'psg-comeback-win-at-strasbourg': { variant: 'psg-comeback', metric: 3, marks: 3 }
    };
    return visuals[item.slug] || null;
  }

  function card(item) {
    const article = document.createElement('article');
    article.className = 'news-card';

    const art = document.createElement('div');
    art.className = 'news-card-art';
    art.setAttribute('aria-hidden', 'true');
    const visual = articleVisual(item);
    if (visual) {
      art.classList.add(`news-card-art--${visual.variant}`);
      const club = document.createElement('span');
      club.className = 'news-card-art-club';
      club.textContent = item.clubs?.[0]?.name || 'Football Quiz';
      const metric = document.createElement('strong');
      metric.className = 'news-card-art-metric';
      metric.textContent = String(visual.metric);
      const marks = document.createElement('span');
      marks.className = 'news-card-art-marks';
      for (let index = 0; index < visual.marks; index += 1) {
        marks.append(document.createElement('i'));
      }
      art.append(club, metric, marks);
    } else {
      const mark = document.createElement('span');
      mark.className = 'news-card-art-fallback';
      mark.textContent = 'FQ';
      art.append(mark);
    }

    const body = document.createElement('div');
    body.className = 'news-card-body';
    const meta = document.createElement('div');
    meta.className = 'news-meta';
    const time = document.createElement('time');
    time.dateTime = item.published_at || '';
    time.textContent = formattedDate(item.published_at, button.dataset.locale);
    meta.append(time);
    (item.categories || []).forEach(category => {
      const label = document.createElement('a');
      label.className = 'news-category-tag';
      label.href = listUrl(button.dataset.locale, category.slug);
      label.textContent = categoryLabel(button.dataset.locale, category.category_key);
      meta.append(label);
    });
    (item.competitions || []).forEach(competition => {
      const label = document.createElement('a');
      label.className = 'news-competition-tag';
      label.href = listUrl(button.dataset.locale, 'top-5', competition.slug);
      label.textContent = competitionLabel(button.dataset.locale, competition.competition_key);
      meta.append(label);
    });
    (item.clubs || []).forEach(club => {
      const label = document.createElement('span');
      label.textContent = club.name;
      meta.append(label);
    });

    const heading = document.createElement('h2');
    const titleLink = document.createElement('a');
    titleLink.href = articleUrl(button.dataset.locale, item.slug);
    titleLink.textContent = item.title;
    heading.append(titleLink);
    const summary = document.createElement('p');
    summary.textContent = item.summary;
    const read = document.createElement('a');
    read.className = 'news-read';
    read.href = titleLink.href;
    read.textContent = `${button.dataset.readLabel} →`;

    body.append(meta, heading, summary, read);
    article.append(art, body);
    return article;
  }

  button.addEventListener('click', async () => {
    if (!button.dataset.cursor || button.disabled) return;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    const params = new URLSearchParams({
      locale: button.dataset.locale,
      limit: localApi ? '2' : '12',
      cursor: button.dataset.cursor
    });
    if (button.dataset.category) params.set('category', button.dataset.category);
    if (button.dataset.competition) params.set('competition', button.dataset.competition);
    if (button.dataset.club) params.set('club', button.dataset.club);

    try {
      const response = await fetch(`${apiBase}/v1/news?${params}`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`News API ${response.status}`);
      const payload = await response.json();
      const items = payload?.success === true && Array.isArray(payload?.data?.items) ? payload.data.items : [];
      grid.append(...items.map(card));
      button.dataset.cursor = payload?.data?.next_cursor || '';
      button.closest('.news-load-more-wrap').hidden = !button.dataset.cursor;
    } catch (error) {
      button.textContent = button.dataset.errorLabel;
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  });
})();
