/**
 * app.js
 * The whole Akos Luxe script in one regular (non-module) file, so the site
 * works when you double-click an HTML file as well as from a web server.
 * Sections below: state, storage, utils, search, cart, api, products, form,
 * ui, main. Products come from data/products.js.
 */
(function () {
"use strict";

/* ===================== state.js ===================== */
/**
 * state.js
 * A tiny shared object so modules can read the same exchange rate and
 * display preferences without importing each other in a circle.
 */
const appState = {
  /** USD per 1 GHS, or null when the rate is not available. */
  usdPerCedi: null,
  /** Every product loaded for the current page. */
  products: [],
};

/* ===================== storage.js ===================== */
/**
 * storage.js
 * Safe wrappers around localStorage. Private browsing modes and full
 * storage can throw, so every call is wrapped and falls back quietly.
 */
const PREFIX = "akosLuxe:";

function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* nothing to do */
  }
}

/* ===================== utils.js ===================== */
/**
 * utils.js
 * Small reusable helpers: money formatting, DOM creation, validation.
 */

const cediFormat = new Intl.NumberFormat("en-GH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const usdFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCedi(amount) {
  return `GH₵${cediFormat.format(amount)}`;
}

function convertToUsd(cedis) {
  if (!appState.usdPerCedi) return null;
  return cedis * appState.usdPerCedi;
}

function formatUsd(amount) {
  return usdFormat.format(amount);
}

/** "GH₵150.00" plus, when switched on and available, "≈ $13.50". */
function priceParts(cedis) {
  const usd = convertToUsd(cedis);
  return {
    cedi: formatCedi(cedis),
    usd: usd === null ? "" : `≈ ${formatUsd(usd)}`,
  };
}

/**
 * Create an element. Attributes starting with "on" are not supported on
 * purpose; attach listeners with addEventListener instead.
 */
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === false || value === null || value === undefined) continue;
    if (name === "class") node.className = value;
    else if (name === "text") node.textContent = value;
    else if (value === true) node.setAttribute(name, "");
    else node.setAttribute(name, value);
  }
  for (const child of [].concat(children)) {
    node.append(child);
  }
  return node;
}

function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function titleCase(text) {
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

/** Accepts +233 24 123 4567, 0241234567, (024) 123-4567 and similar. */
function isValidPhone(value) {
  const cleaned = value.trim();
  if (!/^[+()\d][\d\s()+-]*$/.test(cleaned)) return false;
  const digits = cleaned.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

/* ===================== search.js ===================== */
/**
 * search.js
 * Keyword search over product names, categories, descriptions and tags.
 * "black bag" matches products that mention both words; plurals are
 * handled so "slippers" finds "slipper" and "shoes" finds "shoe".
 */

function stem(word) {
  return word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word;
}

function words(text) {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function matchesQuery(product, query) {
  const tokens = words(query).map(stem);
  if (tokens.length === 0) return true;
  const haystack = words(
    [product.name, product.category, product.description, ...(product.tags ?? [])].join(" ")
  ).map(stem);
  return tokens.every((token) => haystack.some((word) => word.startsWith(token)));
}

function searchProducts(products, query) {
  return products.filter((product) => matchesQuery(product, query));
}

/** Wire a search form: runs on submit and while typing. */
function initSearch({ form, input, onSearch }) {
  const run = () => onSearch(input.value.trim());
  input.addEventListener("input", debounce(run, 200));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });
}

/* ===================== cart.js ===================== */
/**
 * cart.js
 * Shopping cart logic. The cart keeps a snapshot of each product (name,
 * price, image) so it still displays correctly if a product API is offline.
 * Every change is saved to localStorage and announced with a "cart:changed"
 * event that the interface listens for.
 */

const KEY = "cart";
const MAX_QTY = 20;

let items = sanitize(load(KEY, []));

function sanitize(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      typeof item.name === "string" &&
      Number.isFinite(item.price) &&
      Number.isInteger(item.qty) &&
      item.qty > 0
  );
}

function commit() {
  save(KEY, items);
  document.dispatchEvent(new CustomEvent("cart:changed"));
}

