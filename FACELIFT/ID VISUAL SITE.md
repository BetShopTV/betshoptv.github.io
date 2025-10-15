`gpt vip conta betshoptv@gmail.com`

`14/10/2025 - lá pras 20:30`

# **`🧱 NÚCLEO BSTV — CONSOLIDANDO BASE`**

### **`Documento de Estrutura, Diagnóstico e Direcionamento para o Sistema Visual e Funcional do Site BSTV`**

*`(versão 2025.10 — Pedro & ChatGPT)`*

---

## **`🧭 1. CONTEXTO GERAL`**

`O projeto BSTV é um ecossistema de páginas interligadas (Ofertas, Rifas, Checkout, Feed, etc.) que compartilham uma mesma espinha dorsal visual e comportamental.`  
 `Essa espinha é chamada aqui de Núcleo BSTV, composta por três partes inseparáveis:`

1. **`Galeria de Peças`** `(grid principal de exibição)`

2. **`Painel Branco de Apostas`** `(área expansível com thumbs e resumo da seleção)`

3. **`Rodapé Vermelho — Central de Apostas`** `(barra fixa inferior, persistente entre seções)`

---

## **`⚠️ 2. DESAFIOS E FRUSTRAÇÕES ENCONTRADOS`**

### **`2.1. Regressões constantes entre versões`**

`Cada nova tentativa de ajuste (visual ou funcional) acabava quebrando algo que já estava consolidado.`  
 `Causas principais:`

* `Códigos reescritos do zero a cada versão, sem controle incremental.`

* `Pequenas variações de medida e comportamento não eram reaplicadas de forma consistente.`

* `Alterações visuais sobrepunham funções já resolvidas (e vice-versa).`

### **`2.2. Conflito entre “função” e “forma”`**

* `Em algumas fases, priorizamos a estética (layout seco, alinhamentos, proporções).`

* `Em outras, priorizamos a lógica (seleção, JSON, contadores, envio de dados).`  
   `Faltou uma base que mantivesse ambos integrados — uma fundação visual e de código estável.`

### **`2.3. Falta de um sistema de proporções fixo e hierárquico`**

* `A largura e altura de colunas, thumbs e rodapé variavam entre versões.`

* `Isso comprometia a responsividade e quebrava o ritmo visual.`

* `O comportamento “painel sobe sobre rodapé” nem sempre funcionava igual.`

### **`2.4. Inconsistência entre fontes e escalas de tipografia`**

* `As fontes “Condensed” e “Regular” foram bem definidas (com base em Barbara Kruger e Shopee).`

* `Mas os tamanhos variavam sem hierarquia clara (ex: labels maiores que títulos).`

### **`2.5. Estrutura não persistente entre páginas`**

* `Itens selecionados na página de Ofertas não persistiam quando o usuário ia para Rifas ou Checkout.`

* `A Central de Apostas precisava “viajar junto” entre páginas — o que exige um núcleo compartilhado.`

---

## **`🔧 3. OBJETIVO DO NÚCLEO BSTV`**

`Estabelecer um modelo único de layout e comportamento, sólido, imutável e replicável, que funcione em todas as páginas do site, sem perdas de consistência.`

### **`3.1. Elementos que compõem o Núcleo`**

| `Bloco` | `Função` | `Cores` | `Comportamento` |
| ----- | ----- | ----- | ----- |
| `Galeria de Peças` | `Área principal de exibição (grid fixo de 3 colunas).` | `Fundo #bebab0; bordas vermelhas #ff0000 apenas em itens selecionados.` | `Seleção múltipla; clique em imagem adiciona ou remove peça do carrinho.` |
| `Painel Branco` | `Expansão superior do rodapé com lista horizontal de thumbs.` | `Fundo #ffffff; borda-top 2px solid #ffffff; barra de rolagem vermelha #ff0000.` | `Surge ao clicar no rodapé; exibe thumbs com botão “X” para remoção. Persiste aberto até ser fechado manualmente.` |
| `Rodapé Vermelho (Central de Apostas)` | `Hub de navegação entre “Peças” e “Rifas”, com contadores e título.` | `Fundo #ff0000; textos e ícones brancos #ffffff; inativos #bebab0; contadores com fundo branco #ffffff e texto vermelho.` | `Fixado ao fim da tela; abre/fecha o painel branco; mantém contadores de seleção.` |

---

## **`🎨 4. PRINCÍPIOS VISUAIS E DE DESIGN`**

