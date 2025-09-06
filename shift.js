document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("pumpsCheckboxes");
  getConfig().forEach((pump) => {
    const div = document.createElement("label");
    div.className = "pump-card-selection";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "pumpCheckbox";
    input.style = " font-size: 18px;";
    input.value = pump.id;
    const pumpName = document.createElement("h2");
    pumpName.style = "color: white";
    pumpName.value = ` ${pump.name} • ${pump.fuel} @ ₹${pump.rate}`;

    div.appendChild(input);

    div.appendChild(pumpName);
    pumpName.append(` ${pump.name} • ${pump.fuel} @ ₹${pump.rate}`);
    // div.append(` ${pump.name} • ${pump.fuel} @ ₹${pump.rate}`);
    container.appendChild(div);

    // toggle active class on change
    input.addEventListener("change", () => {
      div.classList.toggle("active", input.checked);
    });
  });
  container.addEventListener("change", calcTotals);
  ["shiftDate", "pumpsCheckboxes"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", () => clearShiftEntriesAndTotals());
  });
  [
    "upi",
    "card",
    "fleet",
    "cash",
    "shiftDate",
    "miscAmt",
    "miscRemark",
    "pumpsCheckboxes",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", () => calcTotals());
  });
  document.getElementById("addCredit").addEventListener("click", addCreditRow);
  document
    .getElementById("addProduct")
    .addEventListener("click", addProductRow);
  document.getElementById("saveShift").addEventListener("click", saveShift);

  refreshShiftLog();
});

// Clear tables and totals on date/pump change
function clearShiftEntriesAndTotals() {
  document.querySelector("#creditTable tbody").innerHTML = "";
  document.querySelector("#productTable tbody").innerHTML = "";
  document.getElementById("upi").value = "";
  document.getElementById("card").value = "";
  document.getElementById("fleet").value = "";
  document.getElementById("cash").value = "";
  calcTotals();
}

