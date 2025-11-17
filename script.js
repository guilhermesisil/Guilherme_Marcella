/* ================= CONFIG — SUBSTITUA ESTES VALORES ================= */
const SHEET_URL = https://script.google.com/macros/s/AKfycbxaUSghFm-nqbAvaP7-RUNxU7sh4AJPjQ8VeAsHaTmnKWEVkn5NiTdBNvWxkVcrUyjcAw/exec; // <-- Apps Script deploy URL (doGet/doPost)
const PIX_KEY = 97427455-6f14-4aba-aa09-d1cb15de34d4;              // <-- chave Pix (e-mail/telefone/CPF/CNPJ/EVP)
const PIX_NOME = "Guilherme Silveira";            // <-- nome beneficiário (max 25)
const PIX_CIDADE = "PASSOS - MG";                     // <-- cidade
const PIX_TXID = "";                                // <-- opcional, pode ficar vazio
/* =================================================================== */

/* === Exemplo de presentes (adicione imagens em /img) === */
const presentes = [
  { nome: "Cota Lua de Mel – Resort", valorTotal: 2000, permitirParcial: true, img: "img/pres1.jpg" },
  { nome: "Passeio de Barco - Lua de Mel", valorTotal: 600, permitirParcial: true, img: "img/pres2.jpg" },
  { nome: "Aparelho de Jantar 30 peças", permitirParcial: false, img: "img/pres3.jpg" },
  { nome: "Jogo de Toalhas Luxo", permitirParcial: false, img: "img/pres4.jpg" }
];

/* ----------------- helpers para PIX (EMV + CRC16) ----------------- */
/* Gera payload EMV para QR Pix (simplificado, compatível com a maior parte dos apps) */
function buildPixPayload(key, beneficiary, city, amount, txid) {
  // Campos básicos EMV
  function tlv(id, value) {
    const s = String(value);
    const len = String(s.length).padStart(2, '0');
    return id + len + s;
  }
  let payload = "";
  // Payload Format Indicator
  payload += tlv("00","01");
  // Merchant Account Information (GUI + key)
  const gui = tlv("00","BR.GOV.BCB.PIX");
  const keyField = tlv("01", key);
  const merchantInfo = tlv("26", gui + keyField);
  payload += merchantInfo;
  // Merchant Category (default 0000)
  payload += tlv("52","0000");
  // Transaction Currency (986=BRL)
  payload += tlv("53","986");
  // Transaction Amount (optional)
  if (amount !== null && amount !== undefined && amount !== 0) {
    // format with decimal dot
    payload += tlv("54", Number(amount).toFixed(2));
  }
  // Country Code
  payload += tlv("58","BR");
  // Merchant name (beneficiário)
  payload += tlv("59", beneficiary.substring(0,25));
  // Merchant city
  payload += tlv("60", city.substring(0,15));
  // Optional txid (if provided)
  if (txid) {
    payload += tlv("62", tlv("05", txid));
  } else {
    // leave TXID empty (some apps accept)
    payload += tlv("62", tlv("05", ""));
  }

  // CRC placeholder
  const payloadForCrc = payload + "6304";
  const crc = crc16(payloadForCrc);
  payload += "63" + "04" + crc;
  return payload;
}

// CRC16-CCITT (polynomial 0x1021) implementation returning uppercase hex (4 chars)
function crc16(input) {
  let crc = 0xFFFF;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      else crc = (crc << 1) & 0xFFFF;
    }
  }
  let hex = crc.toString(16).toUpperCase();
  while (hex.length < 4) hex = "0" + hex;
  return hex;
}

/* ----------------- FUNÇÕES de integração com Google Sheets ----------------- */
async function carregarContribuicoes() {
  try {
    const res = await fetch(SHEET_URL);
    const data = await res.json();
    // data.contribuições: { "presente": totalPago, ... }
    return data.contribuições || {};
  } catch (err) {
    console.warn("Erro ao carregar contribuições:", err);
    return {};
  }
}

async function enviarPresente(nome, presente, mensagem, valor) {
  // envia POST para Apps Script
  try {
    await fetch(SHEET_URL, {
      method: "POST",
      mode: "no-cors", // Apps Script aceita POST sem CORS quando publicado como Web App
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, presente, mensagem, valor })
    });
  } catch (err) {
    console.warn("Erro no envio:", err);
  }
}

/* ----------------- RENDER e UI ----------------- */
let presenteSelecionado = null;
let modalParcial = false;

function montarCard(p, pago, total) {
  const completo = total && (pago >= total);
  const permitirParcial = !!p.permitirParcial;
  let progressoHTML = "";
  if (permitirParcial && total) {
    const perc = Math.min(100, Math.round((pago / total) * 100));
    progressoHTML = `
      <div class="barra"><div class="barra-inner" style="width:${perc}%;"></div></div>
      <p class="valor-info">${perc}% • R$ ${pago.toFixed(2).replace('.',',')} de R$ ${total.toFixed(2).replace('.',',')}</p>
    `;
  }
  const fotoHTML = p.img ? `<img src="${p.img}" alt="${p.nome}" style="width:100%; height:160px; object-fit:cover; border-radius:12px; margin-bottom:12px;" />` : "";
  const buttonHTML = completo
    ? `<button disabled class="btn-off">Concluído ✔</button>`
    : `<button onclick="abrirModal('${escapeHtml(p.nome)}', ${permitirParcial}, ${total || 0}, ${pago})">Presentear</button>`;

  const classInd = completo ? "indisponivel" : "";
  return `<div class="presente-card ${classInd}">
      ${fotoHTML}
      <h3>${escapeHtml(p.nome)}</h3>
      ${progressoHTML}
      ${buttonHTML}
    </div>`;
}

