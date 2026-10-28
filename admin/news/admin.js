import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { DialogManager } from './dialog-manager.js';

const app = initializeApp({
  apiKey: 'AIzaSyBEuNcamsoPF_4BeBauZOu78c81GXUjhYc',
  authDomain: 'footbal-quiz-1f62a.firebaseapp.com',
  databaseURL: 'https://footbal-quiz-1f62a.firebaseio.com',
  projectId: 'footbal-quiz-1f62a',
  storageBucket: 'footbal-quiz-1f62a.appspot.com',
  messagingSenderId: '978888880015',
  appId: '1:978888880015:web:e9fb07051b48591e0ce5fa'
});
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const host = window.location.hostname;
const apiBase = ['localhost', '127.0.0.1'].includes(host)
  ? 'http://127.0.0.1:8080'
  : host === 'staging.footballquiz.club' ? 'https://api-staging.footballquiz.club' : 'https://api.footballquiz.club';

const authCard = document.querySelector('#auth-card');
const workspace = document.querySelector('#workspace');
const signInButton = document.querySelector('#sign-in');
const signOutButton = document.querySelector('#sign-out');
const authMessage = document.querySelector('#auth-message');
const draftMessage = document.querySelector('#draft-message');
const editor = document.querySelector('#article-editor');
const editorForm = document.querySelector('#editor-form');
const editorMessage = document.querySelector('#editor-message');
const previewDialog = document.querySelector('#article-preview');
const cardPreviewDialog = document.querySelector('#card-preview-dialog');
const dialogManager = new DialogManager(document.querySelector('#app-dialog'));
const locales = ['en', 'ru', 'hy'];
let token = null;
let activeArticleId = null;
let activeArticleStatus = null;
let activeArticle = null;
let cardPreviewLocale = 'en';
let activeCandidate = null;
let taxonomy = { competitions: [], clubs: [] };

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message || `API ${response.status}`);
  return payload.data;
}

async function loadTaxonomy() {
  taxonomy = await api('/v1/admin/news/taxonomy');
  renderCompetitionOptions(document.querySelector('#editor-primary-category').value, []);
  const clubs = document.querySelector('#editor-clubs');
  clubs.replaceChildren(...taxonomy.clubs.map((club) => {
    const label = document.createElement('label');
    label.className = 'club-option';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = club.club_key;
    checkbox.dataset.clubKey = club.club_key;
    label.append(checkbox, document.createTextNode(club.name));
    return label;
  }));
}

function renderCompetitionOptions(category, selectedKeys) {
  const select = document.querySelector('#editor-competition');
  const current = selectedKeys[0] || '';
  const empty = new Option('Без соревнования', '');
  const labels = {
    'premier-league': 'Premier League',
    'la-liga': 'La Liga',
    'serie-a': 'Serie A',
    bundesliga: 'Bundesliga',
    'ligue-1': 'Ligue 1'
  };
  const options = taxonomy.competitions
    .filter((competition) => competition.category_key === category)
    .map((competition) => new Option(labels[competition.competition_key] || competition.competition_key, competition.competition_key));
  select.replaceChildren(empty, ...options);
  select.value = current;
}

