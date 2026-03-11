const SCRIPT_URL = "SEU_SCRIPT_AQUI";

let presentes = [];

async function carregarPresentes(){

try{

const resp = await fetch(SCRIPT_URL + "?t=" + Date.now());

if(!resp.ok) throw new Error("Erro API");

presentes = await resp.json();

renderizar();

}
catch(e){

console.warn("Erro API — carregando backup");

const resp = await fetch("data/presentes.json");

presentes = await resp.json();

renderizar();

}

}


function renderizar(){

const lista = document.getElementById("lista");

lista.innerHTML="";

presentes.forEach(p=>{

if(p.status==="Reservado") return;

const card = document.createElement("div");

card.className="card-presente";

card.innerHTML=`

<h3>${p.nome}</h3>

<p class="preco">R$ ${p.preco}</p>

<button onclick="abrirModal(${p.id})">
Presentear
</button>

${p.link ? `
<a href="${p.link}" target="_blank" class="btn-loja">
Comprar na loja
</a>
` : ``}

`;

lista.appendChild(card);

});

}


function abrirModal(id){

const presente = presentes.find(p=>p.id==id);

if(!presente) return;

if(presente.status==="Reservado"){

alert("Este presente já foi escolhido.");

return;

}

mostrarModal(presente);

}


function mostrarModal(p){

document.getElementById("modal").style.display="flex";

document.getElementById("titulo").innerText=p.nome;

document.getElementById("valor").innerText="R$ "+p.preco;

gerarQR(p);

}


function gerarQR(p){

const qrcodeDiv = document.getElementById("qrcode");

qrcodeDiv.innerHTML="";

new QRCode(qrcodeDiv,{

text:"SEU_PIX_AQUI",

width:220,

height:220

});

}


function fecharModal(){

document.getElementById("modal").style.display="none";

}

carregarPresentes();
