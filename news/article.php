<?php

declare(strict_types=1);

require __DIR__ . '/lib.php';

$locale = news_locale($_GET['locale'] ?? null);
$copy = news_copy($locale);
$slug = (string) ($_GET['slug'] ?? '');
$validSlug = preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug) === 1;
$result = $validSlug ? news_api_get('/v1/news/' . rawurlencode($slug), ['locale' => $locale]) : ['ok' => false, 'status' => 404, 'data' => null];
$article = $result['ok'] && is_array($result['data']) ? $result['data'] : null;
$articleVisual = $article === null ? null : news_article_visual(
    (string) ($article['slug'] ?? $slug),
    is_array($article['clubs'] ?? null) ? $article['clubs'] : []
);
$articleClub = $article === null ? 'Football Quiz' : (string) ($article['clubs'][0]['name'] ?? 'Football Quiz');
$articleCategory = $article === null ? null : news_category((string) ($article['categories'][0]['category_key'] ?? ''));
$articleCompetition = $article === null ? null : news_competition(
    (string) ($article['competitions'][0]['competition_key'] ?? ''),
    $articleCategory
);
$articleBodyClass = 'news-body news-body--article';
if ($articleCompetition !== null) {
    $articleBodyClass .= ' news-body--league news-body--' . $articleCompetition;
} elseif ($articleCategory !== null) {
    $articleBodyClass .= ' news-body--category news-body--category-' . $articleCategory;
} else {
    $articleBodyClass .= ' news-body--all-news';
}

if ($article === null) {
    http_response_code($result['status'] === 404 ? 404 : 503);
}

$title = $article['seo']['title'] ?? $article['title'] ?? $copy['news'];
$description = $article['seo']['description'] ?? $article['summary'] ?? $copy['intro'];
$canonical = $article['seo']['canonical_url'] ?? news_public_url($locale);
$structuredData = $article === null ? null : [
    '@context' => 'https://schema.org',
    '@type' => 'NewsArticle',
    'headline' => $article['title'] ?? '',
    'description' => $article['summary'] ?? '',
    'datePublished' => $article['published_at'] ?? '',
    'dateModified' => $article['updated_at'] ?? '',
    'mainEntityOfPage' => $canonical,
    'image' => $article['hero_image_url'] ?? 'https://footballquiz.club/assets/og/football-quiz-1200x630.png',
    'articleSection' => array_map(
        static fn (array $category): string => news_category_label($locale, (string) ($category['category_key'] ?? '')),
        $article['categories'] ?? []
    ),
    'author' => ['@type' => 'Organization', 'name' => 'Football Quiz'],
    'publisher' => ['@type' => 'Organization', 'name' => 'Football Quiz'],
];
?><!doctype html>
<html lang="<?= news_e($locale) ?>">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= news_e($title) ?> — Football Quiz</title>
  <meta name="description" content="<?= news_e($description) ?>">
  <link rel="canonical" href="<?= news_e($canonical) ?>">
  <meta property="og:type" content="article">
  <meta property="og:title" content="<?= news_e($title) ?>">
  <meta property="og:description" content="<?= news_e($description) ?>">
  <meta property="og:url" content="<?= news_e($canonical) ?>">
  <meta property="og:image" content="<?= news_e($article['hero_image_url'] ?? 'https://footballquiz.club/assets/og/football-quiz-1200x630.png') ?>">
  <?php if ($article !== null): ?><meta property="article:published_time" content="<?= news_e($article['published_at'] ?? '') ?>"><meta property="article:modified_time" content="<?= news_e($article['updated_at'] ?? '') ?>"><?php endif; ?>
  <link rel="icon" type="image/png" href="/football_quiz_icon.png">
  <link rel="stylesheet" href="/style.css?v=20261013-heading-font">
  <link rel="stylesheet" href="/news/news.css?v=20261029-club-visuals-v2">
  <?php if ($structuredData !== null): ?><script type="application/ld+json"><?= json_encode($structuredData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR) ?></script><?php endif; ?>
