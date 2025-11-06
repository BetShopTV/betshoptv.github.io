function appData() {
  return {
    // Página atual (baseada no hash da URL)
    pagina: 'galeria',

    // Dados carregados dos JSONs
    pecas: [],
    rifas: [],

    // Estado de seleção
    selecionadas: [],         // IDs de peças
    favoritas: [],            // IDs de favoritas
    rifasSelecionadas: [],    // IDs de rifas

    // Dados do usuário
    formulario: {
      nome: '',
      email: '',
      telefone: ''
    },

    // Total da compra
    totalGeral: 0,

    // ========== INICIALIZAÇÃO ==========
    async init() {
      try {
        const [pecasRes, rifasRes] = await Promise.all([
          fetch('https://betshoptv.com/dados/pecas.json'),
          fetch('https://betshoptv.com/dados/rifas.json')
        ]);

        this.pecas = await pecasRes.json();
        this.rifas = await rifasRes.json();

        this.atualizarTotal();
        this.syncHashComPagina();

        // Escutar mudanças no hash
        window.addEventListener('hashchange', () => this.syncHashComPagina());

      } catch (err) {
        console.error('Erro ao carregar os dados:', err);
      }
    },

    // ========== NAVEGAÇÃO ==========
    mudarPagina(p) {
      window.location.hash = p;
    },

    syncHashComPagina() {
      const hash = window.location.hash.replace('#', '').trim();
      const [paginaBase] = hash.split('?');
      this.pagina = paginaBase || 'galeria';
    },

    // ========== CONTROLE DE SELEÇÃO ==========
    toggleSelecionada(id) {
      const i = this.selecionadas.indexOf(id);
      if (i === -1) this.selecionadas.push(id);
      else this.selecionadas.splice(i, 1);
      this.atualizarTotal();
    },

    toggleFavorita(id) {
      const i = this.favoritas.indexOf(id);
      if (i === -1) this.favoritas.push(id);
      else this.favoritas.splice(i, 1);
    },

    toggleRifa(id) {
      const i = this.rifasSelecionadas.indexOf(id);
      if (i === -1) this.rifasSelecionadas.push(id);
      else this.rifasSelecionadas.splice(i, 1);
      this.atualizarTotal();
    },

    // ========== TOTAL ==========
    atualizarTotal() {
      let total = 0;

      // Soma preços das peças selecionadas
      this.selecionadas.forEach(id => {
        const peca = this.pecas.find(p => p.id_peca === id);
        if (peca && peca.preco) {
          total += parseFloat(peca.preco);
        }
      });

      // Soma valor das rifas (regra par/ímpar)
      const nR = this.rifasSelecionadas.length;
      if (nR > 0) {
        total += (nR % 2 === 0)
          ? nR * 25
          : (nR - 1) * 25 + 30;
      }

      this.totalGeral = total;
    },

    // ========== FORMATADOR ==========
    formatarPreco(v) {
      const n = Number(v || 0);
      const inteiro = Math.round(n);
      return 'R$ ' + inteiro.toLocaleString('pt-BR');
    }
  };
}
