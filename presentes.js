const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxM-JD679gNUBK6wKLvsPPT-BVPReGqg2t5AXpeC-sdiXoBKitU6qwlF0-6cB88SdaE/exec";

window.presentes = [];

/* ================= LOAD ================= */
async function carregarPresentes() {
    const res = await fetch(GOOGLE_SCRIPT_URL + "?t=" + Date.now());
    const dados = await res.json();

    window.presentes = dados.map(p => ({
        id: p.id,
        nome: p.nome,
        preco: Number(p.preco),
        img: p.img,
        status: p.status || "Disponível"
    }));

    renderList();
}

carregarPresentes();

/* ================= UI ================= */
function renderList(){
    const container = document.getElementById('lista');
    container.innerHTML = '';

    window.presentes.forEach(p => {
        const reservado = String(p.status).toLowerCase().trim() !== "disponível";

        const div = document.createElement('div');
        div.className = 'item';

        div.innerHTML = `
            <img src="${p.img}">
            <h4>${p.nome}</h4>
            <p>R$ ${p.preco.toFixed(2)}</p>
            <button ${reservado ? 'disabled' : ''}>
                ${reservado ? 'Reservado' : 'Presentear'}
            </button>
        `;

        if(!reservado){
            div.querySelector('button').onclick = ()=> abrirModal(p);
        }

        container.appendChild(div);
    });
}

/* ================= MODAL ================= */
function abrirModal(p){
    const bg = document.getElementById('modalPresenteBg');
    const box = document.getElementById('modalPresenteContent');

    box.innerHTML = `
        <h3>${p.nome}</h3>

        <input id="nome" placeholder="Seu nome">

        <button id="pixBtn">Gerar PIX</button>
        <button id="compradoBtn">Já comprei</button>

        <div id="pixArea"></div>
    `;

    bg.style.display = 'flex';

    document.getElementById('pixBtn').onclick = ()=> gerarPix(p);
    document.getElementById('compradoBtn').onclick = ()=> marcarComoComprado(p);
}

/* ================= PIX ================= */
function gerarPix(p){
    document.getElementById('pixArea').innerHTML = `
        <p>PIX gerado</p>
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
    .then(async res => {
        const txt = await res.text();
        console.log("Resposta do script:", txt);
        
        alert("Registrado!");
        document.getElementById('modalPresenteBg').style.display = 'none';
        carregarPresentes();
    })
    .catch(err => {
        console.error("Erro real:", err);
        alert("Erro ao registrar");
    });
}
