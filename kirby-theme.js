(() => {
  "use strict";

  const themes = [
    { id: "drive", label: "驾车卡比", image: "assets/kirby-wallpaper-drive.jpg", color: "#f5b7c9", desktopPosition: "right 50%", mobilePosition: "50% 50%" },
    { id: "squish", label: "拥抱卡比", image: "assets/kirby-wallpaper-squish.jpg", color: "#f5b6c5", desktopPosition: "right 48%", mobilePosition: "50% 48%" },
    { id: "space", label: "星空卡比", image: "assets/kirby-wallpaper-space.jpg", color: "#bf83ed", desktopPosition: "right 42%", mobilePosition: "50% 42%" }
  ];

  const loaderImages = Array.from({ length: 8 }, (_, index) =>
    `assets/kirby-loader-${String(index + 1).padStart(2, "0")}.jpg`
  );
  const storageKey = "score-atlas-kirby-theme";
  const root = document.documentElement;
  const app = document.querySelector("#app");
  let theme = null;
  let decorationQueued = false;

  function pick(items) {
    if (!items.length) return null;
    if (window.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      window.crypto.getRandomValues(value);
      return items[value[0] % items.length];
    }
    return items[Math.floor(Math.random() * items.length)];
  }

  function hash(value = "") {
    return [...value].reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 17);
  }

  function routeImage(salt = 0) {
    const key = location.hash || "#/";
    return loaderImages[(hash(key) + salt) % loaderImages.length];
  }

  function readTheme() {
    try {
      const saved = window.localStorage.getItem(storageKey) || window.sessionStorage.getItem(storageKey);
      return themes.find(item => item.id === saved) || null;
    } catch {
      return null;
    }
  }

  function saveTheme(id) {
    try {
      window.localStorage.setItem(storageKey, id);
      window.sessionStorage.setItem(storageKey, id);
    } catch {
      // The theme remains usable when browser storage is restricted.
    }
  }

  function updateThemeControls() {
    document.querySelectorAll("[data-kirby-theme-choice]").forEach(button => {
      const active = button.dataset.kirbyThemeChoice === theme.id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function applyTheme(nextTheme, { persist = false } = {}) {
    if (!nextTheme) return;
    theme = nextTheme;
    root.style.setProperty("--kirby-wallpaper", `url("${theme.image}")`);
    root.style.setProperty("--kirby-wallpaper-color", theme.color);
    root.style.setProperty("--kirby-wallpaper-position", theme.desktopPosition);
    root.style.setProperty("--kirby-wallpaper-mobile-position", theme.mobilePosition);
    root.dataset.kirbyTheme = theme.id;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.color);
    if (persist) saveTheme(theme.id);
    updateThemeControls();
  }

  function makeImage(className, src, alt = "") {
    const image = document.createElement("img");
    image.className = className;
    image.src = src;
    image.alt = alt;
    image.decoding = "async";
    image.loading = "lazy";
    return image;
  }

  function ensureGlobalDecorations() {
    const brand = document.querySelector(".brand");
    if (brand && !brand.querySelector(".kirby-brand-companion")) {
      const image = makeImage("kirby-brand-companion", loaderImages[2]);
      image.loading = "eager";
      image.setAttribute("aria-hidden", "true");
      brand.append(image);
    }

    const mobileNav = document.querySelector(".mobile-nav");
    if (mobileNav && !mobileNav.querySelector(".kirby-mobile-peek")) {
      const image = makeImage("kirby-mobile-peek", routeImage(6));
      image.setAttribute("aria-hidden", "true");
      mobileNav.append(image);
    }

    if (!document.querySelector(".kirby-footer")) {
      const footer = document.createElement("footer");
      footer.className = "kirby-footer";
      footer.innerHTML = `
        <div class="kirby-footer-inner">
          <div class="kirby-footer-guide">
            <img src="${loaderImages[7]}" alt="" loading="lazy" decoding="async">
            <div><strong>谱典</strong><span>和卡比一起继续翻谱</span></div>
          </div>
          <nav class="kirby-footer-links" aria-label="页脚导航">
            <a href="#/instruments">浏览分类</a>
            <a href="#/people">音乐人物</a>
            <a href="#/arranger">智能转谱</a>
          </nav>
          <div class="kirby-theme-picker" aria-label="选择卡比背景">
            <span>背景</span>
            ${themes.map(item => `<button type="button" data-kirby-theme-choice="${item.id}" aria-label="切换为${item.label}背景" title="${item.label}" style="--kirby-swatch:url('${item.image}')"></button>`).join("")}
          </div>
        </div>`;
      document.querySelector("#app")?.insertAdjacentElement("afterend", footer);
      footer.addEventListener("click", event => {
        const button = event.target.closest("[data-kirby-theme-choice]");
        if (!button) return;
        applyTheme(themes.find(item => item.id === button.dataset.kirbyThemeChoice), { persist: true });
      });
    }
    updateThemeControls();
  }

  function decorateApp() {
    decorationQueued = false;
    if (!app?.firstElementChild) return;
    const route = location.hash || "#/";
    root.dataset.kirbyRoute = route.split(/[#/?]/).filter(Boolean)[0] || "home";

    const pageHero = app.querySelector(".page-hero");
    if (pageHero && !pageHero.querySelector(".kirby-hero-companion")) {
      const figure = document.createElement("div");
      figure.className = "kirby-hero-companion";
      figure.setAttribute("aria-hidden", "true");
      figure.append(makeImage("kirby-hero-companion-image", routeImage(1)));
      figure.insertAdjacentHTML("beforeend", '<span class="kirby-spark kirby-spark-one"></span><span class="kirby-spark kirby-spark-two"></span>');
      pageHero.querySelector(".page-hero-inner")?.append(figure);
      pageHero.classList.add("has-kirby-companion");
    }

    const homeHero = app.querySelector(".hero");
    if (homeHero && !homeHero.querySelector(".kirby-home-guide")) {
      const guide = document.createElement("div");
      guide.className = "kirby-home-guide";
      guide.setAttribute("aria-hidden", "true");
      guide.append(makeImage("kirby-home-guide-image", routeImage(3)));
      guide.insertAdjacentHTML("beforeend", "<span>今天也找到一页好谱</span>");
      homeHero.querySelector(".hero-inner")?.append(guide);
    }

    app.querySelectorAll(".empty-state:not(.has-kirby-empty)").forEach((emptyState, index) => {
      const content = emptyState.firstElementChild;
      if (!content) return;
      const image = makeImage("kirby-empty-image", routeImage(index + 4));
      image.setAttribute("aria-hidden", "true");
      content.prepend(image);
      emptyState.classList.add("has-kirby-empty");
    });

    app.querySelectorAll(".smart-empty:not(.has-kirby-empty)").forEach((emptyState, index) => {
      const icon = emptyState.querySelector(".smart-empty-icon");
      if (!icon) return;
      const image = makeImage("kirby-smart-empty-image", routeImage(index + 7));
      image.setAttribute("aria-hidden", "true");
      icon.replaceChildren(image);
      emptyState.classList.add("has-kirby-empty");
    });

    const personAside = app.querySelector(".person-detail-aside");
    if (personAside && !personAside.querySelector(".kirby-aside-guide")) {
      const guide = document.createElement("div");
      guide.className = "kirby-aside-guide";
      guide.setAttribute("aria-hidden", "true");
      guide.append(makeImage("kirby-aside-guide-image", routeImage(5)));
      guide.insertAdjacentHTML("beforeend", "<span>一起走进音乐家的作品世界</span>");
      personAside.append(guide);
    }

    const mobilePeek = document.querySelector(".kirby-mobile-peek");
    if (mobilePeek) mobilePeek.src = routeImage(6);
  }

  function queueDecorations() {
    if (decorationQueued) return;
    decorationQueued = true;
    window.requestAnimationFrame(decorateApp);
  }

  applyTheme(readTheme() || pick(themes));
  ensureGlobalDecorations();

  const loaderImage = document.querySelector("#boot-kirby-image");
  if (loaderImage) {
    loaderImage.src = pick(loaderImages);
    loaderImage.addEventListener("load", () => loaderImage.classList.add("is-loaded"), { once: true });
  }

  if (app) new MutationObserver(queueDecorations).observe(app, { childList: true });
  window.addEventListener("hashchange", queueDecorations);
  queueDecorations();

  window.ScoreAtlasTheme = {
    get themeId() { return theme.id; },
    setTheme(id) { applyTheme(themes.find(item => item.id === id), { persist: true }); }
  };
})();
