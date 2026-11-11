(() => {
  function value(name) {
    return document.body.dataset[name] || '';
  }

  function context() {
    return {
      locale: value('analyticsLocale'),
      category_key: value('analyticsCategory'),
      competition_key: value('analyticsCompetition'),
      club_key: value('analyticsClub')
    };
  }

  function track(name, details = {}) {
    return window.footballQuizAnalytics?.track(name, { ...context(), ...details });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const surface = value('analyticsSurface');
    if (surface === 'news_list') {
      track('news_section_view');
    } else if (surface === 'news_article' && value('analyticsArticleId')) {
      track('news_article_open', { article_id: value('analyticsArticleId') });
    }

    document.addEventListener('click', event => {
      const target = event.target.closest('[data-analytics-event]');
      if (!target) return;

      const details = {};
      ['articleId', 'categoryKey', 'competitionKey', 'clubKey', 'placement', 'position'].forEach(key => {
        if (target.dataset[key]) details[key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)] = target.dataset[key];
      });
      if (details.position) details.position = Number.parseInt(details.position, 10);
      track(target.dataset.analyticsEvent, details);
    });
  });
})();
