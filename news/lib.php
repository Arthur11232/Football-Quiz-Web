<?php

declare(strict_types=1);

function news_api_base(): string
{
    $configured = getenv('FOOTBALL_QUIZ_NEWS_API');
    if (is_string($configured) && trim($configured) !== '') {
        return rtrim(trim($configured), '/');
    }

    if (news_is_local()) {
        return 'http://127.0.0.1:8080';
    }

    if (news_is_staging()) {
        return 'https://api-staging.footballquiz.club';
    }

    return 'https://api.footballquiz.club';
}

function news_is_local(): bool
{
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));

    return str_starts_with($host, '127.0.0.1') || str_starts_with($host, 'localhost');
}

function news_is_staging(): bool
{
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    $host = explode(':', $host, 2)[0];

    return $host === 'staging.footballquiz.club';
}

function news_locale(?string $value): string
{
    $value = strtolower(trim((string) $value));
    if ($value === 'am') {
        $value = 'hy';
    }

    return in_array($value, ['en', 'ru', 'hy'], true) ? $value : 'en';
}

function news_copy(string $locale): array
{
    $copy = [
        'en' => [
            'official' => 'Official site', 'news' => 'News', 'home' => 'Home',
            'title' => 'Football news', 'intro' => 'Short, reviewed updates with visible sources — built for football fans.',
            'all' => 'All clubs', 'all_news' => 'All news', 'load_more' => 'Show more', 'empty' => 'No published articles were found for this selection.',
            'unavailable' => 'News is temporarily unavailable. The Football Quiz game and landing page continue to work normally.',
            'read' => 'Read article', 'source' => 'Sources', 'back' => 'Back to all news', 'published' => 'Published',
            'play' => 'Play Football Quiz', 'support' => 'Support', 'filter' => 'Filter by club', 'category_filter' => 'News sections',
            'competition_filter' => 'Top 5 leagues', 'all_competitions' => 'All Top 5',
        ],
        'ru' => [
            'official' => 'Официальный сайт', 'news' => 'Новости', 'home' => 'Главная',
            'title' => 'Футбольные новости', 'intro' => 'Короткие проверенные материалы с открытыми источниками — для футбольных болельщиков.',
            'all' => 'Все клубы', 'all_news' => 'Все новости', 'load_more' => 'Показать ещё', 'empty' => 'Для выбранного фильтра опубликованных материалов пока нет.',
            'unavailable' => 'Новости временно недоступны. Игра Football Quiz и основная страница продолжают работать нормально.',
            'read' => 'Читать материал', 'source' => 'Источники', 'back' => 'Ко всем новостям', 'published' => 'Опубликовано',
            'play' => 'Играть в Football Quiz', 'support' => 'Поддержка', 'filter' => 'Фильтр по клубу', 'category_filter' => 'Разделы новостей',
            'competition_filter' => 'Лиги Топ-5', 'all_competitions' => 'Все лиги Топ-5',
        ],
        'hy' => [
            'official' => 'Պաշտոնական կայք', 'news' => 'Նորություններ', 'home' => 'Գլխավոր',
            'title' => 'Ֆուտբոլային նորություններ', 'intro' => 'Կարճ և ստուգված նյութեր՝ տեսանելի աղբյուրներով, ֆուտբոլասերների համար։',
            'all' => 'Բոլոր ակումբները', 'all_news' => 'Բոլոր նորությունները', 'load_more' => 'Ցույց տալ ավելին', 'empty' => 'Ընտրված զտիչի համար հրապարակված նյութեր դեռ չկան։',
            'unavailable' => 'Նորությունները ժամանակավորապես հասանելի չեն։ Football Quiz խաղն ու գլխավոր էջը շարունակում են աշխատել։',
            'read' => 'Կարդալ նյութը', 'source' => 'Աղբյուրներ', 'back' => 'Բոլոր նորություններին', 'published' => 'Հրապարակվել է',
            'play' => 'Խաղալ Football Quiz', 'support' => 'Աջակցություն', 'filter' => 'Զտել ըստ ակումբի', 'category_filter' => 'Նորությունների բաժիններ',
            'competition_filter' => 'Թոփ 5 լիգաներ', 'all_competitions' => 'Բոլոր Թոփ 5 լիգաները',
        ],
    ];

    return $copy[$locale];
}