const getItems = () => items.map((item) => ({ ...item }));

function addItem(product, qty = 1) {
  const existing = items.find((item) => item.id === product.id);
  if (existing) {
    existing.qty = Math.min(MAX_QTY, existing.qty + qty);
  } else {
    items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: Math.min(MAX_QTY, qty),
    });
  }
  commit();
}

function removeItem(id) {
  items = items.filter((item) => item.id !== id);
  commit();
}

function setQuantity(id, qty) {
  if (qty <= 0) return removeItem(id);
  const item = items.find((entry) => entry.id === id);
  if (!item) return;
  item.qty = Math.min(MAX_QTY, qty);
  commit();
}

function clearCart() {
  items = [];
  commit();
}

const getCount = () => items.reduce((sum, item) => sum + item.qty, 0);
const getTotal = () => items.reduce((sum, item) => sum + item.price * item.qty, 0);
const maxQuantity = MAX_QTY;

/* ===================== api.js ===================== */
/**
 * api.js
 * Everything that talks to the network lives here.
 *
 *  - data/products.json      Akos Luxe's own products (local file)
 *  - Fake Store API          extra accessories, priced in US dollars
 *  - open.er-api.com         live exchange rates
 */

const FAKE_STORE_URL = "https://fakestoreapi.com/products/category/jewelery";
const EXCHANGE_URL = "https://open.er-api.com/v6/latest/GHS";

/** Keep API items in a similar price range to the rest of the shop. */
const MAX_API_PRICE_USD = 200;
const RATE_CACHE_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

class ApiError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "ApiError";
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new ApiError(`The server answered with status ${response.status}.`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === "AbortError") {
      throw new ApiError("The request took too long.", { cause: error });
    }
    throw new ApiError("The network request failed.", { cause: error });
  } finally {
    clearTimeout(timer);
  }
}

/** Akos Luxe's own catalogue. Required: the shop cannot work without it. */
async function fetchLocalProducts() {
  const items = window.AKOS_PRODUCTS;
  if (!Array.isArray(items)) throw new ApiError("The product list (data/products.js) did not load.");
  return items.map((item) => ({ ...item, source: "local" }));
}

/**
 * Extra accessories from the Fake Store API. Prices arrive in USD, so they
 * are converted to cedis with the live rate before being shown.
 */
async function fetchApiProducts(usdPerCedi) {
  const items = await fetchJson(FAKE_STORE_URL);
  const cedisPerUsd = usdPerCedi ? 1 / usdPerCedi : null;
  if (!cedisPerUsd) {
    throw new ApiError("Accessories need an exchange rate to be priced in cedis.");
  }
  return items
    .filter((item) => item.price <= MAX_API_PRICE_USD)
    .map((item) => ({
      id: `FS-${item.id}`,
      name: item.title,
      category: "accessories",
      price: Math.round(item.price * cedisPerUsd),
      image: item.image,
      description: item.description,
      tags: ["jewellery", "accessory", "ladies"],
      available: true,
      isNew: false,
      source: "api",
    }));
}

/**
 * Returns USD per 1 GHS. Uses a cached value for six hours so the page does
 * not call the API on every visit, and falls back to an older cached value
 * if the network is down. Returns null if nothing has ever been fetched.
 */
async function fetchExchangeRate() {
  const cached = load("rate", null);
  if (cached && Date.now() - cached.savedAt < RATE_CACHE_MS) {
    return cached.usdPerCedi;
  }
  try {
    const data = await fetchJson(EXCHANGE_URL);
    const rate = data?.rates?.USD;
    if (typeof rate !== "number" || !(rate > 0)) {
      throw new ApiError("The exchange rate response was not in the expected format.");
    }
    save("rate", { usdPerCedi: rate, savedAt: Date.now() });
    return rate;
  } catch (error) {
    if (cached) return cached.usdPerCedi;
    throw error;
  }
}

/* ===================== products.js ===================== */
/**
 * products.js
 * Product filtering, product cards and the product details dialog.
 */

