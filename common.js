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

function testAddShift() {
  const shifts = getShifts();
  shifts.push({
    date: new Date().toISOString(),
    person: "Tester",
    pumps: ["PUMP-1"],
    credits: [],
    products: [],
    expected: 1000,
    upi: 500,
    cash: 500,
  });
  setShifts(shifts);
  log("➕ Added dummy shift");
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
