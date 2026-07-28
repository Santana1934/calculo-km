# 🚗 Controle de KM Pessoal

Aplicativo web progressivo (PWA) desenvolvido para o controle de quilometragem rodada, gestão de parâmetros financeiros,
cálculo de reembolso e controle de combustível em rotas de atendimento externo.

---

## 📱 Sobre o Projeto
O sistema foi desenhado para uso em dispositivos móveis, permitindo registrar paradas de forma prática
(seja informando o odômetro do painel ou a distância direta do trecho), acompanhar o histórico diário,
calcular a sobra líquida real e gerar relatórios operacionais formatados para impressão em PDF.

## ⚙️ Tecnologias Utilizadas
* **HTML5** — Estruturação das telas e componentes visuais.
* **CSS3** — Estilização personalizada (*Dark Mode* / *Slate*) e layout responsivo.
* **JavaScript (Vanilla)** — Lógica de cálculo, manipulação do DOM e persistência local (`localStorage`).
* **PWA (Progressive Web App)** — Suporte a instalação na tela inicial do celular e funcionamento offline via Service Worker (`sw.js`).

## 🚀 Funcionalidades Principais
* **Modo Duplo de Entrada:** Escolha entre o cálculo por odômetro (`KM Atual - KM Anterior`) ou inserção direta da distância do trecho.
* **Parâmetros Financeiros Customizáveis:** Gestão de ajuda de custo fixa, taxa por KM da empresa e gastos com cartão corporativo/combustível.
* **Resumo e Gráficos:** Acompanhamento em tempo real do total rodado, clientes atendidos e reembolso total.
* **Relatório em PDF:** Formatação limpa e profissional para impressão e prestação de contas.
