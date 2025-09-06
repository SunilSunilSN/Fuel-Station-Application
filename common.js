const SHIFT_KEY = "shiftData";
const LOG_KEY = "pumpReadingsV2";
const CONFIG_KEY = "pumpConfigV1";
const FUEL_RATES = {
  Petrol: 104.09,
  Diesel: 92.23,
  XP95: 111.41,
  "Extra Green": 95.91,
};
const PRODUCTS_KEY = "productsData"; // new key for products inventory

// Get products from localStorage
function getProducts() {
  // Returns array of products with {name, rate, stock}
  return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
}
// Save products to localStorage
function setProducts(data) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(data));
}

function getShifts() {
  return JSON.parse(localStorage.getItem(SHIFT_KEY)) || [];
}
function setShifts(data) {
  localStorage.setItem(SHIFT_KEY, JSON.stringify(data));
}
function getDailyLog() {
  return JSON.parse(localStorage.getItem(LOG_KEY)) || [];
}
function setDailyLog(d) {
  localStorage.setItem(LOG_KEY, JSON.stringify(d));
  refreshLog();
  updateMonth();
}
function getCustomers() {
  return JSON.parse(localStorage.getItem("customers") || "[]");
}
function setCustomers(list) {
  localStorage.setItem("customers", JSON.stringify(list));
}
// ===== Config Helpers =====
function getConfig() {
  return (
    JSON.parse(localStorage.getItem(CONFIG_KEY)) || [
      { id: "p1", name: "PUMP-1", fuel: "Petrol", rate: FUEL_RATES.Petrol },
      { id: "p2", name: "PUMP-2", fuel: "Diesel", rate: FUEL_RATES.Diesel },
      { id: "p3", name: "PUMP-3", fuel: "XP95", rate: FUEL_RATES.XP95 },
    ]
  );
}