const CATEGORIES = [
  { id: "all", label: "All products" },
  { id: "bags", label: "Bags" },
  { id: "shoes", label: "Shoes" },
  { id: "slippers", label: "Slippers" },
  { id: "accessories", label: "Accessories" },
  { id: "new", label: "New arrivals" },
];

const categoryLabel = (id) =>
  CATEGORIES.find((category) => category.id === id)?.label ?? titleCase(id);

function filterProducts(products, { category = "all", query = "" } = {}) {
  const byCategory = products.filter((product) => {
    if (category === "all") return true;
    if (category === "new") return product.isNew;
    return product.category === category;
  });
  return searchProducts(byCategory, query);
}

/** Only categories that actually contain products are offered as filters. */
function availableCategories(products) {
  return CATEGORIES.filter((category) => {
    if (category.id === "all") return true;
    if (category.id === "new") return products.some((product) => product.isNew);
    return products.some((product) => product.category === category.id);
  });
}

function priceBlock(cedis) {
  const { cedi, usd } = priceParts(cedis);
  return el("p", { class: "price" }, [
    el("span", { class: "price__cedi", text: cedi }),
    usd ? el("span", { class: "price__usd", text: usd }) : "",
  ]);
}

function productImage(product, size) {
  const img = el("img", {
    src: product.image,
    alt: product.name,
    width: size,
    height: size,
    loading: "lazy",
    decoding: "async",
  });
  img.addEventListener(
    "error",
    () => {
      img.src = "images/icon.svg";
      img.classList.add("is-fallback");
    },
    { once: true }
  );
  return img;
}

function createProductCard(product, { onView, onAdd }) {
  const badges = [];
  if (!product.available) badges.push(el("span", { class: "badge badge--sold", text: "Sold out" }));
  else if (product.isNew) badges.push(el("span", { class: "badge", text: "New" }));

  const view = el("button", {
    class: "btn btn--ghost btn--sm",
    type: "button",
    "aria-label": `View details for ${product.name}`,
    text: "View",
  });
  view.addEventListener("click", () => onView(product));

  const add = el("button", {
    class: "btn btn--dark btn--sm",
    type: "button",
    "aria-label": `Add ${product.name} to cart`,
    disabled: !product.available,
    text: product.available ? "Add to cart" : "Unavailable",
  });
  add.addEventListener("click", () => onAdd(product));

  return el("article", { class: "product-card", "data-id": product.id }, [
    el("div", { class: "product-card__media" }, [productImage(product, 400), ...badges]),
    el("div", { class: "product-card__body" }, [
      el("h3", { class: "product-card__name", text: product.name }),
      el("p", { class: "product-card__category", text: categoryLabel(product.category) }),
      priceBlock(product.price),
      el("div", { class: "product-card__actions" }, [view, add]),
    ]),
  ]);
}

function renderProducts(container, products, handlers, emptyMessage) {
  container.replaceChildren();
  if (products.length === 0) {
    container.append(
      el("p", {
        class: "empty-state",
        text: emptyMessage ?? "No products match yet. Try a different word or choose another category.",
      })
    );
    return;
  }
  const fragment = document.createDocumentFragment();
  products.forEach((product) => fragment.append(createProductCard(product, handlers)));
  container.append(fragment);
}

/* ------------------------------ details dialog ------------------------------ */

let dialog;

function ensureDialog() {
  if (dialog) return dialog;
  dialog = el("dialog", { class: "product-dialog", "aria-labelledby": "detail-title" });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close(); // click on the backdrop
  });
  document.body.append(dialog);
  return dialog;
}

