// utils.js — Shared utility functions

export function initLazyLoad() {
  const lazyImages = document.querySelectorAll('img.lazy');
  if (!lazyImages.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => observer.observe(img));
}