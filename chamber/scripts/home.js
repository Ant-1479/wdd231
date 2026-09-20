"use strict";

/* ==========================================================
   Home page scripts
   1. Weather: current conditions + 3-day forecast (OpenWeatherMap)
   2. Spotlights: three random gold/silver members from JSON
   ========================================================== */

/* ---------- Settings: edit these for your chamber ---------- */
const WEATHER = {
  apiKey: "8cd0bd0a76967050e790ac524d6c7ca8", 
  lat: 43.615,                           
  lon: -116.2023,                        
  units: "imperial",                    
  baseUrl: "https://api.openweathermap.org/data/2.5",
  forecastDays: 3,
};

const SPOTLIGHTS = {
  url: "data/home.json",
  count: 3,
  levels: ["gold", "silver"],
};

const UNIT_LABELS = {
  imperial: { temp: "°F", speed: "mph" },
  metric: { temp: "°C", speed: "m/s" },
};

/* ---------- Small helpers ---------- */
const $ = (selector) => document.querySelector(selector);

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showStatus(container, message) {
  container.replaceChildren(make("p", "status", message));
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function iconUrl(code) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`;
}

/* ==========================================================
   Weather
   ========================================================== */

// Turns OpenWeatherMap's 3-hour forecast list into one entry per day
// (in the chamber's local time), skipping today.
function summarizeForecast(data, days) {
  const offset = data.city.timezone; // seconds from UTC
  const localDate = (dt) => new Date((dt + offset) * 1000);
  const dayKey = (dt) => localDate(dt).toISOString().slice(0, 10);
  const todayKey = dayKey(Math.floor(Date.now() / 1000));

  const byDay = new Map();
  for (const item of data.list) {
    const key = dayKey(item.dt);
    if (key === todayKey) continue;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(item);
  }

  return [...byDay].slice(0, days).map(([key, items]) => {
    const high = Math.max(...items.map((item) => item.main.temp_max));
    const low = Math.min(...items.map((item) => item.main.temp_min));
    // Use the reading closest to noon to describe the day
    const midday = items.reduce((best, item) =>
      Math.abs(localDate(item.dt).getUTCHours() - 12) <
      Math.abs(localDate(best.dt).getUTCHours() - 12)
        ? item
        : best
    );
    const name = new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });
    return { name, high, low, weather: midday.weather[0] };
  });
}

function renderCurrent(current) {
  const u = UNIT_LABELS[WEATHER.units];
  const { description, icon } = current.weather[0];

  const wrap = make("div", "weather__now");

  const img = make("img", "weather__icon");
  img.src = iconUrl(icon);
  img.alt = "";
  img.width = 100;
  img.height = 100;

  const temp = make("p", "weather__temp", `${Math.round(current.main.temp)}${u.temp}`);
  const desc = make("p", "weather__desc", capitalize(description));

  const meta = make("ul", "weather__meta");
  meta.append(
    make("li", null, `Feels like ${Math.round(current.main.feels_like)}${u.temp}`),
    make("li", null, `Humidity ${current.main.humidity}%`),
    make("li", null, `Wind ${Math.round(current.wind.speed)} ${u.speed}`)
  );

  wrap.append(img, temp, desc, meta);
  $("#weather-current").replaceChildren(wrap);
}

function renderForecast(days) {
  const u = UNIT_LABELS[WEATHER.units];
  const items = days.map((day) => {
    const li = make("li", "forecast__day");

    const name = make("span", "forecast__name", day.name);

    const desc = make("span", "forecast__desc");
    const icon = make("img", "forecast__icon");
    icon.src = iconUrl(day.weather.icon);
    icon.alt = "";
    icon.width = 50;
    icon.height = 50;
    icon.loading = "lazy";
    desc.append(icon, capitalize(day.weather.description));

    const temps = make("span", "forecast__temps");
    temps.append(
      make("span", null, `High ${Math.round(day.high)}${u.temp}`),
      make("span", null, `Low ${Math.round(day.low)}${u.temp}`)
    );

    li.append(name, desc, temps);
    return li;
  });
  $("#weather-forecast").replaceChildren(...items);
}

async function loadWeather() {
  const currentBox = $("#weather-current");
  const forecastBox = $("#weather-forecast");

  try {
    if (!WEATHER.apiKey || WEATHER.apiKey.startsWith("YOUR_")) {
      throw new Error("Add your OpenWeatherMap API key to scripts/home.js.");
    }

    const query = `lat=${WEATHER.lat}&lon=${WEATHER.lon}&units=${WEATHER.units}&appid=${WEATHER.apiKey}`;
    const [current, forecast] = await Promise.all([
      getJson(`${WEATHER.baseUrl}/weather?${query}`),
      getJson(`${WEATHER.baseUrl}/forecast?${query}`),
    ]);

    renderCurrent(current);
    renderForecast(summarizeForecast(forecast, WEATHER.forecastDays));
  } catch (error) {
    console.error("Weather error:", error);
    showStatus(currentBox, "Weather is unavailable right now. Please check back soon.");
    forecastBox.replaceChildren();
  }
}

/* ==========================================================
   Member spotlights
   ========================================================== */


function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildCard(member) {
  const card = make("article", "member-card panel");
  card.dataset.level = member.membership.toLowerCase();

  const logo = make("img", "member-card__logo");
  logo.src = member.logo;
  logo.alt = `${member.name} logo`;
  logo.width = 72;
  logo.height = 72;

  const name = make("h3", "member-card__name", member.name);
  const badge = make("p", "badge", `${member.membership} member`);

  const phone = make("a", null, member.phone);
  phone.href = `tel:${member.phone.replace(/[^\d+]/g, "")}`;

  const site = make("a", null, new URL(member.website).hostname.replace(/^www\./, ""));
  site.href = member.website;
  site.rel = "noopener";

  const details = make("ul", "member-card__details");
  const phoneItem = make("li");
  phoneItem.append(phone);
  const addressItem = make("li", null, member.address);
  const siteItem = make("li");
  siteItem.append(site);
  details.append(phoneItem, addressItem, siteItem);

  card.append(logo, name, badge, details);
  return card;
}

async function loadSpotlights() {
  const grid = $("#spotlight-grid");

  try {
    const data = await getJson(SPOTLIGHTS.url);
    const eligible = data.members.filter((member) =>
      SPOTLIGHTS.levels.includes(member.membership.toLowerCase())
    );
    const picks = shuffle(eligible).slice(0, SPOTLIGHTS.count);

    if (picks.length === 0) {
      showStatus(grid, "No member spotlights to show right now.");
      return;
    }
    grid.replaceChildren(...picks.map(buildCard));
  } catch (error) {
    console.error("Spotlight error:", error);
    showStatus(
      grid,
      "Member spotlights could not be loaded. If you opened this file directly, run the site from a local server (for example, VS Code Live Server)."
    );
  }
}

/* ---------- Start ---------- */
loadWeather();
loadSpotlights();
