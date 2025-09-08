// ===== LocalStorage Keys =====
const SHIFT_KEY = "shiftData";
const LOG_KEY = "pumpReadingsV2";
const CONFIG_KEY = "pumpConfigV1";
const PRODUCTS_KEY = "productsData";
const CUSTOMERS_KEY = "customers";

const FUEL_RATES = {
  Petrol: 104.09,
  Diesel: 92.23,
  XP95: 111.41,
  "Extra Green": 95.91,
};

// ===== Local Helpers =====
function getShifts() {
  return JSON.parse(localStorage.getItem(SHIFT_KEY)) || [];
}
function setShifts(data) {
  localStorage.setItem(SHIFT_KEY, JSON.stringify(data));
  scheduleCloudSave(collectAllData());
}

function getDailyLog() {
  return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
}
function setDailyLog(d) {
  localStorage.setItem(LOG_KEY, JSON.stringify(d));
  scheduleCloudSave(collectAllData());
}

function getCustomers() {
  return JSON.parse(localStorage.getItem(CUSTOMERS_KEY) || "[]");
}
function setCustomers(list) {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(list));
  scheduleCloudSave(collectAllData());
}

function getProducts() {
  return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
}
function setProducts(data) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(data));
  scheduleCloudSave(collectAllData());
}

function getConfig() {
  return (
    JSON.parse(localStorage.getItem(CONFIG_KEY)) || [
      { id: "p1", name: "PUMP-1", fuel: "Petrol", rate: FUEL_RATES.Petrol },
      { id: "p2", name: "PUMP-2", fuel: "Diesel", rate: FUEL_RATES.Diesel },
      { id: "p3", name: "PUMP-3", fuel: "XP95", rate: FUEL_RATES.XP95 },
    ]
  );
}
function setConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  scheduleCloudSave(collectAllData());
}

// ===== Collect Everything =====
function collectAllData() {
  return {
    shifts: getShifts(),
    dailyLog: getDailyLog(),
    config: getConfig(),
    customers: getCustomers(),
    products: getProducts(),
  };
}

// ===== Cloud Save =====
let saveTimer;
document.addEventListener("DOMContentLoaded", () => {
  let loginBtn = document.getElementById("login-button");
  if (loginBtn) {
    loginBtn.addEventListener("click", signInWithGoogle);
  }
    let logOutBtn = document.getElementById("logout-button");
  if (logOutBtn) {
    logOutBtn.addEventListener("click", signOutUser);
  }
});

function scheduleCloudSave(data) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveAllToCloud(data);
  }, 1000);
}

async function saveAllToCloud(data) {
  const docRef = getDocRef();
  if (!docRef) return; // not logged in yet
  try {
    await docRef.set({ ...data, updatedAt: Date.now() }, { merge: true });
    log("✅ Synced to cloud");
  } catch (err) {
    console.error("Cloud save failed", err);
    log("❌ Cloud save failed: " + err.message);
  }
}

// ===== Cloud Listener =====
function startCloudListener() {
  const docRef = getDocRef();
  if (!docRef) return;
  docRef.onSnapshot((doc) => {
    if (doc.exists) {
      const remote = doc.data();
      log("📥 Cloud update received");

      if (remote.shifts)
        localStorage.setItem(SHIFT_KEY, JSON.stringify(remote.shifts));
      if (remote.dailyLog)
        localStorage.setItem(LOG_KEY, JSON.stringify(remote.dailyLog));
      if (remote.config)
        localStorage.setItem(CONFIG_KEY, JSON.stringify(remote.config));
      if (remote.customers)
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(remote.customers));
      if (remote.products)
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(remote.products));
    }
  });
}

