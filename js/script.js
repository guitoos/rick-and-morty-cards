/* ==========================================================================
   Portal C-137 - Rick and Morty
   Autor: Guilherme Oliveira Silva Santos - RA 143422
   Disciplina: Web Programming For Front-End - UniFECAF

   Este arquivo e responsavel por TODO o conteudo dinamico da pagina:
   nenhum card existe no HTML, todos sao criados aqui com document.createElement()
   e inseridos na pagina com appendChild(), a partir dos dados que chegam da
   Rick and Morty API atraves do fetch().
   ========================================================================== */

"use strict";

/* ==========================================================================
   1. CONFIGURACAO
   ========================================================================== */

// URL base da API publica (nao exige token nem cadastro)
const API_BASE = "https://rickandmortyapi.com/api";
const API_PERSONAGENS = API_BASE + "/character";

// Traducoes para exibir os dados da API (que vem em ingles) em portugues
const TRADUCAO_STATUS = {
  Alive: "Vivo",
  Dead: "Morto",
  unknown: "Desconhecido"
};

const TRADUCAO_GENERO = {
  Male: "Masculino",
  Female: "Feminino",
  Genderless: "Sem gênero",
  unknown: "Desconhecido"
};

const TRADUCAO_ESPECIE = {
  Human: "Humano",
  Alien: "Alienígena",
  Humanoid: "Humanoide",
  Robot: "Robô",
  Animal: "Animal",
  Cronenberg: "Cronenberg",
  Disease: "Doença",
  Poopybutthole: "Poopybutthole",
  "Mythological Creature": "Criatura mitológica",
  unknown: "Desconhecida"
};

/* ==========================================================================
   2. ESTADO DA APLICACAO
   ========================================================================== */

const estado = {
  paginaAtual: 1,
  totalPaginas: 1,
  totalResultados: 0,
  carregando: false,
  apenasFavoritos: false,
  filtros: {
    name: "",
    status: "",
    species: "",
    gender: ""
  },
  // Favoritos ficam salvos no navegador (localStorage) e sobrevivem ao F5
  favoritos: carregarFavoritosSalvos()
};

/* ==========================================================================
   3. ATALHOS PARA OS ELEMENTOS DO HTML
   ========================================================================== */

const grade = document.getElementById("grade-cards");
const resultadoInfo = document.getElementById("resultado-info");
const estadoCarregando = document.getElementById("estado-carregando");
const estadoErro = document.getElementById("estado-erro");
const mensagemErro = document.getElementById("mensagem-erro");
const btnCarregarMais = document.getElementById("btn-carregar-mais");
const btnTentarNovamente = document.getElementById("btn-tentar-novamente");
const btnFavoritos = document.getElementById("btn-favoritos");
const btnLimpar = document.getElementById("btn-limpar");
const formFiltros = document.getElementById("filtros");
const inputBusca = document.getElementById("busca");
const selectStatus = document.getElementById("filtro-status");
const selectEspecie = document.getElementById("filtro-especie");
const selectGenero = document.getElementById("filtro-genero");
const modal = document.getElementById("modal");
const modalConteudo = document.getElementById("modal-conteudo");

/* ==========================================================================
   4. CONSUMO DA API - FETCH
   ========================================================================== */

/**
 * Monta a URL do endpoint /character juntando os filtros escolhidos pelo usuario.
 * Exemplo gerado: https://rickandmortyapi.com/api/character?page=2&name=rick&status=alive
 */
function montarUrl() {
  const parametros = new URLSearchParams();
  parametros.append("page", estado.paginaAtual);

  if (estado.filtros.name) parametros.append("name", estado.filtros.name);
  if (estado.filtros.status) parametros.append("status", estado.filtros.status);
  if (estado.filtros.species) parametros.append("species", estado.filtros.species);
  if (estado.filtros.gender) parametros.append("gender", estado.filtros.gender);

  return API_PERSONAGENS + "?" + parametros.toString();
}

