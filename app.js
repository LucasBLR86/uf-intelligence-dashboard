const rawRecords = window.DASHBOARD_DATA.records;

const metrics = {
  total_patentes: { label: "Patentes", short: "Patentes", format: fmtInt, aggregate: "sum" },
  pib_bilhoes_reais: { label: "PIB (R$ bi)", short: "PIB", format: fmtMoney, aggregate: "sum" },
  percentual_pib_pd: { label: "P&D / PIB", short: "P&D", format: fmtPct, aggregate: "avg" },
  idh: { label: "IDH", short: "IDH", format: fmt3, aggregate: "avg" },
  rendimento_per_capita: { label: "Renda per capita", short: "Renda", format: fmtMoneySmall, aggregate: "avg" },
  taxa_analfabetismo: { label: "Analfabetismo", short: "Analf.", format: fmtPct, aggregate: "avg" },
  indice_gini: { label: "Índice de Gini", short: "Gini", format: fmt3, aggregate: "avg" },
  populacao: { label: "População", short: "Pop.", format: fmtInt, aggregate: "sum" },
};

const regions = ["Todas", "Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
const years = [...new Set(rawRecords.map((d) => d.ano))]
  .filter((year) => year >= 2010 && year <= 2020)
  .sort((a, b) => a - b);
const states = [...new Set(rawRecords.map((d) => d.estado))].sort();
let state = {
  year: Math.max(...years),
  region: "Todas",
  metric: "idh",
  lineMetric: "idh",
  selectedStates: new Set(),
  search: "",
  sortBy: "idh",
  sortDir: "desc",
};

const el = {
  yearSelect: document.querySelector("#yearSelect"),
  metricSelect: document.querySelector("#metricSelect"),
  lineMetricSelect: document.querySelector("#lineMetricSelect"),
  regionSelect: document.querySelector("#regionSelect"),
  searchInput: document.querySelector("#searchInput"),
  stateChips: document.querySelector("#stateChips"),
  darkTheme: document.querySelector("#darkTheme"),
  lightTheme: document.querySelector("#lightTheme"),
  resetFilters: document.querySelector("#resetFilters"),
  selectTop: document.querySelector("#selectTop"),
  clearState: document.querySelector("#clearState"),
  exportCsv: document.querySelector("#exportCsv"),
  sortSelect: document.querySelector("#sortSelect"),
  sortDirection: document.querySelector("#sortDirection"),
  rankingChart: document.querySelector("#rankingChart"),
  lineChart: document.querySelector("#lineChart"),
  scatterChart: document.querySelector("#scatterChart"),
  regionChart: document.querySelector("#regionChart"),
  heatmapChart: document.querySelector("#heatmapChart"),
  heatmapSubtitle: document.querySelector("#heatmapSubtitle"),
  dataTable: document.querySelector("#dataTable"),
  tableSubtitle: document.querySelector("#tableSubtitle"),
  rankingTitle: document.querySelector("#rankingTitle"),
  lineSubtitle: document.querySelector("#lineSubtitle"),
  scatterYear: document.querySelector("#scatterYear"),
  kpiPatents: document.querySelector("#kpiPatents"),
  kpiPatentsSub: document.querySelector("#kpiPatentsSub"),
  kpiPib: document.querySelector("#kpiPib"),
  kpiIdh: document.querySelector("#kpiIdh"),
  kpiPd: document.querySelector("#kpiPd"),
};

function init() {
  fillSelect(el.yearSelect, years.map((year) => [year, year]), state.year);
  fillSelect(el.regionSelect, regions.map((region) => [region, region]), state.region);
  fillSelect(
    el.metricSelect,
    Object.entries(metrics).map(([key, meta]) => [key, meta.label]),
    state.metric,
  );
  fillSelect(
    el.lineMetricSelect,
    Object.entries(metrics).map(([key, meta]) => [key, meta.label]),
    state.lineMetric,
  );
  fillSelect(
    el.sortSelect,
    Object.entries(metrics).map(([key, meta]) => [key, meta.label]),
    state.sortBy,
  );

  el.yearSelect.addEventListener("change", () => {
    state.year = Number(el.yearSelect.value);
    render();
  });
  el.regionSelect.addEventListener("change", () => {
    state.region = el.regionSelect.value;
    render();
  });
  el.metricSelect.addEventListener("change", () => {
    state.metric = el.metricSelect.value;
    state.sortBy = state.metric;
    el.sortSelect.value = state.sortBy;
    render();
  });
  el.lineMetricSelect.addEventListener("change", () => {
    state.lineMetric = el.lineMetricSelect.value;
    render();
  });
  el.searchInput.addEventListener("input", () => {
    state.search = el.searchInput.value.trim().toLowerCase();
    render();
  });
  el.sortSelect.addEventListener("change", () => {
    state.sortBy = el.sortSelect.value;
    render();
  });
  el.sortDirection.addEventListener("click", () => {
    state.sortDir = state.sortDir === "desc" ? "asc" : "desc";
    el.sortDirection.textContent = state.sortDir === "desc" ? "↓" : "↑";
    render();
  });
  el.darkTheme.addEventListener("click", () => setTheme("dark"));
  el.lightTheme.addEventListener("click", () => setTheme("light"));
  el.resetFilters.addEventListener("click", resetFilters);
  el.clearState.addEventListener("click", () => {
    state.selectedStates.clear();
    render();
  });
  el.selectTop.addEventListener("click", selectTopStates);
  el.exportCsv.addEventListener("click", exportCsv);

  render();
}

function fillSelect(select, options, selected) {
  select.innerHTML = options
    .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
    .join("");
  select.value = selected;
}

function setTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  el.darkTheme.classList.toggle("active", theme === "dark");
  el.lightTheme.classList.toggle("active", theme === "light");
}

