// DealHound — the deal finder itself. Renders the deals from deals.js,
// keeps search / category / store / discount / sort in the URL hash so a
// filtered view is a link you can share, and builds the cross-store
// comparison for the Switch 2 bundle from the same data.

(function () {
  "use strict";

  var VERDICT_LABEL = {
    "new-low": "NEW LOW",
    "strong": "STRONG PRICE",
    "routine": "ROUTINE SALE",
    "doorbuster": "DOORBUSTER",
  };

  function money(n) {
    return "$" + n.toFixed(2).replace(/\.00$/, "");
  }

  function pct(deal) {
    return Math.round((1 - deal.sale / deal.usual) * 100);
  }

  function saved(deal) {
    return deal.usual - deal.sale;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  // ---- state: read from the hash, written back on every change ----------
  function readState() {
    var out = { q: "", cat: "All", store: "All", min: 0, sort: "discount", lows: false };
    var raw = window.location.hash.replace(/^#/, "");
    if (!raw) return out;
    raw.split("&").forEach(function (part) {
      var kv = part.split("=");
      var key = decodeURIComponent(kv[0] || "");
      var val = decodeURIComponent(kv[1] || "");
      if (key === "q") out.q = val;
      if (key === "cat") out.cat = val;
      if (key === "store") out.store = val;
      if (key === "min") out.min = parseInt(val, 10) || 0;
      if (key === "sort") out.sort = val;
      if (key === "lows") out.lows = val === "1";
    });
    return out;
  }

  function writeState(state) {
    var parts = [];
    if (state.q) parts.push("q=" + encodeURIComponent(state.q));
    if (state.cat !== "All") parts.push("cat=" + encodeURIComponent(state.cat));
    if (state.store !== "All") parts.push("store=" + encodeURIComponent(state.store));
    if (state.min) parts.push("min=" + state.min);
    if (state.sort !== "discount") parts.push("sort=" + encodeURIComponent(state.sort));
    if (state.lows) parts.push("lows=1");
    var hash = parts.length ? "#" + parts.join("&") : "";
    if (window.location.hash !== hash) {
      history.replaceState(null, "", hash || window.location.pathname + window.location.search);
    }
  }

  // ---- filtering + sorting ----------------------------------------------
  function applyFilters(state) {
    var q = state.q.trim().toLowerCase();
    var list = DEALS.filter(function (d) {
      if (state.cat !== "All" && d.cat !== state.cat) return false;
      if (state.store !== "All" && d.store !== state.store) return false;
      if (pct(d) < state.min) return false;
      if (state.lows && d.verdict !== "new-low") return false;
      if (q) {
        var hay = (d.product + " " + d.store + " " + d.cat).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (state.sort === "discount") list.sort(function (a, b) { return pct(b) - pct(a) || saved(b) - saved(a); });
    if (state.sort === "saving") list.sort(function (a, b) { return saved(b) - saved(a); });
    if (state.sort === "price") list.sort(function (a, b) { return a.sale - b.sale; });
    if (state.sort === "lows") {
      var rank = { "new-low": 0, "doorbuster": 1, "strong": 2, "routine": 3 };
      list.sort(function (a, b) { return rank[a.verdict] - rank[b.verdict] || pct(b) - pct(a); });
    }
    return list;
  }

  // ---- card rendering ----------------------------------------------------
  function card(deal) {
    var article = el("article", "card");
    var head = el("div", "card-head");
    head.appendChild(el("span", "store", deal.store));
    head.appendChild(el("span", "cat", deal.cat));
    article.appendChild(head);

    article.appendChild(el("h3", "product", deal.product));

    var prices = el("div", "prices");
    prices.appendChild(el("span", "sale", money(deal.sale)));
    var usual = el("span", "usual", "was " + money(deal.usual));
    prices.appendChild(usual);
    prices.appendChild(el("span", "off", "-" + pct(deal) + "%"));
    article.appendChild(prices);

    var verdict = el("p", "verdict v-" + deal.verdict, VERDICT_LABEL[deal.verdict] + " — " + deal.verdictNote);
    article.appendChild(verdict);
    if (deal.note) article.appendChild(el("p", "note", deal.note));

    var meta = el("p", "meta");
    var usualLabel = deal.usualNote ? "usual = " + deal.usualNote : "usual = list price";
    meta.textContent = "Checked " + CHECKED_AT + " · " + usualLabel + " · Source: " + deal.source;
    article.appendChild(meta);

    var link = el("a", "buy", "View at " + deal.store + " →");
    link.href = deal.url;
    link.target = "_blank";
    link.rel = "noopener";
    article.appendChild(link);
    return article;
  }

  // ---- cross-store comparison (same product, several stores) -------------
  function renderCompare() {
    var box = document.getElementById("compare");
    var group = DEALS.filter(function (d) { return d.group === "switch2"; });
    if (!group.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = "";
    box.appendChild(el("h2", null, "Same console, three stores — compared"));
    var best = Math.min.apply(null, group.map(function (d) { return d.sale; }));
    group.slice().sort(function (a, b) { return a.sale - b.sale; }).forEach(function (d) {
      var row = el("div", "cmp-row");
      row.appendChild(el("span", "cmp-store", d.store));
      row.appendChild(el("span", "cmp-price", money(d.sale)));
      row.appendChild(el("span", "cmp-off", "-" + pct(d) + "%"));
      if (d.sale === best) row.appendChild(el("span", "cmp-best", "CHEAPEST"));
      var a = el("a", "cmp-link", "Open →");
      a.href = d.url; a.target = "_blank"; a.rel = "noopener";
      row.appendChild(a);
      box.appendChild(row);
    });
    box.appendChild(el("p", "cmp-note",
      "One bundle, three checkouts. Walmart wins by 99 cents; Best Buy adds the 3-month Switch Online membership. No PS5 or Xbox console is discounted this year."));
  }

  // ---- stats + count ------------------------------------------------------
  function renderStats() {
    var best = DEALS.reduce(function (m, d) { return Math.max(m, pct(d)); }, 0);
    var totalSaved = DEALS.reduce(function (s, d) { return s + saved(d); }, 0);
    var lows = DEALS.filter(function (d) { return d.verdict === "new-low"; }).length;
    document.getElementById("stat-deals").textContent = DEALS.length + " deals";
    document.getElementById("stat-best").textContent = "up to −" + best + "%";
    document.getElementById("stat-saved").textContent = "$" + Math.round(totalSaved).toLocaleString("en-US") + " total savings";
    document.getElementById("stat-lows").textContent = lows + " new lows";
    document.getElementById("checked-line").textContent =
      "All " + DEALS.length + " prices checked " + CHECKED_AT + " — at the store, or in a deals source that names the store. Prices move fast on Black Friday: confirm at checkout.";
  }

  // ---- main render --------------------------------------------------------
  var state = readState();

  function render() {
    writeState(state);
    // The cross-store comparison is a feature of the full list: hide it
    // whenever a search or filter is active, so a filtered view shows only
    // what matches.
    var filtered = state.q || state.cat !== "All" || state.store !== "All" || state.min > 0 || state.lows;
    document.getElementById("compare").hidden = !!filtered;
    var list = applyFilters(state);
    var grid = document.getElementById("grid");
    grid.innerHTML = "";
    list.forEach(function (d) { grid.appendChild(card(d)); });
    var count = document.getElementById("count");
    if (!list.length) {
      count.textContent = "No deals match — loosen a filter.";
      grid.appendChild(el("p", "empty", "Nothing matches that search. Try a shorter word, or clear a filter."));
    } else {
      count.textContent = "Showing " + list.length + " of " + DEALS.length + " deals";
    }
  }

  function fillSelects() {
    var catSel = document.getElementById("f-cat");
    var cats = [];
    DEALS.forEach(function (d) { if (cats.indexOf(d.cat) === -1) cats.push(d.cat); });
    cats.forEach(function (c) {
      var o = el("option", null, c);
      o.value = c;
      catSel.appendChild(o);
    });
    var storeSel = document.getElementById("f-store");
    var stores = [];
    DEALS.forEach(function (d) { if (stores.indexOf(d.store) === -1) stores.push(d.store); });
    stores.forEach(function (s) {
      var o = el("option", null, s);
      o.value = s;
      storeSel.appendChild(o);
    });
  }

  function bindControls() {
    var q = document.getElementById("f-q");
    var cat = document.getElementById("f-cat");
    var store = document.getElementById("f-store");
    var min = document.getElementById("f-min");
    var sort = document.getElementById("f-sort");
    var lows = document.getElementById("f-lows");
    q.value = state.q; cat.value = state.cat; store.value = state.store;
    min.value = String(state.min); sort.value = state.sort; lows.checked = state.lows;
    q.addEventListener("input", function () { state.q = q.value; render(); });
    cat.addEventListener("change", function () { state.cat = cat.value; render(); });
    store.addEventListener("change", function () { state.store = store.value; render(); });
    min.addEventListener("change", function () { state.min = parseInt(min.value, 10) || 0; render(); });
    sort.addEventListener("change", function () { state.sort = sort.value; render(); });
    lows.addEventListener("change", function () { state.lows = lows.checked; render(); });
    document.getElementById("clear").addEventListener("click", function () {
      state = { q: "", cat: "All", store: "All", min: 0, sort: "discount", lows: false };
      q.value = ""; cat.value = "All"; store.value = "All";
      min.value = "0"; sort.value = "discount"; lows.checked = false;
      render();
    });
  }

  fillSelects();
  bindControls();
  renderStats();
  renderCompare();
  render();
})();
