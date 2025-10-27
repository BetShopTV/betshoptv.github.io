/* ========================================================================== */
/* =======================  CONFIG E ESTADO CENTRAL  ======================== */
/* ========================================================================== */

const CONFIG = {
  PECAS_URL: 'dados/pecas.json',
  RIFAS_URL: 'dados/rifas.json',
  GAS_URL: 'https://script.google.com/macros/s/AKfycbwsX8iGOv_mg0bhY8iRGACMGte56FXVo6ursYG_K4cq0Y50jW3g34_GX3uJU3U-Vwo0UQ/exec'
};

const state = {
  pecas: [],
  rifas: [],
  selecionadas: new Set(),
  rifasSel: new Set(),
  favoritos: new Set(),
  totalGeral: 0
};

const checkoutState = {
  isOpen: false,
  step: 1,
};

const appContainer = document.getElementById('app');

/* ========================================================================== */
/* ========================  FUNÇÕES AUXILIARES  ============================ */
/* ========================================================================== */

const formatarPreco = (valor) => {
  const n = Number(valor || 0);
  const inteiro = Math.round(n);
  return 'R$ ' + inteiro.toLocaleString('pt-BR');
};

function criarImagemComFallback(src) {
  const img = new Image();
  img.loading = 'lazy';
  img.src = src;
  img.onerror = () => { if (src.endsWith('.avif')) img.src = src.replace('.avif', '.jpg'); };
  return img;
}

