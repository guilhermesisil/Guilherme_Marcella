/* presentes.js — Versão Integrada com Google Sheets */

/* ========== CONFIGURAÇÃO ========== */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAGdnf8IcbzT-tVIC7Yf2vnw_Kbfi6Tqh-XFjQ-AhG-Lff1ODy3lbzrXW7L7HsPdbN/exec"; 

const PIX_KEY = '97427455-6f14-4aba-aa09-d1cb15de34d4';
const PIX_NOME = 'Guilherme de Siqueira Silveira';
const PIX_CIDADE = 'Jacarei';
const PIX_POINT_OF_INIT = '12';

/* =========================================================== */
window.presentes = [];

async function carregarPresentes() {
    const container = document.getElementById('lista') || document.getElementById('listaPresentes');
    
    try {
        if(container) container.innerHTML = '<div style="text-align:center; padding:40px;">Carregando lista atualizada...</div>';
        
        const resposta = await fetch(GOOGLE_SCRIPT_URL);
        const dados = await resposta.json();

        window.presentes = dados.map(item => ({
            id: item.id,
            nome: item.nome,
            descricao: item.descricao,
            categoria: item.categoria,
            preco: Number(item.preco),
            img: item.img || "img/presentes/placeholder.jpg",
            link: item.descricao,
            endereco: "Rua Araxá, 316, Passos - MG",
            status: item.status || "Disponível"
        }));

        if (typeof inicializarInterface === "function") inicializarInterface();
        else {
             populateCategoriaSelect();
             applyFilterSortView();
        }

    } catch (erro) {
        try {
            const resp = await fetch("presentes.json");
            window.presentes = await resp.json();
            populateCategoriaSelect();
            applyFilterSortView();
        } catch(e) {
            if(container) container.innerHTML = '<p>Erro ao carregar presentes.</p>';
        }
    }
}

carregarPresentes();

/* =========================================================== */
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
  const payload = f('00','01') + f('01', pointOfInit) + merchantAccount + f('52','0000') + f('53','986') +
                  (valor ? f('54', Number(valor).toFixed(2)) : '') +
                  f('58','BR') + f('59', nome.slice(0,25)) + f('60', cidade.slice(0,15)) +
                  (txid ? f('62', f('05', txid)) : '') + '6304';
  return payload + crc16(payload);
}

/* =========================================================== */
function $(id){ return document.getElementById(id); }

/* =========================================================== */
/* ===== NOVA FUNÇÃO CENTRAL (REUTILIZADA) ===== */
function confirmarPagamento(present, valor, txid){
  const nome = $('nomePresenteModal').value.trim() || 'Anônimo';
  const msg = $('telefonePresenteModal').value.trim() || '';

  const btn = document.activeElement;
  if(btn){
    btn.innerText = "Registrando...";
    btn.disabled = true;
  }

  const payload = {
      action: "contribuir",
      txid,
      presenteId: present.id,
      presenteNome: present.nome,
      valor,
      nomeDoador: nome,
      msg
  };

  fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
  }).then(() => {
      alert(`Obrigado, ${nome}! Sua contribuição foi registrada com sucesso.`);
      $('modalPresenteBg').style.display='none';
      carregarPresentes();
  }).catch(() => {
      alert('Erro ao registrar. Se você fez o PIX, está tudo certo!');
      $('modalPresenteBg').style.display='none';
  });
}

/* =========================================================== */
function openPresentModal(p){
  const bg = ensureModalExists();
  const box = $('modalPresenteContent');

  box.innerHTML = `
    <div class="modal-header">
      <h3>${escapeHtml(p.nome)}</h3>
      <button class="btn-close" id="closeModal">✕</button>
    </div>

    <div class="modal-body-grid">
      <div class="col-visual">
        <div class="img-container">
           <img src="${p.img}">
        </div>
        <p><a href="${p.descricao}" target="_blank">Ver produto</a></p>
      </div>

      <div class="col-form">
        <input id="valorPresenteModal" type="number" value="${p.preco.toFixed(2)}">
        <input id="nomePresenteModal" placeholder="Seu nome">
        <textarea id="telefonePresenteModal"></textarea>

        <button class="btn-action" id="gerarPixBtn">Gerar QR PIX</button>

        <!-- NOVO BOTÃO -->
        <button class="btn" id="confirmarAntesPix" style="margin-top:10px; background:#2ecc71;">
          Confirmar Pagamento
        </button>

        <div id="pixAreaModal" style="display:none;"></div>
      </div>
    </div>
  `;

  bg.style.display='flex';
  $('closeModal').onclick = ()=> bg.style.display='none';

  // BOTÃO NOVO
  $('confirmarAntesPix').onclick = () => {
    const val = Number($('valorPresenteModal').value);
    if(!val || val <= 0) return alert('Valor inválido');
    const txid = 'PRES' + Math.floor(Math.random() * 100000);
    confirmarPagamento(p, val, txid);
  };

  // BOTÃO PIX
  $('gerarPixBtn').onclick = () => {
    const val = Number($('valorPresenteModal').value);
    if(!val || val <= 0) return alert('Valor inválido');
    generateAndShowBRCode(p, val);
  };
}

/* =========================================================== */
function generateAndShowBRCode(present, valor){
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
  $('gerarPixBtn').style.display='none';

  pix.innerHTML = `
    <div id="qrHolder"></div>
    <button id="confirmarContrib">Confirmar Pagamento</button>
  `;

  new QRCode($('qrHolder'), { text: brcode, width: 200, height: 200 });

  // REUTILIZA A MESMA FUNÇÃO
  $('confirmarContrib').onclick = () => confirmarPagamento(present, valor, txid);
}

/* =========================================================== */
function ensureModalExists(){
  let bg = $('modalPresenteBg');
  if(bg) return bg;
  bg = document.createElement('div');
  bg.id = 'modalPresenteBg';
  bg.innerHTML = `<div id="modalPresenteContent"></div>`;
  document.body.appendChild(bg);
  return bg;
}

function abrirModalPresenteById(id){
  const p = window.presentes.find(x=>x.id==id);
  if(p) openPresentModal(p);
}

function escapeHtml(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
