/* presentes.js - versão corrigida com BR Code (Pix Copia e Cola) válido,
   modal com scroll, grid/list view, 120 itens gerados, ordenação/filtragem,
   geração de QR com texto BR Code correto, botão de copiar o Pix Copia e Cola.
   Requer que a página inclua a biblioteca QRCode (qrcodejs) e que o HTML
   possua elementos com ids: lista, filtroCategoria, ordenar, viewToggle (opcional).
*/

/* ========== CONFIGURAÇÃO ========== */
const SERVICE_ID = window.SERVICE_ID || 'service_bh48d3o';
const TEMPLATE_PRESENTE_CONF = window.TEMPLATE_PRESENTE_CONF || 'template_v469su3';
const PIX_KEY = window.PIX_KEY || '97427455-6f14-4aba-aa09-d1cb15de34d4';
const PIX_NOME = window.PIX_NOME || 'Guilherme de Siqueira Silveira';
const PIX_CIDADE = window.PIX_CIDADE || 'Jacarei';
const PIX_POINT_OF_INIT = '12'; // 12 = dynamic QR (use 11 for static if preferred)

/* armazenamento */
let contribuicoes = JSON.parse(localStorage.getItem('contribuicoes') || '[]');
let rsvps = JSON.parse(localStorage.getItem('rsvps') || '[]');

/* ========== GERADOR de 120 PRESENTES ========== */
(function generateItems(){
  const categorias = ['Cozinha','Eletrodomésticos','Lua de Mel','Decoração','Sala','Quarto','Banheiro','Lavanderia','Escritório','Eletrônicos'];
  const sampleImages = [
    'img/presente1.jpg','img/presente2.jpg','img/presente3.jpg','img/presente4.jpg','img/presente5.jpg',
    'img/presente6.jpg','img/presente7.jpg','img/presente8.jpg','img/presente9.jpg','img/presente10.jpg',
    'img/presente11.jpg','img/presente12.jpg'
  ];

  window.presentes = []; // global

  const templates = {
    'Cozinha': [
      ['Jogo de Panelas', 'Conjunto premium antiaderente 5 peças'],
      ['Conjunto de Facas', 'Facas profissionais de aço inox']
    ],
    'Eletrodomésticos': [
      ['Liquidificador', 'Potente 1200W com copo de vidro'],
      ['Micro-ondas', 'Micro-ondas 28L econômico']
    ],
    'Lua de Mel': [
      ['Vale Jantar Romântico', 'Jantar especial para o casal'],
      ['Passeio Guiado', 'Experiência turística local']
    ],
    'Decoração': [
      ['Quadro Decorativo', 'Quadro com moldura minimalista'],
      ['Vaso Cerâmica', 'Vaso decorativo artesanal']
    ],
    'Sala': [
      ['Manta de Sofá', 'Manta aconchegante para o sofá'],
      ['Abajur', 'Abajur com luz suave']
    ],
    'Quarto': [
      ['Lençóis 300 fios', 'Jogo de lençóis casal 300 fios'],
      ['Travesseiros Confort', 'Travesseiros ortopédicos']
    ],
    'Banheiro': [
      ['Toalhas Premium', 'Jogo de toalhas 4 peças'],
      ['Kit Banheiro', 'Conjunto saboneteira e porta-escovas']
    ],
    'Lavanderia': [
      ['Varal Portátil', 'Varal retrátil e compacto'],
      ['Cesto Organizador', 'Cesto para roupas sujas']
    ],
    'Escritório': [
      ['Cadeira Ergonômica', 'Cadeira com apoio lombar'],
      ['Escrivaninha Compacta', 'Mesa funcional com gavetas']
    ],
    'Eletrônicos': [
      ['Aspirador Robot', 'Aspirador inteligente com app'],
      ['Smart TV 43"', 'TV 4K com HDR']
    ]
  };

  for(let i=1;i<=120;i++){
    const categoria = categorias[(i-1) % categorias.length];
    const tplList = templates[categoria];
    const tpl = tplList[(i-1) % tplList.length];
    const nomeBase = tpl[0];
    const descBase = tpl[1];
    const preco = Number((50 + Math.random()*4500).toFixed(2)); // 50 a 4550
    const img = sampleImages[i % sampleImages.length];
    const item = {
      id: 'p' + String(i).padStart(3,'0'),
      nome: `${nomeBase} — ${i}`,
      descricao: `${descBase} — modelo ${1000+i}`,
      categoria,
      preco,
      img,
      link: '#',
      endereco: 'Rua Araxá, 316, Passos - MG',
      status: 'Disponível'
    };
    window.presentes.push(item);
  }
})();

