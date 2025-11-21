/* presentes.js - lógica para página de presentes (loja) */

// Exemplo de inventário: você vai adicionar >100 itens neste array ou carregar via fetch/json.
const PRESENTES = [
  {"id":1,"nome":"Jogo de Panelas em cerâmica","preco":429.90,"img":"img/presente1.jpg","descricao":"Jogo Duo Smart 5 peças - Ceraflame","link":"https://exemplo.com/1","endereco":"Rua Araxá, 316, Passos - MG","status":"Disponível"},
  {"id":2,"nome":"Ar Condicionado Portátil 12000 BTU","preco":1799.00,"img":"img/presente2.jpg","descricao":"Electrolux 12.000 BTUs com Wi-fi","link":"https://exemplo.com/2","endereco":"Rua Araxá, 316, Passos - MG","status":"Disponível"},
  {"id":3,"nome":"Robô Aspirador","preco":999.00,"img":"img/presente3.jpg","descricao":"Robô aspirador com sensores inteligentes","link":"https://exemplo.com/3","endereco":"Rua Araxá, 316, Passos - MG","status":"Disponível"},
  {"id":4,"nome":"Lava-louças Brastemp 8 serviços","preco":2499.00,"img":"img/presente4.jpg","descricao":"Lava-louças compacta 8 serviços","link":"https://exemplo.com/4","endereco":"Rua Araxá, 316, Passos - MG","status":"Disponível"},
  {"id":5,"nome":"Cota Lua de Mel","preco":150.00,"img":"img/presente5.jpg","descricao":"Contribuição para a lua-de-mel","link":"https://exemplo.com/5","endereco":"Rua Araxá, 316, Passos - MG","status":"Disponível"},
  {"id":6,"nome":"Conjunto de Toalhas","preco":249.50,"img":"img/presente6.jpg","descricao":"Toalhas 5 peças premium","link":"https://exemplo.com/6","endereco":"Rua Araxá, 316, Passos - MG","status":"Disponível"},
  {"id":7,"nome":"Conjunto de Taças","preco":199.00,"img":"img/presente7.jpg","descricao":"Taças cristal 6 peças","link":"https://exemplo.com/7","endereco":"Rua Araxá, 316, Passos - MG","status":"Disponível"},
  {"id":8,"nome":"Aparelho de Jantar","preco":399.90,"img":"img/presente8.jpg","descricao":"Conjunto 20 peças elegante","link":"https://exemplo.com/8","endereco":"Rua Araxá, 316, Passos - MG","status":"Disponível"},
  {"id":9,"nome":"Micro-ondas Inox","preco":549.00,"img":"img/presente9.jpg","descricao":"Micro-ondas 25L Inox","link":"https://exemplo.com/9","endereco":"Rua Araxá, 316, Passos - MG","status":"Disponível"},
  {"id":10,"nome":"Máquina de Café","preco":799.00,"img":"img/presente10.jpg","descricao":"Cafeteira expresso automática","link":"https://exemplo.com/10","endereco":"Rua Araxá, 316, Passos - MG","status":"Disponível"}
];


// state
let presentes = [...PRESENTES];
let originalList = [...presentes];
let page = 1;
let perPage = 24;
let currentSort = 'default';
let searchTerm = '';

const grid = document.getElementById('grid');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const perPageSelect = document.getElementById('perPageSelect');

function formatPrice(v){ return v==null ? '—' : 'R$ '+Number(v).toFixed(2); }

function render() {
  // filter
  let filtered = presentes.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  // sort
  if(currentSort === 'price-asc') filtered.sort((a,b)=> (a.preco||0)-(b.preco||0));
  else if(currentSort === 'price-desc') filtered.sort((a,b)=> (b.preco||0)-(a.preco||0));
  else if(currentSort === 'name-asc') filtered.sort((a,b)=> a.nome.localeCompare(b.nome));
  else if(currentSort === 'name-desc') filtered.sort((a,b)=> b.nome.localeCompare(a.nome));

  // pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  page = Math.min(page, totalPages);
  const start = (page-1)*perPage;
  const pageItems = filtered.slice(start, start+perPage);

  // render grid
  grid.innerHTML = '';
  pageItems.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div class="img-square"><img src="${p.img}" alt="${escapeHtml(p.nome)}"></div>
      <div class="content">
        <h4>${escapeHtml(p.nome)}</h4>
        <p>${escapeHtml(p.descricao)}</p>
        <div class="meta">
          <span class="price">${formatPrice(p.preco)}</span>
          <div style="display:flex;gap:8px">
            <a class="btn-ghost" href="${p.link}" target="_blank" rel="noopener">Ver</a>
            <button class="btn" onclick="openPresent(${p.id})">Presentear</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(div);
  });

  // render pagination
  renderPagination(totalPages);
}

function renderPagination(totalPages){
  pagination.innerHTML = '';
  if(totalPages<=1) return;
  for(let i=1;i<=totalPages;i++){
    const b = document.createElement('button');
    b.className = 'page-btn'+(i===page? ' active':'');
    b.innerText = i;
    b.onclick = ()=> { page = i; render(); };
    pagination.appendChild(b);
  }
}

// handlers
searchInput.addEventListener('input', e=>{ searchTerm = e.target.value; page = 1; render(); });
sortSelect.addEventListener('change', e=>{ currentSort = e.target.value; page = 1; render(); });
perPageSelect.addEventListener('change', e=>{ perPage = Number(e.target.value); page = 1; render(); });

// open present modal
function openPresent(id){
  const p = presentes.find(x=>x.id===id);
  if(!p) return;
  document.getElementById('modalImage').src = p.img;
  document.getElementById('modalTitle').innerText = p.nome;
  document.getElementById('modalDesc').innerText = p.descricao;
  document.getElementById('modalPrice').innerText = formatPrice(p.preco);
  document.getElementById('modalAddress').innerText = p.endereco || '';
  document.getElementById('modalLink').href = p.link || '#';
  document.getElementById('presentModal').setAttribute('aria-hidden','false');
  // store current id
  document.getElementById('presentModal').dataset.current = id;
}

function closePresentModal(){
  document.getElementById('presentModal').setAttribute('aria-hidden','true');
  document.getElementById('presentModal').dataset.current = '';
}

// mark as bought (local)
function markAsBought(){
  const id = Number(document.getElementById('presentModal').dataset.current);
  const p = presentes.find(x=>x.id===id);
  if(!p) return;
  p.status = 'Comprado';
  // persist (simple localStorage)
  localStorage.setItem('presentes_shop', JSON.stringify(presentes));
  closePresentModal();
  render();
  alert('Marcado como comprado (local). Você pode desmarcar manualmente no código ou no console.');
}

// escape helper
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// init: try load from localStorage too
(function init(){
  const saved = JSON.parse(localStorage.getItem('presentes_shop')||'null');
  if(saved && Array.isArray(saved) && saved.length>0) presentes = saved;
  render();
})();
