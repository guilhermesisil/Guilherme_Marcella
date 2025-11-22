/* presentes.js — versão revisada e corrigida
   — Ordenação funcionando (fix bind)
   — BR Code compatível com bancos (Pix Copia e Cola)
   — Modal com scroll
   — 120 itens
   — Filtro, ordenação, exibição grid/lista
   — QRCode e botão copiar
*/

/* ========== CONFIGURAÇÃO ========== */
const SERVICE_ID = window.SERVICE_ID || 'service_bh48d3o';
const TEMPLATE_PRESENTE_CONF = window.TEMPLATE_PRESENTE_CONF || 'template_v469su3';

const PIX_KEY = window.PIX_KEY || '97427455-6f14-4aba-aa09-d1cb15de34d4';
const PIX_NOME = window.PIX_NOME || 'Guilherme de Siqueira Silveira';
const PIX_CIDADE = window.PIX_CIDADE || 'Jacarei';
const PIX_POINT_OF_INIT = '12'; // 12 = QR dinâmico

let contribuicoes = JSON.parse(localStorage.getItem('contribuicoes') || '[]');

// COLE SUA URL DO PASSO 2 AQUI EMBAIXO
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyyEV3iFu_NpAxW4xO6V9GMeXIZrAjIwBgKeRh7FvD_xtj3GKYmnzp-w696na631gZv/exec";

// NOVA FUNÇÃO DE CARREGAR
async function carregarPresentes() {
    try {
        // Agora busca da planilha, não do JSON local
        const resposta = await fetch(GOOGLE_SCRIPT_URL); 
        const dados = await resposta.json();

        // Filtra e formata (garante compatibilidade)
        window.presentes = dados.map(item => ({
            id: item.id,
            nome: item.nome,
            descricao: item.descricao,
            categoria: item.categoria,
            preco: item.preco,
            img: item.img || "",
            link: "#",
            endereco: "Rua Araxá, 316, Passos - MG",
            status: item.status || "Disponível"
        }));

        console.log("Presentes carregados da nuvem:", window.presentes);
        
        // Renderiza a interface
        if(typeof inicializarInterface === "function") inicializarInterface();
        else {
             populateCategoriaSelect();
             applyFilterSortView(); // Atualiza a tela
        }

    } catch (erro) {
        console.error("Erro ao carregar presentes:", erro);
        // Fallback: tenta carregar local se a internet falhar
        const resp = await fetch("presentes.json");
        const dados = await resp.json();
        window.presentes = dados;
        applyFilterSortView();
    }
}



