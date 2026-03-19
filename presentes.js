/* presentes.js — VERSÃO FINAL FUNCIONAL */

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxM-JD679gNUBK6wKLvsPPT-BVPReGqg2t5AXpeC-sdiXoBKitU6qwlF0-6cB88SdaE/exec"; 

const PIX_KEY = '97427455-6f14-4aba-aa09-d1cb15de34d4';
const PIX_NOME = 'Guilherme de Siqueira Silveira';
const PIX_CIDADE = 'Jacarei';
const PIX_POINT_OF_INIT = '12';

window.presentes = [];

/* ================= LOAD ================= */
async function carregarPresentes() {
    const container = document.getElementById('lista');

    try {
        if(container) container.innerHTML = 'Carregando...';

        const resposta = await fetch(GOOGLE_SCRIPT_URL);
        const dados = await resposta.json();

        window.presentes = dados.map(item => ({
            id: item.id,
            nome: item.nome,
            descricao: item.descricao,
            categoria: item.categoria,
            preco: Number(item.preco),
            img: item.img || "img/presentes/placeholder.jpg",
            endereco: "Rua Araxá, 316",
            status: item.status || "Disponível"
        }));

        populateCategoriaSelect();
        applyFilterSortView();

    } catch (e) {
        console.error(e);
        container.innerHTML = "Erro ao carregar";
    }
}

carregarPresentes();

/* ================= UI ================= */
function $(id){ return document.getElementById(id); }

function populateCategoriaSelect(){
  const sel = $('filtroCategoria');
  if(!sel) return;
  const cats = [...new Set(window.presentes.map(p=>p.categoria))];
  sel.innerHTML = '<option value="">Todas</option>' + cats.map(c=>`<option>${c}</option>`).join('');
}

function renderList(items){
  const container = $('lista');
  container.innerHTML = '';

  items.forEach(p=>{
    const isReservado = p.status !== "Disponível";

    const d = document.createElement('div');
    d.className = 'item';
    if(isReservado) d.style.opacity = 0.5;

    d.innerHTML = `
      <div class="img-square"><img src="${p.img}"></div>
      <h4>${p.nome}</h4>
      <p class="price">R$ ${p.preco.toFixed(2)}</p>
      <div class="actions">
        <button class="btn" ${isReservado ? 'disabled' : ''}>${isReservado ? 'Reservado' : 'Presentear'}</button>
      </div>
    `;

    if(!isReservado){
      d.querySelector('button').onclick = ()=> abrirModal(p);
    }

    container.appendChild(d);
  });
}

function applyFilterSortView(){
  renderList(window.presentes);
}

/* ================= MODAL ================= */
function abrirModal(p){
  const bg = document.getElementById('modalPresenteBg');
  const box = document.getElementById('modalPresenteContent');

  box.innerHTML = `
    <h3>${p.nome}</h3>

    <input id="nome" placeholder="Seu nome">

    <button id="pixBtn" class="btn">Gerar PIX</button>
    <button id="compradoBtn" class="btn-ghost">Já comprei</button>

    <div id="pixArea"></div>
  `;

  bg.style.display = 'flex';

  document.getElementById('pixBtn').onclick = ()=> gerarPix(p);
  document.getElementById('compradoBtn').onclick = ()=> marcarComoComprado(p);
}

/* ================= PIX ================= */
function gerarPix(p){
  document.getElementById('pixArea').innerHTML = `
    <p>Simulação PIX gerado</p>
    <button id="confirmar">Confirmar Pagamento</button>
  `;

  document.getElementById('confirmar').onclick = ()=> enviar({
    action: "contribuir",
    presenteId: p.id,
    nome: document.getElementById('nome').value || "Anonimo"
  });
}

/* ================= COMPRADO ================= */
function marcarComoComprado(p){
  enviar({
    action: "reservar",
    presenteId: p.id,
    nome: document.getElementById('nome').value || "Convidado"
  });
}

/* ================= ENVIO ================= */
function enviar(payload){
  fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(res => res.text())
  .then(() => {
    alert("Registrado com sucesso!");
    document.getElementById('modalPresenteBg').style.display = 'none';
    carregarPresentes();
  })
  .catch(err => {
    console.error(err);
    alert("Erro ao registrar");
  });
}
