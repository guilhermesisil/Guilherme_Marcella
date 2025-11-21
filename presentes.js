/* presentes.js
   - Gera 120 itens de presentes (programaticamente)
   - Renderiza em grid (6 colunas em CSS) ou lista
   - Integra modal de presentear com QR PIX (BR Code) usando qrcodejs (deve estar incluído no HTML)
   - Salva contribuições e rsvps no localStorage
   - Gatilhos para ordenação/filtragem e paginação simples

   Uso: inclua <script src="presentes.js"></script> na páginas presentes.html e index.html
*/

/* ========== CONFIG ========== */
const SERVICE_ID = window.SERVICE_ID || 'service_bh48d3o';
const TEMPLATE_PRESENTE_CONF = window.TEMPLATE_PRESENTE_CONF || 'template_v469su3';
const PIX_KEY = window.PIX_KEY || '97427455-6f14-4aba-aa09-d1cb15de34d4';
const PIX_NOME = window.PIX_NOME || 'Guilherme de Siqueira Silveira';
const PIX_CIDADE = window.PIX_CIDADE || 'Jacarei';

/* armazenamento */
let contribuicoes = JSON.parse(localStorage.getItem('contribuicoes') || '[]');

/* ========== GERAR 120 PRESENTES (programaticamente) ========== */
(function generateItems(){
  const categorias = ['Cozinha','Eletrodomésticos','Lua de Mel','Decoração','Sala','Quarto','Banheiro','Lavanderia','Escritório','Eletrônicos'];
  const sampleImages = [
    '/mnt/data/c8058528-4991-46fb-be7f-fb4eb2573ea5.png',
    'img/presente1.jpg','img/presente2.jpg','img/presente3.jpg','img/presente4.jpg','img/presente5.jpg',
    'img/presente6.jpg','img/presente7.jpg','img/presente8.jpg','img/presente9.jpg','img/presente10.jpg','img/presente11.jpg'
  ];

  window.presentes = []; // global so other scripts can use

  // templates por categoria para nomes/descrições
  const templates = {
    'Cozinha': [
      ['Jogo de Panelas 5 pcs','Conjunto premium antiaderente'],
      ['Conjunto de Facas','Facas profissionais para cozinha']
    ],
    'Eletrodomésticos': [
      ['Liquidificador potente','Liquidificador 1200W com múltiplas velocidades'],
      ['Micro-ondas 28L','Micro-ondas compacto e eficiente']
    ],
    'Lua de Mel': [
      ['Vale Jantar Romântico','Jantar para duas pessoas em restaurante parceiro'],
      ['Vale Passeio','Passeio guiado na cidade de destino']
    ],
    'Decoração': [
      ['Conjunto de Quadros','Trio de quadros modernos'],
      ['Vaso Decorativo','Vaso em cerâmica artesanal']
    ],
    'Sala': [
      ['Manta de Sofá','Manta aconchegante para o sofá'],
      ['Abajur Moderno','Abajur com design minimalista']
    ],
    'Quarto': [
      ['Jogo de Lençóis','Lençóis 300 fios casal'],
      ['Travesseiros de Pluma','Conjunto com 2 travesseiros']
    ],
    'Banheiro': [
      ['Toalhas Premium','Jogo de toalhas 4 peças'],
      ['Kit Acessórios','Suporte para sabonete, porta-escova']
    ],
    'Lavanderia': [
      ['Mini Lava-Louças','Compacta para 6 serviços'],
      ['Varal Portátil','Fácil de guardar']
    ],
    'Escritório': [
      ['Cadeira Ergonômica','Cadeira com apoio lombar'],
      ['Escrivaninha Compacta','Mesa com gavetas']
    ],
    'Eletrônicos': [
      ['Aspirador Robot','Limpeza automática com app'],
      ['Smart TV 43"','Tela 4K inteligente']
    ]
  };

  // cria 120 itens
  for(let i=1;i<=120;i++){
    const categoria = categorias[(i-1) % categorias.length];
    const tpl = templates[categoria][(i-1) % templates[categoria].length];
    const baseName = tpl[0];
    const baseDesc = tpl[1];
    const preco = Number((50 + Math.random()*4500).toFixed(2)); // 50 a 4550
    const img = sampleImages[i % sampleImages.length];
    const item = {
      id: 'p'+String(i).padStart(3,'0'),
      nome: `${baseName} — ${i}`,
      descricao: baseDesc + ' — modelo ' + (1000 + i),
      categoria,
      preco,
      img,
      link: '#',
      endereco: 'Rua Araxá, 316, Passos - MG',
      status: 'Disponivel'
    };
    window.presentes.push(item);
  }
})();

