const productGrid = document.getElementById("productGrid");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutButton = document.getElementById("checkoutButton");
const toastContainer = document.getElementById("toastContainer");
const CART_STORAGE_KEY = "standStoreCart";

let products = [];
let cart = [];

const formatCurrency = (value) => value.toLocaleString("es-AR");

const createToast = (message, type = "success") => {
  const toastElement = document.createElement("div");
  toastElement.className = `toast align-items-center text-bg-${type} border-0`;
  toastElement.role = "alert";
  toastElement.ariaLive = "assertive";
  toastElement.ariaAtomic = "true";
  toastElement.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
    </div>
  `;

  toastContainer.appendChild(toastElement);
  const toast = new bootstrap.Toast(toastElement, { delay: 2500 });
  toast.show();
  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });
};

const saveCart = () => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
};

const loadCart = () => {
  const storedCart = localStorage.getItem(CART_STORAGE_KEY);
  cart = storedCart ? JSON.parse(storedCart) : [];
};

const getProduct = (productId) => products.find((item) => item.id === productId);

const renderProductCard = (product) => {
  const statsRows = Object.entries(product.stats)
    .map(
      ([label, value]) =>
        `<div class="col-6 mb-1"><strong>${label}:</strong> ${value}</div>`
    )
    .join("");

  return `
    <div class="col">
      <div class="card h-100 shadow-sm">
        <img src="${product.image}" class="card-img-top" alt="${product.name}" style="height: 220px; object-fit: cover;" />
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${product.name}</h5>
          <p class="card-text">${product.description}</p>
          <div class="row small text-muted mb-3">${statsRows}</div>
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="fw-bold">$${formatCurrency(product.price)}</span>
              <span class="badge bg-secondary">Stock: ${product.stock}</span>
            </div>
            <button
              type="button"
              class="btn btn-primary w-100 add-to-cart-btn"
              data-product-id="${product.id}"
              ${product.stock === 0 ? "disabled" : ""}
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};

const renderProducts = () => {
  if (!products.length) {
    productGrid.innerHTML = `
      <div class="col">
        <div class="alert alert-warning">No hay productos disponibles en este momento.</div>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = products.map(renderProductCard).join("");
  document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.dataset.productId;
      addProductToCart(productId);
    });
  });
};

const getCartQuantity = () => cart.reduce((sum, item) => sum + item.quantity, 0);

const getCartTotal = () =>
  cart.reduce((sum, item) => {
    const product = getProduct(item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

const changeQuantity = (productId, delta) => {
  const cartItem = cart.find((item) => item.id === productId);
  const product = getProduct(productId);
  if (!cartItem || !product) {
    return;
  }

  const nextQuantity = cartItem.quantity + delta;
  if (nextQuantity <= 0) {
    cart = cart.filter((item) => item.id !== productId);
    saveCart();
    renderCart();
    return;
  }

  if (nextQuantity > product.stock) {
    createToast(`No hay suficiente stock de ${product.name}.`, "warning");
    return;
  }

  cartItem.quantity = nextQuantity;
  saveCart();
  renderCart();
};

const removeFromCart = (productId) => {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  renderCart();
  createToast("Producto eliminado del carrito.", "secondary");
};

const renderCart = () => {
  cartCount.textContent = getCartQuantity();
  cartTotal.textContent = formatCurrency(getCartTotal());

  if (!cart.length) {
    cartItems.innerHTML = `
      <div class="text-center text-muted py-4">
        <p class="mb-1">Tu carrito está vacío.</p>
        <small>Agrega un producto para comenzar la simulación de compra.</small>
      </div>
    `;
    return;
  }

  cartItems.innerHTML = cart
    .map((item) => {
      const product = getProduct(item.id);
      if (!product) return "";
      return `
        <div class="list-group-item py-3">
          <div class="d-flex gap-3 align-items-center">
            <img src="${product.image}" alt="${product.name}" class="rounded" style="width: 64px; height: 64px; object-fit: cover;" />
            <div class="flex-fill">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="mb-1">${product.name}</h6>
                  <small class="text-muted">$${formatCurrency(product.price)} c/u</small>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger remove-cart-item" data-product-id="${product.id}">Eliminar</button>
              </div>
              <div class="d-flex align-items-center gap-2 mt-3">
                <button type="button" class="btn btn-sm btn-outline-secondary quantity-button" data-product-id="${product.id}" data-delta="-1">-</button>
                <span class="fw-bold">${item.quantity}</span>
                <button type="button" class="btn btn-sm btn-outline-secondary quantity-button" data-product-id="${product.id}" data-delta="1">+</button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  document.querySelectorAll(".quantity-button").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.dataset.productId;
      const delta = Number(button.dataset.delta);
      changeQuantity(productId, delta);
    });
  });

  document.querySelectorAll(".remove-cart-item").forEach((button) => {
    button.addEventListener("click", () => removeFromCart(button.dataset.productId));
  });
};

const addProductToCart = (productId) => {
  const product = getProduct(productId);
  if (!product) {
    return;
  }

  const cartItem = cart.find((item) => item.id === productId);
  if (cartItem) {
    if (cartItem.quantity < product.stock) {
      cartItem.quantity += 1;
    } else {
      createToast(`No hay más stock de ${product.name}.`, "warning");
      return;
    }
  } else {
    cart.push({ id: productId, quantity: 1 });
  }

  saveCart();
  renderCart();
  createToast(`${product.name} agregado al carrito.`);
};

const handleCheckout = () => {
  if (!cart.length) {
    createToast("El carrito está vacío. Agrega un producto para completar la compra.", "warning");
    return;
  }

  cart = [];
  saveCart();
  renderCart();
  createToast("¡Compra simulada completada! Gracias por tu pedido.", "success");
  const offcanvasElement = document.getElementById("cartOffcanvas");
  const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);
  if (offcanvasInstance) {
    offcanvasInstance.hide();
  }
};

const initApp = () => {
  loadCart();
  renderCart();

  fetch("./products.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo de productos.");
      }
      return response.json();
    })
    .then((data) => {
      products = data;
      renderProducts();
    })
    .catch(() => {
      productGrid.innerHTML = `
        <div class="col">
          <div class="alert alert-danger">No se pudieron cargar los productos. Recarga la página para intentarlo de nuevo.</div>
        </div>
      `;
    });

  checkoutButton.addEventListener("click", handleCheckout);
};

document.addEventListener("DOMContentLoaded", initApp);