function resetFilters() {
  state = {
    year: Math.max(...years),
    region: "Todas",
    metric: "idh",
    lineMetric: "idh",
    selectedStates: new Set(),
    search: "",
    sortBy: "idh",
    sortDir: "desc",
  };
  el.yearSelect.value = state.year;
  el.regionSelect.value = state.region;
  el.metricSelect.value = state.metric;
  el.lineMetricSelect.value = state.lineMetric;
  el.sortSelect.value = state.sortBy;
  el.sortDirection.textContent = "↓";
  el.searchInput.value = "";
  render();
}

function selectedBaseRecords({ ignoreYear = false } = {}) {
  return rawRecords.filter((d) => {
    const matchesYear = ignoreYear || d.ano === state.year;
    const matchesAllowedPeriod = years.includes(d.ano);
    const matchesRegion = state.region === "Todas" || d.regiao === state.region;
    const matchesState = state.selectedStates.size === 0 || state.selectedStates.has(d.estado);
    const matchesSearch =
      !state.search ||
      d.estado.toLowerCase().includes(state.search) ||
      d.regiao.toLowerCase().includes(state.search);
    return matchesAllowedPeriod && matchesYear && matchesRegion && matchesState && matchesSearch;
  });
}

function render() {
  renderChips();
  const filtered = selectedBaseRecords();
  renderKpis(filtered);
  renderRanking(filtered);
  renderLineChart();
  renderScatter(filtered);
  renderRegions(filtered);
  renderHeatmap();
  renderTable(filtered);
}

function renderChips() {
  el.stateChips.innerHTML = states
    .map((uf) => {
      const active = state.selectedStates.has(uf) ? "active" : "";
      return `<button class="chip ${active}" type="button" data-state="${uf}">${uf}</button>`;
    })
    .join("");
  el.stateChips.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => toggleState(button.dataset.state));
  });
}

function toggleState(uf) {
  if (state.selectedStates.has(uf)) state.selectedStates.delete(uf);
  else state.selectedStates.add(uf);
  render();
}

function selectTopStates() {
  const ranked = rankByState(rawRecords.filter((d) => d.ano === state.year), state.metric).slice(0, 10);
  state.selectedStates = new Set(ranked.map((d) => d.estado));
  render();
}

function renderKpis(records) {
  const patents = sum(records, "total_patentes");
  const pib = sum(records, "pib_bilhoes_reais");
  const idh = avg(records, "idh");
  const pd = avg(records, "percentual_pib_pd");
  const suffix = `${records.length} registros em ${state.year}`;

  el.kpiPatents.textContent = fmtInt(patents);
  el.kpiPib.textContent = fmtMoney(pib);
  el.kpiIdh.textContent = fmt3(idh);
  el.kpiPd.textContent = fmtPct(pd);
  el.kpiPatentsSub.textContent = suffix;
}

