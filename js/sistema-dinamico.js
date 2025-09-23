// SISTEMA DINÂMICO - Carrega dados do Google Sheets automaticamente

class BetShopDinamico {
  constructor() {
    this.produtos = []
    this.produtosFiltrados = []
    this.filtrosAtivos = new Set()
    this.urlJSON = "https://docs.google.com/spreadsheets/d/1qDtC6v3eIiedlGpgR5pF1WrUmU0Gr39F4d2jhr9wHj0/" // Você vai substituir pela URL real
    this.init()
  }

  async init() {
    await this.carregarProdutos()
    this.renderizarGaleria()
    this.atualizarStatus()
  }

  async carregarProdutos() {
    try {
      // URL do Google Sheets público (você precisa configurar isso)
      const SHEET_ID = "1qDtC6v3eIiedlGpgR5pF1WrUmU0Gr39F4d2jhr9wHj0"
      const urlPlanilha = `https://script.google.com/macros/s/AKfycbxfVkjSUnv7wvXnhPLPWi42c2sCai0AgVvlXJldyri_HjqYrc72fi6k7bipI9nd10JO/exec`

      // Para teste, ainda usando dados de exemplo até você configurar o Apps Script
      console.log("Tentando carregar da planilha:", SHEET_ID)

      // Quando o Apps Script estiver funcionando, descomente esta linha:
const response = await fetch(urlPlanilha);
const dados = await response.json();

      // Por enquanto, usando dados de exemplo mais realistas
      const dados = this.dadosReaisDaPlanilha()

      this.produtos = dados.produtos
      this.produtosFiltrados = [...this.produtos]

      console.log(`Carregados ${this.produtos.length} produtos`)
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      document.getElementById("status").innerHTML = "Erro ao carregar produtos"
    }
  }

  dadosReaisDaPlanilha() {
    return {
      ultimaAtualizacao: new Date().toISOString(),
      totalProdutos: 5,
      produtos: [
        {
          id: "05-10",
          img: "4", // Campo IMG da planilha
          grupo: "5",
          peca: "10",
          titulo: "05/02 TV Portátil 02",
          apelido: "Sêo Pinto Abaporu",
          preco: "R$ 250,00",
          precoVenda: "R$ 150,00", // Campo VENDA - se preenchido = vendido
          disponivel: false, // Baseado no campo VENDA
          imagens: ["05-10.avif"],
          tecnica: "EVA Colorido",
          dimensoes: "53 x 15 x 3 cm",
          emExposicao:
            '"Política da Boa Vizinhança"\nCuradoria de Bruna Costa e Rubens Takamine\nxow.rumi / Capacete, Rio de Janeiro\nAté 04 de outubro',
          extra: "03/07",
          cores: "",
          tags: "",
          ondeRepete: "",
        },
        {
          id: "04-07",
          img: "7",
          grupo: "4",
          peca: "07",
          titulo: "04/07 Telefone Vintage",
          apelido: "Telefone Retrô",
          preco: "R$ 800,00",
          precoVenda: "", // Vazio = disponível
          disponivel: true,
          imagens: ["04-07.avif"],
          tecnica: "EVA Colorido",
          dimensoes: "45 x 24 x 4 cm",
          emExposicao: "",
          extra: "",
          cores: "",
          tags: "",
          ondeRepete: "",
        },
        {
          id: "04-02a",
          grupo: "4",
          peca: "02",
          titulo: "04/02 Mesa Decorativa",
          apelido: "Mesa Moderna",
          preco: "R$ 600,00",
          precoVenda: "R$ 400,00",
          disponivel: false, // VENDIDA
          imagens: ["04-02a.avif"],
          tecnica: "Madeira",
          dimensoes: "60 x 40 x 30 cm",
          emExposicao: "",
          extra: "",
          cores: "",
          tags: "",
          ondeRepete: "",
        },
        {
          id: "03-05",
          grupo: "3",
          peca: "05",
          titulo: "03/05 Luminária Moderna",
          apelido: "Luz Ambiente",
          preco: "R$ 400,00",
          precoVenda: "",
          disponivel: true,
          imagens: ["03-05.avif"],
          tecnica: "Metal e Vidro",
          dimensoes: "30 x 30 x 50 cm",
          emExposicao: "",
          extra: "",
          cores: "",
          tags: "",
          ondeRepete: "",
        },
        {
          id: "02-01",
          grupo: "2",
          peca: "01",
          titulo: "02/01 Escultura Abstrata",
          apelido: "Arte Moderna",
          preco: "R$ 1200,00",
          precoVenda: "",
          disponivel: true,
          imagens: ["02-01.avif"],
          tecnica: "Bronze",
          dimensoes: "25 x 25 x 40 cm",
          emExposicao: "Galeria Central - Exposição Permanente",
          extra: "",
          cores: "",
          tags: "",
          ondeRepete: "",
        },
      ],
    }
  }

