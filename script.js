/* ==========================================
   FAJR E-COMMERCE LOGIC WITH CART & COD
   ========================================== */

// ১. প্রোডাক্ট ক্যাটালগ (প্রোডাক্ট অ্যাড/এডিট করার জায়গা)
const products = [
  {
    id: 1,
    name: "FAJR Noir — Eau De Parfum",
    category: "Fragrance",
    tag: "Signature Blend",
    rating: "★★★★★ (4.9)",
    price: 1850,
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=700&q=80",
    desc: "Top notes of smoked cedarwood, bergamot, with an intense amber dry-down. Long-lasting executive projection."
  },
  {
    id: 2,
    name: "Minimalist Heavyweight Tee",
    category: "Apparel",
    tag: "240 GSM Supima",
    rating: "★★★★★ (5.0)",
    price: 850,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=700&q=80",
    desc: "Dense luxury combed cotton, dropped shoulders with subtle tonal 'FAJR' embroidery on the chest."
  },
  {
    id: 3,
    name: "Matte Black Chrono Timepiece",
    category: "Timepieces",
    tag: "Sapphire Glass",
    rating: "★★★★★ (4.8)",
    price: 3200,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=700&q=80",
    desc: "Surgical grade 316L stainless steel, matte-finished dial, paired with full-grain cowhide leather."
  }
];

// আপনার ব্যবসার WhatsApp নম্বর (Country code সহ)
const BUSINESS_WHATSAPP_NUMBER = "8801700000000";

// কার্ট স্টেট
let cart = [];

// ২. প্রোডাক্ট রেন্ডারিং
function renderProducts(categoryFilter = "all") {
  const grid = document.getElementById("product-grid");
  const filtered = categoryFilter === "all" 
    ? products 
    : products.filter(p => p.category === categoryFilter);

  grid.innerHTML = filtered.map(item => `
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
        <div class="product-footer">
          <span class="product-price">৳ ${item.price.toLocaleString()}</span>
          <button onclick="addToCart(${item.id})" class="btn-add-cart">
            Add To Cart
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

// ক্যাটাগরি ফিল্টার হ্যান্ডলার
function filterProducts(category) {
  // ডেস্কটপ ট্যাব একটিভ ক্লাস
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.toLowerCase().includes(category.toLowerCase()));
  });
  // মোবাইল চিপ একটিভ ক্লাস
  document.querySelectorAll(".chip").forEach(chip => {
    chip.classList.toggle("active", chip.textContent.toLowerCase().includes(category.toLowerCase()));
  });

  renderProducts(category);
}

// ৩. কার্ট লজিক
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  showToast(`${product.name} added to cart!`);
  toggleCart(true); // সরাসরি ড্রয়ার ওপেন হবে
}

function updateQty(productId, change) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += change;
  if (item.qty <= 0) {
    removeFromCart(productId);
    return;
  }
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartUI();
}

// ৪. কার্ট UI আপডেট
function updateCartUI() {
  const container = document.getElementById("cart-items-container");
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  // ব্যাজ আপডেট
  document.getElementById("cart-badge-count").innerText = totalQty;
  document.getElementById("hero-cart-count").innerText = totalQty;
  document.getElementById("cart-items-total-qty").innerText = `${totalQty} items`;

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-view">
        <svg width="48" height="48" fill="none" stroke="#444" viewBox="0 0 24 24" style="margin:0 auto">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
        <p>Your cart is empty.</p>
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
        <div class="cart-item-price">৳ ${(item.price * item.qty).toLocaleString()}</div>
        <div class="cart-item-qty-row">
          <div class="qty-control">
            <button onclick="updateQty(${item.id}, -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="updateQty(${item.id}, 1)">+</button>
          </div>
          <button onclick="removeFromCart(${item.id})" class="btn-remove-item">Remove</button>
        </div>
      </div>
    </div>
  `).join("");

  updateCartSummary();
}

// হিসাব আপডেট (সাবটোটাল ও গ্র্যান্ড টোটাল)
function updateCartSummary() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shippingFee = parseInt(document.getElementById("shipping-zone").value) || 70;
  const grandTotal = subtotal + shippingFee;

  document.getElementById("cart-subtotal").innerText = `৳ ${subtotal.toLocaleString()}`;
  document.getElementById("cart-shipping").innerText = `৳ ${shippingFee}`;
  document.getElementById("cart-grand-total").innerText = `৳ ${grandTotal.toLocaleString()}`;
}

// ৫. ড্রয়ার টগল (Open / Close)
function toggleCart(isOpen) {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-overlay");

  if (isOpen) {
    drawer.classList.add("open");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden"; // স্ক্রলিং বন্ধ রাখবে
  } else {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
    document.body.style.overflow = "auto";
  }
}

// টোস্ট নোটিফিকেশন
function showToast(message) {
  const toast = document.getElementById("toast-msg");
  toast.innerText = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

// ৬. এক্সপ্রেস ক্যাশ অন ডেলিভারি অর্ডার সাবমিশন
function submitOrder(event) {
  event.preventDefault();

  if (cart.length === 0) {
    alert("আপনার কার্ট খালি!");
    return;
  }

  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();
  const shippingFee = parseInt(document.getElementById("shipping-zone").value);
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const grandTotal = subtotal + shippingFee;

  // কার্টের আইটেম টেক্সট
  const itemsText = cart.map(i => `• ${i.name} (Qty: ${i.qty}) - ৳${i.price * i.qty}`).join("%0A");

  // WhatsApp মেসেজ ফরম্যাট
  const message = `*NEW ORDER - FAJR ESSENTIALS*%0A` +
                  `----------------------------------%0A` +
                  `*Customer:* ${encodeURIComponent(name)}%0A` +
                  `*Phone:* ${encodeURIComponent(phone)}%0A` +
                  `*Address:* ${encodeURIComponent(address)}%0A` +
                  `----------------------------------%0A` +
                  `*Order Items:*%0A${itemsText}%0A` +
                  `----------------------------------%0A` +
                  `*Subtotal:* ৳${subtotal}%0A` +
                  `*Delivery:* ৳${shippingFee}%0A` +
                  `*Grand Total:* ৳${grandTotal}%0A` +
                  `*Payment Mode:* Cash On Delivery`;

  // WhatsApp ওপেন
  window.open(`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${message}`, "_blank");

  // কার্ট ক্লিয়ার
  cart = [];
  updateCartUI();
  toggleCart(false);
  event.target.reset();
  alert("ধন্যবাদ! আপনার অর্ডারটি গ্রহণ করা হয়েছে। কনফার্মেশনের জন্য হোয়াটসঅ্যাপে নিয়ে যাওয়া হচ্ছে।");
}

// ইনিশিয়াল লোড
renderProducts();
updateCartUI();
