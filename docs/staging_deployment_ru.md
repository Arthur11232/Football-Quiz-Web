# Staging Football Quiz Web

Дата подготовки и создания поддомена: 2026-10-21.

## Цель

Изолированная pre-live сборка для проверки landing и News:

- URL: `https://staging.footballquiz.club`;
- подтверждённый в cPanel docroot: `/home/ixvldavx/public_html/staging`;
- News API: `https://api-staging.footballquiz.club`;
- отдельный cPanel Git checkout staging-ветки.

Поддомен создан в cPanel. DNS `A` указывает на `2.56.204.6`, HTTPS отвечает; пустой docroot до deployment закономерно возвращает `403`. Repository Path ещё нужно определить при создании отдельного staging Git checkout.

Backend staging env уже создан отдельно. Из-за лимита MySQL `1/1` API staging временно использует production database; разрешены только добавочные `news_*` migrations, без изменений questions/scoring/legal. Сам deployment и migrations ещё не выполнялись.

## Что уже предусмотрено

- localhost продолжает использовать `http://127.0.0.1:8080`;
- host `staging.footballquiz.club` использует только `https://api-staging.footballquiz.club`;
- остальные публичные hosts используют production API;
- staging `.htaccess` добавляет `X-Robots-Tag: noindex, nofollow, noarchive`;
- активная production `.cpanel.yml` не изменена;
- `.cpanel.staging.yml.example` не исполняется cPanel автоматически.

## Подготовка в cPanel

1. Создать отдельный Git checkout staging-ветки.
2. Рекомендуется включить cPanel Directory Privacy до завершения pre-live проверки.
3. Только в staging-only ветке скопировать `.cpanel.staging.yml.example` в `.cpanel.yml`; `DEPLOYPATH` уже совпадает с подтверждённым docroot.
4. Убедиться, что staging API уже развёрнут и разрешает Origin `https://staging.footballquiz.club`.

## Smoke-check после staging deploy

```bash
curl -I https://staging.footballquiz.club/
curl -I https://staging.footballquiz.club/en/news/
curl -I https://staging.footballquiz.club/en/news/top-5/premier-league/
curl -I https://staging.footballquiz.club/ru/news/top-5/serie-a/
curl -I https://staging.footballquiz.club/hy/news/top-5/ligue-1/
```

После HTTP-проверок вручную проверить:

- landing и News на desktop/mobile;
- EN/RU/HY;
- All, Top 5 и пять лиг;
- карточки и страницы новых материалов;
- ссылки на официальные источники;
- отсутствие запросов к production API;
- `X-Robots-Tag` на staging responses.

Production deploy в этот процесс не входит.
