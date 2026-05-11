import './style.css';

const grid = document.getElementById('pokemon-grid');
const searchInput = document.getElementById('search-input');
const genFilter = document.getElementById('gen-filter');
const loadMoreBtn = document.getElementById('load-more');

let allPokemon = []; // Lista maestra
let filteredPokemon = []; // Lista para mostrar (según búsqueda/filtro)
let offset = 0;
const LIMIT = 20; // Cuántos cargar por vez

// Rangos de ID por Generación
const GEN_RANGES = {
  1: [1, 151], 2: [152, 251], 3: [252, 386], 4: [387, 493],
  5: [494, 649], 6: [650, 721], 7: [722, 809], 8: [810, 905], 9: [906, 1025]
};

async function initPokedex() {
  // Traemos los 1025 de golpe (solo nombres y URLs, es una petición ligera)
  const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025');
  const data = await res.json();
  
  allPokemon = data.results.map((p, index) => ({
    ...p,
    id: index + 1
  }));
  
  filteredPokemon = [...allPokemon];
  renderBatch();
}

async function renderBatch() {
  const batch = filteredPokemon.slice(offset, offset + LIMIT);
  
  // Cargamos los detalles (imágenes) solo de este batch
  const promises = batch.map(p => fetch(p.url).then(res => res.json()));
  const details = await Promise.all(promises);

  details.forEach(pokemon => createCard(pokemon));
  
  offset += LIMIT;
  // Ocultar botón si ya no hay más
  loadMoreBtn.style.display = offset >= filteredPokemon.length ? 'none' : 'block';
}

function createCard(pokemon) {
  const card = document.createElement('div');
  card.className = 'pokemon-card';
  card.innerHTML = `
    <span class="pokemon-number">#${pokemon.id.toString().padStart(3, '0')}</span>
    <img src="${pokemon.sprites.other['official-artwork'].front_default}" alt="${pokemon.name}">
    <div class="pokemon-name">${pokemon.name}</div>
  `;
  card.onclick = () => showDetail(pokemon); // Tu función de modal anterior
  grid.appendChild(card);
}

// Lógica de Filtros y Búsqueda
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

  // Reiniciar cuadrícula
  grid.innerHTML = '';
  offset = 0;
  renderBatch();
}

// Eventos
searchInput.addEventListener('input', applyFilters);
genFilter.addEventListener('change', applyFilters);
loadMoreBtn.addEventListener('click', renderBatch);

initPokedex();