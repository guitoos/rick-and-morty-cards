# Portal C-137 — Catálogo de personagens de Rick and Morty

Aplicação front-end que consome a [Rick and Morty API](https://rickandmortyapi.com/) e exibe
os personagens em **cards criados dinamicamente pelo JavaScript**.

Trabalho da disciplina **Web Programming For Front-End** — UniFECAF.

- **Aluno:** Guilherme Oliveira Silva Santos

🔗 **Site no ar:** https://guitoos.github.io/rick-and-morty-cards/

---

## Como executar

**Opção 1 — abrir direto:** dê dois cliques em `index.html`.
A API envia o cabeçalho `Access-Control-Allow-Origin: *`, então o projeto funciona mesmo
pelo protocolo `file://`.

**Opção 2 — servidor local (recomendado):**

```bash
# com a extensão Live Server do VS Code: clique direito em index.html > "Open with Live Server"

# ou, com Python instalado:
python -m http.server 5500

# ou, com Node.js instalado:
npx serve .
```

Depois acesse `http://localhost:5500`.

---

## Estrutura do projeto

```
rick-and-morty-cards/
├── index.html          # estrutura da página (não contém nenhum card estático)
├── css/
│   └── style.css       # estilos, tema e responsividade — CSS puro, sem frameworks
├── js/
│   └── script.js       # consumo da API com fetch e criação dos cards no DOM
└── README.md
```

---

## Requisitos do trabalho e onde cada um foi atendido

| Requisito | Onde está |
|---|---|
| Interface em HTML + CSS puro, sem frameworks | `index.html` e `css/style.css` |
| Consumo da API com `fetch` | `js/script.js` → `buscarPersonagens()`, `buscarFavoritos()`, `carregarEstatisticas()` |
| Cards criados dinamicamente, não estáticos | `js/script.js` → `criarCard()` usa `createElement` e `appendChild` |
| Nome do personagem no card | `criarCard()` → elemento `<h3 class="card__nome">` |
| Imagem no card | `criarCard()` → elemento `<img class="card__imagem">` |
| Status / descrição adicional | etiqueta de status, espécie, gênero, origem, localização e nº de episódios |
| Layout organizado e coerente com o tema | paleta do portal verde, fontes Baloo 2 + Space Grotesk, ícones SVG próprios |
| Responsividade | grid fluido + media queries em `css/style.css` |

---

## Funcionalidades

- **Cards dinâmicos** — todo card nasce de `document.createElement()` e entra na página
  via `appendChild()`. O HTML entrega apenas o contêiner vazio `#grade-cards`.
- **Busca por nome** com *debounce* de 450 ms (evita uma requisição por tecla digitada).
- **Filtros** de status, espécie e gênero, enviados como parâmetros de query para a API.
- **Paginação** com o botão "Carregar mais personagens" (20 por página, 42 páginas).
- **Favoritos** salvos no `localStorage`, com aba própria que busca os personagens
  por vários IDs de uma vez (`/character/1,2,3`).
- **Modal de detalhes** que dispara uma segunda requisição para descobrir o nome do
  primeiro episódio em que o personagem apareceu.
- **Estatísticas em tempo real** no topo (total de personagens, locais e episódios),
  com animação de contagem.
- **Tratamento de estados**: carregando, erro de rede, e resultado vazio (HTTP 404).
- **Acessibilidade**: `aria-label`, `aria-live`, foco visível, textos alternativos nas
  imagens e respeito a `prefers-reduced-motion`.

---

## Sobre a API utilizada

| Item | Descrição |
|---|---|
| URL base | `https://rickandmortyapi.com/api` |
| Autenticação | Não exige token, chave nem cadastro |
| Método | `GET` (API somente leitura) |
| Endpoint principal | `/character?page=1&name=&status=&species=&gender=` |
| Resposta | JSON com `info` (paginação) e `results` (lista de personagens) |
| Paginação | 20 personagens por página, 42 páginas, 826 personagens |
| Limite de requisições | Sem limite rígido documentado; o projeto usa *debounce* para reduzir chamadas |
| CORS | `Access-Control-Allow-Origin: *` nos endpoints de listagem |

> Observação encontrada durante o desenvolvimento: o endpoint raiz (`/api`) **não** envia
> cabeçalho CORS, por isso as estatísticas consultam `/character`, `/location` e `/episode`
> diretamente, em paralelo com `Promise.all`.

---

## Tecnologias

- HTML5 semântico
- CSS3 puro (variáveis, Grid, Flexbox, animações, media queries)
- JavaScript ES6+ (Fetch API, Promises, `localStorage`, manipulação do DOM)

Sem bibliotecas, sem frameworks e sem etapa de build.

---

## Créditos

Dados fornecidos pela [Rick and Morty API](https://rickandmortyapi.com/), criada por Axel Fuhrmann.
Rick and Morty é propriedade de Adult Swim / Warner Bros. Discovery.
Projeto acadêmico, sem fins lucrativos.
