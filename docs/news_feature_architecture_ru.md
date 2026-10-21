# Football Quiz News — модель, API и план реализации

Дата: `2026-10-19`
Статус: `Local read MVP + category taxonomy implemented; not committed or deployed`
Область: `Football Quiz Web` + `Football-Quiz-Backend`

## 1. Цель

Добавить на `https://footballquiz.club` редакционный раздел с актуальными новостями об известных футбольных клубах, не смешивая его с игровым каталогом вопросов и не делая новости обязательной частью offline-first gameplay.

Новости должны:

- усиливать органический трафик и возвращаемость пользователей;
- давать повод регулярно обновлять сайт;
- вести пользователя к Football Quiz и Google Play без навязчивой рекламы;
- поддерживать текущие web-языки `en`, `ru`, `hy`;
- иметь понятные источники, дату публикации и авторскую переработку текста;
- не копировать чужие статьи целиком и не использовать изображения без разрешения.

## 2. Зафиксированное архитектурное решение

```text
Редактор / будущая admin-панель
    -> Football Quiz Backend + MySQL
        -> публичный News API
            -> PHP-rendered страницы footballquiz.club/news/
                -> пользователь / поисковик / social preview
```

### Источник истины

Источник истины для новостей — backend/MySQL. Web не хранит второй независимый каталог новостей в JavaScript или HTML.

### Роль Web

Web отвечает за представление контента:

- список новостей;
- фильтры по разделам и клубам;
- страницу отдельной новости;
- SEO/meta/Open Graph;
- ссылки на источник;
- CTA на Football Quiz.

### Рендеринг

Для новостей рекомендуется небольшой server-rendered PHP-слой в web-репозитории, который читает публичный API. Это не превращает landing в SPA и не переносит backend-логику в web.

Причина: отдельная статья должна сразу отдавать готовые `title`, description, canonical и Open Graph теги. Чистый client-side JavaScript хуже подходит для SEO и превью в социальных сетях.

### Игровая независимость

Недоступность News API не должна ломать:

- главную страницу;
- legal pages;
- Google Play CTA;
- Android-приложение;
- вопросы, score rules или offline gameplay.

## 3. Редакционные правила

1. Не публиковать полный перевод или копию чужой статьи.
2. Писать собственный короткий пересказ и добавлять ссылку на первоисточник.
3. Для каждого материала хранить минимум один проверяемый источник.
4. Слухи явно помечать как неподтверждённые; на MVP лучше не публиковать их вообще.
5. Не утверждать трансфер, травму, увольнение или результат матча без надёжного источника.
6. Всегда хранить время события и время публикации отдельно, если они различаются.
7. Не hotlink-ить изображения с чужих сайтов.
8. Использовать собственные, лицензированные или явно разрешённые изображения с credit/rights note.
9. Не использовать гербы клубов и фотографии игроков как будто они принадлежат Football Quiz.
10. Исправления после публикации отражать через `updated_at`; существенное исправление можно обозначить в тексте.

## 4. Контентная модель

### 4.1 `news_articles`

Общие, не зависящие от языка данные статьи.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | `BIGINT UNSIGNED` | Внутренний DB ID |
| `article_id` | `VARCHAR(64)` | Публичный стабильный ID, не зависящий от slug |
| `slug` | `VARCHAR(160)` | Уникальный canonical slug |
| `status` | `VARCHAR(24)` | `draft`, `review`, `published`, `archived` |
| `news_type` | `VARCHAR(32)` | `club_news`, `match`, `transfer`, `explainer`, `football_quiz` |
| `hero_image_url` | `TEXT NULL` | Только разрешённый asset на контролируемом домене |
| `image_credit` | `VARCHAR(255) NULL` | Видимый credit |
| `image_rights_note` | `TEXT NULL` | Внутренняя фиксация лицензии/разрешения |
| `event_at` | `TIMESTAMP NULL` | Когда произошло событие |
| `published_at` | `TIMESTAMP NULL` | Когда статья стала публичной |
| `created_at` | `TIMESTAMP` | Создание записи |
| `updated_at` | `TIMESTAMP` | Последнее изменение |

Правила:

- `article_id` не меняется после создания;
- после первой публикации `slug` неизменяем в MVP; redirect history можно добавить отдельной миграцией, если реальная необходимость появится позже;
- публичный API возвращает только `status=published` и `published_at <= NOW()`;
- удаление опубликованной статьи не является обычной операцией: предпочтительнее `archived` и контролируемый `410/redirect`.

