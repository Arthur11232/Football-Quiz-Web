<?php

declare(strict_types=1);

header('X-Robots-Tag: noindex, nofollow, noarchive');
?><!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>News Admin — Football Quiz</title>
  <link rel="icon" href="/football_quiz_icon.png">
  <link rel="stylesheet" href="/admin/news/admin.css?v=20261028-a3">
</head>
<body>
  <main class="admin-shell">
    <header class="admin-header">
      <a class="brand" href="/"><img src="/football_quiz_icon.png" alt=""><span>Football Quiz</span></a>
      <button id="sign-out" class="button button-secondary" type="button" hidden>Выйти</button>
    </header>

    <section id="auth-card" class="panel auth-panel">
      <p class="eyebrow">ЗАКРЫТАЯ ЗОНА</p>
      <h1>News Admin</h1>
      <p>Войдите через разрешённый Google/Firebase аккаунт. Доступ проверяется backend-сервером.</p>
      <button id="sign-in" class="button" type="button">Войти через Google</button>
      <p id="auth-message" class="message" role="status"></p>
    </section>

    <section id="workspace" hidden>
      <div class="workspace-title">
        <div><p class="eyebrow">NEWS WORKFLOW</p><h1>Черновики и статьи</h1></div>
        <span id="admin-uid" class="uid"></span>
      </div>

      <form id="draft-form" class="panel form-grid">
        <h2>Новый черновик</h2>
        <label>Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="arsenal-training-update"></label>
        <label>Тип<select name="news_type"><option value="club_news">Club news</option><option value="match">Match</option><option value="transfer">Transfer</option><option value="explainer">Explainer</option><option value="football_quiz">Football Quiz</option></select></label>
        <label>Основная категория<select name="primary_category"><option value="top-5">Top 5</option><option value="uefa">UEFA</option><option value="world-cup">World Cup</option></select></label>
        <button class="button" type="submit">Создать черновик</button>
        <p id="draft-message" class="message" role="status"></p>
      </form>

      <section id="article-editor" class="panel editor-panel" hidden>
        <div class="editor-heading">
          <div><p class="eyebrow">РЕДАКТОР ЧЕРНОВИКА</p><h2 id="editor-title">Черновик</h2></div>
          <button id="close-editor" class="button button-secondary" type="button">Закрыть</button>
        </div>
        <form id="editor-form" class="editor-form">
          <div class="editor-meta">
            <label>Slug<input id="editor-slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*"></label>
            <label>Тип<select id="editor-news-type"><option value="club_news">Club news</option><option value="match">Match</option><option value="transfer">Transfer</option><option value="explainer">Explainer</option><option value="football_quiz">Football Quiz</option></select></label>
            <label>Основная категория<select id="editor-primary-category"><option value="top-5">Top 5</option><option value="uefa">UEFA</option><option value="world-cup">World Cup</option></select></label>
          </div>

          <fieldset class="taxonomy-card">
            <legend>Лига и клубы</legend>
            <label>Соревнование<select id="editor-competition"><option value="">Без соревнования</option></select></label>
            <div>
              <span class="field-label">Клубы</span>
              <div id="editor-clubs" class="club-options"></div>
            </div>
          </fieldset>

          <div class="translation-grid">
            <?php
            $translationFields = [
                'en' => [
                    'language' => 'English',
                    'title' => 'Title',
                    'summary' => 'Short description',
                    'body' => 'Article text (Markdown)',
                    'seo_title' => 'SEO title',
                    'seo_description' => 'SEO description',
                ],
                'ru' => [
                    'language' => 'Русский',
                    'title' => 'Заголовок',
                    'summary' => 'Краткое описание',
                    'body' => 'Текст статьи (Markdown)',
                    'seo_title' => 'SEO-заголовок',
                    'seo_description' => 'SEO-описание',
                ],
                'hy' => [
                    'language' => 'Հայերեն',
                    'title' => 'Վերնագիր',
                    'summary' => 'Կարճ նկարագրություն',
                    'body' => 'Հոդվածի տեքստ (Markdown)',
                    'seo_title' => 'SEO վերնագիր',
                    'seo_description' => 'SEO նկարագրություն',
                ],
            ];
            ?>
            <?php foreach ($translationFields as $locale => $labels): ?>
              <fieldset class="translation-card" data-locale="<?= $locale ?>">
                <legend><?= $labels['language'] ?></legend>
                <label><?= $labels['title'] ?><input data-field="title" maxlength="220"></label>
                <label><?= $labels['summary'] ?><textarea data-field="summary" maxlength="2000" rows="3"></textarea></label>
                <label><?= $labels['body'] ?><textarea data-field="body_markdown" maxlength="100000" rows="8"></textarea></label>
                <label><?= $labels['seo_title'] ?><input data-field="seo_title" maxlength="220"></label>
                <label><?= $labels['seo_description'] ?><textarea data-field="seo_description" maxlength="320" rows="2"></textarea></label>
              </fieldset>
            <?php endforeach; ?>
          </div>

          <fieldset class="source-card">
            <legend>Официальный источник</legend>
            <div class="source-grid">
              <label>Название источника<input id="source-publisher" maxlength="160" placeholder="Real Madrid"></label>
              <label>URL<input id="source-url" type="url" maxlength="2048" placeholder="https://www.realmadrid.com/..."></label>
              <label>Дата публикации<input id="source-published-at" type="date"></label>
            </div>
            <a id="open-source" class="article-link source-link" href="#" target="_blank" rel="noopener noreferrer" hidden>Открыть источник</a>
          </fieldset>

          <div class="preview-actions" aria-label="Предпросмотр переводов">
            <button class="button button-secondary" type="button" data-preview-locale="en">Preview EN</button>
            <button class="button button-secondary" type="button" data-preview-locale="ru">Preview RU</button>
            <button class="button button-secondary" type="button" data-preview-locale="hy">Preview HY</button>
          </div>
          <div class="editor-actions">
            <button id="save-draft" class="button" type="submit">Сохранить черновик</button>
            <button id="submit-review" class="button button-secondary" type="button">Передать на проверку</button>
            <button id="return-draft" class="button button-secondary" type="button" hidden>Вернуть в черновик</button>
            <button id="publish-article" class="button button-publish" type="button" hidden>Опубликовать</button>
            <p id="editor-message" class="message" role="status"></p>
          </div>
        </form>
      </section>

      <dialog id="article-preview" class="preview-dialog">
        <button id="close-preview" class="preview-close" type="button" aria-label="Закрыть">×</button>
        <p id="preview-locale" class="eyebrow"></p>
        <h2 id="preview-title"></h2>
        <p id="preview-summary" class="preview-summary"></p>
        <div id="preview-body" class="preview-body"></div>
      </dialog>

      <dialog id="app-dialog" class="confirm-dialog" aria-labelledby="app-dialog-title" aria-describedby="app-dialog-message">
        <form method="dialog" class="confirm-dialog-card">
          <p class="eyebrow" data-dialog-eyebrow>Подтверждение</p>
          <h2 id="app-dialog-title" data-dialog-title>Продолжить?</h2>
          <p id="app-dialog-message" class="confirm-dialog-message" data-dialog-message></p>
          <div class="confirm-dialog-actions">
            <button class="button button-secondary" type="submit" value="cancel" data-dialog-cancel>Отмена</button>
            <button class="button confirm-dialog-submit" type="submit" value="confirm" data-dialog-confirm>Подтвердить</button>
          </div>
        </form>
      </dialog>

      <section class="panel">
        <div class="list-heading"><h2>Последние статьи</h2><button id="refresh" class="button button-secondary" type="button">Обновить</button></div>
        <div id="article-list" class="article-list"></div>
      </section>
    </section>
  </main>
  <script type="module" src="/admin/news/admin.js?v=20261028-a3"></script>
</body>
</html>