/* ========== BR CODE (PIX Copia e Cola) - GERADOR CORRIGIDO ========== */
/* Monta BR Code seguindo padrão EMV + CRC16 (compatível com apps bancários) */
function gerarBRCodePix({ chave, nome, cidade, valor, txid, pointOfInit = PIX_POINT_OF_INIT }){
  function f(id, value){
    return id + String(value.length).padStart(2,'0') + value;
  }
  function crc16(input){
    let crc = 0xFFFF;
    for(let i=0;i<input.length;i++){
      crc ^= input.charCodeAt(i) << 8;
      for(let j=0;j<8;j++){
        if ((crc & 0x8000) !== 0) crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        else crc = (crc << 1) & 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4,'0');
  }

  const mai_gui = f('00','br.gov.bcb.pix');
  const mai_key = f('01', String(chave));
  const mai = f('26', mai_gui + mai_key);
  const pfi = f('00','01');
  const pim = f('01', String(pointOfInit));
  const mcc = f('52','0000');
  const currency = f('53','986');
  const valueField = (typeof valor === 'number' && !isNaN(valor)) ? f('54', Number(valor).toFixed(2)) : '';
  const country = f('58','BR');
  const mname = f('59', String(nome).slice(0,25));
  const mcity = f('60', String(cidade).slice(0,15));
  const tx = txid ? f('05', String(txid)) : '';
  const additional = tx ? f('62', tx) : '';
  const payloadNoCRC = pfi + pim + mai + mcc + currency + valueField + country + mname + mcity + additional + '6304';
  const crc = crc16(payloadNoCRC);
  return payloadNoCRC + crc;
}

/* ========== RENDER + CONTROLES ========== */
(function ui(){
  function $(id){ return document.getElementById(id); }

  function populateCategoriaSelect(){
    const sel = $('filtroCategoria');
    if(!sel) return;
    const cats = Array.from(new Set(window.presentes.map(p=>p.categoria))).sort();
    sel.innerHTML = '<option value="">Todas</option>' + cats.map(c=> `<option value="${c}">${c}</option>`).join('');
  }

  function renderList(items, view='grid'){
    const container = $('lista') || $('listaPresentes');
    if(!container) return;
    container.innerHTML = '';

    if(view === 'grid'){
      container.className = 'grid';
      items.forEach(p=>{
        const d = document.createElement('div'); d.className='item card-present';
        d.innerHTML = `
          <div class="img-box" aria-hidden="true">
            <div class="img-square"><img src="${p.img}" alt="${escapeHtml(p.nome)}"></div>
          </div>
          <h4>${escapeHtml(p.nome)}</h4>
          <p class="price">R$ ${Number(p.preco).toFixed(2)}</p>
          <p class="category">${escapeHtml(p.categoria)}</p>
          <div style="display:flex; gap:8px; margin-top:10px;">
            <button class="btn" data-id="${p.id}">Presentear</button>
            <a class="btn-ghost" href="${p.link}" target="_blank" rel="noopener">Ver</a>
          </div>
        `;
        container.appendChild(d);
        d.querySelector('.btn')?.addEventListener('click', ()=> abrirModalPresenteById(p.id));
      });
    } else {
      container.className = 'lista';
      items.forEach(p=>{
        const d = document.createElement('div'); d.className='item list-item';
        d.innerHTML = `
          <div style="display:flex; gap:12px; align-items:center;">
            <div style="width:100px; flex:0 0 100px;" class="img-box"><div class="img-square"><img src="${p.img}" alt="${escapeHtml(p.nome)}"></div></div>
            <div style="flex:1;">
              <h4>${escapeHtml(p.nome)}</h4>
              <p style="margin:6px 0 4px; color:#555;">${escapeHtml(p.descricao)}</p>
              <p class="price">R$ ${Number(p.preco).toFixed(2)}</p>
            </div>
            <div style="flex:0 0 120px;">
              <button class="btn" data-id="${p.id}">Presentear</button>
            </div>
          </div>
        `;
        container.appendChild(d);
        d.querySelector('.btn')?.addEventListener('click', ()=> abrirModalPresenteById(p.id));
      });
    }
  }

  function applyFilterSortView(){
    const cat = $('filtroCategoria') ? $('filtroCategoria').value : '';
    const ord = $('ordenar') ? $('ordenar').value : '';
    const view = $('viewToggle') ? $('viewToggle').value : 'grid';

    let arr = window.presentes.slice();
    if(cat) arr = arr.filter(x=> x.categoria === cat);

    if(ord){
      if(ord === 'preco_asc') arr.sort((a,b)=> a.preco - b.preco);
      if(ord === 'preco_desc') arr.sort((a,b)=> b.preco - a.preco);
      if(ord === 'nome_asc') arr.sort((a,b)=> a.nome.localeCompare(b.nome));
      if(ord === 'nome_desc') arr.sort((a,b)=> b.nome.localeCompare(a.nome));
    }

    renderList(arr, view);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    populateCategoriaSelect();
    const cat = $('filtroCategoria');
    const ord = $('ordenar');
    const view = $('viewToggle');
    if(cat) cat.addEventListener('change', applyFilterSortView);
    if(ord) ord.addEventListener('change', applyFilterSortView);
    if(view) view.addEventListener('change', applyFilterSortView);

    if($('lista')) applyFilterSortView();
    if($('listaPresentes')){
      const sample = window.presentes.slice(0,12);
      renderList(sample, 'grid');
    }
  });

  window.abrirModalPresenteById = function(id){
    const p = window.presentes.find(x=> x.id === id);
    if(!p) return alert('Presente não encontrado');
    openPresentModal(p);
  };
})();

