// ===== Fuel Price Cards =====
function renderFuelPrices() {
  const container = document.getElementById("fuelPrices");
  if (!container) return;
  container.innerHTML = "";
  Object.entries(FUEL_RATES).forEach(([fuel, rate]) => {
    const card = document.createElement("div");
    card.className = "fuel-card";
    card.innerHTML = `<div class="fuel-name">${fuel}</div>
                      <div class="fuel-rate">₹${rate}/L</div>`;
    container.appendChild(card);
  });
}

// ===== Daily Form =====
function renderDailyForm() {
  const container = document.getElementById("dailyFormContainer");
  container.innerHTML = "";

  const topRow = document.createElement("div");
  topRow.className = "row";
  topRow.innerHTML = `
    <div class="field" style="max-width:220px">
      <label>Date</label>
      <input type="date" id="date">
    </div>`;
  container.appendChild(topRow);

  const grid = document.createElement("div");
  grid.className = "pump-grid";

  getConfig().forEach((p) => {
    const card = document.createElement("div");
    card.className = "pump-card";
    card.innerHTML = `
      <h3>${p.name} <span class="fuel-label">${p.fuel}</span></h3>
      <div class="row">
        <div class="field">
          <label>Start (L)</label>
          <input id="${p.id}s" type="number" min="0" step="0.01"/>
        </div>
        <div class="field">
          <label>End (L)</label>
          <input id="${p.id}e" type="number" min="0" step="0.01"/>
        </div>
      </div>
      <div class="row">
<div class="field">
  <label>Sold (L)</label>
  <div class="output" id="${p.id}sold">0.00</div>
</div>
<div class="field">
  <label>Amount (₹)</label>
  <div class="output" id="${p.id}amt">0.00</div>
</div>

      </div>`;
    grid.appendChild(card);
  });

  container.appendChild(grid);

  const totals = document.createElement("div");
  totals.className = "totals-grid";
  totals.id = "fuelTotals"; // container for per-fuel totals
  container.appendChild(totals);

  const btns = document.createElement("div");
  btns.className = "row";
  btns.innerHTML = `<button id="saveBtn" class="btn-primary">💾 Save Day</button>`;
  container.appendChild(btns);

  document.getElementById("date").addEventListener("change", recalcForm);
  container
    .querySelectorAll("input[type=number]")
    .forEach((inp) => inp.addEventListener("input", recalcForm));
  document.getElementById("saveBtn").addEventListener("click", saveDay);
}

function recalcForm() {
  const fuelTotals = {}; // { fuel: { liters, amount } }
  let grandLiters = 0,
    grandAmount = 0;

  getConfig().forEach((p) => {
    const s = parseFloat(document.getElementById(p.id + "s").value) || 0;
    const e = parseFloat(document.getElementById(p.id + "e").value) || 0;
    const sold = Math.max(0, e - s);
    const amt = sold * p.rate;

    document.getElementById(p.id + "sold").textContent = sold.toFixed(2);
    document.getElementById(p.id + "amt").textContent =
      amt.toLocaleString("en-IN");

    // accumulate by fuel type
    if (!fuelTotals[p.fuel]) fuelTotals[p.fuel] = { liters: 0, amount: 0 };
    fuelTotals[p.fuel].liters += sold;
    fuelTotals[p.fuel].amount += amt;

    grandLiters += sold;
    grandAmount += amt;
  });

  // render per-fuel totals
  const totalsDiv = document.getElementById("fuelTotals");
  totalsDiv.innerHTML = "";

  Object.entries(fuelTotals).forEach(([fuel, v]) => {
    const card = document.createElement("div");
    card.className = "total-card fuel-card   ";
    card.innerHTML = `<div class="fuel-name">${fuel}</div>
      <div class="fuel-rate">${v.liters.toFixed(
        2
      )} L – ₹${v.amount.toLocaleString("en-IN")}</div>`;
    totalsDiv.appendChild(card);
  });

  // optional grand total card at end
  const grand = document.createElement("div");
  grand.className = "fuel-card   ";
  grand.innerHTML = `<div class="fuel-name">TOTAL</div>
    <dic class="fuel-rate">₹${grandAmount.toLocaleString("en-IN")}</div>`;
  totalsDiv.appendChild(grand);
}

