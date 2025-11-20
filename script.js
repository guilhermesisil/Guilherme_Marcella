// Countdown
function atualizarCountdown() {
    const destino = new Date("2026-05-09T00:00:00").getTime();
    const agora = new Date().getTime();
    const diff = destino - agora;

    if (diff < 0) return;

    document.getElementById("dias").innerText = Math.floor(diff / (1000*60*60*24));
    document.getElementById("horas").innerText = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
    document.getElementById("minutos").innerText = Math.floor((diff % (1000*60*60)) / (1000*60));
    document.getElementById("segundos").innerText = Math.floor((diff % (1000*60)) / 1000);
}
setInterval(atualizarCountdown, 1000);

// Load gifts
fetch('presentes.json')
.then(r=>r.json())
.then(data=>{
    let container = document.getElementById("lista-presentes");
    data.forEach(p=>{
        let div=document.createElement("div");
        div.className="item";
        div.innerHTML = `
            <img src="${p.imagem}" width="200"><h4>${p.nome}</h4>
            <button onclick="abrirModal('${p.id}')">${p.status==='disponivel'?'Presentear':'Já presenteado'}</button>`;
        container.appendChild(div);
    });
});

// Modal
function abrirModal(id){
    fetch('presentes.json').then(r=>r.json()).then(lista=>{
        let p = lista.find(x=>x.id===id);
        modal.classList.remove("hidden");
        modalImg.src = p.imagem;
        modalNome.innerText = p.nome;
        modalDesc.innerText = p.descricao;
        modalLink.href = p.link;
        modalEnd.innerText = p.enderecoEntrega;
    });
}
closeModal.onclick=()=>modal.classList.add("hidden");
