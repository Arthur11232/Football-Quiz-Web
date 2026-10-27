import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

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
const locales = ['en', 'ru', 'hy'];
let token = null;
let activeArticleId = null;
let activeArticleStatus = null;

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message || `API ${response.status}`);
  return payload.data;
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
      actions.setAttribute('aria-label', `Открыть ${item.slug} на сайте`);
      for (const locale of ['ru', 'en', 'hy']) {
        const link = document.createElement('a');
        link.className = 'article-link';
        link.href = `/${locale}/news/${encodeURIComponent(item.slug)}/`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = locale.toUpperCase();
        actions.append(link);
      }
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
  activeArticleId = article.article_id;
  activeArticleStatus = article.status;
  document.querySelector('#editor-title').textContent = article.slug;
  document.querySelector('#editor-slug').value = article.slug;
  document.querySelector('#editor-news-type').value = article.news_type;
  document.querySelector('#editor-primary-category').value = article.primary_category || 'top-5';
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
  document.querySelector('#publish-article').hidden = status !== 'review';
}

async function openEditor(articleId) {
  editor.hidden = false;
  editorMessage.textContent = 'Загружаем черновик…';
  editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    fillEditor(await api(`/v1/admin/news/articles/${encodeURIComponent(articleId)}`));
  } catch (error) {
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
  } catch (error) { editorMessage.textContent = error.message; }
}

async function deleteDraft(articleId, slug, button) {
  if (!window.confirm(`Удалить черновик «${slug}»? Это действие нельзя отменить.`)) return;
  button.disabled = true;
  draftMessage.textContent = 'Удаляем черновик…';
  try {
    await api(`/v1/admin/news/articles/${encodeURIComponent(articleId)}`, { method: 'DELETE' });
    if (activeArticleId === articleId) {
      activeArticleId = null;
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
document.querySelector('#refresh').addEventListener('click', () => loadArticles().catch((error) => { draftMessage.textContent = error.message; }));
document.querySelector('#close-editor').addEventListener('click', () => {
  activeArticleId = null;
  activeArticleStatus = null;
  editor.hidden = true;
  setEditorUrl(null);
});
for (const button of document.querySelectorAll('[data-preview-locale]')) {
  button.addEventListener('click', () => showPreview(button.dataset.previewLocale));
}
document.querySelector('#close-preview').addEventListener('click', () => previewDialog.close());
document.querySelector('#submit-review').addEventListener('click', () => articleAction('submit-review', 'Проверяем готовность…'));
document.querySelector('#return-draft').addEventListener('click', () => articleAction('return-draft', 'Возвращаем в черновик…'));
document.querySelector('#publish-article').addEventListener('click', () => {
  if (window.confirm('Опубликовать статью для всех языков?')) articleAction('publish', 'Публикуем…');
});
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
  draftMessage.textContent = 'Создаём…';
  const body = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const article = await api('/v1/admin/news/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    event.currentTarget.reset();
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
  if (!user) return;
  authMessage.textContent = 'Проверяем доступ…';
  try {
    token = await user.getIdToken(true);
    const session = await api('/v1/admin/news/session');
    document.querySelector('#admin-uid').textContent = `Admin: ${session.uid}`;
    authCard.hidden = true;
    workspace.hidden = false;
    signOutButton.hidden = false;
    await loadArticles();
    const articleId = new URL(window.location.href).searchParams.get('article');
    if (articleId) await openEditor(articleId);
  } catch (error) {
    token = null;
    authMessage.textContent = error.message;
    await signOut(auth);
  }
});