1. **`Design seco / brutalista`**

   * `Nenhuma sombra, gradiente ou transparência.`

   * `Somente blocos planos e cores sólidas.`

   * `Bordas apenas quando estritamente necessárias (1–2px).`

   * `Sem cantos arredondados.`

2. **`Paleta única e institucional`**

| `Cor` | `Função` | `Hex` |
| ----- | ----- | ----- |
| `Vermelho` | `Ativo / destaque` | `#ff0000` |
| `Branco` | `Fundo / texto ativo` | `#ffffff` |
| `Bege` | `Neutro / inativo` | `#bebab0` |
| `Preto` | `Texto / contraste` | `#2b2424` |

3. 

4. **`Grade estrutural fixa`**

   * `3 colunas sempre, tanto em desktop quanto em mobile.`

   * `No desktop: largura máxima 1200px, centralizada.`

   * `No mobile: ocupa 100% da tela com margens laterais de 4px.`

   * `As imagens nunca são cortadas verticalmente (altura variável, largura 100%).`

5. **`Tipografia unificada`**

   * `Títulos e preços no feed → Regular.`

   * `Campos funcionais (rodapé, botões, labels) → Condensed / Semi-condensed.`

   * `Contraste alto, corpo forte, letras em caixa alta onde cabível.`

6. **`Comportamento responsivo`**

   * `Escalas e ícones dimensionados via clamp().`

   * `Elementos nunca saem da tela nem sobrepõem a galeria.`

   * `O painel branco nunca ultrapassa 30% da altura da viewport.`

---

## **`🔁 5. FUNCIONALIDADES NUCLEARES`**

| `Função` | `Descrição` | `Status` |
| ----- | ----- | ----- |
| `Seleção múltipla de peças` | `Clicar em várias imagens adiciona todas ao carrinho (sem limpar as anteriores).` | `✅ Consolidado` |
| `Leitura JSON (id_peca, imagens, preco, etc.)` | `Mantém lógica simples e direta do newgdo30.` | `✅ Consolidado` |
| `Contadores ativos no rodapé` | `Mostram quantos itens estão selecionados.` | `✅ Consolidado` |
| `Painel Branco expansível` | `Exibe thumbs das peças selecionadas; botão “X” remove item.` | `✅ Consolidado` |
| `Fechamento inteligente do painel` | `Fecha ao clicar fora, pressionar ESC ou clicar novamente na barra.` | `✅ Consolidado` |
| `Rodapé fixo` | `Persiste em todas as páginas (estrutura compartilhada).` | `🔄 Em implementação` |
| `Persistência entre páginas` | `Seleções permanecem ao navegar (via localStorage).` | `🚧 Próximo passo` |

---

## **`🧩 6. OBJETIVO FINAL`**

`Construir um núcleo universal de layout e comportamento, estável o bastante para ser replicado com:`

* `Diferentes fontes de dados (peças, rifas, artistas, exposições);`

* `Diferentes seções (feed, checkout, catálogo);`

* `Sem alterar o código base (somente o JSON e os labels).`

`Esse Núcleo BSTV é o “sistema operacional visual” do site.`  
 `A partir dele, novas páginas apenas herdam o layout e plugam seus conteúdos.`

---

## **`🧠 7. PRÓXIMOS PASSOS`**

| `Etapa` | `Ação` | `Prioridade` |
| ----- | ----- | ----- |
| `1. Base estável (bstv_core_layout.html)` | `Unificar newgdo30 + layout seco final (ID VISUAL SITE).` | `🚀` |
| `2. Persistência de seleção` | `Implementar localStorage para manter carrinho ativo entre páginas.` | `Alta` |
| `3. Integração Rifas + Checkout` | `Ligar o mesmo sistema aos outros JSONs e à planilha via Apps Script.` | `Média` |
| `4. Ajuste fino de fontes e tamanhos` | `Aplicar as proporções tipográficas fixas (Condensed / Regular).` | `Média` |
| `5. Modularização e reuso` | `Transformar em módulo JS e CSS reaproveitável por todo o site.` | `Pós-base` |

---

## **`💬 8. SÍNTESE EMOCIONAL / CONCEITUAL`**

`“O núcleo BSTV é como o palco fixo de uma performance contínua —`  
 `cada página é uma cena, mas o chão, as luzes e o som permanecem os mesmos.”`

`O código que construiremos a seguir é a fundação única sobre a qual`  
 `o resto do site vai respirar, navegar e evoluir.`

---

`✨ Resumo final:`

* `O newgdo30 é a referência funcional.`

* `O “ID VISUAL SITE” é a referência estética.`

* `O “Núcleo BSTV” que vamos codar agora é a fusão definitiva dessas duas forças.`

