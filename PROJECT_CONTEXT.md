# Football Quiz Web — Project Context

Дата последнего обновления: `2026-09-11`

Этот файл — стартовая точка для нового web/landing-чата по Football Quiz. Перед началом работы читать этот файл, затем при необходимости:

- `README.md`;
- `docs/web_backend_readiness_roadmap_ru.md`;
- `/Users/Arthu/Documents/GitHub/Footbal-Quiz/docs/web_android_chat_sync_ru.md`;
- `/Users/Arthu/Documents/GitHub/Football-Quiz-Backend/PROJECT_CONTEXT.md`.

## Назначение проекта

`Football Quiz Web` — отдельный web/landing project для публичного сайта Football Quiz.

Основная роль сейчас:

- официальный landing сайта `https://footballquiz.club/`;
- презентация Android-приложения Football Quiz;
- Google Play / QR install flow;
- публичные legal pages для Play Console, пользователей и review;
- news/marketing block про certificates;
- будущая точка входа для backend-aware public site и ограниченного web validation client.

Важно: этот репозиторий не является Android app и не является backend API.

## Границы проекта

В этом web project работаем только с:

```text
/Users/Arthu/Documents/GitHub/Football Quiz Web
```

Не смешивать с Android repo:

```text
/Users/Arthu/Documents/GitHub/Footbal-Quiz
```

Не смешивать с backend repo:

```text
/Users/Arthu/Documents/GitHub/Football-Quiz-Backend
```

Исключение: Android/backend repos можно читать как reference, если нужно синхронизировать landing-тексты, legal links, Play Store состояние, backend contracts или product status.

## Язык общения

Владелец проекта попросил: всегда отвечать на русском кириллицей, даже если он пишет транслитом.

## Local repository

```text
Path: /Users/Arthu/Documents/GitHub/Football Quiz Web
Branch: main
Remote: origin/main
```

Текущий git state на момент создания этого файла:

```text
main...origin/main
untracked:
  docs/
  linkedin-cover-football-quiz.png
```

Не коммитить автоматически без явного запроса владельца.

## Текущее состояние сайта

В репозитории уже есть:

- `index.html` — основной landing;
- `style.css` — стили landing/legal pages;
- `main.js` — интерактивность landing-а;
- `translations.js` — локализации landing-а;
- `football_quiz_icon.png` — иконка приложения;
- `football_quiz_play_qr.png` — QR для Google Play;
- `privacy-policy.html`;
- `terms-and-conditions.html`;
- `data-deletion.html`;
- `privacy_policy.md`;
- `terms_and_conditions.md`;
- `data_deletion.md`;
- `.htaccess`;
- `.cpanel.yml`;
- `docs/web_backend_readiness_roadmap_ru.md`;
- `assets/screenshots/football-quiz-question-screen.jpg`;
- `assets/screenshots/football-quiz-category-screen.jpg`;
- `assets/screenshots/football-quiz-certificate-screen.jpg`;
- `assets/video/football-quiz-gameplay-2026-09-11.mp4`;
- `assets/og/football-quiz-1200x630.png`;
- `linkedin-cover-football-quiz.png` — локальный marketing asset, сейчас untracked.

README сейчас короткий и описывает проект как web page для Privacy Policy / Terms and Conditions и будущего большого проекта.

## Landing: текущий продуктовый смысл

Сайт уже не должен выглядеть только как набор legal pages. Он должен представлять сам продукт:

- футбольный quiz/trivia app;
- игроки, клубы, турниры, футбольная история;
- guest-first experience;
- Google Sign-In как optional путь для sync;
- cloud progress restore/sync;
- achievement certificates;
- Google Play CTA;
- QR install flow;
- trust/support/legal section.

Landing P0 conversion pass начат на `2026-09-11` после marketing handoff:

- убраны публичные упоминания `2.1.0` из landing copy;
- hero усилен вокруг оффера `689 questions / 6 languages / play free`;
- primary CTA стал `Install free on Google Play`;
- добавлен real product proof block с тремя актуальными Android screenshots;
- gameplay video asset сохранён, но embedded video player убран из product proof block после visual QA как слишком тяжёлый для композиции;
- screenshots в product proof block открываются в большом preview/lightbox;
- hero question screenshot заменён после visual QA на более короткий и естественный вопрос: `Which club won the German Cup the most?`;
- добавлены canonical, Open Graph и Twitter preview meta;
- создан OG image `assets/og/football-quiz-1200x630.png`;
- добавлены analytics events для landing funnel без PII;
- footer/legal contact переключён на `support@footballquiz.club`;
- `.cpanel.yml` обновлён для деплоя `assets/`.

