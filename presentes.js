// ============================
//  CARREGAR LISTA DE PRESENTES 
// ============================

let PRESENTES = [];

// Carrega automaticamente o arquivo presentes.json
async function carregarPresentes() {
    try {
        const response = await fetch("presentes.json");
        PRESENTES = await response.json();
        inicializarInterface();
    } catch (e) {
        console.error("Erro ao carregar presentes.json", e, response);
        document.getElementById("lista").innerHTML =
            "<p style='padding:20px'>Erro ao carregar a lista de presentes.</p>";
    }
}

// Chama na inicialização da página
carregarPresentes();


// ============================
//  INTERFACE (FILTRO + ORDEM)
// ============================

function inicializarInterface() {
    preencherCategorias();
    renderizarLista(PRESENTES);
    ativarEventos();
}

function preencherCategorias() {
    const select = document.getElementById("filtroCategoria");

    const categorias = [...new Set(PRESENTES.map(p => p.categoria))].sort();

    select.innerHTML = `<option value="">Todas</option>`
        + categorias.map(c => `<option value="${c}">${c}</option>`).join("");
}

function ativarEventos() {
    document.getElementById("filtroCategoria").addEventListener("change", aplicarFiltros);
    document.getElementById("ordenar").addEventListener("change", aplicarFiltros);
    document.getElementById("viewToggle").addEventListener("change", aplicarFiltros);
}

function aplicarFiltros() {
    const categoria = document.getElementById("filtroCategoria").value;
    const order = document.getElementById("ordenar").value;
    const view = document.getElementById("viewToggle").value;

    let lista = [...PRESENTES];

    if (categoria) {
        lista = lista.filter(p => p.categoria === categoria);
    }

    // Ordenação
    if (order === "preco_asc") lista.sort((a, b) => a.preco - b.preco);
    if (order === "preco_desc") lista.sort((a, b) => b.preco - a.preco);
    if (order === "nome_asc") lista.sort((a, b) => a.nome.localeCompare(b.nome));
    if (order === "nome_desc") lista.sort((a, b) => b.nome.localeCompare(a.nome));

    renderizarLista(lista, view);
}


// ============================
//  RENDERIZAÇÃO LISTA
// ============================

function renderizarLista(itens, view = "grid") {
    const lista = document.getElementById("lista");

    lista.className = view === "lista" ? "lista" : "grid";

    if (view === "lista") {
        // Modo lista (sem imagens)
        lista.innerHTML = itens.map(p => `
          <div class="item-lista">
            <div>
              <h3>${p.nome}</h3>
              <p class="categoria">${p.categoria}</p>
              <p class="preco">R$ ${p.preco.toFixed(2)}</p>
            </div>
            <button class="btn ver" onclick="abrirModal(${p.id})">Ver</button>
          </div>
        `).join("");
        return;
    }

    // Modo GRID (com imagens)
    lista.innerHTML = itens.map(p => `
      <div class="item">
        <div class="img-wrap">
          <img src="${p.img || p.imagem}" alt="${p.nome}">
        </div>
        <h3>${p.nome}</h3>
        <p class="preco">R$ ${p.preco.toFixed(2)}</p>
        <button class="btn ver" onclick="abrirModal(${p.id})">Ver</button>
      </div>
    `).join("");
}


// ============================
//  MODAL DE PRESENTE
// ============================

function abrirModal(id) {
    const p = PRESENTES.find(x => x.id === id);
    const modal = document.getElementById("modalPresenteContent");

    modal.innerHTML = `
      <button class="modal-close" onclick="fecharModal()">✕</button>

      <div class="modal-header">
        <div class="modal-img">
          <img src="${p.img || p.imagem}" alt="${p.nome}">
        </div>
        <div class="modal-info">
          <h2 id="modalTitulo">${p.nome}</h2>
          <p class="preco">R$ ${p.preco.toFixed(2)}</p>
          <p>${p.descricao}</p>
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn pix" onclick="gerarPix(${p.id})">Presentear via PIX</button>
      </div>

      <div id="pixArea"></div>
    `;

    document.getElementById("modalPresenteBg").classList.remove("hidden");
}

function fecharModal() {
    document.getElementById("modalPresenteBg").classList.add("hidden");
    document.getElementById("pixArea").innerHTML = "";
}


// ============================
//  PIX COPIA E COLA + QRCODE
// ============================

function gerarPix(id) {
    const p = PRESENTES.find(x => x.id === id);
    const valor = p.preco.toFixed(2);

    const chave = "97427455-6f14-4aba-aa09-d1cb15de34d4";
    const nome = "GUILHERME SILVEIRA";
    const cidade = "PASSOS";
    const txid = "GIFT" + id;

    function limpar(s) {
        return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    const payload =
        "000201" +
        "010212" +
        "26" + (4 + chave.length).toString().padStart(2, "0") +
        "0014BR.GOV.BCB.PIX" +
        chave.length.toString().padStart(2, "0") + chave +
        "52040000" +
        "5303986" +
        "54" + valor.length.toString().padStart(2, "0") + valor +
        "5802BR" +
        "59" + limpar(nome).length.toString().padStart(2, "0") + limpar(nome) +
        "60" + cidade.length.toString().padStart(2, "0") + cidade +
        "62" + (4 + txid.length).toString().padStart(2, "0") +
        "05" + txid.length.toString().padStart(2, "0") + txid +
        "6304";

    function crc16(str) {
        let crc = 0xffff;
        for (let i = 0; i < str.length; i++) {
            crc ^= str.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
                if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
                else crc <<= 1;
                crc &= 0xffff;
            }
        }
        return crc.toString(16).toUpperCase().padStart(4, "0");
    }

    const brcode = payload + crc16(payload);

    const area = document.getElementById("pixArea");

    area.innerHTML = `
      <h3>Código PIX</h3>
      <div id="qrcode"></div>

      <textarea readonly class="pix-code">${brcode}</textarea>
      <button class="btn copiar" onclick="copiarPix()">Copiar código</button>
    `;

    new QRCode(document.getElementById("qrcode"), {
        text: brcode,
        width: 260,
        height: 260
    });
}

function copiarPix() {
    const textarea = document.querySelector(".pix-code");
    textarea.select();
    document.execCommand("copy");
    alert("Código PIX copiado!");
}
