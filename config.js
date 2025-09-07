// const CONFIG_KEY = "pumpConfigV1";

// const FUEL_RATES = {
//   Petrol: 104.09,
//   Diesel: 92.23,
//   XP95: 111.41,
//   "Extra Green": 95.91
// };

// function getConfig() {
//   return (
//     JSON.parse(localStorage.getItem(CONFIG_KEY)) || [
//       { id: "p1", name: "PUMP-1", fuel: "Petrol", rate: FUEL_RATES.Petrol },
//       { id: "p2", name: "PUMP-2", fuel: "Diesel", rate: FUEL_RATES.Diesel },
//       { id: "p3", name: "PUMP-3", fuel: "XP95", rate: FUEL_RATES.XP95 }
//     ]
//   );
// }

// function setConfig(cfg) {
//   localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
//   renderConfig();
// }

function renderConfig() {
  const body = document.getElementById("pumpConfigBody");
  if (!body) return;
  body.innerHTML = "";
  getConfig().forEach((p, idx) => {
    const tr = document.createElement("tr");

    // Pump Name
    const tdName = document.createElement("td");
    const inpName = document.createElement("input");
    inpName.value = p.name;
    inpName.addEventListener("change", () => {
      const cfg = getConfig();
      cfg[idx].name = inpName.value;
      setConfig(cfg);
      renderConfig();
    });
    tdName.appendChild(inpName);

    // Fuel Type (dropdown)
    const tdFuel = document.createElement("td");
    const selFuel = document.createElement("select");
    Object.keys(FUEL_RATES).forEach(f => {
      const opt = document.createElement("option");
      opt.value = f;
      opt.textContent = f;
      if (f === p.fuel) opt.selected = true;
      selFuel.appendChild(opt);
    });
    selFuel.addEventListener("change", () => {
      const cfg = getConfig();
      cfg[idx].fuel = selFuel.value;
      cfg[idx].rate = FUEL_RATES[selFuel.value]; // update rate automatically
      setConfig(cfg);
    });
    tdFuel.appendChild(selFuel);

    // Actions
    const tdAct = document.createElement("td");
    tdAct.className = "center";
    const delBtn = document.createElement("button");
    delBtn.className = "btn-danger";
    delBtn.textContent = "🗑 Delete";
    delBtn.addEventListener("click", () => {
      if (!confirm("Delete this pump?")) return;
      const cfg = getConfig();
      cfg.splice(idx, 1);
      setConfig(cfg);
      renderConfig();
    });
    tdAct.appendChild(delBtn);

    tr.appendChild(tdName);
    tr.appendChild(tdFuel);
    tr.appendChild(tdAct);

    body.appendChild(tr);
  });
}

function addPump() {
  const cfg = getConfig();
  const id = "p" + (getConfig().length + 1);
  cfg.push({
    id,
    name: "PUMP-" + (cfg.length + 1),
    fuel: "Petrol",
    rate: FUEL_RATES.Petrol
  });
  setConfig(cfg);
  renderConfig();
}

document.addEventListener("DOMContentLoaded", () => {
  renderConfig();
  document.getElementById("addPump").addEventListener("click", addPump);
});
