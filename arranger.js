(() => {
  "use strict";

  const tunes = window.SCORE_ATLAS_TUNES || [];
  const profiles = [
    { id: "violin", name: "小提琴", original: "Violin", clef: "treble", written: 0, octave: 0, program: 40 },
    { id: "viola", name: "中提琴", original: "Viola", clef: "alto", written: 0, octave: -12, program: 41 },
    { id: "cello", name: "大提琴", original: "Cello", clef: "bass", written: 0, octave: -12, program: 42 },
    { id: "double-bass", name: "低音提琴", original: "Double bass", clef: "bass", written: 12, octave: -12, program: 43 },
    { id: "guitar", name: "古典吉他", original: "Classical guitar", clef: "treble", written: 12, octave: -12, program: 24 },
    { id: "flute", name: "长笛", original: "Flute", clef: "treble", written: 0, octave: 12, program: 73 },
    { id: "oboe", name: "双簧管", original: "Oboe", clef: "treble", written: 0, octave: 0, program: 68 },
    { id: "clarinet", name: "降 B 调单簧管", original: "B-flat clarinet", clef: "treble", written: 2, octave: 0, program: 71 },
    { id: "bassoon", name: "巴松", original: "Bassoon", clef: "bass", written: 0, octave: -12, program: 70 },
    { id: "horn", name: "F 调圆号", original: "Horn in F", clef: "treble", written: 7, octave: -12, program: 60 },
    { id: "trumpet", name: "降 B 调小号", original: "B-flat trumpet", clef: "treble", written: 2, octave: 0, program: 56 },
    { id: "trombone", name: "长号", original: "Trombone", clef: "bass", written: 0, octave: -12, program: 57 },
    { id: "recorder", name: "高音竖笛", original: "Soprano recorder", clef: "treble", written: 0, octave: 12, program: 74 },
    { id: "erhu", name: "二胡", original: "Erhu", clef: "treble", written: 0, octave: 0, program: 40 },
    { id: "dizi", name: "笛子", original: "Dizi", clef: "treble", written: 0, octave: 12, program: 73 },
    { id: "piano", name: "钢琴右手旋律", original: "Piano melody", clef: "treble", written: 0, octave: 0, program: 0 }
  ];

  const state = { tuneId: tunes[0]?.id, profileId: "violin", octaveAdjustment: 0, customAbc: "", customTitle: "", visual: null, synth: null, generatedAbc: "" };
  let catalogData = null;
  const esc = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const normalize = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\s·—–_.,'"()[\]{}:/\\-]+/g, "");

  function selectedTune() {
    return tunes.find(tune => tune.id === state.tuneId) || tunes[0];
  }

  function selectedProfile() {
    return profiles.find(profile => profile.id === state.profileId) || profiles[0];
  }

  function page() {
    const tune = selectedTune();
    return `
      <section class="page-hero arranger-hero">
        <div class="page-hero-inner">
          <nav class="breadcrumb" aria-label="面包屑"><a href="#/">首页</a><i data-lucide="chevron-right"></i><span>智能转谱</span></nav>
          <div class="page-hero-row"><div class="page-title"><p class="eyebrow">Title to Score</p><h1>智能转谱</h1><p class="description">按曲名调用开放旋律，为不同乐器自动换谱号、移调和适配音域；所有处理均在当前设备完成。</p></div></div>
        </div>
      </section>
      <section class="page-section arranger-section">
        <div class="page-width arranger-layout">
          <aside class="arranger-controls" aria-label="配谱设置">
            <div class="tool-heading"><span>01</span><div><h2>选择旋律</h2><p>${tunes.length} 首已核验开放旋律</p></div></div>
            <label class="field-label" for="tune-search">歌曲或曲子名称</label>
            <div class="arranger-search"><i data-lucide="search"></i><input id="tune-search" type="search" autocomplete="off" placeholder="例：欢乐颂、Ode to Joy"></div>
            <div class="tune-results" id="tune-results" aria-live="polite">${tuneResults("")}</div>
            <div class="divider"></div>
            <div class="tool-heading"><span>02</span><div><h2>选择乐器</h2><p>自动采用常用谱号与记谱移调</p></div></div>
            <label class="field-label" for="arranger-instrument">目标乐器</label>
            <select class="select-control arranger-select" id="arranger-instrument">${profiles.map(profile => `<option value="${profile.id}" ${profile.id === state.profileId ? "selected" : ""}>${esc(profile.name)} · ${esc(profile.original)}</option>`).join("")}</select>
            <label class="field-label" for="arranger-octave">额外八度调整</label>
            <select class="select-control arranger-select" id="arranger-octave">
              <option value="-12">再降低八度</option>
              <option value="0" selected>采用推荐音域</option>
              <option value="12">再升高八度</option>
            </select>
            <div class="divider"></div>
            <details class="abc-import">
              <summary><i data-lucide="file-up"></i>导入本人有权使用的 ABC</summary>
              <p>文件只在本机读取，不会上传。支持粘贴 ABC 文本或选择 .abc / .txt 文件。</p>
              <input id="abc-file" type="file" accept=".abc,.txt,text/plain" hidden>
              <label class="button secondary" for="abc-file"><i data-lucide="folder-open"></i>选择文件</label>
              <textarea id="abc-input" rows="8" spellcheck="false" placeholder="X:1&#10;T:我的旋律&#10;M:4/4&#10;L:1/4&#10;K:C&#10;C D E F | G4 |"></textarea>
              <button class="button secondary" type="button" id="apply-abc"><i data-lucide="check"></i>应用 ABC</button>
            </details>
            <div class="rights-mini"><i data-lucide="shield-check"></i><p>现代受保护曲目不会仅凭名称生成旋律。可导入您创作或已获授权的 ABC 文件。</p></div>
          </aside>
          <div class="arranger-workspace">
            <div class="score-toolbar">
              <div class="score-identity"><span id="score-kicker">${esc(tune?.composer || "自有旋律")}</span><strong id="score-title">${esc(tune?.title || "未选择")}</strong></div>
              <div class="score-actions">
                <button class="button secondary" type="button" id="play-score"><i data-lucide="play"></i><span>试听</span></button>
                <button class="icon-button" type="button" id="stop-score" aria-label="停止试听" title="停止试听"><i data-lucide="square"></i></button>
                <button class="button secondary" type="button" id="download-abc"><i data-lucide="download"></i><span>ABC</span></button>
                <button class="button teal" type="button" id="print-score"><i data-lucide="file-down"></i><span>打印 / PDF</span></button>
              </div>
            </div>
            <div class="score-status" id="score-status"><i data-lucide="wand-sparkles"></i><span>已按小提琴生成</span></div>
            <div class="generated-score" id="generated-score" aria-label="生成的五线谱"></div>
            <div class="score-source" id="score-source"></div>
          </div>
        </div>
      </section>`;
  }

  function tuneResults(query) {
    const needle = normalize(query);
    const matched = tunes.filter(tune => !needle || normalize([tune.title, tune.original, tune.composer, ...(tune.aliases || [])].join(" ")).includes(needle)).slice(0, needle ? 8 : 5);
    if (!matched.length) {
      const catalogWorks = (catalogData?.works || []).filter(work => normalize([work.title, work.original, work.catalog].join(" ")).includes(needle)).slice(0, 4);
      if (catalogWorks.length) return `<div class="tune-empty"><strong>找到作品资料，但暂无可转换旋律</strong><span>可先查看原谱来源，或在下方导入您有权使用的 ABC。</span>${catalogWorks.map(work => `<a class="catalog-match" href="#/work/${esc(work.id)}"><span>${esc(work.title)}</span><i data-lucide="arrow-up-right"></i></a>`).join("")}</div>`;
      return `<div class="tune-empty"><strong>开放旋律库暂无此曲</strong><span>如您拥有合法版本，可在下方导入 ABC 文件。</span></div>`;
    }
    return matched.map(tune => `<button type="button" class="tune-option ${tune.id === state.tuneId && !state.customAbc ? "selected" : ""}" data-tune-id="${esc(tune.id)}"><span><strong>${esc(tune.title)}</strong><small>${esc(tune.original)}</small></span><i data-lucide="chevron-right"></i></button>`).join("");
  }

  function withClef(abc, clef) {
    return abc.replace(/(^K:[^\n]*)(?=\n|$)/m, (_, line) => `${line.replace(/\s+clef=\S+/g, "")} clef=${clef}`);
  }

  function makeScore(showToast) {
    const target = document.querySelector("#generated-score");
    if (!target || !window.ABCJS) return;
    const tune = selectedTune();
    const profile = selectedProfile();
    const sourceAbc = state.customAbc || tune?.abc;
    if (!sourceAbc) return;
    try {
      const clefAbc = withClef(sourceAbc, profile.clef);
      const scratch = document.createElement("div");
      const parsed = window.ABCJS.renderAbc(scratch, clefAbc, { add_classes: true })[0];
      const steps = profile.written + profile.octave + state.octaveAdjustment;
      const transposedAbc = steps ? window.ABCJS.strTranspose(clefAbc, parsed, steps) : clefAbc;
      const attribution = state.customAbc
        ? `% Generated locally by Score Atlas for ${profile.name}\n`
        : `% Generated by Score Atlas for ${profile.name}\n% Source: ${tune.sourceUrl}\n% Rights: ${tune.rights}\n% Reviewed: ${tune.reviewedAt}\n`;
      state.generatedAbc = `${attribution}${transposedAbc}`;
      const compactLayout = window.matchMedia("(max-width: 760px)").matches;
      const rendered = window.ABCJS.renderAbc(target, state.generatedAbc, {
        add_classes: true,
        responsive: "resize",
        oneSvgPerLine: true,
        print: true,
        staffwidth: compactLayout ? 520 : 840,
        wrap: { minSpacing: 1.8, maxSpacing: 2.7, preferredMeasuresPerLine: compactLayout ? 2 : 4 }
      });
      state.visual = rendered[0];
      document.querySelector("#score-status")?.classList.remove("warning");
      document.querySelector("#score-title").textContent = state.customAbc ? (state.customTitle || "自有 ABC 旋律") : tune.title;
      document.querySelector("#score-kicker").textContent = state.customAbc ? "本机导入" : `${tune.composer} · ${tune.era}`;
      document.querySelector("#score-status span").textContent = `已按${profile.name}生成 · ${profile.clef === "bass" ? "低音谱号" : profile.clef === "alto" ? "中音谱号" : "高音谱号"}${profile.written ? ` · 记谱移调 +${profile.written} 半音` : ""}`;
      document.querySelector("#score-source").innerHTML = state.customAbc
        ? `<span><i data-lucide="lock"></i>本机文件 · 未上传</span>`
        : `<span><i data-lucide="shield-check"></i>${esc(tune.rights)}</span><a href="${esc(tune.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看旋律资料<i data-lucide="external-link"></i></a>`;
      window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
    } catch (error) {
      target.innerHTML = `<div class="score-error"><i data-lucide="circle-alert"></i><strong>ABC 无法解析</strong><span>请检查标题、拍号、默认音符长度、调号与小节内容。</span></div>`;
      showToast?.("ABC 格式有误，请检查后重试");
      window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
    }
  }

  function safeFilename(value) {
    return String(value || "score").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80);
  }

  function downloadAbc(showToast) {
    if (!state.generatedAbc) return;
    const profile = selectedProfile();
    const tune = selectedTune();
    const title = state.customAbc ? state.customTitle || "自有旋律" : tune.title;
    const blob = new Blob([state.generatedAbc], { type: "text/vnd.abc;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(title)}-${safeFilename(profile.name)}.abc`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast?.("ABC 曲谱已下载");
  }

  async function play(showToast) {
    if (!state.visual || !window.ABCJS?.synth?.CreateSynth) return;
    try {
      state.synth?.stop?.();
      const profile = selectedProfile();
      state.synth = new window.ABCJS.synth.CreateSynth();
      await state.synth.init({ visualObj: state.visual, options: { program: profile.program, midiTranspose: -profile.written } });
      await state.synth.prime();
      await state.synth.start();
    } catch {
      showToast?.("当前网络或浏览器暂时无法载入试听音色");
    }
  }

  function mount({ showToast, data } = {}) {
    catalogData = data || null;
    const search = document.querySelector("#tune-search");
    const results = document.querySelector("#tune-results");
    search?.addEventListener("input", () => {
      const needle = normalize(search.value);
      const exactTune = tunes.find(tune => [tune.title, tune.original, ...(tune.aliases || [])].some(label => normalize(label) === needle));
      if (exactTune) {
        state.tuneId = exactTune.id;
        state.customAbc = "";
      }
      results.innerHTML = tuneResults(search.value);
      const hasOpenTune = !needle || tunes.some(tune => normalize([tune.title, tune.original, tune.composer, ...(tune.aliases || [])].join(" ")).includes(needle));
      if (exactTune) {
        makeScore(showToast);
      } else if (!hasOpenTune) {
        const status = document.querySelector("#score-status");
        const currentTitle = state.customAbc ? state.customTitle || "自有 ABC 旋律" : selectedTune()?.title;
        status?.classList.add("warning");
        if (status) status.querySelector("span").textContent = `未生成“${search.value.trim()}” · 下方仍显示${currentTitle}`;
      } else if (!needle) {
        makeScore(showToast);
      }
      window.lucide?.createIcons({ attrs: { "aria-hidden": "true" } });
    });
    results?.addEventListener("click", event => {
      const option = event.target.closest("[data-tune-id]");
      if (!option) return;
      state.tuneId = option.dataset.tuneId;
      state.customAbc = "";
      search.value = selectedTune()?.title || "";
      results.innerHTML = tuneResults(search.value);
      makeScore(showToast);
    });
    document.querySelector("#arranger-instrument")?.addEventListener("change", event => {
      state.profileId = event.target.value;
      makeScore(showToast);
    });
    document.querySelector("#arranger-octave")?.addEventListener("change", event => {
      state.octaveAdjustment = Number(event.target.value) || 0;
      makeScore(showToast);
    });
    document.querySelector("#abc-file")?.addEventListener("change", async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 1024 * 1024) {
        event.target.value = "";
        return showToast?.("文件不能超过 1 MB");
      }
      document.querySelector("#abc-input").value = await file.text();
      showToast?.("文件已在本机读取，请点击应用 ABC");
    });
    document.querySelector("#apply-abc")?.addEventListener("click", () => {
      const value = document.querySelector("#abc-input")?.value.trim();
      if (!value) return showToast?.("请先粘贴或选择 ABC 文件");
      state.customAbc = value;
      state.customTitle = value.match(/^T:(.*)$/m)?.[1]?.trim() || "自有 ABC 旋律";
      results.innerHTML = tuneResults(search.value);
      makeScore(showToast);
    });
    document.querySelector("#play-score")?.addEventListener("click", () => play(showToast));
    document.querySelector("#stop-score")?.addEventListener("click", () => state.synth?.stop?.());
    document.querySelector("#download-abc")?.addEventListener("click", () => downloadAbc(showToast));
    document.querySelector("#print-score")?.addEventListener("click", () => {
      document.body.classList.add("printing-score");
      window.print();
      setTimeout(() => document.body.classList.remove("printing-score"), 500);
    });
    makeScore(showToast);
  }

  window.ScoreAtlasArranger = { page, mount, stop: () => state.synth?.stop?.() };
})();
