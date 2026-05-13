// Multi-language Logic
let currentLang = localStorage.getItem('football_quiz_lang') || 'en';

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('football_quiz_lang', lang);
  
  // Update translatable elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) {
      // If it's the mock question, we handle it specially in updateMock
      if (key !== 'mock_q1' && key !== 'mock_q2' && key !== 'mock_q3') {
        el.textContent = translations[lang][key];
      }
    }
  });

  // Update switcher buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  // Update mock immediately if it's visible
  updateMockContent();
}

// Initial set
document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLanguage(btn.getAttribute('data-lang'));
    });
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
    keys: { q: "mock_q1", a: ["Argentina", "Germany", "Brazil"] }, // Answers are names, usually don't need translation or are special
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
