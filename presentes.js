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
        console.error("Erro ao carregar presentes.json", e);
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

window.presentes = [
  {
    id: 1,
    nome: "Conjunto de Panelas Antiaderentes",
    preco: 329.90,
    categoria: "Cozinha",
    imagem: "img/presente1.jpg",
    descricao: "Conjunto premium com revestimento triplo e tampas de vidro temperado.",
    status: "disponivel"
  },
  
  {
    id: 2,
    nome: "Kit Facas de Chef Inoxidáveis",
    preco: 189.00,
    categoria: "Cozinha",
    imagem: "img/presente2.jpg",
    descricao: "Jogo de facas profissionais de aço inox com suporte.",
    status: "disponivel"
  },
  {
    id: 3,
    nome: "Airfryer 5L Premium",
    preco: 499.99,
    categoria: "Eletrodomésticos",
    imagem: "img/presente3.jpg",
    descricao: "Fritadeira elétrica sem óleo com controle digital.",
    status: "disponivel"
  },
  {
    id: 4,
    nome: "Liquidificador Turbo 1200W",
    preco: 239.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente4.jpg",
    descricao: "Alta potência, copo reforçado e 12 velocidades.",
    status: "disponivel"
  },
  {
    id: 5,
    nome: "Jogo de Toalhas Egípcias Luxo",
    preco: 199.00,
    categoria: "Casa & Banho",
    imagem: "img/presente5.jpg",
    descricao: "Toalhas premium 100% algodão egípcio ultra macio.",
    status: "disponivel"
  },
  {
    id: 6,
    nome: "Edredom Casal 300 Fios",
    preco: 359.90,
    categoria: "Quarto",
    imagem: "img/presente6.jpg",
    descricao: "Ultra macio, dupla face e antialérgico.",
    status: "disponivel"
  },
  {
    id: 7,
    nome: "Kit Organizadores de Gaveta",
    preco: 79.90,
    categoria: "Casa",
    imagem: "img/presente7.jpg",
    descricao: "Organizadores dobráveis para roupas e acessórios.",
    status: "disponivel"
  },
  {
    id: 8,
    nome: "Jogo de Copos de Cristal",
    preco: 149.00,
    categoria: "Cozinha",
    imagem: "img/presente8.jpg",
    descricao: "Conjunto de 6 copos cristalinos resistentes.",
    status: "disponivel"
  },
  {
    id: 9,
    nome: "Aspirador Vertical 2 em 1",
    preco: 299.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente9.jpg",
    descricao: "Aspirador portátil e vertical com alta sucção.",
    status: "disponivel"
  },
  {
    id: 10,
    nome: "Mixer 3 em 1",
    preco: 179.00,
    categoria: "Cozinha",
    imagem: "img/presente10.jpg",
    descricao: "Mixer + triturador + fuê. Leve e silencioso.",
    status: "disponivel"
  },
  {
    id: 11,
    nome: "Jogo Americano de Mesa (6 unidades)",
    preco: 89.90,
    categoria: "Cozinha",
    imagem: "img/presente11.jpg",
    descricao: "Conjunto de jogos americanos texturizados.",
    status: "disponivel"
  },
  {
    id: 12,
    nome: "Sanduicheira Inox",
    preco: 129.00,
    categoria: "Cozinha",
    imagem: "img/presente12.jpg",
    descricao: "Placas antiaderentes e aquecimento rápido.",
    status: "disponivel"
  },
  {
    id: 13,
    nome: "Cafeteira Elétrica 30 Xícaras",
    preco: 149.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente13.jpg",
    descricao: "Cafeteira compacta, filtro permanente, mantém aquecido.",
    status: "disponivel"
  },
  {
    id: 14,
    nome: "Jogo de Pratos Brancos (24 peças)",
    preco: 249.90,
    categoria: "Cozinha",
    imagem: "img/presente14.jpg",
    descricao: "Aparelho de jantar clean e elegante.",
    status: "disponivel"
  },
  {
    id: 15,
    nome: "Panela de Pressão Inox 6L",
    preco: 229.90,
    categoria: "Cozinha",
    imagem: "img/presente15.jpg",
    descricao: "Segurança tripla e aço inoxidável.",
    status: "disponivel"
  },
  {
    id: 16,
    nome: "Organizador Multiuso para Cozinha",
    preco: 59.90,
    categoria: "Cozinha",
    imagem: "img/presente16.jpg",
    descricao: "Organizador metálico empilhável.",
    status: "disponivel"
  },
  {
    id: 17,
    nome: "Jogo de Lençol Casal 200 Fios",
    preco: 159.00,
    categoria: "Quarto",
    imagem: "img/presente17.jpg",
    descricao: "Lençóis com toque macio e alta durabilidade.",
    status: "disponivel"
  },
  {
    id: 18,
    nome: "Aquecedor Portátil Cerâmico",
    preco: 199.00,
    categoria: "Casa",
    imagem: "img/presente18.jpg",
    descricao: "Aquecimento rápido e silencioso.",
    status: "disponivel"
  },
  {
    id: 19,
    nome: "Ventilador de Mesa 40cm",
    preco: 189.90,
    categoria: "Casa",
    imagem: "img/presente19.jpg",
    descricao: "Ventilação potente com baixo ruído.",
    status: "disponivel"
  },
  {
    id: 20,
    nome: "Jogo de Panelinhas Cerâmicas",
    preco: 219.90,
    categoria: "Cozinha",
    imagem: "img/presente20.jpg",
    descricao: "Mini panelas charmosas para servir.",
    status: "disponivel"
  },
  {
    id: 21,
    nome: "Kit Churrasco Inox 12 peças",
    preco: 139.90,
    categoria: "Cozinha",
    imagem: "img/presente21.jpg",
    descricao: "Jogo completo para churrascos especiais.",
    status: "disponivel"
  },
  {
    id: 22,
    nome: "Aparelho de Fondue",
    preco: 129.90,
    categoria: "Cozinha",
    imagem: "img/presente22.jpg",
    descricao: "Conjunto para fondue doce e salgado.",
    status: "disponivel"
  },
  {
    id: 23,
    nome: "Batedeira Planetária Premium",
    preco: 499.00,
    categoria: "Eletrodomésticos",
    imagem: "img/presente23.jpg",
    descricao: "Alta potência, planetária real e 3 batedores.",
    status: "disponivel"
  },
  {
    id: 24,
    nome: "Aspirador Robô Inteligente",
    preco: 899.00,
    categoria: "Eletrodomésticos",
    imagem: "img/presente24.jpg",
    descricao: "Mapeamento inteligente e recarga automática.",
    status: "disponivel"
  },
  {
    id: 25,
    nome: "Jogo de Bowls de Vidro",
    preco: 89.90,
    categoria: "Cozinha",
    imagem: "img/presente25.jpg",
    descricao: "Conjunto com 5 bowls de vidro temperado.",
    status: "disponivel"
  },
  {
    id: 26,
    nome: "Kit Spa Toalhas + Pantufas",
    preco: 129.90,
    categoria: "Casa & Banho",
    imagem: "img/presente26.jpg",
    descricao: "Conjunto macio e super confortável.",
    status: "disponivel"
  },
  {
    id: 27,
    nome: "Travesseiro Nasa Viscoelástico",
    preco: 99.90,
    categoria: "Quarto",
    imagem: "img/presente27.jpg",
    descricao: "Molda perfeitamente ao pescoço.",
    status: "disponivel"
  },
  {
    id: 28,
    nome: "Ferro de Passar a Vapor",
    preco: 159.00,
    categoria: "Eletrodomésticos",
    imagem: "img/presente28.jpg",
    descricao: "Pronto para uso rápido e vapor contínuo.",
    status: "disponivel"
  },
  {
    id: 29,
    nome: "Kit Toalhas de Cozinha (8 unidades)",
    preco: 49.90,
    categoria: "Cozinha",
    imagem: "img/presente29.jpg",
    descricao: "Toalhas absorventes, resistentes e estilosas.",
    status: "disponivel"
  },
  {
    id: 30,
    nome: "Relógio de Parede Minimalista",
    preco: 89.90,
    categoria: "Casa",
    imagem: "img/presente30.jpg",
    descricao: "Design clean com ponteiros silenciosos.",
    status: "disponivel"
  },
  {
    id: 31,
    nome: "Kit Utensílios de Silicone (10 peças)",
    preco: 119.90,
    categoria: "Cozinha",
    imagem: "img/presente31.jpg",
    descricao: "Utensílios resistentes ao calor com cabo em madeira.",
    status: "disponivel"
  },
  {
    id: 32,
    nome: "Jogo de Taças para Vinho (6 unidades)",
    preco: 159.90,
    categoria: "Cozinha",
    imagem: "img/presente32.jpg",
    descricao: "Taças elegantes para vinhos tinto e branco.",
    status: "disponivel"
  },
  {
    id: 33,
    nome: "Frigideira Grande Antiaderente",
    preco: 99.90,
    categoria: "Cozinha",
    imagem: "img/presente33.jpg",
    descricao: "Perfeita para grelhados, revestimento premium.",
    status: "disponivel"
  },
  {
    id: 34,
    nome: "Grill Elétrico Inox",
    preco: 229.90,
    categoria: "Cozinha",
    imagem: "img/presente34.jpg",
    descricao: "Grelha carnes, legumes e sanduíches.",
    status: "disponivel"
  },
  {
    id: 35,
    nome: "Torradeira Inox 7 Níveis",
    preco: 149.90,
    categoria: "Cozinha",
    imagem: "img/presente35.jpg",
    descricao: "Design moderno e controle preciso de tostagem.",
    status: "disponivel"
  },
  {
    id: 36,
    nome: "Aspirador de Pó Sem Fio",
    preco: 799.00,
    categoria: "Eletrodomésticos",
    imagem: "img/presente36.jpg",
    descricao: "Alta potência, leve e 40 min de autonomia.",
    status: "disponivel"
  },
  {
    id: 37,
    nome: "Purificador de Água",
    preco: 949.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente37.jpg",
    descricao: "Água gelada e natural com tripla filtragem.",
    status: "disponivel"
  },
  {
    id: 38,
    nome: "Umidificador de Ar",
    preco: 159.90,
    categoria: "Casa",
    imagem: "img/presente38.jpg",
    descricao: "Ultra silencioso, ideal para noites secas.",
    status: "disponivel"
  },
  {
    id: 39,
    nome: "Conjunto Aromatizador + Difusor",
    preco: 89.90,
    categoria: "Casa",
    imagem: "img/presente39.jpg",
    descricao: "Perfuma o ambiente com fragrância duradoura.",
    status: "disponivel"
  },
  {
    id: 40,
    nome: "Tapete Sala 2x1,5m",
    preco: 349.90,
    categoria: "Casa",
    imagem: "img/presente40.jpg",
    descricao: "Tapete macio com textura premium.",
    status: "disponivel"
  },
  {
    id: 41,
    nome: "Escorredor de Louça Inox",
    preco: 139.90,
    categoria: "Cozinha",
    imagem: "img/presente41.jpg",
    descricao: "Resistente à corrosão, moderno e prático.",
    status: "disponivel"
  },
  {
    id: 42,
    nome: "Panela Wok Antiaderente",
    preco: 149.90,
    categoria: "Cozinha",
    imagem: "img/presente42.jpg",
    descricao: "Ideal para receitas orientais.",
    status: "disponivel"
  },
  {
    id: 43,
    nome: "Jogo de Travessas de Vidro (3 unidades)",
    preco: 119.90,
    categoria: "Cozinha",
    imagem: "img/presente43.jpg",
    descricao: "Travessas refratárias resistentes.",
    status: "disponivel"
  },
  {
    id: 44,
    nome: "Chaleira Elétrica Inox",
    preco: 139.90,
    categoria: "Cozinha",
    imagem: "img/presente44.jpg",
    descricao: "Ferve água em segundos.",
    status: "disponivel"
  },
  {
    id: 45,
    nome: "Tábua de Corte Bambu",
    preco: 79.90,
    categoria: "Cozinha",
    imagem: "img/presente45.jpg",
    descricao: "Antibacteriana e resistente.",
    status: "disponivel"
  },
  {
    id: 46,
    nome: "Kit Bar (Coqueteleira + Utensílios)",
    preco: 149.90,
    categoria: "Cozinha",
    imagem: "img/presente46.jpg",
    descricao: "Perfeito para preparar drinks.",
    status: "disponivel"
  },
  {
    id: 47,
    nome: "Secador de Cabelos Profissional",
    preco: 199.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente47.jpg",
    descricao: "Potente e silencioso com controle de temperatura.",
    status: "disponivel"
  },
  {
    id: 48,
    nome: "Barbeador Elétrico",
    preco: 169.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente48.jpg",
    descricao: "Aparelho ergonômico com lâminas flutuantes.",
    status: "disponivel"
  },
  {
    id: 49,
    nome: "Kit Ferramentas Completo 129 peças",
    preco: 259.90,
    categoria: "Casa",
    imagem: "img/presente49.jpg",
    descricao: "Maleta com diversas ferramentas essenciais.",
    status: "disponivel"
  },
  {
    id: 50,
    nome: "Jogo de Cabides Madeira Premium (20 unidades)",
    preco: 139.90,
    categoria: "Casa",
    imagem: "img/presente50.jpg",
    descricao: "Cabides reforçados com design elegante.",
    status: "disponivel"
  },
  {
    id: 51,
    nome: "Roteador Wi-Fi de Alta Performance",
    preco: 239.90,
    categoria: "Casa",
    imagem: "img/presente51.jpg",
    descricao: "Wi-Fi rápido com longo alcance.",
    status: "disponivel"
  },
  {
    id: 52,
    nome: "Caixa de Som Bluetooth",
    preco: 159.90,
    categoria: "Casa",
    imagem: "img/presente52.jpg",
    descricao: "Som potente e bateria duradoura.",
    status: "disponivel"
  },
  {
    id: 53,
    nome: "Cortina Blackout Casal",
    preco: 179.90,
    categoria: "Quarto",
    imagem: "img/presente53.jpg",
    descricao: "Bloqueia luz e reduz ruído.",
    status: "disponivel"
  },
  {
    id: 54,
    nome: "Travesseiro de Plumas Sintéticas",
    preco: 89.90,
    categoria: "Quarto",
    imagem: "img/presente54.jpg",
    descricao: "Macio e confortável para noites tranquilas.",
    status: "disponivel"
  },
  {
    id: 55,
    nome: "Cobertor Sherpa Ultra Macio",
    preco: 199.00,
    categoria: "Quarto",
    imagem: "img/presente55.jpg",
    descricao: "Conforto máximo para o inverno.",
    status: "disponivel"
  },
  {
    id: 56,
    nome: "Conjunto Decorativo de Parede",
    preco: 129.90,
    categoria: "Casa",
    imagem: "img/presente56.jpg",
    descricao: "Quadros minimalistas modernos.",
    status: "disponivel"
  },
  {
    id: 57,
    nome: "Luminária LED Minimalista",
    preco: 149.90,
    categoria: "Casa",
    imagem: "img/presente57.jpg",
    descricao: "Iluminação suave com design limpo.",
    status: "disponivel"
  },
  {
    id: 58,
    nome: "Vaporizador de Roupas Portátil",
    preco: 169.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente58.jpg",
    descricao: "Tira amassados em segundos.",
    status: "disponivel"
  },
  {
    id: 59,
    nome: "Kit Banho Luxo (Sabonetes + Óleos)",
    preco: 89.90,
    categoria: "Casa & Banho",
    imagem: "img/presente59.jpg",
    descricao: "Aromas sofisticados para o banho.",
    status: "disponivel"
  },
  {
    id: 60,
    nome: "Jogo de Porta-Temperos Magnéticos",
    preco: 119.90,
    categoria: "Cozinha",
    imagem: "img/presente60.jpg",
    descricao: "Conjunto com imãs e visor transparente.",
    status: "disponivel"
  },
  {
    id: 61,
    nome: "Kit de Facas Profissionais Chef",
    preco: 229.90,
    categoria: "Cozinha",
    imagem: "img/presente61.jpg",
    descricao: "Lâminas afiadas e cabo ergonômico.",
    status: "disponivel"
  },
  {
    id: 62,
    nome: "Panela de Pressão Inox 4,5L",
    preco: 189.90,
    categoria: "Cozinha",
    imagem: "img/presente62.jpg",
    descricao: "Segura, moderna e fácil de limpar.",
    status: "disponivel"
  },
  {
    id: 63,
    nome: "Batedeira Planetária 700W",
    preco: 499.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente63.jpg",
    descricao: "Perfeita para massas e confeitaria.",
    status: "disponivel"
  },
  {
    id: 64,
    nome: "Airfryer 5L Touch",
    preco: 479.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente64.jpg",
    descricao: "Sistema de circulação de ar quente.",
    status: "disponivel"
  },
  {
    id: 65,
    nome: "Mini Processador Elétrico",
    preco: 89.90,
    categoria: "Cozinha",
    imagem: "img/presente65.jpg",
    descricao: "Tritura alho, cebola e temperos rápido.",
    status: "disponivel"
  },
  {
    id: 66,
    nome: "Mixer 3 em 1",
    preco: 159.90,
    categoria: "Cozinha",
    imagem: "img/presente66.jpg",
    descricao: "Mixer + batedor + triturador.",
    status: "disponivel"
  },
  {
    id: 67,
    nome: "Forma de Bolo Antiaderente",
    preco: 49.90,
    categoria: "Cozinha",
    imagem: "img/presente67.jpg",
    descricao: "Alta durabilidade e resistência.",
    status: "disponivel"
  },
  {
    id: 68,
    nome: "Conjunto de Pratos de Porcelana (6 unidades)",
    preco: 229.90,
    categoria: "Cozinha",
    imagem: "img/presente68.jpg",
    descricao: "Porcelana de alta qualidade, acabamento premium.",
    status: "disponivel"
  },
  {
    id: 69,
    nome: "Jogo de Bowls Empilháveis",
    preco: 99.90,
    categoria: "Cozinha",
    imagem: "img/presente69.jpg",
    descricao: "Perfeito para preparo de receitas e servir.",
    status: "disponivel"
  },
  {
    id: 70,
    nome: "Assadeira Inox Grande",
    preco: 129.90,
    categoria: "Cozinha",
    imagem: "img/presente70.jpg",
    descricao: "Borda reforçada e superfície polida.",
    status: "disponivel"
  },
  {
    id: 71,
    nome: "Organizador de Gavetas (Kit 4 peças)",
    preco: 79.90,
    categoria: "Casa",
    imagem: "img/presente71.jpg",
    descricao: "Organização prática para roupas e utensílios.",
    status: "disponivel"
  },
  {
    id: 72,
    nome: "Jogo de Banho Premium (2 Toalhas)",
    preco: 139.90,
    categoria: "Banheiro",
    imagem: "img/presente72.jpg",
    descricao: "Toalhas macias de algodão egípcio.",
    status: "disponivel"
  },
  {
    id: 73,
    nome: "Kit Spa em Casa",
    preco: 159.90,
    categoria: "Banheiro",
    imagem: "img/presente73.jpg",
    descricao: "Sais de banho, espuma e óleos essenciais.",
    status: "disponivel"
  },
  {
    id: 74,
    nome: "Lixeira Inox com Tampa Automática",
    preco: 199.90,
    categoria: "Casa",
    imagem: "img/presente74.jpg",
    descricao: "Sensor infravermelho, abertura sem toque.",
    status: "disponivel"
  },
  {
    id: 75,
    nome: "Cafeteira Elétrica 30 Xícaras",
    preco: 179.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente75.jpg",
    descricao: "Perfeita para receber amigos e família.",
    status: "disponivel"
  },
  {
    id: 76,
    nome: "Umidificador Ultrasônico LED",
    preco: 129.90,
    categoria: "Casa",
    imagem: "img/presente76.jpg",
    descricao: "Com iluminação colorida e controle inteligente.",
    status: "disponivel"
  },
  {
    id: 77,
    nome: "Relógio de Parede Minimalista",
    preco: 89.90,
    categoria: "Decoração",
    imagem: "img/presente77.jpg",
    descricao: "Design silencioso e sofisticado.",
    status: "disponivel"
  },
  {
    id: 78,
    nome: "Espelho Decorativo Bronze",
    preco: 229.90,
    categoria: "Decoração",
    imagem: "img/presente78.jpg",
    descricao: "Acabamento premium e moldura metálica.",
    status: "disponivel"
  },
  {
    id: 79,
    nome: "Almofadas Decorativas (2 unidades)",
    preco: 89.90,
    categoria: "Decoração",
    imagem: "img/presente79.jpg",
    descricao: "Fofas e elegantes para sala ou quarto.",
    status: "disponivel"
  },
  {
    id: 80,
    nome: "Aparador de Livros Minimalista",
    preco: 79.90,
    categoria: "Decoração",
    imagem: "img/presente80.jpg",
    descricao: "Peças metálicas com estética moderna.",
    status: "disponivel"
  },
  {
    id: 81,
    nome: "Cadeira de Escritório Confort",
    preco: 499.90,
    categoria: "Escritório",
    imagem: "img/presente81.jpg",
    descricao: "Ergonômica, respirável e ajustável.",
    status: "disponivel"
  },
  {
    id: 82,
    nome: "Luminária de Mesa LED",
    preco: 129.90,
    categoria: "Escritório",
    imagem: "img/presente82.jpg",
    descricao: "Iluminação regulável com 3 tons.",
    status: "disponivel"
  },
  {
    id: 83,
    nome: "Kit Escrivaninha Minimalista",
    preco: 299.90,
    categoria: "Escritório",
    imagem: "img/presente83.jpg",
    descricao: "Organizadores + mousepad premium.",
    status: "disponivel"
  },
  {
    id: 84,
    nome: "Jogo de Lençóis Casal 300 fios",
    preco: 199.90,
    categoria: "Quarto",
    imagem: "img/presente84.jpg",
    descricao: "Tecido macio, respirável e elegante.",
    status: "disponivel"
  },
  {
    id: 85,
    nome: "Manta de Sofá Trançada",
    preco: 139.90,
    categoria: "Sala",
    imagem: "img/presente85.jpg",
    descricao: "Design aconchegante e moderno.",
    status: "disponivel"
  },
  {
    id: 86,
    nome: "Poltrona Decorativa Compacta",
    preco: 599.90,
    categoria: "Sala",
    imagem: "img/presente86.jpg",
    descricao: "Estofado confortável e estrutura reforçada.",
    status: "disponivel"
  },
  {
    id: 87,
    nome: "Mesa Lateral de Ferro",
    preco: 199.90,
    categoria: "Sala",
    imagem: "img/presente87.jpg",
    descricao: "Acabamento escovado com tampo redondo.",
    status: "disponivel"
  },
  {
    id: 88,
    nome: "Smart Lamp RGB com App",
    preco: 139.90,
    categoria: "Eletrônicos",
    imagem: "img/presente88.jpg",
    descricao: "Controle remoto via app e comandos de voz.",
    status: "disponivel"
  },
  {
    id: 89,
    nome: "Fone Bluetooth Premium",
    preco: 229.90,
    categoria: "Eletrônicos",
    imagem: "img/presente89.jpg",
    descricao: "Som cristalino com cancelamento de ruído.",
    status: "disponivel"
  },
  {
    id: 90,
    nome: "Caixa de Som Smart Assistant",
    preco: 299.90,
    categoria: "Eletrônicos",
    imagem: "img/presente90.jpg",
    descricao: "Controle sua casa inteligente por voz.",
    status: "disponivel"
  },
  {
    id: 91,
    nome: "Smartwatch Fitness Premium",
    preco: 329.90,
    categoria: "Eletrônicos",
    imagem: "img/presente91.jpg",
    descricao: "Monitoramento de saúde, passos e sono.",
    status: "disponivel"
  },
  {
    id: 92,
    nome: "Carregador Wireless Rápido",
    preco: 89.90,
    categoria: "Eletrônicos",
    imagem: "img/presente92.jpg",
    descricao: "Compatível com iPhone e Android.",
    status: "disponivel"
  },
  {
    id: 93,
    nome: "Aspirador Vertical 2 em 1",
    preco: 259.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente93.jpg",
    descricao: "Filtro HEPA e cabo ergonômico.",
    status: "disponivel"
  },
  {
    id: 94,
    nome: "Ferro de Passar Vapor",
    preco: 149.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente94.jpg",
    descricao: "Jato de vapor extra e base cerâmica.",
    status: "disponivel"
  },
  {
    id: 95,
    nome: "Tábua de Passar Acolchoada",
    preco: 99.90,
    categoria: "Lavanderia",
    imagem: "img/presente95.jpg",
    descricao: "Superfície macia e durável.",
    status: "disponivel"
  },
  {
    id: 96,
    nome: "Cesto de Roupa Dobrável",
    preco: 69.90,
    categoria: "Lavanderia",
    imagem: "img/presente96.jpg",
    descricao: "Tecido reforçado, leve e prático.",
    status: "disponivel"
  },
  {
    id: 97,
    nome: "Kit de Utensílios de Silicone (10 peças)",
    preco: 159.90,
    categoria: "Cozinha",
    imagem: "img/presente97.jpg",
    descricao: "Resistentes ao calor, não riscam panelas.",
    status: "disponivel"
  },
  {
    id: 98,
    nome: "Copo Térmico Inox",
    preco: 119.90,
    categoria: "Cozinha",
    imagem: "img/presente98.jpg",
    descricao: "Mantém bebidas geladas por 12h.",
    status: "disponivel"
  },
  {
    id: 99,
    nome: "Jogo de Taças para Vinho (6 unidades)",
    preco: 159.90,
    categoria: "Cozinha",
    imagem: "img/presente99.jpg",
    descricao: "Cristal transparente de alta qualidade.",
    status: "disponivel"
  },
  {
    id: 100,
    nome: "Ventilador de Mesa Turbo 40cm",
    preco: 189.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente100.jpg",
    descricao: "Silencioso e muito potente.",
    status: "disponivel"
  },
  {
    id: 101,
    nome: "Kit Frigideiras Antiaderentes (2 un.)",
    preco: 129.90,
    categoria: "Cozinha",
    imagem: "img/presente101.jpg",
    descricao: "Revestimento premium e cabo antitérmico.",
    status: "disponivel"
  },
  {
    id: 102,
    nome: "Roteador Wi-Fi Alta Performance",
    preco: 249.90,
    categoria: "Eletrônicos",
    imagem: "img/presente102.jpg",
    descricao: "Dual band, ideal para streaming 4K.",
    status: "disponivel"
  },
  {
    id: 103,
    nome: "Luminária de Pé Moderna",
    preco: 219.90,
    categoria: "Sala",
    imagem: "img/presente103.jpg",
    descricao: "Luz quente suave e haste metálica.",
    status: "disponivel"
  },
  {
    id: 104,
    nome: "Tapete Macio Antiderrapante",
    preco: 179.90,
    categoria: "Sala",
    imagem: "img/presente104.jpg",
    descricao: "Confortável e fácil de lavar.",
    status: "disponivel"
  },
  {
    id: 105,
    nome: "Fronhas Premium (par)",
    preco: 59.90,
    categoria: "Quarto",
    imagem: "img/presente105.jpg",
    descricao: "Tecido macio, toque suave.",
    status: "disponivel"
  },
  {
    id: 106,
    nome: "Cobertor Sherpa",
    preco: 189.90,
    categoria: "Quarto",
    imagem: "img/presente106.jpg",
    descricao: "Super macio para dias frios.",
    status: "disponivel"
  },
  {
    id: 107,
    nome: "Kit Organizadores de Closet (6 un.)",
    preco: 129.90,
    categoria: "Quarto",
    imagem: "img/presente107.jpg",
    descricao: "Perfeitos para roupas e acessórios.",
    status: "disponivel"
  },
  {
    id: 108,
    nome: "Toalhas Lavabo Luxo (2 un.)",
    preco: 69.90,
    categoria: "Banheiro",
    imagem: "img/presente108.jpg",
    descricao: "Acabamento sofisticado.",
    status: "disponivel"
  },
  {
    id: 109,
    nome: "Difusor de Aromas com Varetas",
    preco: 59.90,
    categoria: "Banheiro",
    imagem: "img/presente109.jpg",
    descricao: "Aroma suave para ambiente relaxante.",
    status: "disponivel"
  },
  {
    id: 110,
    nome: "Kit Baldes Organizadores (3 un.)",
    preco: 89.90,
    categoria: "Lavanderia",
    imagem: "img/presente110.jpg",
    descricao: "Material resistente, fácil de lavar.",
    status: "disponivel"
  },
  {
    id: 111,
    nome: "Cortina Blackout para Sala",
    preco: 179.90,
    categoria: "Sala",
    imagem: "img/presente111.jpg",
    descricao: "Bloqueia luminosidade e ruídos.",
    status: "disponivel"
  },
  {
    id: 112,
    nome: "Enfeite Decorativo de Mesa",
    preco: 69.90,
    categoria: "Decoração",
    imagem: "img/presente112.jpg",
    descricao: "Minimalista e elegante, cor neutra.",
    status: "disponivel"
  },
  {
    id: 113,
    nome: "Vaso Moderno para Plantas",
    preco: 99.90,
    categoria: "Decoração",
    imagem: "img/presente113.jpg",
    descricao: "Ideal para plantas naturais ou artificiais.",
    status: "disponivel"
  },
  {
    id: 114,
    nome: "Quadro Abstrato Grande",
    preco: 249.90,
    categoria: "Decoração",
    imagem: "img/presente114.jpg",
    descricao: "Peça de destaque para sala.",
    status: "disponivel"
  },
  {
    id: 115,
    nome: "Carregador Portátil 20.000mAh",
    preco: 159.90,
    categoria: "Eletrônicos",
    imagem: "img/presente115.jpg",
    descricao: "Alta capacidade para vários carregamentos.",
    status: "disponivel"
  },
  {
    id: 116,
    nome: "Extensão 5 Tomadas com Proteção",
    preco: 49.90,
    categoria: "Eletrônicos",
    imagem: "img/presente116.jpg",
    descricao: "Proteção contra surtos elétricos.",
    status: "disponivel"
  },
  {
    id: 117,
    nome: "Liquidificador Individual Portátil",
    preco: 129.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente117.jpg",
    descricao: "Perfeito para sucos e shakes.",
    status: "disponivel"
  },
  {
    id: 118,
    nome: "Sanduicheira Antiaderente",
    preco: 119.90,
    categoria: "Eletrodomésticos",
    imagem: "img/presente118.jpg",
    descricao: "Preparo rápido e fácil.",
    status: "disponivel"
  },
  {
    id: 119,
    nome: "Kit Colheres Inox (12 peças)",
    preco: 79.90,
    categoria: "Cozinha",
    imagem: "img/presente119.jpg",
    descricao: "Resistentes e polidas.",
    status: "disponivel"
  },
  {
    id: 120,
    nome: "Kit Pratos Fundo Cerâmica (6 un.)",
    preco: 159.90,
    categoria: "Cozinha",
    imagem: "img/presente120.jpg",
    descricao: "Acabamento artesanal e elegante.",
    status: "disponivel"
  }
];
