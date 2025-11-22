<script src="presentes.js"></script>
<script>
// CONFIGURAÇÃO
const DATE_TARGET = new Date("2026-05-09T16:00:00").getTime();
// COLE SUA URL AQUI TAMBÉM (A mesma do presentes.js)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAGdnf8IcbzT-tVIC7Yf2vnw_Kbfi6Tqh-XFjQ-AhG-Lff1ODy3lbzrXW7L7HsPdbN/exec"; 

// COUNTDOWN
function tick(){
  const now = Date.now();
  const diff = DATE_TARGET - now;
  const el = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; }
  
  if(diff<=0){ el('dias','0'); el('horas','00'); el('minutos','00'); el('segundos','00'); return; }
  
  const dias = Math.floor(diff/(1000*60*60*24));
  const horas = Math.floor((diff/(1000*60*60))%24);
  const minutos = Math.floor((diff/(1000*60))%60);
  const segundos = Math.floor((diff/1000)%60);
  
  el('dias', dias);
  el('horas', String(horas).padStart(2,'0'));
  el('minutos', String(minutos).padStart(2,'0'));
  el('segundos', String(segundos).padStart(2,'0'));
}
tick(); setInterval(tick,1000);

// MODAL HANDLERS
function abrirModalRSVP() { document.getElementById("modalRSVP").style.display = "flex"; }
function fecharModalRSVP() { document.getElementById("modalRSVP").style.display = "none"; }

// ENVIO DO FORMULÁRIO PARA O GOOGLE SHEETS
const form = document.getElementById('rsvpForm');
if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();

      // Feedback visual no botão
      const btn = form.querySelector('button');
      const textoOriginal = btn.innerText;
      btn.innerText = "Enviando...";
      btn.disabled = true;

      const dados = {
        action: 'rsvp',
        nome: document.getElementById('nomeResponsavel').value,
        telefone: document.getElementById('telefone').value,
        acompanhantes: document.getElementById('nomes').value,
        presenca: document.getElementById('presenca').value
      };

      fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Permite enviar sem erro de segurança cross-origin
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })
      .then(() => {
        alert('Obrigado! Sua confirmação foi registrada.');
        fecharModalRSVP();
        form.reset();
      })
      .catch(error => {
        console.error('Erro envio:', error);
        alert('Erro ao conectar com o servidor. Tente novamente mais tarde.');
      })
      .finally(() => {
        btn.innerText = textoOriginal;
        btn.disabled = false;
      });
    });
}
</script>
