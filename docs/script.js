const PECAS_JSON_URL = '/dados/pecas.json';
const RIFAS_JSON_URL = '/dados/rifas.json';

let piecesData = [];
let rifasData = [];
const selectedPieces = new Set();
const selectedRifas = new Set();
let openTab = null;

const money = v => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
const idKey = p => (p.id_peca || '');
const firstThumb = p => (p.imagens && p.imagens[0]) || '';
const tmb = name => `img/tmb/${name}.avif`;
const tmbFallback = name => `img/fallback/${name}.jpg`;

function rifaTotal(cnt) {
  if (!cnt) return 0;
  return (cnt % 2 === 0) ? 25 * cnt : 25 * (cnt - 1) + 30;
}

function piecesTotal() {
  let sum = 0;
  selectedPieces.forEach(id => {
    const p = piecesData.find(x => x.id_peca === id);
    if (p) sum += Number(p.preco || 0);
  });
  return sum;
}

function totalAll() {
  return piecesTotal() + rifaTotal(selectedRifas.size);
}

async function loadData() {
  try {
    const [pecasResp, rifasResp] = await Promise.all([
      fetch(PECAS_JSON_URL),
      fetch(RIFAS_JSON_URL)
    ]);
    const pecas = await pecasResp.json();
    const rifas = await rifasResp.json();

    piecesData = (pecas || []).filter(p => String(p.status || '').toUpperCase() !== 'VENDIDAAA');
    rifasData = (rifas || []).filter(r => !(r.status_rifa && String(r.status_rifa).trim() !== ''));

    renderGallery();
    refreshFooter();
  } catch (e) {
    console.error('Erro ao carregar os dados JSON', e);
  }
}

function renderGallery() {
  for (let i = 0; i < 3; i++) document.getElementById('col' + i).innerHTML = '';

  const ordered = [...piecesData].sort((a, b) =>
    (b.id_peca || '').localeCompare(a.id_peca || '')
  );

  ordered.forEach((p, idx) => {
    const col = document.getElementById('col' + (idx % 3));
    const card = document.createElement('a');
    card.className = 'card' + (selectedPieces.has(p.id_peca) ? ' selected' : '');
    card.href = 'javascript:void(0)';
    const img = document.createElement('img');
    const n = firstThumb(p);
    img.src = tmb(n);
    img.alt = p.titulo || p.id_peca;
    img.onerror = function () {
      this.onerror = null;
      this.src = tmbFallback(n);
    };
    card.appendChild(img);
    card.addEventListener('click', () => togglePiece(p.id_peca));
    col.appendChild(card);
  });
}

function togglePiece(id) {
  if (selectedPieces.has(id)) selectedPieces.delete(id);
  else selectedPieces.add(id);

  renderGallery();
  if (openTab === 'shop') renderPanelThumbs();
  refreshFooter();
}

function toggleRifa(id) {
  if (selectedRifas.has(id)) selectedRifas.delete(id);
  else selectedRifas.add(id);

  if (openTab === 'rifa') renderPanelThumbs();
  refreshFooter();
}

// PANEL CONTROL
const panelWrap = document.getElementById('panelWrap');
const thumbRow = document.getElementById('thumbRow');
const totalBox = document.getElementById('totalBox');
const finalizar = document.getElementById('finalizarBtn');
const backdrop = document.getElementById('backdrop');

function openPanel(tab) {
  openTab = tab;
  setIcons();
  renderPanelThumbs();
  panelWrap.style.display = 'block';
  backdrop.style.display = 'block';
  finalizar.classList.toggle('hidden', (selectedPieces.size + selectedRifas.size) === 0);
  setTimeout(() => { thumbRow.scrollLeft = thumbRow.scrollWidth; }, 0);
}

function closePanel() {
  openTab = null;
  setIcons();
  panelWrap.style.display = 'none';
  backdrop.style.display = 'none';
}

function setIcons() {
  const shopActive = (openTab === 'shop');
  const rifaActive = (openTab === 'rifa');

  const btnShop = document.getElementById('btnShop');
  const btnRifa = document.getElementById('btnRifa');
  const iconShop = document.getElementById('iconShop');
  const iconRifa = document.getElementById('iconRifa');

  btnShop.classList.toggle('inactive', !shopActive);
  btnRifa.classList.toggle('inactive', !rifaActive);

  iconShop.src = shopActive ? '/elementos/ticon-SHOP-b.avif' : '/elementos/ticon-SHOP-c.avif';
  iconRifa.src = rifaActive ? '/elementos/ticon-RIFA-b.avif' : '/elementos/ticon-RIFA-c.avif';

  btnShop.setAttribute('aria-expanded', shopActive);
  btnRifa.setAttribute('aria-expanded', rifaActive);
}

function renderPanelThumbs() {
  thumbRow.innerHTML = '';

  if (openTab === 'shop') {
    selectedPieces.forEach(id => {
      const p = piecesData.find(x => x.id_peca === id);
      if (!p) return;
      const n = firstThumb(p);
      const box = document.createElement('div');
      box.className = 'thumb';
      const img = document.createElement('img');
      img.src = tmb(n);
      img.onerror = function () { this.onerror = null; this.src = tmbFallback(n); };
      const x = document.createElement('button');
      x.className = 'close';
      x.textContent = '×';
      x.onclick = () => {
        selectedPieces.delete(id);
        renderGallery();
        renderPanelThumbs();
        refreshFooter();
      };
      box.appendChild(img);
      box.appendChild(x);
      thumbRow.appendChild(box);
    });
  } else if (openTab === 'rifa') {
    selectedRifas.forEach(id => {
      const r = rifasData.find(x => x.id_rifa === id || x.numero === id);
      const box = document.createElement('div');
      box.className = 'thumb';
      const inner = document.createElement('div');
      inner.style = "display:flex;align-items:center;justify-content:center;height:80px;font-weight:900;font-size:22px;border:2px solid var(--ink);";
      inner.textContent = r ? (r.numero || r.id_rifa) : id;
      const x = document.createElement('button');
      x.className = 'close';
      x.textContent = '×';
      x.onclick = () => {
        selectedRifas.delete(id);
        renderPanelThumbs();
        refreshFooter();
      };
      box.appendChild(inner);
      box.appendChild(x);
      thumbRow.appendChild(box);
    });
  }

  totalBox.textContent = 'TOTAL: ' + money(totalAll());
  finalizar.classList.toggle('hidden', (selectedPieces.size + selectedRifas.size) === 0);
}

function refreshFooter() {
  const cShop = document.getElementById('countShop');
  const cRifa = document.getElementById('countRifa');
  const nShop = selectedPieces.size;
  const nRifa = selectedRifas.size;
  cShop.textContent = nShop;
  cRifa.textContent = nRifa;
  cShop.classList.toggle('hidden', nShop === 0);
  cRifa.classList.toggle('hidden', nRifa === 0);
}

document.getElementById('btnShop').addEventListener('click', () => {
  if (openTab === 'shop') closePanel();
  else openPanel('shop');
});
document.getElementById('btnRifa').addEventListener('click', () => {
  if (openTab === 'rifa') closePanel();
  else openPanel('rifa');
});
backdrop.addEventListener('click', closePanel);
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') closePanel();
});

document.getElementById('finalizarBtn').addEventListener('click', () => {
  if ((selectedPieces.size + selectedRifas.size) === 0) return;
  const pecas = [...selectedPieces].join(',');
  const rifas = [...selectedRifas].join(',');
  alert(`Resumo da aposta:\nPeças: ${pecas}\nRifas: ${rifas}\nTotal: ${money(totalAll())}`);
});

loadData();
