const fs = require("node:fs");
const vm = require("node:vm");

class ClassList {
  constructor() {
    this.items = new Set();
  }
  toggle(name, force) {
    if (force === undefined ? !this.items.has(name) : force) this.items.add(name);
    else this.items.delete(name);
  }
}

class Element {
  constructor(id = "") {
    this.id = id;
    this.value = "";
    this.textContent = "";
    this.innerHTML = "";
    this.dataset = {};
    this.style = {};
    this.classList = new ClassList();
  }
  addEventListener() {}
  querySelectorAll() {
    return [];
  }
  click() {}
}

const ids = [
  "yearSelect",
  "metricSelect",
  "lineMetricSelect",
  "regionSelect",
  "searchInput",
  "stateChips",
  "darkTheme",
  "lightTheme",
  "resetFilters",
  "selectTop",
  "clearState",
  "exportCsv",
  "sortSelect",
  "sortDirection",
  "rankingChart",
  "lineChart",
  "scatterChart",
  "regionChart",
  "heatmapChart",
  "heatmapSubtitle",
  "dataTable",
  "tableSubtitle",
  "rankingTitle",
  "lineSubtitle",
  "scatterYear",
  "kpiPatents",
  "kpiPatentsSub",
  "kpiPib",
  "kpiIdh",
  "kpiPd",
];

const elements = new Map(ids.map((id) => [`#${id}`, new Element(id)]));
const context = {
  console,
  window: {},
  Blob: class Blob {},
  URL: { createObjectURL: () => "blob:mock", revokeObjectURL: () => {} },
  document: {
    body: new Element("body"),
    querySelector(selector) {
      if (!elements.has(selector)) throw new Error(`Missing selector ${selector}`);
      return elements.get(selector);
    },
    createElement() {
      return new Element();
    },
  },
  Intl,
  Set,
  Map,
  Math,
  Number,
  String,
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("data.js", "utf8"), context, { filename: "data.js" });
vm.runInContext(fs.readFileSync("app.js", "utf8"), context, { filename: "app.js" });

for (const selector of ["#rankingChart", "#lineChart", "#scatterChart", "#regionChart", "#heatmapChart", "#dataTable"]) {
  if (!elements.get(selector).innerHTML) {
    throw new Error(`${selector} did not render content`);
  }
}

console.log("dashboard smoke test passed");
