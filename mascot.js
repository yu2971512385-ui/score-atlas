(() => {
  "use strict";

  const palettes = [
    { body: "#176b73", bodyShade: "#0f4f58", face: "#fff7df", arm: "#8cd5cf", accent: "#f0675c", bright: "#f6c84b" },
    { body: "#d95757", bodyShade: "#a63d47", face: "#fff4dd", arm: "#f6a09a", accent: "#28757b", bright: "#f3c64f" },
    { body: "#5a568f", bodyShade: "#3f3b73", face: "#fff5dc", arm: "#aaa1dd", accent: "#df6459", bright: "#efc753" },
    { body: "#2e7254", bodyShade: "#1d563e", face: "#fff5db", arm: "#8ac6a7", accent: "#d95a52", bright: "#f1bd46" }
  ];

  const instrumentNames = {
    violin: "小提琴", viola: "中提琴", cello: "大提琴", "double-bass": "低音提琴",
    guitar: "古典吉他", flute: "长笛", oboe: "双簧管", clarinet: "单簧管",
    bassoon: "巴松", horn: "圆号", trumpet: "小号", trombone: "长号",
    recorder: "竖笛", erhu: "二胡", dizi: "笛子", piano: "钢琴"
  };

  const familyByInstrument = {
    violin: "violin", viola: "violin", cello: "cello", "double-bass": "doubleBass",
    guitar: "guitar", flute: "transverse", dizi: "transverse", oboe: "reed",
    clarinet: "reed", recorder: "reed", bassoon: "bassoon", horn: "horn",
    trumpet: "trumpet", trombone: "trombone", erhu: "erhu", piano: "piano"
  };

  const pick = list => list[Math.floor(Math.random() * list.length)];
  const safeId = value => instrumentNames[value] ? value : "violin";
  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  function limb(path, color, width = 15) {
    return `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  function hand(x, y, color, r = 9) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" stroke="#182126" stroke-width="3"/>`;
  }

  function stringInstrument(kind, p) {
    const isViola = kind === "viola";
    const wood = isViola ? "#a95c35" : "#c66a37";
    return `
      ${limb("M127 128 Q151 119 171 125", p.arm)}
      ${limb("M228 134 Q243 147 263 153", p.arm)}
      <g class="sam-instrument sam-instrument--bowed">
        <path d="M154 120 C145 109 153 98 165 106 C176 96 190 104 187 118 C192 132 178 139 166 130 C153 140 143 132 154 120Z" fill="${wood}" stroke="#182126" stroke-width="4"/>
        <path d="M184 116 L251 113" stroke="#182126" stroke-width="7" stroke-linecap="round"/>
        <path d="M243 104 L260 113 L243 122Z" fill="#e0a448" stroke="#182126" stroke-width="3"/>
        <path d="M165 107 L170 132 M176 105 L178 132" stroke="#f7dfab" stroke-width="2"/>
        <path d="M142 155 L273 126" stroke="#f1e2c5" stroke-width="4" stroke-linecap="round"/>
        <path d="M142 151 L134 158" stroke="#182126" stroke-width="5" stroke-linecap="round"/>
      </g>
      ${hand(224, 116, p.arm, 8)}${hand(257, 148, p.arm, 8)}`;
  }

  function cello(p) {
    return `
      ${limb("M127 132 Q155 125 187 126", p.arm)}
      ${limb("M229 137 Q247 151 251 171", p.arm)}
      <g class="sam-instrument sam-instrument--cello">
        <path d="M191 112 L193 153" stroke="#5e3827" stroke-width="8" stroke-linecap="round"/>
        <path d="M187 106 L196 106 L199 115 L184 115Z" fill="#3d2c25"/>
        <path d="M193 146 C174 137 164 153 174 169 C159 188 173 211 193 202 C213 211 227 188 212 169 C222 153 211 137 193 146Z" fill="#b45b35" stroke="#182126" stroke-width="4"/>
        <path d="M193 148 L193 204" stroke="#f5d49b" stroke-width="3"/>
        <path d="M193 202 L193 222" stroke="#182126" stroke-width="3"/>
        <path d="M153 171 L260 171" stroke="#f2e2c4" stroke-width="4" stroke-linecap="round"/>
      </g>
      ${hand(190, 127, p.arm, 8)}${hand(250, 171, p.arm, 8)}`;
  }

  function doubleBass(p) {
    return `
      ${limb("M128 126 Q161 116 225 104", p.arm)}
      ${limb("M230 145 Q249 164 258 182", p.arm)}
      <g class="sam-instrument sam-instrument--bass">
        <path d="M237 81 L239 151" stroke="#553326" stroke-width="9" stroke-linecap="round"/>
        <path d="M233 72 L243 72 L246 84 L230 84Z" fill="#3a2923"/>
        <path d="M239 144 C216 132 205 153 217 173 C198 199 216 224 239 211 C262 224 279 199 261 173 C273 153 261 132 239 144Z" fill="#aa5833" stroke="#182126" stroke-width="4"/>
        <path d="M239 145 L239 214" stroke="#f3d39a" stroke-width="3"/>
        <path d="M195 183 L294 171" stroke="#f2e2c4" stroke-width="4" stroke-linecap="round"/>
      </g>
      ${hand(225, 104, p.arm, 8)}${hand(257, 181, p.arm, 8)}`;
  }

  function guitar(p) {
    return `
      ${limb("M126 133 Q153 145 177 150", p.arm)}
      ${limb("M227 132 Q244 143 251 153", p.arm)}
      <g class="sam-instrument sam-instrument--guitar">
        <path d="M147 143 C136 126 151 113 166 124 C174 106 198 113 196 134 C215 144 208 168 187 168 C175 186 151 176 155 158 C143 158 138 151 147 143Z" fill="#d39a4a" stroke="#182126" stroke-width="4"/>
        <circle cx="174" cy="145" r="10" fill="#563c2c" stroke="#182126" stroke-width="3"/>
        <path d="M192 139 L271 124" stroke="#70472d" stroke-width="13" stroke-linecap="round"/>
        <path d="M262 115 L282 119 L278 134 L261 130Z" fill="#5c3a29" stroke="#182126" stroke-width="3"/>
        <path d="M169 129 L185 165 M175 127 L191 161" stroke="#f7e2b7" stroke-width="2"/>
      </g>
      ${hand(181, 149, p.arm, 8)}${hand(250, 129, p.arm, 8)}`;
  }

  function transverse(kind, p) {
    const isDizi = kind === "dizi";
    const color = isDizi ? "#5a8e4f" : "#c9d9dc";
    return `
      ${limb("M124 130 Q145 116 157 118", p.arm)}
      ${limb("M228 132 Q214 116 204 118", p.arm)}
      <g class="sam-instrument sam-instrument--wind">
        <path d="M98 118 L276 118" stroke="#182126" stroke-width="10" stroke-linecap="round"/>
        <path d="M98 118 L276 118" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
        ${isDizi ? '<path d="M113 108 L121 118 L113 128" fill="#d5544f"/>' : '<circle cx="269" cy="118" r="7" fill="#e5eef0" stroke="#182126" stroke-width="3"/>'}
        <g fill="#182126">${[135, 158, 181, 205, 230].map(x => `<circle cx="${x}" cy="118" r="3"/>`).join("")}</g>
      </g>
      ${hand(153, 118, p.arm, 8)}${hand(207, 118, p.arm, 8)}`;
  }

  function reed(kind, p) {
    const recorder = kind === "recorder";
    const oboe = kind === "oboe";
    const color = recorder ? "#d9be83" : oboe ? "#6c342b" : "#2e3032";
    const bell = recorder ? "" : '<path d="M216 200 L241 207 L229 218 L211 209Z" fill="#20282b" stroke="#182126" stroke-width="3"/>';
    return `
      ${limb("M126 133 Q156 143 183 150", p.arm)}
      ${limb("M228 133 Q218 160 213 184", p.arm)}
      <g class="sam-instrument sam-instrument--reed">
        <path d="M181 116 L221 207" stroke="#182126" stroke-width="12" stroke-linecap="round"/>
        <path d="M181 116 L221 207" stroke="${color}" stroke-width="7" stroke-linecap="round"/>
        ${bell}
        <g fill="#e7c55b">${[141, 159, 178, 194].map((y, i) => `<circle cx="${192 + i * 8}" cy="${y}" r="3"/>`).join("")}</g>
      </g>
      ${hand(190, 149, p.arm, 8)}${hand(214, 184, p.arm, 8)}`;
  }

  function bassoon(p) {
    return `
      ${limb("M126 132 Q150 145 172 163", p.arm)}
      ${limb("M229 137 Q207 166 193 187", p.arm)}
      <g class="sam-instrument sam-instrument--bassoon">
        <path d="M179 116 Q149 120 155 145" fill="none" stroke="#b7c7c8" stroke-width="5"/>
        <path d="M155 139 L193 211" stroke="#182126" stroke-width="17" stroke-linecap="round"/>
        <path d="M155 139 L193 211" stroke="#8f4933" stroke-width="11" stroke-linecap="round"/>
        <path d="M190 203 Q213 215 205 225" fill="none" stroke="#182126" stroke-width="8" stroke-linecap="round"/>
        <path d="M161 157 L182 150 M171 177 L191 169 M181 196 L199 188" stroke="#dbc461" stroke-width="4"/>
      </g>
      ${hand(172, 163, p.arm, 8)}${hand(193, 187, p.arm, 8)}`;
  }

  function horn(p) {
    return `
      ${limb("M127 135 Q151 147 178 151", p.arm)}
      ${limb("M229 134 Q226 158 219 174", p.arm)}
      <g class="sam-instrument sam-instrument--brass">
        <path d="M181 117 L197 136" stroke="#182126" stroke-width="7" stroke-linecap="round"/>
        <path d="M181 117 L197 136" stroke="#e0ae39" stroke-width="4"/>
        <circle cx="202" cy="158" r="34" fill="#e7b63e" stroke="#182126" stroke-width="5"/>
        <circle cx="202" cy="158" r="17" fill="none" stroke="#182126" stroke-width="5"/>
        <path d="M230 141 Q270 129 279 159 Q257 157 230 175Z" fill="#f0c650" stroke="#182126" stroke-width="4"/>
      </g>
      ${hand(181, 151, p.arm, 8)}${hand(221, 172, p.arm, 8)}`;
  }

  function trumpet(p) {
    return `
      ${limb("M126 133 Q151 119 176 118", p.arm)}
      ${limb("M229 132 Q213 119 204 119", p.arm)}
      <g class="sam-instrument sam-instrument--brass">
        <path d="M177 116 L252 116" stroke="#182126" stroke-width="14" stroke-linecap="round"/>
        <path d="M177 116 L252 116" stroke="#e7b63e" stroke-width="9" stroke-linecap="round"/>
        <path d="M246 99 L289 107 L289 125 L246 133Z" fill="#efc956" stroke="#182126" stroke-width="4"/>
        <path d="M208 108 L208 96 M221 108 L221 94 M234 108 L234 97" stroke="#182126" stroke-width="5" stroke-linecap="round"/>
      </g>
      ${hand(177, 118, p.arm, 8)}${hand(212, 118, p.arm, 8)}`;
  }

  function trombone(p) {
    return `
      ${limb("M126 133 Q151 120 176 118", p.arm)}
      ${limb("M229 135 Q251 143 276 146", p.arm)}
      <g class="sam-instrument sam-instrument--brass">
        <path d="M176 116 L252 116" stroke="#182126" stroke-width="13" stroke-linecap="round"/>
        <path d="M176 116 L252 116" stroke="#e3b13d" stroke-width="8" stroke-linecap="round"/>
        <path d="M247 100 L289 106 L289 126 L247 133Z" fill="#efc755" stroke="#182126" stroke-width="4"/>
        <path d="M218 123 L218 151 L299 151 L299 124" fill="none" stroke="#182126" stroke-width="8" stroke-linejoin="round"/>
        <path d="M218 123 L218 151 L299 151 L299 124" fill="none" stroke="#e4b33f" stroke-width="4" stroke-linejoin="round"/>
      </g>
      ${hand(178, 117, p.arm, 8)}${hand(277, 150, p.arm, 8)}`;
  }

  function erhu(p) {
    return `
      ${limb("M126 132 Q153 128 185 126", p.arm)}
      ${limb("M229 135 Q246 151 252 172", p.arm)}
      <g class="sam-instrument sam-instrument--erhu">
        <path d="M191 92 L193 193" stroke="#182126" stroke-width="9" stroke-linecap="round"/>
        <path d="M191 92 L193 193" stroke="#69452f" stroke-width="5"/>
        <path d="M182 88 Q193 77 202 91" fill="none" stroke="#182126" stroke-width="5"/>
        <path d="M179 188 L208 188 L204 209 L181 209Z" fill="#7a4c30" stroke="#182126" stroke-width="4"/>
        <path d="M142 171 L270 171" stroke="#182126" stroke-width="6" stroke-linecap="round"/>
        <path d="M142 171 L270 171" stroke="#e7d6b7" stroke-width="3"/>
      </g>
      ${hand(190, 126, p.arm, 8)}${hand(252, 171, p.arm, 8)}`;
  }

  function piano(p) {
    return `
      ${limb("M132 133 Q151 153 158 173", p.arm)}
      ${limb("M226 133 Q211 155 207 173", p.arm)}
      <g class="sam-instrument sam-instrument--keys">
        <path d="M82 173 H283 V217 H82Z" fill="#f7f1df" stroke="#182126" stroke-width="5"/>
        ${Array.from({ length: 12 }, (_, i) => `<path d="M${82 + i * 16.75} 173 V217" stroke="#182126" stroke-width="2"/>`).join("")}
        ${[1, 2, 4, 5, 6, 8, 9, 11].map(i => `<path d="M${82 + i * 16.75 - 5} 173 H${82 + i * 16.75 + 5} V197 H${82 + i * 16.75 - 5}Z" fill="#182126"/>`).join("")}
        <path d="M69 217 H296 V228 H69Z" fill="#31464a" stroke="#182126" stroke-width="4"/>
      </g>
      ${hand(158, 176, p.arm, 8)}${hand(207, 176, p.arm, 8)}`;
  }

  function instrumentArt(instrumentId, p) {
    const family = familyByInstrument[instrumentId];
    if (family === "violin") return stringInstrument(instrumentId, p);
    if (family === "cello") return cello(p);
    if (family === "doubleBass") return doubleBass(p);
    if (family === "guitar") return guitar(p);
    if (family === "transverse") return transverse(instrumentId, p);
    if (family === "reed") return reed(instrumentId, p);
    if (family === "bassoon") return bassoon(p);
    if (family === "horn") return horn(p);
    if (family === "trumpet") return trumpet(p);
    if (family === "trombone") return trombone(p);
    if (family === "erhu") return erhu(p);
    return piano(p);
  }

  function creature(instrumentId, palette, mood) {
    const expression = mood === "loading"
      ? '<path d="M173 118 Q181 124 189 118" fill="none" stroke="#182126" stroke-width="4" stroke-linecap="round"/>'
      : pick([
        '<path d="M171 116 Q181 130 192 116Z" fill="#d95757" stroke="#182126" stroke-width="3"/>',
        '<path d="M171 121 Q181 113 191 121" fill="none" stroke="#182126" stroke-width="4" stroke-linecap="round"/>',
        '<ellipse cx="181" cy="120" rx="8" ry="6" fill="#d95757" stroke="#182126" stroke-width="3"/>'
      ]);
    return `
      <svg class="sam-svg" viewBox="0 0 360 240" role="img" aria-label="星团音乐精灵正在演奏${escapeHtml(instrumentNames[instrumentId])}">
        <g class="sam-stars" aria-hidden="true">
          <path d="M54 48 L59 61 L73 63 L62 72 L65 86 L54 78 L42 86 L46 72 L35 63 L49 61Z" fill="${palette.bright}"/>
          <circle cx="308" cy="63" r="5" fill="${palette.accent}"/>
          <path d="M300 183 L304 193 L315 194 L307 201 L309 212 L300 206 L291 212 L293 201 L285 194 L296 193Z" fill="${palette.bright}"/>
        </g>
        <g class="sam-creature ${mood === "loading" ? "is-loading" : ""}">
          <path d="M116 113 Q84 120 72 149 Q91 151 113 139" fill="${palette.accent}" stroke="#182126" stroke-width="5" stroke-linejoin="round"/>
          <path d="M144 190 Q130 210 107 210 Q104 226 127 230 Q151 232 163 205" fill="${palette.bodyShade}" stroke="#182126" stroke-width="5"/>
          <path d="M214 190 Q228 210 251 210 Q254 226 231 230 Q207 232 195 205" fill="${palette.bodyShade}" stroke="#182126" stroke-width="5"/>
          <path d="M180 39 C164 58 132 56 118 79 C91 124 105 180 138 202 C162 219 201 216 225 198 C254 175 264 124 241 82 C229 61 202 59 180 39Z" fill="${palette.body}" stroke="#182126" stroke-width="6"/>
          <path d="M128 75 Q180 55 232 78 Q221 104 181 106 Q141 104 128 75Z" fill="${palette.face}" stroke="#182126" stroke-width="4"/>
          <path d="M167 43 L167 24 M193 43 L193 24 M167 24 Q180 10 193 24" fill="none" stroke="#182126" stroke-width="6" stroke-linecap="round"/>
          <circle cx="166" cy="85" r="7" fill="#182126"/><circle cx="197" cy="85" r="7" fill="#182126"/>
          <circle cx="164" cy="82" r="2" fill="white"/><circle cx="195" cy="82" r="2" fill="white"/>
          ${expression}
          ${instrumentArt(instrumentId, palette)}
          <path d="M149 61 Q180 47 213 61" fill="none" stroke="${palette.bright}" stroke-width="5" stroke-linecap="round"/>
        </g>
      </svg>`;
  }

  function markup(instrumentId, palette, loading) {
    const name = instrumentNames[instrumentId];
    return `
      <div class="sam-stage ${loading ? "is-loading" : ""}" data-sam-instrument="${instrumentId}">
        <div class="sam-visual">${creature(instrumentId, palette, loading ? "loading" : "playing")}</div>
        <div class="sam-copy">
          <span class="sam-eyebrow">星团音乐精灵</span>
          <strong>${loading ? "正在整理谱面" : `今天演奏${escapeHtml(name)}`}</strong>
          <small>${loading ? "正在匹配谱号与舒适音域" : "换一种乐器，会遇见新的精灵与演奏姿势"}</small>
        </div>
        <button class="sam-reroll" type="button" aria-label="换一个音乐精灵" title="换一个音乐精灵">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7h-5V2M4 17h5v5M5.7 9A7 7 0 0 1 17 5.1L20 7M4 17l3 1.9A7 7 0 0 0 18.3 15"/></svg>
        </button>
      </div>`;
  }

  function mount(target, options = {}) {
    const root = typeof target === "string" ? document.querySelector(target) : target;
    if (!root) return null;
    let instrumentId = safeId(options.instrumentId || "violin");
    let palette = pick(palettes);
    let loading = Boolean(options.loading);
    let loadingTimer = null;

    root.classList.add("score-atlas-mascot");
    root.setAttribute("aria-live", "polite");

    function render() {
      root.innerHTML = markup(instrumentId, palette, loading);
      root.querySelector(".sam-reroll")?.addEventListener("click", reroll);
    }

    function reroll() {
      const alternatives = palettes.filter(item => item !== palette);
      palette = pick(alternatives.length ? alternatives : palettes);
      render();
    }

    function setInstrument(nextId, updateOptions = {}) {
      const validId = safeId(nextId);
      const changed = validId !== instrumentId;
      instrumentId = validId;
      if (changed || updateOptions.randomize) palette = pick(palettes);
      if (updateOptions.loading === false) loading = false;
      render();
    }

    function setLoading(nextLoading, duration = 0) {
      window.clearTimeout(loadingTimer);
      loading = Boolean(nextLoading);
      render();
      if (loading && duration > 0) {
        loadingTimer = window.setTimeout(() => {
          loading = false;
          render();
        }, duration);
      }
    }

    function destroy() {
      window.clearTimeout(loadingTimer);
      root.replaceChildren();
      root.classList.remove("score-atlas-mascot");
    }

    render();
    return { setInstrument, setLoading, reroll, destroy, get instrumentId() { return instrumentId; } };
  }

  function attachArranger(options = {}) {
    const select = document.querySelector(options.select || "#arranger-instrument");
    if (!select) return null;
    let host = document.querySelector(options.host || "#arranger-mascot");
    if (!host) {
      host = document.createElement("div");
      host.id = (options.host || "#arranger-mascot").replace(/^#/, "");
      host.className = "sam-arranger-slot";
      const anchor = select.closest(options.anchor || ".arranger-controls") || select.parentElement;
      anchor?.insertAdjacentElement(options.position || "afterbegin", host);
    }
    const controller = mount(host, { instrumentId: select.value, loading: true });
    const finishInitialLoad = window.setTimeout(() => controller?.setLoading(false), options.initialLoadMs || 900);
    const onChange = () => {
      controller?.setInstrument(select.value, { randomize: true });
      controller?.setLoading(true, options.changeLoadMs || 620);
    };
    select.addEventListener("change", onChange);
    return {
      ...controller,
      destroy() {
        window.clearTimeout(finishInitialLoad);
        select.removeEventListener("change", onChange);
        controller?.destroy();
      }
    };
  }

  window.ScoreAtlasMascot = { mount, attachArranger, instruments: { ...instrumentNames } };
})();
