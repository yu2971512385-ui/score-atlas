(() => {
  "use strict";

  const data = window.SCORE_ATLAS_DATA;
  const app = document.querySelector("#app");
  const headerSearch = document.querySelector("#header-search");
  const headerSearchInput = document.querySelector("#header-search-input");
  const clearSearch = document.querySelector(".clear-search");
  const toast = document.querySelector("#toast");
  const FAVORITES_KEY = "score-atlas-favorites-v1";
  const instrumentById = new Map(data.instruments.map(item => [item.id, item]));
  const personById = new Map(data.people.map(item => [item.id, item]));
  const workById = new Map(data.works.map(item => [item.id, item]));
  const favorites = loadFavorites();
  let toastTimer;
  let activeRoot = "";
  let onlineSearchController;
  let onlineSearchSerial = 0;

  const roleLabels = {
    composer: "作曲家",
    performer: "演奏家",
    conductor: "指挥家",
    ensemble: "团体"
  };

  const instrumentAccents = {
    violin: "#b93f32",
    viola: "#7b5548",
    cello: "#b78320",
    "double-bass": "#705f34",
    guitar: "#b85e37",
    piano: "#356785",
    organ: "#694f75",
    flute: "#3c7f88",
    clarinet: "#4c5f6d",
    oboe: "#55764b",
    bassoon: "#8b513f",
    horn: "#ad7625",
    trumpet: "#b94c35",
    trombone: "#786b3c",
    harp: "#9b6d32",
    harpsichord: "#7c586c",
    lute: "#9d6342",
    mandolin: "#a65b37",
    recorder: "#478187",
    percussion: "#8a473e",
    erhu: "#a63e34",
    pipa: "#95622e",
    guzheng: "#7b6632",
    dizi: "#32736e",
    sheng: "#7b5446",
    choir: "#1f7469"
  };

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  const specialLetterFolds = {
    ł: "l", đ: "d", ð: "d", þ: "th", æ: "ae", œ: "oe", ø: "o", ß: "ss", ı: "i"
  };

  const traditionalCharacterFolds = {
    樂: "乐", 譜: "谱", 鋼: "钢", 團: "团", 國: "国", 華: "华", 爾: "尔", 貝: "贝", 門: "门",
    羅: "罗", 維: "维", 圖: "图", 鄉: "乡", 蕭: "萧", 興: "兴", 夢: "梦", 協: "协", 聲: "声",
    號: "号", 頌: "颂", 禮: "礼", 歐: "欧", 蘇: "苏", 蘭: "兰", 邁: "迈", 馬: "马", 麗: "丽",
    葉: "叶", 亞: "亚", 奧: "奥", 達: "达", 韋: "韦", 約: "约", 強: "强", 錄: "录", 詠: "咏",
    魯: "鲁", 懷: "怀", 費: "费", 橋: "桥", 彌: "弥", 賽: "赛", 麥: "麦", 齊: "齐", 鮑: "鲍",
    澤: "泽", 鐘: "钟", 鈴: "铃", 風: "风", 絃: "弦", 組: "组", 傳: "传", 統: "统", 練: "练",
    藝: "艺", 術: "术", 專: "专", 輯: "辑", 創: "创", 作: "作", 揮: "挥", 琴: "琴", 歌: "歌",
    臺: "台", 灣: "湾", 廣: "广", 東: "东", 龍: "龙", 鳳: "凤", 陳: "陈", 張: "张",
    趙: "赵", 劉: "刘", 楊: "杨", 吳: "吴", 許: "许", 鄭: "郑", 謝: "谢", 顧: "顾",
    賈: "贾", 錢: "钱", 孫: "孙", 嚴: "严", 愛: "爱", 軍: "军", 進: "进", 遠: "远",
    飛: "飞", 雲: "云", 長: "长", 萬: "万", 與: "与", 變: "变", 會: "会", 島: "岛",
    調: "调", 時: "时", 點: "点", 節: "节", 開: "开", 關: "关", 傳: "传", 師: "师"
  };

  const traditionalCharacterPattern = new RegExp(`[${Object.keys(traditionalCharacterFolds).join("")}]`, "g");

  const personSearchAliases = {
    tchaikovsky: ["Chaikovsky", "Tschaikowsky", "Tchaikowsky", "老柴"],
    beethoven: ["Beethovan", "贝多芬"],
    mozart: ["W A Mozart", "莫扎特"],
    bach: ["J S Bach", "约翰塞巴斯蒂安巴赫", "巴哈"],
    mendelssohn: ["Mendelsohn", "孟德尔颂"],
    rachmaninoff: ["Rachmaninov", "拉赫曼尼诺夫", "拉赫玛尼诺夫"],
    dvorak: ["Dvorak", "德沃夏克", "德伏夏克"],
    chopin: ["萧邦", "蕭邦"],
    handel: ["Haendel", "韩德尔", "亨德尔"],
    debussy: ["德布西", "德彪西"],
    "saint-saens": ["Saint Saens", "Saint-Saens", "圣桑", "圣桑斯"],
    prokofiev: ["Prokofieff", "普罗科菲耶夫"],
    shostakovich: ["Schostakowitsch", "肖斯塔科维奇"],
    "mutopia-n-rimsky-korsakov": ["Rimsky Korsakoff", "林姆斯基科萨科夫"]
  };

  function commonWorkAliases(work) {
    const aliases = [];
    if (/moonlight/i.test(`${work.id} ${work.original}`)) aliases.push("月光奏鸣曲", "Moonlight Sonata");
    if (/pathetique|pathétique/i.test(`${work.id} ${work.original}`)) aliases.push("悲怆奏鸣曲", "Pathetique Sonata");
    if (/appassionata/i.test(`${work.id} ${work.original}`)) aliases.push("热情奏鸣曲", "Appassionata Sonata");
    if (work.id === "mutopia-528" || /ode to joy/i.test(work.original || "")) aliases.push("欢乐颂", "歡樂頌");
    if (/swan lake/i.test(`${work.title} ${work.original}`)) aliases.push("天鹅湖", "Swan Lake");
    if (/blue danube/i.test(`${work.title} ${work.original}`)) aliases.push("蓝色多瑙河", "藍色多瑙河", "美丽的蓝色多瑙河");
    if (work.composerId === "vivaldi" && /(?:spring|summer|autumn|winter|rv\s*(?:269|315|293|297))/i.test(`${work.title} ${work.original} ${work.catalog}`)) {
      aliases.push("维瓦尔第四季", "Vivaldi Four Seasons", "Le quattro stagioni");
    }
    return aliases;
  }

  function foldSearchValue(value = "") {
    return String(value)
      .replace(/[♯#]/g, " sharp ")
      .replace(/♭/g, " flat ")
      .replace(/♮/g, " natural ")
      .replace(/&/g, " and ")
      .normalize("NFKD")
      .replace(/\p{Mark}/gu, "")
      .toLowerCase()
      .replace(traditionalCharacterPattern, character => traditionalCharacterFolds[character] || character)
      .replace(/[łđðþæœøßı]/g, letter => specialLetterFolds[letter]);
  }

  function normalize(value = "") {
    return foldSearchValue(value).replace(/[^\p{Letter}\p{Number}]+/gu, "");
  }

  function tokenizeSearch(value = "") {
    return foldSearchValue(value)
      .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function loadFavorites() {
    try {
      return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []);
    } catch {
      return new Set();
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
    } catch {
      // Browsing remains available when storage is restricted.
    }
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function parseRoute() {
    const raw = location.hash.startsWith("#/") ? location.hash.slice(2) : "";
    const [path = "", query = ""] = raw.split("?");
    return {
      parts: path.split("/").filter(Boolean).map(decodeURIComponent),
      params: new URLSearchParams(query)
    };
  }

  function href(path, params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") search.set(key, value);
    });
    return `#/${path}${search.size ? `?${search}` : ""}`;
  }

  function composerFor(work) {
    return personById.get(work.composerId);
  }

  function workPreview(work) {
    return work?.previewUrl || null;
  }

  function firstPreviewForPerson(person) {
    const related = data.works.find(work => work.composerId === person.id || person.repertoire?.includes(work.id));
    return workPreview(related);
  }

  function kirbyArtworkFor(key = "") {
    const index = [...String(key)].reduce((total, character) => total + character.charCodeAt(0), 0) % 8;
    return `assets/kirby-loader-${String(index + 1).padStart(2, "0")}.jpg`;
  }

  function favoriteButton(type, id) {
    const key = `${type}:${id}`;
    const active = favorites.has(key);
    return `
      <button class="icon-button ${active ? "is-active" : ""}" type="button" data-favorite="${escapeHtml(key)}"
        aria-label="${active ? "取消收藏" : "收藏"}" title="${active ? "取消收藏" : "收藏"}">
        <i data-lucide="bookmark${active ? "-check" : ""}" aria-hidden="true"></i>
      </button>`;
  }

  function roleText(person) {
    return person.roles.map(role => roleLabels[role] || role).join(" / ");
  }

  function sourceFilesFor(work) {
    return Array.isArray(work?.sourceFiles)
      ? work.sourceFiles.filter(file => file?.url && file?.format)
      : [];
  }

  function hasOpenFiles(work) {
    return Boolean(work?.downloadUrl || sourceFilesFor(work).length);
  }

  function accessRank(work) {
    if (work?.downloadUrl) return 2;
    if (sourceFilesFor(work).length) return 1;
    return 0;
  }

  function sourceCapability(work) {
    const source = work.sourceName || "来源页";
    if (sourceFilesFor(work).length) {
      return {
        kicker: "CC0 可编辑曲谱",
        title: "提供 MusicXML 与 MuseScore 源文件",
        note: "可下载后使用 MuseScore 等打谱软件打开、编辑或导出 PDF。",
        action: "查看 MuseScore 作品页"
      };
    }
    if (/IMSLP/i.test(source) || work.sourceUrl?.includes("imslp.org")) {
      return { kicker: "来源曲谱库", title: "可在 IMSLP 浏览多个版本", note: "请按所在地区、编制和版本标记选择可用曲谱。", action: "浏览曲谱版本" };
    }
    if (/CPDL/i.test(source) || work.sourceUrl?.includes("cpdl.org")) {
      return { kicker: "合唱曲谱库", title: "可在 CPDL 浏览合唱版本", note: "请在来源页核对具体编制、编辑者与许可。", action: "浏览合唱版本" };
    }
    return { kicker: "作品资料", title: "本站暂未收录开放曲谱", note: "当前来源提供作品介绍、馆藏或版权信息，不代表可直接下载曲谱。", action: "查看作品资料" };
  }

  function scoreFallback(work, { hidden = false, detail = false } = {}) {
    const composer = composerFor(work);
    const source = work.sourceName || "来源页";
    const capability = sourceCapability(work);
    const previewFailed = Boolean(work.previewUrl);
    const title = previewFailed ? "曲谱预览暂时无法显示" : capability.title;
    const note = previewFailed
      ? (hasOpenFiles(work) ? "仍可使用详情页的下载按钮或打开来源页。" : capability.note)
      : capability.note;
    return `<div class="score-placeholder score-fallback ${detail ? "detail" : "compact"}" ${hidden ? "hidden" : ""}>
      <div class="score-fallback-inner">
        <i data-lucide="file-search"></i>
        <p>${escapeHtml(previewFailed ? "预览备用封面" : capability.kicker)}</p>
        <strong>${escapeHtml(detail ? title : (work.catalog || work.title))}</strong>
        <span>${escapeHtml(detail ? `${work.catalog || work.title} · ${composer?.name || "未知作曲家"}` : source)}</span>
        ${detail ? `<small>${escapeHtml(note)}</small>` : ""}
      </div>
    </div>`;
  }

  function workCard(work) {
    const composer = composerFor(work);
    const preview = workPreview(work);
    const rights = work.downloadUrl
      ? `<span class="badge download"><i data-lucide="file-down"></i>${escapeHtml(work.downloadLabel || "PDF")}</span>`
      : sourceFilesFor(work).length
        ? `<span class="badge download"><i data-lucide="file-down"></i>可编辑谱</span>`
        : `<span class="badge link-only"><i data-lucide="external-link"></i>来源页</span>`;
    return `
      <article class="work-card">
        <a class="work-cover" href="#/work/${encodeURIComponent(work.id)}" aria-label="查看${escapeHtml(work.title)}">
          ${preview ? `<img data-score-preview src="${escapeHtml(preview)}" alt="${escapeHtml(work.title)}曲谱预览" loading="lazy" referrerpolicy="no-referrer">` : ""}
          ${scoreFallback(work, { hidden: Boolean(preview) })}
          <div class="badge-row">
            ${rights}
            <span class="badge">${escapeHtml(work.genre)}</span>
          </div>
        </a>
        <div class="work-body">
          <p class="work-meta">${escapeHtml(composer?.name || "")} ${work.catalog ? `· ${escapeHtml(work.catalog)}` : ""}</p>
          <h3><a href="#/work/${encodeURIComponent(work.id)}">${escapeHtml(work.title)}</a></h3>
          <p class="work-original">${escapeHtml(work.original)}${work.year ? ` · ${escapeHtml(work.year)}` : ""}</p>
          <div class="work-footer">
            <a href="#/work/${encodeURIComponent(work.id)}">查看详情</a>
            ${favoriteButton("work", work.id)}
          </div>
        </div>
      </article>`;
  }

  function personCard(person) {
    const preview = firstPreviewForPerson(person);
    const monogram = person.name.replace(/[·•\s]/g, "").slice(0, 2);
    return `
      <article class="person-card">
        <div class="person-portrait ${preview ? "has-score" : ""}" ${preview ? `style="background-image:url('${escapeHtml(preview)}')"` : ""}>
          <span>${escapeHtml(monogram)}</span>
        </div>
        <div class="person-info">
          <p class="person-role">${escapeHtml(roleText(person))}</p>
          <h3><a href="#/person/${encodeURIComponent(person.id)}">${escapeHtml(person.name)}</a></h3>
          <p>${escapeHtml(person.original)} · ${escapeHtml(person.years)}</p>
        </div>
        <a class="person-arrow" href="#/person/${encodeURIComponent(person.id)}" aria-label="查看${escapeHtml(person.name)}">
          <i data-lucide="chevron-right" aria-hidden="true"></i>
        </a>
      </article>`;
  }

  function emptyState(title, text, icon = "music") {
    return `<div class="empty-state"><div><i data-lucide="${icon}" aria-hidden="true"></i><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p></div></div>`;
  }

  function breadcrumb(items) {
    return `<nav class="breadcrumb" aria-label="面包屑">${items.map((item, index) => {
      const node = item.href ? `<a href="${item.href}">${escapeHtml(item.label)}</a>` : `<span>${escapeHtml(item.label)}</span>`;
      return `${index ? '<i data-lucide="chevron-right" aria-hidden="true"></i>' : ""}${node}`;
    }).join("")}</nav>`;
  }

  function pageHero({ eyebrow, title, original = "", description = "", crumbs = [], actions = "" }) {
    return `
      <section class="page-hero">
        <div class="page-hero-inner">
          ${crumbs.length ? breadcrumb(crumbs) : ""}
          <div class="page-hero-row">
            <div class="page-title">
              ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
              <h1>${escapeHtml(title)}</h1>
              ${original ? `<p class="original">${escapeHtml(original)}</p>` : ""}
              ${description ? `<p class="description">${escapeHtml(description)}</p>` : ""}
            </div>
            ${actions ? `<div class="hero-actions">${actions}</div>` : ""}
          </div>
        </div>
      </section>`;
  }

  function renderHome() {
    const featured = data.works.filter(work => work.featured).slice(0, 8);
    const featuredPeople = ["tchaikovsky", "bach", "paganini", "chopin", "yo-yo-ma", "hahn"].map(id => personById.get(id)).filter(Boolean);
    const downloadCount = data.works.filter(hasOpenFiles).length;
    return `
      <section class="hero">
        <div class="hero-inner">
          <div class="hero-copy">
            <p class="eyebrow">古典音乐人物与公版曲谱</p>
            <h1>谱典<br>Score Atlas</h1>
            <p class="lead">从乐器、作曲家和作品出发，查看生平、代表曲目与已核验的合法曲谱来源。</p>
            <form class="hero-search" data-search>
              <i data-lucide="search" aria-hidden="true"></i>
              <input name="q" type="search" autocomplete="off" placeholder="柴可夫斯基、Op. 35、大提琴…" aria-label="搜索人物、作品或作品号">
              <button class="button primary" type="submit">搜索</button>
            </form>
            <p class="hero-note">曲谱版本与版权状态以来源页标注为准 · 更新于 ${escapeHtml(data.updatedAt)}</p>
          </div>
        </div>
      </section>
      <section class="stats-strip" aria-label="收录概况">
        <div class="stats-inner">
          <div class="stat"><strong>${data.instruments.length}</strong><span>核心分类</span></div>
          <div class="stat"><strong>${data.people.length}</strong><span>作曲家、演奏家与团体</span></div>
          <div class="stat"><strong>${data.works.length}</strong><span>已收录作品与曲谱</span></div>
          <div class="stat"><strong>${downloadCount}</strong><span>已核验开放曲谱</span></div>
        </div>
      </section>
      <section class="arranger-promo">
        <div class="page-width arranger-promo-inner">
          <div class="arranger-promo-icon"><i data-lucide="wand-sparkles"></i></div>
          <div><p class="eyebrow">New · Title & Audio to Score</p><h2>搜曲名或导入音频，生成不同乐器的旋律谱</h2><p>开放旋律可直接转谱；清唱、哼唱或单一乐器音频可在本机提取主旋律，再试听、下载 ABC 或保存 PDF。</p></div>
          <a class="button primary" href="#/arranger"><i data-lucide="music-2"></i>打开智能转谱</a>
        </div>
      </section>
      <section class="page-section">
        <div class="page-width">
          <div class="section-head">
            <div><h2>按乐器与演唱形式</h2><p>作曲家、演奏家与作品通过真实曲目关系联系，不混淆创作与演奏身份。</p></div>
            <a class="section-link" href="#/instruments">全部分类<i data-lucide="arrow-right"></i></a>
          </div>
          <div class="instrument-grid">${data.instruments.slice(0, 12).map(instrumentCard).join("")}</div>
        </div>
      </section>
      <section class="page-section">
        <div class="page-width">
          <div class="section-head">
            <div><h2>精选作品与曲谱</h2><p>每份可下载资源均保留版本来源与权利标记。</p></div>
          </div>
          <div class="work-grid">${featured.map(workCard).join("")}</div>
        </div>
      </section>
      <section class="page-section">
        <div class="page-width">
          <div class="section-head">
            <div><h2>从大师进入曲库</h2><p>作曲家页展示作品与曲谱；演奏家页展示代表曲目。</p></div>
            <a class="section-link" href="#/people">全部人物<i data-lucide="arrow-right"></i></a>
          </div>
          <div class="people-grid">${featuredPeople.map(personCard).join("")}</div>
        </div>
      </section>`;
  }

  function instrumentCard(instrument) {
    const works = data.works.filter(work => work.instruments.includes(instrument.id));
    const personIds = new Set(works.map(work => work.composerId));
    data.people.filter(person => person.instruments?.includes(instrument.id)).forEach(person => personIds.add(person.id));
    const artwork = kirbyArtworkFor(instrument.id);
    return `
      <a class="instrument-card ${escapeHtml(instrument.id)}" style="--instrument-accent:${escapeHtml(instrumentAccents[instrument.id] || "#5b6970")}" href="#/instrument/${encodeURIComponent(instrument.id)}">
        <div class="instrument-art kirby-art" style="background-image:url('${escapeHtml(artwork)}')"></div>
        <div class="instrument-copy">
          <p>${escapeHtml(instrument.family)} · ${escapeHtml(instrument.original)}</p>
          <h3>${escapeHtml(instrument.name)}</h3>
          <div class="count"><span>${works.length} 部作品 · ${personIds.size} 位人物</span><i data-lucide="arrow-up-right"></i></div>
        </div>
      </a>`;
  }

  function renderInstrumentList() {
    return `${pageHero({
      eyebrow: "Library",
      title: "乐器与演唱形式",
      description: "从曲谱的实际编制出发，浏览对应作品、作曲家、演奏家与合唱团。",
      crumbs: [{ label: "首页", href: "#/" }, { label: "分类" }]
    })}<section class="page-section"><div class="page-width"><div class="instrument-grid">${data.instruments.map(instrumentCard).join("")}</div></div></section>`;
  }

  function renderInstrument(instrumentId, params) {
    const instrument = instrumentById.get(instrumentId);
    if (!instrument) return renderNotFound();
    const tab = ["works", "composers", "performers"].includes(params.get("tab")) ? params.get("tab") : "works";
    const allWorks = data.works.filter(work => work.instruments.includes(instrumentId))
      .sort((a, b) => accessRank(b) - accessRank(a));
    const composerIds = [...new Set(allWorks.map(work => work.composerId))];
    const composers = composerIds.map(id => personById.get(id)).filter(Boolean);
    const performers = data.people.filter(person => person.instruments?.includes(instrumentId) && (person.roles.includes("performer") || person.roles.includes("ensemble")));
    const genres = [...new Set(allWorks.map(work => work.genre))].sort((a, b) => a.localeCompare(b, "zh-CN"));
    const genre = params.get("genre") || "all";
    const works = genre === "all" ? allWorks : allWorks.filter(work => work.genre === genre);
    const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
    const visibleWorks = works.slice(0, page * 36);
    const visibleComposers = composers.slice(0, page * 48);
    const visiblePerformers = performers.slice(0, page * 48);
    const tabHref = target => href(`instrument/${instrumentId}`, { tab: target });
    const tabs = `
      <nav class="segmented" aria-label="${escapeHtml(instrument.name)}视图">
        <a class="${tab === "works" ? "active" : ""}" href="${tabHref("works")}">作品曲库 ${allWorks.length}</a>
        <a class="${tab === "composers" ? "active" : ""}" href="${tabHref("composers")}">相关作曲家 ${composers.length}</a>
        <a class="${tab === "performers" ? "active" : ""}" href="${tabHref("performers")}">${instrumentId === "choir" ? "团体" : "演奏家"} ${performers.length}</a>
      </nav>`;
    let content;
    if (tab === "works") {
      content = `
        <div class="filter-bar">
          <p class="filter-summary">共 ${works.length} 部作品，${works.filter(hasOpenFiles).length} 份已核验开放曲谱；当前显示 ${visibleWorks.length} 部。</p>
          <select class="select-control" data-genre-filter="${escapeHtml(instrumentId)}" aria-label="按体裁筛选">
            <option value="all">全部体裁</option>
            ${genres.map(item => `<option value="${escapeHtml(item)}" ${item === genre ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
          </select>
        </div>
        ${works.length ? `<div class="work-grid">${visibleWorks.map(workCard).join("")}</div>${visibleWorks.length < works.length ? `<div class="load-more"><a class="button secondary" href="${href(`instrument/${instrumentId}`, { tab: "works", genre: genre === "all" ? "" : genre, page: page + 1 })}"><i data-lucide="plus"></i>继续显示 ${Math.min(36, works.length - visibleWorks.length)} 部</a></div>` : ""}` : emptyState("没有匹配作品", "请切换体裁筛选。", "list-filter")}`;
    } else if (tab === "composers") {
      content = composers.length ? `<div class="people-grid">${visibleComposers.map(personCard).join("")}</div>${visibleComposers.length < composers.length ? `<div class="load-more"><a class="button secondary" href="${href(`instrument/${instrumentId}`, { tab: "composers", page: page + 1 })}"><i data-lucide="plus"></i>继续显示 ${Math.min(48, composers.length - visibleComposers.length)} 位</a></div>` : ""}` : emptyState("暂无作曲家", "该分类尚在补充人物资料。", "users");
    } else {
      content = performers.length ? `<div class="people-grid">${visiblePerformers.map(personCard).join("")}</div>${visiblePerformers.length < performers.length ? `<div class="load-more"><a class="button secondary" href="${href(`instrument/${instrumentId}`, { tab: "performers", page: page + 1 })}"><i data-lucide="plus"></i>继续显示 ${Math.min(48, performers.length - visiblePerformers.length)} 位</a></div>` : ""}` : emptyState("暂无演奏家或团体", "该分类的演奏档案尚在补充。", "users");
    }
    return `${pageHero({
      eyebrow: `${instrument.family} · ${instrument.original}`,
      title: instrument.name,
      description: instrument.description,
      crumbs: [{ label: "首页", href: "#/" }, { label: "分类", href: "#/instruments" }, { label: instrument.name }]
    })}<section class="page-section"><div class="page-width">${tabs}<div style="height:24px"></div>${content}</div></section>`;
  }

  function renderPeople(params) {
    const role = params.get("role") || "all";
    const options = [
      ["all", "全部"],
      ["composer", "作曲家"],
      ["performer", "演奏家"],
      ["ensemble", "团体"]
    ];
    const people = role === "all" ? data.people : data.people.filter(person => person.roles.includes(role));
    const page = Math.max(1, Number.parseInt(params.get("page") || "1", 10) || 1);
    const visiblePeople = people.slice(0, page * 60);
    return `${pageHero({
      eyebrow: "People & Ensembles",
      title: "人物与团体",
      description: "作曲家通过创作关系连接作品，演奏家和合唱团通过代表曲目连接作品。",
      crumbs: [{ label: "首页", href: "#/" }, { label: "人物" }]
    })}<section class="page-section"><div class="page-width">
      <nav class="segmented" aria-label="人物类型">${options.map(([value, label]) => `<a class="${role === value ? "active" : ""}" href="${href("people", { role: value === "all" ? "" : value })}">${label}</a>`).join("")}</nav>
      <div style="height:24px"></div>
      <div class="people-grid">${visiblePeople.map(personCard).join("")}</div>
      ${visiblePeople.length < people.length ? `<div class="load-more"><a class="button secondary" href="${href("people", { role: role === "all" ? "" : role, page: page + 1 })}"><i data-lucide="plus"></i>继续显示 ${Math.min(60, people.length - visiblePeople.length)} 位</a></div>` : ""}
    </div></section>`;
  }

  function renderPerson(personId, params) {
    const person = personById.get(personId);
    if (!person) return renderNotFound();
    const isComposer = person.roles.includes("composer");
    const relatedWorks = isComposer
      ? data.works.filter(work => work.composerId === person.id)
      : (person.repertoire || []).map(id => workById.get(id)).filter(Boolean);
    const page = Math.max(1, Number.parseInt(params?.get("page") || "1", 10) || 1);
    const visibleWorks = relatedWorks.slice(0, page * 36);
    const monogram = person.name.replace(/[·•\s]/g, "").slice(0, 2);
    const instrumentLinks = (person.instruments || []).map(id => instrumentById.get(id)).filter(Boolean)
      .map(instrument => `<a class="text-link" href="#/instrument/${instrument.id}">${escapeHtml(instrument.name)}</a>`).join(" · ");
    const sourceButton = `<a class="button secondary" href="${escapeHtml(person.sourceUrl)}" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i>人物来源</a>`;
    return `${pageHero({
      eyebrow: roleText(person),
      title: person.name,
      original: `${person.original} · ${person.years}`,
      crumbs: [{ label: "首页", href: "#/" }, { label: "人物", href: "#/people" }, { label: person.name }],
      actions: `${favoriteButton("person", person.id)}<button class="icon-button" type="button" data-share aria-label="分享当前页" title="分享"><i data-lucide="share-2"></i></button>`
    })}<section class="page-section"><div class="page-width person-detail">
      <aside class="person-detail-aside">
        <div class="person-detail-portrait">${escapeHtml(monogram)}</div>
        <dl class="person-facts">
          <div><dt>生没</dt><dd>${escapeHtml(person.years)}</dd></div>
          <div><dt>地区</dt><dd>${escapeHtml(person.region)}</dd></div>
          <div><dt>时代</dt><dd>${escapeHtml(person.era)}</dd></div>
          <div><dt>领域</dt><dd>${instrumentLinks}</dd></div>
        </dl>
      </aside>
      <div>
        <div class="prose"><h2>生平简介</h2><p>${escapeHtml(person.bio)}</p></div>
        <div class="action-row">${sourceButton}</div>
        <section class="related-section">
          <div class="section-head"><div><h2>${isComposer ? "收录作品" : "代表曲目"}</h2><p>${isComposer ? `共 ${relatedWorks.length} 部，当前显示 ${visibleWorks.length} 部；可继续进入曲谱版本。` : "代表曲目不等于创作归属。"}</p></div></div>
          ${relatedWorks.length ? `<div class="work-grid">${visibleWorks.map(workCard).join("")}</div>${visibleWorks.length < relatedWorks.length ? `<div class="load-more"><a class="button secondary" href="${href(`person/${person.id}`, { page: page + 1 })}"><i data-lucide="plus"></i>继续显示 ${Math.min(36, relatedWorks.length - visibleWorks.length)} 部</a></div>` : ""}` : emptyState("暂无关联作品", "人物资料尚在补充。")}
        </section>
      </div>
    </div></section>`;
  }

  function rightsTitle(work) {
    if (work.rights === "public_domain") return "公共领域版本";
    if (work.rights === "open_license") return "开放授权版本";
    return sourceCapability(work).title;
  }

  function renderWork(workId) {
    const work = workById.get(workId);
    if (!work) return renderNotFound();
    const composer = composerFor(work);
    const instrumentLinks = work.instruments.map(id => instrumentById.get(id)).filter(Boolean)
      .map(instrument => `<a class="text-link" href="#/instrument/${instrument.id}">${escapeHtml(instrument.name)}</a>`).join(" · ");
    const preview = workPreview(work);
    const directDownload = work.downloadUrl
      ? `<a class="button teal" href="${escapeHtml(work.downloadUrl)}" target="_blank" rel="noopener noreferrer"><i data-lucide="file-down"></i>打开${escapeHtml(work.downloadLabel || " PDF")}</a>`
      : "";
    const sourceDownloads = sourceFilesFor(work).map(file => {
      const label = /musicxml|mxl/i.test(file.format) ? "MusicXML" : (/musescore|mscz/i.test(file.format) ? "MuseScore" : file.format);
      return `<a class="button ${label === "MusicXML" ? "teal" : "secondary"}" href="${escapeHtml(file.url)}" target="_blank" rel="noopener noreferrer"><i data-lucide="file-down"></i>下载 ${escapeHtml(label)}</a>`;
    }).join("");
    const sourceInfo = sourceCapability(work);
    const relatedOpen = !hasOpenFiles(work) && work.catalog
      ? data.works.filter(candidate => candidate.id !== work.id
        && candidate.composerId === work.composerId
        && candidate.catalog?.trim().toLowerCase() === work.catalog.trim().toLowerCase()
        && hasOpenFiles(candidate)).slice(0, 6)
      : [];
    const rightsClass = hasOpenFiles(work) ? "" : "link-only";
    return `${pageHero({
      eyebrow: `${work.genre} · ${work.catalog || "作品"}`,
      title: work.title,
      original: work.original,
      crumbs: [{ label: "首页", href: "#/" }, { label: composer?.name || "作曲家", href: composer ? `#/person/${composer.id}` : "#/people" }, { label: work.title }],
      actions: `${favoriteButton("work", work.id)}<button class="icon-button" type="button" data-share aria-label="分享当前页" title="分享"><i data-lucide="share-2"></i></button>`
    })}<section class="page-section work-detail-section"><div class="page-width work-detail">
      <div class="score-preview ${preview ? "" : "is-placeholder"}">
        ${preview ? `<img data-score-preview src="${escapeHtml(preview)}" alt="${escapeHtml(work.title)}曲谱预览" referrerpolicy="no-referrer">` : ""}
        ${scoreFallback(work, { hidden: Boolean(preview), detail: true })}
      </div>
      <div>
        <div class="prose">
          <h2>作品导读</h2>
          <p>${escapeHtml(work.summary)}</p>
        </div>
        <div class="detail-meta">
          <div><span>作曲家</span><strong><a class="text-link" href="#/person/${escapeHtml(composer?.id || "")}">${escapeHtml(composer?.name || "未知")}</a></strong></div>
          <div><span>作品号</span><strong>${escapeHtml(work.catalog || "未标注")}</strong></div>
          <div><span>创作年代</span><strong>${escapeHtml(work.year || "未标注")}</strong></div>
          <div><span>乐器 / 编制</span><strong>${instrumentLinks}</strong></div>
          <div><span>曲谱来源</span><strong>${escapeHtml(work.sourceName || "来源页")}</strong></div>
          <div><span>核验日期</span><strong>${escapeHtml(work.reviewedAt || data.updatedAt)}</strong></div>
        </div>
        <div class="rights-box ${rightsClass}">
          <strong>${rightsTitle(work)}</strong>
          <p>${escapeHtml(work.license || "请在来源页查看具体版本、编订者与地区性版权标记。")}</p>
        </div>
        <div class="action-row">
          ${directDownload}${sourceDownloads}
          <a class="button secondary" href="${escapeHtml(work.sourceUrl)}" target="_blank" rel="noopener noreferrer"><i data-lucide="external-link"></i>${escapeHtml(hasOpenFiles(work) && !sourceFilesFor(work).length ? "查看来源页" : sourceInfo.action)}</a>
        </div>
        ${relatedOpen.length ? `<div class="related-open"><h3>本站已有相关开放乐章</h3><p>以下条目与本作作品号一致，并分别提供经过核验的开放曲谱。</p><div>${relatedOpen.map(candidate => `<a class="button secondary" href="#/work/${encodeURIComponent(candidate.id)}"><i data-lucide="music-2"></i>${escapeHtml(candidate.title)}</a>`).join("")}</div></div>` : ""}
      </div>
    </div></section>`;
  }

  function instrumentSearchTerms(ids = []) {
    return ids.flatMap(id => {
      const instrument = instrumentById.get(id);
      return instrument ? [instrument.name, instrument.original, instrument.family, ...(instrument.aliases || [])] : [id];
    });
  }

  function catalogSearchTerms(catalog = "") {
    const terms = [catalog];
    const opus = catalog.match(/\bop(?:us)?\.?\s*(\d+(?:\s*[a-z])?)/i);
    if (opus) terms.push(`opus ${opus[1]}`, `作品 ${opus[1]}`, `作品号 ${opus[1]}`);
    return terms;
  }

  function searchField(values, weight) {
    return values
      .filter(value => value !== undefined && value !== null && String(value).trim())
      .map(value => ({
        compact: normalize(value),
        tokens: [...new Set(tokenizeSearch(value))],
        weight
      }));
  }

  function buildSearchRecord(item, type) {
    let fields = [];
    if (type === "instrument") {
      fields = [
        ...searchField([item.name, item.original], 34),
        ...searchField(item.aliases || [], 30),
        ...searchField([item.family, item.description, item.id], 10)
      ];
    } else if (type === "person") {
      fields = [
        ...searchField([item.name, item.original], 34),
        ...searchField([...(item.aliases || []), ...(personSearchAliases[item.id] || [])], 30),
        ...searchField(instrumentSearchTerms(item.instruments), 18),
        ...searchField([item.region, item.era, item.years, item.bio, roleText(item), item.id], 9)
      ];
    } else {
      const composer = composerFor(item);
      fields = [
        ...searchField([item.title, item.original], 34),
        ...searchField([...(item.aliases || []), ...commonWorkAliases(item)], 30),
        ...searchField(catalogSearchTerms(item.catalog), 32),
        ...searchField([composer?.name, composer?.original, ...(composer?.aliases || [])], 26),
        ...searchField(instrumentSearchTerms(item.instruments), 20),
        ...searchField([item.genre, item.year, item.summary, item.id], 9)
      ];
    }
    return { item, fields };
  }

  function editDistance(left, right) {
    if (left === right) return 0;
    if (!left.length) return right.length;
    if (!right.length) return left.length;
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let row = 1; row <= left.length; row += 1) {
      const current = [row];
      for (let column = 1; column <= right.length; column += 1) {
        current[column] = Math.min(
          current[column - 1] + 1,
          previous[column] + 1,
          previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
        );
      }
      previous = current;
    }
    return previous[right.length];
  }

  function fuzzyLimit(token) {
    if (/^\d+$/u.test(token) || token.length < 4) return 0;
    if (/^\p{Script=Han}+$/u.test(token)) return token.length >= 4 ? 1 : 0;
    return token.length >= 8 ? 2 : 1;
  }

  function tokenMatchScore(token, fields) {
    let best = 0;
    const strictWord = /^\d+$/u.test(token) || (/^[a-z]+$/u.test(token) && token.length <= 2);
    fields.forEach(field => {
      if (field.compact === token) best = Math.max(best, 80 + field.weight);
      else if (field.tokens.includes(token)) best = Math.max(best, 68 + field.weight);
      else if (!strictWord && field.compact.startsWith(token)) best = Math.max(best, 62 + field.weight);
      else if (!strictWord && field.compact.includes(token)) best = Math.max(best, 48 + field.weight);
    });
    if (best) return best;

    const limit = fuzzyLimit(token);
    if (!limit) return 0;
    fields.forEach(field => {
      field.tokens.forEach(candidate => {
        if (Math.abs(candidate.length - token.length) > limit) return;
        const distance = editDistance(token, candidate);
        if (distance <= limit) best = Math.max(best, 24 + field.weight - (distance * 5));
      });
    });
    return best;
  }

  function searchRecordScore(record, query) {
    const compactQuery = normalize(query);
    const queryTokens = [...new Set(tokenizeSearch(query))];
    if (!compactQuery || !queryTokens.length) return 0;

    let score = 0;
    record.fields.forEach(field => {
      if (field.compact === compactQuery) score = Math.max(score, 180 + field.weight);
      else if (field.compact.startsWith(compactQuery)) score = Math.max(score, 130 + field.weight);
      else if (field.compact.includes(compactQuery)) score = Math.max(score, 100 + field.weight);
    });

    const tokenScores = queryTokens.map(token => tokenMatchScore(token, record.fields));
    if (tokenScores.some(value => !value)) return 0;
    return score + tokenScores.reduce((sum, value) => sum + value, 0) + (queryTokens.length > 1 ? 24 : 0);
  }

  let searchIndex;

  function getSearchIndex() {
    if (!searchIndex) {
      searchIndex = {
        instruments: data.instruments.map(item => buildSearchRecord(item, "instrument")),
        people: data.people.map(item => buildSearchRecord(item, "person")),
        works: data.works.map(item => buildSearchRecord(item, "work"))
      };
    }
    return searchIndex;
  }

  function rankedSearch(records, query, type) {
    return records
      .map(record => ({ item: record.item, score: searchRecordScore(record, query) }))
      .filter(result => result.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        if (type === "works" && accessRank(right.item) !== accessRank(left.item)) {
          return accessRank(right.item) - accessRank(left.item);
        }
        const leftLabel = left.item.name || left.item.title || left.item.original || "";
        const rightLabel = right.item.name || right.item.title || right.item.original || "";
        return leftLabel.localeCompare(rightLabel, "zh-Hans-CN");
      })
      .map(result => result.item);
  }

  function searchAll(query) {
    if (!normalize(query)) return { instruments: [], people: [], works: [] };
    const index = getSearchIndex();
    return {
      instruments: rankedSearch(index.instruments, query, "instruments"),
      people: rankedSearch(index.people, query, "people"),
      works: rankedSearch(index.works, query, "works")
    };
  }

  function searchSuggestions(query) {
    const compactQuery = normalize(query);
    if (compactQuery.length < 4 || compactQuery.length > 32) return [];
    const candidates = [];
    const addCandidate = (label, values) => {
      let distance = Infinity;
      values.filter(Boolean).forEach(value => {
        const compactValue = normalize(value);
        if (!compactValue || Math.abs(compactValue.length - compactQuery.length) > 2) return;
        distance = Math.min(distance, editDistance(compactQuery, compactValue));
      });
      const limit = /^\p{Script=Han}+$/u.test(compactQuery) ? 1 : (compactQuery.length >= 8 ? 2 : 1);
      if (distance > 0 && distance <= limit) candidates.push({ label, distance });
    };
    data.people.forEach(person => addCandidate(person.name, [person.name, person.original, ...(person.aliases || []), ...(personSearchAliases[person.id] || [])]));
    data.works.forEach(work => addCandidate(work.title, [work.title, work.original, work.catalog, ...commonWorkAliases(work)]));
    const seen = new Set();
    return candidates
      .sort((left, right) => left.distance - right.distance || left.label.localeCompare(right.label, "zh-Hans-CN"))
      .filter(candidate => {
        const key = normalize(candidate.label);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5)
      .map(candidate => candidate.label);
  }

  function smartEmptyState(query) {
    const suggestions = searchSuggestions(query);
    const compactQuery = normalize(query);
    const catalogLike = /(?:op(?:us)?|bwv|k(?:v)?|rv|hob|d|s)\.?\s*\d/i.test(query);
    const hint = catalogLike
      ? "作品号可同时搭配作曲家，例如“肖邦 Op. 9 No. 2”。"
      : (/\p{Script=Han}/u.test(query)
          ? "可尝试原文姓名、英文作品名或作品号；下方也会查询在线音乐资料。"
          : "可尝试中文译名、姓氏或作品号；下方也会查询在线音乐资料。");
    return `<div class="smart-empty">
      <div class="smart-empty-icon"><i data-lucide="search-x"></i></div>
      <div><h2>站内暂未收录“${escapeHtml(query)}”</h2><p>${escapeHtml(hint)}</p>
        ${suggestions.length ? `<div class="search-suggestions"><span>您是否要找：</span>${suggestions.map(label => `<a href="${href("search", { q: label })}">${escapeHtml(label)}</a>`).join("")}</div>` : ""}
        ${compactQuery ? `<p class="smart-empty-note">在线结果仅补充人物与作品资料，不代表本站拥有对应曲谱。</p>` : ""}
      </div>
    </div>`;
  }

  const wikidataMusicTerms = [
    "音乐", "音樂", "作曲", "歌手", "演奏", "指挥", "乐团", "樂團", "合唱", "乐曲", "歌曲", "交响曲", "协奏曲", "奏鸣曲", "歌剧",
    "composer", "musician", "pianist", "violinist", "cellist", "singer", "songwriter", "conductor", "orchestra", "choir", "ensemble", "band", "musical composition", "song", "symphony", "concerto", "sonata", "opera"
  ].map(normalize);

  const wikidataQueryAliases = {
    ravel: "Maurice Ravel", "拉威尔": "Maurice Ravel", "拉威爾": "Maurice Ravel",
    mahler: "Gustav Mahler", "马勒": "Gustav Mahler",
    puccini: "Giacomo Puccini", wagner: "Richard Wagner", verdi: "Giuseppe Verdi",
    stravinsky: "Igor Stravinsky", prokofiev: "Sergei Prokofiev", shostakovich: "Dmitri Shostakovich",
    sibelius: "Jean Sibelius", bartok: "Bela Bartok", gershwin: "George Gershwin"
  };

  function isMusicWikidataResult(item) {
    const description = normalize(item.description || "");
    if (/asteroid|street|surname|familyname|disambiguation|小行星|街道|姓氏|消歧义/u.test(description)) return false;
    return wikidataMusicTerms.some(term => description.includes(term));
  }

  function wikidataResultScore(item, query) {
    const label = normalize(item.label || "");
    const matchedText = normalize(item.match?.text || "");
    const compactQuery = normalize(query);
    const description = normalize(item.description || "");
    let score = label === compactQuery || matchedText === compactQuery ? 55 : (label.includes(compactQuery) || matchedText.includes(compactQuery) ? 22 : 0);
    if (/composer|作曲/u.test(description)) score += 80;
    else if (/musician|pianist|violinist|cellist|conductor|音乐家|音樂家|钢琴家|小提琴家|指挥/u.test(description)) score += 58;
    else if (/singer|songwriter|歌手|歌作家/u.test(description)) score += 36;
    if (/asteroid|street|surname|family name|disambiguation|小行星|街道|姓氏|消歧义/u.test(description)) score -= 90;
    return score;
  }

  async function fetchWikidata(query, signal) {
    const endpoint = "https://www.wikidata.org/w/api.php";
    const request = language => {
      const params = new URLSearchParams({
        action: "wbsearchentities",
        search: query,
        language,
        uselang: language,
        type: "item",
        limit: "10",
        format: "json",
        origin: "*"
      });
      return fetch(`${endpoint}?${params}`, { signal, headers: { Accept: "application/json" } }).then(response => {
        if (!response.ok) throw new Error(`Wikidata ${response.status}`);
        return response.json();
      });
    };
    const requestWithQuery = (language, search) => {
      const params = new URLSearchParams({
        action: "wbsearchentities",
        search,
        language,
        uselang: language,
        type: "item",
        limit: "10",
        format: "json",
        origin: "*"
      });
      return fetch(`${endpoint}?${params}`, { signal, headers: { Accept: "application/json" } }).then(response => {
        if (!response.ok) throw new Error(`Wikidata ${response.status}`);
        return response.json();
      });
    };
    const expandedQuery = wikidataQueryAliases[normalize(query)];
    const requests = [request("zh"), request("en")];
    if (expandedQuery) requests.push(requestWithQuery("zh", expandedQuery), requestWithQuery("en", expandedQuery));
    const settled = await Promise.allSettled(requests);
    const successful = settled.filter(result => result.status === "fulfilled");
    if (!successful.length) throw settled[0]?.reason || new Error("Wikidata unavailable");
    const merged = new Map();
    successful.forEach(result => (result.value.search || []).forEach(item => {
      if (!isMusicWikidataResult(item)) return;
      const existing = merged.get(item.id);
      if (!existing || (!existing.description && item.description)) merged.set(item.id, item);
    }));
    return [...merged.values()]
      .sort((left, right) => wikidataResultScore(right, query) - wikidataResultScore(left, query))
      .slice(0, 8);
  }

  function onlineSearchShell() {
    return `<section class="online-search" id="online-search-results" aria-live="polite" aria-busy="true">
      <div class="online-search-head"><div><p class="eyebrow">Online Reference</p><h2>在线音乐资料补充</h2></div><span class="reference-badge">资料·不是曲谱</span></div>
      <div class="online-search-status"><span class="search-spinner" aria-hidden="true"></span><p>正在查询 Wikidata，不影响上方站内结果…</p></div>
    </section>`;
  }

  function renderWikidataResults(items) {
    if (!items.length) {
      return `<div class="online-search-status is-finished"><i data-lucide="circle-slash-2"></i><p>Wikidata 暂未返回明确的音乐人物或作品条目。可继续使用下方曲谱库联查。</p></div>`;
    }
    return `<div class="online-result-grid">${items.map(item => `<a class="online-result" href="https://www.wikidata.org/wiki/${encodeURIComponent(item.id)}" target="_blank" rel="noopener noreferrer">
      <span class="online-result-type">Wikidata · ${escapeHtml(item.id)}</span>
      <strong>${escapeHtml(item.label || item.id)}</strong>
      <p>${escapeHtml(item.description || "音乐人物或作品资料")}</p>
      <span class="online-result-link">查看资料<i data-lucide="external-link"></i></span>
    </a>`).join("")}</div>`;
  }

  function startOnlineSearch(query) {
    onlineSearchController?.abort();
    const container = document.querySelector("#online-search-results");
    if (!container || normalize(query).length < 2) return;
    const serial = ++onlineSearchSerial;
    const controller = new AbortController();
    onlineSearchController = controller;
    fetchWikidata(query, controller.signal).then(items => {
      if (serial !== onlineSearchSerial || controller.signal.aborted || !container.isConnected) return;
      container.setAttribute("aria-busy", "false");
      container.querySelector(":scope > :last-child").outerHTML = renderWikidataResults(items);
      hydrateIcons();
    }).catch(error => {
      if (error.name === "AbortError" || serial !== onlineSearchSerial || !container.isConnected) return;
      container.setAttribute("aria-busy", "false");
      container.querySelector(":scope > :last-child").outerHTML = `<div class="online-search-status is-finished"><i data-lucide="wifi-off"></i><p>在线资料暂时无法连接。站内搜索与下方曲谱库入口仍可正常使用。</p></div>`;
      hydrateIcons();
    });
  }

  function externalLibrarySearch(query) {
    const encoded = encodeURIComponent(query);
    return `<aside class="library-search" aria-label="权威曲谱库联查">
      <div><p class="eyebrow">Library Link</p><h2>在权威曲谱库继续查找</h2><p>站内只直接托管已核验的公共领域或开放授权版本；其他版本请按所在地区在来源页核验。</p></div>
      <div class="library-search-links">
        <a class="button secondary" href="https://www.mutopiaproject.org/cgibin/make-table.cgi?searchingfor=${encoded}" target="_blank" rel="noopener noreferrer">Mutopia<i data-lucide="external-link"></i></a>
        <a class="button secondary" href="https://imslp.org/wiki/Special:Search?search=${encoded}" target="_blank" rel="noopener noreferrer">IMSLP<i data-lucide="external-link"></i></a>
        <a class="button secondary" href="https://www.cpdl.org/wiki/index.php?search=${encoded}&title=Special%3ASearch" target="_blank" rel="noopener noreferrer">CPDL<i data-lucide="external-link"></i></a>
      </div>
    </aside>`;
  }

  function renderSearch(params) {
    const query = params.get("q") || "";
    const results = searchAll(query);
    const total = results.instruments.length + results.people.length + results.works.length;
    let body = "";
    if (!query) {
      body = emptyState("开始搜索", "可输入中文名、原文名、作品号、乐器或体裁。", "search");
    } else if (!total) {
      body = smartEmptyState(query);
    } else {
      body = `<div class="search-groups">
        ${results.instruments.length ? `<section><div class="search-group-head"><h2>分类</h2><span>${results.instruments.length} 项</span></div><div class="instrument-grid">${results.instruments.map(instrumentCard).join("")}</div></section>` : ""}
        ${results.people.length ? `<section><div class="search-group-head"><h2>人物与团体</h2><span>${results.people.length} 项${results.people.length > 48 ? " · 显示前 48 项" : ""}</span></div><div class="people-grid">${results.people.slice(0, 48).map(personCard).join("")}</div></section>` : ""}
        ${results.works.length ? `<section><div class="search-group-head"><h2>作品与曲谱</h2><span>${results.works.length} 项${results.works.length > 48 ? " · 显示前 48 项" : ""}</span></div><div class="work-grid">${results.works.slice(0, 48).map(workCard).join("")}</div>${results.works.length > 48 ? `<p class="result-hint">请加入作品号、作曲家或体裁关键词缩小搜索范围。</p>` : ""}</section>` : ""}
      </div>`;
    }
    return `${pageHero({
      eyebrow: "Search",
      title: query ? `搜索：${query}` : "全站搜索",
      description: query ? `站内找到 ${total} 项相关结果；在线资料将在下方补充。` : "同时检索乐器、作曲家、演奏家、合唱团、作品名与作品号。",
      crumbs: [{ label: "首页", href: "#/" }, { label: "搜索" }]
    })}<section class="page-section"><div class="page-width">
      <form class="search-page-form" data-search>
        <i data-lucide="search" aria-hidden="true"></i>
        <input name="q" type="search" autocomplete="off" value="${escapeHtml(query)}" placeholder="例：柴可夫斯基、Tchaikovsky、Op. 35" aria-label="搜索资料库">
        <button class="button primary" type="submit">搜索</button>
      </form>
      <div style="height:32px"></div>
      ${body}
      ${query ? onlineSearchShell() : ""}
      ${query ? externalLibrarySearch(query) : ""}
    </div></section>`;
  }

  function renderFavorites() {
    const works = [...favorites].filter(key => key.startsWith("work:")).map(key => workById.get(key.slice(5))).filter(Boolean);
    const people = [...favorites].filter(key => key.startsWith("person:")).map(key => personById.get(key.slice(7))).filter(Boolean);
    const body = works.length || people.length
      ? `<div class="search-groups">${people.length ? `<section><div class="search-group-head"><h2>收藏的人物</h2><span>${people.length} 项</span></div><div class="people-grid">${people.map(personCard).join("")}</div></section>` : ""}${works.length ? `<section><div class="search-group-head"><h2>收藏的作品</h2><span>${works.length} 项</span></div><div class="work-grid">${works.map(workCard).join("")}</div></section>` : ""}</div>`
      : emptyState("还没有收藏", "收藏会保存在当前设备的浏览器中。", "bookmark");
    return `${pageHero({ eyebrow: "Favorites", title: "我的收藏", description: "收藏保存在当前浏览器，不需要登录。", crumbs: [{ label: "首页", href: "#/" }, { label: "收藏" }] })}<section class="page-section"><div class="page-width">${body}</div></section>`;
  }

  function renderAbout() {
    return `${pageHero({
      eyebrow: "Sources & Rights",
      title: "资料来源与版权说明",
      description: "作品本体进入公共领域，不等于任何现代编订、指法、改编或排版版本都可自由下载。",
      crumbs: [{ label: "首页", href: "#/" }, { label: "来源与版权" }]
    })}<section class="page-section"><div class="page-width">
      <div class="notice"><h2>收录范围</h2><p>站内目录优先收录可核验的公版或开放授权曲谱，并通过 Mutopia、IMSLP 与 CPDL 联查补足不同地区和版本。现代受保护作品不提供未授权 PDF。</p></div>
      <div style="height:18px"></div>
      <div class="notice generator-notice"><h2>智能转谱边界</h2><p>内置曲名只对应已核验的公共领域或开放旋律。流行歌可由用户导入自己有权使用的音频，在本机提取清晰单声部主旋律；全曲混音、伴奏与合声会降低准确度。平台不会仅凭现代歌名猜造或复制旋律；音频与 ABC 都不上传。</p></div>
      <div style="height:32px"></div>
      <div class="source-list">${data.sources.map(source => `<article class="source-item"><h3>${escapeHtml(source.name)}</h3><p>${escapeHtml(source.description)}</p><div class="source-links"><a class="text-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">访问资料库<i data-lucide="external-link"></i></a><a class="text-link" href="${escapeHtml(source.rightsUrl)}" target="_blank" rel="noopener noreferrer">授权说明<i data-lucide="shield-check"></i></a></div></article>`).join("")}</div>
    </div></section>`;
  }

  function renderNotFound() {
    return `${pageHero({ eyebrow: "404", title: "没有找到该页面", description: "当前链接可能已变更或资料尚未收录。" })}<section class="page-section"><div class="page-width">${emptyState("页面不存在", "返回首页继续浏览。", "circle-alert")}<div class="action-row"><a class="button" href="#/">返回首页</a></div></div></section>`;
  }

  function updateNavigation(root) {
    document.querySelectorAll(".mobile-nav a").forEach(link => link.classList.remove("active"));
    const active = root === "instrument" ? "instruments" : root === "person" || root === "work" ? "instruments" : root || "home";
    document.querySelector(`.mobile-nav [data-nav="${active}"]`)?.classList.add("active");
  }

  function hydrateIcons() {
    if (window.lucide) window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
  }

  function setupImageFallbacks() {
    app.querySelectorAll("img[data-score-preview]").forEach(image => {
      const container = image.parentElement;
      const fallback = container?.querySelector(".score-fallback");
      let timeout;
      const showFallback = () => {
        if (image.naturalWidth) return;
        image.hidden = true;
        fallback?.removeAttribute("hidden");
        container?.classList.add("is-placeholder");
        hydrateIcons();
      };
      const showImage = () => {
        if (!image.naturalWidth) return;
        clearTimeout(timeout);
        image.hidden = false;
        fallback?.setAttribute("hidden", "");
        container?.classList.remove("is-placeholder");
      };
      image.addEventListener("error", showFallback, { once: true });
      image.addEventListener("load", showImage, { once: true });
      if (image.complete) (image.naturalWidth ? showImage : showFallback)();
      else timeout = setTimeout(showFallback, 4500);
    });
  }

  function render({ preserveScroll = false } = {}) {
    const { parts, params } = parseRoute();
    const root = parts[0] || "";
    onlineSearchController?.abort();
    onlineSearchController = undefined;
    onlineSearchSerial += 1;
    if (activeRoot === "arranger" && root !== "arranger") window.ScoreAtlasArranger?.stop?.();
    activeRoot = root;
    let html;
    if (!root) html = renderHome();
    else if (root === "instruments") html = renderInstrumentList();
    else if (root === "instrument") html = renderInstrument(parts[1], params);
    else if (root === "people") html = renderPeople(params);
    else if (root === "person") html = renderPerson(parts[1], params);
    else if (root === "work") html = renderWork(parts[1]);
    else if (root === "search") html = renderSearch(params);
    else if (root === "arranger") html = window.ScoreAtlasArranger?.page() || renderNotFound();
    else if (root === "favorites") html = renderFavorites();
    else if (root === "about") html = renderAbout();
    else html = renderNotFound();
    app.innerHTML = html;
    headerSearchInput.value = root === "search" ? params.get("q") || "" : "";
    clearSearch.hidden = !headerSearchInput.value;
    updateNavigation(root);
    hydrateIcons();
    setupImageFallbacks();
    if (root === "arranger") window.ScoreAtlasArranger?.mount({ showToast, data });
    if (root === "search" && params.get("q")) startOnlineSearch(params.get("q"));
    if (!preserveScroll) window.scrollTo({ top: 0, behavior: "instant" });
    document.title = root === "work"
      ? `${workById.get(parts[1])?.title || "作品"} · 谱典`
      : root === "person"
        ? `${personById.get(parts[1])?.name || "人物"} · 谱典`
        : root === "instrument"
          ? `${instrumentById.get(parts[1])?.name || "乐器"} · 谱典`
          : root === "arranger"
            ? "智能转谱 · 谱典"
        : "谱典 · 古典音乐人物与曲谱";
  }

  function submitSearch(form) {
    const value = new FormData(form).get("q")?.toString().trim() || "";
    location.hash = value ? `#/search?q=${encodeURIComponent(value)}` : "#/search";
  }

  app.addEventListener("submit", event => {
    if (!event.target.matches("[data-search]")) return;
    event.preventDefault();
    submitSearch(event.target);
  });

  app.addEventListener("click", async event => {
    const favorite = event.target.closest("[data-favorite]");
    if (favorite) {
      const key = favorite.dataset.favorite;
      if (favorites.has(key)) {
        favorites.delete(key);
        showToast("已取消收藏");
      } else {
        favorites.add(key);
        showToast("已加入收藏");
      }
      saveFavorites();
      render({ preserveScroll: true });
      return;
    }
    const share = event.target.closest("[data-share]");
    if (share) {
      try {
        if (navigator.share) await navigator.share({ title: document.title, url: location.href });
        else {
          await navigator.clipboard.writeText(location.href);
          showToast("链接已复制");
        }
      } catch (error) {
        if (error.name !== "AbortError") showToast("暂时无法分享");
      }
    }
  });

  app.addEventListener("change", event => {
    const select = event.target.closest("[data-genre-filter]");
    if (!select) return;
    const instrumentId = select.dataset.genreFilter;
    location.hash = href(`instrument/${instrumentId}`, { tab: "works", genre: select.value === "all" ? "" : select.value });
  });

  headerSearch.addEventListener("submit", event => {
    event.preventDefault();
    submitSearch(headerSearch);
  });

  headerSearchInput.addEventListener("input", () => {
    clearSearch.hidden = !headerSearchInput.value;
  });

  clearSearch.addEventListener("click", () => {
    headerSearchInput.value = "";
    clearSearch.hidden = true;
    headerSearchInput.focus();
  });

  window.addEventListener("hashchange", () => render());
  if (!location.hash) history.replaceState(null, "", "#/");
  render();

  const bootLoader = document.querySelector("#boot-loader");
  if (bootLoader) requestAnimationFrame(() => {
    bootLoader.classList.add("is-ready");
    setTimeout(() => {
      bootLoader.remove();
    }, 320);
  });

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js?v=5.3.2").catch(() => {}));
  }
})();
