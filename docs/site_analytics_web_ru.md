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
- UTM-параметры в first-party endpoint.

Запрос выполняется с `credentials: omit` и `referrerPolicy: no-referrer`. Клиентский и серверный allowlist одновременно отбрасывают неизвестные события и поля.

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

1. Deploy backend с `ANALYTICS_ENABLED=false`.
2. Сделать backup общей staging/production DB.
3. Применить additive migration `2026_11_11_site_analytics_events.sql`.
4. На staging задать `ANALYTICS_ENABLED=true` и `ANALYTICS_SITE_ENVIRONMENT=staging`.
5. Deploy web.
6. Проверить новые staging-события SQL-запросом.
7. Оставить production analytics выключенной до отдельного решения.

Admin dashboard и агрегированные отчёты относятся к следующему этапу после проверки реального потока событий.
