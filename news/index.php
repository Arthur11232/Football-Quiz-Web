<?php

declare(strict_types=1);

require __DIR__ . '/lib.php';

$locale = news_locale($_GET['locale'] ?? null);
$copy = news_copy($locale);
$category = news_category($_GET['category'] ?? null);
$competition = news_competition($_GET['competition'] ?? null, $category);
$club = isset($_GET['club']) && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', (string) $_GET['club'])
    ? (string) $_GET['club']
    : null;
$query = ['locale' => $locale, 'limit' => news_is_local() ? '2' : '12'];
if ($category !== null) {
    $query['category'] = $category;
}
if ($competition !== null) {
    $query['competition'] = $competition;
}
if ($club !== null) {
    $query['club'] = $club;
}
$newsResult = news_api_get('/v1/news', $query);
$clubQuery = ['locale' => $locale];
if ($category !== null) {
    $clubQuery['category'] = $category;
}
if ($competition !== null) {
    $clubQuery['competition'] = $competition;
}
$clubsResult = news_api_get('/v1/news/clubs', $clubQuery);
$competitionCounts = [];
if ($category === 'top-5') {
    $competitionsResult = news_api_get('/v1/news/competitions', [
        'locale' => $locale,
        'category' => 'top-5',
    ]);
    if ($competitionsResult['ok'] && is_array($competitionsResult['data']['items'] ?? null)) {
        foreach ($competitionsResult['data']['items'] as $competitionItem) {
            $competitionKey = (string) ($competitionItem['competition_key'] ?? '');
            if ($competitionKey !== '') {
                $competitionCounts[$competitionKey] = (int) ($competitionItem['article_count'] ?? 0);
            }
        }
    }
}
$items = $newsResult['ok'] && is_array($newsResult['data']['items'] ?? null) ? $newsResult['data']['items'] : [];
$nextCursor = $newsResult['ok'] && is_string($newsResult['data']['next_cursor'] ?? null) ? $newsResult['data']['next_cursor'] : null;
$clubs = $clubsResult['ok'] && is_array($clubsResult['data']['items'] ?? null) ? $clubsResult['data']['items'] : [];
$categories = news_categories($locale);
$competitions = news_competitions($locale);
$pageTitle = news_category_page_title($locale, $category, $copy['title'], $competition);
?><!doctype html>
<html lang="<?= news_e($locale) ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= news_e($pageTitle) ?> — Football Quiz</title>
  <meta name="description" content="<?= news_e($copy['intro']) ?>">
  <link rel="canonical" href="<?= news_e(news_public_list_url($locale, $category, $competition, $club)) ?>">
  <meta property="og:type" content="website">
  <meta property="og:title" content="<?= news_e($pageTitle) ?> — Football Quiz">
  <meta property="og:description" content="<?= news_e($copy['intro']) ?>">
  <meta property="og:image" content="https://footballquiz.club/assets/og/football-quiz-1200x630.png">
  <link rel="icon" type="image/png" href="/football_quiz_icon.png">
  <link rel="stylesheet" href="/style.css?v=20261013-heading-font">
  <link rel="stylesheet" href="/news/news.css?v=20261028-card-visuals-v1">
