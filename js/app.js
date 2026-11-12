/* =====================================================================
   VIATU VIBES — APP
   Pure client-side storefront. Cart, wishlist and customer details are
   kept in localStorage. Orders are sent to the shop via WhatsApp.
   ===================================================================== */
(() => {
  "use strict";

  const CFG = window.VV_CONFIG;
  const PRODUCTS = window.VV_PRODUCTS;
  const COUNTIES = window.VV_COUNTIES;

  /* ---------------- Utilities ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const nf = new Intl.NumberFormat("en-KE");
  const money = (n) => `KES ${nf.format(Math.round(n))}`;
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const debounce = (fn, ms) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };
  const store = {
    get(k, fb) {
      try { const v = localStorage.getItem("vv:" + k); return v ? JSON.parse(v) : fb; } catch { return fb; }
    },
    set(k, v) {
      try { localStorage.setItem("vv:" + k, JSON.stringify(v)); } catch { /* storage unavailable */ }
    },
  };

  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const bySlug = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p]));
  PRODUCTS.forEach((p) => { p.soldOut = p.soldOut || []; });

  const LABEL = {
    cat: { men: "Men", women: "Women", kids: "Kids", unisex: "Unisex" },
    type: { sneakers: "Sneakers", boots: "Boots", formal: "Formal", sandals: "Sandals", heels: "Heels" },
  };
  const PAGE = 12;
  const PRICE_MAX = Math.ceil(Math.max(...PRODUCTS.map((p) => p.price)) / 500) * 500;
  const PRICE_MIN = Math.floor(Math.min(...PRODUCTS.map((p) => p.price)) / 500) * 500;
  const ALL_SIZES = [...new Set(PRODUCTS.flatMap((p) => p.sizes))].sort((a, b) => a - b);
  const BRANDS = [...new Set(PRODUCTS.map((p) => p.brand))].sort();
  const VIBES = (CFG.vibes || []).filter((v) => PRODUCTS.some((p) => (p.vibes || []).includes(v.id)));
  const vibeById = Object.fromEntries(VIBES.map((v) => [v.id, v]));
  const pageUrl = () => location.href.split("#")[0];
  const waLink = (text) => `https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(text)}`;

  /* ---------------- Icons ---------------- */
  const I = (d, extra = "") => `<svg viewBox="0 0 24 24" aria-hidden="true" ${extra}>${d}</svg>`;
  const ICON = {
    heart: I('<path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8 3.6 4.5 7.2 4.5c2 0 3.6 1.1 4.8 2.8 1.2-1.7 2.8-2.8 4.8-2.8 3.6 0 5.7 3.5 4.5 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    minus: I('<path d="M5 12h14"/>'),
    trash: I('<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>'),
    check: I('<path d="m5 12 5 5 9-10"/>'),
    alert: I('<path d="M12 8v5M12 16.5v.01"/>'),
    arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    truck: I('<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
    swap: I('<path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4"/>'),
    phone: I('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10 18h4"/>'),
    pin: I('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    lock: I('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
    share: I('<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4M8.2 13.2l7.6 4"/>'),
    instagram: I('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01"/>'),
    tiktok: I('<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 2.8 2.4 4.5 5 4.7"/>'),
    facebook: I('<path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z"/>'),
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5zm0 1.7a7.8 7.8 0 1 1-4 14.5l-.3-.2-2.8.8.8-2.7-.2-.3A7.8 7.8 0 0 1 12 4.2zM8.6 7.6c-.3.3-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.2.2 1.8 3.2 4.6 4.4 2.8 1.3 3.4 1 4 1 .6 0 1.9-.6 2.2-1.2.3-.6.3-1.3.3-1.5-.1-.1-.2-.2-.5-.3l-1.8-.9c-.3-.1-.4-.1-.6.1l-.7.9c-.1.2-.3.2-.5.1-.3-.1-1-.4-1.8-1.1-.7-.6-1.3-1.3-1.8-2.2-.2-.2-.1-.4 0-.5l.4-.4.4-.6c.1-.2.1-.4 0-.6l-.8-1.9c-.2-.5-.4-.5-.6-.5h-.5c-.3 0-.5 0-.7.4z"/></svg>',
  };

  /* ---------------- Shoe illustrations ---------------- */
  function lum(hex) {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }
  const OUT = 'stroke="rgba(12,12,14,.22)" stroke-width="1.4" stroke-linejoin="round"';

  function shoeSVG(p) {
    const { upper: u, sole: s, accent: a } = p.colors;
    const lace = lum(u) > 0.6 ? "#17171b" : "#ffffff";
    let body = "";
    switch (p.style) {
      case "boot": {
        let laces = "";
        if (!p.noLaces) for (let i = 0; i < 6; i++) { const x = 99 + i * 4.6, y = 32 + i * 6; laces += `<path d="M${x - 7} ${y + 1} L${x + 8} ${y - 3}" stroke="${lace}" stroke-width="3" stroke-linecap="round"/>`; }
        body = `
          <ellipse cx="124" cy="134" rx="104" ry="7" fill="#0c0c0e" opacity=".14"/>
          <path d="M30 104 C27 76 30 46 38 18 C40 13 44 11 49 11 L90 11 C95 11 98 14 98 19 C99 42 104 56 128 64 C168 74 216 78 224 104 Z" fill="${u}" ${OUT}/>
          <path d="M38 18 C40 13 44 11 49 11 L90 11 C95 11 98 14 98 19 L98 26 L36 26 C36 23 37 21 38 18Z" fill="${a}"/>
          <path d="M168 71 C198 76 220 86 224 104 L186 104 C188 92 182 80 168 71Z" fill="#000" opacity=".1"/>
          ${p.noLaces ? `<path d="M60 34 C68 56 68 80 62 102 L78 102 C84 80 82 56 72 34Z" fill="${a}" opacity=".9"/>` : ""}
          <path d="M30 28 C22 28 22 44 30 46" stroke="${a}" stroke-width="4" fill="none" stroke-linecap="round"/>
          ${laces}
          <path d="M22 102 H228 V112 C228 122 222 126 212 126 H34 C26 126 22 122 22 114Z" fill="${s}" ${OUT}/>
          <path d="M24 114 H226" stroke="${a}" stroke-width="2" opacity=".4"/>
          <path d="M48 40 C46 60 46 80 50 96" stroke="#fff" stroke-width="3" opacity=".22" fill="none" stroke-linecap="round"/>`;
        break;
      }
      case "heel":
        body = `
          <ellipse cx="136" cy="134" rx="100" ry="6" fill="#0c0c0e" opacity=".14"/>
          <path d="M38 66 C33 74 34 86 42 94 L50 96 L48 131 L55 131 L63 96 Z" fill="${a}" ${OUT}/>
          <path d="M36 64 C46 58 62 66 80 80 C104 98 146 108 196 106 C216 105 230 108 230 116 C230 124 220 127 206 127 L126 130 C96 130 68 114 54 98 C46 90 38 76 36 64Z" fill="${u}" ${OUT}/>
          <path d="M54 72 C72 84 110 100 160 104 C128 96 92 82 64 66 C58 64 55 67 54 72Z" fill="#000" opacity=".3"/>
          <path d="M126 130 L206 127 C220 127 230 124 230 116" stroke="${s}" stroke-width="3" fill="none"/>
          <path d="M96 104 C126 116 168 118 204 112" stroke="#fff" stroke-width="3" opacity=".28" fill="none" stroke-linecap="round"/>`;
        break;
      case "sandal":
        body = `
          <ellipse cx="124" cy="130" rx="106" ry="6" fill="#0c0c0e" opacity=".14"/>
          <path d="M18 112 C18 103 28 100 44 100 L206 98 C222 98 230 103 230 110 C230 117 222 122 206 122 L42 124 C28 124 18 120 18 112Z" fill="${s}" ${OUT}/>
          <path d="M24 106 C26 102 34 101 44 101 L206 99 C218 99 225 102 226 106 Z" fill="${a}" opacity=".18"/>
          <path d="M34 102 C34 72 58 62 74 78" stroke="${u}" stroke-width="9" fill="none" stroke-linecap="round"/>
          <rect x="62" y="66" width="13" height="11" rx="2.5" fill="none" stroke="${a}" stroke-width="3"/>
          <path d="M86 102 C94 68 132 64 144 100" stroke="${u}" stroke-width="14" fill="none" stroke-linecap="round"/>
          <path d="M158 100 C166 76 194 74 206 98" stroke="${u}" stroke-width="12" fill="none" stroke-linecap="round"/>
          <path d="M96 84 C104 74 122 72 132 80" stroke="#fff" stroke-width="2.5" opacity=".3" fill="none" stroke-linecap="round"/>`;
        break;
      case "loafer":
        body = `
          <ellipse cx="124" cy="130" rx="106" ry="6" fill="#0c0c0e" opacity=".14"/>
          <path d="M22 104 C22 88 32 78 56 76 L110 72 C150 70 196 76 214 88 C224 94 228 100 228 104 Z" fill="${u}" ${OUT}/>
          <path d="M40 80 C62 72 100 70 128 74 C112 82 72 86 40 80Z" fill="#000" opacity=".35"/>
          <path d="M128 76 C152 74 178 78 196 86 L190 94 C170 88 150 86 130 88Z" fill="${a}"/>
          <path d="M156 82 h12" stroke="#000" opacity=".35" stroke-width="3" stroke-linecap="round"/>
          <path d="M118 76 C150 82 186 86 210 94" stroke="#fff" stroke-width="1.4" stroke-dasharray="3 3" opacity=".35" fill="none"/>
          <path d="M18 102 H230 V110 C230 118 224 122 214 122 H32 C24 122 18 118 18 112Z" fill="${s}" ${OUT}/>
          <path d="M18 110 H62 V122 H32 C24 122 18 118 18 112Z" fill="#000" opacity=".18"/>
          <path d="M60 90 C100 88 150 88 200 96" stroke="#fff" stroke-width="3" opacity=".18" fill="none" stroke-linecap="round"/>`;
        break;
      default: {
        let laces = "";
        for (let i = 0; i < 5; i++) { const x = 113 + i * 9.5, y = 35 + i * 5.6; laces += `<path d="M${x - 5} ${y + 5} L${x + 7} ${y - 4}" stroke="${lace}" stroke-width="3" stroke-linecap="round"/>`; }
        body = `
          <ellipse cx="124" cy="132" rx="104" ry="7" fill="#0c0c0e" opacity=".14"/>
          <path d="M24 102 C21 80 30 64 50 60 L84 53 C96 50 104 42 108 31 L111 24 C114 17 123 16 128 21 L142 37 C154 49 172 58 194 65 C214 72 226 86 226 102 Z" fill="${u}" ${OUT}/>
          <path d="M24 102 C22 86 26 74 34 67 L46 63 C40 76 40 90 44 102 Z" fill="${a}"/>
          <path d="M68 92 C108 90 150 76 192 70 C164 84 124 97 72 101 Z" fill="${a}"/>
          <path d="M198 67 C214 73 226 86 226 102 L206 102 C207 88 204 76 198 67Z" fill="#000" opacity=".08"/>
          ${laces}
          <path d="M20 100 H228 V108 C228 118 220 122 210 122 H34 C25 122 20 117 20 110 Z" fill="${s}" ${OUT}/>
          <path d="M22 111 H226" stroke="${a}" stroke-width="2" opacity=".45"/>
          <path d="M56 67 C74 62 92 58 102 48" stroke="#fff" stroke-width="3" opacity=".35" fill="none" stroke-linecap="round"/>`;
      }
    }
    return `<svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${body}</svg>`;
  }

  const media = (p) =>
    p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : shoeSVG(p);
  const bgFor = (p) => (lum(p.colors.upper) > 0.82 ? "#e3eafb" : lum(p.colors.upper) < 0.2 ? "#efe6d6" : "#f2ebdf");

  /* ---------------- State ---------------- */
  const freshFilters = () => ({
    q: "", cats: new Set(), types: new Set(), sizes: new Set(), brands: new Set(),
    maxPrice: PRICE_MAX, sale: false, sort: "featured", vibe: null,
  });
  const state = {
    cart: store.get("cart", []).filter((i) => byId[i.id] && byId[i.id].sizes.includes(i.size)),
    wish: store.get("wish", []).filter((id) => byId[id]),
    promo: store.get("promo", null),
    f: freshFilters(),
    visible: PAGE,
    list: [],
  };
  if (state.promo && !CFG.promoCodes[state.promo]) state.promo = null;

  const saveCart = () => store.set("cart", state.cart);
  const saveWish = () => store.set("wish", state.wish);

  /* ---------------- Price helpers ---------------- */
  const pct = (p) => (p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
  const priceHTML = (p) =>
    `<b>${money(p.price)}</b>${p.oldPrice ? `<s>${money(p.oldPrice)}</s><span class="off">-${pct(p)}%</span>` : ""}`;
  const badgesHTML = (p) => {
    const b = [];
    if (p.badge) b.push(`<span class="badge">${esc(p.badge)}</span>`);
    if (p.oldPrice) b.push(`<span class="badge sale">Sale</span>`);
    return b.length ? `<div class="badges">${b.join("")}</div>` : "";
  };
  const ratingHTML = (p) =>
    p.rating ? `<div class="rating"><span class="stars" aria-label="${p.rating} out of 5">${"★".repeat(Math.round(p.rating))}${"☆".repeat(5 - Math.round(p.rating))}</span>${p.reviews ? `(${p.reviews})` : ""}</div>` : "";

  /* ---------------- Filtering ---------------- */
  function matches(p, f) {
    if (f.sale && !p.oldPrice) return false;
    if (f.vibe && !(p.vibes || []).includes(f.vibe)) return false;
    if (f.cats.size && !(f.cats.has(p.category) || (p.category === "unisex" && (f.cats.has("men") || f.cats.has("women"))))) return false;
    if (f.types.size && !f.types.has(p.type)) return false;
    if (f.brands.size && !f.brands.has(p.brand)) return false;
    if (f.sizes.size && !p.sizes.some((s) => f.sizes.has(s) && !p.soldOut.includes(s))) return false;
    if (p.price > f.maxPrice) return false;
    if (f.q) {
      const hay = [p.name, p.brand, LABEL.type[p.type], LABEL.cat[p.category], p.colorName, p.description].join(" ").toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t))) return false;
    }
    return true;
  }
  const sorters = {
    featured: (a, b) => a.featured - b.featured,
    newest: (a, b) => b.added.localeCompare(a.added),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
  };

  /* ---------------- Rendering: grid ---------------- */
  function card(p, i = 0) {
    const on = state.wish.includes(p.id);
    return `
      <article class="card" style="animation-delay:${(i % PAGE) * 35}ms">
        <div class="card-media" style="--card-bg:${bgFor(p)}">
          <button class="card-open" data-open="${p.id}" aria-label="View ${esc(p.name)}">${media(p)}</button>
          ${badgesHTML(p)}
          <button class="wish-btn ${on ? "on" : ""}" data-wish="${p.id}" aria-pressed="${on}" aria-label="${on ? "Remove from" : "Save to"} wishlist: ${esc(p.name)}">${ICON.heart}</button>
          <button class="quick-add" data-open="${p.id}" tabindex="-1" aria-hidden="true">Choose size</button>
        </div>
        <div class="card-body">
          <p class="card-brand">${esc(p.brand)}</p>
          <h3 class="card-title"><a href="#product/${p.slug}">${esc(p.name)}</a></h3>
          <p class="card-color"><span class="dot" style="background:${p.colors.upper}"></span>${esc(p.colorName)}</p>
          ${ratingHTML(p)}
          <div class="price">${priceHTML(p)}</div>
        </div>
      </article>`;
  }

  function shopTitle() {
    const f = state.f;
    if (f.q) return `Results for “${esc(f.q)}”`;
    if (f.vibe && vibeById[f.vibe]) { const v = vibeById[f.vibe]; return `${v.emoji} ${esc(v.label)} vibes`; }
    if (f.sale && !f.cats.size && !f.types.size) return "Sale";
    const cat = f.cats.size === 1 ? LABEL.cat[[...f.cats][0]] : "";
    const type = f.types.size === 1 ? LABEL.type[[...f.types][0]] : "";
    if (cat && type) return `${cat}'s ${type.toLowerCase()}`;
    if (cat) return cat === "Kids" ? "Kids' shoes" : `${cat}'s shoes`;
    if (type) return type;
    return "All shoes";
  }

  function renderGrid() {
    state.list = PRODUCTS.filter((p) => matches(p, state.f)).sort(sorters[state.f.sort]);
    const n = state.list.length;
    $("#productGrid").innerHTML = state.list.slice(0, state.visible).map(card).join("");
    $("#loadMore").hidden = n <= state.visible;
    $("#emptyState").hidden = n > 0;
    $("#resultCount").textContent = `${n} ${n === 1 ? "style" : "styles"} found`;
    $("#shopHeading").innerHTML = shopTitle();
    if (!n && state.f.q) $("#emptyText").innerHTML = `We couldn't find anything for “${esc(state.f.q)}”. Try another search or clear filters.`;
    else $("#emptyText").textContent = "Try removing a filter or searching for something else.";
    renderActiveFilters();
  }

  function loadMore() {
    const start = state.visible;
    state.visible += PAGE;
    $("#productGrid").insertAdjacentHTML("beforeend", state.list.slice(start, state.visible).map(card).join(""));
    $("#loadMore").hidden = state.list.length <= state.visible;
  }

  /* ---------------- Rendering: filters ---------------- */
  function filtersHTML(prefix) {
    const count = (fn) => PRODUCTS.filter(fn).length;
    const checks = (group, entries) =>
      entries.map(([val, label, n]) => `
        <label class="check"><input type="checkbox" data-filter="${group}" value="${esc(val)}"> ${esc(label)} <small>${n}</small></label>`).join("");
    return `
      <div class="filter-group">
        <label class="switch"><span>On sale only</span><input type="checkbox" data-filter="sale"></label>
      </div>
      <div class="filter-group">
        <h3>Category</h3>
        ${checks("cats", Object.entries(LABEL.cat).map(([k, v]) => [k, v, count((p) => p.category === k)]))}
      </div>
      <div class="filter-group">
        <h3>Type</h3>
        ${checks("types", Object.entries(LABEL.type).map(([k, v]) => [k, v, count((p) => p.type === k)]))}
      </div>
      <div class="filter-group">
        <h3>Size (EU)</h3>
        <div class="size-grid">${ALL_SIZES.map((s) => `<button type="button" class="size-chip" data-size-filter="${s}" aria-pressed="false">${s}</button>`).join("")}</div>
      </div>
      <div class="filter-group">
        <h3><label for="${prefix}Price">Max price</label></h3>
        <input type="range" id="${prefix}Price" data-filter="price" min="${PRICE_MIN}" max="${PRICE_MAX}" step="100" value="${PRICE_MAX}">
        <div class="range-row"><span>${money(PRICE_MIN)}</span><b data-price-label>${money(PRICE_MAX)}</b></div>
      </div>
      <div class="filter-group">
        <h3>Brand</h3>
        ${checks("brands", BRANDS.map((b) => [b, b, count((p) => p.brand === b)]))}
      </div>`;
  }

  function syncFilters() {
    const f = state.f;
    $$("[data-filter]").forEach((el) => {
      const g = el.dataset.filter;
      if (g === "sale") el.checked = f.sale;
      else if (g === "price") el.value = f.maxPrice;
      else el.checked = f[g].has(el.value);
    });
    $$("[data-size-filter]").forEach((el) => el.setAttribute("aria-pressed", f.sizes.has(+el.dataset.sizeFilter)));
    $$("[data-price-label]").forEach((el) => (el.textContent = money(f.maxPrice)));
    $$("[data-vibe]").forEach((el) => el.setAttribute("aria-pressed", f.vibe === el.dataset.vibe));
    $("#sortSelect").value = f.sort;
    if ($("#searchInput").value !== f.q) $("#searchInput").value = f.q;
    const n = f.cats.size + f.types.size + f.sizes.size + f.brands.size + (f.sale ? 1 : 0) + (f.maxPrice < PRICE_MAX ? 1 : 0) + (f.vibe ? 1 : 0);
    const fc = $("#filterCount");
    fc.hidden = !n;
    fc.textContent = n;
  }

  function renderActiveFilters() {
    const f = state.f;
    const chips = [];
    const chip = (kind, val, label) => chips.push(`<button class="chip" data-chip="${kind}" data-val="${esc(val)}">${esc(label)} <span aria-hidden="true">×</span><b class="sr-only">Remove filter</b></button>`);
    if (f.q) chip("q", "", `“${f.q}”`);
    if (f.vibe && vibeById[f.vibe]) chip("vibe", "", `${vibeById[f.vibe].emoji} ${vibeById[f.vibe].label}`);
    if (f.sale) chip("sale", "", "On sale");
    f.cats.forEach((c) => chip("cats", c, LABEL.cat[c]));
    f.types.forEach((t) => chip("types", t, LABEL.type[t]));
    f.sizes.forEach((s) => chip("sizes", s, `EU ${s}`));
    f.brands.forEach((b) => chip("brands", b, b));
    if (f.maxPrice < PRICE_MAX) chip("price", "", `Under ${money(f.maxPrice)}`);
    if (chips.length > 1) chips.push(`<button class="chip chip-clear" data-action="clear-filters">Clear all</button>`);
    $("#activeFilters").innerHTML = chips.join("");
  }

  function applyFilters() {
    state.visible = PAGE;
    syncFilters();
    renderGrid();
  }

  function quickFilter({ cat, type, sale, vibe }) {
    const sort = state.f.sort;
    state.f = freshFilters();
    state.f.sort = sort;
    if (vibe) state.f.vibe = vibe;
    if (cat) state.f.cats.add(cat);
    if (type) state.f.types.add(type);
    if (sale) state.f.sale = true;
    applyFilters();
  }

  /* ---------------- Hero showcase (rotating featured shoes) ---------------- */
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const HERO = (CFG.heroShoes || []).map((s) => bySlug[s]).filter(Boolean);
  if (!HERO.length) HERO.push(...[...PRODUCTS].sort(sorters.featured).slice(0, 4));
  let heroIdx = 0;
  let heroTimer = null;

  function discFor(p) {
    const l = lum(p.colors.upper);
    if (l > 0.75) return "#1f4fe0"; // light shoe on blue
    if (l < 0.15) return "#c9b48f"; // dark shoe on beige
    const n = parseInt(p.colors.upper.slice(1), 16);
    const isBlue = (n & 255) > ((n >> 16) & 255) + 60;
    return isBlue ? "#0c0c0e" : "#1f4fe0";
  }

  function renderHero() {
    $("#heroSlides").innerHTML = HERO.map((p, i) => `
      <button type="button" class="hero-slide" data-open="${p.id}" aria-label="View ${esc(p.name)}" tabindex="-1">
        <span>${media(p)}</span>
      </button>`).join("");
    $("#heroThumbs").innerHTML = HERO.length > 1
      ? HERO.map((p, i) => `<button type="button" class="hero-thumb" data-hero="${i}" aria-pressed="false" aria-label="Show ${esc(p.name)}">${media(p)}</button>`).join("")
      : "";
    showHero(heroIdx, true);
  }

  function showHero(i, instant = false) {
    const prev = heroIdx;
    heroIdx = (i + HERO.length) % HERO.length;
    const slides = $$(".hero-slide");
    slides.forEach((s, n) => {
      const on = n === heroIdx;
      s.classList.toggle("active", on);
      s.classList.toggle("leaving", !instant && n === prev && !on);
      s.tabIndex = on ? 0 : -1;
      s.setAttribute("aria-hidden", String(!on));
    });
    setTimeout(() => slides.forEach((s) => s.classList.remove("leaving")), 800);
    $$(".hero-thumb").forEach((b, n) => b.setAttribute("aria-pressed", String(n === heroIdx)));
    const p = HERO[heroIdx];
    $("#heroDisc").style.backgroundColor = discFor(p);
    const tag = $("#heroTag");
    tag.dataset.open = p.id;
    tag.setAttribute("aria-label", `View ${p.name}, ${money(p.price)}`);
    tag.innerHTML = `
      <small>${esc(p.badge || (p.oldPrice ? "On sale" : LABEL.type[p.type]))}</small>
      <b>${esc(p.name)}</b>
      <span>${money(p.price)}${p.oldPrice ? ` · <s>${money(p.oldPrice)}</s>` : ""}</span>
      <em>View &amp; choose size →</em>`;
    if (!instant) { tag.classList.remove("swap"); void tag.offsetWidth; tag.classList.add("swap"); }
  }

  function startHero() {
    stopHero();
    if (!reducedMotion && HERO.length > 1) heroTimer = setInterval(() => showHero(heroIdx + 1), 4500);
  }
  function stopHero() { clearInterval(heroTimer); heroTimer = null; }

  (() => {
    const hv = $("#heroVisual");
    hv.addEventListener("mouseenter", stopHero);
    hv.addEventListener("mouseleave", startHero);
    hv.addEventListener("focusin", stopHero);
    hv.addEventListener("focusout", startHero);
    let x0 = null;
    hv.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; stopHero(); }, { passive: true });
    hv.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) showHero(heroIdx + (dx < 0 ? 1 : -1));
      x0 = null;
      startHero();
    });
    document.addEventListener("visibilitychange", () => (document.hidden ? stopHero() : startHero()));
  })();

  /* ---------------- Real photos: auto-detect images/<slug>.jpg|png|webp ---------------- */
  function probePhotos() {
    if (CFG.autoPhotos === false) return;
    const exts = ["jpg", "png", "webp"];
    const jobs = PRODUCTS.filter((p) => !p.image).map((p) => new Promise((done) => {
      let i = 0;
      const img = new Image();
      img.onload = () => { p.image = `images/${p.slug}.${exts[i]}`; done(true); };
      img.onerror = () => { if (++i < exts.length) img.src = `images/${p.slug}.${exts[i]}`; else done(false); };
      img.src = `images/${p.slug}.${exts[0]}`;
    }));
    Promise.all(jobs).then((found) => {
      if (!found.some(Boolean)) return;
      renderHero();
      renderCategories();
      renderGrid();
      renderCart();
      renderWish();
    });
  }

  /* ---------------- Vibe picker ---------------- */
  function renderVibes() {
    const row = $("#vibeRow");
    if (!VIBES.length) { row.closest("section").hidden = true; return; }
    row.innerHTML = VIBES.map((v) => `
      <button type="button" class="vibe" data-vibe="${esc(v.id)}" aria-pressed="false">
        <span class="emoji" aria-hidden="true">${v.emoji}</span>
        <b>${esc(v.label)}</b><small>${esc(v.sub || "")}</small>
      </button>`).join("");
  }

  /* ---------------- Categories ---------------- */
  function renderCategories() {
    const cats = [
      { label: "Men", sub: "Sneakers, boots & formal", cls: "c-black", pid: "p2", act: 'data-cat="men"' },
      { label: "Women", sub: "Heels, sandals & more", cls: "c-blue", pid: "p7", act: 'data-cat="women"' },
      { label: "Kids", sub: "Play & school shoes", cls: "c-white", pid: "p11", act: 'data-cat="kids"' },
      { label: "Sale", sub: "Limited-time deals", cls: "", pid: "p1", act: 'data-sale="1"' },
    ];
    $("#catGrid").innerHTML = cats.map((c) => `
      <a href="#shop" class="cat-card ${c.cls}" ${c.act}>
        <span class="cat-art">${media(byId[c.pid])}</span>
        <span class="cat-label">
          <span><h3>${c.label}</h3><small>${c.sub}</small></span>
          <span class="arrow">${ICON.arrow}</span>
        </span>
      </a>`).join("");
  }

  /* ---------------- Dialog helpers ---------------- */
  function openDialog(d) {
    if (!d.open) d.showModal();
    document.documentElement.classList.add("lock");
  }
  function closeDialog(d) {
    if (d && d.open) d.close();
  }
  function onDialogClosed() {
    if (!$$("dialog").some((d) => d.open)) document.documentElement.classList.remove("lock");
  }
  $$("dialog").forEach((d) => {
    d.addEventListener("close", onDialogClosed);
    d.addEventListener("click", (e) => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
  });

  /* ---------------- Toasts ---------------- */
  function toast(msg, { error = false, action, onAction } = {}) {
    const el = document.createElement("div");
    el.className = "toast" + (error ? " error" : "");
    el.innerHTML = `<span class="t-icon">${error ? ICON.alert : ICON.check}</span><span>${esc(msg)}</span>${action ? `<button type="button">${esc(action)}</button>` : ""}`;
    if (action) el.querySelector("button").addEventListener("click", () => { onAction?.(); dismiss(); });
    $("#toasts").appendChild(el);
    const dismiss = () => { el.classList.add("out"); setTimeout(() => el.remove(), 260); };
    setTimeout(dismiss, 3200);
  }

  /* ---------------- Wishlist ---------------- */
  function toggleWish(id) {
    const p = byId[id];
    const i = state.wish.indexOf(id);
    if (i > -1) state.wish.splice(i, 1);
    else state.wish.push(id);
    saveWish();
    const on = i === -1;
    $$(`[data-wish="${id}"]`).forEach((b) => {
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on);
      b.setAttribute("aria-label", `${on ? "Remove from" : "Save to"} wishlist: ${p.name}`);
    });
    renderWish();
    bump("#wishCount");
    toast(on ? `${p.name} saved to wishlist` : `${p.name} removed from wishlist`, on ? { action: "View", onAction: () => openDialog($("#wishDrawer")) } : {});
  }

  function renderWish() {
    const n = state.wish.length;
    const c = $("#wishCount");
    c.hidden = !n;
    c.textContent = n;
    const bw = $("#bnWish");
    bw.hidden = !n;
    bw.textContent = n;
    $("#wishBody").innerHTML = n
      ? state.wish.map((id) => {
          const p = byId[id];
          return `
            <div class="cart-item">
              <button class="cart-thumb" style="--card-bg:${bgFor(p)}" data-open="${p.id}" aria-label="View ${esc(p.name)}">${media(p)}</button>
              <div class="cart-info">
                <div class="cart-top">
                  <div><h4>${esc(p.name)}</h4><small>${esc(p.colorName)}</small></div>
                  <button class="remove-btn" data-wish="${p.id}" aria-label="Remove ${esc(p.name)} from wishlist">${ICON.trash}</button>
                </div>
                <div class="cart-row">
                  <div class="price" style="padding:0">${priceHTML(p)}</div>
                  <button class="btn btn-dark" style="min-height:38px;padding:0 16px;font-size:14px" data-open="${p.id}">Choose size</button>
                </div>
              </div>
            </div>`;
        }).join("")
      : `<div class="drawer-empty">
          <div class="art">${shoeSVG(byId.p6)}</div>
          <h3>No favourites yet</h3>
          <p>Tap the heart on any shoe to save it for later.</p>
          <a href="#shop" class="btn btn-primary" data-close>Browse shoes</a>
        </div>`;
  }

  /* ---------------- Cart ---------------- */
  const key = (i) => `${i.id}|${i.size}`;
  const MAX_QTY = 10;

  function addToCart(id, size, qty = 1) {
    const ex = state.cart.find((i) => i.id === id && i.size === size);
    if (ex) ex.qty = Math.min(MAX_QTY, ex.qty + qty);
    else state.cart.push({ id, size, qty: Math.min(MAX_QTY, qty) });
    saveCart();
    renderCart();
    bump("#cartCount");
  }
  function setQty(k, qty) {
    const item = state.cart.find((i) => key(i) === k);
    if (!item) return;
    if (qty <= 0) return removeItem(k);
    item.qty = Math.min(MAX_QTY, qty);
    saveCart();
    renderCart();
  }
  function removeItem(k) {
    const idx = state.cart.findIndex((i) => key(i) === k);
    if (idx < 0) return;
    const [removed] = state.cart.splice(idx, 1);
    saveCart();
    renderCart();
    toast(`${byId[removed.id].name} removed`, {
      action: "Undo",
      onAction: () => { state.cart.splice(idx, 0, removed); saveCart(); renderCart(); },
    });
  }

  function totals(delivery) {
    const items = state.cart.reduce((n, i) => n + i.qty, 0);
    const subtotal = state.cart.reduce((n, i) => n + byId[i.id].price * i.qty, 0);
    let discount = 0, promoNote = "";
    const promo = state.promo && CFG.promoCodes[state.promo];
    if (promo) {
      if (promo.min && subtotal < promo.min) promoNote = `Add ${money(promo.min - subtotal)} more to use ${state.promo}`;
      else discount = promo.type === "percent" ? Math.round((subtotal * promo.value) / 100) : Math.min(promo.value, subtotal);
    }
    const afterDiscount = subtotal - discount;
    const fee = delivery ? delivery.fee : 0;
    return { items, subtotal, discount, promoNote, afterDiscount, fee, total: afterDiscount + fee };
  }

  function deliveryFor(method, county, afterDiscount) {
    if (method === "pickup") return { fee: CFG.pickup.fee, label: "Pickup", eta: "Ready in 2 – 4 hours", free: CFG.pickup.fee === 0 };
    if (!county) return null;
    const tier = CFG.deliveryTiers[CFG.countyTiers[county] || "other"];
    const free = CFG.freeDeliveryCounties.includes(county) && afterDiscount >= CFG.freeDeliveryThreshold;
    return { fee: free ? 0 : tier.fee, label: county, eta: tier.eta, free };
  }

  function promoHTML() {
    if (state.promo) {
      const p = CFG.promoCodes[state.promo];
      return `<div class="promo-applied"><span><b>${esc(state.promo)}</b> · ${esc(p.label || "")}</span><button type="button" data-action="remove-promo">Remove</button></div>`;
    }
    return `<form class="promo-form" data-promo-form>
      <input name="code" placeholder="Promo code" autocomplete="off" aria-label="Promo code">
      <button class="btn btn-outline" type="submit">Apply</button>
    </form>`;
  }

  function applyPromo(code) {
    code = code.trim().toUpperCase();
    if (!code) return;
    if (!CFG.promoCodes[code]) return toast("That promo code isn't valid", { error: true });
    state.promo = code;
    store.set("promo", code);
    renderCart();
    if ($("#checkoutModal").open) renderCoSummary();
    const t = totals();
    toast(t.promoNote || `Sawa! ${code} applied`, { error: !!t.promoNote });
  }

  function renderCart() {
    const t = totals();
    const c = $("#cartCount");
    c.hidden = !t.items;
    c.textContent = t.items;
    $("#cartTitle").textContent = t.items ? `Your cart (${t.items})` : "Your cart";
    const bc = $("#bnCart");
    bc.hidden = !t.items;
    bc.textContent = t.items;

    if (!state.cart.length) {
      $("#cartBody").innerHTML = `
        <div class="drawer-empty">
          <div class="art">${shoeSVG(byId.p8)}</div>
          <h3>Kikapu chako kiko tupu</h3>
          <p>Your cart is empty. Let's find you a pair with some vibe.</p>
          <a href="#shop" class="btn btn-primary" data-close>Start shopping</a>
        </div>`;
      $("#cartFoot").hidden = true;
      return;
    }
    $("#cartFoot").hidden = false;
    $("#cartBody").innerHTML = state.cart.map((i) => {
      const p = byId[i.id];
      const k = key(i);
      return `
        <div class="cart-item">
          <button class="cart-thumb" style="--card-bg:${bgFor(p)}" data-open="${p.id}" aria-label="View ${esc(p.name)}">${media(p)}</button>
          <div class="cart-info">
            <div class="cart-top">
              <div><h4>${esc(p.name)}</h4><small>${esc(p.colorName)} · EU ${i.size}</small></div>
              <button class="remove-btn" data-remove="${k}" aria-label="Remove ${esc(p.name)}">${ICON.trash}</button>
            </div>
            <div class="cart-row">
              <div class="qty">
                <button type="button" data-qty="${k}" data-delta="-1" aria-label="Decrease quantity">${ICON.minus}</button>
                <span aria-live="polite">${i.qty}</span>
                <button type="button" data-qty="${k}" data-delta="1" aria-label="Increase quantity" ${i.qty >= MAX_QTY ? "disabled" : ""}>${ICON.plus}</button>
              </div>
              <span class="line-price">${money(p.price * i.qty)}</span>
            </div>
          </div>
        </div>`;
    }).join("");

    const left = CFG.freeDeliveryThreshold - t.afterDiscount;
    const progress = Math.min(100, (t.afterDiscount / CFG.freeDeliveryThreshold) * 100);
    $("#cartFoot").innerHTML = `
      <div class="free-bar">
        ${left > 0 ? `You're <b>${money(left)}</b> away from free Nairobi delivery` : `🎉 You qualify for <b>free delivery in Nairobi</b>`}
        <div class="bar"><i style="width:${progress}%"></i></div>
      </div>
      ${promoHTML()}
      <div class="totals">
        <div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        ${t.discount ? `<div class="discount"><span>Discount (${esc(state.promo)})</span><span>-${money(t.discount)}</span></div>` : ""}
        ${t.promoNote ? `<div class="note"><span>${esc(t.promoNote)}</span></div>` : ""}
        <div class="note"><span>Delivery</span><span>Calculated at checkout</span></div>
        <div class="grand"><span>Total</span><span>${money(t.afterDiscount)}</span></div>
      </div>
      <button class="btn btn-primary btn-lg btn-block" data-action="checkout">Checkout</button>
      <button class="btn btn-outline btn-block" data-close>Continue shopping</button>`;
  }

  function bump(sel) {
    const el = $(sel);
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  /* ---------------- Product modal ---------------- */
  let sel = null;
  const pm = $("#productModal");

  function renderProduct(p) {
    sel = { id: p.id, size: null, qty: 1 };
    const on = state.wish.includes(p.id);
    const related = PRODUCTS.filter((x) => x.id !== p.id)
      .map((x) => ({ x, s: (x.type === p.type ? 2 : 0) + (x.category === p.category ? 1 : 0) }))
      .sort((a, b) => b.s - a.s || a.x.featured - b.x.featured)
      .slice(0, 4).map((r) => r.x);
    $("#productContent").innerHTML = `
      <div class="pm">
        <div class="pm-media" style="--card-bg:${bgFor(p)}">${badgesHTML(p)}${media(p)}</div>
        <div class="pm-info">
          <p class="card-brand">${esc(p.brand)} · ${LABEL.cat[p.category]} · ${LABEL.type[p.type]}</p>
          <h2 id="pmTitle">${esc(p.name)}</h2>
          ${ratingHTML(p)}
          <div class="price">${priceHTML(p)}</div>
          <p class="card-color" style="display:flex"><span class="dot" style="background:${p.colors.upper}"></span>${esc(p.colorName)}</p>

          <div class="pm-label"><span id="sizeLabel">Select size (EU)</span><button type="button" class="link-btn" data-action="size-guide">Size guide</button></div>
          <div class="pm-sizes" role="group" aria-labelledby="sizeLabel">
            ${p.sizes.map((s) => {
              const out = p.soldOut.includes(s);
              return `<button type="button" class="size-chip" data-size="${s}" aria-pressed="false" ${out ? `disabled title="EU ${s} sold out" aria-label="EU ${s}, sold out"` : `aria-label="EU ${s}"`}>${s}</button>`;
            }).join("")}
          </div>
          <p class="size-hint" id="sizeHint" aria-live="polite"></p>

          <div class="pm-actions">
            <div class="qty qty-lg">
              <button type="button" data-pmqty="-1" aria-label="Decrease quantity">${ICON.minus}</button>
              <span id="pmQty" aria-live="polite">1</span>
              <button type="button" data-pmqty="1" aria-label="Increase quantity">${ICON.plus}</button>
            </div>
            <button class="btn btn-primary btn-lg" data-add>Add to cart</button>
            <button class="wish-btn ${on ? "on" : ""}" data-wish="${p.id}" aria-pressed="${on}" aria-label="${on ? "Remove from" : "Save to"} wishlist: ${esc(p.name)}">${ICON.heart}</button>
          </div>

          <button type="button" class="btn btn-outline btn-block ask-wa" data-ask>${ICON.whatsapp} Ask about this shoe on WhatsApp</button>

          <div class="eta">
            <label for="etaCounty">${ICON.truck}<span>Uko wapi? <small>Check delivery to your county</small></span></label>
            <select id="etaCounty" data-eta>
              <option value="">Select your county</option>
              ${COUNTIES.map((c) => `<option ${c === (store.get("customer", {}).county || "") ? "selected" : ""}>${esc(c)}</option>`).join("")}
            </select>
            <p class="eta-out" id="etaOut" aria-live="polite"></p>
          </div>

          <p class="pm-desc">${esc(p.description)}</p>
          <ul class="feature-list">${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
          <div class="pm-perks">
            <div>${ICON.swap}<span>Free size exchange within 7 days</span></div>
            <div>${ICON.phone}<span>Pay with M-Pesa${CFG.cashOnDeliveryCounties.length ? " or cash on delivery in " + CFG.cashOnDeliveryCounties.join(", ") : ""}</span></div>
          </div>
          <div class="pm-share"><button type="button" class="link-btn" data-action="share">Share this shoe</button></div>
        </div>
      </div>
      <div class="related">
        <h3>You may also like</h3>
        <div class="related-grid">
          ${related.map((r) => `
            <button class="mini-card" data-open="${r.id}">
              <div class="mini-media" style="--card-bg:${bgFor(r)}">${media(r)}</div>
              <div><b>${esc(r.name)}</b><span>${money(r.price)}</span></div>
            </button>`).join("")}
        </div>
      </div>`;
    // Pre-select the customer's usual size
    const my = store.get("mySize", {})[sizeGroup(p)];
    if (my && p.sizes.includes(my) && !p.soldOut.includes(my)) {
      sel.size = my;
      $(`.pm-sizes [data-size="${my}"]`).setAttribute("aria-pressed", "true");
      const h = $("#sizeHint");
      h.textContent = `Your usual size (EU ${my}) is selected. Tap another size to change.`;
      h.classList.add("ok");
    }
    updateEta();
    pm.scrollTop = 0;
    document.title = `${p.name} — ${CFG.storeName}`;
  }

  const sizeGroup = (p) => (p.category === "kids" ? "kids" : "adult");

  function etaLabel(county) {
    const tier = CFG.deliveryTiers[CFG.countyTiers[county] || "other"];
    if (!tier.days) return tier.eta;
    const now = new Date();
    let [a, b] = tier.days;
    if (a === 0 && now.getHours() >= (CFG.sameDayCutoffHour ?? 14)) a = 1;
    b = Math.max(a, b);
    const name = (n) => {
      if (n === 0) return "Leo (today)";
      if (n === 1) return "Kesho (tomorrow)";
      const d = new Date(now);
      d.setDate(d.getDate() + n);
      return d.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" });
    };
    return a === b ? name(a) : `${name(a)} – ${name(b)}`;
  }

  function updateEta() {
    const out = $("#etaOut");
    if (!out || !sel) return;
    const county = $("#etaCounty").value;
    const t = CFG.deliveryTiers;
    if (!county) {
      out.innerHTML = `Nairobi from ${money(t.nairobi.fee)} (free over ${money(CFG.freeDeliveryThreshold)}) · rest of Kenya from ${money(t.metro.fee)}`;
      return;
    }
    const d = deliveryFor("delivery", county, byId[sel.id].price * sel.qty);
    const sameDay = CFG.deliveryTiers[CFG.countyTiers[county] || "other"].days?.[0] === 0 && new Date().getHours() < (CFG.sameDayCutoffHour ?? 14);
    out.innerHTML = `Arrives <b>${etaLabel(county)}</b> · ${d.fee ? money(d.fee) : "<b>Free delivery</b>"}` +
      (sameDay ? ` · order before ${CFG.sameDayCutoffHour ?? 14}:00 for same-day` : "");
  }

  function openProduct(id) {
    const p = byId[id];
    if (!p) return;
    $$("dialog.drawer[open]").forEach((d) => d.close());
    const h = `#product/${p.slug}`;
    if (location.hash !== h) location.hash = h; // route() renders
    else showProduct(p);
  }
  function showProduct(p) {
    renderProduct(p);
    openDialog(pm);
  }
  pm.addEventListener("close", () => {
    document.title = "Viatu Vibes — Shoes Delivered Across Kenya";
    if (location.hash.startsWith("#product/")) history.replaceState(null, "", location.pathname + location.search);
  });

  function route() {
    const m = location.hash.match(/^#product\/([\w-]+)/);
    if (m && bySlug[m[1]]) showProduct(bySlug[m[1]]);
    else if (pm.open) pm.close();
  }

  function addFromModal() {
    const p = byId[sel.id];
    if (!sel.size) {
      const g = $(".pm-sizes");
      g.classList.remove("shake");
      void g.offsetWidth;
      g.classList.add("shake");
      $("#sizeHint").textContent = "Chagua saizi: please choose your size first.";
      $("#sizeHint").classList.remove("ok");
      g.querySelector(".size-chip:not(:disabled)")?.focus();
      return;
    }
    addToCart(p.id, sel.size, sel.qty);
    pm.close();
    openDialog($("#cartDrawer"));
    toast(`Poa! ${p.name} (EU ${sel.size}) added to your cart`);
  }

  async function shareProduct() {
    const p = byId[sel.id];
    const url = `${pageUrl()}#product/${p.slug}`;
    const text = `Check out the ${p.name} at ${CFG.storeName}, ${money(p.price)}`;
    if (navigator.share) {
      try { await navigator.share({ title: p.name, text, url }); } catch { /* cancelled */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied to clipboard");
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank", "noopener");
    }
  }

  function askOnWhatsApp() {
    const p = byId[sel.id];
    const msg = `Habari ${CFG.storeName}! 👋 Is the ${p.name} (${p.colorName})${sel.size ? ` in EU ${sel.size}` : ""} available?\n${pageUrl()}#product/${p.slug}`;
    window.open(waLink(msg), "_blank", "noopener");
  }

  async function copyText(txt, label) {
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = txt;
      ta.style.cssText = "position:fixed;opacity:0";
      ($("dialog[open]") || document.body).appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      ta.remove();
    }
    toast(`Copied ${label || txt}`);
  }

  /* ---------------- Checkout ---------------- */
  const co = { method: "delivery", county: "", payment: "mpesa" };
  const coModal = $("#checkoutModal");

  function normPhone(v) {
    const d = String(v).replace(/[\s\-().]/g, "");
    const m = d.match(/^(?:\+?254|0)?([17]\d{8})$/);
    return m ? "254" + m[1] : null;
  }
  const prettyPhone = (n) => `0${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`;

  function codAllowed() {
    return co.method === "pickup" || CFG.cashOnDeliveryCounties.includes(co.county);
  }

  function openCheckout() {
    if (!state.cart.length) return;
    const saved = store.get("customer", {});
    co.method = saved.method === "pickup" ? "pickup" : "delivery";
    co.county = saved.county || "";
    co.payment = "mpesa";
    const field = (id, label, attrs = "", err = "") => `
      <div class="field" data-field="${id}">
        <label for="co-${id}">${label}</label>
        <input id="co-${id}" name="${id}" ${attrs} value="${esc(saved[id] || "")}">
        ${err ? `<span class="err">${err}</span>` : ""}
      </div>`;
    $("#checkoutContent").innerHTML = `
      <div class="co">
        <form class="co-form" id="coForm" novalidate>
          <h2 id="coTitle">Checkout</h2>
          <p class="muted">No account needed. Your order is sent to us on WhatsApp and we confirm it right away.</p>

          <fieldset class="fieldset">
            <legend>Your details</legend>
            <div class="field-row">
              ${field("name", "Full name", 'autocomplete="name" required', "Please enter your name")}
              ${field("phone", "Phone (M-Pesa)", 'type="tel" inputmode="tel" autocomplete="tel" placeholder="07XX XXX XXX" required', "Enter a valid Safaricom/Airtel number, e.g. 0712 345 678")}
            </div>
            ${field("email", 'Email <small>(optional)</small>', 'type="email" autocomplete="email" placeholder="you@email.com"', "Please enter a valid email")}
          </fieldset>

          <fieldset class="fieldset">
            <legend>Delivery</legend>
            <div class="choice-grid">
              <label class="choice"><input type="radio" name="method" value="delivery" ${co.method === "delivery" ? "checked" : ""}><span><b>Deliver to me</b><small>All 47 counties</small></span></label>
              <label class="choice"><input type="radio" name="method" value="pickup" ${co.method === "pickup" ? "checked" : ""}><span><b>${esc(CFG.pickup.label)}</b><small>${esc(CFG.pickup.where)} · ${CFG.pickup.fee ? money(CFG.pickup.fee) : "Free"}</small></span></label>
            </div>
            <div id="deliveryFields" style="margin-top:14px">
              <div class="field" data-field="county">
                <label for="co-county">County</label>
                <select id="co-county" name="county" required>
                  <option value="">Select your county</option>
                  ${COUNTIES.map((c) => `<option ${c === co.county ? "selected" : ""}>${esc(c)}</option>`).join("")}
                </select>
                <span class="err">Please choose your county</span>
              </div>
              ${field("town", "Town / estate", 'autocomplete="address-level2" placeholder="e.g. Westlands, Nyali, Milimani" required', "Please enter your town or estate")}
              ${field("address", 'Street, building or landmark <small>(optional)</small>', 'autocomplete="street-address" placeholder="e.g. Sarit Centre, Gate B"')}
            </div>
          </fieldset>

          <fieldset class="fieldset">
            <legend>Payment</legend>
            <div class="choice-grid">
              <label class="choice"><input type="radio" name="payment" value="mpesa" checked><span><b>M-Pesa</b><small>${esc(CFG.mpesa.type)} ${esc(CFG.mpesa.number)}</small></span></label>
              <label class="choice"><input type="radio" name="payment" value="cod" id="codRadio"><span><b>Cash on delivery</b><small id="codSmall"></small></span></label>
            </div>
          </fieldset>

          <div class="field">
            <label for="co-notes">Order notes <small>(optional)</small></label>
            <textarea id="co-notes" name="notes" rows="2" placeholder="Delivery time preference, gift message…"></textarea>
          </div>

          <button class="btn btn-wa btn-lg btn-block" type="submit">${ICON.whatsapp} Place order on WhatsApp</button>
          <p class="secure-note">${ICON.lock.replace("<svg", '<svg style="width:16px;height:16px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8"')} We never ask for your M-Pesa PIN. Your details are only used to deliver your order.</p>
        </form>
        <aside class="co-summary" aria-label="Order summary">
          <h3>Order summary</h3>
          <div id="coSummary"></div>
        </aside>
      </div>`;
    updateCoFields();
    renderCoSummary();
    $$("dialog.drawer[open]").forEach((d) => d.close());
    openDialog(coModal);
    coModal.scrollTop = 0;
  }

  function updateCoFields() {
    const form = $("#coForm");
    if (!form) return;
    $("#deliveryFields").hidden = co.method === "pickup";
    const ok = codAllowed();
    const cod = $("#codRadio");
    cod.disabled = !ok;
    $("#codSmall").textContent = ok
      ? co.method === "pickup" ? "Pay when you collect" : "Pay when your shoes arrive"
      : `Available in ${CFG.cashOnDeliveryCounties.join(", ")} & pickup only`;
    if (!ok && co.payment === "cod") {
      co.payment = "mpesa";
      form.elements.payment.value = "mpesa";
    }
  }

  function renderCoSummary() {
    const box = $("#coSummary");
    if (!box) return;
    const pre = totals();
    const d = deliveryFor(co.method, co.county, pre.afterDiscount);
    const t = totals(d);
    box.innerHTML = `
      <div class="co-items">
        ${state.cart.map((i) => {
          const p = byId[i.id];
          return `<div class="co-item">
            <div class="cart-thumb" style="--card-bg:${bgFor(p)}">${media(p)}<span class="q">${i.qty}</span></div>
            <div><b>${esc(p.name)}</b><small>EU ${i.size} · ${esc(p.colorName)}</small></div>
            <b>${money(p.price * i.qty)}</b>
          </div>`;
        }).join("")}
      </div>
      ${promoHTML()}
      <div class="totals">
        <div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
        ${t.discount ? `<div class="discount"><span>Discount (${esc(state.promo)})</span><span>-${money(t.discount)}</span></div>` : ""}
        ${t.promoNote ? `<div class="note"><span>${esc(t.promoNote)}</span></div>` : ""}
        <div><span>Delivery${d ? ` <small class="muted">(${esc(d.eta)})</small>` : ""}</span><span>${d ? (d.fee ? money(d.fee) : "Free") : "Select county"}</span></div>
        <div class="grand"><span>Total</span><span>${money(t.total)}</span></div>
      </div>`;
  }

  function validate(form) {
    let first = null;
    const mark = (name, bad) => {
      const f = form.querySelector(`[data-field="${name}"]`);
      f?.classList.toggle("invalid", bad);
      if (bad && !first) first = form.elements[name];
    };
    const el = (n) => form.elements[n];
    mark("name", el("name").value.trim().length < 2);
    mark("phone", !normPhone(el("phone").value));
    const email = el("email").value.trim();
    mark("email", !!email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (co.method === "delivery") {
      mark("county", !el("county").value);
      mark("town", el("town").value.trim().length < 2);
    } else {
      mark("county", false);
      mark("town", false);
    }
    if (first) first.focus();
    return !first;
  }

  function orderNumber() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `VV${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function submitOrder(form) {
    if (!validate(form)) {
      toast("Please check the highlighted fields", { error: true });
      return;
    }
    const v = (n) => form.elements[n].value.trim();
    const phone = normPhone(v("phone"));
    const pre = totals();
    const d = deliveryFor(co.method, co.county, pre.afterDiscount);
    const t = totals(d);
    const no = orderNumber();
    const payLabel = co.payment === "cod"
      ? "Cash on delivery"
      : `M-Pesa (${CFG.mpesa.type} ${CFG.mpesa.number})`;

    const lines = state.cart.map((i, n) => {
      const p = byId[i.id];
      return `${n + 1}. ${p.name} (${p.colorName}), EU ${i.size} × ${i.qty} = ${money(p.price * i.qty)}`;
    });
    const msg = [
      `*New order: ${CFG.storeName}*`,
      `Order no: *${no}*`,
      "",
      ...lines,
      "",
      `Subtotal: ${money(t.subtotal)}`,
      t.discount ? `Discount (${state.promo}): -${money(t.discount)}` : null,
      `Delivery: ${d.fee ? money(d.fee) : "Free"}`,
      `*Total: ${money(t.total)}*`,
      "",
      `Name: ${v("name")}`,
      `Phone: ${prettyPhone(phone)}`,
      v("email") ? `Email: ${v("email")}` : null,
      co.method === "pickup"
        ? `Delivery: Pickup at ${CFG.pickup.where}`
        : `Deliver to: ${[v("address"), v("town"), co.county].filter(Boolean).join(", ")}`,
      `Payment: ${payLabel}`,
      v("notes") ? `Notes: ${v("notes")}` : null,
    ].filter((x) => x !== null).join("\n");

    const waUrl = `https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(msg)}`;

    store.set("customer", {
      name: v("name"), phone: v("phone"), email: v("email"),
      method: co.method, county: co.county, town: v("town"), address: v("address"),
    });
    const order = {
      no, date: new Date().toISOString(), total: t.total, payment: co.payment,
      items: state.cart.map((i) => ({ ...i, name: byId[i.id].name, price: byId[i.id].price })),
    };
    store.set("orders", [order, ...store.get("orders", [])].slice(0, 20));

    // Optional: send a copy of the order to a form service (e.g. Formspree).
    if (CFG.orderEndpoint) {
      fetch(CFG.orderEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ order: no, total: t.total, phone: prettyPhone(phone), name: v("name"), message: msg }),
      }).catch(() => {});
    }

    window.open(waUrl, "_blank", "noopener");
    renderSuccess({ no, total: t.total, payment: co.payment, method: co.method, waUrl });

    state.cart = [];
    state.promo = null;
    saveCart();
    store.set("promo", null);
    renderCart();
  }

  function renderSuccess({ no, total, payment, method, waUrl }) {
    const m = CFG.mpesa;
    const copyBtn = (v) => `<button type="button" class="copy-btn" data-copy="${esc(v)}" aria-label="Copy ${esc(v)}">Copy</button>`;
    const paybill = /paybill/i.test(m.type);
    const steps = paybill
      ? [
          "Go to <b>M-Pesa</b> → <b>Lipa na M-Pesa</b> → <b>Pay Bill</b>",
          `Business number: <b>${esc(m.number)}</b>${copyBtn(m.number)}`,
          `Account number: <b>${esc(m.account || no)}</b>${copyBtn(m.account || no)}`,
          `Amount: <b>${money(total)}</b>${copyBtn(String(total))}`,
          "Enter your PIN and confirm",
          "Send us the M-Pesa confirmation message on WhatsApp",
        ]
      : [
          "Go to <b>M-Pesa</b> → <b>Lipa na M-Pesa</b> → <b>Buy Goods and Services</b>",
          `Till number: <b>${esc(m.number)}</b> (${esc(m.name)})${copyBtn(m.number)}`,
          `Amount: <b>${money(total)}</b>${copyBtn(String(total))}`,
          "Enter your PIN and confirm",
          "Send us the M-Pesa confirmation message on WhatsApp",
        ];
    $("#checkoutContent").innerHTML = `
      <div class="success">
        <div class="success-icon">${ICON.check}</div>
        <h2 id="coTitle">Asante! Order received.</h2>
        <div class="order-no">Order ${esc(no)}</div>
        <p class="muted">We've opened WhatsApp with your order details. <b>Tap send</b> so we can confirm it. If WhatsApp didn't open, use the button below.</p>
        ${payment === "mpesa" ? `
          <div class="mpesa-box">
            <h3><span class="tag">M-PESA</span> How to pay ${money(total)}</h3>
            <ol>${steps.map((s) => `<li>${s}</li>`).join("")}</ol>
          </div>` : `<p>You'll pay <b>${money(total)}</b> in cash ${method === "pickup" ? "when you collect your order" : "when your shoes arrive"}.</p>`}
        <div class="success-actions">
          <a class="btn btn-wa btn-lg" href="${waUrl}" target="_blank" rel="noopener">${ICON.whatsapp} Open WhatsApp</a>
          <button class="btn btn-outline" data-close>Continue shopping</button>
        </div>
      </div>`;
    coModal.scrollTop = 0;
  }

  /* ---------------- Size guide ---------------- */
  function renderSizeGuide() {
    const adult = [
      [36, 3.5, 4.5, 6, 22.5], [37, 4, 5, 6.5, 23.0], [38, 5, 6, 7.5, 23.8], [39, 6, 7, 8.5, 24.6],
      [40, 6.5, 7.5, 9, 25.0], [41, 7.5, 8.5, 10, 25.9], [42, 8, 9, 10.5, 26.7], [43, 9, 10, 11.5, 27.5],
      [44, 9.5, 10.5, 12, 28.0], [45, 10.5, 11.5, 13, 28.8], [46, 11, 12, 13.5, 29.6],
    ];
    const kids = [
      [28, 10, "4 – 5 yrs", 17.5], [29, 11, "5 yrs", 18.0], [30, 12, "5 – 6 yrs", 18.7], [31, 12.5, "6 – 7 yrs", 19.3],
      [32, 13.5, "7 – 8 yrs", 20.0], [33, 1, "8 – 9 yrs", 20.7], [34, 2, "9 – 10 yrs", 21.3], [35, 2.5, "10 – 11 yrs", 22.0],
    ];
    const row = (r) => `<tr>${r.map((c, i) => `<td>${i === r.length - 1 ? c.toFixed(1) : c}</td>`).join("")}</tr>`;
    $("#sizeRows").innerHTML = adult.map(row).join("");
    $("#kidsSizeRows").innerHTML = kids.map(row).join("");
  }

  /* ---------------- Static content from config ---------------- */
  function renderStatic() {
    $("#year").textContent = new Date().getFullYear();
    $("#waFloat").href = $("#bnWa").href = waLink(`Habari ${CFG.storeName}! 👋 I have a question.`);

    const h = new Date().getHours();
    const greet = h < 12 ? "Habari za asubuhi" : h < 17 ? "Habari za mchana" : "Habari za jioni";
    $("#greeting").textContent = `${greet} 👋 · Karibu Viatu Vibes`;

    const t = CFG.deliveryTiers;
    $("#faqDelivery").textContent =
      `Nairobi: ${money(t.nairobi.fee)} (free on orders over ${money(CFG.freeDeliveryThreshold)}). ` +
      `Nearby counties: ${money(t.metro.fee)}. Major towns: ${money(t.major.fee)}. Rest of Kenya: ${money(t.other.fee)}. ` +
      `Pickup from our shop is ${CFG.pickup.fee ? money(CFG.pickup.fee) : "free"}.`;
    $("#faqPickup").textContent = `Yes. Choose "${CFG.pickup.label}" at checkout and collect from ${CFG.pickup.where}. ${CFG.hours}.`;

    const s = CFG.social || {};
    $("#socials").innerHTML = ["instagram", "tiktok", "facebook"]
      .filter((k) => s[k])
      .map((k) => `<a href="${esc(s[k])}" target="_blank" rel="noopener" aria-label="${k[0].toUpperCase() + k.slice(1)}">${ICON[k]}</a>`).join("");

    $("#contactList").innerHTML = `
      <li>${ICON.pin}<span>${esc(CFG.address)}</span></li>
      <li>${ICON.phone}<a href="tel:+${esc(CFG.whatsappNumber)}">${esc(CFG.phoneDisplay)}</a></li>
      <li>${ICON.mail}<a href="mailto:${esc(CFG.email)}">${esc(CFG.email)}</a></li>
      <li>${ICON.clock}<span>${esc(CFG.hours)}</span></li>`;

    const tm = CFG.testimonials || [];
    const sec = $("#reviews");
    if (!tm.length) sec.hidden = true;
    else
      $("#testimonials").innerHTML = tm.map((x) => `
        <figure class="testimonial">
          <blockquote>${esc(x.text)}</blockquote>
          <figcaption><span class="avatar" aria-hidden="true">${esc(x.name.trim()[0] || "?")}</span><div><b>${esc(x.name)}</b><span>${esc(x.place || "")}</span></div></figcaption>
        </figure>`).join("");
  }

  /* ---------------- Events ---------------- */
  function scrollToShop() {
    $("#shop").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;

    // Close the containing dialog first (so scrolling works afterwards)
    if (t.hasAttribute("data-close")) closeDialog(t.closest("dialog"));

    // Occasion picker: tap again to clear
    if (t.dataset.vibe) {
      if (state.f.vibe === t.dataset.vibe) { state.f.vibe = null; applyFilters(); return; }
      quickFilter({ vibe: t.dataset.vibe });
      scrollToShop();
      return;
    }
    if (t.dataset.hero) { showHero(+t.dataset.hero); return; }
    if (t.dataset.openDrawer) return openDialog($("#" + t.dataset.openDrawer));
    if (t.dataset.copy) return copyText(t.dataset.copy);
    if (t.hasAttribute("data-ask")) return askOnWhatsApp();

    // Quick-filter links (nav, categories, footer)
    if (t.dataset.cat || t.dataset.type || t.dataset.sale) {
      e.preventDefault();
      quickFilter({ cat: t.dataset.cat, type: t.dataset.type, sale: t.dataset.sale });
      scrollToShop();
      return;
    }
    if (t.matches('a[href="#shop"]')) {
      e.preventDefault();
      scrollToShop();
      return;
    }

    if (t.dataset.open) return openProduct(t.dataset.open);
    if (t.dataset.wish) return toggleWish(t.dataset.wish);
    if (t.dataset.remove) return removeItem(t.dataset.remove);
    if (t.dataset.qty) {
      const it = state.cart.find((i) => key(i) === t.dataset.qty);
      if (it) setQty(t.dataset.qty, it.qty + +t.dataset.delta);
      return;
    }
    if (t.dataset.sizeFilter) {
      const s = +t.dataset.sizeFilter;
      state.f.sizes.has(s) ? state.f.sizes.delete(s) : state.f.sizes.add(s);
      return applyFilters();
    }
    if (t.dataset.size && sel) {
      sel.size = +t.dataset.size;
      $$(".pm-sizes .size-chip").forEach((b) => b.setAttribute("aria-pressed", b === t));
      $("#sizeHint").textContent = "";
      $("#sizeHint").classList.remove("ok");
      const sizes = store.get("mySize", {});
      sizes[sizeGroup(byId[sel.id])] = sel.size;
      store.set("mySize", sizes);
      return;
    }
    if (t.dataset.pmqty && sel) {
      sel.qty = Math.max(1, Math.min(MAX_QTY, sel.qty + +t.dataset.pmqty));
      $("#pmQty").textContent = sel.qty;
      updateEta();
      return;
    }
    if (t.hasAttribute("data-add")) return addFromModal();
    if (t.dataset.chip) {
      const { chip, val } = t.dataset;
      const f = state.f;
      if (chip === "q") f.q = "";
      else if (chip === "vibe") f.vibe = null;
      else if (chip === "sale") f.sale = false;
      else if (chip === "price") f.maxPrice = PRICE_MAX;
      else if (chip === "sizes") f.sizes.delete(+val);
      else f[chip].delete(val);
      return applyFilters();
    }

    switch (t.dataset.action) {
      case "clear-filters": {
        const sort = state.f.sort;
        state.f = freshFilters();
        state.f.sort = sort;
        applyFilters();
        break;
      }
      case "size-guide": openDialog($("#sizeModal")); break;
      case "checkout": openCheckout(); break;
      case "remove-promo":
        state.promo = null;
        store.set("promo", null);
        renderCart();
        renderCoSummary();
        break;
      case "share": shareProduct(); break;
    }
  });

  document.addEventListener("change", (e) => {
    const el = e.target;
    const g = el.dataset?.filter;
    if (g) {
      if (g === "sale") state.f.sale = el.checked;
      else if (g === "price") state.f.maxPrice = +el.value;
      else el.checked ? state.f[g].add(el.value) : state.f[g].delete(el.value);
      return applyFilters();
    }
    if (el.hasAttribute?.("data-eta")) {
      const c = store.get("customer", {});
      c.county = el.value;
      if (el.value) c.method = "delivery";
      store.set("customer", c);
      return updateEta();
    }
    if (el.closest("#coForm")) {
      if (el.name === "method") { co.method = el.value; updateCoFields(); renderCoSummary(); }
      if (el.name === "county") { co.county = el.value; updateCoFields(); renderCoSummary(); el.closest(".field").classList.remove("invalid"); }
      if (el.name === "payment") co.payment = el.value;
    }
  });

  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.dataset?.filter === "price") {
      state.f.maxPrice = +el.value;
      $$("[data-price-label]").forEach((l) => (l.textContent = money(state.f.maxPrice)));
      debouncedApply();
    }
    if (el.closest?.("#coForm")) el.closest(".field")?.classList.remove("invalid");
  });
  const debouncedApply = debounce(applyFilters, 120);

  document.addEventListener("submit", (e) => {
    const form = e.target;
    if (form.matches("[data-promo-form]")) {
      e.preventDefault();
      applyPromo(form.elements.code.value);
    } else if (form.id === "coForm") {
      e.preventDefault();
      submitOrder(form);
    }
  });

  const searchInput = $("#searchInput");
  const runSearch = debounce(() => {
    state.f.q = searchInput.value.trim();
    applyFilters();
  }, 180);
  searchInput.addEventListener("input", runSearch);
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.f.q = searchInput.value.trim();
    applyFilters();
    scrollToShop();
    searchInput.blur();
  });

  $("#sortSelect").addEventListener("change", (e) => {
    state.f.sort = e.target.value;
    applyFilters();
  });
  $("#loadMore").addEventListener("click", loadMore);
  $("#menuBtn").addEventListener("click", () => openDialog($("#navDrawer")));
  $("#cartBtn").addEventListener("click", () => openDialog($("#cartDrawer")));
  $("#wishBtn").addEventListener("click", () => openDialog($("#wishDrawer")));
  $("#filterToggle").addEventListener("click", () => openDialog($("#filterDialog")));
  $("#showResultsBtn").addEventListener("click", scrollToShop);

  $("#newsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#newsEmail");
    const email = input.value.trim();
    if (CFG.newsletterEndpoint) {
      try {
        const r = await fetch(CFG.newsletterEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!r.ok) throw new Error();
      } catch {
        return toast("Couldn't subscribe right now. Please try again.", { error: true });
      }
    } else {
      const list = store.get("newsletter", []);
      if (!list.includes(email)) store.set("newsletter", [...list, email]);
    }
    input.value = "";
    toast("Asante! You're on the list.");
  });

  // Header shadow on scroll
  const header = $("#siteHeader");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });

  // Keep cart & wishlist in sync across tabs
  window.addEventListener("storage", (e) => {
    if (e.key === "vv:cart") { state.cart = store.get("cart", []).filter((i) => byId[i.id]); renderCart(); }
    if (e.key === "vv:wish") { state.wish = store.get("wish", []).filter((id) => byId[id]); renderWish(); renderGrid(); }
  });

  window.addEventListener("hashchange", route);

  /* ---------------- Init ---------------- */
  $("#filtersSidebar").innerHTML = filtersHTML("d");
  $("#filtersMobile").innerHTML = filtersHTML("m");
  renderStatic();
  renderHero();
  startHero();
  renderVibes();
  renderCategories();
  renderSizeGuide();
  syncFilters();
  renderGrid();
  renderCart();
  renderWish();
  onScroll();
  route();
  probePhotos();
})();
