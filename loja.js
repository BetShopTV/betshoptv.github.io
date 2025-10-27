/* ======================= CONFIG ======================= */
const PECAS_JSON_URL = 'dados/pecas.json';
const RIFAS_JSON_URL = 'dados/rifas.json';
const GAS_URL        = 'https://script.google.com/macros/s/AKfycbwsX8iGOv_mg0bhY8iRGACMGte56FXVo6ursYG_K4cq0Y50jW3g34_GX3uJU3U-Vwo0UQ/exec';

/* ======================== STATE ======================== */
let pecas = [];
let rifas = [];
const selecionadas = new Set();
const rifasSel     = new Set();
const favoritos    = new Set();
let totalGeral     = 0;

/* ======================= HELPERS ======================= */
const fmt = (v) => `R$ ${Math.round(Number(v||0)).toLocaleString('pt-BR')}`;

function imgWithFallback(src){
  const img = new Image();
  img.loading = 'lazy';
  img.src = src;
  img.onerror = () => { if (src.endsWith('.avif')) img.src = src.replace('.avif', '.jpg'); };
  return img;
}

const getContrastColor = (hex) => {
  try {
    if (!hex) return '#2b2424';
    let s = String(hex).trim().slice(1);
    if (s.length === 3) s = s.split('').map(c=>c+c).join('');
    const [r,g,b] = [0,2,4].map(i=>parseInt(s.substring(i,i+2),16));
    return ((r*299)+(g*587)+(b*114))/1000 >= 128 ? '#2b2424' : '#ffffff';
  } catch (e) { return '#2b2424'; }
};

/* =============== RENDERERS =============== */
function renderGaleria(){
  const app = document.getElementById('app');
  app.innerHTML = '<section id="galeria"><div class="galeria" id="masonryGallery"></div></section>';
  const masonry = document.getElementById('masonryGallery');
  pecas.forEach(p => {
    if (String(p.status).toUpperCase() === 'VENDIDAAA') return;
    const item = document.createElement('div');
    item.className = 'gal-item';
    item.dataset.id = p.id_peca;
    const img = imgWithFallback('/img/tmb/' + (p.imagens?.[0] || '') + '.avif');
    img.alt = p.titulo || `Peça ${p.id_peca}`;
    item.appendChild(img);
    masonry.appendChild(item);
  });
}

function renderFeed(){
    const app = document.getElementById('app');
    app.innerHTML = '<section id="feed"><div id="feedList" class="feed"></div></section>';
    const list = document.getElementById('feedList');
    pecas.forEach(p => {
        if (String(p.status).toUpperCase() === 'VENDIDAAA') return;
        const post = document.createElement('article');
        post.className = 'post';
        post.id = `post-${p.id_peca}`;
        post.innerHTML = `
            <div class="carousel">${(p.imagens || []).map(name => `<div class="carousel-slide"><img src="/img/otm/${name}.avif"></div>`).join('')}</div>
            <div class="meta">
                <div class="linha1">
                    <div class="titulo">${p.titulo || `Peça ${p.id_peca}`}</div>
                    <div class="preco">${fmt(p.preco)}</div>
                </div>
                <div class="tecnica">${p.tecnica || ''}</div>
                <div class="dimens">${p.dimensao || p.tamanho || ''}</div>
                <div class="meta-footer">
                    <button type="button" class="btn fav-btn ${favoritos.has(p.id_peca) ? 'active' : ''}">♥</button>
                    <button type="button" class="btn add-btn ${selecionadas.has(p.id_peca) ? 'added' : ''}">${selecionadas.has(p.id_peca) ? 'REMOVER' : 'ADICIONAR'}</button>
                </div>
            </div>`;
        list.appendChild(post);
    });
}

function renderRifas(){
    const app = document.getElementById('app');
    app.innerHTML = '<section id="rifas"><div class="rifas"></div></section>';
    const grid = app.querySelector('.rifas');
    rifas.forEach(r => {
        const disponivel = !r.status_rifa || String(r.status_rifa).trim() === '';
        const btn = document.createElement('button');
        btn.className = `rifa-btn ${disponivel ? '' : 'sold'} ${rifasSel.has(r.id_rifa) ? 'selected' : ''}`;
        const bg = r.hex_rifa || r.hex || '#777';
        btn.style.backgroundColor = bg;
        btn.style.color = getContrastColor(bg);
        btn.dataset.id = r.id_rifa;
        let rawLabel = (r.botao_rifa || '').trim() || (r.numero || r.id_rifa || '').toString();
        btn.innerHTML = `<span>${rawLabel.replace(/^\s*X\s*/i, '').trim()}</span>`;
        if (disponivel) {
            btn.addEventListener('click', () => {
                if (rifasSel.has(r.id_rifa)) rifasSel.delete(r.id_rifa);
                else rifasSel.add(r.id_rifa);
                btn.classList.toggle('selected');
                calcularTotal();
            });
        }
        grid.appendChild(btn);
    });
}

/* =============== NAVIGATION & STATE =============== */
function showPage(page) {
    if (page === 'galeria') renderGaleria();
    else if (page === 'feed') renderFeed();
    else if (page === 'rifas') renderRifas();
    else renderGaleria();
    location.hash = page;
    calcularTotal();
}

function calcularTotal(){
  let total = 0;
  selecionadas.forEach(id => {
    const p = pecas.find(x => x.id_peca === id);
    if (p) total += parseFloat(p.preco || 0);
  });
  const nR = rifasSel.size;
  total += (nR % 2 === 0) ? 25*nR : 25*(nR-1)+30;
  totalGeral = total;
  updatePills();
}

