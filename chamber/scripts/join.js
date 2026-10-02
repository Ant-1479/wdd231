const stamp = document.querySelector('#timestamp');
if (stamp) stamp.value = new Date().toISOString();

// Footer dates (remove if your template already does this)
const yearEl = document.querySelector('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
const modEl = document.querySelector('#lastModified');
if (modEl) modEl.textContent = document.lastModified;

// Modals
document.querySelectorAll('[data-modal]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.modal).showModal();
  });
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelector('.close-btn').addEventListener('click', () => dialog.close());
  // Close when clicking the backdrop
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
});