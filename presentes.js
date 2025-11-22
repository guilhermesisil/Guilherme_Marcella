/* presentes.js — Versão Integrada com Google Sheets */

/* ========== CONFIGURAÇÃO ========== */
// COLE AQUI A URL DO SEU GOOGLE APPS SCRIPT (WEB APP)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAGdnf8IcbzT-tVIC7Yf2vnw_Kbfi6Tqh-XFjQ-AhG-Lff1ODy3lbzrXW7L7HsPdbN/exec"; 

const PIX_KEY = '97427455-6f14-4aba-aa09-d1cb15de34d4'; // Sua chave
const PIX_NOME = 'Guilherme de Siqueira Silveira'; // Seu nome
const PIX_CIDADE = 'Jacarei';
const PIX_POINT_OF_INIT = '12'; // QR dinâmico

/* ===========================================================
   CARREGAR PRESENTES (GOOGLE SHEETS)
=========================================================== */
window.presentes = [];

async function carregarPresentes() {
    const container = document.getElementById('lista') || document.getElementById('listaPresentes');
    
    try {
        // Tenta carregar da nuvem (Planilha)
        if(container) container.innerHTML = '<div style="text-align:center; padding:40px;">Carregando lista atualizada...</div>';
        
        const resposta = await fetch(GOOGLE_SCRIPT_URL);
        const dados = await resposta.json();

        // Mapeia os dados da planilha para o formato do site
        // Certifique-se que os cabeçalhos na planilha (linha 1) sejam: id, nome, descricao, categoria, preco, img
        window.presentes = dados.map(item => ({
            id: item.id,
            nome: item.nome,
            descricao: item.descricao,
            categoria: item.categoria,
            preco: Number(item.preco), // Garante que é número
            img: item.img || "img/presentes/placeholder.jpg",
            link: "#",
            endereco: "Rua Araxá, 316, Passos - MG",
            status: item.status || "Disponível" // Se adicionar coluna status na planilha
        }));

        console.log("Presentes carregados da Planilha:", window.presentes);
        if (typeof inicializarInterface === "function") inicializarInterface();
        else {
             populateCategoriaSelect();
             applyFilterSortView();
        }

    } catch (erro) {
        console.error("Erro ao carregar da planilha. Tentando backup local...", erro);
        
        // FALLBACK: Se a planilha falhar, carrega do arquivo local
        try {
            const resp = await fetch("presentes.json");
            const dadosLocal = await resp.json();
            window.presentes = dadosLocal;
            populateCategoriaSelect();
            applyFilterSortView();
        } catch(e) {
            if(container) container.innerHTML = '<p>Erro ao carregar presentes.</p>';
        }
    }
}

// Inicia o carregamento
carregarPresentes();


