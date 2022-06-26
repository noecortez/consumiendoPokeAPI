const urlPokemons = 'https://pokeapi.co/api/v2';

const containerCards = document.getElementById('container-cards');
const btnPrevius = document.getElementById('previus');
const btnNext = document.getElementById('next');

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


async function fetchPokemons(offset, limit) {
  for (let index = offset; index <= offset + limit; index++) {
    let pokemonInfo = await getFetchPokemonData(index, 'pokemon');
    createCard(pokemonInfo);
  }
}

async function getFetchPokemonData(id, endpoint) {
  const response = await fetch(`${urlPokemons}/${endpoint}/${id}`);
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


fetchPokemons(offset, limit);