/**
 * Funcao principal: busca os personagens na API usando fetch() + then().
 * @param {boolean} adicionar - true quando o usuario clica em "Carregar mais"
 *                              (mantem os cards atuais e acrescenta os novos).
 */
function buscarPersonagens(adicionar = false) {
  if (estado.carregando) return;

  estado.carregando = true;
  mostrarCarregando(true);
  esconderErro();

  if (!adicionar) {
    grade.innerHTML = ""; // limpa a area antes de desenhar uma nova busca
  }

  const url = montarUrl();
  console.log("[Portal C-137] Requisição GET ->", url);

  // ------- CONSUMO DA API COM FETCH -------
  fetch(url)
    .then(function (resposta) {
      // O fetch so rejeita em falha de rede; erros HTTP precisam ser tratados na mao
      if (resposta.status === 404) {
        throw new Error("SEM_RESULTADO");
      }
      if (!resposta.ok) {
        throw new Error("Erro HTTP " + resposta.status);
      }
      return resposta.json(); // transforma o corpo da resposta em objeto JavaScript
    })
    .then(function (dados) {
      // "dados" tem duas chaves: info (paginacao) e results (lista de personagens)
      console.log("[Portal C-137] Resposta da API:", dados);

      estado.totalPaginas = dados.info.pages;
      estado.totalResultados = dados.info.count;

      renderizarCards(dados.results, adicionar);
      atualizarResultadoInfo();
      atualizarBotaoCarregarMais();
    })
    .catch(function (erro) {
      if (erro.message === "SEM_RESULTADO") {
        // 404 da API = nenhum personagem bate com os filtros
        grade.innerHTML = "";
        estado.totalPaginas = 1;
        estado.totalResultados = 0;
        mostrarVazio();
        atualizarResultadoInfo();
        atualizarBotaoCarregarMais();
      } else {
        console.error("[Portal C-137] Falha na requisição:", erro);
        mostrarErro("Não foi possível carregar os personagens. Verifique sua conexão e tente novamente.");
      }
    })
    .finally(function () {
      estado.carregando = false;
      mostrarCarregando(false);
    });
}

/**
 * Busca apenas os personagens marcados como favoritos.
 * A API aceita varios IDs de uma vez: /character/1,2,3
 */
function buscarFavoritos() {
  const ids = Array.from(estado.favoritos);

  grade.innerHTML = "";
  esconderErro();
  atualizarBotaoCarregarMais();

  if (ids.length === 0) {
    mostrarVazio("Nenhum favorito ainda", "Clique no coração de um card para guardar o personagem aqui.");
    resultadoInfo.textContent = "";
    return;
  }

  mostrarCarregando(true);

  fetch(API_PERSONAGENS + "/" + ids.join(","))
    .then(function (resposta) {
      if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);
      return resposta.json();
    })
    .then(function (dados) {
      // Quando ha um unico ID a API devolve um objeto, e nao uma lista
      const lista = Array.isArray(dados) ? dados : [dados];
      renderizarCards(lista, false);
      resultadoInfo.innerHTML =
        "Exibindo <strong>" + lista.length + "</strong> personagem(ns) favorito(s).";
    })
    .catch(function (erro) {
      console.error("[Portal C-137] Falha ao carregar favoritos:", erro);
      mostrarErro("Não foi possível carregar seus favoritos.");
    })
    .finally(function () {
      mostrarCarregando(false);
    });
}

/**
 * Carrega os numeros do topo da pagina (personagens, locais e episodios).
 * Mostra que os dados sao reais e vindos da API no momento do acesso.
 */
