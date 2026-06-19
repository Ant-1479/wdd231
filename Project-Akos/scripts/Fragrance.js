// fragrances.js — Data fetching and display module

import { createBottleSVG } from './bottle-svg.js';

// ── Local Storage Keys ──
const PREFS_KEY = 'akos-user-prefs';
const WISHLIST_KEY = 'akos-wishlist';

export function getUserPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) || { filter: 'all', lastViewed: null };
  } catch {
    return { filter: 'all', lastViewed: null };
  }
}

export function saveUserPrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('Local storage unavailable:', e);
  }
}

export function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  } catch {
    return [];
  }
}

export function toggleWishlist(id) {
  const list = getWishlist();
  const idx = list.indexOf(id);
  if (idx === -1) {
    list.push(id);
  } else {
    list.splice(idx, 1);
  }
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Local storage unavailable:', e);
  }
  return list;
}

// ── Fetch Fragrances ──
export async function fetchFragrances() {
  try {
    const response = await fetch('data/fragrances.json');
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch fragrance data:', error);
    throw error;
  }
}

// ── Render product card ──
export function renderProductCard(fragrance, wishlist = []) {
  const isWishlisted = wishlist.includes(fragrance.id);
  const svgArt = createBottleSVG(fragrance.collection, 'card');

  return `
    <article class="product-card" data-id="${fragrance.id}" data-collection="${fragrance.collection}">
      <div class="product-card-visual">
        ${svgArt}
        ${!fragrance.inStock ? `<span class="out-of-stock">Sold Out</span>` : ''}
      </div>
      <div class="product-card-body">
        <span class="label">${fragrance.collection} · ${fragrance.concentration}</span>
        <h3>${fragrance.name}</h3>
        <p>${fragrance.description}</p>
        <div class="product-card-footer">
          <span class="product-price">$${fragrance.price}</span>
          <button class="product-info-btn" data-id="${fragrance.id}" aria-label="View details for ${fragrance.name}">
            Details →
          </button>
        </div>
      </div>
    </article>
  `;
}

// ── Render featured cards (home page — show only featured) ──
export function renderFeaturedCards(fragrances, container) {
  const wishlist = getWishlist();
  const featured = fragrances.filter(f => f.featured);
  container.innerHTML = featured.map(f => renderProductCard(f, wishlist)).join('');
}

// ── Render all products with filter ──
export function renderAllProducts(fragrances, container, filter = 'all') {
  const wishlist = getWishlist();
  const prefs = getUserPrefs();

  // Array method: filter by collection
  const filtered = filter === 'all'
    ? fragrances
    : fragrances.filter(f => f.collection.toLowerCase() === filter.toLowerCase());

  // Array method: sort by rating desc
  const sorted = [...filtered].sort((a, b) => b.rating - a.rating);

  // Update count
  const countEl = document.querySelector('.products-count');
  if (countEl) countEl.textContent = `${sorted.length} fragrance${sorted.length !== 1 ? 's' : ''}`;

  container.innerHTML = sorted.map(f => renderProductCard(f, wishlist)).join('');

  // Save preference
  saveUserPrefs({ ...prefs, filter });
}

// ── Modal ──
export function initModal(fragrances) {
  const overlay = document.getElementById('fragrance-modal');
  if (!overlay) return;

  const closeBtn = overlay.querySelector('.modal-close');

  // Close modal
  const closeModal = () => {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    overlay.querySelector('.modal').removeAttribute('aria-busy');
  };

  closeBtn?.addEventListener('click', closeModal);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal();
  });

  // Open modal on card click
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-id]');
    if (!btn) return;

    const id = parseInt(btn.dataset.id, 10);
    const fragrance = fragrances.find(f => f.id === id);
    if (!fragrance) return;

    populateModal(fragrance, overlay);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Save last viewed to local storage
    const prefs = getUserPrefs();
    saveUserPrefs({ ...prefs, lastViewed: id });

    // Focus management
    setTimeout(() => closeBtn?.focus(), 100);
  });
}

function populateModal(f, overlay) {
  const svgArt = createBottleSVG(f.collection, 'modal');
  overlay.querySelector('.modal-visual').innerHTML = svgArt;
  overlay.querySelector('.modal-collection').textContent = `${f.collection} Collection`;
  overlay.querySelector('.modal-name').textContent = f.name;
  overlay.querySelector('.modal-meta').innerHTML = `
    <span>${f.concentration}</span>
    <span>·</span>
    <span>${f.size}</span>
    <span>·</span>
    <span>${f.season}</span>
  `;
  overlay.querySelector('.modal-desc').textContent = f.description;
  overlay.querySelector('.modal-notes').innerHTML = `
    <div class="note-group">
      <label>Top notes</label>
      <p>${f.topNotes}</p>
    </div>
    <div class="note-group">
      <label>Heart notes</label>
      <p>${f.heartNotes}</p>
    </div>
    <div class="note-group">
      <label>Base notes</label>
      <p>${f.baseNotes}</p>
    </div>
  `;
  overlay.querySelector('.modal-details').innerHTML = `
    <div class="detail-item">
      <label>Longevity</label>
      <p>${f.longevity}</p>
    </div>
    <div class="detail-item">
      <label>Sillage</label>
      <p>${f.sillage}</p>
    </div>
    <div class="detail-item">
      <label>Gender</label>
      <p>${f.gender}</p>
    </div>
    <div class="detail-item">
      <label>Rating</label>
      <p>${f.rating} / 5.0</p>
    </div>
  `;
  overlay.querySelector('.modal-price').textContent = `$${f.price}`;

  const wishBtn = overlay.querySelector('.modal-wishlist-btn');
  const wishlist = getWishlist();
  if (wishBtn) {
    wishBtn.textContent = wishlist.includes(f.id) ? 'Wishlisted ♥' : 'Add to Wishlist';
    wishBtn.onclick = () => {
      const updated = toggleWishlist(f.id);
      wishBtn.textContent = updated.includes(f.id) ? 'Wishlisted ♥' : 'Add to Wishlist';
    };
  }
}