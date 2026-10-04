import { places } from "../data/discover.mjs";

// ---- Cards ----
const grid = document.querySelector("#discover-grid");
grid.innerHTML = places.map(p => `
  <article class="card">
    <h2>${p.name}</h2>
    <figure><img src="${p.image}" alt="${p.name}" width="300" height="200" loading="lazy"></figure>
    <address>${p.address}</address>
    <p>${p.description}</p>
    <button type="button">Learn more</button>
  </article>`).join("");

// ---- Last visit message ----
const KEY = "discover-last-visit";
const DAY = 1000 * 60 * 60 * 24;
const box = document.querySelector("#visit-message");
const text = document.querySelector("#visit-text");
let message;

try {
  const last = Number(localStorage.getItem(KEY));
  const now = Date.now();
  if (!last) {
    message = "Welcome! Let us know if you have any questions.";
  } else {
    const days = Math.floor((now - last) / DAY);
    if (days < 1) message = "Back so soon! Awesome!";
    else message = `You last visited ${days} ${days === 1 ? "day" : "days"} ago.`;
  }
  localStorage.setItem(KEY, String(now));
} catch {
  message = "Welcome! Let us know if you have any questions.";
}

text.textContent = message;
box.hidden = false;
document.querySelector("#visit-close").addEventListener("click", () => (box.hidden = true));