async function loadArticles() {
  const data = await api('/v1/admin/news/articles');
  const list = document.querySelector('#article-list');
  list.replaceChildren(...(data.items.length ? data.items.map((item) => {
    const row = document.createElement('article');
    row.className = 'article-row';
    const copy = document.createElement('div');
    copy.className = 'article-copy';
    const title = document.createElement('strong');
    title.textContent = item.slug;
    const meta = document.createElement('span');
    meta.textContent = `${item.status} · ${item.primary_category || 'без категории'} · переводов: ${item.translation_count}`;
    copy.append(title, meta);
    row.append(copy);
    if (item.status === 'published') {
      const actions = document.createElement('nav');
      actions.className = 'article-actions';
      actions.setAttribute('aria-label', `Действия со статьёй ${item.slug}`);
      for (const locale of ['ru', 'en', 'hy']) {
        const link = document.createElement('a');
        link.className = 'article-link';
        link.href = `/${locale}/news/${encodeURIComponent(item.slug)}/`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = locale.toUpperCase();
        actions.append(link);
      }
      actions.append(
        lifecycleButton('Снять с публикации', 'unpublish', item, 'article-unpublish'),
        lifecycleButton('Архивировать', 'archive', item, 'article-delete')
      );
      row.append(actions);
    } else if (item.status === 'unpublished') {
      const actions = document.createElement('div');
      actions.className = 'article-actions';
      actions.append(
        lifecycleButton('Редактировать', 'return-draft', item, 'article-edit'),
        lifecycleButton('Опубликовать снова', 'publish', item, 'article-republish'),
        lifecycleButton('Архивировать', 'archive', item, 'article-delete')
      );
      row.append(actions);
    } else if (item.status === 'draft' || item.status === 'review') {
      const actions = document.createElement('div');
      actions.className = 'article-actions';
      const edit = document.createElement('button');
      edit.className = 'article-link article-edit';
      edit.type = 'button';
      edit.textContent = item.status === 'draft' ? 'Редактировать' : 'Открыть проверку';
      edit.addEventListener('click', () => openEditor(item.article_id));
      actions.append(edit);
      if (item.status === 'draft') {
        const remove = document.createElement('button');
        remove.className = 'article-link article-delete';
        remove.type = 'button';
        remove.textContent = 'Удалить';
        remove.addEventListener('click', () => deleteDraft(item.article_id, item.slug, remove));
        actions.append(remove);
      }
      row.append(actions);
    }
    return row;
  }) : [Object.assign(document.createElement('p'), { textContent: 'Статей пока нет.' })]));
}

const candidateStatuses = { new: 'Новый', rejected: 'Отклонён', imported: 'Создан черновик' };
const categoryNames = { 'top-5': 'Top 5', uefa: 'UEFA', 'world-cup': 'World Cup' };

function candidateDate(value) {
  if (!value) return 'Не указана';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Не указана' : date.toLocaleString('ru-RU');
}

async function loadCandidates() {
  const message = document.querySelector('#candidates-message');
  const refresh = document.querySelector('#refresh-candidates');
  refresh.disabled = true;
  message.textContent = 'Загружаем кандидатов…';
  try {
    const data = await api('/v1/admin/news/candidates');
    const list = document.querySelector('#candidate-list');
    list.replaceChildren(...data.items.map((item) => {
      const row = document.createElement('article');
      row.className = 'article-row';
      const copy = document.createElement('div');
      copy.className = 'article-copy';
      const title = document.createElement('strong');
      title.textContent = item.title;
      const meta = document.createElement('span');
      meta.textContent = `${item.publisher_name} · ${candidateDate(item.source_published_at)} · ${candidateStatuses[item.status] || item.status}`;
      copy.append(title, meta);
      if (item.warning_text) {
        const warning = document.createElement('p');
        warning.className = 'message';
        warning.textContent = item.warning_text;
        copy.append(warning);
      }
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'article-link article-edit';
      open.textContent = 'Подробнее';
      open.addEventListener('click', () => openCandidate(item.candidate_id, open));
      row.append(copy, open);
      return row;
    }));
    message.textContent = data.items.length ? `Кандидатов: ${data.items.length}` : 'Кандидатов пока нет.';
  } catch (error) {
    message.textContent = `Не удалось загрузить кандидатов: ${error.message}`;
  } finally {
    refresh.disabled = false;
  }
}