### 4.2 `news_article_translations`

Локализованный текст.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | `BIGINT UNSIGNED` | Внутренний ID |
| `article_db_id` | `BIGINT UNSIGNED` | FK на `news_articles.id` |
| `locale` | `VARCHAR(8)` | `en`, `ru`, `hy` |
| `translation_status` | `VARCHAR(24)` | `draft`, `review`, `published` |
| `title` | `VARCHAR(220)` | Заголовок |
| `summary` | `TEXT` | Короткий анонс для карточки |
| `body_markdown` | `MEDIUMTEXT` | Авторский текст в ограниченном Markdown |
| `hero_image_alt` | `VARCHAR(255) NULL` | Локализованный alt |
| `seo_title` | `VARCHAR(220) NULL` | SEO title; по умолчанию `title` |
| `seo_description` | `VARCHAR(320) NULL` | SEO description; по умолчанию `summary` |
| `created_at` | `TIMESTAMP` | Создание перевода |
| `updated_at` | `TIMESTAMP` | Изменение перевода |

Ограничение: уникальная пара `(article_db_id, locale)`.

Markdown на выводе проходит allowlist sanitizer. Произвольный HTML из базы не исполняется.

### 4.3 `news_sources`

Одна статья может опираться на несколько источников.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | `BIGINT UNSIGNED` | Внутренний ID |
| `article_db_id` | `BIGINT UNSIGNED` | FK на статью |
| `publisher_name` | `VARCHAR(160)` | Название источника |
| `source_url` | `TEXT` | Прямая ссылка на материал |
| `source_published_at` | `TIMESTAMP NULL` | Дата оригинальной публикации |
| `created_at` | `TIMESTAMP` | Когда источник добавлен |

Публичная статья показывает блок «Источники». URL валидируется и допускает только `http/https`.

### 4.4 `football_clubs`

Стабильный справочник клубов.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | `BIGINT UNSIGNED` | Внутренний ID |
| `club_key` | `VARCHAR(64)` | Стабильный ключ, например `real-madrid` |
| `slug` | `VARCHAR(100)` | URL slug фильтра |
| `canonical_name` | `VARCHAR(160)` | Официальное/основное имя |
| `country_code` | `CHAR(2) NULL` | ISO country code |
| `is_active` | `TINYINT(1)` | Можно ли выбирать клуб в редакторе/фильтре |
| `created_at` | `TIMESTAMP` | Создание |
| `updated_at` | `TIMESTAMP` | Изменение |

`is_active` здесь нужен, чтобы временно скрыть клуб из новых публикаций и фильтров, не ломая старые URL и связи.

### 4.5 `football_club_translations`

Локализованные отображаемые названия клубов без изменения стабильного `club_key`.

| Поле | Тип | Назначение |
|---|---|---|
| `id` | `BIGINT UNSIGNED` | Внутренний ID |
| `club_db_id` | `BIGINT UNSIGNED` | FK на `football_clubs.id` |
| `locale` | `VARCHAR(8)` | `en`, `ru`, `hy` |
| `display_name` | `VARCHAR(160)` | Имя для выбранной локали |
| `created_at` | `TIMESTAMP` | Создание |
| `updated_at` | `TIMESTAMP` | Изменение |

Ограничение: уникальная пара `(club_db_id, locale)`. Если локализованной строки нет, API может использовать `canonical_name`, так как это имя сущности, а не подмена языка статьи.

### 4.6 `news_article_clubs`

Many-to-many связь статей и клубов:

```text
article_db_id
club_db_id
```

Уникальная пара `(article_db_id, club_db_id)`.

### 4.7 `news_categories` и `news_article_categories`

Зафиксированы три стартовых раздела:

```text
top-5
uefa
world-cup
```

`All` является состоянием интерфейса и не хранится как категория. `Versus` отложен до появления отдельных сравнительных материалов.

Статья может принадлежать нескольким разделам через `news_article_categories`. Например, материал о расписании клуба в национальной лиге и Лиге чемпионов может одновременно находиться в `top-5` и `uefa`.

### 4.8 `news_competitions` и `news_article_competitions`

`Top 5` является родительской категорией для пяти обязательных competitions:

```text
premier-league
la-liga
serie-a
bundesliga
ligue-1
```