function saveDay() {
  const date = document.getElementById("date").value;
  if (!date) {
    alert("Pick a date");
    return;
  }
  const entry = { date, totalLiters: 0, totalAmount: 0 };
  getConfig().forEach((p) => {
    const s = parseFloat(document.getElementById(p.id + "s").value) || 0;
    const e = parseFloat(document.getElementById(p.id + "e").value) || 0;
    const sold = Math.max(0, e - s);
    const amt = sold * p.rate;
    entry[p.id] = { start: s, end: e, sold, amount: amt };
    entry.totalLiters += sold;
    entry.totalAmount += amt;
  });
  let d = getDailyLog();
  const idx = d.findIndex((x) => x.date === date);
  if (idx >= 0) d[idx] = entry;
  else d.push(entry);
  setDailyLog(d);
  alert("Saved");
}

// ===== Log =====
function renderLogHeader() {
  const header = document.getElementById("logHeader");
  header.innerHTML = "";
  const tr = document.createElement("tr");
  tr.innerHTML = "<th>Date</th>";

  // Unique fuels from config
  const fuels = [...new Set(getConfig().map((p) => p.fuel))];

  fuels.forEach((fuel) => {
    tr.innerHTML += `<th class="right">${fuel} Liters</th><th class="right">${fuel} Amount</th>`;
  });

  tr.innerHTML +=
    "<th class='right'>Total Liters</th><th class='right'>Total Amount</th>";
  header.appendChild(tr);
}

function refreshLog() {
  const body = document.getElementById("logBody");
  body.innerHTML = "";

  const fuels = [...new Set(getConfig().map((p) => p.fuel))];

  getDailyLog().forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.date}</td>`;

    let tLiters = 0,
      tAmount = 0;

    fuels.forEach((fuel) => {
      let liters = 0,
        amount = 0;

      // Sum across pumps of same fuel
      getConfig()
        .filter((p) => p.fuel === fuel)
        .forEach((p) => {
          const d = r[p.id] || { sold: 0, amount: 0 };
          liters += d.sold;
          amount += d.amount;
        });

      tLiters += liters;
      tAmount += amount;

      tr.innerHTML += `<td class="right">${liters.toFixed(
        2
      )}</td><td class="right">₹${amount.toLocaleString("en-IN")}</td>`;
    });

    tr.innerHTML += `<td class="right">${tLiters.toFixed(
      2
    )}</td><td class="right">₹${tAmount.toLocaleString("en-IN")}</td>`;
    body.appendChild(tr);
  });

  document.getElementById("logCount").textContent =
    getDailyLog().length + " days";
}

// ===== Monthly =====
function updateMonth() {
  const month = document.getElementById("monthPicker").value;
  const body = document.getElementById("monthlyBody");
  body.innerHTML = "";
  if (!month) {
    document.getElementById("monthTitle").textContent = "—";
    return;
  }

  const rows = {};
  let tL = 0,
    tA = 0;
  getDailyLog()
    .filter((d) => d.date.startsWith(month))
    .forEach((d) => {
      getConfig().forEach((p) => {
        const v = d[p.id] || { sold: 0, amount: 0 };
        if (!rows[p.fuel]) rows[p.fuel] = { liters: 0, amount: 0 };
        rows[p.fuel].liters += v.sold;
        rows[p.fuel].amount += v.amount;
        tL += v.sold;
        tA += v.amount;
      });
    });

  Object.entries(rows).forEach(([fuel, v]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${fuel}</td><td class="right">${v.liters.toFixed(
      2
    )}</td><td class="right">₹${v.amount.toLocaleString("en-IN")}</td>`;
    body.appendChild(tr);
  });
  document.getElementById("mTL").textContent = tL.toFixed(2);
  document.getElementById("mTA").textContent = "₹" + tA.toLocaleString("en-IN");
  document.getElementById("monthTitle").textContent = month;
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  renderFuelPrices();
  renderDailyForm();
  renderLogHeader();
  refreshLog();
  document
    .getElementById("monthPicker")
    .addEventListener("change", updateMonth);
});
