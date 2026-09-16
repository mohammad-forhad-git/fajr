/* =======================================================
   FAJR PRODUCTION ENGINE
   - Variants & Composite Keys
   - LocalStorage Sync
   - Strict BD Phone Regex
   - Background Google Sheets Webhook + WhatsApp Fail-Safe
   ======================================================= */

// CONFIGURATION: Replace these with your actual details
const BUSINESS_WHATSAPP_NUMBER = "8801700000000"; 
// Paste your deployed Google Apps Script Web App URL here:
const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyBppIRoxGXijTj0SnHFxC8ue2WXYSikruIILqsTrPmvdYwwg9dd4oAKacT5cq9uycwUg/exec";

// 1. PRODUCT CATALOG WITH VARIANTS
const products = [
  {
    id: 1,
    name: "FAJR Noir — Eau De Parfum",
    category: "Fragrance",
    tag: "Signature Blend",
    rating: "★★★★★ (4.9)",
    variants: [
      { name: "50ml", price: 1850 },
      { name: "100ml", price: 2950 }
    ],
    defaultVariant: "50ml",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=700&q=80",
    desc: "Smoked cedarwood, bergamot, and intense amber dry-down. Executive projection."
  },
  {
    id: 2,
    name: "Minimalist Heavyweight Tee",
    category: "Apparel",
    tag: "240 GSM Supima",
    rating: "★★★★★ (5.0)",
    variants: [
      { name: "M", price: 850 },
      { name: "L", price: 850 },
      { name: "XL", price: 850 },
      { name: "XXL", price: 900 }
    ],
    defaultVariant: "L",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80",
    desc: "240 GSM dense combed cotton, dropped shoulders, tonal embroidered chest crest."
  },
  {
    id: 3,
    name: "Matte Black Chrono Timepiece",
    category: "Timepieces",
    tag: "Sapphire Glass",
    rating: "★★★★★ (4.8)",
    variants: [
      { name: "Standard Dial", price: 3200 }
    ],
    defaultVariant: "Standard Dial",
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=700&q=80",
    desc: "Surgical 316L black steel casing with genuine full-grain leather strap."
  }
];

// In-memory selection state for cards before adding to cart: { productId: variantName }
const selectedVariantState = {};
products.forEach(p => { selectedVariantState[p.id] = p.defaultVariant; });

