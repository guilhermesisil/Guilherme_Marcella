// presentes.js - generated placeholders + rendering + modal + localStorage
const presentes = [];
for(let i=1;i<=120;i++){
  presentes.push({
    id: 'p'+String(i).padStart(3,'0'),
    nome: 'Presente ' + i,
    descricao: 'Descrição do presente número ' + i + '. Um texto curto descrevendo o item e sugestões.',
    img: 'img/presente' + ( (i%10)+1 ) + '.jpg', // cycles through 10 placeholder images
    link: '#',
    endereco: 'Rua Exemplo, 123 — Cidade',
    status: 'Disponivel'
  });
}

function carregarPresentes(){
  const container = document.getElementById('listaPresentes');
  if(!container) return;
  container.innerHTML = '';
  presentes.forEach((p, i)=>{
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div class="img-square"><img src="${p.img}" alt="${p.nome}"></div>
      <h3>${p.nome}</h3>
      <p style="font-weight:300;">${p.descricao}</p>
      <small>Entrega: ${p.endereco}</small>
      <div style="display:flex; gap:8px; margin-top:8px;">
        <a class="btn-ghost" href="${p.link}" target="_blank">Ver</a>
        <button class="btn" onclick="abrirModalPresente(${i})">${p.status === 'Disponivel' ? 'Presentear' : 'Já presenteado'}</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function abrirModalPresente(index){
  const p = presentes[index];
  const modalBg = document.getElementById('modalPresenteBg');
  const modal = document.getElementById('modalPresente');
  modal.innerHTML = `
    <div style="text-align:right"><button class="fechar-modal btn-ghost" onclick="fecharModalPresente()">✕</button></div>
    <div style="text-align:center;">
      <div style="width:220px; margin:0 auto;"><img src="${p.img}" alt="${p.nome}" style="width:100%; border-radius:8px; object-fit:cover"></div>
    </div>
    <h3 style="margin-top:12px;">${p.nome}</h3>
    <p style="font-weight:300;">${p.descricao}</p>
    <p><small>Entrega: ${p.endereco}</small></p>
    <label>Valor (R$)</label>
    <input id="valorPresente" type="text" placeholder="Ex: 150.00" style="width:100%; padding:10px; margin-top:6px;">
    <label style="margin-top:8px;">Seu nome</label>
    <input id="nomePresente" type="text" placeholder="Seu nome (opcional)" style="width:100%; padding:10px; margin-top:6px;">
    <div style="display:flex; gap:8px; margin-top:12px;">
      <button class="btn" onclick="confirmarContribuicao('${p.id}')">Confirmar contribuição</button>
      <button class="btn-ghost" onclick="fecharModalPresente()">Cancelar</button>
    </div>
  `;
  modalBg.style.display = 'flex';
}

function fecharModalPresente(){ document.getElementById('modalPresenteBg').style.display='none'; document.getElementById('modalPresente').innerHTML=''; }

function confirmarContribuicao(presentId){
  const valorRaw = document.getElementById('valorPresente').value.trim();
  const nome = document.getElementById('nomePresente').value.trim() || 'Convidado';
  const valor = valorRaw ? Number(valorRaw.replace(',','.')) : 0;
  const txid = 'C' + Date.now();
  const presente = presentes.find(p=>p.id===presentId);
  const item = { id: txid, presenteId: presentId, presenteNome: presente.nome, nome, valor, data: new Date().toISOString() };
  const contribuicoes = JSON.parse(localStorage.getItem('contribuicoes')||'[]');
  contribuicoes.push(item);
  localStorage.setItem('contribuicoes', JSON.stringify(contribuicoes));
  fecharModalPresente();
  alert('Obrigad@ pela contribuição! Registramos localmente (ver painel admin).');
}

document.addEventListener('DOMContentLoaded', ()=>{ carregarPresentes(); });
