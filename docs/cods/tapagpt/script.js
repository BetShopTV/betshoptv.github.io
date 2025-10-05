// 🔗 URL do seu Apps Script
const GOOGLE_APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyrc64j6KRAP5gRPQfACsAw_lX3HixxTQktfJlor6eilbRjTIXmJVDTm9MW8Zp8LYcu/exec";

const CACHE_KEY = "oferta_pintosa";
const CACHE_DURATION = 1 * 60 * 1000; // 5 minutos

let products = [];
let favorites = [];
let cart = [];

// 🚀 Inicia quando a página carrega
window.onload = async () => {
  const cached = getCachedProducts();
  if (cached) {
    products = cached;
    console.log("Usando cache!");
  } else {
    products = await fetchProductsFromGoogleSheets();
    setCachedProducts(products);
  }

  renderGallery(products);
  updateCounters();
};

// 📦 Buscar produtos do Apps Script
async function fetchProductsFromGoogleSheets() {
  try {
    const res = await fetch(GOOGLE_APPS_SCRIPT_URL);
    const data = await res.json();
    return data.produtos || [];
  } catch (err) {
    console.error("Erro ao buscar produtos:", err);
    return [];
  }
}

// 💾 Cache local
function getCachedProducts() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp < CACHE_DURATION) return data;
  return null;
}

function setCachedProducts(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
}

// 🧱 Renderizar produtos na tela
function renderGallery(list) {
  const galeria = document.getElementById("galeria");
  galeria.innerHTML = "";

  if (!list.length) {
    galeria.innerHTML = "<p>Nenhum produto encontrado.</p>";
    return;
  }

  list.forEach((p) => {
    const card = document.createElement("div");
    card.className = "produto";
    card.innerHTML = `
      <img src="http://betshoptv.com/img/tmb/${p.imagens?.[0] || 'placeholder.jpg'}" alt="${p.titulo}">
      <h3>${p.titulo}</h3>
      <p>R$ ${p.preco}</p>
      <button class="fav-btn" data-id="${p.id}">${favorites.includes(p.id) ? "❤️" : "🤍"}</button>
      <button onclick="addToCart('${p.id}')">🛒</button>
    `;
    galeria.appendChild(card);
  });

  document.querySelectorAll(".fav-btn").forEach((btn) =>
    btn.addEventListener("click", (e) => toggleFavorite(e.target.dataset.id))
  );
}

// 💖 Favoritar
function toggleFavorite(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter((x) => x !== id);
  } else {
    favorites.push(id);
  }
  renderGallery(products);
  updateCounters();
}

// 🛒 Carrinho
function addToCart(id) {
  if (cart.includes(id)) {
    cart = cart.filter((x) => x !== id);
  } else {
    cart.push(id);
  }
  updateCounters();
}

// 🔢 Atualizar contadores
function updateCounters() {
  document.getElementById("favoritosCount").textContent = `❤️ ${String(favorites.length).padStart(2, "0")}`;
  document.getElementById("cartCount").textContent = `🛒 ${String(cart.length).padStart(2, "0")}`;
}
