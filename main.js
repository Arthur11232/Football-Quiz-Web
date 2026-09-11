// Multi-language Logic
let currentLang = localStorage.getItem('football_quiz_lang') || 'en';

function getUtmParams() {
  const searchParams = new URLSearchParams(window.location.search);
  return {
    utm_source: searchParams.get('utm_source') || '',
    utm_medium: searchParams.get('utm_medium') || '',
    utm_campaign: searchParams.get('utm_campaign') || ''
  };
}

function trackEvent(eventName, params = {}) {
  // Use Firebase Analytics if available
  if (typeof window.logFirebaseEvent === 'function') {
    window.logFirebaseEvent(eventName, {
      page_locale: currentLang,
      ...getUtmParams(),
      ...params
    });
  }
}

function setLanguage(lang, options = {}) {
  const previousLang = currentLang;
  currentLang = lang;
  localStorage.setItem('football_quiz_lang', lang);
  document.documentElement.lang = lang === 'am' ? 'hy' : lang;
  
  // Update translatable elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      if (key !== 'mock_q1' && key !== 'mock_q2' && key !== 'mock_q3') {
        el.textContent = translations[lang][key];
      }
    }
  });

  // Update switcher buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  updateMockContent();
  if (!options.initial && previousLang !== lang) {
    trackEvent('language_selected', {
      from_locale: previousLang,
      to_locale: lang
    });
  }
}

// Initial set
document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang, { initial: true });
  trackEvent('landing_view');
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.getAttribute('data-lang'));
    });
  });

  // Analytics for CTA clicks
  document.querySelectorAll('[data-cta-placement]').forEach(btn => {
    btn.addEventListener('click', () => {
      trackEvent('play_store_cta_clicked', {
        placement: btn.getAttribute('data-cta-placement') || 'unknown'
      });
    });
  });

  document.querySelectorAll('.button.secondary, .pill-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (btn.hasAttribute('data-cta-placement')) return;
      const label = e.target.getAttribute('data-i18n') || e.target.textContent;
      trackEvent('click_nav', { target: label });
    });
  });

  const qrCard = document.querySelector('.qr-card');
  if (qrCard) {
    const qrObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          trackEvent('qr_viewed', { placement: 'hero' });
          qrObserver.disconnect();
        }
      });
    }, { threshold: 0.6 });
    qrObserver.observe(qrCard);
  }

  document.querySelectorAll('[data-qr-placement]').forEach(link => {
    link.addEventListener('click', () => {
      trackEvent('qr_cta_clicked', {
        placement: link.getAttribute('data-qr-placement') || 'unknown'
      });
    });
  });

  const previewModal = document.getElementById('screenshot-preview');
  const previewImage = document.getElementById('preview-image');
  const previewCaption = document.getElementById('preview-caption');

  function closePreview() {
    if (!previewModal || !previewImage || !previewCaption) return;
    previewModal.hidden = true;
    previewImage.src = '';
    previewImage.alt = '';
    previewCaption.textContent = '';
    document.body.classList.remove('modal-open');
  }

  document.querySelectorAll('.preview-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      if (!previewModal || !previewImage || !previewCaption) return;
      const caption = trigger.closest('figure')?.querySelector('figcaption')?.textContent || '';
      previewImage.src = trigger.getAttribute('data-preview-src') || '';
      previewImage.alt = trigger.getAttribute('data-preview-alt') || caption;
      previewCaption.textContent = caption;
      previewModal.hidden = false;
      document.body.classList.add('modal-open');
      trackEvent('screenshot_preview_opened', { caption });
    });
  });

  document.querySelectorAll('[data-close-preview]').forEach(button => {
    button.addEventListener('click', closePreview);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePreview();
    }
  });
});

// Scroll Reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Interactive Phone Mockup
const mockData = [
  { 
    keys: { q: "mock_q1", a: ["Argentina", "Germany", "Brazil"] },
    correct: 1 
  },
  { 
    keys: { q: "mock_q2", a: ["AC Milan", "Real Madrid", "Liverpool"] },
    correct: 1 
  },
  { 
    keys: { q: "mock_q3", a: ["Messi", "Ronaldo", "Pelé"] },
    correct: 0 
  }
];

let currentIdx = 0;
const qEl = document.getElementById('mock-question');
const aEl = document.getElementById('mock-answers');

function updateMockContent() {
  if (!qEl || !aEl) return;
  const item = mockData[currentIdx];
  const langData = translations[currentLang];
  
  qEl.textContent = langData[item.keys.q];
  aEl.innerHTML = item.keys.a.map((ans, i) => {
    const style = i === item.correct ? 'style="border: 2px solid var(--gold); box-shadow: 0 0 20px hsla(35, 97%, 62%, 0.3)"' : '';
    return `<div ${style}>${ans}</div>`;
  }).join('');
}

function updateMock() {
  if (!qEl || !aEl) return;
  currentIdx = (currentIdx + 1) % mockData.length;
  qEl.style.opacity = 0;
  aEl.style.opacity = 0;

  setTimeout(() => {
    updateMockContent();
    qEl.style.opacity = 1;
    aEl.style.opacity = 1;
  }, 500);
}

if (qEl && aEl) {
  qEl.style.transition = 'opacity 0.5s ease';
  aEl.style.transition = 'opacity 0.5s ease';
  setInterval(updateMock, 4000);
}