</head>
<body class="news-body<?= $competition !== null ? ' news-body--league news-body--' . news_e($competition) : '' ?><?= $competition === null && $category !== null ? ' news-body--category news-body--category-' . news_e($category) : '' ?><?= $category === null ? ' news-body--all-news' : '' ?>">
  <div class="page news-page">
    <header class="topbar news-topbar">
      <a class="brand" href="/">
        <img src="/football_quiz_icon.png" alt="Football Quiz">
        <div class="brand-title"><strong>Football Quiz</strong><span><?= news_e($copy['official']) ?></span></div>
      </a>
      <nav class="top-actions" aria-label="<?= news_e($copy['news']) ?>">
        <a class="pill-link" href="/"><?= news_e($copy['home']) ?></a>
        <div class="lang-switcher" aria-label="Language">
          <a class="lang-btn<?= $locale === 'en' ? ' active' : '' ?>" href="<?= news_e(news_list_url('en', $category, $competition, $club)) ?>">🇺🇸 EN</a>
          <a class="lang-btn<?= $locale === 'ru' ? ' active' : '' ?>" href="<?= news_e(news_list_url('ru', $category, $competition, $club)) ?>">🇷🇺 RU</a>
          <a class="lang-btn<?= $locale === 'hy' ? ' active' : '' ?>" href="<?= news_e(news_list_url('hy', $category, $competition, $club)) ?>">🇦🇲 AM</a>
        </div>
      </nav>
    </header>

    <main>
      <section class="news-hero">
        <div class="news-kicker">Football Quiz · <?= news_e($copy['news']) ?></div>
        <h1><?= news_e($pageTitle) ?></h1>
        <p><?= news_e($copy['intro']) ?></p>
      </section>

      <nav class="category-filter" aria-label="<?= news_e($copy['category_filter']) ?>">
        <a class="<?= $category === null ? 'active' : '' ?>"<?= $category === null ? ' aria-current="page"' : '' ?> href="<?= news_e(news_list_url($locale)) ?>"><?= news_e($copy['all_news']) ?></a>
        <?php foreach ($categories as $categoryKey => $categoryLabel): ?>
          <a class="<?= $category === $categoryKey ? 'active' : '' ?>"<?= $category === $categoryKey ? ' aria-current="page"' : '' ?> href="<?= news_e(news_list_url($locale, $categoryKey)) ?>">
            <?= news_e($categoryLabel) ?>
          </a>
        <?php endforeach; ?>
      </nav>

      <?php if ($category === 'top-5'): ?>
        <nav class="competition-filter" aria-label="<?= news_e($copy['competition_filter']) ?>">
          <a class="<?= $competition === null ? 'active' : '' ?>"<?= $competition === null ? ' aria-current="page"' : '' ?> href="<?= news_e(news_list_url($locale, 'top-5')) ?>">
            <?= news_e($copy['all_competitions']) ?>
          </a>
          <?php foreach ($competitions as $competitionKey => $competitionLabel): ?>
            <a class="<?= $competition === $competitionKey ? 'active' : '' ?>"<?= $competition === $competitionKey ? ' aria-current="page"' : '' ?> href="<?= news_e(news_list_url($locale, 'top-5', $competitionKey)) ?>">
              <?= news_e($competitionLabel) ?> <span><?= (int) ($competitionCounts[$competitionKey] ?? 0) ?></span>
            </a>
          <?php endforeach; ?>
        </nav>
      <?php endif; ?>

      <?php if ($clubs !== []): ?>
        <nav class="club-filter" aria-label="<?= news_e($copy['filter']) ?>">
          <a class="<?= $club === null ? 'active' : '' ?>"<?= $club === null ? ' aria-current="page"' : '' ?> href="<?= news_e(news_list_url($locale, $category, $competition)) ?>"><?= news_e($copy['all']) ?></a>
          <?php foreach ($clubs as $clubItem): ?>
            <a class="<?= $club === ($clubItem['slug'] ?? '') ? 'active' : '' ?>"<?= $club === ($clubItem['slug'] ?? '') ? ' aria-current="page"' : '' ?> href="<?= news_e(news_list_url($locale, $category, $competition, (string) ($clubItem['slug'] ?? ''))) ?>">
              <?= news_e($clubItem['name'] ?? '') ?> <span><?= (int) ($clubItem['article_count'] ?? 0) ?></span>
            </a>
          <?php endforeach; ?>
        </nav>
      <?php endif; ?>

      <?php if (!$newsResult['ok']): ?>
        <div class="news-state" role="status"><?= news_e($copy['unavailable']) ?></div>
      <?php elseif ($items === []): ?>
        <div class="news-state" role="status"><?= news_e($copy['empty']) ?></div>
      <?php else: ?>
        <section class="news-grid" aria-label="<?= news_e($copy['title']) ?>">
          <?php foreach ($items as $item): ?>
            <?php
              $itemSlug = (string) ($item['slug'] ?? '');
              $artVisual = news_article_visual($itemSlug);
              $artVariant = $artVisual['variant'] ?? null;
              $artMetric = $artVisual['metric'] ?? '';
              $artMarks = $artVisual['marks'] ?? 0;
              $artClub = (string) ($artVisual['label'] ?? $item['clubs'][0]['name'] ?? 'Football Quiz');
            ?>
            <article class="news-card">
              <?php if ($artVariant !== null): ?>
                <div class="news-card-art news-card-art--<?= news_e($artVariant) ?>" aria-hidden="true">
                  <span class="news-card-art-club"><?= news_e($artClub) ?></span>
                  <strong class="news-card-art-metric"><?= news_e($artMetric) ?></strong>
                  <span class="news-card-art-marks">
                    <?php for ($markIndex = 0; $markIndex < (int) $artMarks; $markIndex++): ?><i></i><?php endfor; ?>
                  </span>
                </div>
              <?php else: ?>
                <div class="news-card-art" aria-hidden="true"><span class="news-card-art-fallback">FQ</span></div>
              <?php endif; ?>
              <div class="news-card-body">
                <div class="news-meta">
                  <time datetime="<?= news_e($item['published_at'] ?? '') ?>"><?= news_e(news_date($item['published_at'] ?? null, $locale)) ?></time>
                  <?php foreach (($item['categories'] ?? []) as $itemCategory): ?><a class="news-category-tag" href="<?= news_e(news_list_url($locale, (string) ($itemCategory['slug'] ?? ''))) ?>"><?= news_e(news_category_label($locale, (string) ($itemCategory['category_key'] ?? ''))) ?></a><?php endforeach; ?>
                  <?php foreach (($item['competitions'] ?? []) as $itemCompetition): ?><a class="news-competition-tag" href="<?= news_e(news_list_url($locale, 'top-5', (string) ($itemCompetition['slug'] ?? ''))) ?>"><?= news_e(news_competition_label($locale, (string) ($itemCompetition['competition_key'] ?? ''))) ?></a><?php endforeach; ?>
                  <?php foreach (($item['clubs'] ?? []) as $itemClub): ?><span><?= news_e($itemClub['name'] ?? '') ?></span><?php endforeach; ?>
                </div>
                <h2><a href="<?= news_e(news_url($locale, ($item['slug'] ?? '') . '/')) ?>"><?= news_e($item['title'] ?? '') ?></a></h2>
                <p><?= news_e($item['summary'] ?? '') ?></p>
                <a class="news-read" href="<?= news_e(news_url($locale, ($item['slug'] ?? '') . '/')) ?>"><?= news_e($copy['read']) ?> <span aria-hidden="true">→</span></a>
              </div>
            </article>
          <?php endforeach; ?>
        </section>
        <div class="news-load-more-wrap"<?= $nextCursor === null ? ' hidden' : '' ?>>
          <button
            class="button secondary news-load-more"
            id="news-load-more"
            type="button"
            data-cursor="<?= news_e($nextCursor ?? '') ?>"
            data-locale="<?= news_e($locale) ?>"
            data-category="<?= news_e($category ?? '') ?>"
            data-competition="<?= news_e($competition ?? '') ?>"
            data-club="<?= news_e($club ?? '') ?>"
            data-read-label="<?= news_e($copy['read']) ?>"
            data-error-label="<?= news_e($copy['unavailable']) ?>"
          ><?= news_e($copy['load_more']) ?></button>
        </div>
      <?php endif; ?>
    </main>

    <footer class="footer-card news-footer">
      <p>Football Quiz · <a href="mailto:support@footballquiz.club">support@footballquiz.club</a></p>
      <div class="footer-links"><a class="pill-link" href="/"><?= news_e($copy['home']) ?></a><a class="pill-link install-link" href="https://play.google.com/store/apps/details?id=com.arthuralexandryan.footballquiz"><?= news_e($copy['play']) ?></a></div>
    </footer>
  </div>
  <script src="/news/news-list.js?v=20261028-card-visuals-v1" defer></script>
</body>
</html>
