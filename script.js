// ১. প্রোডাক্ট ডাটা (নতুন প্রোডাক্ট যোগ বা এডিট করার জায়গা)
const products = [
  {
    id: 1,
    name: "FAJR Noir Fragrance",
    category: "Fragrance",
    price: 1850,
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80",
    desc: "Long-lasting woody and amber notes for executive elegance."
  },
  {
    id: 2,
    name: "Signature Minimal Tee",
    category: "Apparel",
    price: 850,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
    desc: "220 GSM heavyweight combed cotton with minimal embroidered branding."
  },
  {
    id: 3,
    name: "Classic Matte Timepiece",
    category: "Timepieces",
    price: 3200,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80",
    desc: "All-black matte dial with genuine leather strap."
  }
];

// আপনার ব্যবসার WhatsApp নম্বর (Country code সহ, যেমন: 88017XXXXXXXX)
const BUSINESS_WHATSAPP_NUMBER = "8801700000000";

// ২. প্রোডাক্ট গ্রিড ও ড্রপডাউন রেন্ডার
const productGrid = document.getElementById("product-grid");
const productSelect = document.getElementById("selected-product");

function renderProducts() {
  productGrid.innerHTML = products.map(item => `
    <div class="group border border-neutral-800 bg-neutral-950 p-4 transition duration-300 hover:border-neutral-600">
      <div class="relative overflow-hidden aspect-[4/5] bg-neutral-900 mb-4">
        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover object-center grayscale contrast-125 group-hover:scale-105 transition duration-500" />
      </div>
      <p class="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1">${item.category}</p>
      <h3 class="text-base font-semibold text-white tracking-wide">${item.name}</h3>
      <p class="text-xs text-neutral-400 mt-2 line-clamp-2">${item.desc}</p>
      <div class="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between">
        <span class="text-sm font-semibold text-white">৳ ${item.price.toLocaleString()}</span>
        <button onclick="selectProductForOrder(${item.id})" class="text-[11px] uppercase tracking-wider text-neutral-400 hover:text-white underline">
          Order Now
        </button>
      </div>
    </div>
  `).join("");

  productSelect.innerHTML = products.map(item => `
    <option value="${item.name} - ৳${item.price}">${item.name} (৳${item.price})</option>
  `).join("");
}

function selectProductForOrder(id) {
  const item = products.find(p => p.id === id);
  if (item) {
    productSelect.value = `${item.name} - ৳${item.price}`;
    document.getElementById("order-now").scrollIntoView({ behavior: 'smooth' });
  }
}

// ৩. অর্ডার সাবমিশন (হোয়াটসঅ্যাপে সরাসরি নোটিফিকেশন পাঠানোর লজিক)
document.getElementById("checkout-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();
  const product = document.getElementById("selected-product").value;

  // WhatsApp মেসেজ ফরম্যাট
  const message = `*NEW ORDER - FAJR WEBSITE*%0A` +
                  `------------------------------%0A` +
                  `*Customer:* ${encodeURIComponent(name)}%0A` +
                  `*Phone:* ${encodeURIComponent(phone)}%0A` +
                  `*Address:* ${encodeURIComponent(address)}%0A` +
                  `*Product:* ${encodeURIComponent(product)}%0A` +
                  `*Payment:* Cash on Delivery`;

  // সরাসরি কাস্টমারকে নিয়ে যাবে WhatsApp কনফার্মেশনে
  const whatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${message}`;
  window.open(whatsappUrl, "_blank");

  alert("অর্ডার সাবমিট হয়েছে! আমাদের হোয়াটসঅ্যাপ পেজে আপনাকে রিডাইরেক্ট করা হচ্ছে।");
  this.reset();
});

renderProducts();