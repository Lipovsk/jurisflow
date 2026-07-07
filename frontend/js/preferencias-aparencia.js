(() => {
  'use strict';

  const STORAGE_KEY = 'jurisflow_preferencias_v1';

  const DEFAULTS = {
    tema: 'claro',
    corPrincipal: 'azul',
    escalaFonte: 'padrao',
    formatoData: 'ddmmyyyy',
    paginaInicial: 'dashboard.html'
  };

  const CORES = {
    azul: '#0D1B2A',
    dourado: '#C9A84C',
    azulVivo: '#2563EB',
    verde: '#059669',
    roxo: '#7C3AED',
    vermelho: '#DC2626',
    teal: '#0D9488',
    cinza: '#374151'
  };

  const ESCALAS = {
    pequeno: '90%',
    padrao: '100%',
    grande: '110%'
  };

  const FORMATOS = new Set(['ddmmyyyy', 'iso', 'longo']);
  const TEMAS = new Set(['claro', 'escuro']);
  const PAGINAS = new Set([
    'dashboard.html',
    'clientes.html',
    'processos.html',
    'agenda.html',
    'honorarios.html',
    'financeiro.html'
  ]);

  function storageDisponivel() {
    try {
      const teste = '__jf_pref_test__';
      window.localStorage.setItem(teste, '1');
      window.localStorage.removeItem(teste);
      return true;
    } catch {
      return false;
    }
  }

  function validar(raw) {
    const pref = raw && typeof raw === 'object' ? raw : {};
    return {
      tema: TEMAS.has(pref.tema) ? pref.tema : DEFAULTS.tema,
      corPrincipal: Object.prototype.hasOwnProperty.call(CORES, pref.corPrincipal) ? pref.corPrincipal : DEFAULTS.corPrincipal,
      escalaFonte: Object.prototype.hasOwnProperty.call(ESCALAS, pref.escalaFonte) ? pref.escalaFonte : DEFAULTS.escalaFonte,
      formatoData: FORMATOS.has(pref.formatoData) ? pref.formatoData : DEFAULTS.formatoData,
      paginaInicial: PAGINAS.has(pref.paginaInicial) ? pref.paginaInicial : DEFAULTS.paginaInicial
    };
  }

  function carregar() {
    if (!storageDisponivel()) return { ...DEFAULTS };

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      return validar(JSON.parse(raw));
    } catch {
      return { ...DEFAULTS };
    }
  }

  function salvar(preferencias) {
    const validadas = validar(preferencias);
    if (!storageDisponivel()) return validadas;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validadas));
    return validadas;
  }

  function aplicar(preferencias = carregar()) {
    const pref = validar(preferencias);
    const root = document.documentElement;
    const cor = CORES[pref.corPrincipal] || CORES[DEFAULTS.corPrincipal];

    root.classList.toggle('jf-tema-escuro', pref.tema === 'escuro');
    root.classList.toggle('jf-tema-claro', pref.tema === 'claro');
    root.classList.remove('jf-fonte-pequeno', 'jf-fonte-padrao', 'jf-fonte-grande');
    root.classList.add(`jf-fonte-${pref.escalaFonte}`);
    root.style.setProperty('--jf-cor-principal', cor);
    root.style.setProperty('--jf-escala-fonte', ESCALAS[pref.escalaFonte] || ESCALAS.padrao);

    return pref;
  }

  function parseData(valor) {
    if (!valor) return null;
    const texto = String(valor).trim();
    if (!texto) return null;

    let data;
    const match = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      data = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    } else {
      data = new Date(texto);
    }

    return Number.isNaN(data.getTime()) ? null : data;
  }

  function formatarData(valor) {
    const data = parseData(valor);
    if (!data) return '--';

    const formato = carregar().formatoData;
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();

    if (formato === 'iso') return `${ano}-${mes}-${dia}`;
    if (formato === 'longo') {
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    }

    return `${dia}/${mes}/${ano}`;
  }

  function restaurarPadrao() {
    return salvar(DEFAULTS);
  }

  window.JurisFlowPreferencias = {
    STORAGE_KEY,
    DEFAULTS: { ...DEFAULTS },
    CORES: { ...CORES },
    carregar,
    salvar,
    aplicar,
    restaurarPadrao,
    validar
  };

  window.JurisFlowFormatarData = formatarData;
  aplicar();
})();