function news_categories(string $locale): array
{
    $labels = [
        'en' => ['top-5' => 'Top 5 leagues', 'uefa' => 'UEFA', 'world-cup' => 'World Cup'],
        'ru' => ['top-5' => 'Топ-5 лиг', 'uefa' => 'UEFA', 'world-cup' => 'Чемпионат мира'],
        'hy' => ['top-5' => 'Թոփ 5 լիգաներ', 'uefa' => 'UEFA', 'world-cup' => 'Աշխարհի առաջնություն'],
    ];

    return $labels[$locale] ?? $labels['en'];
}

function news_category(?string $value): ?string
{
    $value = strtolower(trim((string) $value));

    return array_key_exists($value, news_categories('en')) ? $value : null;
}

function news_category_label(string $locale, string $category): string
{
    return news_categories($locale)[$category] ?? $category;
}

function news_competitions(string $locale): array
{
    $labels = [
        'en' => [
            'premier-league' => 'Premier League',
            'la-liga' => 'La Liga',
            'serie-a' => 'Serie A',
            'bundesliga' => 'Bundesliga',
            'ligue-1' => 'Ligue 1',
        ],
        'ru' => [
            'premier-league' => 'Премьер-лига',
            'la-liga' => 'Ла Лига',
            'serie-a' => 'Серия А',
            'bundesliga' => 'Бундеслига',
            'ligue-1' => 'Лига 1',
        ],
        'hy' => [
            'premier-league' => 'Պրեմիեր լիգա',
            'la-liga' => 'Լա Լիգա',
            'serie-a' => 'Սերիա A',
            'bundesliga' => 'Բունդեսլիգա',
            'ligue-1' => 'Լիգա 1',
        ],
    ];

    return $labels[$locale] ?? $labels['en'];
}

function news_competition(?string $value, ?string $category): ?string
{
    $value = strtolower(trim((string) $value));

    return $category === 'top-5' && array_key_exists($value, news_competitions('en')) ? $value : null;
}

function news_competition_label(string $locale, string $competition): string
{
    return news_competitions($locale)[$competition] ?? $competition;
}

function news_category_page_title(
    string $locale,
    ?string $category,
    string $fallback,
    ?string $competition = null
): string
{
    if ($competition !== null) {
        $competitionLabel = news_competition_label($locale, $competition);

        return match ($locale) {
            'ru' => 'Новости · ' . $competitionLabel,
            'hy' => 'Նորություններ · ' . $competitionLabel,
            default => $competitionLabel . ' news',
        };
    }
    if ($category === null) {
        return $fallback;
    }
    $label = news_category_label($locale, $category);

    return match ($locale) {
        'ru' => 'Новости · ' . $label,
        'hy' => 'Նորություններ · ' . $label,
        default => $label . ' news',
    };
}

function news_api_get(string $path, array $query = []): array
{
    $url = news_api_base() . $path;
    if ($query !== []) {
        $url .= '?' . http_build_query($query, '', '&', PHP_QUERY_RFC3986);
    }

    $curlResult = news_api_curl_get($url);
    if ($curlResult !== null) {
        [$raw, $status] = $curlResult;
    } else {
        [$raw, $status] = news_api_stream_get($url);
    }

    if (!is_string($raw) || $raw === '') {
        return ['ok' => false, 'status' => $status, 'data' => null];
    }
    try {
        $payload = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        return ['ok' => false, 'status' => $status, 'data' => null];
    }

    return [
        'ok' => $status >= 200 && $status < 300 && ($payload['success'] ?? false) === true,
        'status' => $status,
        'data' => $payload['data'] ?? null,
    ];
}

/** @return array{0: string|false, 1: int}|null */
function news_api_curl_get(string $url): ?array
{
    if (!function_exists('curl_init')) {
        return null;
    }

    $curl = curl_init($url);
    if ($curl === false) {
        return null;
    }

    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_TIMEOUT => 3,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_USERAGENT => 'FootballQuizWeb/0.1',
    ];
    $resolve = news_api_resolve_override();
    if ($resolve !== null) {
        $options[CURLOPT_RESOLVE] = [$resolve];
    }

    curl_setopt_array($curl, $options);
    $raw = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);

    return [$raw, $status];
}