/* ========== RENDER + INTERAÇÕES ========== */
(function ui(){
  // elementos (presentes.html usa #lista, index.html carrega uma versão reduzida)
  function getEl(id){ return document.getElementById(id); }

  // render básico: recebe lista de items
  function renderList(items, opts={view:'grid', perRow:6}){
    const container = getEl('lista') || getEl('listaPresentes');
    if(!container) return;

    // clear
    container.innerHTML = '';

    // grid/list classes — prefer CSS to control columns; but we build markup
    if(opts.view === 'grid'){
      // create cards
      items.forEach(p=>{
        const div = document.createElement('div');
        div.className = 'item card-present';
        div.innerHTML = `
          <div class="img-square"><img src="${p.img}" alt="${escapeHtml(p.nome)}"></div>
          <h4>${escapeHtml(p.nome)}</h4>
          <p class="price">R$ ${Number(p.preco).toFixed(2)}</p>
          <p class="category">${escapeHtml(p.categoria)}</p>
          <div class="actions"><button class="btn" data-id="${p.id}" onclick="abrirModalPresenteById('${p.id}')">Presentear</button> <a class="btn-ghost" href="${p.link}" target="_blank">Ver</a></div>
        `;
        container.appendChild(div);
      });

    } else {
      // list view
      items.forEach(p=>{
        const div = document.createElement('div');
        div.className = 'item list-item';
        div.innerHTML = `
          <div style="display:flex; gap:12px; align-items:center;"><div style="width:120px; flex:0 0 120px;" class="img-square"><img src="${p.img}" alt="${escapeHtml(p.nome)}"></div>
          <div style="flex:1;"><h4>${escapeHtml(p.nome)}</h4><p>${escapeHtml(p.descricao)}</p><p class="price">R$ ${Number(p.preco).toFixed(2)}</p></div>
          <div><button class="btn" data-id="${p.id}" onclick="abrirModalPresenteById('${p.id}')">Presentear</button></div></div>
        `;
        container.appendChild(div);
      });
    }
  }

  // filtering and sorting helper
  function applyFilterAndSort(){
    const catEl = document.getElementById('filtroCategoria');
    const ordEl = document.getElementById('ordenar');
    const viewToggle = document.getElementById('viewToggle');
    const view = viewToggle ? viewToggle.value : 'grid';

    let arr = window.presentes.slice();
    if(catEl && catEl.value) arr = arr.filter(x=> x.categoria === catEl.value);

    if(ordEl){
      const v = ordEl.value;
      if(v === 'preco-asc') arr.sort((a,b)=> a.preco - b.preco);
      if(v === 'preco-desc') arr.sort((a,b)=> b.preco - a.preco);
      if(v === 'nome-asc') arr.sort((a,b)=> a.nome.localeCompare(b.nome));
      if(v === 'nome-desc') arr.sort((a,b)=> b.nome.localeCompare(a.nome));
    }

    renderList(arr, {view, perRow:6});
  }

  // attach events if controls exist
  document.addEventListener('DOMContentLoaded', ()=>{
    const cat = document.getElementById('filtroCategoria');
    const ord = document.getElementById('ordenar');
    const view = document.getElementById('viewToggle');
    if(cat) cat.addEventListener('change', applyFilterAndSort);
    if(ord) ord.addEventListener('change', applyFilterAndSort);
    if(view) view.addEventListener('change', applyFilterAndSort);

    // if a 'mini-list' on index exists (e.g. #listaPresentes) show only first 8
    const mini = document.getElementById('listaPresentes');
    if(mini){
      const sample = window.presentes.slice(0,8);
      renderList(sample, {view:'grid'});
    }

    // if full page has #lista, render all with controls
    if(document.getElementById('lista')){
      // inject view toggle if not present
      const controls = document.querySelector('.controls');
      if(controls && !document.getElementById('viewToggle')){
        const sel = document.createElement('select'); sel.id = 'viewToggle';
        sel.innerHTML = '<option value="grid">Grid</option><option value="list">Lista</option>';
        controls.appendChild(sel);
        sel.addEventListener('change', applyFilterAndSort);
      }
      applyFilterAndSort();
    }
  });

  // expose abrirModalPresenteById globally
  window.abrirModalPresenteById = function(pId){
    const p = window.presentes.find(x=> x.id === pId);
    if(!p){ alert('Presente não encontrado'); return; }
    openPresentModal(p);
  }

})();

