// PLACEHOLDER - URL do Apps Script
const APPS_SCRIPT_URL = "PLACEHOLDER-APPS-SCRIPT-URL"
const API_KEY = "KELLY_KEY"

// Estado da aplicação
const state = {
  modoSelecao: true,
  filtrosAbertos: false,
  gruposSelecionados: [],
  disponiveisAtivo: false,
  recentesAtivo: false,
  pecas: [],
  favoritos: new Set(),
  carrinho: new Set(),
  rifas: [
    { id: "X104", nome: "Nude", preco: 80 },
    { id: "X108", nome: "Ocre Italiano", preco: 80 },
    { id: "X114", nome: "Precioso Momento", preco: 80 },
  ],
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  initEventListeners()
  loadPecas()
  updateCounters()
})

// Event Listeners
function initEventListeners() {
  // Botão MODO
  document.getElementById("btnModo").addEventListener("click", toggleModo)
  document.getElementById("btnModoSubmenu").addEventListener("click", toggleModoSubmenu)

  // Botão FILTROS
  document.getElementById("btnFiltros").addEventListener("click", toggleFiltros)

  // Botões de número de grupo
  document.querySelectorAll(".btn-numero:not(.disabled)").forEach((btn) => {
    btn.addEventListener("click", () => toggleGrupo(btn))
  })

  // Botões de filtro
  document.getElementById("btnDisponiveis").addEventListener("click", toggleDisponiveis)
  document.getElementById("btnRecentes").addEventListener("click", toggleRecentes)

  // Central de Apostas
  document.getElementById("btnCentral").addEventListener("click", openCentral)
  document.getElementById("btnCloseLightbox").addEventListener("click", closeCentral)

  // Ícones da barra shopping
  document.getElementById("btnRifas").addEventListener("click", openCentral)
  document.getElementById("btnFavoritos").addEventListener("click", openCentral)
  document.getElementById("btnOfertas").addEventListener("click", openCentral)
}

// Toggle MODO
function toggleModo() {
  const btnModo = document.getElementById("btnModo")
  const btnSubmenu = document.getElementById("btnModoSubmenu")

  // Se o submenu está visível, esconde
  if (btnSubmenu.style.display !== "none") {
    btnSubmenu.style.display = "none"
    btnModo.classList.remove("btn-active")
  } else {
    btnSubmenu.style.display = "flex"
    btnModo.classList.add("btn-active")
  }
}

// Toggle Modo Submenu (SELEÇÃO/GALERIA)
function toggleModoSubmenu() {
  const btn = document.getElementById("btnModoSubmenu")
  state.modoSelecao = !state.modoSelecao
  btn.textContent = state.modoSelecao ? "SELEÇÃO" : "GALERIA"

  // Atualizar comportamento dos cards
  renderPecas()
}

// Toggle FILTROS
function toggleFiltros() {
  state.filtrosAbertos = !state.filtrosAbertos
  const btn = document.getElementById("btnFiltros")
  const content = document.getElementById("filtrosContent")

  if (state.filtrosAbertos) {
    btn.classList.add("btn-active")
    content.classList.add("show")
  } else {
    btn.classList.remove("btn-active")
    content.classList.remove("show")
  }
}

// Toggle Grupo
function toggleGrupo(btn) {
  const grupo = btn.dataset.grupo
  const index = state.gruposSelecionados.indexOf(grupo)

  if (index > -1) {
    state.gruposSelecionados.splice(index, 1)
    btn.classList.remove("active")
  } else {
    state.gruposSelecionados.push(grupo)
    btn.classList.add("active")
  }

  renderPecas()
}

// Toggle Disponíveis
function toggleDisponiveis() {
  state.disponiveisAtivo = !state.disponiveisAtivo
  const btn = document.getElementById("btnDisponiveis")
  btn.classList.toggle("active")
  renderPecas()
}

// Toggle Recentes
function toggleRecentes() {
  state.recentesAtivo = !state.recentesAtivo
  const btn = document.getElementById("btnRecentes")
  btn.classList.toggle("active")
  renderPecas()
}

// Carregar peças (PLACEHOLDER - substituir por fetch do Apps Script)
async function loadPecas() {
  // PLACEHOLDER - Dados de exemplo
  state.pecas = [
    {
      id: "0301",
      titulo: "Rádio 01",
      preco: 150,
      status: "DISPONIVEL",
      grupo: "03",
      imagem: "http://betshoptv.com/img/tmb/03-01a.avif",
    },
    {
      id: "0302",
      titulo: "Câmera fotográfica 01",
      preco: 150,
      status: "DISPONIVEL",
      grupo: "03",
      imagem: "http://betshoptv.com/img/tmb/03-02a.avif",
    },
    {
      id: "0401",
      titulo: "TV 01",
      preco: 200,
      status: "INDISPONIVEL",
      grupo: "04",
      imagem: "http://betshoptv.com/img/tmb/04-01a.avif",
    },
    // Adicionar mais peças conforme necessário
  ]

  // Inicializar favoritos com 2 peças
  state.favoritos.add("0301")
  state.favoritos.add("0302")

  renderPecas()
  updateCounters()
}