/** @return array{0: string|false, 1: int} */
function news_api_stream_get(string $url): array
{
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 3,
            'ignore_errors' => true,
            'header' => "Accept: application/json\r\nUser-Agent: FootballQuizWeb/0.1\r\n",
        ],
    ]);
    $raw = @file_get_contents($url, false, $context);
    $status = 0;
    foreach (($http_response_header ?? []) as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $header, $matches)) {
            $status = (int) $matches[1];
        }
    }

    return [$raw, $status];
}

function news_api_resolve_override(): ?string
{
    $configured = $_SERVER['FOOTBALL_QUIZ_NEWS_API_RESOLVE'] ?? getenv('FOOTBALL_QUIZ_NEWS_API_RESOLVE');
    if (!is_string($configured)) {
        return null;
    }

    $configured = trim($configured);

    return preg_match('/^[a-z0-9.-]+:\d{1,5}:(?:\d{1,3}\.){3}\d{1,3}$/i', $configured) === 1
        ? $configured
        : null;
}

function news_e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function news_url(string $locale, string $suffix = ''): string
{
    if (news_is_local()) {
        $suffix = trim($suffix, '/');
        if ($suffix === '') {
            return '/news/index.php?' . http_build_query(['locale' => $locale]);
        }
        if (str_starts_with($suffix, 'club/')) {
            return '/news/index.php?' . http_build_query([
                'locale' => $locale,
                'club' => substr($suffix, strlen('club/')),
            ]);
        }

        return '/news/article.php?' . http_build_query(['locale' => $locale, 'slug' => $suffix]);
    }

    return '/' . $locale . '/news/' . ltrim($suffix, '/');
}

function news_list_url(
    string $locale,
    ?string $category = null,
    ?string $competition = null,
    ?string $club = null
): string
{
    $category = news_category($category);
    $competition = news_competition($competition, $category);
    $club = is_string($club) && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $club) ? $club : null;

    if (news_is_local()) {
        $query = ['locale' => $locale];
        if ($category !== null) {
            $query['category'] = $category;
        }
        if ($competition !== null) {
            $query['competition'] = $competition;
        }
        if ($club !== null) {
            $query['club'] = $club;
        }

        return '/news/index.php?' . http_build_query($query);
    }

    $path = '/' . $locale . '/news/';
    if ($category !== null) {
        $path .= $category . '/';
    }
    if ($competition !== null) {
        $path .= $competition . '/';
    }
    if ($club !== null) {
        $path .= 'club/' . $club . '/';
    }

    return $path;
}

function news_public_list_url(
    string $locale,
    ?string $category = null,
    ?string $competition = null,
    ?string $club = null
): string
{
    return 'https://footballquiz.club' . news_list_url_for_production(
        $locale,
        $category,
        $competition,
        $club
    );
}

function news_list_url_for_production(
    string $locale,
    ?string $category = null,
    ?string $competition = null,
    ?string $club = null
): string
{
    $category = news_category($category);
    $competition = news_competition($competition, $category);
    $club = is_string($club) && preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $club) ? $club : null;
    $path = '/' . $locale . '/news/';
    if ($category !== null) {
        $path .= $category . '/';
    }
    if ($competition !== null) {
        $path .= $competition . '/';
    }
    if ($club !== null) {
        $path .= 'club/' . $club . '/';
    }

    return $path;
}

function news_public_url(string $locale, string $suffix = ''): string
{
    return 'https://footballquiz.club/' . $locale . '/news/' . ltrim($suffix, '/');
}

function news_date(?string $value, string $locale): string
{
    if ($value === null || $value === '') {
        return '';
    }
    try {
        $date = new DateTimeImmutable($value);
    } catch (Exception) {
        return '';
    }
    $formats = ['en' => 'M j, Y', 'ru' => 'd.m.Y', 'hy' => 'd.m.Y'];

    return $date->format($formats[$locale]);
}

function news_markdown(string $markdown): string
{
    $paragraphs = preg_split('/\R{2,}/u', trim($markdown)) ?: [];
    $html = [];
    foreach ($paragraphs as $paragraph) {
        $escaped = news_e(trim($paragraph));
        $escaped = preg_replace('/\*\*(.+?)\*\*/u', '<strong>$1</strong>', $escaped) ?? $escaped;
        $html[] = '<p>' . nl2br($escaped, false) . '</p>';
    }

    return implode("\n", $html);
}
