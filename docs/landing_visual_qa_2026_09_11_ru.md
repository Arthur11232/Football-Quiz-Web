# Football Quiz Landing — visual QA handoff

**Дата:** 11.09.2026  
**Адресат:** web-разработка Football Quiz  
**Проверяемая сборка:** `http://127.0.0.1:5173/`  
**Scope:** визуальный и conversion QA landing после P0 conversion pass. Это не задача на Android, backend или Play Console.

---

## Итог

Текущая локальная сборка уже выглядит готовой для первого трафика: сильный hero, ясный Google Play CTA, реальные Android screenshots, certificates, support email и legal links присутствуют.

Проверены следующие состояния:

| Viewport | Результат |
|---|---|
| Широкий desktop | Hero, primary CTA и app screenshot видны сразу; визуальная hierarchy корректна. |
| Mobile `390×844` | Hero читабелен, CTA `Install free on Google Play` видна в первом экране. |
| Mobile `390×667` | После compact header fix hero читабелен, CTA `Install free on Google Play` полностью видна без прокрутки, horizontal overflow нет. |

Ниже — задачи visual QA перед следующим активным маркетинговым запуском.

---

## WEB-VISUAL-01 — Сжать mobile header, чтобы CTA была видна на коротких экранах

**Приоритет:** P1  
**Статус:** выполнено локально после QA.

**Проблема:** при viewport `390×667` header занимает примерно `264px`: brand, три anchor links, отдельный Install button и language switcher. В результате первая видимая часть hero заканчивается до Google Play CTA.

### Требование

На мобильной ширине primary CTA `Install free on Google Play` должна быть полностью видна без вертикальной прокрутки на `390×667`.

### Допустимые варианты реализации

- свернуть `How it works`, `Certificates`, `Features` в hamburger / compact menu;
- оставить в шапке brand + `Install free` + language switcher, а anchor navigation перенести в раскрывающийся блок;
- уменьшить вертикальные отступы и перестроить navigation, если при этом не страдают tap targets и читаемость.

### Не делать

- не удалять Google Play CTA;
- не убирать language switcher без отдельного продуктового решения;
- не заменять CTA маленькой иконкой без текстовой подписи;
- не делать header настолько плотным, чтобы кнопки было трудно нажать.

### Acceptance criteria

- [x] При `390×667` полностью видна кнопка `Install free on Google Play` в hero без scroll.
- [x] При `390×844` hero не получил визуальную регрессию.
- [x] При desktop navigation остаётся полноценной и не ломается.
- [x] Нет horizontal overflow: `document.documentElement.scrollWidth === document.documentElement.clientWidth` на mobile.
- [ ] Все nav/CTA controls доступны с клавиатуры и имеют понятные accessible labels.

Проверка после правки:

```text
390×667: hero CTA fully visible, no horizontal overflow
390×844: hero CTA fully visible, no horizontal overflow
```

---

## WEB-VISUAL-02 — Заменить hero gameplay screenshot на более ясный английский вопрос

**Приоритет:** P1  
**Статус:** выполнено локально после QA.

**Проблема:** текущий реальный screenshot в hero доказывает, что приложение существует, но видимый вопрос сформулирован тяжело для первого рекламного контакта:

> Which club in the most matches in a row scored goals in the championship of Spain?

Даже если вопрос фактически корректен в каталоге, он воспринимается как неестественный английский и снижает качество первого впечатления.

### Требование

Для hero использовать реальный screenshot из актуального Android UI, но с коротким, однозначным и естественным английским вопросом. Он должен быть понятен за 1–2 секунды человеку, пришедшему из Reels, TikTok или рекламы.

### Рекомендации к новому screenshot

- тема, понятная широкой футбольной аудитории: UEFA Champions League, World Cup, Ballon d'Or, легендарный игрок или клуб;
- вопрос не должен быть двусмысленным, зависеть от неизвестного контекста или содержать длинную статистическую конструкцию;
- варианты ответа должны быть визуально читаемы;
- screenshot должен соответствовать актуальному Android `2.2.0` UI;
- перед экспортом вопрос нужно проверить по `docs/question_review_rules.md` Android-репозитория.

### Acceptance criteria

- [x] Hero использует настоящий Android screenshot, а не вымышленный mockup.
- [x] Текст вопроса и варианты ответа читаются на desktop и mobile preview.
- [x] Английская формулировка естественна и не содержит грамматических ошибок.
- [x] Новый asset добавлен в `.cpanel.yml`, если имя/путь runtime-asset изменился.
- [x] `alt` text соответствует содержимому изображения.

Финальный hero screenshot:

```text
assets/screenshots/football-quiz-question-screen.jpg
```

Видимый вопрос:

```text
Which club won the German Cup the most?
```

---

## Что уже прошло QA и не нужно переделывать без причины

- Hero copy: `FOOTBALL QUIZ · 6 LANGUAGES · PLAY FREE` и `Think you know football? Prove it.`
- Primary CTA: `Install free on Google Play`.
- Proof points: `689 questions · 6 languages · Guest mode · Cloud save`.
- Certificates section без устаревшего version badge `2.1.0`.
- Real product proof block: question, category и certificate screenshots.
- Gameplay video asset сохранён, но embedded video player убран из product proof block после visual QA. Текущее решение: использовать screenshot preview/lightbox; отдельную video-секцию делать позже только при хорошем дизайне.
- Footer contact: `support@footballquiz.club`.
- Legal pages и Google Play / QR install flow.
- SEO/social preview assets и metadata, добавленные в P0 pass.

Не превращать landing в SPA, не добавлять web-gameplay, browser auth или backend code в рамках этих визуальных задач.

---

## Регрессионный чеклист перед cPanel deployment

- [ ] Проверить `index.html`, `style.css`, `main.js`, `translations.js` локально.
- [ ] Проверить `390×667`, `390×844`, `768px` и desktop `≥1440px`.
- [ ] Проверить EN/RU/AM switcher; ES/DE/IT landing localization не начинать без отдельного решения владельца.
- [ ] Проверить все Google Play CTA и QR code.
- [ ] Проверить Privacy, Terms, Data Deletion и `mailto:support@footballquiz.club`.
- [ ] Проверить screenshots lightbox. Gameplay video playback больше не является обязательным для текущего landing block, пока embedded video player скрыт.
- [ ] Проверить, что новые runtime-assets добавлены в `.cpanel.yml`.
- [ ] Не коммитить secrets, `.DS_Store`, local IDE state или временные файлы.
- [ ] Не делать commit/deploy без явного подтверждения владельца продукта.

---

## Связанные документы

- `PROJECT_CONTEXT.md` — web repository rules и текущий landing context.
- `/Users/Arthu/Documents/GitHub/Footbal-Quiz/docs/web_android_chat_sync_ru.md` — Android/web product sync.
- `/Users/Arthu/Documents/GitHub/Footbal-Quiz/docs/marketing/landing_page_growth_handoff_ru.md` — полный marketing brief и backlog.