// 2. LOCALSTORAGE CART PERSISTENCE
function loadCart() {
  try {
    const saved = localStorage.getItem("fajr_cart");
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function persistCart() {
  localStorage.setItem("fajr_cart", JSON.stringify(cart));
}

let cart = loadCart();

// 3. PRODUCT RENDERING & VARIANT TOGGLES
function renderProducts(categoryFilter = "all") {
  const grid = document.getElementById("product-grid");
  const filtered = categoryFilter === "all" 
    ? products 
    : products.filter(p => p.category === categoryFilter);

  grid.innerHTML = filtered.map(item => {
    const activeVarName = selectedVariantState[item.id] || item.defaultVariant;
    const activeVarObj = item.variants.find(v => v.name === activeVarName) || item.variants[0];

    const variantPillsHTML = item.variants.map(v => `
      <button 
        type="button"
        class="variant-pill ${v.name === activeVarName ? 'selected' : ''}" 
        onclick="handleSelectVariant(${item.id}, '${v.name}')">
        ${v.name}
      </button>
    `).join("");

    return `
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="${item.image}" alt="${item.name}" class="product-img" />
          <span class="card-tag">${item.tag}</span>
        </div>
        <div class="product-details">
          <span class="product-category">${item.category}</span>
          <h3 class="product-name">${item.name}</h3>
          <span class="product-rating">${item.rating}</span>
          <p class="product-desc">${item.desc}</p>
          
          <div class="variant-block">
            <span class="variant-label">Selection</span>
            <div class="variant-options">${variantPillsHTML}</div>
          </div>

          <div class="product-footer">
            <span class="product-price" id="price-tag-${item.id}">৳ ${activeVarObj.price.toLocaleString()}</span>
            <button onclick="addToCart(${item.id})" class="btn-add-cart">
              Add To Cart
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function handleSelectVariant(productId, variantName) {
  selectedVariantState[productId] = variantName;
  const product = products.find(p => p.id === productId);
  const variantObj = product.variants.find(v => v.name === variantName);

  // Update specific price tag and pill UI without full re-render
  const priceTag = document.getElementById(`price-tag-${productId}`);
  if (priceTag && variantObj) {
    priceTag.innerText = `৳ ${variantObj.price.toLocaleString()}`;
  }
  renderProducts(getCurrentActiveCategory());
}

function getCurrentActiveCategory() {
  const activeBtn = document.querySelector(".nav-btn.active");
  if (!activeBtn) return "all";
  const txt = activeBtn.innerText.toLowerCase();
  if (txt.includes("fragrance")) return "Fragrance";
  if (txt.includes("apparel")) return "Apparel";
  if (txt.includes("timepieces")) return "Timepieces";
  return "all";
}

function filterProducts(category) {
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.toLowerCase().includes(category.toLowerCase()));
  });
  document.querySelectorAll(".chip").forEach(chip => {
    chip.classList.toggle("active", chip.textContent.toLowerCase().includes(category.toLowerCase()));
  });
  renderProducts(category);
}

// 4. CART OPERATIONS WITH COMPOSITE KEYS
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const variantName = selectedVariantState[productId] || product.defaultVariant;
  const variantObj = product.variants.find(v => v.name === variantName) || product.variants[0];

  // Composite unique key: Product ID + Variant Name
  const compositeKey = `${product.id}-${variantName}`;

  const existing = cart.find(item => item.cartItemId === compositeKey);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      cartItemId: compositeKey,
      id: product.id,
      name: product.name,
      variant: variantName,
      price: variantObj.price,
      image: product.image,
      qty: 1
    });
  }

  persistCart();
  updateCartUI();
  showToast(`${product.name} (${variantName}) added!`);
  toggleCart(true);
}

function updateQty(cartItemId, change) {
  const item = cart.find(i => i.cartItemId === cartItemId);
  if (!item) return;

  item.qty += change;
  if (item.qty <= 0) {
    removeFromCart(cartItemId);
    return;
  }
  persistCart();
  updateCartUI();
}

function removeFromCart(cartItemId) {
  cart = cart.filter(item => item.cartItemId !== cartItemId);
  persistCart();
  updateCartUI();
}

function updateCartUI() {
  const container = document.getElementById("cart-items-container");
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  document.getElementById("cart-badge-count").innerText = totalQty;
  document.getElementById("hero-cart-count").innerText = totalQty;
  document.getElementById("cart-items-total-qty").innerText = `${totalQty} items`;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-view">
        <svg width="40" height="40" fill="none" stroke="#444" viewBox="0 0 24 24" style="margin:0 auto">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
        <p>Your vault is currently empty.</p>
      </div>
    `;
    document.getElementById("cart-footer").style.display = "none";
    return;
  }

  document.getElementById("cart-footer").style.display = "block";

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img" />
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.name}</h4>
        <div class="cart-item-variant">Variant: ${item.variant}</div>
        <div class="cart-item-price">৳ ${(item.price * item.qty).toLocaleString()}</div>
        <div class="cart-item-qty-row">
          <div class="qty-control">
            <button onclick="updateQty('${item.cartItemId}', -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="updateQty('${item.cartItemId}', 1)">+</button>
          </div>
          <button onclick="removeFromCart('${item.cartItemId}')" class="btn-remove-item">Remove</button>
        </div>
      </div>
    </div>
  `).join("");

  updateCartSummary();
}

function updateCartSummary() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shippingFee = parseInt(document.getElementById("shipping-zone").value) || 70;
  const grandTotal = subtotal + shippingFee;

  document.getElementById("cart-subtotal").innerText = `৳ ${subtotal.toLocaleString()}`;
  document.getElementById("cart-shipping").innerText = `৳ ${shippingFee}`;
  document.getElementById("cart-grand-total").innerText = `৳ ${grandTotal.toLocaleString()}`;
}

function toggleCart(isOpen) {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");

  if (isOpen) {
    drawer.classList.add("open");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  } else {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
    document.body.style.overflow = "auto";
  }
}

function showToast(message) {
  const toast = document.getElementById("toast-msg");
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => { toast.classList.remove("show"); }, 2400);
}

// 5. BANGLADESHI PHONE NUMBER VALIDATION & FORMATTER
function validateAndFormatBDPhone(inputStr) {
  // Strip spaces, hyphens, and brackets
  let clean = inputStr.replace(/[\s\-\(\)]/g, "");
  
  // Standardize +880 / 880 prefix
  if (clean.startsWith("+880")) clean = "0" + clean.slice(4);
  else if (clean.startsWith("880")) clean = "0" + clean.slice(3);

  // Strict regex: must be 11 digits starting with 013-019
  const bdPhoneRegex = /^01[3-9]\d{8}$/;
  return bdPhoneRegex.test(clean) ? clean : null;
}

// 6. ORDER SUBMISSION WITH WEBHOOK & WHATSAPP REDUNDANCY
async function submitOrder(event) {
  event.preventDefault();

  if (cart.length === 0) {
    alert("আপনার কার্ট খালি!");
    return;
  }

  const name = document.getElementById("cust-name").value.trim();
  const rawPhone = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();
  const shippingFee = parseInt(document.getElementById("shipping-zone").value) || 70;
  const phoneError = document.getElementById("phone-error");
  const phoneInput = document.getElementById("cust-phone");

  // Validate Phone
  const validPhone = validateAndFormatBDPhone(rawPhone);
  if (!validPhone) {
    phoneInput.classList.add("invalid");
    phoneError.style.display = "block";
    phoneInput.focus();
    return;
  }
  phoneInput.classList.remove("invalid");
  phoneError.style.display = "none";

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const grandTotal = subtotal + shippingFee;
  const itemsSummary = cart.map(i => `${i.name} [${i.variant}] x${i.qty}`).join(", ");

  // Loading state
  const btnText = document.getElementById("btn-text");
  const btnLoader = document.getElementById("btn-loader");
  const submitBtn = document.getElementById("submit-order-btn");
  
  submitBtn.disabled = true;
  btnText.innerText = "প্রসেসিং হচ্ছে...";
  btnLoader.style.display = "inline-block";

  // Payload for Google Sheet Logger
  const orderPayload = {
    timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    customerName: name,
    phone: validPhone,
    address: address,
    items: itemsSummary,
    subtotal: subtotal,
    deliveryCharge: shippingFee,
    grandTotal: grandTotal,
    status: "Pending Confirmation"
  };

  // 1. Silent Background Submission to Google Sheets
  try {
    if (GOOGLE_SHEET_WEBHOOK_URL && !GOOGLE_SHEET_WEBHOOK_URL.includes("YOUR_SCRIPT_ID")) {
      await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });
    }
  } catch (err) {
    console.warn("Background sheet sync failed, continuing to WhatsApp fallback:", err);
  }

  // 2. Format WhatsApp Dispatch Message
  const whatsappItemsText = cart.map(i => `• ${i.name} (${i.variant}) x${i.qty} - ৳${i.price * i.qty}`).join("%0A");
  const message = `*NEW ORDER - FAJR ESSENTIALS*%0A` +
                  `----------------------------------%0A` +
                  `*Customer:* ${encodeURIComponent(name)}%0A` +
                  `*Phone:* ${encodeURIComponent(validPhone)}%0A` +
                  `*Address:* ${encodeURIComponent(address)}%0A` +
                  `----------------------------------%0A` +
                  `*Items Ordered:*%0A${whatsappItemsText}%0A` +
                  `----------------------------------%0A` +
                  `*Subtotal:* ৳${subtotal}%0A` +
                  `*Delivery:* ৳${shippingFee}%0A` +
                  `*Grand Total:* ৳${grandTotal}%0A` +
                  `*Payment:* Cash On Delivery`;

  // Clear Cart
  cart = [];
  persistCart();
  updateCartUI();
  toggleCart(false);
  event.target.reset();

  // Reset button state
  submitBtn.disabled = false;
  btnText.innerText = "অর্ডার নিশ্চিত করুন (ক্যাশ অন ডেলিভারি)";
  btnLoader.style.display = "none";

  // Trigger WhatsApp dispatch
  window.open(`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${message}`, "_blank");
  alert("ধন্যবাদ! আপনার অর্ডারটি গ্রহণ করা হয়েছে। কনফার্মেশনের জন্য হোয়াটসঅ্যাপে নিয়ে যাওয়া হচ্ছে।");
}

// Initial Boot
renderProducts();
updateCartUI();
