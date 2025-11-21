/* presentes.js - versão corrigida e integrada */

const SERVICE_ID = window.SERVICE_ID || 'service_bh48d3o';
const TEMPLATE_PRESENTE_CONF = window.TEMPLATE_PRESENTE_CONF || 'template_v469su3';
const PIX_KEY = window.PIX_KEY || '97427455-6f14-4aba-aa09-d1cb15de34d4';
const PIX_NOME = window.PIX_NOME || 'Guilherme de Siqueira Silveira';
const PIX_CIDADE = window.PIX_CIDADE || 'Jacarei';

let contribuicoes = JSON.parse(localStorage.getItem('contribuicoes') || '[]');

/* ========== GERAR 120 PRESENTES ========== */
(function generateItems(){
  const categorias = ['Cozinha','Eletrodomésticos','Lua de Mel','Decoração','Sala','Quarto','Banheiro','Lavanderia','Escritório','Eletrônicos'];
  const sampleImages = [
    'img/presente1.jpg','img/presente2.jpg','img/presente3.jpg','img/presente4.jpg','img/presente5.jpg',
    'img/presente6.jpg','img/presente7.jpg','img/presente8.jpg','img/presente9.jpg','img/presente10.jpg',
    'img/presente11.jpg','img/presente12.jpg'
  ];

  const templates = {
    'Cozinha': [['Jogo de Panelas','Conjunto antiaderente premium'],['Conjunto de Facas','Facas profissionais']],
    'Eletrodomésticos': [['Liquidificador','1200W com várias velocidades'],['Micro-ondas','28L compacto']],
    'Lua de Mel': [['Vale Jantar','Jantar romântico para duas pessoas'],['Passeio Romântico','Passeio guiado']],
    'Decoração': [['Quadro Decorativo','Quadro moderno para sala'],['Vaso Cerâmica','Vaso artesanal']],
    'Sala': [['Manta de Sofá','Manta aconchegante'],['Abajur','Design minimalista']],
    'Quarto': [['Lençóis 300 fios','Conforto casal'],['Travesseiro','2 travesseiros de pluma']],
    'Banheiro': [['Toalhas Premium','Jogo 4 peças'],['Kit Banheiro','Porta-sabonete e suporte']],
    'Lavanderia': [['Varal Portátil','Fácil de guardar'],['Mini Lava-louças','Compacta 6 serviços']],
    'Escritório': [['Cadeira Ergonômica','Apoio lombar'],['Escrivaninha','Mesa com gavetas']],
    'Eletrônicos': [['Aspirador Robot','Limpeza automática'],['Smart TV 43"','4K Smart TV']]
  };

  window.presentes = [];
  for(let i=1;i<=120;i++){
    const categoria = categorias[(i-1) % categorias.length];
    const tpl = templates[categoria][(i-1) % templates[categoria].length];
    const nomeBase = tpl[0];
    const descricaoBase = tpl[1];
    const preco = Number((50 + Math.random()*4500).toFixed(2));
    const img = sampleImages[(i-1) % sampleImages.length];
    const item = {
      id: 'p'+String(i).padStart(3,'0'),
      nome: `${nomeBase} — ${i}`,
      descricao: `${descricaoBase} — modelo ${1000+i}`,
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

/* ========== RENDER + CONTROLES ========== */
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function renderList(items, view='grid'){
  const container = document.getElementById('lista');
  if(!container) return;
  container.className = view === 'grid' ? 'grid' : 'lista';
  container.innerHTML = '';

  if(view === 'grid'){
    items.forEach(p=>{
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="img-box"><img src="${p.img}" alt="${escapeHtml(p.nome)}"></div>
        <h4>${escapeHtml(p.nome)}</h4>
        <p class="price">R$ ${Number(p.preco).toFixed(2)}</p>
        <p class="category">${escapeHtml(p.categoria)}</p>
        <div class="actions">
          <button class="btn" data-id="${p.id}">Presentear</button>
          <a class="btn-ghost" href="${p.link}" target="_blank">Ver</a>
        </div>
      `;
      // attach open modal on presentear button
      div.querySelector('.btn')?.addEventListener('click', ()=> abrirModalPresenteById(p.id));
      container.appendChild(div);
    });
  } else {
    items.forEach(p=>{
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div style="display:flex; gap:12px; align-items:center;">
          <div style="width:120px; flex:0 0 120px;" class="img-box"><img src="${p.img}" alt="${escapeHtml(p.nome)}"></div>
          <div style="flex:1;">
            <h4>${escapeHtml(p.nome)}</h4>
            <p style="font-size:13px; color:#666; margin:6px 0;">${escapeHtml(p.descricao)}</p>
            <p class="price">R$ ${Number(p.preco).toFixed(2)}</p>
          </div>
          <div><button class="btn" data-id="${p.id}">Presentear</button></div>
        </div>
      `;
      div.querySelector('.btn')?.addEventListener('click', ()=> abrirModalPresenteById(p.id));
      container.appendChild(div);
    });
  }
}

function populateCategoriaFilter(){
  const sel = document.getElementById('filtroCategoria');
  if(!sel) return;
  const cats = Array.from(new Set(window.presentes.map(p=>p.categoria)));
  cats.forEach(c=>{
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  });
}

function applyFilterAndSort(){
  const cat = document.getElementById('filtroCategoria')?.value || '';
  const ord = document.getElementById('ordenar')?.value || '';
  const view = document.getElementById('viewToggle')?.value || 'grid';

  let arr = window.presentes.slice();
  if(cat) arr = arr.filter(x=> x.categoria === cat);

  if(ord === 'preco-asc') arr.sort((a,b)=> a.preco - b.preco);
  if(ord === 'preco-desc') arr.sort((a,b)=> b.preco - a.preco);
  if(ord === 'nome-asc') arr.sort((a,b)=> a.nome.localeCompare(b.nome));
  if(ord === 'nome-desc') arr.sort((a,b)=> b.nome.localeCompare(a.nome));

  renderList(arr, view);
}

document.addEventListener('DOMContentLoaded', ()=>{
  populateCategoriaFilter();
  // attach events
  document.getElementById('filtroCategoria')?.addEventListener('change', applyFilterAndSort);
  document.getElementById('ordenar')?.addEventListener('change', applyFilterAndSort);
  document.getElementById('viewToggle')?.addEventListener('change', applyFilterAndSort);

  // initial render
  applyFilterAndSort();
});

/* ========= modal helpers (uses modalPresenteBg wrapper) ========= */
window.abrirModalPresenteById = function(id){
  const p = window.presentes.find(x=> x.id === id);
  if(!p) return alert('Presente não encontrado');
  openPresentModal(p);
}

function openPresentModal(p){
  const modalBg = document.getElementById('modalPresenteBg');
  const modal = document.getElementById('modalPresente');
  modalBg.style.display = 'flex';
  modal.innerHTML = `
    <button class="fechar" onclick="fecharModalPresente()">✕</button>
    <h3 style="margin-top:0;">${escapeHtml(p.nome)}</h3>
    <div style="margin:12px 0;"><div style="width:100%; aspect-ratio:1/1; background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; border-radius:10px;"><img src="${p.img}" style="max-width:100%; max-height:100%; object-fit:contain; padding:8px;"></div></div>
    <p style="margin:8px 0 0; font-weight:300;">${escapeHtml(p.descricao)}</p>
    <p style="font-weight:400;">Entrega: ${escapeHtml(p.endereco)}</p>

    <label style="display:block; margin-top:12px; font-weight:300;">Valor (R$)</label>
    <input id="valorPresenteModal" type="text" placeholder="150.00" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; margin-top:6px;">
    <label style="display:block; margin-top:8px; font-weight:300;">Seu nome</label>
    <input id="nomePresenteModal" type="text" placeholder="Seu nome (opcional)" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; margin-top:6px;">
    <label style="display:block; margin-top:8px; font-weight:300;">Telefone</label>
    <input id="telefonePresenteModal" type="text" placeholder="Telefone (opcional)" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; margin-top:6px;">

    <div style="display:flex; gap:8px; margin-top:12px;">
      <button class="btn" id="gerarPixBtn">Gerar QR (PIX)</button>
      <button class="btn-ghost" onclick="fecharModalPresente()">Cancelar</button>
    </div>
    <div id="pixAreaModal" style="margin-top:12px; display:none; text-align:center;"></div>
  `;

  document.getElementById('gerarPixBtn').onclick = function(){
    const valorRaw = document.getElementById('valorPresenteModal').value.trim();
    const valorNum = valorRaw ? Number(valorRaw.replace(',','.')) : null;
    if(valorRaw && (isNaN(valorNum) || valorNum <= 0)){ alert('Digite um valor válido, ex: 150.00'); return; }
    generateAndShowBRCode(p, valorNum);
  };
}

function fecharModalPresente(){
  const modalBg = document.getElementById('modalPresenteBg');
  modalBg.style.display = 'none';
  const pixArea = document.getElementById('pixAreaModal');
  if(pixArea) pixArea.innerHTML = '';
}

/* ===== BR Code generator with CRC16 ===== */
function formatField(id, value){ const len = String(value).length.toString().padStart(2,'0'); return id + len + value; }
function crc16(str){ let crc=0xFFFF; for(let i=0;i<str.length;i++){ crc ^= str.charCodeAt(i) << 8; for(let j=0;j<8;j++){ crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1); crc &= 0xFFFF; } } return crc.toString(16).toUpperCase().padStart(4,'0'); }

function generateAndShowBRCode(present, valorNum){
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
  pixArea.innerHTML = `<div id="${qrHolderId}"></div><p style="margin:6px 0;">Chave PIX: <strong>${PIX_KEY}</strong></p><p style="margin:6px 0;">Valor: ${valorNum?('R$ '+Number(valorNum).toFixed(2)):'Valor livre'}</p><div style="display:flex; gap:8px; justify-content:center; margin-top:8px;"><button class='btn' id='copChave'>Copiar chave</button><button class='btn-ghost' id='copValor'>Copiar valor</button></div><button class='btn' id='confirmContrib' style='margin-top:12px;'>Confirmar contribuição</button>`;

  // gerar QR
  try{ new QRCode(document.getElementById(qrHolderId), { text: brcode, width: 220, height: 220 }); }catch(e){ document.getElementById(qrHolderId).innerText = brcode; }

  document.getElementById('copChave').onclick = ()=> navigator.clipboard?.writeText(PIX_KEY).then(()=> alert('Chave copiada'));
  document.getElementById('copValor').onclick = ()=> navigator.clipboard?.writeText(valorNum?('R$ '+Number(valorNum).toFixed(2)):'Valor livre').then(()=> alert('Valor copiado'));

  document.getElementById('confirmContrib').onclick = function(){
    const nome = document.getElementById('nomePresenteModal').value.trim() || 'Anônimo';
    const tel = document.getElementById('telefonePresenteModal').value.trim() || '';
    const txid = 'PRES'+Date.now();
    const item = { id: txid, presenteId: present.id, presenteNome: present.nome, nome, telefone: tel, valor: valorNum?Number(valorNum).toFixed(2):0, data: new Date().toISOString() };
    contribuicoes.push(item);
    localStorage.setItem('contribuicoes', JSON.stringify(contribuicoes));
    alert('Obrigado pela contribuição!');
    try{ if(typeof emailjs !== 'undefined'){ emailjs.send(SERVICE_ID, TEMPLATE_PRESENTE_CONF, { nome: item.nome, presente_nome: item.presenteNome, valor: item.valor, txid: item.id }); } }catch(e){ console.warn('EmailJS erro', e); }
    fecharModalPresente();
  };
}