function updatePills(){
    const pill = document.getElementById('pillCompact');
    const cta = document.getElementById('ctaMain');
    const parts = [];
    if (selecionadas.size > 0) parts.push(`${selecionadas.size} Peça(s)`);
    if (rifasSel.size > 0) parts.push(`${rifasSel.size} Rifa(s)`);
    if (favoritos.size > 0) parts.push(`${favoritos.size} Favorita(s)`);
    pill.textContent = parts.join(' · ');
    pill.style.display = parts.length ? 'inline-block' : 'none';
    cta.textContent = totalGeral > 0 ? `APOSTAR ${fmt(totalGeral)}` : 'FAÇAM SUAS APOSTAS!';
    cta.disabled = totalGeral <= 0;
}

/* ======================== CHECKOUT ======================== */
const CK = {
    overlay: ()=> document.getElementById('checkoutOverlay'),
    modal:   ()=> document.getElementById('checkoutModal'),
    s1: ()=> document.getElementById('ck-step1'),
    s2: ()=> document.getElementById('ck-step2'),
    s3: ()=> document.getElementById('ck-step3'),
    listR: ()=> document.getElementById('ck-rifas'),
    listP: ()=> document.getElementById('ck-pecas'),
    listF: ()=> document.getElementById('ck-favs'),
    t1: ()=> document.getElementById('ck-total-s1'),
    close: ()=> document.getElementById('ck-close'),
    next1: ()=> document.getElementById('ck-next-1'),
    prev2: ()=> document.getElementById('ck-prev-2'),
    next2: ()=> document.getElementById('ck-next-2'),
    fNome:  ()=> document.getElementById('ck-nome'),
    fEmail: ()=> document.getElementById('ck-email'),
    fFone:  ()=> document.getElementById('ck-fone'),
};

function ckOpenModal(){
    CK.overlay().hidden = false;
    CK.modal().hidden = false;
    document.documentElement.classList.add('ck-open');
    ckGoStep(1);
    ckRenderStep1();
}

function ckCloseModal(){
    CK.overlay().hidden = true;
    CK.modal().hidden = true;
    document.documentElement.classList.remove('ck-open');
}

function ckGoStep(step){
    CK.s1().hidden = (step !== 1);
    CK.s2().hidden = (step !== 2);
    CK.s3().hidden = (step !== 3);
}

function ckRenderStep1() {
    CK.listR().innerHTML = [...rifasSel].map(id => `<div>Rifa ${id}</div>`).join('');
    CK.listP().innerHTML = [...selecionadas].map(id => {
        const p = pecas.find(x => x.id_peca === id);
        return `<div>${p.titulo} - ${fmt(p.preco)}</div>`;
    }).join('');
    CK.listF().innerHTML = [...favoritos].map(id => `<div>${pecas.find(x=>x.id_peca===id).titulo}</div>`).join('');
    CK.t1().textContent = fmt(totalGeral);
}

function submitForm() {
    const nome = CK.fNome().value.trim();
    const email = CK.fEmail().value.trim();
    if (!nome || !email) {
        alert('Nome e E-mail são obrigatórios.');
        ckGoStep(2);
        return;
    }
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('email', email);
    formData.append('telefone', CK.fFone().value.trim());
    formData.append('pecas', [...selecionadas].join(', '));
    formData.append('rifas', [...rifasSel].join(', '));
    formData.append('favoritas', [...favoritos].join(', '));
    formData.append('total', totalGeral);

    fetch("https://formsubmit.co/b7c03bfd6671addd4ddd857cb7e53d3d", {
        method: "POST",
        body: formData,
    })
    .then(() => ckGoStep(3))
    .catch(error => console.error('Form submission error:', error));
}


/* ======================== INIT ======================== */
async function init(){
  try {
    const [rp, rr] = await Promise.all([
      fetch(PECAS_JSON_URL),
      fetch(RIFAS_JSON_URL)
    ]);
    pecas = await rp.json();
    rifas = await rr.json();

    window.addEventListener('hashchange', () => showPage(location.hash.slice(1) || 'galeria'));
    document.querySelector('.nav').addEventListener('click', e => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            showPage(e.target.hash.slice(1));
        }
    });
    document.getElementById('app').addEventListener('click', e => {
        const galItem = e.target.closest('.gal-item');
        if (galItem) return showPage('feed');
        const addBtn = e.target.closest('.add-btn');
        if(addBtn) {
            const id = e.target.closest('.post').id.split('-')[1];
            if (selecionadas.has(id)) selecionadas.delete(id);
            else selecionadas.add(id);
            renderFeed();
            calcularTotal();
        }
        const favBtn = e.target.closest('.fav-btn');
        if(favBtn) {
            const id = e.target.closest('.post').id.split('-')[1];
            if (favoritos.has(id)) favoritos.delete(id);
            else favoritos.add(id);
            favBtn.classList.toggle('active');
            updatePills();
        }
    });

    CK.close().addEventListener('click', ckCloseModal);
    CK.overlay().addEventListener('click', ckCloseModal);
    CK.next1().addEventListener('click', () => ckGoStep(2));
    CK.prev2().addEventListener('click', () => ckGoStep(1));
    CK.next2().addEventListener('click', submitForm);
    document.getElementById('ctaMain').addEventListener('click', ckOpenModal);

    showPage(location.hash.slice(1) || 'galeria');
  } catch(e){
    console.error('Init error', e);
    document.getElementById('app').innerHTML = '<div style="color:red;text-align:center;">Erro ao carregar.</div>';
  }
}

init();
