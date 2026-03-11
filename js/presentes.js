let presentes=[];

async function carregarPresentes(){

try{

const resp=await fetch("data/presentes.json");

presentes=await resp.json();

renderizar();

}

catch(e){

console.log(e);

}

}

function renderizar(){

const lista=document.getElementById("lista");

lista.innerHTML="";

presentes.forEach(p=>{

const card=document.createElement("div");

card.className="card";

card.innerHTML=`

<h3>${p.nome}</h3>

<p>R$ ${p.preco}</p>

<button onclick="abrirModal(${p.id})">Presentear</button>

`;

lista.appendChild(card);

});

}

function abrirModal(id){

const p=presentes.find(x=>x.id==id);

document.getElementById("modal").style.display="flex";

document.getElementById("titulo").innerText=p.nome;

document.getElementById("valor").innerText="R$ "+p.preco;

document.getElementById("btnLoja").href=p.link||"#";

new QRCode(document.getElementById("qrcode"),{

text:"SEU_PIX",

width:200,

height:200

});

}

function fecharModal(){

document.getElementById("modal").style.display="none";

}

carregarPresentes();