function showProductDetail(product, { onAdd }) {
  const box = ensureDialog();

  const close = el("button", {
    class: "dialog-close",
    type: "button",
    "aria-label": "Close product details",
    text: "×",
  });
  close.addEventListener("click", () => box.close());

  const add = el("button", {
    class: "btn btn--gold",
    type: "button",
    disabled: !product.available,
    text: product.available ? "Add to cart" : "Sold out",
  });
  add.addEventListener("click", () => {
    onAdd(product);
    box.close();
  });

  const availability = el("li", {}, [
    el("span", { class: "spec__label", text: "Availability" }),
    el("span", {
      class: product.available ? "stock stock--in" : "stock stock--out",
      text: product.available ? "In stock" : "Sold out",
    }),
  ]);

  box.replaceChildren(
    close,
    el("div", { class: "product-detail" }, [
      el("div", { class: "product-detail__media" }, [productImage(product, 600)]),
      el("div", { class: "product-detail__info" }, [
        el("h2", { id: "detail-title", text: product.name }),
        priceBlock(product.price),
        el("p", { class: "product-detail__desc", text: product.description }),
        el("ul", { class: "spec-list" }, [
          el("li", {}, [
            el("span", { class: "spec__label", text: "Category" }),
            el("span", { text: categoryLabel(product.category) }),
          ]),
          availability,
          el("li", {}, [
            el("span", { class: "spec__label", text: "Product ID" }),
            el("span", { text: product.id }),
          ]),
        ]),
        add,
      ]),
    ])
  );
  box.showModal();
}

/* ===================== form.js ===================== */
/**
 * form.js
 * Validation for the contact / order form. There is no server: after the
 * form passes validation, the customer sends the prepared message on
 * WhatsApp or by email.
 */

/** Change these to Akos Luxe's real contact details (WhatsApp: digits only, with country code). */
const CONTACT = {
  whatsapp: "233000000000",
  email: "hello@akosluxe.example",
};

const RULES = {
  name: (value) =>
    value.trim().length >= 2 ? "" : "Enter your name (at least 2 characters).",
  email: (value) =>
    isValidEmail(value) ? "" : "Enter a valid email address, like ama@example.com.",
  phone: (value) =>
    isValidPhone(value)
      ? ""
      : "Enter a phone number with 9 to 15 digits, like 024 123 4567 or +233 24 123 4567.",
  message: (value) =>
    value.trim().length >= 10 ? "" : "Write a message of at least 10 characters so we know how to help.",
};

function showError(field, message) {
  const error = document.getElementById(`${field.id}-error`);
  error.textContent = message;
  field.setAttribute("aria-invalid", message ? "true" : "false");
  field.closest(".field").classList.toggle("has-error", Boolean(message));
}

function validateField(field) {
  const message = RULES[field.name]?.(field.value) ?? "";
  showError(field, message);
  return message === "";
}

function cartSummaryText() {
  const items = getItems();
  if (items.length === 0) return "";
  const lines = items.map(
    (item) => `- ${item.qty} × ${item.name} (${item.id}) at ${formatCedi(item.price)} each`
  );
  return `I would like to order:\n${lines.join("\n")}\nTotal: ${formatCedi(getTotal())}\n\n`;
}

function buildMessage(form) {
  const product = form.elements.product;
  const interest = product.value ? product.selectedOptions[0].textContent : "General question";
  return [
    `Name: ${form.elements.name.value.trim()}`,
    `Email: ${form.elements.email.value.trim()}`,
    `Phone: ${form.elements.phone.value.trim()}`,
    `Product of interest: ${interest}`,
    "",
    form.elements.message.value.trim(),
  ].join("\n");
}

