// Lab 4: localStorage (system info) + footer dump + fetch comments + modal after 1 min + day/night theme

document.addEventListener("DOMContentLoaded", () => {
  const variant = getVariantNumber();
  setVariantText(variant);

  // 1) localStorage: записати інфо про браузер/ОС
  saveSystemInfoToLocalStorage();

  // 4) Тема: авто + перемикач
  initTheme();

  // Показати ВСЕ localStorage у футері
  renderLocalStorageDump();

  // 2) fetch коментарів
  loadComments(variant);

  // 3) Модальне вікно через 1 хв
  setupModal();
  showModalAfterOneMinute();

  // (опціонально) AJAX сабміт для Formspree (щоб не перезавантажувало сторінку)
  setupFormSubmission();
});

/* ------------------ Variant ------------------ */
function getVariantNumber() {
  const body = document.body;
  const v = Number(body.dataset.variant);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

function setVariantText(variant) {
  const el = document.getElementById("variantText");
  if (el) el.textContent = String(variant);
}

/* ------------------ 1) localStorage System Info ------------------ */
function saveSystemInfoToLocalStorage() {
  // Деякі поля не всюди існують, тому перевіряємо
  const uaData = navigator.userAgentData || null;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;

  const info = {
    userAgent: navigator.userAgent,
    platform: (uaData && uaData.platform) || navigator.platform || "unknown",
    language: navigator.language,
    languages: navigator.languages,
    cookieEnabled: navigator.cookieEnabled,
    online: navigator.onLine,
    vendor: navigator.vendor || "",
    hardwareConcurrency: navigator.hardwareConcurrency || null,
    deviceMemory: navigator.deviceMemory || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    screen: {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio
    },

    page: {
      href: location.href,
      protocol: location.protocol,
      hostname: location.hostname
    },

    connection: connection ? {
      effectiveType: connection.effectiveType || null,
      downlink: connection.downlink || null,
      rtt: connection.rtt || null,
      saveData: connection.saveData || null
    } : null
  };

  // Збережемо дані і як JSON, і окремими ключами (щоб було видно багато значень)
  localStorage.setItem("sys_saved_at", new Date().toISOString());
  localStorage.setItem("sys_info_json", JSON.stringify(info));

  localStorage.setItem("sys_userAgent", info.userAgent);
  localStorage.setItem("sys_platform", info.platform);
  localStorage.setItem("sys_language", info.language);
  localStorage.setItem("sys_timezone", info.timezone);

  localStorage.setItem("sys_screen_width", String(info.screen.width));
  localStorage.setItem("sys_screen_height", String(info.screen.height));
  localStorage.setItem("sys_pixel_ratio", String(info.screen.pixelRatio));

  if (info.connection) {
    localStorage.setItem("sys_net_effectiveType", String(info.connection.effectiveType));
    localStorage.setItem("sys_net_downlink", String(info.connection.downlink));
    localStorage.setItem("sys_net_rtt", String(info.connection.rtt));
    localStorage.setItem("sys_net_saveData", String(info.connection.saveData));
  }
}

/* Показати ВСЕ, що є у localStorage, у футері */
function renderLocalStorageDump() {
  const pre = document.getElementById("storageDump");
  if (!pre) return;

  const dump = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    dump[key] = localStorage.getItem(key);
  }

  pre.textContent = JSON.stringify(dump, null, 2);
}

/* ------------------ 2) Fetch Comments ------------------ */
async function loadComments(variant) {
  const list = document.getElementById("commentsList");
  const status = document.getElementById("commentsStatus");
  if (!list) return;

  const url = `https://jsonplaceholder.typicode.com/posts/${variant}/comments`;

  list.innerHTML = `<li>Завантаження...</li>`;
  if (status) status.textContent = "";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const comments = await res.json();

    list.innerHTML = "";
    comments.forEach((c) => {
      const li = document.createElement("li");
      li.className = "comment-card";

      const name = document.createElement("div");
      name.className = "comment-name";
      name.textContent = c.name;

      const email = document.createElement("div");
      email.className = "comment-email";
      email.textContent = c.email;

      const body = document.createElement("div");
      body.textContent = c.body;

      li.appendChild(name);
      li.appendChild(email);
      li.appendChild(body);
      list.appendChild(li);
    });

    if (status) status.textContent = `Завантажено коментарів: ${comments.length}`;
  } catch (e) {
    list.innerHTML = `<li>Не вдалося завантажити коментарі.</li>`;
    if (status) status.textContent = `Помилка: ${String(e.message || e)}`;
  }
}

