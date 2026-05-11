import './style.css';

const grid = document.getElementById('pokemon-grid');
const searchInput = document.getElementById('search-input');
const genFilter = document.getElementById('gen-filter');
const loadMoreBtn = document.getElementById('load-more');
const modal = document.getElementById('pokemon-modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-button');

let allPokemon = [];
let filteredPokemon = [];
let offset = 0;
const LIMIT = 20;

const GEN_RANGES = {
  1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
  5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
};

async function initPokedex() {
  const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
  const data = await res.json();
  allPokemon = data.results.map((p, index) => ({ ...p, id: index + 1 }));
  filteredPokemon = [...allPokemon];
  renderBatch();
}

async function renderBatch() {
  const batch = filteredPokemon.slice(offset, offset + LIMIT);
  const promises = batch.map(p => fetch(p.url).then(res => res.json()));
  const details = await Promise.all(promises);
  details.forEach(pokemon => createCard(pokemon));
  offset += LIMIT;
  loadMoreBtn.style.display = offset >= filteredPokemon.length ? 'none' : 'block';
}

function createCard(pokemon) {
  const card = document.createElement('div');
  card.className = 'pokemon-card';
  
  // Generamos los tipos para que se vean en el index
  const typesHTML = pokemon.types.map(t => 
    `<span class="type-badge ${t.type.name}">${t.type.name}</span>`
  ).join('');

  card.innerHTML = `
    <span class="pokemon-number">#${pokemon.id.toString().padStart(3, '0')}</span>
    <img src="${pokemon.sprites.other['official-artwork'].front_default}" alt="${pokemon.name}">
    <div class="types-container-grid">${typesHTML}</div>
    <div class="pokemon-name">${pokemon.name}</div>
  `;

  card.onclick = () => {
    // 1. Reproducir sonido inmediatamente al hacer clic
    const audio = new Audio(pokemon.cries.latest);
    audio.volume = 0.4;
    audio.play();

    // 2. Abrir el modal con la descripción
    showDetail(pokemon);
  };

  grid.appendChild(card);
}

async function showDetail(pokemon) {
  const modal = document.getElementById('pokemon-modal');
  const modalBody = document.getElementById('modal-body');
  

  // Obtener la descripción en español desde la API
  const speciesRes = await fetch(pokemon.species.url);
  const speciesData = await speciesRes.json();
  const description = speciesData.flavor_text_entries.find(
    entry => entry.language.name === 'es'
  )?.flavor_text.replace(/\f/g, ' ') || "Sin descripción disponible.";

  const typesHTML = pokemon.types.map(t => 
    `<span class="type-badge ${t.type.name}">${t.type.name}</span>`
  ).join('');

  // Insertamos el contenido incluyendo el botón de sonido solicitado
  modalBody.innerHTML = `
    <span class="pokemon-number">#${pokemon.id.toString().padStart(3, '0')}</span>
    <h2 style="text-transform: capitalize;">${pokemon.name}</h2>
    <img src="${pokemon.sprites.other['official-artwork'].front_default}" class="modal-img">
    <div class="types-container">${typesHTML}</div>
    <div class="stats-row">
      <span><strong>Altura:</strong> ${pokemon.height / 10} m</span>
      <span><strong>Peso:</strong> ${pokemon.weight / 10} kg</span>
    </div>
    <p class="description">${description}</p>
    
    <button id="play-cry-modal" class="audio-button">
       🔊 Reproducir Grito
    </button>
  `;

  // Configurar la acción del botón dentro del modal
  document.getElementById('play-cry-modal').onclick = () => {
    const audio = new Audio(pokemon.cries.latest);
    audio.volume = 0.5;
    audio.play();
  };

  modal.style.display = 'flex';
}

// Cerrar modal
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

function applyFilters() {
  const searchTerm = searchInput.value.toLowerCase();
  const gen = genFilter.value;
  filteredPokemon = allPokemon.filter(p => {
    const matchesSearch = p.name.includes(searchTerm) || p.id.toString() === searchTerm;
    let matchesGen = true;
    if (gen !== 'all') {
      const [start, end] = GEN_RANGES[gen];
      matchesGen = p.id >= start && p.id <= end;
    }
    return matchesSearch && matchesGen;
  });
  grid.innerHTML = '';
  offset = 0;
  renderBatch();
}

searchInput.addEventListener('input', applyFilters);
genFilter.addEventListener('change', applyFilters);
loadMoreBtn.addEventListener('click', renderBatch);

initPokedex();