// main.js — Home page entry point
import { initNav } from './nav.js';
import { fetchFragrances, renderFeaturedCards, initModal } from './fragrances.js';
import { initLazyLoad } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    initNav();
  } catch (err) {
    console.error('Nav failed to initialize:', err);
  }

  try {
    initLazyLoad();
  } catch (err) {
    console.error('Lazy load failed to initialize:', err);
  }

  const featuredContainer = document.getElementById('featured-products');

  if (featuredContainer) {
    try {
      const data = await fetchFragrances();
      const fragrances = data.fragrances;

      renderFeaturedCards(fragrances, featuredContainer);
      initModal(fragrances);

    } catch (error) {
      featuredContainer.innerHTML = `
        <p style="color: rgba(245,239,230,0.4); padding: 40px; grid-column: 1/-1; text-align: center;">
          Unable to load fragrances. Please try again later.
        </p>
      `;
    }
  }

  // Newsletter form preference memory
  const newsletterForm = document.querySelector('.newsletter-form');
  newsletterForm?.addEventListener('submit', e => {
    e.preventDefault();
    const emailInput = newsletterForm.querySelector('input[type="email"]');
    if (emailInput?.value) {
      try {
        localStorage.setItem('akos-newsletter-email', emailInput.value);
      } catch { /* silent */ }
      emailInput.value = '';
      const btn = newsletterForm.querySelector('button');
      if (btn) {
        const original = btn.textContent;
        btn.textContent = 'Thank you';
        setTimeout(() => { btn.textContent = original; }, 3000);
      }
    }
  });
});