/* ------------------ 3) Modal + Form ------------------ */
function setupModal() {
  const modal = document.getElementById("feedbackModal");
  if (!modal) return;

  // Закриття по overlay або кнопці (data-close="true")
  modal.addEventListener("click", (e) => {
    const target = e.target;
    if (target && target.getAttribute && target.getAttribute("data-close") === "true") {
      closeModal();
    }
  });

  // Закриття по ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function showModalAfterOneMinute() {
  setTimeout(() => {
    openModal();
  }, 60000);
}

function openModal() {
  const modal = document.getElementById("feedbackModal");
  if (!modal) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = document.getElementById("feedbackModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

/* AJAX сабміт (не обов’язково, але зручно). Якщо endpoint не замінений — попередження */
function setupFormSubmission() {
  const form = document.getElementById("feedbackForm");
  const statusEl = document.getElementById("formStatus");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    const action = form.getAttribute("action") || "";
    if (action.includes("XXXXXXXX")) {
      e.preventDefault();
      if (statusEl) statusEl.textContent = "Встав свій endpoint Formspree у form action.";
      return;
    }

    // Щоб не йти на іншу сторінку — відправляємо fetch’ем
    e.preventDefault();
    if (statusEl) statusEl.textContent = "Відправлення...";

    try {
      const formData = new FormData(form);
      const res = await fetch(action, {
        method: "POST",
        body: formData,
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      if (statusEl) statusEl.textContent = "Відправлено ✅";
      form.reset();
      setTimeout(closeModal, 800);
    } catch (err) {
      if (statusEl) statusEl.textContent = "Помилка відправлення. Перевір endpoint/інтернет.";
    }
  });
}

/* ------------------ 4) Theme (day/night + toggle) ------------------ */
function initTheme() {
  const toggle = document.getElementById("themeToggle");
  const text = document.getElementById("themeText");

  // Якщо користувач вже вибирав тему — використовуємо її
  const saved = localStorage.getItem("theme_mode"); // "light" або "dark" або null
  if (saved === "light" || saved === "dark") {
    applyTheme(saved);
    if (toggle) toggle.checked = (saved === "dark");
    if (text) text.textContent = `Тема: ${saved === "dark" ? "нічна (ручна)" : "денна (ручна)"}`;
  } else {
    // Авто по часу
    const auto = getAutoThemeByTime();
    applyTheme(auto);
    if (toggle) toggle.checked = (auto === "dark");
    if (text) text.textContent = `Тема: ${auto === "dark" ? "нічна (авто)" : "денна (авто)"}`;
  }

  // Перемикач (ручний режим + збереження)
  if (toggle) {
    toggle.addEventListener("change", () => {
      const mode = toggle.checked ? "dark" : "light";
      localStorage.setItem("theme_mode", mode);
      applyTheme(mode);
      if (text) text.textContent = `Тема: ${mode === "dark" ? "нічна (ручна)" : "денна (ручна)"}`;
      renderLocalStorageDump(); // щоб у футері було видно зміни
    });
  }

  // Авто-перевірка кожну хвилину, але ТІЛЬКИ якщо немає ручного вибору
  setInterval(() => {
    const manual = localStorage.getItem("theme_mode");
    if (manual === "light" || manual === "dark") return;

    const auto = getAutoThemeByTime();
    applyTheme(auto);
    if (toggle) toggle.checked = (auto === "dark");
    if (text) text.textContent = `Тема: ${auto === "dark" ? "нічна (авто)" : "денна (авто)"}`;
  }, 60000);
}

function getAutoThemeByTime() {
  const now = new Date();
  const hour = now.getHours(); // 0..23
  // День: 07:00–21:00
  return (hour >= 7 && hour < 21) ? "light" : "dark";
}

function applyTheme(mode) {
  if (mode === "dark") {
    document.body.classList.add("theme-dark");
  } else {
    document.body.classList.remove("theme-dark");
  }

  // Пишемо в localStorage, щоб видно було у футері
  localStorage.setItem("theme_applied", mode);
  localStorage.setItem("theme_applied_at", new Date().toISOString());

  renderLocalStorageDump();
}