# UF Intelligence Dashboard

Dashboard interativo em HTML, CSS e JavaScript para explorar indicadores estaduais do Brasil entre 2010 e 2020, com foco inicial em IDH.

## O que tem

- KPIs de patentes, PIB, IDH e P&D/PIB.
- Filtros por ano, regiao, UF e busca.
- Alternancia entre tema dark e white.
- Ranking clicavel por UF.
- Serie temporal da metrica selecionada.
- Dispersao P&D x patentes.
- Resumo regional.
- Heatmap por regiao e ano, com escala de IDH:
  - Baixo: abaixo de 0,555
  - Medio: 0,555 a 0,699
  - Alto: 0,700 a 0,799
  - Muito alto: 0,800 ou mais
- Tabela detalhada e exportacao CSV.

## Como abrir

Abra `index.html` diretamente no navegador.

## Arquivos principais

- `index.html`: estrutura do dashboard.
- `styles.css`: layout, temas e responsividade.
- `app.js`: logica de filtros, graficos e interacoes.
- `data.js`: dados ja convertidos para uso no navegador.
- `build_dashboard_data.py`: script usado para gerar `data.js` a partir da planilha original.
- `smoke_test_dashboard.js`: teste simples de carregamento/renderizacao.

## Publicar no GitHub Pages

Depois de subir o repositorio no GitHub:

1. Abra `Settings`.
2. Entre em `Pages`.
3. Em `Build and deployment`, escolha `Deploy from a branch`.
4. Selecione a branch `main` e a pasta `/root`.
5. Salve e aguarde o link publicado.