function carregarEstatisticas() {
  // Observacao: o endpoint raiz (/api) nao envia o cabecalho CORS, entao
  // consultamos os tres endpoints de listagem diretamente, em paralelo.
  Promise.all([
    fetch(API_BASE + "/character").then(function (r) { return r.json(); }),
    fetch(API_BASE + "/location").then(function (r) { return r.json(); }),
    fetch(API_BASE + "/episode").then(function (r) { return r.json(); })
  ])
    .then(function (respostas) {
      animarNumero(document.getElementById("total-personagens"), respostas[0].info.count);
      animarNumero(document.getElementById("total-locais"), respostas[1].info.count);
      animarNumero(document.getElementById("total-episodios"), respostas[2].info.count);
    })
    .catch(function (erro) {
      console.warn("[Portal C-137] Não foi possível carregar as estatísticas:", erro);
    });
}

/* ==========================================================================
   5. CRIACAO DOS CARDS - DOM MANIPULATION
   ========================================================================== */

/**
 * Cria UM card de personagem inteiramente em JavaScript.
 * Cada pedaco do card nasce de document.createElement() e e encaixado
 * no elemento pai com appendChild().
 *
 * @param {Object} personagem - objeto vindo do array "results" da API
 * @returns {HTMLElement} o elemento <article> pronto para ser inserido na pagina
 */
function criarCard(personagem) {
  // ----- Elemento raiz do card -----
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.id = personagem.id;

  /* ----- TOPO: nome do personagem + coracao de favorito ----- */
  const topo = document.createElement("div");
  topo.className = "card__topo";

  const nome = document.createElement("h3");
  nome.className = "card__nome";
  nome.textContent = personagem.name; // textContent evita injecao de HTML

  const botaoFavorito = document.createElement("button");
  botaoFavorito.type = "button";
  botaoFavorito.className = "card__favorito";
  botaoFavorito.setAttribute("aria-label", "Favoritar " + personagem.name);

  if (estado.favoritos.has(personagem.id)) {
    botaoFavorito.classList.add("ativo");
  }

  // Icone de coracao em SVG, criado com o namespace correto
  botaoFavorito.appendChild(criarIconeCoracao());

  // Evento de clique: marca/desmarca o favorito
  botaoFavorito.addEventListener("click", function () {
    alternarFavorito(personagem.id, botaoFavorito);
  });

  topo.appendChild(nome);
  topo.appendChild(botaoFavorito);

  /* ----- IMAGEM + ETIQUETA DE STATUS ----- */
  const figura = document.createElement("figure");
  figura.className = "card__figura";

  const imagem = document.createElement("img");
  imagem.className = "card__imagem";
  imagem.src = personagem.image;
  imagem.alt = "Ilustração do personagem " + personagem.name;
  imagem.loading = "lazy";

  const status = document.createElement("span");
  status.className = "card__status card__status--" + personagem.status.toLowerCase();

  const bolinha = document.createElement("span");
  bolinha.className = "card__status-bolinha";

  const textoStatus = document.createElement("span");
  textoStatus.textContent = traduzir(TRADUCAO_STATUS, personagem.status);

  status.appendChild(bolinha);
  status.appendChild(textoStatus);

  figura.appendChild(imagem);
  figura.appendChild(status);

  /* ----- CORPO: demais informacoes do personagem ----- */
  const corpo = document.createElement("div");
  corpo.className = "card__corpo";

  const etiquetas = document.createElement("div");
  etiquetas.className = "card__etiquetas";
  etiquetas.appendChild(criarEtiqueta(traduzir(TRADUCAO_ESPECIE, personagem.species), true));
  etiquetas.appendChild(criarEtiqueta(traduzir(TRADUCAO_GENERO, personagem.gender), false));

  corpo.appendChild(etiquetas);
  corpo.appendChild(criarLinha("Origem", personagem.origin.name));
  corpo.appendChild(criarLinha("Última localização", personagem.location.name));
  corpo.appendChild(criarLinha("Episódios", personagem.episode.length + " aparição(ões)"));

  const botaoDetalhes = document.createElement("button");
  botaoDetalhes.type = "button";
  botaoDetalhes.className = "card__botao-detalhes";
  botaoDetalhes.textContent = "Ver detalhes";
  botaoDetalhes.addEventListener("click", function () {
    abrirModal(personagem);
  });

  corpo.appendChild(botaoDetalhes);

  /* ----- Monta o card final encaixando as tres partes ----- */
  card.appendChild(topo);
  card.appendChild(figura);
  card.appendChild(corpo);

  return card;
}

