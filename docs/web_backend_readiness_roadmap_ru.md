# Football Quiz Web — Roadmap готовности к Backend и Web Client

Статус: Draft for review.

Этот документ переводит решения из Android-аудита в отдельный, безопасный план для web-репозитория `Football Quiz Web`. Сейчас репозиторий остаётся статическим public/landing сайтом. Он не становится игровым web-клиентом в рамках текущей фазы.

## Роль Web в продукте

До появления iOS-клиента Web — практический второй клиент для недорогой проверки будущего backend. Его цель — проверить одни и те же пользовательские и контентные правила, не дублируя Android-приложение целиком.

Web должен эволюционировать в таком порядке:

```text
Текущий landing/content site
    -> backend-aware public site
    -> ограниченный validation web client
    -> полноценный клиент только после подтверждения backend contracts
```

На первой стадии Web не обязан поддерживать весь gameplay. Достаточно валидировать question catalog, sign-in, progress, certificates и контентные/admin workflows.

## Текущее состояние репозитория

В репозитории уже есть:

- статический лендинг на `index.html`, `style.css`, `main.js`;
- локализации EN/RU/HY через `translations.js`;
- Firebase Analytics в браузере;
- legal pages: Privacy Policy, Terms and Data Deletion;
- деплой через cPanel (`.cpanel.yml`);
- HTTPS redirect через `.htaccess`.

В текущем коде нет browser Firebase Auth, игрового API-клиента, backend configuration boundary и web state/domain layer. Это нормально: их не нужно добавлять до готовности backend MVP.

## Зафиксированные общие решения

- Backend/API/Admin живёт в отдельном репозитории `Football-Quiz-Backend`.
- Первый backend: PHP 8.x + MySQL на текущем hosting/cPanel.
- Firebase Auth остаётся identity provider. Web и Android получают Firebase ID Token и передают его в API как `Authorization: Bearer <firebase_id_token>`.
- Backend проверяет token и использует Firebase `uid` как единый стабильный идентификатор пользователя.
- Backend не хранит пароль пользователя и не реализует собственный login/password flow на первом этапе.
- Question catalog принадлежит backend и имеет независимый `content_version`.
- Текущий сайт продолжает быть landing/content site до отдельного решения о web-client rollout.

## Web-границы

Целевая зависимость для будущего web-клиента:

```text
Web UI
    -> Web feature/state layer
        -> API client contracts
            -> PHP backend

Firebase browser SDK
    -> auth adapter
        -> Firebase ID Token
            -> API client
```

Правила:

- UI не должен собирать URL, заголовки авторизации или разбирать DTO вручную;
- Firebase browser user не передаётся через игровые/progress/certificate contracts;
- backend JSON mapping живёт только в API-client/adapter layer;
- `uid`, `questionId`, `stageId`, `certificateId` — строковые стабильные identifiers;
- browser storage может быть cache/guest state, но не единственный authoritative cloud source для signed-in user.

## Минимальный web-validation scope

После появления backend MVP первым web-клиентом можно проверить:

1. Firebase Google Sign-In и получение ID Token.
2. Загрузку активного questions catalog по языку и совместимому `content_version`.
3. Несколько quiz-вопросов, основанных на backend `questionId`.
4. Загрузку и сохранение signed-in progress.
5. Просмотр ранее выданных certificates.
6. Публичные страницы и корректные ссылки на Google Play/legal documents.

Не входят в первый web-client slice:

- весь Android gameplay и его animations;
- versus mode;
- перенос Realm behavior в браузер;
- генерация/повторная выдача certificates на клиенте;
- дублирование admin panel в этом репозитории.

## Контракты, важные для Web

### Auth

Web получает Firebase ID Token после sign-in. API client прикладывает его только к защищённым запросам:

```http
Authorization: Bearer <firebase_id_token>
```

Backend сам определяет `uid`, email и display name из проверенного token. Web не передаёт `uid` в path/body как источник доверия.

### Question catalog

Минимальный response должен содержать metadata каталога и вопросы:

