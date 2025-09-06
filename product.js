// Render products table
function renderProducts() {
  const tbody = document.querySelector("#productTable tbody");
  tbody.innerHTML = "";
  getProducts().forEach((p, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="text" class="prodName" value="${p.name}"></td>
      <td><input type="number" class="prodRate" value="${p.rate}" step="0.01"></td>
      <td><input type="number" class="prodStock" value="${p.stock}" step="1"></td>
      <td style="display:flex; gap:20px">
        <button class="btn-accent">💾 Save</button>
        <button class="btn-danger">🗑️ Delete</button>
      </td>
    `;
    tbody.appendChild(tr);

    // Save button
    tr.querySelector(".btn-accent").addEventListener("click", () => {
      const products = getProducts();
      products[index] = {
        name: tr.querySelector(".prodName").value,
        rate: parseFloat(tr.querySelector(".prodRate").value) || 0,
        stock: parseFloat(tr.querySelector(".prodStock").value) || 0
      };
      setProducts(products);
      renderProducts();
    });

    // Delete button
    tr.querySelector(".btn-danger").addEventListener("click", () => {
      const products = getProducts();
      products.splice(index, 1);
      setProducts(products);
      renderProducts();
    });
  });
}

// Add new product row at the end
document.getElementById("addProductBtn").addEventListener("click", () => {
  const products = getProducts();
  products.push({ name: "", rate: 0, stock: 0 });
  setProducts(products);
  renderProducts();
});

// Initial render
document.addEventListener("DOMContentLoaded", renderProducts);