function initContactForm({ form, products, prefillFromCart }) {
  const select = form.elements.product;
  select.append(el("option", { value: "", text: "General question" }));
  products
    .filter((product) => product.available)
    .forEach((product) =>
      select.append(el("option", { value: product.id, text: `${product.name} (${product.id})` }))
    );

  if (prefillFromCart && !form.elements.message.value) {
    form.elements.message.value = cartSummaryText();
  }

  const fields = ["name", "email", "phone", "message"].map((name) => form.elements[name]);
  fields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
  });

  const success = document.getElementById("form-success");
  const summary = document.getElementById("form-summary");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const invalid = fields.filter((field) => !validateField(field));
    if (invalid.length > 0) {
      summary.textContent = `Please fix ${invalid.length} ${invalid.length === 1 ? "field" : "fields"} below.`;
      summary.hidden = false;
      invalid[0].focus();
      return;
    }
    summary.hidden = true;
    const text = buildMessage(form);
    document.getElementById("send-whatsapp").href =
      `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
    document.getElementById("send-email").href =
      `mailto:${CONTACT.email}?subject=${encodeURIComponent("Akos Luxe order or enquiry")}&body=${encodeURIComponent(text)}`;
    const name = form.elements.name.value.trim().split(/\s+/)[0];
    success.querySelector("[data-name]").textContent = name;
    success.hidden = false;
    form.hidden = true;
    success.focus();
  });

  success.querySelector("[data-again]").addEventListener("click", () => {
    form.hidden = false;
    success.hidden = true;
    form.elements.name.focus();
  });
}

/* ===================== ui.js ===================== */
/**
 * ui.js
 * Page chrome and interface updates: footer, cart
 * drawer, notices and toasts. (The navbar is in each page's HTML and
 * nav.js opens its menu.)
 */

let cartOpener = null;

/* --------------------------------- layout --------------------------------- */

function renderLayout() {
  const footer = document.getElementById("site-footer");

  footer.innerHTML = `
    <div class="footer-inner">
      <p class="footer-logo">Akos Luxe</p>
      <ul>
        <li><a href="shop.html">Shop</a></li>
        <li><a href="contact.html">Contact</a></li>
        <li><a href="mailto:hello@akosluxe.example">hello@akosluxe.example</a></li>
        <li><a href="tel:+233000000000">+233 00 000 0000</a></li>
      </ul>
    </div>
    <p class="copyright">© <span id="year"></span> Akos Luxe</p>`;
  document.getElementById("year").textContent = new Date().getFullYear();

  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="overlay" id="overlay" hidden></div>
     <aside class="cart-drawer" id="cart-drawer" aria-labelledby="cart-title" inert>
       <div class="cart-drawer__head">
         <h2 id="cart-title">Your cart</h2>
         <button class="dialog-close" type="button" id="cart-close" aria-label="Close cart">×</button>
       </div>
       <div class="cart-drawer__body" id="cart-body"></div>
       <div class="cart-drawer__foot" id="cart-foot"></div>
     </aside>
     <div class="toast-region" id="toast-region" role="status" aria-live="polite"></div>`
  );

  initCartDrawer();
  document.addEventListener("cart:changed", () => {
    updateCartBadge();
    renderCart();
  });
  updateCartBadge();
  renderCart();
}

/* ---------------------------------- cart ---------------------------------- */

function updateCartBadge() {
  const count = getCount();
  const badge = document.getElementById("cart-count");
  badge.textContent = String(count);
  badge.classList.toggle("is-empty", count === 0);
  document
    .getElementById("cart-button")
    .setAttribute(
      "aria-label",
      count === 0 ? "Open cart, empty" : `Open cart, ${count} ${count === 1 ? "item" : "items"}`
    );
}

function openCart() {
  const drawer = document.getElementById("cart-drawer");
  cartOpener = document.activeElement;
  drawer.inert = false;
  drawer.classList.add("is-open");
  document.getElementById("overlay").hidden = false;
  document.body.classList.add("no-scroll");
  document.getElementById("cart-close").focus();
}

function closeCart() {
  const drawer = document.getElementById("cart-drawer");
  drawer.classList.remove("is-open");
  drawer.inert = true;
  document.getElementById("overlay").hidden = true;
  document.body.classList.remove("no-scroll");
  if (cartOpener && document.contains(cartOpener)) cartOpener.focus();
}

function initCartDrawer() {
  document.getElementById("cart-button").addEventListener("click", openCart);
  document.getElementById("cart-close").addEventListener("click", closeCart);
  document.getElementById("overlay").addEventListener("click", closeCart);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.getElementById("cart-drawer").classList.contains("is-open")) {
      closeCart();
    }
  });

  document.getElementById("cart-body").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    const item = getItems().find((entry) => entry.id === id);
    if (!item) return;
    if (action === "increase") setQuantity(id, item.qty + 1);
    if (action === "decrease") setQuantity(id, item.qty - 1);
    if (action === "remove") {
      removeItem(id);
      toast(`${item.name} removed from your cart.`);
    }
  });

  document.getElementById("cart-foot").addEventListener("click", (event) => {
    if (event.target.closest("[data-action='clear']")) {
      clearCart();
      toast("Your cart is now empty.");
    }
  });
}

