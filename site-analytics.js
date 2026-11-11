(() => {
  const local = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
  const apiBase = local
    ? 'http://127.0.0.1:8080'
    : window.location.hostname === 'staging.footballquiz.club'
      ? 'https://api-staging.footballquiz.club'
      : 'https://api.footballquiz.club';

  const eventFields = Object.freeze({
    landing_view: [],
    language_selected: ['from_locale'],
    landing_news_clicked: ['placement'],
    play_store_cta_clicked: ['placement'],
    qr_viewed: ['placement'],
    qr_cta_clicked: ['placement'],
    screenshot_preview_opened: ['target_key'],
    social_link_clicked: ['target_key'],
    legal_link_clicked: ['target_key'],
    news_section_view: ['category_key', 'competition_key', 'club_key'],
    news_article_open: ['article_id', 'position'],
    news_category_filter_select: ['category_key'],
    news_competition_filter_select: ['category_key', 'competition_key'],
    news_club_filter_select: ['category_key', 'competition_key', 'club_key'],
    news_load_more: ['category_key', 'competition_key', 'club_key', 'position'],
    news_source_click: ['article_id', 'position'],
    news_play_store_click: ['article_id', 'placement']
  });

  function eventId() {
    const secureCrypto = window.crypto;
    if (typeof secureCrypto?.randomUUID === 'function') return secureCrypto.randomUUID();
    if (typeof secureCrypto?.getRandomValues !== 'function') return null;

    const bytes = secureCrypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const value = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
  }

  function normalizedLocale(locale) {
    const value = locale === 'am' ? 'hy' : locale;
    return ['en', 'ru', 'hy'].includes(value) ? value : 'en';
  }

  function track(eventName, details = {}) {
    const allowedFields = eventFields[eventName];
    const id = eventId();
    if (!allowedFields || !id) return Promise.resolve(false);

    const payload = {
      event_id: id,
      event_name: eventName,
      locale: normalizedLocale(details.locale || document.documentElement.lang)
    };
    allowedFields.forEach(field => {
      const value = details[field];
      if (value !== undefined && value !== null && value !== '') {
        payload[field] = field === 'from_locale' ? normalizedLocale(value) : value;
      }
    });

    return fetch(`${apiBase}/v1/analytics/events`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    }).then(response => response.ok).catch(() => false);
  }

  window.footballQuizAnalytics = Object.freeze({ track });
})();
