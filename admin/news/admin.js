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
let token = null;

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
    const title = document.createElement('strong');
    title.textContent = item.slug;
    const meta = document.createElement('span');
    meta.textContent = `${item.status} · ${item.primary_category || 'без категории'} · переводов: ${item.translation_count}`;
    row.append(title, meta);
    return row;
  }) : [Object.assign(document.createElement('p'), { textContent: 'Статей пока нет.' })]));
}

signInButton.addEventListener('click', async () => {
  authMessage.textContent = '';
  try { await signInWithPopup(auth, provider); } catch (error) { authMessage.textContent = error.message; }
});
signOutButton.addEventListener('click', () => signOut(auth));
document.querySelector('#refresh').addEventListener('click', () => loadArticles().catch((error) => { draftMessage.textContent = error.message; }));
document.querySelector('#draft-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  draftMessage.textContent = 'Создаём…';
  const body = Object.fromEntries(new FormData(event.currentTarget));
  try {
    await api('/v1/admin/news/articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    event.currentTarget.reset();
    draftMessage.textContent = 'Черновик создан.';
    await loadArticles();
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
  } catch (error) {
    token = null;
    authMessage.textContent = error.message;
    await signOut(auth);
  }
});
