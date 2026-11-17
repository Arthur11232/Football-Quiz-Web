# First-party аналитика landing и News

Дата: `2026-11-11`.

## Назначение

Web отправляет обезличенные события landing и публичного News в backend endpoint:

```text
POST /v1/analytics/events
```

API выбирается по hostname:

- `127.0.0.1` / `localhost` → `http://127.0.0.1:8080`;
- `staging.footballquiz.club` → `https://api-staging.footballquiz.club`;
- production → `https://api.footballquiz.club`.

Firebase Analytics пока остаётся на landing параллельно для контрольного сравнения. После накопления и проверки first-party данных его можно отключить отдельным решением.

## Privacy boundary

Клиент не отправляет:

- Firebase UID, email или ID Token;
- cookie, session ID или fingerprint;
- IP и user-agent;
- полный referrer URL;
- произвольный текст страницы;
- произвольные UTM-значения: допускаются только нормализованные lowercase campaign keys длиной до 64 символов.

Запрос выполняется с `credentials: omit` и `referrerPolicy: no-referrer`. Клиентский и серверный allowlist одновременно отбрасывают неизвестные события и поля.

## Marketing attribution

При наличии в URL клиент принимает `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, проверяет slug-like формат и сохраняет только эти значения в `sessionStorage` текущей вкладки. Это позволяет связать переход из соцсети, открытие News и клик в Google Play без cookie или пользовательского идентификатора. Невалидные и свободные значения игнорируются.

## Landing events

- `landing_view`;
- `language_selected`;
- `landing_news_clicked`;
- `play_store_cta_clicked`;
- `qr_viewed`;
- `qr_cta_clicked`;
- `screenshot_preview_opened`;
- `social_link_clicked`;
- `legal_link_clicked`.

## News events

- `news_section_view`;
- `news_article_open`;
- `news_category_filter_select`;
- `news_competition_filter_select`;
- `news_club_filter_select`;
- `news_load_more`;
- `news_source_click`;
- `news_play_store_click`.

## Rollout order

Текущее состояние: first-party analytics и агрегированный admin dashboard включены на staging и production.

Для marketing attribution порядок rollout следующий:

1. Сделать backup общей staging/production DB.
2. Один раз применить additive migration `2026_11_17_site_analytics_utm.sql`.
3. Deploy backend-код, который записывает UTM-поля.
4. Deploy web.
5. Открыть тестовую ссылку с безопасными UTM-параметрами, пройти Landing → News → статья и проверить агрегаты в admin dashboard.