Competition хранит стабильные `competition_key`, `slug`, ссылку на родительскую category и `is_active`. Статья может относиться к нескольким competitions через `news_article_competitions`, но каждая связь требует присутствия родительской category у статьи.

UI всегда показывает все пять лиг, даже если у части из них `article_count = 0`. Это отделяет полноту навигации от текущего объёма редакционного контента. Та же модель позже допускает competitions внутри `uefa` без изменения общего контракта.

### 4.9 Отложенные модели

На первом MVP не нужны:

- комментарии пользователей;
- лайки и рейтинги;
- персональная лента;
- push notifications;
- автоматический scraper;
- автоматическая AI-публикация;
- отдельная сложная tags taxonomy.

## 5. Локализация

Backend использует locale `hy`, как и текущие API contracts. В UI язык может по-прежнему называться `AM`, но запрос отправляет `locale=hy`.

Правила публикации:

- перевод имеет собственный `translation_status`;
- API не выдаёт черновой перевод;
- `GET /v1/news?locale=ru` возвращает только опубликованные русские переводы;
- silent fallback на английский не используется, чтобы русская/армянская лента внезапно не смешивалась с английской;
- при необходимости клиент может явно запросить `fallback_locale=en`, но это отдельное продуктовое решение;
- для первого публичного запуска желательно подготовить одинаковый небольшой набор статей на `en`, `ru`, `hy`.

## 6. Public News API

Базовый URL:

```text
https://api.footballquiz.club/v1
```

Формат ответа остаётся общим для backend:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

### 6.1 Список новостей

```http
GET /v1/news?locale=ru&category=top-5&competition=la-liga&club=real-madrid&limit=12&cursor=<opaque_cursor>
```

Параметры:

- `locale`: `en`, `ru`, `hy`; обязателен или по умолчанию `en`;
- `category`: optional; `top-5`, `uefa` или `world-cup`;
- `competition`: optional; на текущем этапе одна из пяти Top 5 leagues и только вместе с `category=top-5`;
- `club`: optional club slug;
- `type`: optional `news_type`;
- `limit`: `1..30`, default `12`;
- `cursor`: opaque cursor для следующей страницы.

Стабильная сортировка: `(published_at DESC, id DESC)`. Cursor кодирует обе границы в непрозрачной base64url-строке; клиент не должен собирать или изменять его вручную.

Пример `data`:

```json
{
  "locale": "ru",
  "items": [
    {
      "article_id": "news_01J...",
      "slug": "real-madrid-match-update",
      "type": "club_news",
      "title": "...",
      "summary": "...",
      "hero_image_url": "https://footballquiz.club/assets/news/...",
      "hero_image_alt": "...",
      "categories": [
        {
          "category_key": "uefa",
          "slug": "uefa"
        }
      ],
      "competitions": [
        {
          "competition_key": "la-liga",
          "slug": "la-liga",
          "category_key": "top-5"
        }
      ],
      "clubs": [
        {
          "club_key": "real-madrid",
          "slug": "real-madrid",
          "name": "Real Madrid"
        }
      ],
      "published_at": "2026-10-05T10:00:00Z",
      "updated_at": "2026-10-05T10:00:00Z"
    }
  ],
  "next_cursor": null
}
```

Список не возвращает `body_markdown` и полный массив источников.

### 6.2 Одна новость

```http
GET /v1/news/{slug}?locale=ru
```

Пример `data`:

```json
{
  "article_id": "news_01J...",
  "slug": "real-madrid-match-update",
  "locale": "ru",
  "type": "club_news",
  "title": "...",
  "summary": "...",
  "body_markdown": "...",
  "hero_image_url": "https://footballquiz.club/assets/news/...",
  "hero_image_alt": "...",
  "image_credit": "...",
  "clubs": [],
  "sources": [
    {
      "publisher_name": "...",
      "source_url": "https://...",
      "source_published_at": "2026-10-05T08:00:00Z"
    }
  ],
  "seo": {
    "title": "...",
    "description": "...",
    "canonical_url": "https://footballquiz.club/news/real-madrid-match-update/"
  },
  "published_at": "2026-10-05T10:00:00Z",
  "updated_at": "2026-10-05T10:00:00Z"
}
```

Не найденная, архивная или не переведённая на запрошенный язык статья возвращает `404 not_found`.

### 6.3 Список клубов

