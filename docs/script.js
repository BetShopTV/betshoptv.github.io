// script.js
(() => {
  /* Config */
  const CACHE_KEY = "betshop_products";
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const GOOGLE_APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbydfqi0G8PnmvshPSbGjWZnWBjOKA965l4TbVqvS3YQYO9bcYulknvMjUn3V2AEFxSV/exec";

  /* DOM refs */
  const galleryRoot = document.getElementById("gallery-columns");
  const filterButtonsContainer = document.getElementById("filter-buttons");
  const toggleSortBtn = document.getElementById("toggle-sort");
  const rifasTab = document.getElementById("rifas-tab");
  const ofertasTab = document.getElementById("ofertas-tab");
  const favCountEl = document.getElementById("fav-count");
  const cartCountEl = document.getElementById("cart-count");
  const totalPriceEl = document.getElementById("total-price");
  const activeSectionEl = document.getElementById("active-section");

  /* State */
  let products = [];
  let loading = true;
  let error = null;
  let activeFilters = new Set(["TODAS"]);
  let sortOrder = "desc";
  let selectedItems = loadSelectedItems(); // cart
  let favorites = loadFavorites(); // set of ids

  /* Helpers: cache */
  function getCachedProducts() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log("[v0] Using cached products data");
          return data;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  }

  function setCachedProducts(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
      console.error(e);
    }
  }

  /* Load saved favorites/cart */
  function loadFavorites() {
    try {
      const raw = localStorage.getItem("betshop_favs");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  }
  function saveFavorites() {
    try {
      localStorage.setItem("betshop_favs", JSON.stringify(Array.from(favorites)));
    } catch {}
  }

  function loadSelectedItems() {
    try {
      const raw = localStorage.getItem("betshop_cart");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function saveSelectedItems() {
    try {
      localStorage.setItem("betshop_cart", JSON.stringify(selectedItems));
    } catch {}
  }

  /* Emergency fallback product */
  const EMERGENCY_PRODUCTS = [
    {
      id: "3-1a",
      grupo: "3",
      peca: "1",
      titulo: "03/01 Produto Emergência",
      apelido: "Produto de Backup",
      preco: 150,
      precoVenda: 0,
      disponivel: true,
      imagens: ["03-01a.avif"],
      tecnica: "Material Padrão",
      dimensoes: "50 x 20 x 5 cm",
      emExposicao: "",
      cores: "",
      tags: "",
      ondeRepete: "",
      extra: "",
      promocao: "",
    },
  ];

  /* Fetching */
  async function fetchProductsFromGoogleSheets() {
    console.log("[v0] Fetching products from Google Sheets...");
    const res = await fetch(GOOGLE_APPS_SCRIPT_URL, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("HTTP error " + res.status);
    const data = await res.json();
    if (!data.produtos || !Array.isArray(data.produtos)) throw new Error("Invalid data structure");
    const transformed = data.produtos.map((item) => ({
      id: item.id || `${item.grupo}-${item.peca}a`,
      grupo: String(item.grupo || "3"),
      peca: String(item.peca || "1"),
      titulo: item.titulo || "Produto sem título",
      apelido: item.apelido || "",
      preco: Number(item.preco) || 0,
      precoVenda: Number(item.precoVenda) || 0,
      disponivel: !item.precoVenda || item.precoVenda === 0 || item.precoVenda === "",
      imagens: item.imagens || [`${item.grupo}-${item.peca}a.avif`],
      tecnica: item.tecnica || "",
      dimensoes: item.dimensoes || "",
      emExposicao: item.emExposicao || "",
      cores: item.cores || "",
      tags: item.tags || "",
      ondeRepete: item.ondeRepete || "",
      extra: item.extra || "",
      promocao: item.promocao || "",
    }));
    return transformed;
  }

  /* Render skeletons while loading */
  function renderSkeletons() {
    galleryRoot.innerHTML = "";
    const cols = 3;
    for (let c = 0; c < cols; c++) {
      const col = document.createElement("div");
      col.className = "col";
      for (let i = 0; i < 6; i++) {
        const sk = document.createElement("div");
        sk.className = "card skeleton";
        sk.style.minHeight = "200px";
        col.appendChild(sk);
      }
      galleryRoot.appendChild(col);
    }
  }

  /* Render filters (groups + Disponíveis + Todas) */
  function renderFilterButtons(groups) {
    filterButtonsContainer.innerHTML = "";
    const allBtn = createFilterButton("TODAS");
    filterButtonsContainer.appendChild(allBtn);

    groups.forEach((g) => {
      const btn = createFilterButton(g);
      filterButtonsContainer.appendChild(btn);
    });

    const availBtn = createFilterButton("DISPONÍVEIS");
    filterButtonsContainer.appendChild(availBtn);
  }

  function createFilterButton(name) {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = name === "TODAS" ? "TODAS" : name.padStart(2, "0");
    if (activeFilters.has(name)) btn.classList.add("active");
    btn.addEventListener("click", () => {
      handleFilterClick(name);
    });
    return btn;
  }

  function handleFilterClick(filter) {
    if (filter === "TODAS") {
      activeFilters = new Set(["TODAS"]);
    } else {
      activeFilters.delete("TODAS");
      if (activeFilters.has(filter)) activeFilters.delete(filter);
      else activeFilters.add(filter);
      if (activeFilters.size === 0) activeFilters = new Set(["TODAS"]);
    }
    render();
  }

  /* Sorting toggle */
  toggleSortBtn.addEventListener("click", () => {
    sortOrder = sortOrder === "desc" ? "asc" : "desc";
    toggleSortBtn.textContent = sortOrder === "desc" ? "+ RECENTES" : "- RECENTES";
    render();
  });

  /* Utility: get image url & fallback */
  function getImageUrl(prod) {
    const primary = prod.imagens && prod.imagens[0] ? prod.imagens[0] : `${prod.grupo}-${prod.peca}a.avif`;
    // Attempt to use repo /public/img/tmb path (relative)
    // If you prefer external host, change prefix to full URL like http://betshoptv.com/img/tmb/
    return `img/tmb/${primary}`;
  }
  function getFallbackImageUrl(prod) {
    const primary = prod.imagens && prod.imagens[0] ? prod.imagens[0] : `${prod.grupo}-${prod.peca}a.avif`;
    const fallback = primary.replace(".avif", ".jpg");
    return `img/fallback/${fallback}`;
  }

  /* Render products */
  function renderProducts(list) {
    galleryRoot.innerHTML = "";
    const columns = distributeIntoColumns(list, 3);
    columns.forEach((colItems) => {
      const col = document.createElement("div");
      col.className = "col";
      colItems.forEach((product) => {
        const cardWrap = document.createElement("div");
        cardWrap.className = "mb-3";
        const card = document.createElement("div");
        card.className = "card";
        card.style.position = "relative";

        const img = document.createElement("img");
        img.alt = product.titulo;
        img.loading = "lazy";
        img.src = getImageUrl(product);
        img.onerror = function () {
          this.onerror = null;
          this.src = getFallbackImageUrl(product);
        };

        // Favorite
        const favBtn = document.createElement("button");
        favBtn.className = "favorite-btn";
        favBtn.title = "Favoritar";
        favBtn.innerHTML = favorites.has(product.id) ? "♥" : "♡";
        favBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          toggleFavorite(product.id);
        });

        card.appendChild(img);
        card.appendChild(favBtn);
        cardWrap.appendChild(card);

        // Action (Add/Remove)
        if (product.disponivel) {
          const action = document.createElement("button");
          action.className = "action";
          const inCart = selectedItems.some((p) => p.id === product.id);
          action.textContent = inCart ? "REMOVER" : "ADICIONAR";
          action.style.backgroundColor = inCart ? "#2b2424" : "#bebab0";
          action.style.color = inCart ? "#bebab0" : "#2b2424";
          action.addEventListener("click", () => toggleCart(product));
          cardWrap.appendChild(action);
        } else {
          const spacer = document.createElement("div");
          spacer.style.height = "0";
          cardWrap.appendChild(spacer);
        }

        col.appendChild(cardWrap);
      });
      galleryRoot.appendChild(col);
    });
  }

  /* Distribute into columns */
  function distributeIntoColumns(items, n) {
    const cols = Array.from({ length: n }, () => []);
    items.forEach((it, idx) => {
      cols[idx % n].push(it);
    });
    return cols;
  }

  /* Get filtered products */
  function getFilteredProducts() {
    let filtered = products.slice();
    if (!activeFilters.has("TODAS")) {
      const groupFilters = Array.from(activeFilters).filter((f) => f !== "DISPONÍVEIS");
      const hasAvailableFilter = activeFilters.has("DISPONÍVEIS");
      if (groupFilters.length > 0) filtered = filtered.filter((p) => groupFilters.includes(p.grupo));
      if (hasAvailableFilter) filtered = filtered.filter((p) => p.disponivel);
    }
    filtered.sort((a, b) => {
      const grupoA = parseInt(a.grupo), grupoB = parseInt(b.grupo);
      const pecaA = parseInt(a.peca), pecaB = parseInt(b.peca);
      if (grupoA !== grupoB) return sortOrder === "desc" ? grupoB - grupoA : grupoA - grupoB;
      return sortOrder === "desc" ? pecaB - pecaA : pecaA - pecaB;
    });
    return filtered;
  }

  /* Toggle favorite */
  function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavorites();
    render(); // re-render counts & UI
  }

  /* Toggle cart */
  function toggleCart(prod) {
    const exists = selectedItems.find((p) => p.id === prod.id);
    if (exists) {
      selectedItems = selectedItems.filter((p) => p.id !== prod.id);
    } else {
      selectedItems.push(prod);
    }
    saveSelectedItems();
    render();
  }

  function removeFromSelected(id) {
    selectedItems = selectedItems.filter((p) => p.id !== id);
    saveSelectedItems();
    render();
  }

  /* UI for active section (favorites / offers) */
  function renderActiveSection(which) {
    if (!which) {
      activeSectionEl.classList.add("hidden");
      activeSectionEl.innerHTML = "";
      return;
    }
    activeSectionEl.classList.remove("hidden");
    activeSectionEl.innerHTML = ""; // fill with items
    if (which === "rifas") {
      const favItems = products.filter((p) => favorites.has(p.id));
      if (favItems.length === 0) {
        const msg = document.createElement("div");
        msg.style.color = "#2b2424";
        msg.style.fontWeight = "700";
        msg.innerHTML = "Nenhum número selecionado.<br/>Aposte na RIFA!";
        activeSectionEl.appendChild(msg);
        return;
      }
      favItems.forEach((item) => {
        const wrap = document.createElement("div");
        wrap.style.marginRight = "8px";
        const img = document.createElement("img");
        img.src = getImageUrl(item);
        img.style.height = "112px";
        img.onerror = () => (img.src = getFallbackImageUrl(item));
        wrap.appendChild(img);
        const rm = document.createElement("button");
        rm.textContent = "X";
        rm.style.position = "absolute";
        rm.addEventListener("click", () => toggleFavorite(item.id));
        wrap.appendChild(rm);
        activeSectionEl.appendChild(wrap);
      });
    } else if (which === "ofertas") {
      if (selectedItems.length === 0) {
        const msg = document.createElement("div");
        msg.style.color = "#2b2424";
        msg.style.fontWeight = "700";
        msg.innerHTML = "Nenhuma oferta selecionada.";
        activeSectionEl.appendChild(msg);
        return;
      }
      selectedItems.forEach((item) => {
        const wrap = document.createElement("div");
        wrap.style.marginRight = "8px";
        const img = document.createElement("img");
        img.src = getImageUrl(item);
        img.style.height = "112px";
        img.onerror = () => (img.src = getFallbackImageUrl(item));
        wrap.appendChild(img);
        const rm = document.createElement("button");
        rm.textContent = "X";
        rm.addEventListener("click", () => removeFromSelected(item.id));
        wrap.appendChild(rm);
        activeSectionEl.appendChild(wrap);
      });
    }
  }

  /* Render counts & totals */
  function renderCounts() {
    favCountEl.textContent = favorites.size === 0 ? "__" : String(favorites.size).padStart(2, "0");
    cartCountEl.textContent = selectedItems.length === 0 ? "__" : String(selectedItems.length).padStart(2, "0");
    const total = selectedItems.reduce((s, it) => s + (it.preco || 0), 0);
    totalPriceEl.textContent = total === 0 ? "R$ __" : `R$ ${Math.round(total)}`;
  }

  /* Main render */
  function render() {
    if (loading) {
      renderSkeletons();
      return;
    }
    // Filters
    const groups = Array.from(new Set(products.map((p) => p.grupo))).sort((a, b) => a - b);
    renderFilterButtons(groups);

    // Filtered products
    const filtered = getFilteredProducts();
    renderProducts(filtered);

    // Counts
    renderCounts();
  }

  /* Setup shopping bar interactions */
  let activeSection = null;
  rifasTab.addEventListener("click", () => {
    activeSection = activeSection === "rifas" ? null : "rifas";
    renderActiveSection(activeSection);
  });
  ofertasTab.addEventListener("click", () => {
    activeSection = activeSection === "ofertas" ? null : "ofertas";
    renderActiveSection(activeSection);
  });

  /* Initial bootstrap */
  async function init() {
    loading = true;
    renderSkeletons();

    // try cache
    const cached = getCachedProducts();
    if (cached) {
      products = cached;
      loading = false;
      render();
      return;
    }

    // fetch
    try {
      products = await fetchProductsFromGoogleSheets();
      setCachedProducts(products);
    } catch (err) {
      console.error(err);
      products = EMERGENCY_PRODUCTS;
    } finally {
      loading = false;
      render();
    }
  }

  // Initialize
  init();
})();