function renderRanking(records) {
  el.rankingTitle.textContent = `Ranking por ${metrics[state.metric].short}`;
  const ranked = rankByState(records, state.metric).slice(0, 27);
  if (!ranked.length) return empty(el.rankingChart);

  const width = 760;
  const height = Math.max(420, ranked.length * 28 + 40);
  const margin = { top: 10, right: 120, bottom: 22, left: 48 };
  const plotW = width - margin.left - margin.right;
  const barH = Math.min(24, (height - margin.top - margin.bottom) / ranked.length - 7);
  const max = Math.max(...ranked.map((d) => d.value), 1);

  const bars = ranked
    .map((d, i) => {
      const y = margin.top + i * (barH + 7);
      const w = (d.value / max) * plotW;
      const active = state.selectedStates.has(d.estado);
      const fill = active ? "var(--accent-2)" : "var(--accent)";
      return `
        <g class="bar" data-state="${d.estado}" tabindex="0">
          <text class="axis" x="0" y="${y + barH * 0.72}">${d.estado}</text>
          <rect x="${margin.left}" y="${y}" width="${Math.max(w, 2)}" height="${barH}" rx="4" fill="${fill}"></rect>
          <text class="axis" x="${margin.left + w + 8}" y="${y + barH * 0.72}">${metrics[state.metric].format(d.value)}</text>
        </g>`;
    })
    .join("");

  el.rankingChart.style.minHeight = `${height}px`;
  el.rankingChart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Ranking">${bars}</svg>`;
  el.rankingChart.querySelectorAll(".bar").forEach((bar) => {
    bar.addEventListener("click", () => {
      state.selectedStates = new Set([bar.dataset.state]);
      render();
    });
  });
}

function renderLineChart() {
  const records = selectedBaseRecords({ ignoreYear: true });
  const series = years.map((year) => {
    const yearRecords = records.filter((d) => d.ano === year);
    return { year, value: aggregate(yearRecords, state.lineMetric) };
  });
  el.lineSubtitle.textContent = `${metrics[state.lineMetric].label} por ano`;
  renderLine(el.lineChart, series, metrics[state.lineMetric]);
}