// Add Credit Row
function addCreditRow() {
  const creditBody = document.querySelector("#creditTable tbody");

  const selectedPumps = Array.from(
    document.querySelectorAll(".pumpCheckbox:checked")
  )
    .map((cb) => {
      const pump = getConfig().find((p) => p.id === cb.value);
      return pump ? pump : null;
    })
    .filter((p) => p !== null);

  if (selectedPumps.length === 0) {
    alert("Please select at least one pump for credit entry.");
    return;
  }

  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><select class="creditCustomer"></select></td>
    <td><select class="creditVehicle"></select></select></td>
    <td><input class="billNo" placeholder="Bill No"></td>
    <td><input class="indentNo" placeholder="Indent No"></td>
    <td><input type="number" step="0.01" class="liters"></td>
    <td>
      <select class="pumpSelect">
        ${selectedPumps
          .map(
            (p) => `
          <option value="${p.id}" data-fuel="${p.fuel}" data-rate="${p.rate}">
            ${p.name} • ${p.fuel} @ ₹${p.rate}
          </option>`
          )
          .join("")}
      </select>
    </td>
    <td class="fuelCell"></td>
    <td class="rateCell"></td>
    <td><input type="number" class="amount" readonly></td>
    <td><button class="btn-danger delRow">✖</button></td>
  `;
  creditBody.appendChild(tr);

  const liters = tr.querySelector(".liters");
  const pumpSelect = tr.querySelector(".pumpSelect");
  const amount = tr.querySelector(".amount");
  const fuelCell = tr.querySelector(".fuelCell");
  const rateCell = tr.querySelector(".rateCell");
  const customerSelected = tr.querySelector(".creditCustomer");

  function recalc() {
    const opt = pumpSelect.selectedOptions[0];
    if (!opt) return;

    const rate = parseFloat(opt.dataset.rate) || 0;
    const litersVal = parseFloat(liters.value) || 0;

    fuelCell.textContent = opt.dataset.fuel;
    rateCell.textContent = "₹" + rate.toFixed(2);
    amount.value = (litersVal * rate).toFixed(2);

    calcTotals();
  }
  tr.querySelector(".creditCustomer").addEventListener("change", (e) => {
    const custId = parseInt(e.target.value);
    loadVehicleDropdown(tr.querySelector(".creditVehicle"), custId);
  });
  liters.addEventListener("input", recalc);
  pumpSelect.addEventListener("change", recalc);

  tr.querySelector(".delRow").addEventListener("click", () => {
    tr.remove();
    calcTotals();
  });
  loadCustomerDropdown(tr.querySelector(".creditCustomer"));
  recalc();
}
/// localCustomer
function loadCustomerDropdown(selectEl) {
  let options = `<option value="">-- Select Customer --</option>`;
  getCustomers().forEach((c) => {
    options += `<option value="${c.id}">${c.name}</option>`;
  });
  selectEl.innerHTML = options;
}
function loadVehicleDropdown(selectEl, custId) {
  selectEl.innerHTML = `<option value="">-- Select Vehicle --</option>`;
  if (custId === undefined) return;
  const customer = getCustomers().find((c) => c.id == custId);
  if (customer && customer.vehicles.length > 0) {
    customer.vehicles.forEach((v) => {
      selectEl.innerHTML += `<option value="${v}">${v}</option>`;
    });
  }
}
// Add Product Row
function addProductRow() {
  const productBody = document.querySelector("#productTable tbody");
  const tr = document.createElement("tr");

  const products = getProducts();

  tr.innerHTML = `
    <td>
      <select class="product">
        ${products
          .map(
            (p) =>
              `<option value="${p.name}" data-stock="${p.stock}">${p.name} (${p.stock} left)</option>`
          )
          .join("")}
      </select>
    </td>
    <td><input type="number" step="0.01" class="qty"></td>
    <td><span class="rate">0</span></td>
    <td><input type="number" class="amount" readonly></td>
    <td><button class="btn-danger delRow">✖</button></td>
  `;

  productBody.appendChild(tr);

  const sel = tr.querySelector(".product");
  const qty = tr.querySelector(".qty");
  const rateSpan = tr.querySelector(".rate");
  const amount = tr.querySelector(".amount");

  function recalc() {
    const prod = getProducts().find((p) => p.name === sel.value);
    const rate = prod ? prod.rate : 0;
    rateSpan.textContent = rate.toFixed(2);
    const stock = prod ? prod.stock : 0;
    if (parseFloat(qty.value) > stock) qty.value = stock; // limit qty to stock
    amount.value = (rate * (parseFloat(qty.value) || 0)).toFixed(2);
    calcTotals();
  }

  sel.addEventListener("change", recalc);
  qty.addEventListener("input", recalc);

  tr.querySelector(".delRow").addEventListener("click", () => {
    tr.remove();
    calcTotals();
  });

  recalc();
}

// Calculate totals
function calcTotals() {
  const upi = parseFloat(document.getElementById("upi").value) || 0;
  const card = parseFloat(document.getElementById("card").value) || 0;
  const fleet = parseFloat(document.getElementById("fleet").value) || 0;
  const cash = parseFloat(document.getElementById("cash").value) || 0;
  const Miscamt = parseFloat(document.getElementById("miscAmt").value) || 0;
  const MiscRem = document.getElementById("miscRemark").value;

  let creditTotal = 0;
  document.querySelectorAll("#creditTable tbody tr").forEach((tr) => {
    creditTotal += parseFloat(tr.querySelector(".amount").value) || 0;
  });

  let productTotal = 0;
  document.querySelectorAll("#productTable tbody tr").forEach((tr) => {
    productTotal += parseFloat(tr.querySelector(".amount").value) || 0;
  });

  const reported =
    upi + card + fleet + cash + Miscamt + creditTotal + productTotal;

  // Calculate expected for all selected pumps
  const selectedPumps = Array.from(
    document.querySelectorAll(".pumpCheckbox:checked")
  ).map((cb) => cb.value);
  let expected = 0;
  const date = document.getElementById("shiftDate").value;
  const logs = getDailyLog();
  const dayEntry = logs.find((l) => l.date === date);
  if (dayEntry) {
    selectedPumps.forEach((pid) => {
      if (dayEntry[pid]) expected += dayEntry[pid].amount;
    });
  }

  document.getElementById("expectedAmt").textContent =
    "₹" + expected.toLocaleString("en-IN");
  document.getElementById("reportedAmt").textContent =
    "₹" + reported.toLocaleString("en-IN");
  document.getElementById("diffAmt").textContent =
    "₹" + (reported - expected).toLocaleString("en-IN");
  if(reported - expected < 0) {
    document.getElementById("diffAmt").style.color = "red"
  } else {
    document.getElementById("diffAmt").style.color = "green"
  }
}

// Save Shift
function saveShift() {
  const date = document.getElementById("shiftDate").value;
  const person = document.getElementById("shiftPerson").value;
  const selectedPumps = Array.from(
    document.querySelectorAll(".pumpCheckbox:checked")
  ).map((cb) => cb.value);

  // Calculate total expected across selected pumps
  const logs = getDailyLog();
  const dayEntry = logs.find((l) => l.date === date);
  let expectedTotal = 0;
  if (dayEntry) {
    selectedPumps.forEach((pid) => {
      if (dayEntry[pid]) expectedTotal += dayEntry[pid].amount || 0;
    });
  }

  const shift = {
    date,
    person,
    pumps: selectedPumps,
    upi: parseFloat(document.getElementById("upi").value) || 0,
    card: parseFloat(document.getElementById("card").value) || 0,
    fleet: parseFloat(document.getElementById("fleet").value) || 0,
    cash: parseFloat(document.getElementById("cash").value) || 0,
    Miscamt: parseFloat(document.getElementById("miscAmt").value) || 0,
    MiscRem: document.getElementById("miscRemark").value,
    credits: [],
    products: [],
    expected: expectedTotal,
  };

  // Add credits
  document
    .querySelector("#creditTable tbody")
    .addEventListener("input", (e) => {
      if (e.target.classList.contains("liters")) {
        const tr = e.target.closest("tr");
        const pumpSelect = tr.querySelector(".pumpSelect");
        const opt = pumpSelect.selectedOptions[0];
        const rate = parseFloat(opt.dataset.rate) || 0;
        const liters = parseFloat(e.target.value) || 0;

        tr.querySelector(".amount").value = (liters * rate).toFixed(2);

        // update cells if you want
        const fuelCell = tr.querySelector(".fuelCell");
        const rateCell = tr.querySelector(".rateCell");
        if (fuelCell) fuelCell.textContent = opt.dataset.fuel;
        if (rateCell) rateCell.textContent = "₹" + rate.toFixed(2);

        calcTotals();
      }
    });

  document.querySelectorAll("#creditTable tbody tr").forEach((tr) => {
    shift.credits.push({
      customerId: parseInt(tr.querySelector(".creditCustomer").value) || null,
      customerName: tr.querySelector(".creditCustomer").selectedOptions[0]?.text || "",
      veh: tr.querySelector(".creditVehicle").selectedOptions[0]?.text || "", 
      bill: tr.querySelector(".billNo").value,
      indent: tr.querySelector(".indentNo").value,
      liters: parseFloat(tr.querySelector(".liters").value) || 0,
      fuel: tr.querySelector(".fuelCell").textContent,
      rate:
        parseFloat(
          tr.querySelector(".rateCell").textContent.replace("₹", "")
        ) || 0,
      amount: parseFloat(tr.querySelector(".amount").value) || 0,
    });
  });
  // Add products & update inventory
  document.querySelectorAll("#productTable tbody tr").forEach((tr) => {
    const prodName = tr.querySelector(".product").value;
    const qty = parseFloat(tr.querySelector(".qty").value) || 0;
    const products = getProducts();
    const product = products.find((p) => p.name === prodName);
    if (product) product.stock = Math.max(0, product.stock - qty);
    setProducts(products);

    shift.products.push({
      product: prodName,
      qty,
      rate: parseFloat(tr.querySelector(".rate").textContent) || 0,
      amount: parseFloat(tr.querySelector(".amount").value) || 0,
    });
  });

  const shifts = getShifts();
  shifts.push(shift);
  setShifts(shifts);
  refreshShiftLog();
  alert("Shift saved ✅");
  clearShiftEntriesAndTotals();
}

// Refresh Shift Log
function refreshShiftLog() {
  const shifts = getShifts();
  const body = document.getElementById("shiftLogBody");
  const count = document.getElementById("shiftCount");
  body.innerHTML = "";

  shifts.forEach((s, i) => {
    const reported =
      (s.upi || 0) +
      (s.card || 0) +
      (s.fleet || 0) +
      (s.cash || 0) +
      (s.Miscamt || 0) +
      (s.credits || []).reduce((t, c) => t + (c.amount || 0), 0) +
      (s.products || []).reduce((t, p) => t + (p.amount || 0), 0);

    const diff = reported - (s.expected || 0);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.date}</td>
      <td>${s.person || "-"}</td>
      <td>${s.pumps.join("-") || "-"}</td>
      <td class="right">₹${(s.expected || 0).toFixed(2)}</td>
      <td class="right">₹${reported.toFixed(2)}</td>
      <td class="right" style="color:${
        diff === 0 ? "green" : "red"
      }">₹${diff.toFixed(2)}</td>
      <td class="center">${
        s.credits.length > 0
          ? `<button class="credit-btn" data-index="${i}">💳 ${s.credits.length} entries</button>`
          : "-"
      }</td>
      <td class="center">${
        s.products.length > 0
          ? `<button class="product-btn" data-index="${i}">📦 ${s.products.length} entries</button>`
          : "-"
      }</td>
      <td class="center"><button class="viewShiftBtn" data-index="${i}">👁 View</button></td>
    `;
    body.appendChild(tr);
  });

  count.textContent = shifts.length + " Shifts";

  // Attach modal buttons
  document.querySelectorAll(".credit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) =>
      showCreditModal(shifts[e.target.dataset.index].credits)
    );
  });
  document.querySelectorAll(".product-btn").forEach((btn) => {
    btn.addEventListener("click", (e) =>
      showProductModal(shifts[e.target.dataset.index].products)
    );
  });
  document.querySelectorAll(".viewShiftBtn").forEach((btn) => {
    btn.addEventListener("click", (e) =>
      showShiftDetails(shifts[e.target.dataset.index])
    );
  });
}

