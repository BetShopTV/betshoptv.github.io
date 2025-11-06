function appData() {
  return {
    pagina: 'galeria',
    pecas: [],
    rifas: [],
    selecionadas: [],
    favoritas: [],
    rifasSelecionadas: [],
    formulario: {
      nome: '',
      email: '',
      telefone: ''
    },

    get totalGeral() {
      const totalPecas = this.selecionadas.reduce((sum, peca) => sum + (peca.preco || 0), 0);
      const totalRifas = this.rifasSelecionadas.length * 5;
      return totalPecas + totalRifas;
    },

    init() {
      this.carregarJSONs();
    },

    async carregarJSONs() {
      try {
        const pecasData = await fetch('https://betshoptv.com/json/pecas.json').then(res => res.json());
        const rifasData = await fetch('https://betshoptv.com/json/rifas.json').then(res => res.json());

        this.pecas = pecasData;
        this.rifas = rifasData;

        console.log('Dados carregados com sucesso ✅');
      } catch (err) {
        console.error('Erro ao carregar os JSONs ❌', err);
      }
    }
  };
}