/** Cria um par "rotulo + valor" usado dentro do corpo do card. */
function criarLinha(rotulo, valor) {
  const linha = document.createElement("div");
  linha.className = "card__linha";

  const spanRotulo = document.createElement("span");
  spanRotulo.className = "card__rotulo";
  spanRotulo.textContent = rotulo;

  const spanValor = document.createElement("span");
  spanValor.className = "card__valor";
  spanValor.textContent = valor && valor !== "unknown" ? valor : "Desconhecida";

  linha.appendChild(spanRotulo);
  linha.appendChild(spanValor);

  return linha;
}

/** Cria uma etiqueta colorida (espécie / gênero). */
function criarEtiqueta(texto, verde) {
  const etiqueta = document.createElement("span");
  etiqueta.className = verde ? "etiqueta etiqueta--verde" : "etiqueta";
  etiqueta.textContent = texto;
  return etiqueta;
}

/** Cria o icone de coracao em SVG (elementos SVG exigem createElementNS). */
function criarIconeCoracao() {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");

  const caminho = document.createElementNS(NS, "path");
  caminho.setAttribute(
    "d",
    "M12 20.5s-7-4.3-9-8.1A5 5 0 0 1 12 6.5a5 5 0 0 1 9 5.9c-2 3.8-9 8.1-9 8.1Z"
  );
  caminho.setAttribute("stroke-linejoin", "round");

  svg.appendChild(caminho);
  return svg;
}

/**
 * Percorre a lista devolvida pela API e insere os cards na pagina.
 * Usa DocumentFragment para tocar no DOM uma unica vez (melhor desempenho).
 */
function renderizarCards(lista, adicionar) {
  if (!adicionar) {
    grade.innerHTML = "";
  }

  if (!lista || lista.length === 0) {
    mostrarVazio();
    return;
  }

  const fragmento = document.createDocumentFragment();

  lista.forEach(function (personagem, indice) {
    const card = criarCard(personagem);
    card.style.animationDelay = (indice % 20) * 0.04 + "s";
    fragmento.appendChild(card); // cada card entra primeiro no fragmento
  });

  grade.appendChild(fragmento); // e aqui tudo e inserido de uma so vez na pagina
}

/** Mensagem exibida quando a busca nao retorna nada. */
function mostrarVazio(titulo, texto) {
  const vazio = document.createElement("div");
  vazio.className = "vazio";

  const emoji = document.createElement("span");
  emoji.className = "vazio__emoji";
  emoji.textContent = "🛸";

  const h3 = document.createElement("h3");
  h3.textContent = titulo || "Nenhum personagem encontrado";

  const p = document.createElement("p");
  p.textContent = texto || "Nenhuma dimensão retornou resultados para esses filtros. Tente outra combinação.";

  vazio.appendChild(emoji);
  vazio.appendChild(h3);
  vazio.appendChild(p);

  grade.appendChild(vazio);
}

/* ==========================================================================
   6. MODAL DE DETALHES
   ========================================================================== */