// Show Credit Modal
function showCreditModal(credits) {
  const modal = document.getElementById("creditModal");
  const body = document.getElementById("creditModalBody");

  body.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Customer Name</th>
          <th>Vehicle</th>
          <th>Bill No</th>
          <th>Indent No</th>
          <th>Fuel</th>
          <th>Liters</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${credits
          .map(
            (c) => `
          <tr>
          <td>${c.customerName || "-"}</td>
            <td>${c.veh || "-"}</td>
            <td>${c.bill || "-"}</td>
            <td>${c.indent || "-"}</td>
            <td>${c.fuel || "-"}</td>
            <td>${(c.liters || 0).toFixed(2)}</td>
            <td>₹${(c.rate || 0).toFixed(2)}</td>
            <td>₹${(c.amount || 0).toFixed(2)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;

  modal.style.display = "block";
}

// Show Product Modal
function showProductModal(products) {
  const modal = document.getElementById("productModal");
  const body = document.getElementById("productModalBody");
  body.innerHTML = `
    <table>
      <thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        ${products
          .map(
            (p) => `
          <tr>
            <td>${p.product || "-"}</td>
            <td>${(p.qty || 0).toFixed(2)}</td>
            <td>₹${(p.rate || 0).toFixed(2)}</td>
            <td>₹${(p.amount || 0).toFixed(2)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
  modal.style.display = "block";
}

// Show Shift Details Modal
function showShiftDetails(shift) {
  const modal = document.getElementById("shiftDetailModal");
  const body = document.getElementById("shiftDetailBody");

  // --- Group credits by fuel ---
  const fuelSummary = {};
  let totalLiters = 0;
  let totalFuelAmt = 0;

  (shift.credits || []).forEach((c) => {
    if (!fuelSummary[c.fuel]) fuelSummary[c.fuel] = { liters: 0, total: 0 };
    fuelSummary[c.fuel].liters += c.liters || 0;
    fuelSummary[c.fuel].total += c.amount || 0;
    totalLiters += c.liters || 0;
    totalFuelAmt += c.amount || 0;
  });

  // --- Reported total ---
  const reported =
    (shift.upi || 0) +
    (shift.card || 0) +
    (shift.fleet || 0) +
    (shift.cash || 0) +
    (shift.Miscamt || 0) +
    (shift.credits || []).reduce((t, c) => t + (c.amount || 0), 0) +
    (shift.products || []).reduce((t, p) => t + (p.amount || 0), 0);

  const expected = shift.expected || 0;
  const diff = reported - expected;

  body.innerHTML = `
    <h3>Shift Info</h3>
    <p><b>Date:</b> ${shift.date}</p>
    <p><b>Person:</b> ${shift.person}</p>
    <p><b>Pumps:</b> ${(shift.pumps || []).join(", ")}</p>

    <h3>Fuel Sales</h3>
    <table>
      <thead><tr><th>Fuel</th><th>Liters</th><th>Total</th></tr></thead>
      <tbody>
        ${
          Object.entries(fuelSummary)
            .map(
              ([fuel, f]) => `
          <tr>
            <td>${fuel}</td>
            <td>${f.liters.toFixed(2)}</td>
            <td>₹${f.total.toFixed(2)}</td>
          </tr>
        `
            )
            .join("") || "<tr><td colspan='3'>No fuel sales</td></tr>"
        }
        <tr style="font-weight:bold; border-top:2px solid #000;">
          <td>Total</td>
          <td>${totalLiters.toFixed(2)}</td>
          <td>₹${totalFuelAmt.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <h3>Credit Transactions</h3>
    <table>
      <thead><tr><th>Vehicle</th><th>Bill</th><th>Indent</th><th>Fuel</th><th>Liters</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        ${
          (shift.credits || [])
            .map(
              (c) => `
          <tr>
            <td>${c.veh || "-"}</td>
            <td>${c.bill || "-"}</td>
            <td>${c.indent || "-"}</td>
            <td>${c.fuel || "-"}</td>
            <td>${(c.liters || 0).toFixed(2)}</td>
            <td>₹${(c.rate || 0).toFixed(2)}</td>
            <td>₹${(c.amount || 0).toFixed(2)}</td>
          </tr>`
            )
            .join("") || "<tr><td colspan='7'>No credit sales</td></tr>"
        }
      </tbody>
    </table>

    <h3>Products</h3>
    <table>
      <thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        ${
          (shift.products || [])
            .map(
              (p) => `
          <tr>
            <td>${p.product}</td>
            <td>${p.qty}</td>
            <td>₹${p.rate.toFixed(2)}</td>
            <td>₹${p.amount.toFixed(2)}</td>
          </tr>`
            )
            .join("") || "<tr><td colspan='4'>No products</td></tr>"
        }
      </tbody>
    </table>

    <h3>Payments</h3>
    <ul>
      <li>UPI: ₹${shift.upi || 0}</li>
      <li>Card: ₹${shift.card || 0}</li>
      <li>Fleet Card: ₹${shift.fleet || 0}</li>
      <li>Cash: ₹${shift.cash || 0}</li>
      <li>Miscellaneous: ₹${shift.Miscamt || 0} - ${shift.MiscRem || "NA"}</li>
    </ul>

    <h3>Settlement</h3>
    <p><b>Expected:</b> ₹${expected.toFixed(2)}</p>
    <p><b>Reported:</b> ₹${reported.toFixed(2)}</p>
    <p><b>Difference:</b> <span style="color:${
      diff < 0 ? "red" : "green"
    }">₹${diff.toFixed(2)}</span></p>
  `;

  modal.style.display = "block";
}

// Close modals
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".modal-close").forEach((span) => {
    span.onclick = () => (span.closest(".modal").style.display = "none");
  });
  window.onclick = (e) => {
    if (e.target.classList.contains("modal")) e.target.style.display = "none";
  };
});
document.addEventListener("DOMContentLoaded", () => {
  // Attach delegated input listener for dynamically added rows
  document
    .querySelector("#creditTable tbody")
    .addEventListener("input", (e) => {
      if (e.target.classList.contains("liters")) {
        const tr = e.target.closest("tr");
        const pumpSelect = tr.querySelector(".pumpSelect");
        const opt = pumpSelect.selectedOptions[0];
        const rate = parseFloat(opt.dataset.rate) || 0;
        const liters = parseFloat(e.target.value) || 0;

        tr.querySelector(".amount").value = (liters * rate).toFixed(2);

        const fuelCell = tr.querySelector(".fuelCell");
        const rateCell = tr.querySelector(".rateCell");
        if (fuelCell) fuelCell.textContent = opt.dataset.fuel;
        if (rateCell) rateCell.textContent = "₹" + rate.toFixed(2);

        calcTotals();
      }
    });

  document
    .querySelector("#creditTable tbody")
    .addEventListener("change", (e) => {
      if (e.target.classList.contains("pumpSelect")) {
        const tr = e.target.closest("tr");
        const opt = e.target.selectedOptions[0];
        const rate = parseFloat(opt.dataset.rate) || 0;
        const liters = parseFloat(tr.querySelector(".liters").value) || 0;

        tr.querySelector(".amount").value = (liters * rate).toFixed(2);

        const fuelCell = tr.querySelector(".fuelCell");
        const rateCell = tr.querySelector(".rateCell");
        if (fuelCell) fuelCell.textContent = opt.dataset.fuel;
        if (rateCell) rateCell.textContent = "₹" + rate.toFixed(2);

        calcTotals();
      }
    });

  document
    .querySelector("#productTable tbody")
    .addEventListener("input", (e) => {
      if (e.target.classList.contains("qty")) {
        const tr = e.target.closest("tr");
        const rate = parseFloat(tr.querySelector(".rate").textContent) || 0;
        const qty = parseFloat(e.target.value) || 0;
        tr.querySelector(".amount").value = (qty * rate).toFixed(2);
        calcTotals();
      }
    });

  // Handle product select change
  document
    .querySelector("#productTable tbody")
    .addEventListener("change", (e) => {
      if (e.target.classList.contains("qty")) {
        const tr = e.target.closest("tr");
        const rate = parseFloat(tr.querySelector(".rate").textContent) || 0;
        const qty = parseFloat(e.target.value) || 0;

        tr.querySelector(".amount").value = (qty * rate).toFixed(2);

        calcTotals();
      }
    });
});
