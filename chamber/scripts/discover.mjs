/**
 * discover.mjs
 * - Imports place data and builds cards dynamically
 * - Tracks visit history with localStorage
 * - Populates footer year and last-modified date
 */

import { places } from '../data/discover.mjs';

/* ============================================================
   VISIT MESSAGE — localStorage date tracking
   ============================================================ */
function handleVisitMessage() {
  const banner  = document.getElementById('visit-banner');
  const msgEl   = document.getElementById('visit-message');
  const closeBtn = document.getElementById('close-banner');

  const STORAGE_KEY = 'discoverLastVisit';
  const now         = Date.now(); // milliseconds
  const lastVisit   = localStorage.getItem(STORAGE_KEY);

  let message = '';

  if (!lastVisit) {
    // First visit ever
    message = 'Welcome! Let us know if you have any questions.';
  } else {
    const msSince  = now - Number(lastVisit);
    const daysSince = Math.floor(msSince / (1000 * 60 * 60 * 24));

    if (daysSince < 1) {
      message = 'Back so soon! Awesome!';
    } else if (daysSince === 1) {
      message = 'You last visited 1 day ago.';
    } else {
      message = `You last visited ${daysSince} days ago.`;
    }
  }

  // Store current visit date
  localStorage.setItem(STORAGE_KEY, String(now));

  if (msgEl) msgEl.textContent = message;

  // Close button
  if (closeBtn && banner) {
    closeBtn.addEventListener('click', () => {
      banner.classList.add('hidden');
    });
  }
}

/* ============================================================
   BUILD CARDS
   ============================================================ */
function buildCards() {
  const grid = document.getElementById('cards-grid');
  if (!grid) return;

  places.forEach((place, index) => {
    const areaName = `card${index + 1}`;

    const article = document.createElement('article');
    article.classList.add('card');
    article.dataset.area = areaName;

    article.innerHTML = `
      <figure>
        <img
          src="${place.image}"
          alt="${place.alt}"
          width="300"
          height="200"
          loading="${index < 2 ? 'eager' : 'lazy'}"
        />
      </figure>
      <div class="card-body">
        <h2>${place.name}</h2>
        <address>${place.address}</address>
        <p>${place.description}</p>
        <button class="learn-more" type="button" aria-label="Learn more about ${place.name}">
          Learn More
        </button>
      </div>
    `;

    grid.appendChild(article);
  });
}

/* ============================================================
   FOOTER DATES
   ============================================================ */
function updateFooterDates() {
  const yearEl = document.getElementById('copy-year');
  const modEl  = document.getElementById('last-modified');

  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (modEl)  modEl.textContent  = `Last modified: ${document.lastModified}`;
}

/* ============================================================
   NAV TOGGLE (mobile hamburger)
   ============================================================ */
function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const nav    = document.getElementById('main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  buildCards();
  handleVisitMessage();
  updateFooterDates();
  initNavToggle();
});