```http
GET /v1/news/clubs?locale=ru&category=top-5&competition=la-liga
```

Возвращает только активные клубы, у которых есть хотя бы одна опубликованная статья на выбранном языке и внутри выбранных category/competition.

В router статические пути `/v1/news/clubs` и `/v1/news/competitions` проверяются раньше динамического `/v1/news/{slug}`, чтобы служебные имена не воспринимались как slug статьи.

### 6.4 Список competitions

```http
GET /v1/news/competitions?locale=ru&category=top-5
```

Возвращает все активные дочерние competitions в стабильном порядке и `article_count` для выбранной локали. Лиги с нулём материалов не удаляются из ответа.

### 6.5 Кэширование

Для публичных GET endpoints:

```http
Cache-Control: public, max-age=60, stale-while-revalidate=300
ETag: "..."
```

После публикации допускается задержка до одной минуты. Персональные данные и Firebase Auth для чтения новостей не нужны.

## 7. Будущий Admin API

Admin API не входит в первый public MVP. Когда появится admin-панель, предлагаемые routes:

```http
POST   /v1/admin/news
PATCH  /v1/admin/news/{article_id}
POST   /v1/admin/news/{article_id}/translations/{locale}
POST   /v1/admin/news/{article_id}/submit-review
POST   /v1/admin/news/{article_id}/publish
POST   /v1/admin/news/{article_id}/archive
```

Требования:

- обязательный Firebase ID Token;
- backend-проверка admin claim/allowlist;
- аудит автора и времени изменения;
- publish endpoint проверяет title, summary, body, источник, slug, locale и права на изображение;
- public status нельзя передавать как доверенное поле из браузера без серверной проверки.

Для первого этапа безопаснее использовать локальный CLI/import script и ручную review-процедуру, чем сразу строить admin UI.

## 8. Структура Web

### Публичные URL

```text
/                                      текущий landing
/{locale}/news/                        список всех новостей
/{locale}/news/{category}/             Top 5 / UEFA / World Cup
/{locale}/news/top-5/{competition}/     отдельная лига Top 5
/{locale}/news/club/{club-slug}/       фильтр клуба во всех разделах
/{locale}/news/{category}/club/{slug}/ сочетание раздела и клуба
/{locale}/news/top-5/{competition}/club/{slug}/ сочетание лиги и клуба
/{locale}/news/{article-slug}/         отдельная статья
```

Старые legal URL остаются без изменений.

### Главная страница

На landing добавляется компактный блок:

```text
Latest football news
3 последние карточки
Кнопка «Все новости»
```

Если API временно недоступен, блок скрывается или показывает спокойное fallback-состояние. Остальной landing продолжает работать.

### `/news/`

- заголовок и короткое объяснение;
- карточки новостей;
- фильтр по клубам;
- при выбранном `Top 5` — постоянная сетка пяти лиг с counts и empty states;
- локальный language switcher, синхронизированный с landing;
- cursor-based «Показать ещё»;
- empty/error/loading states;
- ссылка на Google Play после нескольких карточек, а не между каждым материалом.

### `/news/{slug}/`

- breadcrumbs;
- заголовок;
- дата публикации и дата обновления, если отличается;
- клубы;
- разрешённое hero image + credit;
- авторский текст;
- блок источников;
- share metadata;
- related news по тем же клубам;
- CTA на Football Quiz;
- ссылка назад к списку.

## 9. SEO и social preview

Для каждой статьи обязательны:

- уникальный `<title>`;
- meta description;
- canonical URL;
- `og:type=article`;
- `og:title`, `og:description`, `og:url`, разрешённое `og:image`;
- `article:published_time` и `article:modified_time`;
- JSON-LD `NewsArticle` или `Article`;
- абсолютные URL;
- корректный HTTP status (`200`, `404`, `410`, `503`).

Также нужны:

- добавление новостей в основной `sitemap.xml` или отдельный news sitemap;
- `hreflang` только для реально опубликованных переводов;
- RSS/Atom можно добавить после стабильного MVP;
- язык вынесен в индексируемый path prefix: `/en/news/...`, `/ru/news/...`, `/hy/news/...`;
- `top-5`, `uefa`, `world-cup` являются зарезервированными category slugs и не могут использоваться как article slug.

## 10. Безопасность и приватность