function escapeHtml(str){ return String(str).replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

async function carregarPresentes() {
  const lista = document.getElementById("listaPresentes");
  lista.innerHTML = "<p style='text-align:center; color:#7d6b42;'>Carregando...</p>";

  const contrib = await carregarContribuicoes();

  // Ordena: disponíveis (não completos) primeiro
  const ordenado = [...presentes].sort((a,b) => {
    const aPago = contrib[a.nome] || 0;
    const bPago = contrib[b.nome] || 0;
    const aCompleto = a.valorTotal && (aPago >= a.valorTotal);
    const bCompleto = b.valorTotal && (bPago >= b.valorTotal);
    return (aCompleto === bCompleto) ? 0 : (aCompleto ? 1 : -1);
  });

  lista.innerHTML = "";
  ordenado.forEach(p => {
    const pago = Number(contrib[p.nome] || 0);
    const total = p.valorTotal || null;
    lista.innerHTML += montarCard(p, pago, total);
  });
}

/* ----------------- MODAL e PIX ----------------- */
function abrirModal(nome, parcial, total, pago) {
  presenteSelecionado = nome;
  modalParcial = parcial;
  document.getElementById("modalTitulo").textContent = nome;

  const campoValor = document.getElementById("campoValor");
  if (parcial && total) {
    const restante = Math.max(0, total - pago);
    campoValor.innerHTML = `
      <label>Quanto deseja contribuir? (mín R$ 1)</label>
      <input type="number" id="valor" min="1" max="${restante}" step="1" value="${Math.min(50, restante)}" required />
      <small>Restante: R$ ${restante.toFixed(2).replace('.',',')}</small>
    `;
  } else if (total) {
    // presente com valor fixo (mas não permite parcial)
    campoValor.innerHTML = `
      <label>Valor do presente</label>
      <input type="number" id="valor" value="${total}" required readonly />
    `;
  } else {
    campoValor.innerHTML = `
      <label>Valor que deseja contribuir</label>
      <input type="number" id="valor" min="1" step="1" value="100" required />
    `;
  }

  // Reset pix area
  document.getElementById("pixArea").style.display = "none";
  document.getElementById("pixQr").src = "";
  document.getElementById("pixInstruc").textContent = "";

  document.getElementById("modal").style.display = "flex";
}

function fecharModal(){
  document.getElementById("modal").style.display = "none";
}

/* Gera QR Pix e mostra no modal; chamada antes de enviar para o Sheet (o usuário escaneia e paga) */
function gerarPixEExibir(valor) {
  // valor em formato número (ex: 123.45)
  // cria payload EMV
  const amountStr = Number(valor).toFixed(2);
  const txid = PIX_TXID || Math.random().toString(36).slice(2,10).toUpperCase();
  const payload = buildPixPayload(PIX_KEY, PIX_NOME, PIX_CIDADE, amountStr, txid);
  // usa Google Chart API para gerar QR (simples e gratuito)
  const qrUrl = "https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=" + encodeURIComponent(payload);
  document.getElementById("pixQr").src = qrUrl;
  document.getElementById("pixArea").style.display = "block";
  document.getElementById("pixInstruc").textContent = `Escaneie o QR com o app bancário e pague R$ ${amountStr.replace('.',',')}. TXID: ${txid}`;
}

/* ----------------- FORM do modal ----------------- */
document.addEventListener("DOMContentLoaded", () => {
  // abrir/fechar modal buttons
  document.getElementById("closeModal").addEventListener("click", fecharModal);

  // binding do form
  document.getElementById("formPresente").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome").value || "Anônimo";
    const mensagem = document.getElementById("mensagem").value || "";
    const valor = Number(document.getElementById("valor").value || 0);
    if (!valor || valor <= 0) return alert("Informe um valor válido.");

    // gerar QR e mostrar (o convidado deve pagar no app)
    gerarPixEExibir(valor);

    // registra no Google Sheets (ainda que o convidado confirme o pagamento manualmente; é aceitável registrar aqui)
    await enviarPresente(nome, presenteSelecionado, mensagem, valor);

    // atualizar UI (recarrega status)
    setTimeout(async () => {
      await carregarPresentes();
      alert("Obrigado! Registramos sua contribuição. Se você já pagou via PIX, em breve atualizaremos o status na lista.");
      fecharModal();
    }, 800);
  });

  // inicializa lista
  carregarPresentes();

  // Hamburger menu (se existir)
  const hb = document.getElementById("hamburgerBtn");
  const menuLinks = document.getElementById("menuLinks");
  if (hb && menuLinks) {
    hb.addEventListener("click", () => {
      hb.classList.toggle("active");
      menuLinks.classList.toggle("open");
    });
  }
});