/* ========== MODAL + PIX + CONFIRMAÇÃO ========== */
function openPresentModal(p){
  // create modal element (singleton)
  let modalBg = document.getElementById('modalPresenteBg');
  if(!modalBg){
    modalBg = document.createElement('div'); modalBg.id = 'modalPresenteBg'; modalBg.className = 'modal-bg';
    document.body.appendChild(modalBg);
  }
  modalBg.style.display = 'flex';

  const content = document.createElement('div'); content.className = 'modal';
  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h3 style="font-weight:300; margin:0;">${escapeHtml(p.nome)}</h3>
      <button class="fechar-modal btn-ghost" id="fecharModalPresenteBtn">✕</button>
    </div>
    <div style="margin-top:12px;"><div style="width:100%; aspect-ratio:1/1; background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; border-radius:10px;"><img src="${p.img}" style="max-width:100%; max-height:100%; object-fit:contain; padding:8px;"/></div></div>
    <p style="margin-top:10px; font-weight:300;">${escapeHtml(p.descricao)}</p>
    <p style="font-weight:400;">Entrega: ${escapeHtml(p.endereco || '')}</p>

    <label style="display:block; margin-top:12px; font-weight:300;">Valor (R$)</label>
    <input id="valorPresenteModal" type="text" placeholder="150.00" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; margin-top:6px;">
    <label style="display:block; margin-top:8px; font-weight:300;">Seu nome</label>
    <input id="nomePresenteModal" type="text" placeholder="Seu nome (opcional)" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; margin-top:6px;">
    <label style="display:block; margin-top:8px; font-weight:300;">Telefone</label>
    <input id="telefonePresenteModal" type="text" placeholder="Telefone (opcional)" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; margin-top:6px;">

    <div style="display:flex; gap:8px; margin-top:12px;">
      <button class="btn" id="gerarPixBtn">Gerar QR (PIX)</button>
      <button class="btn-ghost" id="cancelPixBtn">Cancelar</button>
    </div>
    <div id="pixAreaModal" style="margin-top:12px; display:none; text-align:center;"></div>
  `;

  // clear old modal content
  modalBg.innerHTML = '';
  modalBg.appendChild(content);

  document.getElementById('fecharModalPresenteBtn').onclick = () => { modalBg.style.display='none'; };
  document.getElementById('cancelPixBtn').onclick = () => { modalBg.style.display='none'; };

  document.getElementById('gerarPixBtn').onclick = function(){
    const valorRaw = document.getElementById('valorPresenteModal').value.trim();
    const valorNum = valorRaw ? Number(valorRaw.replace(',','.')) : null;
    if(valorRaw && (isNaN(valorNum) || valorNum <= 0)){ alert('Digite um valor válido, ex: 150.00'); return; }
    generateAndShowBRCode(p, valorNum);
  };
}

function generateAndShowBRCode(present, valorNum){
  // reuse BR Code generator from earlier (simple CRC implemented here)
  function formatField(id, value){ const len = String(value).length.toString().padStart(2,'0'); return id + len + value; }
  function crc16(str){ let crc=0xFFFF; for(let i=0;i<str.length;i++){ crc ^= str.charCodeAt(i) << 8; for(let j=0;j<8;j++){ crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1); crc &= 0xFFFF; } } return crc.toString(16).toUpperCase().padStart(4,'0'); }
  const guia = formatField('00','br.gov.bcb.pix');
  const key = formatField('01', PIX_KEY);
  const mai = formatField('26', guia + key);
  const pfi = formatField('00','01');
  const mc = formatField('52','0000');
  const cur = formatField('53','986');
  const val = valorNum ? formatField('54', Number(valorNum).toFixed(2)) : '';
  const country = formatField('58','BR');
  const mname = formatField('59', String(PIX_NOME).slice(0,25));
  const mcity = formatField('60', String(PIX_CIDADE).slice(0,15));
  const withoutCRC = pfi + mai + mc + cur + val + country + mname + mcity + '6304';
  const crc = crc16(withoutCRC);
  const brcode = withoutCRC + crc;

  const pixArea = document.getElementById('pixAreaModal');
  pixArea.style.display = 'block';
  const qrHolderId = 'qrcode_pres_' + present.id;
  pixArea.innerHTML = `<div id="${qrHolderId}"></div><p style="margin:6px 0;">Chave PIX: <strong>${PIX_KEY}</strong></p><p style="margin:6px 0;">Valor: ${valorNum?('R$ '+Number(valorNum).toFixed(2)):'Valor livre'}</p><div style="display:flex; gap:8px; justify-content:center;"><button class='btn' id='copChave'>Copiar chave</button><button class='btn-ghost' id='copValor'>Copiar valor</button></div><button class='btn' id='confirmContrib' style='margin-top:12px;'>Confirmar contribuição</button>`;

  // generate QR code using QRCode lib (must be loaded on page)
  try{
    new QRCode(document.getElementById(qrHolderId), { text: brcode, width: 220, height: 220 });
  }catch(e){
    // fallback: show raw code
    document.getElementById(qrHolderId).innerText = brcode;
  }

  document.getElementById('copChave').onclick = ()=>{ navigator.clipboard?.writeText(PIX_KEY).then(()=> alert('Chave copiada')); };
  document.getElementById('copValor').onclick = ()=>{ navigator.clipboard?.writeText(valorNum?('R$ '+Number(valorNum).toFixed(2)):'Valor livre').then(()=> alert('Valor copiado')); };

  document.getElementById('confirmContrib').onclick = ()=>{
    const nome = document.getElementById('nomePresenteModal').value.trim() || 'Anônimo';
    const tel = document.getElementById('telefonePresenteModal').value.trim() || '';
    const txid = 'PRES'+Date.now();
    const item = { id: txid, presenteId: present.id, presenteNome: present.nome, nome, telefone: tel, valor: valorNum?Number(valorNum).toFixed(2):0, data: new Date().toISOString() };
    contribuicoes.push(item);
    localStorage.setItem('contribuicoes', JSON.stringify(contribuicoes));
    alert('Obrigado pela contribuição!');
    // send EmailJS notification to admin if configured
    try{ if(typeof emailjs !== 'undefined'){ emailjs.send(SERVICE_ID, TEMPLATE_PRESENTE_CONF, { nome: item.nome, presente_nome: item.presenteNome, valor: item.valor, txid: item.id }); } }catch(e){ console.warn('EmailJS erro', e); }
    // close modal
    const modalBg = document.getElementById('modalPresenteBg'); if(modalBg) modalBg.style.display='none';
    // update admin table if present
    if(window.atualizarTabelaAdmin) try{ window.atualizarTabelaAdmin(); }catch(e){}
  };
}

/* ========== UTIL ========== */
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ========== PAGINATION (opcional) ========== */
// Not implemented by default; can be added if desired

// Expose helper to render all (for debug)
window._renderAllPresentes = function(){ if(document.getElementById('lista')){ const sel = document.getElementById('viewToggle'); if(sel) sel.value='grid'; const ord = document.getElementById('ordenar'); if(ord) ord.value=''; const f = document.getElementById('filtroCategoria'); if(f) f.value=''; const event = new Event('change'); if(sel) sel.dispatchEvent(event); if(ord) ord.dispatchEvent(event); if(f) f.dispatchEvent(event); } };

/* EOF */