function priceLine(cedis) {
  const usd = convertToUsd(cedis);
  return usd === null ? formatCedi(cedis) : `${formatCedi(cedis)} (≈ ${formatUsd(usd)})`;
}

function renderCart() {
  const body = document.getElementById("cart-body");
  const foot = document.getElementById("cart-foot");
  if (!body) return;
  const items = getItems();

  if (items.length === 0) {
    body.replaceChildren(
      el("p", { class: "empty-state", text: "Your cart is empty." }),
      el("a", { class: "btn btn--gold", href: "shop.html", text: "Browse the shop" })
    );
    foot.replaceChildren();
    return;
  }

  const list = el("ul", { class: "cart-list" });
  for (const item of items) {
    const step = (action, label, symbol, disabled = false) =>
      el("button", {
        class: "qty-btn",
        type: "button",
        "data-action": action,
        "data-id": item.id,
        "aria-label": `${label} ${item.name}`,
        disabled,
        text: symbol,
      });
    list.append(
      el("li", { class: "cart-item" }, [
        el("img", { src: item.image, alt: "", width: 72, height: 72 }),
        el("div", { class: "cart-item__info" }, [
          el("p", { class: "cart-item__name", text: item.name }),
          el("p", { class: "cart-item__price", text: priceLine(item.price) }),
          el("div", { class: "qty" }, [
            step("decrease", "Decrease quantity of", "−"),
            el("span", { class: "qty__value", "aria-label": `Quantity ${item.qty}`, text: String(item.qty) }),
            step("increase", "Increase quantity of", "+", item.qty >= maxQuantity),
          ]),
        ]),
        el("div", { class: "cart-item__side" }, [
          el("p", { class: "cart-item__total", text: formatCedi(item.price * item.qty) }),
          el("button", {
            class: "link-btn",
            type: "button",
            "data-action": "remove",
            "data-id": item.id,
            "aria-label": `Remove ${item.name} from cart`,
            text: "Remove",
          }),
        ]),
      ])
    );
  }
  body.replaceChildren(list);

  const total = getTotal();
  const usd = convertToUsd(total);
  foot.replaceChildren(
    el("p", { class: "cart-total" }, [
      el("span", { text: `Total (${getCount()} ${getCount() === 1 ? "item" : "items"})` }),
      el("strong", { text: formatCedi(total) }),
    ]),
    usd === null ? "" : el("p", { class: "cart-total__usd", text: `≈ ${formatUsd(usd)}` }),
    el("a", { class: "btn btn--gold btn--block", href: "contact.html?from=cart", text: "Order these items" }),
    el("button", { class: "link-btn", type: "button", "data-action": "clear", text: "Clear cart" })
  );
}

/* ------------------------------ notices and toasts ------------------------------ */

function toast(message) {
  const region = document.getElementById("toast-region");
  const note = el("p", { class: "toast", text: message });
  region.append(note);
  setTimeout(() => note.remove(), 3500);
}

/** A persistent message inside the page, optionally with a retry button. */
function showNotice(text, { type = "info", onRetry } = {}) {
  const area = document.getElementById("notices");
  if (!area) return;
  const notice = el("div", { class: `notice notice--${type}` }, [el("p", { text })]);
  if (onRetry) {
    const retry = el("button", { class: "btn btn--dark btn--sm", type: "button", text: "Try again" });
    retry.addEventListener("click", () => {
      notice.remove();
      onRetry();
    });
    notice.append(retry);
  }
  area.append(notice);
}

function clearNotices() {
  document.getElementById("notices")?.replaceChildren();
}

/* ===================== main.js ===================== */
/**
 * main.js
 * Entry point for every page. Loads data, then starts whichever features
 * the current page needs (chosen by <body data-page="...">).
 */

const page = document.body.dataset.page;

function onAdd(product) {
  addItem(product);
  toast(`${product.name} added to your cart (${getCount()} in cart).`);
}
const handlers = {
  onAdd,
  onView: (product) => showProductDetail(product, { onAdd }),
};