Текущие основные секции `index.html`:

- header с brand, navigation и language switcher;
- hero block;
- Google Play CTA;
- QR/install visual;
- product proof/screenshots/video block;
- screenshots preview/lightbox;
- certificates/news section;
- certificate preview;
- certificate steps;
- features section;
- documents/legal section;
- footer links.

## Локализация landing-а

Landing сейчас поддерживает:

```text
en
ru
am
```

Локализации живут в:

```text
translations.js
```

Android app на момент sync-doc `2026-09-11` уже имеет 6 языков:

```text
en, ru, hy, es, de, it
```

Для landing-а это пока не означает автоматическое добавление всех языков. Добавлять `es/de/it` на web стоит только после отдельного решения, чтобы не размазать маркетинговый rollout.

Если добавлять новые языки в landing, нужно синхронно обновлять:

- language switcher;
- `translations.js`;
- SEO/meta тексты при необходимости;
- legal/support copy, если будет показываться локализованно.

## Marketing document status

Сейчас маркетолог готовит отдельный документ для разработки landing-а.

Когда документ будет готов, его нужно использовать как входной brief:

1. Прочитать marketing brief.
2. Сравнить с этим `PROJECT_CONTEXT.md`.
3. Сравнить с `docs/web_backend_readiness_roadmap_ru.md`.
4. Проверить, нет ли противоречий с backend/API и Android release-facing состоянием.
5. Превратить marketing copy в development plan по секциям.
6. Только после этого менять `index.html`, `style.css`, `main.js`, `translations.js` и assets.

Не нужно слепо переписывать landing только потому, что появился маркетинговый текст. Сначала сохранить структуру, SEO, legal links, Play CTA и deployment safety.

## Public support contact

Официальный публичный support email:

```text
support@footballquiz.club
```

Статус на `2026-09-11`:

- mailbox `support@footballquiz.club` создан;
- forwarder на личный Gmail владельца настроен;
- личный email владельца не использовать как основной публичный contact на landing-е, если можно использовать branded support address.

Для landing/legal обновлений использовать:

```html
<a href="mailto:support@footballquiz.club">support@footballquiz.club</a>
```

## Product state из sync-doc

Актуальный sync-doc:

```text
/Users/Arthu/Documents/GitHub/Footbal-Quiz/docs/web_android_chat_sync_ru.md
```

Состояние на `2026-09-11`:

- Android release candidate: `2.2.0`, `versionCode 58`;
- AAB: `app/prod/release/Football_Quiz_prod_release_2.2.0_58.aab`;
- SHA-256: `b6519a7e10397bb842777459af5ad05def1f6d3552dbcc76e859d48940fa351c`;
- Firestore questions обновлены до 6 языков;
- `689` вопросов на язык;
- всего `4134` documents;
- Play Console developer verification для `com.arthuralexandryan.footballquiz` показывает `Registered`.

Для web это значит:

- landing может говорить о многоязычности аккуратно, но только если тексты соответствуют реальному UI;
- если landing упоминает certificates, нужно учитывать, что app-side certificate UX уже реализован;
- если landing упоминает cloud sync, формулировки должны соответствовать текущему поведению Android;
- `questions_audit.json` больше не считать актуальным источником истины.

## Backend relation

Backend живёт отдельно:

```text
/Users/Arthu/Documents/GitHub/Football-Quiz-Backend
```

API:

```text
https://api.footballquiz.club
```

Backend уже имеет:

- `/health`;
- `/v1/content/active`;
- `/v1/questions`;
- `/v1/scoring/rules`;
- `/v1/legal/documents`;
- `/v1/legal/privacy-policy`;
- `/v1/legal/terms`;
- `/v1/auth/me`.

Backend философия:

- offline-first / offline gaming;
- backend отдаёт catalog/rules/contracts;
- backend не должен становиться обязательным online-судьёй каждого ответа;
- progress/certificates sync — optional authenticated layer.

Для web repo это значит:

- пока landing остаётся статическим сайтом;
- web-client/gameplay не добавлять без отдельного решения;
- API base URL при будущем client slice выносить в отдельный config boundary;
- Firebase Auth token передавать в backend только через API adapter;
- не хранить secrets в web repo.

## Web/backend roadmap

Главный roadmap:

```text
docs/web_backend_readiness_roadmap_ru.md
```

Текущее направление:

