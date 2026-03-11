const SCRIPT_URL="COLE_SEU_SCRIPT";

function abrirModal(){

document.getElementById("modalRSVP").style.display="flex";

}

function fecharModal(){

document.getElementById("modalRSVP").style.display="none";

}

async function enviarRSVP(){

const dados={

action:"rsvp",

nome:document.getElementById("nome").value,

telefone:document.getElementById("telefone").value,

acompanhantes:document.getElementById("nomes").value,

presenca:document.getElementById("presenca").value

};

await fetch(SCRIPT_URL,{

method:"POST",

mode:"no-cors",

body:JSON.stringify(dados)

});

alert("Confirmação enviada!");

fecharModal();

}