// ===== Utility UI =====
function log(msg) {
  const out = document.getElementById("output");
  if (out) out.textContent += msg + "\n";
}
function mergeDailyLogs(getDailyLog, getShifts, getConfig, getProducts) {
  var configMap = {};
  for (var i = 0; i < getConfig.length; i++) {
    var cfg = getConfig[i];
    configMap[cfg.id] = cfg;
  }

  var productMap = {};
  for (var j = 0; j < getProducts.length; j++) {
    var prod = getProducts[j];
    productMap[prod.name] = { stock: prod.stock, rate: prod.rate };
  }

  var result = [];

  for (var d = 0; d < getDailyLog.length; d++) {
    var log = getDailyLog[d];
    var day = log.date;

    // find all shifts for this day
    var shifts = getShifts.filter(function (s) { return s.date === day; });

    var pumpsArr = [];
    var shiftPumps = [];
    var allProductsSold = [];
    var credits = [];
    var payments = { cash: 0, card: 0, upi: 0, fleet: 0 };
    var miscAmt = 0;
    var miscRems = [];
    var expected = 0;
    var persons = [];
    var personSummary = {};

    // attach pumps with config
    for (var key in log) {
      if (key.startsWith("p")) {
        var pumpObj = log[key];
        var cfg = configMap[key] || {};
        pumpsArr.push(Object.assign({ pumpId: key }, pumpObj, cfg));
      }
    }

    // merge shift data
    for (var s = 0; s < shifts.length; s++) {
      var shift = shifts[s];
      persons.push(shift.person);
      shiftPumps = shiftPumps.concat(shift.pumps || []);
      allProductsSold = allProductsSold.concat(shift.products || []);
      credits = credits.concat(shift.credits || []);

      payments.cash += shift.cash || 0;
      payments.card += shift.card || 0;
      payments.upi += shift.upi || 0;
      payments.fleet += shift.fleet || 0;

      miscAmt += shift.Miscamt || 0;
      if (shift.MiscRem) miscRems.push(shift.MiscRem);

      expected += shift.expected || 0;

      // person-wise init
      if (!personSummary[shift.person]) {
        personSummary[shift.person] = { pumpSales: {}, creditSales: [], products: [] };
      }

      // Pump sales assigned based on pumps in that shift
      for (var p = 0; p < (shift.pumps || []).length; p++) {
        var pid = shift.pumps[p];
        var pumpLog = log[pid];
        var cfg2 = configMap[pid];
        if (pumpLog && cfg2) {
          if (!personSummary[shift.person].pumpSales[cfg2.fuel]) {
            personSummary[shift.person].pumpSales[cfg2.fuel] = { liters: 0, amount: 0 };
          }
          personSummary[shift.person].pumpSales[cfg2.fuel].liters += pumpLog.sold || 0;
          personSummary[shift.person].pumpSales[cfg2.fuel].amount += pumpLog.amount || 0;
        }
      }

      // Credit sales
      personSummary[shift.person].creditSales =
        personSummary[shift.person].creditSales.concat(shift.credits || []);

      // Products per person
      personSummary[shift.person].products =
        personSummary[shift.person].products.concat(shift.products || []);
    }

    // Day-wise product summary (with product name as key)
    var productSummary = {};
    for (var pr = 0; pr < allProductsSold.length; pr++) {
      var sp = allProductsSold[pr];
      var base = productMap[sp.product] || { stock: 0, rate: sp.rate };

      if (!productSummary[sp.product]) {
        productSummary[sp.product] = {
          product: sp.product,
          rate: base.rate,
          soldQty: 0,
          soldAmount: 0,
          stockStart: base.stock,
          stockLeft: base.stock
        };
      }

      productSummary[sp.product].soldQty += sp.qty || 0;
      productSummary[sp.product].soldAmount += sp.amount || 0;
      productSummary[sp.product].stockLeft -= sp.qty || 0;
    }

    result.push({
      date: day,
      totalLiters: log.totalLiters,
      totalAmount: log.totalAmount,
      pumps: pumpsArr,
      products: Object.values(productSummary),
      credits: credits,
      payments: payments,
      Miscamt: miscAmt,
      MiscRem: miscRems.join("; "),
      expected: expected,
      person: persons.join(", "),
      shiftAdded: shifts.length > 0,
      shiftPumps: shiftPumps,
      personSummary: personSummary
    });
  }

  return result;
}

async function uploadLocalToCloud() {
  const docRef = getDocRef();
  if (!docRef) {
    log("⚠️ Not signed in");
    return;
  }
  await saveAllToCloud(collectAllData());
  log("⬆️ Forced upload of local data");
}
