/* ===========================================================
   CENTRAL DE APOSTAS — SCRIPT MESTRE BSTV
   =========================================================== */

/* ---------- VARIÁVEIS ---------- */
const PECAS_JSON_URL = '/dados/pecas.json';
const RIFAS_JSON_URL = '/dados/rifas.json';

let piecesData = [];
let rifasData = [];
const selectedPieces = new Set();
const selectedRifas = new Set();

/* Referências DOM */
const $panel = document.getElementById('panel');
const $thumbs = document.getElementById('thumbs');
const $total = document.getElementById('total');
const $finalizar = document.getElementById('finalizar');
const $tabShop = document.getElementById('tabShop');
const $tabRifa = document.getElementById('tabRifa');
const $badgeShop = document.getElementById('badgeShop');
const $badgeRifa = document.getElementById('badgeRifa');

/* ---------- FUNÇÕES AUXILIARES ---------- */
const money = v => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
const firstThumb = p => (p.imagens && p.imagens[0]) || '';
const tmb = name => `img/tmb/${name}.avif`;
const tmbFallback = name => `img/fallback/${name}.jpg`;

async function loadJSON(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('Erro ao carregar JSON: ' + url);
  return r.json();
}

function sortDescById(arr) {
  return [...arr].sort((a, b) => {
    const ai = parseInt((a.id_peca || '').replace(/\D/g, ''), 10);
    const bi = parseInt((b.id_peca || '').replace(/\D/g, ''), 10);
    return bi - ai;
  });
}

/* ---------- PAINEL ---------- */
function openPanel() {
  $panel.classList.add('open');
  $panel.setAttribute('aria-hidden', 'false');
}
function closePanel() {
  $panel.classList.remove('open');
  $panel.setAttribute('aria-hidden', 'true');
}
function togglePanel() {
  if ($panel.classList.contains('open')) closePanel();
  else if (selectedPieces.size || selectedRifas.size) openPanel();
}

/* ---------- RENDERIZAÇÃO DO PAINEL ---------- */
function renderPanel() {
  const items = [
    ...piecesData.filter(p => selectedPieces.has(p.id_peca)),
    ...rifasData.filter(r => selectedRifas.has(r.id_rifa))
  ];

  $thumbs.innerHTML = '';

  items.forEach(obj => {
    const id = obj.id_peca || obj.id_rifa;
    const tn = firstThumb(obj);
    const box = document.createElement('div');
    box.className = 'tmb';
    const im = document.createElement('img');
    im.src = tmb(tn);
    im.onerror = () => im.src = tmbFallback(tn);

    const x = document.createElement('div');
    x.className = 'x';
    x.textContent = '×';
    x.addEventListener('click', () => {
      if (obj.id_peca) selectedPieces.delete(obj.id_peca);
      if (obj.id_rifa) selectedRifas.delete(obj.id_rifa);
      renderPanel();
      updateFooter();
    });

    box.append(im, x);
    $thumbs.appendChild(box);
  });

  const total = items.reduce((sum, o) => sum + (o.preco || 0), 0);
  $total.textContent = 'TOTAL: ' + money(total);

  $finalizar.classList.toggle('hidden', items.length === 0);
  if (items.length > 0) openPanel();
  else closePanel();
}

/* ---------- FOOTER ---------- */
function updateFooter() {
  const countShop = selectedPieces.size;
  const countRifa = selectedRifas.size;

  $badgeShop.textContent = countShop;
  $badgeRifa.textContent = countRifa;

  $badgeShop.classList.toggle('hidden', countShop === 0);
  $badgeRifa.classList.toggle('hidden', countRifa === 0);

  $tabShop.classList.toggle('active', countShop > 0);
  $tabRifa.classList.toggle('active', countRifa > 0);
  $tabShop.classList.toggle('inactive', countShop === 0);
  $tabRifa.classList.toggle('inactive', countRifa === 0);
}

/* ---------- EVENTOS ---------- */
$tabShop.addEventListener('click', () => {
  if (selectedPieces.size) togglePanel();
});
$tabRifa.addEventListener('click', () => {
  if (selectedRifas.size) togglePanel();
});
$finalizar.addEventListener('click', () => {
  alert('Aposta concluída!');
  selectedPieces.clear();
  selectedRifas.clear();
  renderPanel();
  updateFooter();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePanel();
});
document.addEventListener('click', e => {
  const insidePanel = e.target.closest('#panel');
  const insideFooter = e.target.closest('footer');
  if (!insidePanel && !insideFooter) closePanel();
});

/* ---------- INICIALIZAÇÃO ---------- */
async function initCentralApostas() {
  try {
    const [pecas, rifas] = await Promise.all([
      loadJSON(PECAS_JSON_URL),
      loadJSON(RIFAS_JSON_URL)
    ]);
    piecesData = pecas.filter(p => String(p.status || '').toUpperCase() !== 'VENDIDAAA');
    rifasData = rifas.filter(r => !r.status_rifa || String(r.status_rifa).trim() === '');
    renderPanel();
    updateFooter();
  } catch (err) {
    console.error('Erro ao inicializar Central de Apostas:', err);
  }
}

/* Inicializa automaticamente se o componente for carregado diretamente */
if (document.readyState !== 'loading') initCentralApostas();
else document.addEventListener('DOMContentLoaded', initCentralApostas);