/* ========== MODAL, QR, CONFIRMAÇÃO ========== */
function ensureModalExists(){
  let modalBg = document.getElementById('modalPresenteBg');
  if(modalBg) return modalBg;
  modalBg = document.createElement('div');
  modalBg.id = 'modalPresenteBg';
  modalBg.className = 'modal-bg';
  modalBg.style.display = 'none';
  modalBg.innerHTML = `<div class="modal" id="modalPresenteContent" style="max-height:80vh; overflow:auto;"></div>`;
  document.body.appendChild(modalBg);
  return modalBg;
}

function openPresentModal(p){
  const modalBg = ensureModalExists();
  const content = document.getElementById('modalPresenteContent');
  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h3 style="font-weight:300; margin:0;">${escapeHtml(p.nome)}</h3>
      <button class="fechar-modal btn-ghost" id="fecharModalBtn">✕</button>
    </div>
    <div style="margin-top:12px;">
      <div style="width:100%; aspect-ratio:1/1; background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; border-radius:10px;">
        <img src="${p.img}" style="max-width:100%; max-height:100%; object-fit:contain; padding:8px;">
      </div>
    </div>
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

  modalBg.style.display = 'flex';
  document.getElementById('fecharModalBtn').onclick = ()=> modalBg.style.display='none';
  document.getElementById('cancelPixBtn').onclick = ()=> modalBg.style.display='none';

  document.getElementById('gerarPixBtn').onclick = function(){
    const valorRaw = document.getElementById('valorPresenteModal').value.trim();
    const valorNum = valorRaw ? Number(valorRaw.replace(',','.')) : null;
    if(valorRaw && (isNaN(valorNum) || valorNum <= 0)){ alert('Digite um valor válido, ex: 150.00'); return; }
    generateAndShowBRCode(p, valorNum);
  };
}

function generateAndShowBRCode(present, valorNum){
  const txid = 'PRES' + Date.now();
  const brcode = gerarBRCodePix({ chave: PIX_KEY, nome: PIX_NOME, cidade: PIX_CIDADE, valor: valorNum, txid, pointOfInit: PIX_POINT_OF_INIT });

  const pixArea = document.getElementById('pixAreaModal');
  pixArea.style.display = 'block';
  const qrHolderId = 'qrcode_pres_' + present.id;
  pixArea.innerHTML = `
    <div id="${qrHolderId}" style="display:inline-block; margin-bottom:8px;"></div>
    <p style="margin:6px 0;">Chave PIX: <strong>${PIX_KEY}</strong></p>
    <p style="margin:6px 0;">Valor: ${valorNum?('R$ '+Number(valorNum).toFixed(2)):'Valor livre'}</p>
    <div style="display:flex; gap:8px; justify-content:center; margin-top:8px;">
      <button class="btn" id="copBr">Copiar Pix Copia e Cola</button>
      <button class="btn-ghost" id="copCh">Copiar chave</button>
    </div>
    <div style="display:flex; gap:8px; justify-content:center; margin-top:10px;">
      <button class="btn" id="confirmContrib">Confirmar contribuição</button>
    </div>
  `;

  try{
    if(typeof QRCode === 'undefined') throw new Error('QRCode lib não encontrada');
    const qrEl = document.getElementById(qrHolderId);
    qrEl.innerHTML = '';
    new QRCode(qrEl, { text: brcode, width: 260, height: 260 });
  }catch(e){
    document.getElementById(qrHolderId).innerText = brcode;
  }

  document.getElementById('copBr').onclick = ()=> { navigator.clipboard?.writeText(brcode).then(()=> alert('BR Code copiado (Pix Copia e Cola)')); };
  document.getElementById('copCh').onclick = ()=> { navigator.clipboard?.writeText(PIX_KEY).then(()=> alert('Chave PIX copiada')); };

  document.getElementById('confirmContrib').onclick = ()=>{
    const nome = document.getElementById('nomePresenteModal').value.trim() || 'Anônimo';
    const tel = document.getElementById('telefonePresenteModal').value.trim() || '';
    const item = { id: txid, presenteId: present.id, presenteNome: present.nome, nome, telefone: tel, valor: valorNum?Number(valorNum).toFixed(2):0, data: new Date().toISOString() };
    contribuicoes.push(item);
    localStorage.setItem('contribuicoes', JSON.stringify(contribuicoes));
    alert('Obrigado pela contribuição!');
    try{
      if(typeof emailjs !== 'undefined'){
        emailjs.send(SERVICE_ID, TEMPLATE_PRESENTE_CONF, { nome: item.nome, presente_nome: item.presenteNome, valor: item.valor, txid: item.id });
      }
    }catch(e){ console.warn('EmailJS erro', e); }
    const modalBg = document.getElementById('modalPresenteBg');
    if(modalBg) modalBg.style.display='none';
    if(window.atualizarTabelaAdmin) try{ window.atualizarTabelaAdmin(); }catch(e){}
  };
}

/* util */
function escapeHtml(s){ if(!s && s !== 0) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* export helper */
window.__presentes_module = { gerarBRCodePix };
