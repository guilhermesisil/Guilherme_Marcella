// Apps Script - integracao_presentes.gs

// CONFIG — substitua antes de publicar
const EMAIL_NOTIFY = "SEU_EMAIL@example.com";   // <-- seu e-mail para receber notificações
const ADMIN_TOKEN = "COLOQUE_UM_TOKEN_FORTE_AQUI"; // <-- token para acessar /admin (use algo longo)

// Nome da folha (aba) onde salvamos dados
const SHEET_NAME = "pagina1"; // ajuste se sua aba tiver outro nome

// Recebe POSTs do site (registro de presente/contribuição)
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);

    const data = JSON.parse(e.postData.contents || "{}");

    // Campos esperados: nome, presente, mensagem, valor
    const nome = data.nome || "Anônimo";
    const presente = data.presente || "—";
    const mensagem = data.mensagem || "";
    const valor = Number(data.valor || 0);

    sheet.appendRow([new Date(), nome, presente, mensagem, valor]);

    // Envia notificação por e-mail (personalize assunto/texto)
    const assunto = `[RSVP/Presente] ${nome} contribuiu: ${presente}`;
    const corpo = `Novo registro de presente\n\nNome: ${nome}\nPresente: ${presente}\nValor: R$ ${valor}\nMensagem: ${mensagem}\n\nPlanilha: ${SpreadsheetApp.getActive().getUrl()}`;

    MailApp.sendEmail(EMAIL_NOTIFY, assunto, corpo);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET público que retorna sumário de contribuições + presentes já escolhidos
// Se for pedido com ?token=ADMIN_TOKEN devolve todas as linhas (raw) para administração
function doGet(e) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const last = sheet.getLastRow();

  // Se token admin válido, devolve linhas brutas
  if (e && e.parameter && e.parameter.token === ADMIN_TOKEN) {
    const rows = sheet.getRange(2, 1, Math.max(0, last-1), 5).getValues();
    // converte para JSON
    const raw = rows.map(r => ({
      timestamp: r[0],
      nome: r[1],
      presente: r[2],
      mensagem: r[3],
      valor: r[4]
    }));
    return ContentService.createTextOutput(JSON.stringify({ raw })).setMimeType(ContentService.MimeType.JSON);
  }

  // Normal (público): sumariza contribuições por presente, e lista de presentes vendidos
  const rows = sheet.getRange(2, 1, Math.max(0, last-1), 5).getValues();

  const contrib = {};        // soma por presente
  const presentesEscolhidos = []; // lista (nomes) de presentes that received any contribution

  rows.forEach(r => {
    const pres = r[2] || "";
    const val = Number(r[4] || 0);
    if (!contrib[pres]) contrib[pres] = 0;
    contrib[pres] += val;
    if (val > 0 && !presentesEscolhidos.includes(pres)) {
      presentesEscolhidos.push(pres);
    }
  });

  return ContentService.createTextOutput(JSON.stringify({
    contribuicoes: contrib,
    presentesIndisponiveis: presentesEscolhidos
  })).setMimeType(ContentService.MimeType.JSON);
}