/* ------------------------------- data loading ------------------------------- */

async function loadCatalogue() {
  clearNotices();
  const [localResult, rateResult] = await Promise.allSettled([
    fetchLocalProducts(),
    fetchExchangeRate(),
  ]);

  if (localResult.status === "rejected") {
    showNotice("We could not load the Akos Luxe collection. Check your connection and try again.", {
      type: "error",
      onRetry: () => start(),
    });
    return null;
  }
  let products = localResult.value;

  if (rateResult.status === "fulfilled") {
    appState.usdPerCedi = rateResult.value;
    renderCart();
    try {
      products = products.concat(await fetchApiProducts(appState.usdPerCedi));
    } catch {
      showNotice("Extra accessories are unavailable right now, so you are seeing the Akos Luxe collection only.");
    }
  } else {
    showNotice("Live exchange rates are unavailable, so dollar prices and extra accessories are hidden. Prices in cedis are not affected.");
  }
  return products;
}

/* --------------------------------- pages --------------------------------- */

function initHome(products) {
  const grid = document.getElementById("featured-grid");
  const featured = products.filter((product) => product.isNew && product.available).slice(0, 4);
  renderProducts(grid, featured, handlers, "New arrivals are coming soon.");
}

function initShop(products) {
  const grid = document.getElementById("product-grid");
  const filters = document.getElementById("category-filters");
  const count = document.getElementById("result-count");
  const form = document.getElementById("search-form");
  const input = document.getElementById("search-input");
  const reset = document.getElementById("reset-filters");

  const categories = availableCategories(products);
  const fromUrl = new URLSearchParams(location.search).get("category");
  const valid = (id) => categories.some((category) => category.id === id);
  const view = {
    category: valid(fromUrl) ? fromUrl : "all",
    query: new URLSearchParams(location.search).get("q") ?? "",
  };
  input.value = view.query;

  const chips = new Map();
  categories.forEach((category) => {
    const chip = el("button", { class: "chip", type: "button", text: category.label });
    chip.addEventListener("click", () => {
      view.category = category.id;
      draw();
    });
    chips.set(category.id, chip);
    filters.append(chip);
  });

  function draw() {
    const results = filterProducts(products, view);
    renderProducts(grid, results, handlers);
    chips.forEach((chip, id) => chip.setAttribute("aria-pressed", String(id === view.category)));
    const where = view.category === "all" ? "" : ` in ${categoryLabel(view.category).toLowerCase()}`;
    const what = view.query ? ` for “${view.query}”` : "";
    count.textContent = `${results.length} ${results.length === 1 ? "product" : "products"}${where}${what}`;
    reset.hidden = view.category === "all" && !view.query;
    const url = new URL(location.href);
    view.category === "all" ? url.searchParams.delete("category") : url.searchParams.set("category", view.category);
    view.query ? url.searchParams.set("q", view.query) : url.searchParams.delete("q");
    history.replaceState(null, "", url);
  }

  initSearch({
    form,
    input,
    onSearch: (query) => {
      view.query = query;
      draw();
    },
  });
  reset.addEventListener("click", () => {
    view.category = "all";
    view.query = "";
    input.value = "";
    draw();
    input.focus();
  });
  draw();
}

function initContact(products) {
  const params = new URLSearchParams(location.search);
  initContactForm({
    form: document.getElementById("contact-form"),
    products,
    prefillFromCart: params.get("from") === "cart",
  });
  const wanted = params.get("product");
  if (wanted) document.getElementById("product").value = wanted;
}

/* ---------------------------------- start ---------------------------------- */

async function start() {
  const needsProducts = ["home", "shop", "contact"].includes(page);
  if (!needsProducts) return;

  const products = await loadCatalogue();
  if (!products) return;
  appState.products = products;
  document.querySelectorAll("[data-loading]").forEach((node) => node.remove());

  if (page === "home") initHome(products);
  if (page === "shop") initShop(products);
  if (page === "contact") initContact(products);
}

renderLayout();
start();

})();
