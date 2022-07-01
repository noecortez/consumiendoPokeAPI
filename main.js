const urlPokemons = 'https://pokeapi.co/api/v2';

const containerCards = document.getElementById('container-cards');
const btnPrevius = document.getElementById('previus');
const btnNext = document.getElementById('next');

const formSearch = document.querySelector('form');
const searchBox = document.getElementById('search-box');

let limit = 5;
let offset = 1;

btnPrevius.addEventListener('click', () => {
  if (offset != 1) {
    offset -= 6;
    removeChildNodes(containerCards);
    fetchPokemons(offset, limit);
    btnPrevius.className = 'page-item';
  } else { btnPrevius.className = 'page-item disabled'; }
});

btnNext.addEventListener('click', () => {
  offset += 6;
  removeChildNodes(containerCards);
  fetchPokemons(offset, limit);
  btnPrevius.className = 'page-item';
});

searchBox.addEventListener('input', async ({target}) => {
  let pokemonSuggestion = target.value;
  let autoCompleteValues = [];

  if (pokemonSuggestion) {
    const response = await fetch(urlPokemons + '/pokemon/?limit=1000');
    const data = await response.json();

    autoCompleteValues = data.results.filter(({name}) => {
      const lowerCasePokemon = name.toLowerCase();
      const lowerCaseSuggestion = pokemonSuggestion.toLowerCase();

      return lowerCasePokemon.includes(lowerCaseSuggestion);
    });

    document.querySelector('.dropdown-menu').innerHTML = `
      ${autoCompleteValues.map(result => {
        return (
          `<li class="dropdown-item" onClick="selectPokemon('${result.name}')">${result.name}</li>`
        );
      }).join('')}
    `;
  } else {
    document.querySelector('.dropdown-menu').innerHTML = 'Escribe un pokemon';
  }
});

formSearch.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (searchBox.value == '')
    throw createAlert('Favor, complete el campo para hacer la busqueda', 'danger');

  removeChildNodes(containerCards);
  document.querySelector('.spinner-border').classList.remove('hidden');

  const pokemon = await getFetchPokemonData(searchBox.value.toLowerCase(), 'pokemon');

  if (pokemon) {
    document.querySelector('.spinner-border').classList.add('hidden');
    createCard(pokemon);
  } else {
    document.querySelector('.spinner-border').classList.add('hidden');
    fetchPokemons(offset, limit);
  }

  searchBox.value = '';
});

function selectPokemon(name) {
  searchBox.value = name;
}

async function fetchPokemons(offset, limit) {
  for (let index = offset; index <= offset + limit; index++) {
    let pokemonInfo = await getFetchPokemonData(index, 'pokemon');
    createCard(pokemonInfo);
  }
}

async function getFetchPokemonData(id, endpoint) {
  const response = await fetch(`${urlPokemons}/${endpoint}/${id}`);

  if (response.status == 404) {
    createAlert('El recurso no fue encontrado', 'danger');
    return;
  }

  const pokemonInfo = await response.json();
  return pokemonInfo;
}

function createCard(
  {
    id,
    name,
    abilities,
    base_experience,
    sprites,
    types
  }
) {
  const nameCapitalize = name.charAt(0).toUpperCase() + name.slice(1);
  let templateTypes = '';
  let templateAbilities = '';


  types.forEach(type => {
    templateTypes += `
      <span class="badge rounded-pill text-bg-secondary mx-1 my-1">${type.type.name}</span>
    `;
  });

  abilities.forEach(ability => {
    templateAbilities += `
      <span class="badge rounded-pill text-bg-primary mx-1 my-1">${ability.ability.name}</span>
    `;
  });

  const templateCard = `
    <div class="col">
      <div class="card">
        <h1 class="pt-2 ps-4">#${id}</h1>
        <img
          src="${sprites.other.dream_world.front_default}"
          class="card-img-top p-2" height="150"
        />
        <div class="card-body text-center">
          <h2 class="card-title">${nameCapitalize}</h2>
          <p class="lead">Base de experiencia: ${base_experience}</p>
          <div class="row my-4">
            <div class="col-8">
              <h6>Habilidades</h6>
              ${templateAbilities}
            </div>
            <div class="col-4">
              <h6>Tipos</h6>
              ${templateTypes}
            </div>
          </div>
          <button
            class="w-100 btn btn-lg btn-outline-primary"
            data-bs-toggle="modal"
            data-bs-target="#staticBackdrop"
            onClick="createModal(${id});"
          >
            Ver ${nameCapitalize}
          </button>
        </div>
      </div>
    </div>
  `;

  containerCards.innerHTML += templateCard;
}