function abrirModal(personagem) {
  modalConteudo.innerHTML = "";

  const capa = document.createElement("img");
  capa.className = "modal__capa";
  capa.src = personagem.image;
  capa.alt = "Imagem de " + personagem.name;

  const texto = document.createElement("div");
  texto.className = "modal__texto";

  const titulo = document.createElement("h3");
  titulo.id = "modal-nome";
  titulo.textContent = personagem.name;

  const subtitulo = document.createElement("p");
  subtitulo.style.color = "var(--texto-suave)";
  subtitulo.textContent =
    traduzir(TRADUCAO_ESPECIE, personagem.species) +
    " · " +
    traduzir(TRADUCAO_STATUS, personagem.status);

  const lista = document.createElement("ul");
  lista.className = "modal__lista";
  lista.appendChild(criarItemModal("Gênero", traduzir(TRADUCAO_GENERO, personagem.gender)));
  lista.appendChild(criarItemModal("Origem", personagem.origin.name));
  lista.appendChild(criarItemModal("Localização atual", personagem.location.name));
  lista.appendChild(criarItemModal("Total de episódios", String(personagem.episode.length)));
  lista.appendChild(criarItemModal("Tipo", personagem.type ? personagem.type : "Não informado"));

  const itemPrimeiro = criarItemModal("Primeiro episódio", "carregando...");
  lista.appendChild(itemPrimeiro);

  texto.appendChild(titulo);
  texto.appendChild(subtitulo);
  texto.appendChild(lista);

  modalConteudo.appendChild(capa);
  modalConteudo.appendChild(texto);

  modal.hidden = false;
  document.body.style.overflow = "hidden";

  // Segunda requisicao: busca o nome do primeiro episodio do personagem
  if (personagem.episode.length > 0) {
    fetch(personagem.episode[0])
      .then(function (resposta) {
        return resposta.json();
      })
      .then(function (episodio) {
        itemPrimeiro.querySelector("strong").textContent =
          episodio.episode + " - " + episodio.name;
      })
      .catch(function () {
        itemPrimeiro.querySelector("strong").textContent = "Não disponível";
      });
  } else {
    itemPrimeiro.querySelector("strong").textContent = "Não disponível";
  }
}

function criarItemModal(rotulo, valor) {
  const li = document.createElement("li");

  const span = document.createElement("span");
  span.textContent = rotulo;

  const strong = document.createElement("strong");
  strong.textContent = valor;

  li.appendChild(span);
  li.appendChild(strong);
  return li;
}

function fecharModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
}

/* ==========================================================================
   7. FAVORITOS (localStorage)
   ========================================================================== */

function carregarFavoritosSalvos() {
  try {
    const salvo = localStorage.getItem("portal-c137-favoritos");
    return new Set(salvo ? JSON.parse(salvo) : []);
  } catch (erro) {
    return new Set();
  }
}

function salvarFavoritos() {
  try {
    localStorage.setItem(
      "portal-c137-favoritos",
      JSON.stringify(Array.from(estado.favoritos))
    );
  } catch (erro) {
    console.warn("[Portal C-137] Não foi possível salvar os favoritos.", erro);
  }
}

function alternarFavorito(id, botao) {
  if (estado.favoritos.has(id)) {
    estado.favoritos.delete(id);
    botao.classList.remove("ativo");
  } else {
    estado.favoritos.add(id);
    botao.classList.add("ativo");
  }

  salvarFavoritos();
  atualizarContadorFavoritos();

  // Se o usuario esta vendo so os favoritos, recarrega a lista
  if (estado.apenasFavoritos) {
    buscarFavoritos();
  }
}

function atualizarContadorFavoritos() {
  document.getElementById("total-favoritos").textContent = estado.favoritos.size;
}

/* ==========================================================================
   8. ESTADOS DA INTERFACE
   ========================================================================== */

function mostrarCarregando(ativo) {
  estadoCarregando.hidden = !ativo;
}

function mostrarErro(mensagem) {
  mensagemErro.textContent = mensagem;
  estadoErro.hidden = false;
  btnCarregarMais.hidden = true;
}

function esconderErro() {
  estadoErro.hidden = true;
}

function atualizarResultadoInfo() {
  if (estado.totalResultados === 0) {
    resultadoInfo.textContent = "";
    return;
  }

  const exibidos = grade.querySelectorAll(".card").length;
  resultadoInfo.innerHTML =
    "Exibindo <strong>" + exibidos + "</strong> de <strong>" +
    estado.totalResultados + "</strong> personagens · página " +
    estado.paginaAtual + " de " + estado.totalPaginas;
}