  filtrarTodos() {
    this.filtrosAtivos.clear()
    this.produtosFiltrados = [...this.produtos]
    this.renderizarGaleria()
    this.atualizarBotoes()
  }

  filtrarGrupo(grupo) {
    if (this.filtrosAtivos.has(`grupo-${grupo}`)) {
      this.filtrosAtivos.delete(`grupo-${grupo}`)
    } else {
      this.filtrosAtivos.add(`grupo-${grupo}`)
    }
    this.aplicarFiltros()
  }

  filtrarDisponivel() {
    if (this.filtrosAtivos.has("disponivel")) {
      this.filtrosAtivos.delete("disponivel")
    } else {
      this.filtrosAtivos.add("disponivel")
    }
    this.aplicarFiltros()
  }

  aplicarFiltros() {
    this.produtosFiltrados = this.produtos.filter((produto) => {
      // Se não há filtros, mostra todos
      if (this.filtrosAtivos.size === 0) return true

      let passaFiltro = true

      // Filtro de grupos
      const gruposFiltrados = Array.from(this.filtrosAtivos)
        .filter((f) => f.startsWith("grupo-"))
        .map((f) => f.replace("grupo-", ""))

      if (gruposFiltrados.length > 0) {
        passaFiltro = passaFiltro && gruposFiltrados.includes(produto.grupo)
      }

      // Filtro de disponibilidade
      if (this.filtrosAtivos.has("disponivel")) {
        passaFiltro = passaFiltro && produto.disponivel
      }

      return passaFiltro
    })

    this.renderizarGaleria()
    this.atualizarBotoes()
  }

  renderizarGaleria() {
    const galeria = document.getElementById("galeria")

    if (this.produtosFiltrados.length === 0) {
      galeria.innerHTML = "<p>Nenhum produto encontrado com os filtros selecionados.</p>"
      return
    }

    galeria.innerHTML = this.produtosFiltrados
      .map(
        (produto) => `
            <div class="produto ${!produto.disponivel ? "indisponivel" : ""}">
                <h3>${produto.titulo}</h3>
                ${produto.apelido ? `<p><em>"${produto.apelido}"</em></p>` : ""}
                <p><strong>Preço:</strong> ${produto.preco}</p>
                ${produto.precoVenda ? `<p><strong>Preço de Venda:</strong> ${produto.precoVenda}</p>` : ""}
                <p><strong>Grupo:</strong> ${produto.grupo} | <strong>Peça:</strong> ${produto.peca}</p>
                <p><strong>Técnica:</strong> ${produto.tecnica}</p>
                <p><strong>Dimensões:</strong> ${produto.dimensoes}</p>
                ${produto.emExposicao ? `<p><strong>Em Exposição:</strong> ${produto.emExposicao}</p>` : ""}
                ${produto.extra ? `<p><strong>Extra:</strong> ${produto.extra}</p>` : ""}
                <p><strong>Status:</strong> ${produto.disponivel ? "✅ Disponível" : "❌ Vendida"}</p>
                <p><strong>Imagens:</strong> ${produto.imagens.join(", ")}</p>
            </div>
        `,
      )
      .join("")
  }

  atualizarBotoes() {
    document.querySelectorAll(".filtros button").forEach((btn) => {
      btn.classList.remove("ativo")
    })

    this.filtrosAtivos.forEach((filtro) => {
      if (filtro.startsWith("grupo-")) {
        const grupo = filtro.replace("grupo-", "")
        document.querySelector(`button[onclick="filtrarGrupo('${grupo}')"]`)?.classList.add("ativo")
      }
      if (filtro === "disponivel") {
        document.querySelector(`button[onclick="filtrarDisponivel()"]`)?.classList.add("ativo")
      }
    })
  }

  atualizarStatus() {
    const status = document.getElementById("status")
    status.innerHTML = `
            Mostrando ${this.produtosFiltrados.length} de ${this.produtos.length} produtos
            ${this.filtrosAtivos.size > 0 ? `(${this.filtrosAtivos.size} filtros ativos)` : ""}
        `
  }
}

// Funções globais para os botões
let sistema

window.onload = () => {
  sistema = new BetShopDinamico()
}

function filtrarTodos() {
  sistema.filtrarTodos()
}

function filtrarGrupo(grupo) {
  sistema.filtrarGrupo(grupo)
}

function filtrarDisponivel() {
  sistema.filtrarDisponivel()
}