/* ===========================================================
   BR CODE – PIX (Geração e validação)
=========================================================== */
function gerarBRCodePix({ chave, nome, cidade, valor, txid, pointOfInit = PIX_POINT_OF_INIT }){
  function f(id, value){ return id + String(value.length).padStart(2,'0') + value; }
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

function bindControls(){
  const cat = $('filtroCategoria');
  const ord = $('ordenar');
  const view = $('viewToggle');
  if(cat && !cat.dataset.bound){ cat.addEventListener('change', applyFilterSortView); cat.dataset.bound="1"; }
  if(ord && !ord.dataset.bound){ ord.addEventListener('change', applyFilterSortView); ord.dataset.bound="1"; }
  if(view && !view.dataset.bound){ view.addEventListener('change', applyFilterSortView); view.dataset.bound="1"; }
}
setTimeout(bindControls, 500);

function populateCategoriaSelect(){
  const sel = $('filtroCategoria');
  if(!sel) return;
  const cats = [...new Set(window.presentes.map(p=>p.categoria))].sort();
  sel.innerHTML = '<option value="">Todas</option>' + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
}

function renderList(items, view='grid'){
  const container = $('lista') || $('listaPresentes');
  if(!container) return;
  container.innerHTML='';
  container.className = view;

  if(items.length === 0) {
      container.innerHTML = '<p style="grid-column:1/-1; text-align:center;">Nenhum item encontrado.</p>';
      return;
  }

  items.forEach(p=>{
      // Se estiver reservado, muda visual (opcional)
      const isReservado = p.status && p.status.toLowerCase() !== 'disponível';
      const btnText = isReservado ? 'Reservado' : 'Presentear';
      const btnClass = isReservado ? 'btn-ghost' : 'btn';
      const disabled = isReservado ? 'disabled' : '';

      const html = view === 'grid' ? `
        <div class="img-square"><img src="${p.img}" onerror="this.src='img/presentes/placeholder.jpg'"></div>
        <h4>${escapeHtml(p.nome)}</h4>
        <p class="price">R$ ${p.preco.toFixed(2)}</p>
        <p class="category">${escapeHtml(p.categoria)}</p>
        <div class="actions">
          <button class="${btnClass}" data-id="${p.id}" ${disabled}>${btnText}</button>
        </div>
      ` : `
        <div>
          <h4>${escapeHtml(p.nome)}</h4>
          <p>${escapeHtml(p.descricao)}</p>
          <p class="price">R$ ${p.preco.toFixed(2)}</p>
        </div>
        <button class="${btnClass}" data-id="${p.id}" ${disabled}>${btnText}</button>
      `;

      const d = document.createElement('div');
      d.className = view === 'grid' ? 'item card-present' : 'item list-item';
      if(isReservado) d.style.opacity = '0.6';
      d.innerHTML = html;
      container.appendChild(d);

      if(!isReservado) {
          d.querySelector('button').onclick = ()=> abrirModalPresenteById(p.id);
      }
  });
}

function applyFilterSortView(){
  const cat = $('filtroCategoria')?.value || '';
  const ord = $('ordenar')?.value || '';
  const view = $('viewToggle')?.value || 'grid';
  let arr = window.presentes.slice();
  if(cat) arr = arr.filter(x=>x.categoria === cat);
  if(ord === 'preco_asc') arr.sort((a,b)=> a.preco - b.preco);
  if(ord === 'preco_desc') arr.sort((a,b)=> b.preco - a.preco);
  if(ord === 'nome_asc') arr.sort((a,b)=> a.nome.localeCompare(b.nome));
  renderList(arr, view);
}

/* ===========================================================
   MODAL & ENVIO DE DADOS
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
  const p = window.presentes.find(x=>x.id==id); // == permite string/number
  if(!p) return alert('Presente não encontrado!');
  openPresentModal(p);
}

/* Substitua a função openPresentModal no arquivo presentes.js */

function openPresentModal(p){
  const bg = ensureModalExists();
  const box = $('modalPresenteContent');

  // Adicionamos classes para criar o layout em Grid (duas colunas)
  box.innerHTML = `
    <div class="modal-header">
      <h3>${escapeHtml(p.nome)}</h3>
      <button class="btn-close" id="closeModal">✕</button>
    </div>

    <div class="modal-body-grid">
      
      <div class="col-visual">
        <div class="img-container">
           <img src="${p.img}" onerror="this.src='img/presentes/placeholder.jpg'">
        </div>
        <p class="desc-text">${escapeHtml(p.descricao)}</p>
        <p class="entrega-info"><small>📍 Entrega: ${escapeHtml(p.endereco)}</small></p>
      </div>

      <div class="col-form">
        <div class="form-box">
            <label>Valor do Presente (R$)</label>
            <div class="input-group">
                <span class="currency">R$</span>
                <input id="valorPresenteModal" type="number" value="${p.preco.toFixed(2)}" step="0.01">
            </div>

            <label>Seu nome (para o cartão)</label>
            <input id="nomePresenteModal" placeholder="Ex: Tio João e Tia Maria">

            <label>Mensagem aos noivos</label>
            <textarea id="telefonePresenteModal" rows="3" placeholder="Escreva uma mensagem carinhosa..."></textarea>
        </div>

        <button class="btn-action" id="gerarPixBtn">Gerar QR PIX</button>
        
        <div id="pixAreaModal" class="pix-area" style="display:none;"></div>
      </div>
    </div>
  `;

  bg.style.display='flex';
  $('closeModal').onclick = ()=> bg.style.display='none';

  $('gerarPixBtn').onclick = () => {
    const raw = $('valorPresenteModal').value.trim();
    const val = raw ? Number(raw.replace(',','.')) : 0;
    if(isNaN(val) || val<=0) return alert('Valor inválido');
    generateAndShowBRCode(p, val);
  };
}

function generateAndShowBRCode(present, valor){
  // Gera ID único para a transação
  const txid = 'PRES' + Math.floor(Math.random() * 100000);
  
  const brcode = gerarBRCodePix({
    chave: PIX_KEY,
    nome: PIX_NOME,
    cidade: PIX_CIDADE,
    valor,
    txid
  });

  const pix = $('pixAreaModal');
  pix.style.display='block';
  // Remove botão gerar para limpar a tela
  $('gerarPixBtn').style.display='none'; 

  pix.innerHTML = `
    <p style="font-size:14px; color:#666;">Abra o app do banco e escaneie:</p>
    <div id="qrHolder" style="margin:10px auto;"></div>
    
    <div style="display:flex; gap:10px; justify-content:center; margin-bottom:15px;">
        <button class="btn-ghost" style="font-size:12px;" id="copBr">Copiar Código Pix</button>
    </div>

    <div style="background:#eef; padding:10px; border-radius:8px; margin-bottom:15px;">
        <p style="margin:0; font-size:13px;"><strong>Importante:</strong> Após pagar, clique abaixo para nos avisar e tirar o item da lista.</p>
    </div>

    <button class="btn" id="confirmarContrib" style="width:100%; background:#2ecc71; border:none;">Confirmar Pagamento</button>
  `;

  if(typeof QRCode !== 'undefined'){
    new QRCode($('qrHolder'), { text: brcode, width: 200, height: 200 });
  } else {
    $('qrHolder').innerText = "Erro na lib QR Code";
  }

  $('copBr').onclick = ()=> navigator.clipboard.writeText(brcode).then(()=> alert('Pix Copia e Cola copiado!'));

  // LOGICA DE SALVAR NO GOOGLE SHEETS
  $('confirmarContrib').onclick = () => {
    const nome = $('nomePresenteModal').value.trim() || 'Anônimo';
    const msg = $('telefonePresenteModal').value.trim() || '';

    const btn = $('confirmarContrib');
    btn.innerText = "Registrando...";
    btn.disabled = true;

    // Monta objeto para enviar
    const payload = {
        action: "contribuir",
        txid: txid,
        presenteId: present.id,
        presenteNome: present.nome,
        valor: valor,
        nomeDoador: nome,
        msg: msg
    };

    // Envia para o Google Apps Script
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Importante para não dar erro de CORS
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).then(() => {
        alert(`Obrigado, ${nome}! Sua contribuição foi registrada com sucesso.`);
        $('modalPresenteBg').style.display='none';
        // Recarrega para atualizar o status se tiver mudado para Reservado
        carregarPresentes();
    }).catch(err => {
        alert('Houve um erro ao registrar. Mas se você fez o PIX, está tudo certo!');
        console.error(err);
        $('modalPresenteBg').style.display='none';
    });
  };
}

function escapeHtml(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
