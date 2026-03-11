const SCRIPT_URL = "COLE_AQUI_SEU_SCRIPT";

let presentes = [];


async function carregarPresentes(){

try{

const res = await fetch(SCRIPT_URL + "?t=" + Date.now());

presentes = await res.json();

renderizar();

}

catch(e){

console.log("Erro planilha, carregando backup");

const res = await fetch("presentes.json");

presentes = await res.json();

renderizar();

}

}


function renderizar(){

const lista = document.getElementById("lista");

lista.innerHTML="";

presentes.forEach(p=>{

if(p.status==="Reservado") return;

const div=document.createElement("div");

div.className="item";

div.innerHTML=`

<h3>${p.nome}</h3>

<p>R$ ${p.preco}</p>

`;

div.onclick=()=>abrirModal(p);

lista.appendChild(div);

});

}


function abrirModal(p){

document.getElementById("modal").style.display="flex";

document.getElementById("tituloPresente").innerText=p.nome;

document.getElementById("descricaoPresente").innerText=p.descricao;

document.getElementById("valorPresente").innerText="Valor: R$ "+p.preco;

document.getElementById("btnLoja").href=p.link||"#";


document.getElementById("btnPix").onclick=()=>gerarPix(p);

}


function fecharModal(){

document.getElementById("modal").style.display="none";

}


function gerarPix(p){

document.getElementById("qrcode").innerHTML="";

new QRCode(document.getElementById("qrcode"),{

text:"pix@email.com",

width:200,

height:200

});

}


document.addEventListener("keydown",e=>{

if(e.ctrlKey && e.shiftKey && e.key==="G"){

const senha=prompt("Painel dos noivos");

if(senha==="09052026"){

alert("Abrir painel admin futuramente");

}

}

});


carregarPresentes();