</head>
<body class="<?= news_e($articleBodyClass) ?>">
  <div class="page news-page">
    <header class="topbar news-topbar">
      <a class="brand" href="/"><img src="/football_quiz_icon.png" alt="Football Quiz"><div class="brand-title"><strong>Football Quiz</strong><span><?= news_e($copy['official']) ?></span></div></a>
      <nav class="top-actions"><a class="pill-link" href="<?= news_e(news_list_url($locale)) ?>"><?= news_e($copy['news']) ?></a><a class="pill-link install-link" href="https://play.google.com/store/apps/details?id=com.arthuralexandryan.footballquiz"><?= news_e($copy['play']) ?></a></nav>
    </header>

    <main>
      <?php if ($article === null): ?>
        <section class="news-state article-state" role="status">
          <h1><?= $result['status'] === 404 ? '404' : '503' ?></h1>
          <p><?= news_e($result['status'] === 404 ? $copy['empty'] : $copy['unavailable']) ?></p>
          <a class="button secondary" href="<?= news_e(news_list_url($locale)) ?>"><?= news_e($copy['back']) ?></a>
        </section>
      <?php else: ?>
        <article class="article-shell">
          <header class="article-masthead<?= $articleVisual !== null ? ' article-theme--' . news_e($articleVisual['variant']) : '' ?>">
            <div class="article-masthead-content">
              <a class="article-back" href="<?= news_e(news_list_url($locale)) ?>">← <?= news_e($copy['back']) ?></a>
              <div class="news-meta article-meta">
                <time datetime="<?= news_e($article['published_at'] ?? '') ?>"><?= news_e($copy['published']) ?> · <?= news_e(news_date($article['published_at'] ?? null, $locale)) ?></time>
                <?php foreach (($article['categories'] ?? []) as $itemCategory): ?><a class="news-category-tag" href="<?= news_e(news_list_url($locale, (string) ($itemCategory['slug'] ?? ''))) ?>"><?= news_e(news_category_label($locale, (string) ($itemCategory['category_key'] ?? ''))) ?></a><?php endforeach; ?>
                <?php foreach (($article['competitions'] ?? []) as $itemCompetition): ?><a class="news-competition-tag" href="<?= news_e(news_list_url($locale, 'top-5', (string) ($itemCompetition['slug'] ?? ''))) ?>"><?= news_e(news_competition_label($locale, (string) ($itemCompetition['competition_key'] ?? ''))) ?></a><?php endforeach; ?>
                <?php foreach (($article['clubs'] ?? []) as $itemClub): ?><a href="<?= news_e(news_list_url($locale, null, null, (string) ($itemClub['slug'] ?? ''))) ?>"><?= news_e($itemClub['name'] ?? '') ?></a><?php endforeach; ?>
              </div>
              <h1><?= news_e($article['title'] ?? '') ?></h1>
              <p class="article-summary"><?= news_e($article['summary'] ?? '') ?></p>
            </div>
            <?php if ($articleVisual !== null): ?>
              <div class="article-masthead-accent" aria-hidden="true">
                <span><?= news_e($articleClub) ?></span>
                <strong><?= news_e($articleVisual['metric']) ?></strong>
              </div>
            <?php endif; ?>
          </header>

          <div class="article-content">
            <?php if (!empty($article['hero_image_url'])): ?>
              <figure class="article-hero"><img src="<?= news_e($article['hero_image_url']) ?>" alt="<?= news_e($article['hero_image_alt'] ?? '') ?>"><?php if (!empty($article['image_credit'])): ?><figcaption><?= news_e($article['image_credit']) ?></figcaption><?php endif; ?></figure>
            <?php endif; ?>
            <div class="article-body"><?= news_markdown((string) ($article['body_markdown'] ?? '')) ?></div>

            <?php if (!empty($article['sources'])): ?>
              <section class="article-sources">
                <h2><?= news_e($copy['source']) ?></h2>
                <ul><?php foreach ($article['sources'] as $source): ?><li><a href="<?= news_e($source['source_url'] ?? '') ?>" target="_blank" rel="noopener noreferrer nofollow"><?= news_e($source['publisher_name'] ?? '') ?></a><?php if (!empty($source['source_published_at'])): ?> · <?= news_e(news_date($source['source_published_at'], $locale)) ?><?php endif; ?></li><?php endforeach; ?></ul>
              </section>
            <?php endif; ?>

            <aside class="article-cta"><div><strong>Football Quiz</strong><p><?= news_e($copy['intro']) ?></p></div><a class="button primary" href="https://play.google.com/store/apps/details?id=com.arthuralexandryan.footballquiz"><?= news_e($copy['play']) ?></a></aside>
          </div>
        </article>
      <?php endif; ?>
    </main>

    <footer class="footer-card news-footer"><p>Football Quiz · <a href="mailto:support@footballquiz.club">support@footballquiz.club</a></p><div class="footer-links"><a class="pill-link" href="/"><?= news_e($copy['home']) ?></a></div></footer>
  </div>
</body>
</html>