- Public News API read-only и не требует авторизации.
- SQL только через prepared statements.
- `limit`, `locale`, `category`, `club`, `type`, `slug` валидируются allowlist/format rules.
- Markdown преобразуется в HTML только через безопасный renderer и sanitizer.
- Внешние ссылки получают `rel="noopener noreferrer"`; для редакционных source links можно использовать обычную индексируемую ссылку без искусственного сокрытия источника.
- Не хранить токены, email пользователей или идентификаторы в news analytics.
- Не разрешать произвольный image URL из admin UI без проверки домена/asset workflow.
- CORS остаётся allowlist-based.
- Ошибка News API не раскрывает SQL, filesystem path или debug trace в production.

## 11. Analytics без PII

Допустимые события:

```text
news_section_view
news_article_open
news_category_filter_select
news_club_filter_select
news_load_more
news_source_click
news_play_store_click
```

Допустимые параметры:

```text
article_id
category_key
club_key
locale
position
source_surface
```

Не передавать:

- email;
- Firebase UID;
- ID Token;
- полный source URL;
- введённый пользователем текст.

## 12. План реализации

### Local implementation checkpoint — 2026-10-07

Локально, без изменения production DB и production сайтов, выполнено:

- additive News migration применена к `football_quiz_local`;
- создан валидируемый JSON import format и CLI с default `dry-run`;
- fixture защищён от импорта в database без суффикса `_local`;
- реализованы и проверены `/v1/news`, `/v1/news/clubs`, `/v1/news/{slug}`;
- реализован `/v1/news/competitions`; `category + competition + club` работают совместно;
- работают locale isolation, club filter, keyset cursor pagination и detail `404`;
- DB session фиксируется в UTC, API отдаёт ISO 8601 UTC;
- news-only responses получают `Cache-Control` и `ETag`;
- создан PHP-rendered Web News list/detail, club filter, sources и Google Play CTA;
- выбраны clean routes `/en/news/...`, `/ru/news/...`, `/hy/news/...`;
- landing получил кнопку News и блок трёх последних материалов;
- mobile `390×667` и desktop визуально проверены, horizontal overflow отсутствует;
- Top 5 league navigation проверена на `390×844`: все пять лиг видны, horizontal overflow отсутствует, Tab navigation работает;
- PHPUnit: `48` tests / `108` assertions;
- никакого commit, push или deployment ещё не было.

После технического fixture подготовлен первый реальный локальный редакционный каталог:

- Real Madrid: насыщенное расписание из пяти октябрьских матчей;
- FC Bayern: семь матчей за 22 дня;
- FC Barcelona: три финалиста Golden Boy;
- `3` статьи, `9` переводов EN/RU/HY, `4` официальных клубных источника и `3` club filters;
- все тексты написаны специально для Football Quiz, без копирования чужих статей;
- материалы опубликованы локально без сторонних изображений; используется собственный FQ placeholder;
- validator dry-run, local import, API smoke, pagination `2 + 1`, landing preview и mobile/detail visual QA пройдены;
- три fixture-статьи в `football_quiz_local` переведены в `archived`, но не удалены.

Этот каталог ещё не является production-контентом: production DB/API/Web не изменялись.

### Phase N0 — согласование архитектуры

- утвердить этот документ;
- выбрать URL-стратегию локалей;
- утвердить стартовый список клубов;
- определить разрешённый источник изображений;
- выбрать первые 3–5 материалов для ручного запуска.

### Phase N1 — Backend read MVP

- добавить SQL migration с news tables и indexes;
- добавить минимальный безопасный matcher для динамического `/v1/news/{slug}` без превращения router в framework;
- добавить `NewsRepository` и DTO mapping;
- реализовать `GET /v1/news`;
- реализовать `GET /v1/news/{slug}`;
- реализовать `GET /v1/news/clubs`;
- добавить строгую валидацию query/path params;
- зафиксировать UTC для DB session и отдавать даты как ISO 8601 UTC;
- расширить response helper управляемыми public cache headers/ETag, не меняя cache policy существующих endpoints;
- добавить seed/import формат для ручной публикации;
- проверить empty state, locale isolation, filters, pagination и 404;
- добавить повторяемый test/smoke контур до изменения production routes;
- обновить backend `PROJECT_CONTEXT.md` и README;
- выполнить local smoke tests до deployment.

### Phase N2 — Web pages