function renderScatter(records) {
  el.scatterYear.textContent = String(state.year);
  if (!records.length) return empty(el.scatterChart);

  const width = 620;
  const height = 260;
  const margin = { top: 14, right: 24, bottom: 42, left: 58 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const maxX = Math.max(...records.map((d) => d.percentual_pib_pd), 0.001);
  const maxY = Math.max(...records.map((d) => d.total_patentes), 1);
  const maxPib = Math.max(...records.map((d) => d.pib_bilhoes_reais), 1);

  const dots = records
    .map((d) => {
      const x = margin.left + (d.percentual_pib_pd / maxX) * plotW;
      const y = margin.top + plotH - (d.total_patentes / maxY) * plotH;
      const r = 4 + Math.sqrt(d.pib_bilhoes_reais / maxPib) * 14;
      const active = state.selectedStates.has(d.estado);
      return `<g class="dot" data-state="${d.estado}">
        <circle cx="${x}" cy="${y}" r="${r}" fill="${active ? "var(--accent-2)" : "var(--accent-3)"}" opacity="0.78"></circle>
        <text class="axis" x="${x + r + 3}" y="${y + 4}">${d.estado}</text>
        <title>${d.estado}: ${fmtPct(d.percentual_pib_pd)} P&D/PIB, ${fmtInt(d.total_patentes)} patentes</title>
      </g>`;
    })
    .join("");

  el.scatterChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Dispersão P&D e patentes">
      ${gridLines(width, height, margin)}
      <line x1="${margin.left}" y1="${margin.top + plotH}" x2="${margin.left + plotW}" y2="${margin.top + plotH}" stroke="var(--line)"></line>
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotH}" stroke="var(--line)"></line>
      ${dots}
      <text class="axis" x="${margin.left + plotW / 2 - 44}" y="${height - 10}">P&D / PIB</text>
      <text class="axis" x="8" y="18">Patentes</text>
    </svg>`;
  el.scatterChart.querySelectorAll(".dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      state.selectedStates = new Set([dot.dataset.state]);
      render();
    });
  });
}

function renderRegions(records) {
  const metric = metrics[state.metric];
  const total = Math.max(sum(records, state.metric), 1);
  const grouped = regions
    .filter((r) => r !== "Todas")
    .map((region) => {
      const group = records.filter((d) => d.regiao === region);
      const value = aggregate(group, state.metric);
      const share = metric.aggregate === "sum" ? value / total : 0;
      return { region, value, share, count: group.length };
    });
  const maxValue = Math.max(...grouped.map((d) => d.value), 1);

  el.regionChart.innerHTML = grouped
    .map(
      (d) => `<div class="region-card ${state.region === d.region ? "active" : ""}" data-region="${d.region}">
        <span>${d.region}</span>
        <strong>${metric.aggregate === "sum" ? fmtPct(d.share) : metric.format(d.value)}</strong>
        <small>${metric.aggregate === "sum" ? metric.format(d.value) : `${metric.short} médio`}</small>
        <div class="progress" aria-hidden="true"><span style="width:${Math.max((d.value / maxValue) * 100, 2)}%"></span></div>
      </div>`,
    )
    .join("");
  el.regionChart.querySelectorAll(".region-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.region = state.region === card.dataset.region ? "Todas" : card.dataset.region;
      el.regionSelect.value = state.region;
      render();
    });
  });
}

function renderHeatmap() {
  const records = selectedBaseRecords({ ignoreYear: true });
  const metric = metrics[state.metric];

  const rows = regions.filter((region) => region !== "Todas");
  el.heatmapSubtitle.textContent = `5 regioes por ${metric.label}`;
  if (!rows.length) return empty(el.heatmapChart);

  const values = [];
  const byRegionYear = new Map();
  rows.forEach((region) => {
    years.forEach((year) => {
      const group = records.filter((row) => row.regiao === region && row.ano === year);
      const value = aggregate(group, state.metric);
      byRegionYear.set(`${region}-${year}`, value);
      values.push(value);
    });
  });

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const header = `<div></div>${years.map((year) => `<div class="heatmap-year">${String(year).slice(2)}</div>`).join("")}`;
  const body = rows
    .map((region) => {
      const label = `<div class="heatmap-label" data-region="${region}">${region}</div>`;
      const cells = years
        .map((year) => {
          const value = byRegionYear.get(`${region}-${year}`) || 0;
          const t = (value - min) / span;
          const idhBand = state.metric === "idh" ? getIdhBand(value) : null;
          const color = idhBand
            ? idhBand.color
            : `color-mix(in srgb, var(--accent-2) ${18 + t * 72}%, var(--surface-3))`;
          const title = idhBand
            ? `${region} ${year}: ${metric.format(value)} - ${idhBand.label}`
            : `${region} ${year}: ${metric.format(value)}`;
          return `<div class="heatmap-cell" data-region="${region}" title="${title}" style="background:${color};opacity:${state.metric === "idh" ? 0.92 : 0.62 + t * 0.38}"></div>`;
        })
        .join("");
      return label + cells;
    })
    .join("");

  el.heatmapChart.innerHTML = `
    <div class="heatmap-grid" style="--year-count:${years.length}">${header}${body}</div>
    ${state.metric === "idh" ? idhLegend() : continuousLegend()}`;

  el.heatmapChart.querySelectorAll("[data-region]").forEach((node) => {
    node.addEventListener("click", () => {
      state.region = state.region === node.dataset.region ? "Todas" : node.dataset.region;
      el.regionSelect.value = state.region;
      render();
    });
  });
}

function getIdhBand(value) {
  if (value >= 0.8) return { label: "Muito alto", color: "#16A34A" };
  if (value >= 0.7) return { label: "Alto", color: "#84CC16" };
  if (value >= 0.555) return { label: "Medio", color: "#F59E0B" };
  return { label: "Baixo", color: "#DC2626" };
}

function idhLegend() {
  const bands = [
    ["Baixo", "Abaixo de 0,555", "#DC2626"],
    ["Medio", "0,555 a 0,699", "#F59E0B"],
    ["Alto", "0,700 a 0,799", "#84CC16"],
    ["Muito alto", "0,800 ou mais", "#16A34A"],
  ];
  return `<div class="heatmap-legend">${bands
    .map(
      ([label, range, color]) =>
        `<span class="legend-item"><span class="legend-swatch" style="background:${color}"></span>${label}: ${range}</span>`,
    )
    .join("")}</div>`;
}

function continuousLegend() {
  return `<div class="heatmap-legend">
    <span>Menor</span>
    <span class="heatmap-scale"></span>
    <span>Maior</span>
  </div>`;
}

function renderTable(records) {
  const sorted = [...records].sort((a, b) => {
    const value = a[state.sortBy] - b[state.sortBy];
    return state.sortDir === "desc" ? -value : value;
  });
  el.tableSubtitle.textContent = `${sorted.length} registros filtrados`;
  el.dataTable.innerHTML = sorted
    .map(
      (d) => `<tr class="${state.selectedStates.has(d.estado) ? "active" : ""}" data-state="${d.estado}">
        <td>${d.estado}</td>
        <td>${d.regiao}</td>
        <td>${d.ano}</td>
        <td>${fmtInt(d.total_patentes)}</td>
        <td>${fmtMoney(d.pib_bilhoes_reais)}</td>
        <td>${fmt3(d.idh)}</td>
        <td>${fmtPct(d.percentual_pib_pd)}</td>
        <td>${fmtInt(d.populacao)}</td>
        <td>${fmtPct(d.taxa_analfabetismo)}</td>
      </tr>`,
    )
    .join("");
  el.dataTable.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => {
      state.selectedStates = new Set([row.dataset.state]);
      render();
    });
  });
}

function renderLine(container, series, metric) {
  if (!series.length) return empty(container);
  const width = 620;
  const height = 360;
  const margin = { top: 20, right: 30, bottom: 44, left: 64 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const max = Math.max(...series.map((d) => d.value), 1);
  const min = Math.min(...series.map((d) => d.value), 0);
  const span = max - min || 1;
  const xFor = (i) => margin.left + (i / (series.length - 1 || 1)) * plotW;
  const yFor = (value) => margin.top + plotH - ((value - min) / span) * plotH;
  const points = series.map((d, i) => `${xFor(i)},${yFor(d.value)}`).join(" ");
  const markers = series
    .map(
      (d, i) => `<g>
        <circle cx="${xFor(i)}" cy="${yFor(d.value)}" r="4" fill="var(--accent)"></circle>
        <title>${d.year}: ${metric.format(d.value)}</title>
      </g>`,
    )
    .join("");
  const labels = series
    .filter((_, i) => i % 2 === 0)
    .map((d, i) => {
      const originalIndex = i * 2;
      return `<text class="tick" x="${xFor(originalIndex) - 14}" y="${height - 16}">${d.year}</text>`;
    })
    .join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Série temporal">
      ${gridLines(width, height, margin)}
      <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="3"></polyline>
      ${markers}
      ${labels}
      <text class="axis" x="8" y="18">${metric.short}</text>
    </svg>`;
}