```json
{
  "content_version": "2026.08.001",
  "min_web_version": 1,
  "questions": [
    {
      "question_id": "stable-question-id",
      "language": "en",
      "category_type": "players",
      "question": "...",
      "answers": ["...", "...", "...", "..."],
      "right_answer": 1
    }
  ]
}
```

Имена полей являются направлением, а не финальным API schema. В production не нужно отправлять `right_answer` до ответа пользователя, если Web участвует в scored gameplay: иначе правильный ответ доступен в browser devtools. Для первой безопасной игры backend должен принимать выбранный answer и возвращать результат сам.

### Progress

Guest progress хранится локально до sign-in. После sign-in пользователь должен видеть понятный выбор: сохранить local progress или восстановить cloud progress. Автоматически уничтожать local progress нельзя.

Ответы и completion должны опираться на `questionId`, а не на позицию вопроса в массиве. Backend должен быть authoritative source для signed-in progress.

### Certificates

Certificate выдаётся backend-ом по правилам stage completion и не создаётся повторно на одном только основании запроса от Web. Web только показывает список и detail issued certificates.

## Версии и compatibility

`content_version` описывает набор вопросов и не равен версии сайта или Android app version.

Web client должен:

- запросить active version, совместимую с его возможностями;
- отображать controlled update/error state при несовместимой версии;
- сохранять последнюю успешно загруженную версию только как cache с явным сроком жизни;
- не считать устаревший cache canonical source после sign-in.

Перед реальным switch Android questions на backend нужен minimum supported version / force update policy. Web должен использовать тот же backend compatibility rule, но не заменяет Android force update UX.

## Security и deployment

- Firebase web config допустимо публиковать, но доступ должен быть защищён Firebase rules, разрешёнными origins и backend token verification.
- Firebase service account, MySQL credentials и `.env` принадлежат только backend repo/hosting private directory; их нельзя добавлять в этот web repo или public_html.
- API base URL выносится в один публичный config module/file, без секретов и без копирования по UI-файлам.
- API должен включать CORS allowlist для `footballquiz.club` и нужных preview origins, а не wildcard в production.
- Все защищённые API routes требуют ID Token; browser UI не является security boundary.
- Analytics events не должны содержать Firebase ID Token, email или user identifier.

## Порядок работ

### Phase W0 — сохранить стабильный landing

- Не менять статический сайт ради архитектуры.
- Держать legal pages, языки, Play CTA и cPanel deploy рабочими.
- Добавлять новые публичные страницы только при продуктовой необходимости.

### Phase W1 — backend contract alignment

- Утвердить first backend MVP endpoints и JSON error format.
- Утвердить CORS origins и API base URL.
- Синхронизировать `questionId`, stage/certificate identifiers и `content_version` с Android contracts.
- Подготовить browser auth adapter только после работающей server-side Firebase token verification.

### Phase W2 — narrow validation client

- Добавить отдельный, явно experimental маршрут/страницу, а не превращать главную сразу в SPA.
- Реализовать sign-in, catalog read, minimal quiz flow, progress read/write и certificates read.
- Проверить сценарии guest → sign-in → restore/upload choice.
- Сравнить результат с Android для одного Firebase UID.

### Phase W3 — продуктовое решение

После W2 решить отдельно: оставлять ли Web validation client, расширять его в web game или фокусироваться на iOS. Решение опирается на реальные данные и стабильность contracts, а не на необходимость «дописать» web-версию.

## Acceptance criteria первого web validation slice

- Статический лендинг и cPanel deployment не сломаны.
- Google sign-in даёт valid ID Token, который backend проверяет.
- Web не хранит и не отправляет доверенный `uid` самостоятельно.
- Каталог приходит с compatible `content_version`.
- Прогресс связан со стабильными `questionId`.
- Restore/upload требует понятного пользовательского выбора.
- Certificate нельзя повторно выпустить запросами из браузера.
- Ошибки auth/network/version показываются безопасно и понятно.
- В репозитории нет server credentials, Firebase service account или private backend config.

## Что делать сейчас

Сейчас не нужно превращать этот репозиторий в backend или game client. Следующая работа здесь — поддерживать landing, а после создания backend MVP добавить минимальный validation slice по согласованным API contracts.