- добавить PHP-rendered `/news/` и detail page;
- добавить API client boundary с timeout и безопасной обработкой ошибок;
- добавить news styles без поломки landing/mobile;
- добавить language behavior;
- добавить cards, filters, pagination, sources и CTA;
- добавить SEO/Open Graph/JSON-LD;
- обновить `.htaccess` clean routes;
- обновить `.cpanel.yml` для новых runtime files/assets;
- добавить блок последних новостей на landing;
- проверить desktop и mobile.

### Phase N3 — Редакционный запуск

- вручную подготовить 3–5 коротких материалов;
- сделать версии `en`, `ru`, `hy`;
- проверить факты и источники;
- проверить права на каждое изображение;
- preview до публикации;
- backend deployment;
- web deployment;
- production smoke test всех языков, canonical/OG и source links.

### Phase N4 — SEO и эксплуатация

- sitemap;
- Search Console проверка;
- cache/ETag;
- monitoring ошибок API;
- аналитика открытия статей и переходов в Google Play;
- редакционная частота и архивирование.

### Phase N5 — Admin и automation, только при реальной необходимости

- admin UI;
- review/publish workflow;
- scheduled publication;
- media upload workflow;
- RSS/source ingestion только как очередь черновиков;
- никакой автоматической публикации без human review.

## 13. Acceptance criteria MVP

- Новости не ломают landing, legal pages и Google Play flow.
- Public API отдаёт только опубликованные материалы и переводы.
- Фильтрация по клубу работает по стабильному `club_key/slug`.
- Страница статьи открывается по clean URL и отдаёт server-rendered SEO/meta.
- У каждой статьи есть минимум один видимый источник.
- На сайте нет скопированных целиком чужих статей.
- У каждого изображения зафиксированы права/credit.
- EN/RU/HY не смешиваются через неявный fallback.
- Неавторизованный пользователь не может создать или опубликовать новость.
- При падении News API landing и legal pages остаются доступными.
- Mobile layout не имеет horizontal overflow.
- Analytics не содержит PII.

## 14. Решения для редакционного запуска

1. URL локалей: выбрано `/en/news/...`, `/ru/news/...`, `/hy/news/...`.
2. Первые клубы: рекомендовано начать с 6–10, а не со всех клубов мира.
3. Изображения: выбрать собственные шаблоны Football Quiz, лицензированный provider или публикации без фото на первом этапе.
4. Частота: реалистичный старт — 2–3 качественных материала в неделю.
5. Контент: только проверенные новости или также трансферные слухи; рекомендовано начать без слухов.

## 15. Рекомендуемый следующий шаг

Провести финальный human review первого реального каталога и локального UI. Только после отдельного подтверждения владельца делать commits, backend deployment, migration production DB и web deployment. Изображения добавлять позже только через явно разрешённый asset/licensing workflow.

## 16. Результат предварительного аудита существующего Backend

Аудит выполнен на ветке `codex/news-api-foundation` до добавления runtime-кода.

Текущее состояние:

- `Application` использует простой exact-path router;
- `Request` поддерживает method, path, origin, bearer token и строковые query params;
- business endpoints используют единый JSON envelope;
- repository-классы самостоятельно создаются на route boundary и работают через PDO prepared statements;
- database failures нормализуются в `503 database_unavailable`;
- CORS уже ограничивается allowlist из environment;
- production deploy копирует только public entrypoint, а source/vendor остаются вне `public_html`;
- автоматического тестового набора и dev test dependencies пока нет;
- отдельной поддержки `Cache-Control`, `ETag` и динамических path parameters пока нет;
- DB session timezone явно не фиксируется в `ConnectionFactory`.

Следствия для News MVP:

1. Не переписывать весь router. Добавить узкий и проверяемый matcher только для news detail route.
2. Не добавлять admin writes вместе с public read API.
3. Не подключать Markdown renderer на первом database/API slice: backend пока может отдавать проверенный `body_markdown`, а безопасный render появится в Web slice.
4. До route wiring создать migration, seed fixture и тестируемую query/cursor validation boundary.
5. Не менять cache headers глобально: включать public caching только для news responses.
6. Не использовать OFFSET pagination, потому что новые публикации будут сдвигать страницы; использовать keyset cursor по `published_at + id`.
7. Не делать silent locale fallback для статей. Отсутствующий опубликованный перевод — контролируемый `404` для detail и отсутствие карточки в list.
8. Не менять существующие questions/scoring/legal/auth endpoints в первом news slice.