function gridLines(width, height, margin) {
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  return [0, 0.25, 0.5, 0.75, 1]
    .map((p) => {
      const y = margin.top + p * plotH;
      return `<line class="grid-line" x1="${margin.left}" y1="${y}" x2="${margin.left + plotW}" y2="${y}"></line>`;
    })
    .join("");
}

function rankByState(records, metricKey) {
  const grouped = new Map();
  records.forEach((d) => {
    if (!grouped.has(d.estado)) grouped.set(d.estado, []);
    grouped.get(d.estado).push(d);
  });
  return [...grouped.entries()]
    .map(([estado, rows]) => ({ estado, value: aggregate(rows, metricKey) }))
    .sort((a, b) => b.value - a.value);
}

function aggregate(records, metricKey) {
  return metrics[metricKey].aggregate === "avg" ? avg(records, metricKey) : sum(records, metricKey);
}

function sum(records, key) {
  return records.reduce((acc, row) => acc + Number(row[key] || 0), 0);
}

function avg(records, key) {
  return records.length ? sum(records, key) / records.length : 0;
}

function exportCsv() {
  const records = selectedBaseRecords();
  const headers = [
    "estado",
    "regiao",
    "ano",
    "total_patentes",
    "pib_bilhoes_reais",
    "idh",
    "percentual_pib_pd",
    "populacao",
    "rendimento_per_capita",
    "taxa_analfabetismo",
    "indice_gini",
  ];
  const rows = [headers.join(",")].concat(
    records.map((row) => headers.map((key) => JSON.stringify(row[key] ?? "")).join(",")),
  );
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dashboard_ufs_${state.year}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function empty(container) {
  container.innerHTML = `<div class="empty-state">Sem dados para os filtros atuais</div>`;
}

function fmtInt(value) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value || 0);
}

function fmtMoney(value) {
  if (!value) return "R$ 0";
  return `R$ ${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value / 1_000_000)} bi`;
}

function fmtMoneySmall(value) {
  return `R$ ${fmtInt(value)}`;
}

function fmtPct(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function fmt3(value) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

init();