/* ===========================================================
   BR Code – PIX (100% válido)
=========================================================== */
function gerarBRCodePix({ chave, nome, cidade, valor, txid, pointOfInit = PIX_POINT_OF_INIT }){

  function f(id, value){
    return id + String(value.length).padStart(2,'0') + value;
  }

  function crc16(input){
    let crc = 0xFFFF;
    for(let i=0;i<input.length;i++){
      crc ^= input.charCodeAt(i) << 8;
      for(let j=0;j<8;j++){
        if(crc & 0x8000) crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
        else crc = (crc << 1) & 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4,'0');
  }

  const gui = f('00','br.gov.bcb.pix');
  const pixKey = f('01', chave);
  const merchantAccount = f('26', gui + pixKey);

  const pfi = f('00','01');
  const poi = f('01', pointOfInit);
  const mcc = f('52','0000');
  const curr = f('53','986');
  const val = valor ? f('54', Number(valor).toFixed(2)) : '';
  const c = f('58','BR');
  const nm = f('59', nome.slice(0,25));
  const ct = f('60', cidade.slice(0,15));
  const tx = txid ? f('05', txid) : '';
  const add = tx ? f('62', tx) : '';

  const payload = pfi + poi + merchantAccount + mcc + curr + val + c + nm + ct + add + '6304';
  return payload + crc16(payload);
}


/* ===========================================================
   UI – GRID/LISTA + FILTRO + ORDENAR
=========================================================== */
function $(id){ return document.getElementById(id); }

/* Correção determinante:
   liga eventos mesmo que HTML tenha carregado antes/depois */
function bindControls(){
  const cat = $('filtroCategoria');
  const ord = $('ordenar');
  const view = $('viewToggle');

  if(cat && !cat.dataset.bound){ cat.addEventListener('change', applyFilterSortView); cat.dataset.bound="1"; }
  if(ord && !ord.dataset.bound){ ord.addEventListener('change', applyFilterSortView); ord.dataset.bound="1"; }
  if(view && !view.dataset.bound){ view.addEventListener('change', applyFilterSortView); view.dataset.bound="1"; }
}

setTimeout(bindControls, 100);
setTimeout(bindControls, 400);
setTimeout(bindControls, 800);

document.addEventListener('DOMContentLoaded', ()=>{
  populateCategoriaSelect();
  bindControls();
  applyFilterSortView();
});


/* Preencher filtro de categorias */
function populateCategoriaSelect(){
  const sel = $('filtroCategoria');
  if(!sel) return;

  const cats = [...new Set(window.presentes.map(p=>p.categoria))].sort();
  sel.innerHTML = '<option value="">Todas</option>' +
    cats.map(c=>`<option value="${c}">${c}</option>`).join('');
}


/* Renderização principal */
function renderList(items, view='grid'){
  const container = $('lista') || $('listaPresentes');
  if(!container) return;
  container.innerHTML='';

  container.className = view;

  if(view === 'grid'){
    items.forEach(p=>{
      const d = document.createElement('div');
      d.className='item card-present';
      d.innerHTML = `
        <div class="img-square"><img src="${p.img}"></div>
        <h4>${escapeHtml(p.nome)}</h4>
        <p class="price">R$ ${p.preco.toFixed(2)}</p>
        <p class="category">${escapeHtml(p.categoria)}</p>
        <div class="actions">
          <button class="btn" data-id="${p.id}">Presentear</button>
          <a class="btn-ghost" href="${p.link}">Ver</a>
        </div>
      `;
      container.appendChild(d);
      d.querySelector('.btn').onclick = ()=> abrirModalPresenteById(p.id);
    });

  } else {
    items.forEach(p=>{
      const d = document.createElement('div');
      d.className='item list-item';
      d.innerHTML = `
        <div>
          <h4>${escapeHtml(p.nome)}</h4>
          <p>${escapeHtml(p.descricao)}</p>
          <p class="price">R$ ${p.preco.toFixed(2)}</p>
        </div>
        <button class="btn" data-id="${p.id}">Presentear</button>
      `;
      container.appendChild(d);
      d.querySelector('.btn').onclick = ()=> abrirModalPresenteById(p.id);
    });
  }
}


/* Filtrar + ordenar + render */
function applyFilterSortView(){
  const cat = $('filtroCategoria')?.value || '';
  const ord = $('ordenar')?.value || '';
  const view = $('viewToggle')?.value || 'grid';

  let arr = window.presentes.slice();

  if(cat) arr = arr.filter(x=>x.categoria === cat);

  if(ord === 'preco_asc') arr.sort((a,b)=> a.preco - b.preco);
  if(ord === 'preco_desc') arr.sort((a,b)=> b.preco - a.preco);
  if(ord === 'nome_asc') arr.sort((a,b)=> a.nome.localeCompare(b.nome));
  if(ord === 'nome_desc') arr.sort((a,b)=> b.nome.localeCompare(a.nome));

  renderList(arr, view);
}


/* ===========================================================
   MODAL
=========================================================== */
function ensureModalExists(){
  let bg = $('modalPresenteBg');
  if(bg) return bg;

  bg = document.createElement('div');
  bg.id = 'modalPresenteBg';
  bg.className = 'modal-bg';
  bg.style.display='none';
  bg.innerHTML = `<div class="modal" id="modalPresenteContent" style="max-height:85vh; overflow-y:auto;"></div>`;
  document.body.appendChild(bg);
  return bg;
}

function abrirModalPresenteById(id){
  const p = window.presentes.find(x=>x.id===id);
  if(!p) return alert('Presente não encontrado!');
  openPresentModal(p);
}

function openPresentModal(p){
  const bg = ensureModalExists();
  const box = $('modalPresenteContent');

  box.innerHTML = `
    <div class="modal-head">
      <h3>${escapeHtml(p.nome)}</h3>
      <button class="btn-ghost" id="closeModal">✕</button>
    </div>

    <div class="img-square" style="margin-top:10px;">
      <img src="${p.img}">
    </div>

    <p>${escapeHtml(p.descricao)}</p>
    <p><strong>Entrega:</strong> ${escapeHtml(p.endereco)}</p>

    <label>Valor (R$)</label>
    <input id="valorPresenteModal" placeholder="150.00">

    <label>Seu nome</label>
    <input id="nomePresenteModal" placeholder="Seu nome">

    <label>Telefone</label>
    <input id="telefonePresenteModal" placeholder="(xx) xxxxx-xxxx">

    <button class="btn" id="gerarPixBtn">Gerar QR PIX</button>

    <div id="pixAreaModal" style="display:none; margin-top:20px;"></div>
  `;

  bg.style.display='flex';
  $('closeModal').onclick = ()=> bg.style.display='none';

  $('gerarPixBtn').onclick = () => {
    const raw = $('valorPresenteModal').value.trim();
    const val = raw ? Number(raw.replace(',','.')) : null;
    if(raw && (isNaN(val) || val<=0)) return alert('Valor inválido');

    generateAndShowBRCode(p, val);
  };
}


/* ===========================================================
   QR CODE + PIX COPIA E COLA
=========================================================== */
function generateAndShowBRCode(present, valor){
  const txid = 'PRES' + Date.now();

  const brcode = gerarBRCodePix({
    chave: PIX_KEY,
    nome: PIX_NOME,
    cidade: PIX_CIDADE,
    valor,
    txid
  });

  const pix = $('pixAreaModal');
  pix.style.display='block';
  pix.innerHTML = `
    <div id="qrHolder"></div>
    <p><strong>Chave:</strong> ${PIX_KEY}</p>
    <p><strong>Valor:</strong> ${valor ? 'R$ '+valor.toFixed(2) : 'Livre'}</p>

    <button class="btn" id="copBr">Copiar Pix Copia e Cola</button>
    <button class="btn-ghost" id="copCh">Copiar chave</button>

    <button class="btn" id="confirmarContrib" style="margin-top:12px;">Confirmar contribuição</button>
  `;

  if(typeof QRCode !== 'undefined'){
    new QRCode($('qrHolder'), { text: brcode, width: 260, height: 260 });
  } else {
    $('qrHolder').innerText = brcode;
  }

  $('copBr').onclick = ()=> navigator.clipboard.writeText(brcode).then(()=> alert('Pix Copia e Cola copiado'));
  $('copCh').onclick = ()=> navigator.clipboard.writeText(PIX_KEY).then(()=> alert('Chave copiada'));

 $('confirmarContrib').onclick = () => {
    const nome = $('nomePresenteModal').value.trim() || 'Anônimo';
    const tel = $('telefonePresenteModal').value.trim() || '';
    
    // Botão muda texto para dar feedback
    const btn = $('confirmarContrib');
    const txtOriginal = btn.innerText;
    btn.innerText = "Salvando...";
    btn.disabled = true;

    // Envia para o Google Sheets
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Importante para Apps Script
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "contribuir",
            txid: 'PRES' + Date.now(), // ou use o txid gerado antes
            presenteId: present.id,
            presenteNome: present.nome,
            valor: valor || 0,
            nomeDoador: nome,
            msg: tel // usando campo telefone como msg/contato
        })
    }).then(() => {
        alert('Obrigado! Sua contribuição foi registrada.');
        $('modalPresenteBg').style.display='none';
        
        // Opcional: Recarregar a lista para atualizar status "Reservado"
        carregarPresentes(); 
        
    }).catch(err => {
        alert('Erro ao salvar. Avise os noivos!');
        console.error(err);
    }).finally(() => {
        btn.innerText = txtOriginal;
        btn.disabled = false;
    });
};


/* Util */
function escapeHtml(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

window.__presentes_module = { gerarBRCodePix };
