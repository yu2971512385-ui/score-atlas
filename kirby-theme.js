(() => {
  "use strict";

  const themes = [
    {
      id: "drive",
      image: "assets/kirby-wallpaper-drive.jpg",
      color: "#f5b7c9",
      desktopPosition: "right 50%",
      mobilePosition: "50% 50%"
    },
    {
      id: "squish",
      image: "assets/kirby-wallpaper-squish.jpg",
      color: "#f5b6c5",
      desktopPosition: "right 48%",
      mobilePosition: "50% 48%"
    },
    {
      id: "space",
      image: "assets/kirby-wallpaper-space.jpg",
      color: "#bf83ed",
      desktopPosition: "right 42%",
      mobilePosition: "50% 42%"
    }
  ];

  const loaderImages = Array.from({ length: 8 }, (_, index) =>
    `assets/kirby-loader-${String(index + 1).padStart(2, "0")}.jpg`
  );

  function pick(items) {
    if (!items.length) return null;
    if (window.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      window.crypto.getRandomValues(value);
      return items[value[0] % items.length];
    }
    return items[Math.floor(Math.random() * items.length)];
  }

  let theme = null;
  try {
    const saved = window.sessionStorage.getItem("score-atlas-kirby-theme");
    theme = themes.find(item => item.id === saved) || null;
    if (!theme) {
      theme = pick(themes);
      window.sessionStorage.setItem("score-atlas-kirby-theme", theme.id);
    }
  } catch {
    theme = pick(themes);
  }

  const root = document.documentElement;
  root.style.setProperty("--kirby-wallpaper", `url("${theme.image}")`);
  root.style.setProperty("--kirby-wallpaper-color", theme.color);
  root.style.setProperty("--kirby-wallpaper-position", theme.desktopPosition);
  root.style.setProperty("--kirby-wallpaper-mobile-position", theme.mobilePosition);
  root.dataset.kirbyTheme = theme.id;

  const loaderImage = document.querySelector("#boot-kirby-image");
  if (loaderImage) {
    loaderImage.src = pick(loaderImages);
    loaderImage.addEventListener("load", () => loaderImage.classList.add("is-loaded"), { once: true });
  }

  window.ScoreAtlasTheme = { themeId: theme.id };
})();