```text
Текущий landing/content site
  -> backend-aware public site
  -> ограниченный validation web client
  -> полноценный web game только после подтверждения backend contracts
```

Первый web validation slice в будущем может проверить:

- Firebase Google Sign-In;
- получение Firebase ID Token;
- чтение active backend content version;
- чтение questions catalog;
- минимальный quiz flow;
- progress read/write;
- certificates list/detail;
- guest → sign-in → restore/upload choice.

Но это не входит в текущую landing-фазу, если владелец прямо не попросит.

## Legal pages

В web repo есть публичные legal/support pages:

- `privacy-policy.html`;
- `terms-and-conditions.html`;
- `data-deletion.html`.

Markdown источники:

- `privacy_policy.md`;
- `terms_and_conditions.md`;
- `data_deletion.md`.

Эти страницы важны для:

- Play Console;
- пользователей;
- privacy/support requests;
- account/data deletion flow.

Не ломать URL без явной причины.

## Deployment

Деплой идёт через cPanel:

```text
.cpanel.yml
```

Текущая deploy config копирует в `/home/ixvldavx/public_html/`:

- `.htaccess`;
- `index.html`;
- `style.css`;
- `main.js`;
- `translations.js`;
- `privacy-policy.html`;
- `terms-and-conditions.html`;
- `data-deletion.html`;
- `football_quiz_icon.png`;
- `football_quiz_play_qr.png`.

Если добавляются новые runtime assets, их нужно добавить в `.cpanel.yml`, иначе на сервере они не появятся.

Если добавляется только документация в `docs/`, деплой сайта обычно менять не нужно.

## Security / privacy rules

- Не добавлять backend `.env`, MySQL credentials, Firebase service account или private config в web repo.
- Firebase web config может быть публичным, но это не security boundary.
- Не писать Firebase ID token, email или user identifiers в analytics events.
- Для будущих protected API routes использовать `Authorization: Bearer <firebase_id_token>`.
- CORS должен быть настроен backend-ом, не обходиться wildcard-логикой на client side.
- Legal/privacy copy должна соответствовать фактическому поведению приложения.

## Landing development rules

При разработке landing-а:

- сохранять Play Store CTA;
- сохранять QR install flow;
- сохранять legal links;
- сохранять responsive/mobile-first layout;
- не превращать landing в SPA без отдельного решения;
- не добавлять browser auth/gameplay в main page без отдельного phase decision;
- новые marketing sections делать так, чтобы они не ломали existing legal/support purpose;
- если добавляются новые assets, проверить `.cpanel.yml`;
- если меняются release-facing тексты, сверить с sync-doc и Android state.

## Возможная будущая структура landing-а

После получения marketing brief можно рассмотреть такую структуру:

1. Hero:
   - чёткое позиционирование Football Quiz;
   - Google Play CTA;
   - QR;
   - короткий trust/product line.
2. Why play:
   - football knowledge;
   - clubs/players/tournaments;
   - fast rounds;
   - offline-first.
3. Features:
   - guest mode;
   - Google Sign-In;
   - cloud sync;
   - profile progress;
   - certificates.
4. Screenshots / visual proof:
   - app icon;
   - phone mockup;
   - certificate preview;
   - screenshots if assets are provided.
5. Certificates:
   - explain completion reward;
   - profile history;
   - no overpromising about backend verification until backend supports it.
6. Languages:
   - mention supported app languages only if copy is synced with release state.
7. FAQ:
   - is it free;
   - can I play as guest;
   - how cloud sync works;
   - how to delete data;
   - where to download.
8. Legal/support:
   - Privacy;
   - Terms;
   - Data Deletion;
   - support email.

## Что не делать сейчас

- Не переносить Android gameplay в web repo.
- Не создавать backend code в web repo.
- Не коммитить секреты.
- Не менять legal URLs без необходимости.
- Не удалять existing legal pages ради нового дизайна.
- Не утверждать, что web game уже готов, пока есть только landing.
- Не делать backend authoritative gameplay без отдельного решения, потому что ключевая философия — offline-first.

## Ближайшие безопасные шаги

1. Дождаться marketing landing document.
2. Сравнить marketing brief с текущей структурой сайта.
3. Сделать landing implementation plan.
4. При необходимости обновить copy в `translations.js`.
5. Обновить layout/style в `index.html` и `style.css`.
6. Проверить локально в браузере.
7. Проверить responsive/mobile.
8. Проверить, что legal links и Google Play CTA работают.
9. Проверить `.cpanel.yml` при новых assets.
10. Потом делать local commit только после подтверждения владельца.