async function openCandidate(candidateId, button) {
  button.disabled = true;
  const detail = document.querySelector('#candidate-detail');
  detail.hidden = true;
  try {
    const item = await api(`/v1/admin/news/candidates/${encodeURIComponent(candidateId)}`);
    activeCandidate = item;
    document.querySelector('#import-candidate').hidden = item.status !== 'new';
    document.querySelector('#reject-candidate').hidden = item.status !== 'new';
    document.querySelector('#open-candidate-draft').hidden = !item.imported_article_id;
    document.querySelector('#candidate-action-message').textContent = '';
    document.querySelector('#candidate-title').textContent = item.title;
    const fields = [
      ['Источник', item.publisher_name],
      ['Статус', candidateStatuses[item.status] || item.status],
      ['Дата публикации', candidateDate(item.source_published_at)],
      ['Предложенная категория', categoryNames[item.primary_category] || item.primary_category || 'Не определена'],
      ['Предложенное соревнование', item.competition_key || 'Не определено'],
      ['Предложенный клуб', item.club_name || 'Не определён'],
      ['Впервые обнаружен', candidateDate(item.first_seen_at)],
      ['Последняя проверка', candidateDate(item.last_seen_at)]
    ];
    document.querySelector('#candidate-fields').replaceChildren(...fields.flatMap(([label, value]) => {
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = value;
      return [term, description];
    }));
    const excerpt = document.querySelector('#candidate-excerpt');
    excerpt.textContent = item.excerpt || '';
    excerpt.hidden = !item.excerpt;
    const warning = document.querySelector('#candidate-warning');
    warning.textContent = item.warning_text || '';
    warning.hidden = !item.warning_text;
    const source = document.querySelector('#candidate-source');
    source.removeAttribute('href');
    source.hidden = true;
    try {
      const url = new URL(item.source_url);
      if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) {
        source.href = url.href;
        source.hidden = false;
      }
    } catch { /* Invalid source URLs are not made clickable. */ }
    detail.hidden = false;
    document.querySelector('#candidate-title').focus();
    detail.scrollIntoView({ block: 'nearest' });
  } catch (error) {
    document.querySelector('#candidates-message').textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function candidateAction(action) {
  const item = activeCandidate;
  if (!item || item.status !== 'new') return;
  const create = action === 'create-draft';
  const confirmed = await dialogManager.confirm({
    eyebrow: 'Кандидат новости',
    title: create ? 'Создать черновик?' : 'Отклонить кандидата?',
    message: create
      ? `Источник, категория и клуб для «${item.title}» будут перенесены в черновик. Slug и тексты EN/RU/HY нужно заполнить в редакторе.`
      : `Материал «${item.title}» останется в истории со статусом «Отклонён».`,
    confirmText: create ? 'Создать черновик' : 'Отклонить',
    tone: create ? 'success' : 'danger'
  });
  if (!confirmed || activeCandidate !== item) return;
  const buttons = [...document.querySelectorAll('#candidate-actions button')];
  buttons.forEach((button) => { button.disabled = true; });
  const message = document.querySelector('#candidate-action-message');
  message.textContent = create ? 'Создаём черновик…' : 'Отклоняем…';
  try {
    const result = await api(`/v1/admin/news/candidates/${encodeURIComponent(item.candidate_id)}/${action}`, { method: 'POST' });
    activeCandidate = { ...item, status: result.status, imported_article_id: result.article_id || null };
    document.querySelector('#import-candidate').hidden = true;
    document.querySelector('#reject-candidate').hidden = true;
    document.querySelector('#open-candidate-draft').hidden = !result.article_id;
    await loadCandidates();
    await openCandidate(item.candidate_id, document.querySelector('#refresh-candidates'));
    message.textContent = create ? 'Черновик создан. Заполните slug и переводы перед проверкой.' : 'Кандидат отклонён.';
    if (create) {
      await loadArticles();
      await openEditor(result.article_id);
    }
  } catch (error) {
    message.textContent = error.message;
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

function lifecycleButton(label, action, article, className) {
  const button = document.createElement('button');
  button.className = `article-link ${className}`;
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', () => runLifecycleAction(action, article, button));
  return button;
}

async function runLifecycleAction(action, article, button) {
  const dialogs = {
    unpublish: {
      eyebrow: 'Публичная статья',
      title: 'Снять статью с публикации?',
      message: `Статья «${article.slug}» исчезнет из публичного News, но сохранится в админке и сможет быть опубликована снова.`,
      confirmText: 'Снять с публикации',
      tone: 'danger'
    },
    publish: {
      eyebrow: 'Повторная публикация',
      title: 'Опубликовать статью снова?',
      message: `Статья «${article.slug}» снова появится во всех публичных языковых версиях.`,
      confirmText: 'Опубликовать',
      tone: 'success'
    },
    archive: {
      eyebrow: 'Архив News',
      title: 'Архивировать статью?',
      message: `Статья «${article.slug}» будет скрыта и перемещена в архив. Это действие нельзя отменить в текущей версии админки.`,
      confirmText: 'Архивировать',
      tone: 'danger'
    },
    'return-draft': {
      eyebrow: 'Редактирование статьи',
      title: 'Вернуть статью в черновик?',
      message: `Статья «${article.slug}» останется скрытой и откроется для редактирования лиги, клубов и текста.`,
      confirmText: 'Вернуть в черновик',
      tone: 'success'
    }
  };
  const confirmed = await dialogManager.confirm(dialogs[action]);
  if (!confirmed) return;
  button.disabled = true;
  const pendingMessages = {
    unpublish: 'Снимаем статью с публикации…',
    publish: 'Публикуем статью снова…',
    archive: 'Архивируем статью…',
    'return-draft': 'Возвращаем статью в черновик…'
  };
  draftMessage.textContent = pendingMessages[action];
  try {
    await api(`/v1/admin/news/articles/${encodeURIComponent(article.article_id)}/actions/${action}`, { method: 'POST' });
    const successMessages = {
      unpublish: 'Статья снята с публикации.',
      publish: 'Статья снова опубликована.',
      archive: 'Статья перемещена в архив.',
      'return-draft': 'Статья возвращена в черновик.'
    };
    draftMessage.textContent = successMessages[action];
    await loadArticles();
    if (action === 'return-draft') await openEditor(article.article_id);
  } catch (error) {
    button.disabled = false;
    draftMessage.textContent = error.message;
  }
}

function translationCard(locale) {
  return editorForm.querySelector(`[data-locale="${locale}"]`);
}

function setEditorUrl(articleId) {
  const url = new URL(window.location.href);
  if (articleId) url.searchParams.set('article', articleId);
  else url.searchParams.delete('article');
  window.history.replaceState(null, '', url);
}

function fillEditor(article) {
  activeArticle = article;
  activeArticleId = article.article_id;
  activeArticleStatus = article.status;
  document.querySelector('#editor-title').textContent = article.slug;
  document.querySelector('#editor-slug').value = article.slug;
  document.querySelector('#editor-news-type').value = article.news_type;
  document.querySelector('#editor-primary-category').value = article.primary_category || 'top-5';
  renderCompetitionOptions(article.primary_category || 'top-5', article.competition_keys || []);
  const selectedClubKeys = new Set(article.club_keys || []);
  for (const checkbox of document.querySelectorAll('[data-club-key]')) {
    checkbox.checked = selectedClubKeys.has(checkbox.dataset.clubKey);
  }
  for (const locale of locales) {
    const card = translationCard(locale);
    const translation = article.translations[locale];
    for (const field of ['title', 'summary', 'body_markdown', 'seo_title', 'seo_description']) {
      card.querySelector(`[data-field="${field}"]`).value = translation[field] || '';
    }
  }
  const source = article.source || {};
  document.querySelector('#source-publisher').value = source.publisher_name || '';
  document.querySelector('#source-url').value = source.source_url || '';
  document.querySelector('#source-published-at').value = source.source_published_at?.slice(0, 10) || '';
  const sourceLink = document.querySelector('#open-source');
  sourceLink.hidden = !source.source_url;
  sourceLink.href = source.source_url || '#';
  setEditorMode(article.status);
  editor.hidden = false;
  editorMessage.textContent = '';
  setEditorUrl(article.article_id);
}

function setEditorMode(status) {
  const editable = status === 'draft';
  for (const field of editorForm.querySelectorAll('input, textarea, select')) field.disabled = !editable;
  document.querySelector('#save-draft').hidden = !editable;
  document.querySelector('#submit-review').hidden = !editable;
  document.querySelector('#return-draft').hidden = status !== 'review';
  document.querySelector('#preview-card').hidden = status !== 'review';
}

async function openEditor(articleId) {
  editor.hidden = false;
  editorMessage.textContent = 'Загружаем черновик…';
  editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    fillEditor(await api(`/v1/admin/news/articles/${encodeURIComponent(articleId)}`));
  } catch (error) {
    activeArticle = null;
    activeArticleId = null;
    activeArticleStatus = null;
    editorMessage.textContent = error.message;
  }
}

function showPreview(locale) {
  const card = translationCard(locale);
  document.querySelector('#preview-locale').textContent = locale.toUpperCase();
  document.querySelector('#preview-title').textContent = card.querySelector('[data-field="title"]').value || 'Без заголовка';
  document.querySelector('#preview-summary').textContent = card.querySelector('[data-field="summary"]').value;
  document.querySelector('#preview-body').textContent = card.querySelector('[data-field="body_markdown"]').value;
  previewDialog.showModal();
}

function cardVisual() {
  const slug = document.querySelector('#editor-slug').value;
  const articleVisuals = {
    'real-madrid-wins-clasico-barcelona-2-1': { variant: 'clasico-result', metric: '2:1', marks: 3, label: 'Real Madrid · Barcelona' },
    'real-madrid-five-match-october-run': { variant: 'real-schedule', metric: '5', marks: 5 },
    'barcelona-three-golden-boy-finalists': { variant: 'barcelona-talents', metric: '3', marks: 3 },
    'arsenal-2025-26-premier-league-champions': { variant: 'arsenal-champions', metric: '14', marks: 1 },
    'bayern-seven-matches-in-22-days': { variant: 'bayern-schedule', metric: '7', marks: 7 },
    'inter-nine-matches-in-29-days': { variant: 'inter-schedule', metric: '9', marks: 9 },
    'psg-comeback-win-at-strasbourg': { variant: 'psg-comeback', metric: '3', marks: 3 }
  };
  if (articleVisuals[slug]) return articleVisuals[slug];

  const clubKey = document.querySelector('[data-club-key]:checked')?.value || '';
  const club = taxonomy.clubs.find((item) => item.club_key === clubKey);
  const clubVisuals = {
    'real-madrid': { variant: 'club-real-madrid', metric: 'RM', marks: 3 },
    barcelona: { variant: 'club-barcelona', metric: 'FCB', marks: 3 },
    arsenal: { variant: 'club-arsenal', metric: 'AFC', marks: 3 },
    'bayern-munich': { variant: 'club-bayern', metric: 'FCB', marks: 3 },
    'inter-milan': { variant: 'club-inter', metric: 'IM', marks: 3 },
    'paris-saint-germain': { variant: 'club-psg', metric: 'PSG', marks: 3 }
  };
  const visual = clubVisuals[clubKey];
  return visual
    ? { ...visual, label: club?.name || clubKey }
    : { variant: '', metric: 'FQ', marks: 0, label: club?.name || 'Football Quiz' };
}

function cardPreviewDate(locale) {
  const value = activeArticle?.published_at || new Date().toISOString();
  const date = new Date(value);
  if (locale === 'en') {
    return new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  }
  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear()
  ].join('.');
}

function showCardPreview(locale = cardPreviewLocale) {
  if (!activeArticleId) return;
  cardPreviewLocale = locales.includes(locale) ? locale : 'en';
  const copy = {
    en: { category: { 'top-5': 'Top 5 leagues', uefa: 'UEFA', 'world-cup': 'World Cup' }, read: 'Read article →' },
    ru: { category: { 'top-5': 'Топ-5 лиг', uefa: 'UEFA', 'world-cup': 'Чемпионат мира' }, read: 'Читать статью →' },
    hy: { category: { 'top-5': 'Թոփ 5 լիգաներ', uefa: 'UEFA', 'world-cup': 'Աշխարհի առաջնություն' }, read: 'Կարդալ հոդվածը →' }
  }[cardPreviewLocale];
  const competitionLabels = {
    'premier-league': 'Premier League', 'la-liga': 'La Liga', 'serie-a': 'Serie A',
    bundesliga: 'Bundesliga', 'ligue-1': 'Ligue 1'
  };
  const translation = translationCard(cardPreviewLocale);
  const visual = cardVisual();
  const art = document.querySelector('#card-preview-art');
  art.className = 'card-preview-art';
  if (visual.variant) art.classList.add(`card-preview-art--${visual.variant}`);
  document.querySelector('#card-preview-club-art').textContent = visual.label;
  document.querySelector('#card-preview-metric').textContent = visual.metric;
  document.querySelector('#card-preview-marks').replaceChildren(
    ...Array.from({ length: visual.marks }, () => document.createElement('i'))
  );

  const meta = [
    cardPreviewDate(cardPreviewLocale),
    copy.category[document.querySelector('#editor-primary-category').value] || document.querySelector('#editor-primary-category').value
  ];
  const competition = document.querySelector('#editor-competition').value;
  if (competition) meta.push(competitionLabels[competition] || competition);
  meta.push(...[...document.querySelectorAll('[data-club-key]:checked')].map((checkbox) => (
    taxonomy.clubs.find((club) => club.club_key === checkbox.value)?.name || checkbox.value
  )));
  document.querySelector('#card-preview-meta').replaceChildren(...meta.map((value) => {
    const item = document.createElement('span');
    item.textContent = value;
    return item;
  }));
  document.querySelector('#card-preview-title').textContent = translation.querySelector('[data-field="title"]').value || 'Без заголовка';
  document.querySelector('#card-preview-summary').textContent = translation.querySelector('[data-field="summary"]').value;
  document.querySelector('#card-preview-read').textContent = copy.read;
  for (const button of document.querySelectorAll('[data-card-preview-locale]')) {
    const active = button.dataset.cardPreviewLocale === cardPreviewLocale;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  document.querySelector('#publish-from-card-preview').hidden = activeArticleStatus !== 'review';
  if (!cardPreviewDialog.open) cardPreviewDialog.showModal();
}

async function requestPublishFromPreview() {
  cardPreviewDialog.close();
  const confirmed = await dialogManager.confirm({
    eyebrow: 'Публикация новости',
    title: 'Опубликовать статью?',
    message: 'Карточка проверена. Новость станет доступна читателям на английском, русском и армянском языках.',
    confirmText: 'Опубликовать',
    tone: 'success'
  });
  if (confirmed) await articleAction('publish', 'Публикуем…');
  else showCardPreview(cardPreviewLocale);
}

async function articleAction(action, pendingMessage) {
  if (!activeArticleId) return;
  editorMessage.textContent = pendingMessage;
  try {
    const article = await api(`/v1/admin/news/articles/${encodeURIComponent(activeArticleId)}/actions/${action}`, { method: 'POST' });
    fillEditor(article);
    editorMessage.textContent = action === 'submit-review'
      ? 'Статья передана на проверку.'
      : action === 'return-draft' ? 'Статья возвращена в черновик.' : 'Статья опубликована.';
    await loadArticles();
    if (action === 'submit-review') showCardPreview('en');
    if (action === 'publish') {
      if (cardPreviewDialog.open) cardPreviewDialog.close();
      activeArticle = null;
      activeArticleId = null;
      activeArticleStatus = null;
      editor.hidden = true;
      setEditorUrl(null);
      document.querySelector('#refresh').focus();
    }
  } catch (error) { editorMessage.textContent = error.message; }
}

async function deleteDraft(articleId, slug, button) {
  const confirmed = await dialogManager.confirm({
    eyebrow: 'Удаление черновика',
    title: 'Удалить этот черновик?',
    message: `Черновик «${slug}» будет удалён без возможности восстановления.`,
    confirmText: 'Удалить',
    tone: 'danger'
  });
  if (!confirmed) return;
  button.disabled = true;
  draftMessage.textContent = 'Удаляем черновик…';
  try {
    await api(`/v1/admin/news/articles/${encodeURIComponent(articleId)}`, { method: 'DELETE' });
    if (activeArticleId === articleId) {
      activeArticle = null;
      activeArticleId = null;
      activeArticleStatus = null;
      editor.hidden = true;
      setEditorUrl(null);
    }
    draftMessage.textContent = 'Черновик удалён.';
    await loadArticles();
  } catch (error) {
    button.disabled = false;
    draftMessage.textContent = error.message;
  }
}

function draftPayload() {
  const translations = {};
  for (const locale of locales) {
    const card = translationCard(locale);
    translations[locale] = Object.fromEntries(
      ['title', 'summary', 'body_markdown', 'seo_title', 'seo_description']
        .map((field) => [field, card.querySelector(`[data-field="${field}"]`).value])
    );
  }
  return {
    slug: document.querySelector('#editor-slug').value,
    news_type: document.querySelector('#editor-news-type').value,
    primary_category: document.querySelector('#editor-primary-category').value,
    competition_keys: document.querySelector('#editor-competition').value
      ? [document.querySelector('#editor-competition').value]
      : [],
    club_keys: [...document.querySelectorAll('[data-club-key]:checked')].map((checkbox) => checkbox.value),
    translations,
    source: {
      publisher_name: document.querySelector('#source-publisher').value,
      source_url: document.querySelector('#source-url').value,
      source_published_at: document.querySelector('#source-published-at').value
    }
  };
}

signInButton.addEventListener('click', async () => {
  authMessage.textContent = '';
  try { await signInWithPopup(auth, provider); } catch (error) { authMessage.textContent = error.message; }
});
signOutButton.addEventListener('click', () => signOut(auth));
document.querySelector('#refresh-candidates').addEventListener('click', loadCandidates);
document.querySelector('#import-candidate').addEventListener('click', () => candidateAction('create-draft'));
document.querySelector('#reject-candidate').addEventListener('click', () => candidateAction('reject'));
document.querySelector('#open-candidate-draft').addEventListener('click', async () => {
  if (!activeCandidate?.imported_article_id) return;
  try { await openEditor(activeCandidate.imported_article_id); }
  catch (error) { document.querySelector('#candidate-action-message').textContent = error.message; }
});
document.querySelector('#close-candidate').addEventListener('click', () => {
  document.querySelector('#candidate-detail').hidden = true;
  document.querySelector('#refresh-candidates').focus();
});
document.querySelector('#refresh').addEventListener('click', () => loadArticles().catch((error) => { draftMessage.textContent = error.message; }));
document.querySelector('#close-editor').addEventListener('click', () => {
  activeArticle = null;
  activeArticleId = null;
  activeArticleStatus = null;
  editor.hidden = true;
  setEditorUrl(null);
});
for (const button of document.querySelectorAll('[data-preview-locale]')) {
  button.addEventListener('click', () => showPreview(button.dataset.previewLocale));
}
document.querySelector('#editor-primary-category').addEventListener('change', (event) => {
  renderCompetitionOptions(event.currentTarget.value, []);
});
document.querySelector('#close-preview').addEventListener('click', () => previewDialog.close());
for (const button of document.querySelectorAll('[data-card-preview-locale]')) {
  button.addEventListener('click', () => showCardPreview(button.dataset.cardPreviewLocale));
}
document.querySelector('#preview-card').addEventListener('click', () => showCardPreview('en'));
document.querySelector('#close-card-preview').addEventListener('click', () => cardPreviewDialog.close());
document.querySelector('#back-from-card-preview').addEventListener('click', () => cardPreviewDialog.close());
document.querySelector('#publish-from-card-preview').addEventListener('click', requestPublishFromPreview);
document.querySelector('#submit-review').addEventListener('click', () => articleAction('submit-review', 'Проверяем готовность…'));
document.querySelector('#return-draft').addEventListener('click', () => articleAction('return-draft', 'Возвращаем в черновик…'));
editorForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeArticleId || activeArticleStatus !== 'draft') return;
  editorMessage.textContent = 'Сохраняем…';
  try {
    const article = await api(`/v1/admin/news/articles/${encodeURIComponent(activeArticleId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftPayload())
    });
    fillEditor(article);
    editorMessage.textContent = 'Черновик сохранён.';
    await loadArticles();
  } catch (error) { editorMessage.textContent = error.message; }
});
document.querySelector('#draft-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  draftMessage.textContent = 'Создаём…';
  const body = Object.fromEntries(new FormData(form));
  try {
    const article = await api('/v1/admin/news/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    form.reset();
    draftMessage.textContent = 'Черновик создан.';
    await loadArticles();
    await openEditor(article.article_id);
  } catch (error) { draftMessage.textContent = error.message; }
});

onAuthStateChanged(auth, async (user) => {
  token = null;
  workspace.hidden = true;
  signOutButton.hidden = true;
  authCard.hidden = false;
  document.querySelector('#candidate-list').replaceChildren();
  activeArticle = null;
  activeArticleId = null;
  activeArticleStatus = null;
  activeCandidate = null;
  document.querySelector('#candidate-detail').hidden = true;
  document.querySelector('#candidates-message').textContent = '';
  if (!user) return;
  authMessage.textContent = 'Проверяем доступ…';
  try {
    token = await user.getIdToken(true);
    const session = await api('/v1/admin/news/session');
    document.querySelector('#admin-uid').textContent = `Admin: ${session.uid}`;
    authCard.hidden = true;
    workspace.hidden = false;
    signOutButton.hidden = false;
    await loadTaxonomy();
    await loadArticles();
    await loadCandidates();
    const articleId = new URL(window.location.href).searchParams.get('article');
    if (articleId) await openEditor(articleId);
  } catch (error) {
    token = null;
    authMessage.textContent = error.message;
    await signOut(auth);
  }
});