function atualizarBotaoCarregarMais() {
  const temMais = !estado.apenasFavoritos && estado.paginaAtual < estado.totalPaginas;
  btnCarregarMais.hidden = !temMais;
}

/** Anima a contagem dos numeros do topo, de 0 ate o valor real. */
function animarNumero(elemento, valorFinal) {
  const duracao = 900;
  const inicio = performance.now();

  function passo(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    elemento.textContent = Math.floor(progresso * valorFinal);
    if (progresso < 1) requestAnimationFrame(passo);
  }

  requestAnimationFrame(passo);
}

/** Devolve a traducao de um valor da API, ou o proprio valor se nao houver. */
function traduzir(dicionario, valor) {
  return dicionario[valor] || valor;
}

/** Evita disparar uma requisicao a cada tecla digitada na busca. */
function debounce(funcao, espera) {
  let temporizador;
  return function () {
    const argumentos = arguments;
    clearTimeout(temporizador);
    temporizador = setTimeout(function () {
      funcao.apply(null, argumentos);
    }, espera);
  };
}

/* ==========================================================================
   9. EVENTOS
   ========================================================================== */

/** Reinicia a busca a partir da pagina 1 com os filtros atuais. */
function aplicarFiltros() {
  estado.paginaAtual = 1;
  estado.filtros.name = inputBusca.value.trim();
  estado.filtros.status = selectStatus.value;
  estado.filtros.species = selectEspecie.value;
  estado.filtros.gender = selectGenero.value;

  if (estado.apenasFavoritos) {
    estado.apenasFavoritos = false;
    btnFavoritos.setAttribute("aria-pressed", "false");
  }

  buscarPersonagens(false);
}

// Busca com atraso de 450ms apos o usuario parar de digitar
inputBusca.addEventListener("input", debounce(aplicarFiltros, 450));

// Os selects reagem imediatamente
selectStatus.addEventListener("change", aplicarFiltros);
selectEspecie.addEventListener("change", aplicarFiltros);
selectGenero.addEventListener("change", aplicarFiltros);

// Impede o envio do formulario (que recarregaria a pagina)
formFiltros.addEventListener("submit", function (evento) {
  evento.preventDefault();
  aplicarFiltros();
});

// Botao "Limpar": zera todos os campos e refaz a busca desde a pagina 1
btnLimpar.addEventListener("click", function () {
  inputBusca.value = "";
  selectStatus.value = "";
  selectEspecie.value = "";
  selectGenero.value = "";
  aplicarFiltros();
});

// Botao "Favoritos": alterna entre a listagem da API e a lista local
btnFavoritos.addEventListener("click", function () {
  estado.apenasFavoritos = !estado.apenasFavoritos;
  btnFavoritos.setAttribute("aria-pressed", String(estado.apenasFavoritos));

  if (estado.apenasFavoritos) {
    buscarFavoritos();
  } else {
    aplicarFiltros();
  }
});

// Paginacao: avanca uma pagina e acrescenta os novos cards aos existentes
btnCarregarMais.addEventListener("click", function () {
  if (estado.paginaAtual < estado.totalPaginas) {
    estado.paginaAtual++;
    buscarPersonagens(true);
  }
});

btnTentarNovamente.addEventListener("click", function () {
  buscarPersonagens(false);
});

// Fechar o modal: clique no X, clique no fundo ou tecla ESC
document.querySelectorAll("[data-fechar-modal]").forEach(function (elemento) {
  elemento.addEventListener("click", fecharModal);
});

document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape" && !modal.hidden) {
    fecharModal();
  }
});

/* ==========================================================================
   10. INICIALIZACAO
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {
  console.log("%c Portal C-137 aberto! ", "background:#97ce4c;color:#0b0c14;font-weight:bold;");
  atualizarContadorFavoritos();
  carregarEstatisticas();
  buscarPersonagens(false); // primeira carga dos cards
});