function getIdURL(url) {
  let idSplit = url.split('/');
  return idSplit[idSplit.length - 2];
}

async function createModal(id) {
  const containerModal = document.querySelector('#staticBackdrop .modal-dialog.modal-dialog-centered');
  containerModal.innerHTML = '';

  const pokemonInfo = await getFetchPokemonData(id, 'pokemon');
  const {
    evolution_chain,
    flavor_text_entries
  } = await getFetchPokemonData(id, 'pokemon-species');

  let idEvolutionChain = getIdURL(evolution_chain.url);

  let {chain} = await getFetchPokemonData(idEvolutionChain, 'evolution-chain');
  let templateEvolutions = '';

  while (chain.hasOwnProperty('evolves_to')) {
    let pokemon = await getFetchPokemonData(getIdURL(chain.species.url), 'pokemon');
    templateEvolutions += `
      <div class="d-flex flex-column align-items-center col">
        <img
          src="${pokemon.sprites.front_default}"
        />
        <h6 class="mt-0">${chain.species.name}</h6>
      </div>
    `;

    chain = chain.evolves_to[0];
    if (chain == undefined) {
      break;
    }
  }

  const nameCapitalize = pokemonInfo.name.charAt(0).toUpperCase() + pokemonInfo.name.slice(1);
  const languageInfo = flavor_text_entries.find(flavor => flavor.language.name == 'es');

  let templateStats = '';

  pokemonInfo.stats.forEach(stat => {
    templateStats += `
      <span class="badge rounded-pill text-bg-primary mx-1 my-1">${stat.stat.name}: ${stat.base_stat}</span>
    `;
  });

  let templateContentModal = `
  <div class="modal-content">
    <div class="modal-header">
      <img src="${pokemonInfo.sprites.front_default}" />
      <div class="col">
        <h5 class="modal-title">${nameCapitalize}</h5>
        <p class="text-muted m-0">Experiencia base: ${pokemonInfo.base_experience}</p>
        <div class="types"></div>
      </div>
      <h1 class="me-3">#${pokemonInfo.id}</h1>
    </div>
    <div class="modal-body row">
      <p class="lead">Descripción</p>
      <p class="small">${languageInfo.flavor_text}</p>
      <div class="col-8">
        <p class="lead">Estadísticas</p>
        ${templateStats}
      </div>
      <div class="col-4">
        <img
          src="${pokemonInfo.sprites.other.dream_world.front_default}"
          class="col"
          height="140"
        />
      </div>
      <p class="lead">Evoluciones</p>
      ${templateEvolutions}
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-danger" data-bs-dismiss="modal">Cancelar</button>
      <button type="button" class="btn btn-primary">Comprar ${nameCapitalize}</button>
    </div>
  </div>
  `;

  containerModal.innerHTML = templateContentModal;
}

function removeChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function createAlert(message, color) {
  const templateAlert = `
  <div class="alert alert-${color} alert-dismissible fade show d-flex align-items-center" role="alert">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16" role="img" aria-label="Warning:">
      <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
    </svg>
    <div>
      ${message}
    </div>

    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
  `;

  document.getElementById('alertContainer').innerHTML = templateAlert;
  setTimeout(() => {
    document.getElementById('alertContainer').innerHTML = '';
  }, 4000);
}

fetchPokemons(offset, limit);
