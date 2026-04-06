// ===========================
// ORDER OF KINGS — v3
// ===========================

// ── Custom cursor ──
const cursor = document.getElementById('cursor');
const follower = document.getElementById('cursorFollower');
let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
});

(function followCursor() {
  fx += (mx - fx) * 0.1;
  fy += (my - fy) * 0.1;
  follower.style.left = fx + 'px';
  follower.style.top = fy + 'px';
  requestAnimationFrame(followCursor);
})();

const hoverTargets = 'a, button, .trade-row, .outcome-item, .deliv, .cost-item, .vsl-card, .svp-card';
document.addEventListener('mouseover', e => {
  if (e.target.closest(hoverTargets)) {
    cursor.style.width = '14px';
    cursor.style.height = '14px';
    follower.style.width = '52px';
    follower.style.height = '52px';
    follower.style.borderColor = 'rgba(59,130,246,0.6)';
  } else {
    cursor.style.width = '7px';
    cursor.style.height = '7px';
    follower.style.width = '32px';
    follower.style.height = '32px';
    follower.style.borderColor = 'rgba(59,130,246,0.35)';
  }
});

// Hero lines reveal on load
setTimeout(() => {
  document.querySelectorAll('.reveal-line').forEach(el => el.classList.add('shown'));
  const vslEl = document.querySelector('.hero-vsl');
  if (vslEl) vslEl.classList.add('shown');
}, 100);

// ── Nav scroll ──
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── Intersection Observer ──
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('shown');
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-up').forEach(el => io.observe(el));

// Cost items stagger
const costItems = document.querySelectorAll('.cost-item');
if (costItems.length) {
  const costObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        costItems.forEach((item, i) => setTimeout(() => item.classList.add('shown'), i * 90));
        costObs.disconnect();
      }
    });
  }, { threshold: 0.2 });
  costObs.observe(costItems[0].parentElement);
}

// Outcome items stagger
const outItems = document.querySelectorAll('.outcome-item');
if (outItems.length) {
  const outObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        outItems.forEach((item, i) => setTimeout(() => item.classList.add('shown'), i * 100));
        outObs.disconnect();
      }
    });
  }, { threshold: 0.1 });
  outObs.observe(outItems[0].parentElement);
}

// Deliver items stagger
const delivItems = document.querySelectorAll('.deliv');
if (delivItems.length) {
  const delivObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        delivItems.forEach((item, i) => setTimeout(() => item.classList.add('shown'), i * 100));
        delivObs.disconnect();
      }
    });
  }, { threshold: 0.1 });
  delivObs.observe(delivItems[0].parentElement);
}

// ── Sticky video popup ──
const svp = document.getElementById('svp');
const svpCard = document.getElementById('svpCard');
const svpDismiss = document.getElementById('svpDismiss');
const heroEl = document.getElementById('hero');
let svpShown = false;
let svpDismissed = false;

// Show popup only when hero is out of view
const heroObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting && !svpShown && !svpDismissed) {
      svpShown = true;
      svp.classList.add('visible');
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => svp.classList.add('animated'));
      });
    } else if (entry.isIntersecting && svpShown) {
      // Hide again when hero comes back into view
      svp.classList.remove('animated');
      setTimeout(() => {
        if (!svp.classList.contains('animated')) {
          svp.classList.remove('visible');
          svpShown = false;
        }
      }, 400);
    }
  });
}, { threshold: 0.1 });

if (heroEl) heroObs.observe(heroEl);

// Clicking the card scrolls to top so user can watch the VSL
if (svpCard) {
  svpCard.addEventListener('click', (e) => {
    if (e.target.closest('#svpDismiss')) return;
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Hide popup
    svp.classList.remove('animated');
    setTimeout(() => {
      svp.classList.remove('visible');
      svpShown = false;
    }, 400);
  });
}

// Dismiss button
if (svpDismiss) {
  svpDismiss.addEventListener('click', (e) => {
    e.stopPropagation();
    svpDismissed = true;
    svp.classList.remove('animated');
    setTimeout(() => svp.classList.remove('visible'), 400);
  });
}

// ── CTA pulse ──
const applyBtn = document.getElementById('applyBtn');
if (applyBtn) {
  setInterval(() => {
    applyBtn.style.boxShadow = '0 0 0 1px rgba(59,130,246,0.5), 0 12px 40px rgba(37,99,235,0.45)';
    setTimeout(() => { applyBtn.style.boxShadow = ''; }, 800);
  }, 3200);
}

// ── Goshen parallax ──
window.addEventListener('scroll', () => {
  const word = document.querySelector('.goshen-word');
  if (!word) return;
  const rect = word.parentElement.getBoundingClientRect();
  const progress = -rect.top / window.innerHeight;
  word.style.transform = `translate(-50%, calc(-50% + ${progress * 30}px))`;
}, { passive: true });