const getContrastColor = (hexColor) => {
  try {
    if (!hexColor) return '#2b2424';
    let s = String(hexColor).trim().replace('#', '');
    if (s.length === 3) s = s.split('').map(ch => ch + ch).join('');
    if (s.length !== 6) return '#2b2424';
    const r = parseInt(s.substring(0, 2), 16);
    const g = parseInt(s.substring(2, 4), 16);
    const b = parseInt(s.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#2b2424' : '#ffffff';
  } catch (e) { return '#2b2424'; }
};

function crc16_ccitt_ffff(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = (crc << 8) ^ (x << 12) ^ (x << 5) ^ x;
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function gerarBRCode(valor) {
  const chavePix = "betshoptv@gmail.com", nome = "BET SHOP TV".substring(0, 25).toUpperCase(), cidade = "SAO PAULO".substring(0, 15).toUpperCase(), txid = "***";
  const f = (id, val) => id + String(val.length).padStart(2, '0') + val;
  let pl = "000201" + f('26', `0014BR.GOV.BCB.PIX01${String(chavePix.length).padStart(2, '0')}${chavePix}`) + '52040000' + '5303986' + f('54', Number(Math.floor(valor)).toFixed(2)) + '5802BR' + f('59', nome) + f('60', cidade) + f('62', f('05', txid)) + '6304';
  return pl + crc16_ccitt_ffff(pl);
}


/* ========================================================================== */
/* ========================  LÓGICA DE NEGÓCIO  ============================= */
/* ========================================================================== */

function calcularTotal() {
  let total = 0;
  state.selecionadas.forEach(id => {
    const peca = state.pecas.find(p => p.id_peca === id);
    if (peca && peca.preco) total += parseFloat(peca.preco);
  });
  const numRifas = state.rifasSel.size;
  if (numRifas > 0) {
    total += (numRifas % 2 === 0) ? (25 * numRifas) : (25 * (numRifas - 1) + 30);
  }
  state.totalGeral = total;
  atualizarRodape();
  if (checkoutState.isOpen) {
    syncCheckoutTotals();
  }
}

function atualizarRodape() {
  const pill = document.getElementById('pillCompact');
  const cta = document.getElementById('ctaMain');
  const footer = document.querySelector('footer');
  if (!cta || !pill || !footer) return;

  const nbsp = '\u00A0';
  const parts = [];
  if (state.selecionadas.size > 0) parts.push(`${state.selecionadas.size}${nbsp}Peça(s)`);
  if (state.rifasSel.size > 0) parts.push(`${state.rifasSel.size}${nbsp}Rifa(s)`);
  if (state.favoritos.size > 0) parts.push(`${state.favoritos.size}${nbsp}Favorita(s)`);

  pill.textContent = parts.join(' · ');
  pill.style.display = parts.length > 0 ? 'inline-block' : 'none';

  cta.disabled = state.totalGeral <= 0;
  cta.textContent = state.totalGeral > 0 ? `APOSTAR ${formatarPreco(state.totalGeral)}` : 'FAÇAM SUAS APOSTAS!';

  footer.classList.toggle('has-total', state.totalGeral > 0);
  footer.classList.toggle('no-total', state.totalGeral === 0);
}

/* ========================================================================== */
/* =====================  RENDERIZAÇÃO & NAVEGAÇÃO  ========================= */
/* ========================================================================== */

function renderGaleria() {
  appContainer.innerHTML = '';
  const section = document.createElement('section');
  section.id = 'galeria';
  const masonry = document.createElement('div');
  masonry.className = 'galeria';
  state.pecas.filter(p => String(p.status).toUpperCase() !== 'VENDIDAAA').forEach(p => {
    const item = document.createElement('div');
    item.className = 'gal-item';
    item.dataset.id = p.id_peca;
    item.appendChild(criarImagemComFallback(`/img/tmb/${p.imagens?.[0] || ''}.avif`));
    masonry.appendChild(item);
  });
  section.appendChild(masonry);
  appContainer.appendChild(section);
}

function renderFeed() {
  appContainer.innerHTML = '';
  const section = document.createElement('section');
  section.id = 'feed';
  const list = document.createElement('div');
  list.className = 'feed';
  state.pecas.filter(p => String(p.status).toUpperCase() !== 'VENDIDAAA').forEach(p => {
    const post = document.createElement('article');
    post.className = 'post';
    post.id = `post-${p.id_peca}`;
    post.dataset.id = p.id_peca;
    const carousel = document.createElement('div');
    carousel.className = 'carousel';
    (p.imagens || []).forEach(name => {
      const slide = document.createElement('div');
      slide.className = 'carousel-slide';
      slide.appendChild(criarImagemComFallback(`/img/otm/${name}.avif`));
      carousel.appendChild(slide);
    });
    const meta = document.createElement('div');
    meta.className = 'meta';
    const estaSelecionada = state.selecionadas.has(p.id_peca);
    const estaFavoritada = state.favoritos.has(p.id_peca);
    meta.innerHTML = `
      <div class="linha1"><div class="titulo">${p.titulo || ''}</div><div class="preco">${formatarPreco(p.preco)}</div></div>
      <div class="tecnica">${p.tecnica || ''}</div><div class="dimens">${p.dimensao || ''}</div>
      <div class="meta-footer">
        <button type="button" class="btn fav-btn ${estaFavoritada ? 'active' : ''}">♥</button>
        <button type="button" class="btn add-btn ${estaSelecionada ? 'added' : ''}">${estaSelecionada ? 'REMOVER' : 'ADICIONAR'}</button>
      </div>`;
    post.append(carousel, meta);
    list.appendChild(post);
  });
  section.appendChild(list);
  appContainer.appendChild(section);
}

function renderRifas() {
  appContainer.innerHTML = '';
  const section = document.createElement('section');
  section.id = 'rifas';
  const grid = document.createElement('div');
  grid.className = 'rifas';
  state.rifas.forEach(r => {
    const disponivel = !r.status_rifa || String(r.status_rifa).trim() === '';
    const btn = document.createElement('button');
    btn.className = 'rifa-btn';
    btn.classList.toggle('sold', !disponivel);
    btn.classList.toggle('selected', state.rifasSel.has(r.id_rifa));
    btn.dataset.id = r.id_rifa;
    const bg = r.hex_rifa || r.hex || '#777';
    btn.style.backgroundColor = state.rifasSel.has(r.id_rifa) ? '#fff' : bg;
    btn.style.color = state.rifasSel.has(r.id_rifa) ? '#ff0000' : getContrastColor(bg);
    btn.style.borderColor = state.rifasSel.has(r.id_rifa) ? '#ff0000' : '';
    let rawLabel = (r.botao_rifa || r.numero || r.id_rifa || '').toString().replace(/^\s*X\s*/i, '').trim();
    const parts = rawLabel.split('/');
    btn.innerHTML = `<span class="ln1">${parts[0]}</span>${parts[1] ? `<span class="ln2">/ ${parts[1].trim()}</span>` : ''}`;
    grid.appendChild(btn);
  });
  section.appendChild(grid);
  appContainer.appendChild(section);
}

function showPage(page, pieceId = null) {
  if (page === 'galeria') renderGaleria();
  else if (page === 'feed') {
    renderFeed();
    if (pieceId) setTimeout(() => document.getElementById(`post-${pieceId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }
  else if (page === 'rifas') renderRifas();
  else renderGaleria();
}

function handleHashChange() {
  const raw = (location.hash || '').slice(1);
  const [pagePart, query] = raw.split('?');
  const params = new URLSearchParams(query || '');
  showPage(pagePart || 'galeria', params.get('p'));
}

/* ========================================================================== */
/* =======================  CHECKOUT MODAL LOGIC  =========================== */
/* ========================================================================== */

const CK_ELS = {
  overlay: () => document.getElementById('checkoutOverlay'),
  modal: () => document.getElementById('checkoutModal'),
  closeBtn: () => document.getElementById('ck-close'),
  steps: () => [document.getElementById('ck-step1'), document.getElementById('ck-step2'), document.getElementById('ck-step3')],
  listRifas: () => document.getElementById('ck-rifas'),
  listPecas: () => document.getElementById('ck-pecas'),
  listFavs: () => document.getElementById('ck-favs'),
  totalS1: () => document.getElementById('ck-total-s1'),
  totalS2: () => document.getElementById('ck-total-s2'),
  totalS3: () => document.getElementById('ck-total-s3'),
  next1: () => document.getElementById('ck-next-1'),
  prev2: () => document.getElementById('ck-prev-2'),
  next2: () => document.getElementById('ck-next-2'),
  prev3: () => document.getElementById('ck-prev-3'),
  formNome: () => document.getElementById('ck-nome'),
  formEmail: () => document.getElementById('ck-email'),
  formFone: () => document.getElementById('ck-fone'),
  pixQR: () => document.getElementById('ck-pix-qr'),
  pixCopy: () => document.getElementById('ck-pix-copy'),
  pixPayload: () => document.getElementById('ck-pix-payload'),
  tabPix: () => document.getElementById('ck-tab-pix'),
  tabPP: () => document.getElementById('ck-tab-pp'),
  panePix: () => document.getElementById('ck-pane-pix'),
  panePP: () => document.getElementById('ck-pane-pp'),
};

function openCheckoutModal() {
  checkoutState.isOpen = true;
  Object.assign(document.documentElement.style, { overflow: 'hidden' });
  CK_ELS.overlay().hidden = false;
  CK_ELS.modal().hidden = false;
  goToCheckoutStep(1);
  renderCheckoutStep1();
}

function closeCheckoutModal() {
  checkoutState.isOpen = false;
  Object.assign(document.documentElement.style, { overflow: '' });
  CK_ELS.overlay().hidden = true;
  CK_ELS.modal().hidden = true;
}

function goToCheckoutStep(stepNumber) {
  checkoutState.step = stepNumber;
  CK_ELS.steps().forEach((stepEl, i) => { if (stepEl) stepEl.hidden = (i + 1 !== stepNumber); });
  syncCheckoutTotals();
  if (stepNumber === 3) ensurePixReady(true);
}

function syncCheckoutTotals() {
  const totalText = formatarPreco(state.totalGeral);
  [CK_ELS.totalS1(), CK_ELS.totalS2(), CK_ELS.totalS3()].forEach(el => { if (el) el.textContent = totalText; });
}

function renderCheckoutStep1() {
  const { listRifas, listPecas, listFavs } = CK_ELS;
  [listRifas(), listPecas(), listFavs()].forEach(el => el.innerHTML = '');
  const createRow = (kind, id, content, price) => {
    const div = document.createElement('div');
    div.className = 'ck-grid';
    div.innerHTML = `<div><button class="ck-x" data-kind="${kind}" data-id="${id}">X</button></div><div>${content}</div><div>${price}</div>`;
    return div;
  };
  state.rifasSel.forEach(id => {
    const rifa = state.rifas.find(r => r.id_rifa === id);
    if (rifa) listRifas().appendChild(createRow('rifa', id, rifa.botao_rifa || rifa.id_rifa, formatarPreco(25)));
  });
  state.selecionadas.forEach(id => {
    const peca = state.pecas.find(p => p.id_peca === id);
    if (peca) listPecas().appendChild(createRow('peca', id, `<img src="/img/tmb/${peca.imagens?.[0]}.avif" class="ck-thumb" alt=""><span class="ck-title">${peca.titulo}</span>`, formatarPreco(peca.preco)));
  });
  state.favoritos.forEach(id => {
    const peca = state.pecas.find(p => p.id_peca === id);
    if (peca) listFavs().appendChild(createRow('favorita', id, `<img src="/img/tmb/${peca.imagens?.[0]}.avif" class="ck-thumb" alt=""><span class="ck-title">${peca.titulo}</span>`, '-'));
  });
}

function ensurePixReady(force = false) {
  const total = Math.floor(state.totalGeral || 0);
  syncCheckoutTotals();
  const payload = gerarBRCode(total);
  const holder = CK_ELS.pixPayload();
  if (holder) holder.textContent = payload;
  const box = CK_ELS.pixQR();
  if (!box) return;
  if (force) box.innerHTML = '';
  if (box.childElementCount === 0 && window.QRCode) new QRCode(box, { text: payload, width: 160, height: 160, correctLevel: QRCode.CorrectLevel.M });
  const btnCopy = CK_ELS.pixCopy();
  if (btnCopy && !btnCopy._ckBound) {
    btnCopy._ckBound = true;
    btnCopy.addEventListener('click', () => {
      const text = holder?.textContent || payload;
      navigator.clipboard?.writeText(text).then(() => {
        const old = btnCopy.textContent;
        btnCopy.textContent = 'PIX copiado!';
        setTimeout(() => btnCopy.textContent = old, 1800);
      });
    });
  }
}

/* ========================================================================== */
/* ==========================  INICIALIZAÇÃO APP  =========================== */
/* ========================================================================== */

function setupEventListeners() {
  document.querySelector('.nav').addEventListener('click', e => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
      e.preventDefault();
      location.hash = e.target.getAttribute('href');
    }
  });

  appContainer.addEventListener('click', e => {
    const galItem = e.target.closest('.gal-item');
    if (galItem) return location.hash = `#feed?p=${galItem.dataset.id}`;

    const post = e.target.closest('.post');
    if (post) {
      const id = post.dataset.id;
      if (e.target.classList.contains('add-btn')) {
        state.selecionadas.has(id) ? state.selecionadas.delete(id) : state.selecionadas.add(id);
        renderFeed();
        return calcularTotal();
      }
      if (e.target.classList.contains('fav-btn')) {
        state.favoritos.has(id) ? state.favoritos.delete(id) : state.favoritos.add(id);
        renderFeed();
        return calcularTotal();
      }
    }

    const rifaBtn = e.target.closest('.rifa-btn:not(.sold)');
    if (rifaBtn) {
      state.rifasSel.has(rifaBtn.dataset.id) ? state.rifasSel.delete(rifaBtn.dataset.id) : state.rifasSel.add(rifaBtn.dataset.id);
      renderRifas();
      return calcularTotal();
    }
  });

  document.getElementById('ctaMain').addEventListener('click', openCheckoutModal);
  CK_ELS.closeBtn().addEventListener('click', closeCheckoutModal);
  CK_ELS.overlay().addEventListener('click', closeCheckoutModal);

  // Navegação do Checkout
  CK_ELS.next1().addEventListener('click', () => goToCheckoutStep(2));
  CK_ELS.prev2().addEventListener('click', () => goToCheckoutStep(1));

  CK_ELS.next2().addEventListener('click', () => {
    const nome = CK_ELS.formNome().value.trim();
    const email = CK_ELS.formEmail().value.trim();
    if (!nome || !email) return alert('Por favor, preencha seu nome e e-mail.');
    goToCheckoutStep(3);
  });

  CK_ELS.prev3().addEventListener('click', () => goToCheckoutStep(2));

  // Submissão final
  document.getElementById('ck-finish').addEventListener('click', () => {
    const nome = CK_ELS.formNome().value.trim();
    const email = CK_ELS.formEmail().value.trim();
    const telefone = CK_ELS.formFone().value.trim();

    // Preenche o formulário oculto
    document.getElementById('fNome').value = nome;
    document.getElementById('fEmail').value = email;
    document.getElementById('fTelefone').value = telefone;
    document.getElementById('fPecas').value = [...state.selecionadas].join(', ');
    document.getElementById('fRifas').value = [...state.rifasSel].join(', ');
    document.getElementById('fFav').value = [...state.favoritos].join(', ');
    document.getElementById('fTotal').value = state.totalGeral.toFixed(2);

    // Envia o formulário
    document.getElementById('hiddenForm').submit();
  });

  CK_ELS.modal().addEventListener('click', e => {
    if (!e.target.classList.contains('ck-x')) return;
    const { kind, id } = e.target.dataset;
    if (kind === 'rifa') state.rifasSel.delete(id);
    else if (kind === 'peca') state.selecionadas.delete(id);
    else if (kind === 'favorita') state.favoritos.delete(id);
    calcularTotal();
    renderCheckoutStep1();
    if (state.totalGeral === 0) closeCheckoutModal();
  });

  [CK_ELS.tabPix(), CK_ELS.tabPP()].forEach(tab => {
    if(tab) tab.onclick = () => {
      const isPix = tab.id === 'ck-tab-pix';
      CK_ELS.tabPix().setAttribute('aria-selected', isPix);
      CK_ELS.tabPP().setAttribute('aria-selected', !isPix);
      CK_ELS.panePix().setAttribute('aria-hidden', !isPix);
      CK_ELS.panePP().setAttribute('aria-hidden', isPix);
    };
  });
}

async function init() {
  appContainer.innerHTML = '<p style="text-align:center;">Carregando...</p>';
  try {
    const [pecasResp, rifasResp] = await Promise.all([
      fetch(CONFIG.PECAS_URL, { cache: 'no-store' }),
      fetch(CONFIG.RIFAS_URL, { cache: 'no-store' })
    ]);
    if (!pecasResp.ok || !rifasResp.ok) throw new Error('Falha ao carregar os dados.');
    state.pecas = await pecasResp.json();
    state.rifas = await rifasResp.json();
    setupEventListeners();
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    calcularTotal();
  } catch (error) {
    console.error("Erro na inicialização:", error);
    appContainer.innerHTML = '<p style="text-align:center; color:red;">Erro ao carregar o conteúdo.</p>';
  }
}

document.addEventListener('DOMContentLoaded', init);
</script>
