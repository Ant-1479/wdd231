// collection.js — Collection page entry point
import { initNav } from './nav.js';
import { fetchFragrances, renderAllProducts, getUserPrefs, initModal } from './fragrances.js';
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

  const container = document.getElementById('all-products');
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (!container) return;

  try {
    const data = await fetchFragrances();
    const fragrances = data.fragrances;

    // Restore last filter from local storage
    const prefs = getUserPrefs();
    let activeFilter = prefs.filter || 'all';

    // Sync active filter button
    filterBtns.forEach(btn => {
      if (btn.dataset.filter === activeFilter) btn.classList.add('active');
    });

    renderAllProducts(fragrances, container, activeFilter);
    initModal(fragrances);

    // Filter button clicks
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        renderAllProducts(fragrances, container, activeFilter);
      });
    });

  } catch (error) {
    container.innerHTML = `
      <p style="color: rgba(245,239,230,0.4); padding: 40px; grid-column: 1/-1; text-align: center;">
        Unable to load fragrances. Please try again later.
      </p>
    `;
  }
});