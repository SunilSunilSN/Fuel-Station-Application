// ===== Credit Customers =====

// Render table
function renderCustomers() {
  const tbody = document.querySelector("#customerTable tbody");
  tbody.innerHTML = "";

  getCustomers().forEach((c, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.email || "-"}</td>
      <td>${c.phone || "-"}</td>
      <td>${(c.vehicles || []).join(", ")}</td>
      <td style="display:flex; gap:20px">
        <button class="btn-primary" data-index="${i}">✏ Edit</button>
        <button class="btn-danger" data-index="${i}">🗑 Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach actions
  document.querySelectorAll(".btn-primary").forEach(btn =>
    btn.addEventListener("click", e => editCustomer(e.target.dataset.index))
  );
  document.querySelectorAll(".btn-danger").forEach(btn =>
    btn.addEventListener("click", e => deleteCustomer(e.target.dataset.index))
  );
}

// Open modal (Add/Edit)
function openCustomerModal(editIndex = null) {
  const modal = document.getElementById("customerModal");
  const form = document.getElementById("customerForm");
  const title = document.getElementById("customerModalTitle");

  if (editIndex !== null) {
    // Editing
    const cust = getCustomers()[editIndex];
    document.getElementById("custId").value = editIndex;
    document.getElementById("custName").value = cust.name;
    document.getElementById("custEmail").value = cust.email || "";
    document.getElementById("custPhone").value = cust.phone || "";
    document.getElementById("custVehicles").value = (cust.vehicles || []).join(", ");
    title.textContent = "Edit Customer";
  } else {
    // Adding
    form.reset();
    document.getElementById("custId").value = "";
    title.textContent = "Add Customer";
  }

  modal.style.display = "block";
}

// Edit customer
function editCustomer(index) {
  openCustomerModal(index);
}

// Delete customer
function deleteCustomer(index) {
  if (confirm("Delete this customer?")) {
    let custs = getCustomers();
    custs.splice(index, 1);
    setCustomers(custs);
    renderCustomers();
  }
}

// Close modal
function closeCustomerModal() {
  document.getElementById("customerModal").style.display = "none";
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  renderCustomers();

  document.getElementById("addCustomer").addEventListener("click", () => openCustomerModal());

  // Handle form save
  document.getElementById("customerForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = document.getElementById("custId").value;
    const cust = {
    id: getCustomers().length + 1,
      name: document.getElementById("custName").value.trim(),
      email: document.getElementById("custEmail").value.trim(),
      phone: document.getElementById("custPhone").value.trim(),
      vehicles: document.getElementById("custVehicles").value
        .split(",")
        .map(v => v.trim())
        .filter(v => v)
    };

    let custs = getCustomers();
    if (id) {
      custs[id] = cust; // update
    } else {
      custs.push(cust); // add new
    }
    setCustomers(custs);
    renderCustomers();
    closeCustomerModal();
  });

  // Modal close
  document.querySelector("#customerModal .modal-close").onclick = closeCustomerModal;
  window.onclick = e => {
    if (e.target.classList.contains("modal")) closeCustomerModal();
  };
});