// Renderizar peças
function renderPecas() {
  const galeria = document.getElementById("galeria")
  let pecasFiltradas = [...state.pecas]

  // Aplicar filtros
  if (state.gruposSelecionados.length > 0) {
    pecasFiltradas = pecasFiltradas.filter((p) => state.gruposSelecionados.includes(p.grupo))
  }

  if (state.disponiveisAtivo) {
    pecasFiltradas = pecasFiltradas.filter((p) => p.status === "DISPONIVEL")
  }

  if (state.recentesAtivo) {
    pecasFiltradas.sort((a, b) => b.id.localeCompare(a.id))
  }

  // Renderizar
  galeria.innerHTML = pecasFiltradas
    .map(
      (peca) => `
        <div class="peca-card" data-id="${peca.id}" onclick="handlePecaClick('${peca.id}')">
            <button class="peca-like ${state.favoritos.has(peca.id) ? "active" : ""}" 
                    onclick="event.stopPropagation(); toggleFavorito('${peca.id}')">
                <svg viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </button>
            <img src="${peca.imagem}" alt="${peca.titulo}" loading="lazy">
            ${peca.status === "INDISPONIVEL" ? '<div class="peca-indisponivel"></div>' : ""}
        </div>
    `,
    )
    .join("")
}

// Handle click na peça
function handlePecaClick(id) {
  if (state.modoSelecao) {
    // Modo SELEÇÃO: adiciona ao carrinho
    if (state.carrinho.has(id)) {
      state.carrinho.delete(id)
    } else {
      state.carrinho.add(id)
    }
    updateCounters()
  } else {
    // Modo GALERIA: abre FEED (implementar depois)
    console.log("Abrir FEED para peça:", id)
  }
}

// Toggle favorito
function toggleFavorito(id) {
  if (state.favoritos.has(id)) {
    state.favoritos.delete(id)
  } else {
    state.favoritos.add(id)
  }
  renderPecas()
  updateCounters()
}

// Atualizar contadores
function updateCounters() {
  document.getElementById("counterRifas").textContent = state.rifas.length
  document.getElementById("counterFavoritos").textContent = state.favoritos.size
  document.getElementById("counterOfertas").textContent = state.carrinho.size
}

// Abrir Central de Apostas
function openCentral() {
  const lightbox = document.getElementById("lightboxCentral")
  lightbox.classList.add("show")

  // Atualizar conteúdo
  updateCentralContent()
}

// Fechar Central de Apostas
function closeCentral() {
  const lightbox = document.getElementById("lightboxCentral")
  lightbox.classList.remove("show")
}

// Atualizar conteúdo da Central
function updateCentralContent() {
  // Atualizar favoritos
  const favoritosSection = document.querySelector("#sectionFavoritos .items-list")
  const pecasFavoritas = state.pecas.filter((p) => state.favoritos.has(p.id))
  favoritosSection.innerHTML = pecasFavoritas.map((p) => `<div class="item">${p.id} - ${p.titulo}</div>`).join("")

  // Atualizar ofertas
  const ofertasSection = document.querySelector("#sectionOfertas .items-list")
  const pecasCarrinho = state.pecas.filter((p) => state.carrinho.has(p.id))
  ofertasSection.innerHTML = pecasCarrinho
    .map((p) => `<div class="item">${p.id} - ${p.titulo} - R$ ${p.preco}</div>`)
    .join("")

  // Calcular total
  const totalRifas = state.rifas.reduce((sum, r) => sum + r.preco, 0)
  const totalOfertas = pecasCarrinho.reduce((sum, p) => sum + p.preco, 0)
  const total = totalRifas + totalOfertas

  document.getElementById("totalValue").textContent = total.toFixed(2).replace(".", ",")
}

// PLACEHOLDER - Funções para integração com Apps Script
async function fetchCatalogo() {
  // TODO: Implementar fetch do catálogo
  // const response = await fetch(`${APPS_SCRIPT_URL}?action=getCatalogo`);
  // const data = await response.json();
  // return data;
}

async function sendPurchase(data) {
  // TODO: Implementar envio de compra
  // const response = await fetch(APPS_SCRIPT_URL, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //         api_key: API_KEY,
  //         action: 'purchase',
  //         payload: data
  //     })
  // });
  // return await response.json();
}

async function sendFavorite(idPeca) {
  // TODO: Implementar envio de favorito
  // const response = await fetch(APPS_SCRIPT_URL, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //         api_key: API_KEY,
  //         action: 'favorite',
  //         payload: {
  //             sessionId: getSessionId(),
  //             id_peca: idPeca,
  //             device: getDeviceType(),
  //             cidade: 'PLACEHOLDER-CIDADE'
  //         }
  //     })
  // });
  // return await response.json();
}

// Helpers
function getSessionId() {
  let sessionId = localStorage.getItem("bstv_session_id")
  if (!sessionId) {
    sessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    localStorage.setItem("bstv_session_id", sessionId)
  }
  return sessionId
}

function getDeviceType() {
  return window.innerWidth < 768 ? "mobile" : "desktop"
}
