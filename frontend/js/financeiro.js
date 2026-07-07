(() => {
  'use strict';

  const API_BASE = 'http://localhost:8080';
  const CORES = [
    'linear-gradient(135deg,#2563EB,#1D4ED8)',
    'linear-gradient(135deg,#10B981,#059669)',
    'linear-gradient(135deg,#F59E0B,#D97706)',
    'linear-gradient(135deg,#8B5CF6,#7C3AED)',
    'linear-gradient(135deg,#F97316,#EA580C)',
    'linear-gradient(135deg,#0D9488,#0F766E)',
    'linear-gradient(135deg,#6B7280,#4B5563)',
    'linear-gradient(135deg,#EC4899,#DB2777)'
  ];

  let honorarios = [];
  let recebimentos = [];
  let mesSelecionado = mesAtual();

  const byId = id => document.getElementById(id);

  function toast(mensagem, tipo = 'info') {
    if (window.JurisFlow?.showToast) {
      window.JurisFlow.showToast(mensagem, tipo);
      return;
    }

    console[tipo === 'error' ? 'error' : 'log'](mensagem);
  }

  function limparElemento(elemento) {
    if (!elemento) return;
    while (elemento.firstChild) elemento.removeChild(elemento.firstChild);
  }

  function criarElemento(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
  }

  function setTexto(id, valor) {
    const node = byId(id);
    if (node) node.textContent = valor;
  }

  function setBarra(id, percentual) {
    const node = byId(id);
    if (!node) return;
    const seguro = Math.max(0, Math.min(Number(percentual) || 0, 100));
    node.style.width = `${seguro}%`;
  }

  function moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function valorNumero(valor) {
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
    const texto = String(valor ?? '').trim();
    if (!texto) return 0;
    const normalizado = texto.includes(',')
      ? texto.replace(/\./g, '').replace(',', '.')
      : texto;
    const numero = Number(normalizado);
    return Number.isFinite(numero) ? numero : 0;
  }

  function normalizarTexto(valor) {
    return String(valor ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]+/g, ' ');
  }

  function isConfirmado(recebimento) {
    return normalizarTexto(recebimento?.status).toUpperCase() === 'CONFIRMADO';
  }

  function isInadimplente(honorario) {
    const status = normalizarTexto(honorario?.status);
    return status === 'inadimplente' || status === 'inadimpl' || status === 'atrasado';
  }

  function mesAtual() {
    const data = new Date();
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
  }

  function mesDeData(valor) {
    const texto = String(valor ?? '');
    return /^\d{4}-\d{2}/.test(texto) ? texto.slice(0, 7) : '';
  }

  function dataParaOrdenacao(valor) {
    const texto = String(valor ?? '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return new Date(`${texto}T00:00:00`).getTime();
    const data = new Date(texto);
    return Number.isNaN(data.getTime()) ? 0 : data.getTime();
  }

  function formatarData(valor) {
    const texto = String(valor ?? '');
    if (!texto) return '--';
    const data = /^\d{4}-\d{2}-\d{2}$/.test(texto)
      ? new Date(`${texto}T00:00:00`)
      : new Date(texto);
    if (Number.isNaN(data.getTime())) return texto;
    return data.toLocaleDateString('pt-BR');
  }

  function labelMes(mes) {
    if (!/^\d{4}-\d{2}$/.test(String(mes))) return 'Mes nao informado';
    const [ano, mesNumero] = mes.split('-').map(Number);
    return new Date(ano, mesNumero - 1, 1).toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
  }

  function labelMesCurto(mes) {
    if (!/^\d{4}-\d{2}$/.test(String(mes))) return '--';
    const [ano, mesNumero] = mes.split('-').map(Number);
    return new Date(ano, mesNumero - 1, 1).toLocaleDateString('pt-BR', {
      month: 'short',
      year: '2-digit'
    });
  }

  function mesesAnterioresAte(mes, quantidade) {
    const [ano, mesNumero] = mes.split('-').map(Number);
    const data = new Date(ano, mesNumero - 1, 1);
    const meses = [];

    for (let i = quantidade - 1; i >= 0; i -= 1) {
      const item = new Date(data.getFullYear(), data.getMonth() - i, 1);
      meses.push(`${item.getFullYear()}-${String(item.getMonth() + 1).padStart(2, '0')}`);
    }

    return meses;
  }

  function getCor(id) {
    const n = String(id || '').split('').reduce((soma, char) => soma + char.charCodeAt(0), 0);
    return CORES[n % CORES.length];
  }

  function getIniciais(nome) {
    const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'JF';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
  }

  function clienteIdHonorario(honorario) {
    return honorario?.cliente?.id ?? honorario?.clienteId ?? `honorario-${honorario?.id ?? 'sem-id'}`;
  }

  function clienteNomeHonorario(honorario) {
    return honorario?.cliente?.nome || honorario?.nomeCliente || 'Cliente nao vinculado';
  }

  function clienteNomeRecebimento(recebimento) {
    return recebimento?.nomeCliente || 'Cliente nao vinculado';
  }

  function numeroProcessoRecebimento(recebimento) {
    return recebimento?.numeroProcesso || 'Sem processo';
  }

  function formaPagamentoLabel(valor) {
    const chave = normalizarTexto(valor);
    const mapa = {
      pix: 'Pix',
      dinheiro: 'Dinheiro',
      transferencia: 'Transferencia',
      ted: 'Transferencia',
      doc: 'DOC',
      boleto: 'Boleto',
      cartao: 'Cartao',
      outro: 'Outro'
    };
    return mapa[chave] || valor || '--';
  }

  function areaJuridica(honorario) {
    return honorario?.processo?.areaJuridica || 'Sem area informada';
  }

  async function lerMensagemErro(response) {
    const texto = await response.text();
    if (!texto) return `HTTP ${response.status}`;
    try {
      const json = JSON.parse(texto);
      return json.message || json.erro || json.error || texto;
    } catch {
      return texto;
    }
  }

  async function buscarJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(await lerMensagemErro(response));
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  function setCarregando() {
    setTexto('labelMesTitulo', labelMes(mesSelecionado));
    setTexto('labelRecebidoMes', `Recebido em ${labelMes(mesSelecionado)}`);
    setTexto('fcRecebido', 'Carregando...');
    setTexto('fcAReceber', 'Carregando...');
    setTexto('fcInadimplente', 'Carregando...');
    setTexto('fcTotalLancado', 'Carregando...');
    setTexto('trendRecebidoMes', '--');
    setTexto('trendAReceber', '--');
    setTexto('trendInadimplente', '--');
    setTexto('trendTotalLancados', '--');
    setEstado('graficoEvolucao', 'loading', 'Carregando recebimentos', 'Consultando dados reais do backend.');
    setEstado('areasJuridicasLista', 'loading', 'Carregando areas', 'Consultando honorarios lancados.');
    setEstado('inadimplentesBody', 'loading', 'Carregando inadimplencia', 'Consultando marcacoes reais.');
    setEstado('recebimentosBody', 'loading', 'Carregando recebimentos', 'Consultando historico confirmado.');
  }

  function setEstado(id, tipo, titulo, mensagem) {
    const container = byId(id);
    if (!container) return;
    limparElemento(container);
    const box = criarElemento('div', `state-box ${tipo}`);
    box.style.width = '100%';
    box.appendChild(criarElemento('strong', null, titulo));
    box.appendChild(criarElemento('span', null, mensagem));
    container.appendChild(box);
  }

  async function carregarFinanceiro() {
    setCarregando();

    try {
      const [honorariosApi, recebimentosApi] = await Promise.all([
        buscarJson(`${API_BASE}/honorarios`),
        buscarJson(`${API_BASE}/recebimentos`)
      ]);

      honorarios = honorariosApi;
      recebimentos = recebimentosApi;
      renderFinanceiro();
    } catch (erro) {
      console.error('Erro ao carregar financeiro:', erro);
      setErro(erro.message || 'Verifique se o backend esta disponivel em http://localhost:8080.');
      toast(`Erro ao carregar financeiro. ${erro.message || ''}`.trim(), 'error');
    }
  }

  function setErro(mensagem) {
    setTexto('fcRecebido', 'Erro');
    setTexto('fcAReceber', 'Erro');
    setTexto('fcInadimplente', 'Erro');
    setTexto('fcTotalLancado', 'Erro');
    setTexto('trendRecebidoMes', '--');
    setTexto('trendAReceber', '--');
    setTexto('trendInadimplente', '--');
    setTexto('trendTotalLancados', '--');
    setEstado('graficoEvolucao', 'error', 'Nao foi possivel carregar a evolucao', mensagem);
    setEstado('areasJuridicasLista', 'error', 'Nao foi possivel carregar as areas', mensagem);
    setEstado('inadimplentesBody', 'error', 'Nao foi possivel carregar inadimplencia', mensagem);
    setEstado('recebimentosBody', 'error', 'Nao foi possivel carregar recebimentos recentes', mensagem);
  }

  function recebimentosConfirmados() {
    return recebimentos.filter(isConfirmado);
  }

  function totaisConfirmadosPorHonorario() {
    const mapa = new Map();

    recebimentosConfirmados().forEach(recebimento => {
      const honorarioId = recebimento?.honorarioId;
      if (honorarioId == null) return;
      mapa.set(honorarioId, (mapa.get(honorarioId) || 0) + valorNumero(recebimento.valorRecebido));
    });

    return mapa;
  }

  function calcularSaldoAberto(mapaRecebidos) {
    return honorarios.reduce((total, honorario) => {
      const valorTotal = valorNumero(honorario?.valorTotal);
      const recebido = mapaRecebidos.get(honorario?.id) || 0;
      return total + Math.max(valorTotal - recebido, 0);
    }, 0);
  }

  function renderFinanceiro() {
    const confirmados = recebimentosConfirmados();
    const recebidosMes = confirmados.filter(r => mesDeData(r.dataRecebimento) === mesSelecionado);
    const mapaRecebidos = totaisConfirmadosPorHonorario();
    const saldoAberto = calcularSaldoAberto(mapaRecebidos);
    const inadimplentes = honorarios.filter(isInadimplente);
    const totalRecebidoMes = recebidosMes.reduce((soma, r) => soma + valorNumero(r.valorRecebido), 0);
    const totalLancado = honorarios.reduce((soma, h) => soma + valorNumero(h.valorTotal), 0);
    const totalInadimplente = inadimplentes.reduce((soma, h) => soma + valorNumero(h.valorTotal), 0);
    const honorariosComSaldo = honorarios.filter(h => {
      const saldo = Math.max(valorNumero(h.valorTotal) - (mapaRecebidos.get(h.id) || 0), 0);
      return saldo > 0;
    });
    const clientesInadimplentes = new Set(inadimplentes.map(clienteIdHonorario)).size;
    const baseBarras = Math.max(totalLancado, totalRecebidoMes + saldoAberto + totalInadimplente, 1);

    setTexto('labelMesTitulo', labelMes(mesSelecionado));
    setTexto('labelRecebidoMes', `Recebido em ${labelMes(mesSelecionado)}`);
    setTexto('fcRecebido', moeda(totalRecebidoMes));
    setTexto('fcAReceber', moeda(saldoAberto));
    setTexto('fcInadimplente', moeda(totalInadimplente));
    setTexto('fcTotalLancado', moeda(totalLancado));
    setTexto('trendRecebidoMes', `${recebidosMes.length} recebimento(s)`);
    setTexto('trendAReceber', `${honorariosComSaldo.length} honorario(s)`);
    setTexto('trendInadimplente', `${clientesInadimplentes} cliente(s)`);
    setTexto('trendTotalLancados', `${honorarios.length} lancamento(s)`);

    setBarra('barRecebido', (totalRecebidoMes / baseBarras) * 100);
    setBarra('barAReceber', (saldoAberto / baseBarras) * 100);
    setBarra('barInadimplente', (totalInadimplente / baseBarras) * 100);
    setBarra('barTotalLancado', totalLancado ? 100 : 0);

    renderEvolucao(confirmados);
    renderResumoMes(totalRecebidoMes, saldoAberto, totalLancado);
    renderAreas();
    renderInadimplentes(inadimplentes);
    renderRecebimentosRecentes(confirmados);
  }

  function renderEvolucao(confirmados) {
    const grafico = byId('graficoEvolucao');
    if (!grafico) return;
    limparElemento(grafico);

    grafico.style.display = 'flex';
    grafico.style.alignItems = 'flex-end';
    grafico.style.gap = '18px';
    grafico.style.height = '260px';
    grafico.style.padding = '20px';

    if (!confirmados.length) {
      setEstado('graficoEvolucao', 'empty', 'Nenhum recebimento confirmado', 'A evolucao aparecera quando houver recebimentos reais.');
      return;
    }

    const mesesMap = new Map();
    confirmados.forEach(recebimento => {
      const mes = mesDeData(recebimento.dataRecebimento);
      if (!mes) return;
      mesesMap.set(mes, (mesesMap.get(mes) || 0) + valorNumero(recebimento.valorRecebido));
    });

    const meses = Array.from(new Set([
      ...mesesAnterioresAte(mesSelecionado, 6),
      ...Array.from(mesesMap.keys()),
      mesSelecionado
    ])).sort();

    const maiorValor = Math.max(...meses.map(mes => mesesMap.get(mes) || 0), 0);

    meses.forEach(mes => {
      const valor = mesesMap.get(mes) || 0;
      const altura = maiorValor ? Math.max((valor / maiorValor) * 220, valor > 0 ? 8 : 0) : 0;
      const grupo = criarElemento('div', 'bar-group');
      grupo.style.justifyContent = 'flex-end';
      grupo.style.gap = '10px';

      grupo.appendChild(criarElemento('div', 'bar-val', moeda(valor)));

      const wrap = criarElemento('div', 'bar-wrap');
      const barra = criarElemento('div', 'bar');
      barra.style.height = `${altura}px`;
      barra.style.background = valor > 0
        ? 'linear-gradient(180deg,#C6A15B,#E2C47A)'
        : 'var(--gray-100)';
      wrap.appendChild(barra);
      grupo.appendChild(wrap);
      grupo.appendChild(criarElemento('div', 'bar-label', labelMesCurto(mes)));
      grafico.appendChild(grupo);
    });
  }

  function renderResumoMes(totalRecebidoMes, saldoAberto, totalLancado) {
    const percentual = totalLancado ? (totalRecebidoMes / totalLancado) * 100 : 0;
    setTexto('labelMetaMensalValor', labelMes(mesSelecionado));
    setTexto('percentualMeta', `${Math.min(percentual, 100).toFixed(0)}%`);
    setTexto('valorRecebidoMeta', `Recebido: ${moeda(totalRecebidoMes)}`);
    setTexto('valorFaltandoMeta', `Saldo a receber: ${moeda(saldoAberto)}`);
    setBarra('barraMeta', percentual);
  }

  function renderAreas() {
    const container = byId('areasJuridicasLista');
    if (!container) return;
    limparElemento(container);

    const areasMap = new Map();
    honorarios.forEach(honorario => {
      const area = areaJuridica(honorario);
      areasMap.set(area, (areasMap.get(area) || 0) + valorNumero(honorario.valorTotal));
    });

    const entradas = Array.from(areasMap.entries()).sort((a, b) => b[1] - a[1]);
    const total = entradas.reduce((soma, item) => soma + item[1], 0);

    if (!entradas.length) {
      setEstado('areasJuridicasLista', 'empty', 'Nenhuma area encontrada', 'Nao ha honorarios lancados para agrupar.');
      return;
    }

    entradas.forEach(([area, valor]) => {
      const percentual = total ? (valor / total) * 100 : 0;
      const row = criarElemento('div', 'area-row');
      const top = criarElemento('div', 'area-top');
      top.appendChild(criarElemento('span', null, area));
      top.appendChild(criarElemento('span', null, `${percentual.toFixed(0)}%`));
      row.appendChild(top);

      const bar = criarElemento('div', 'area-bar');
      const fill = criarElemento('div', 'area-fill');
      fill.style.width = `${Math.max(0, Math.min(percentual, 100))}%`;
      bar.appendChild(fill);
      row.appendChild(bar);
      row.appendChild(criarElemento('div', 'area-value', moeda(valor)));
      container.appendChild(row);
    });
  }

  function renderInadimplentes(inadimplentes) {
    const container = byId('inadimplentesBody');
    if (!container) return;
    limparElemento(container);

    if (!inadimplentes.length) {
      setEstado('inadimplentesBody', 'empty', 'Nenhum honorario marcado', 'Nao ha honorarios com status inadimplente ou atrasado.');
      return;
    }

    inadimplentes
      .slice()
      .sort((a, b) => valorNumero(b.valorTotal) - valorNumero(a.valorTotal))
      .forEach(honorario => {
        const item = criarElemento('div', 'pay-item');
        const avatar = criarElemento('div', 'pay-avatar', getIniciais(clienteNomeHonorario(honorario)));
        avatar.style.background = getCor(clienteIdHonorario(honorario));
        item.appendChild(avatar);

        const info = criarElemento('div', 'pay-info');
        info.appendChild(criarElemento('div', 'pay-name', clienteNomeHonorario(honorario)));
        const processo = honorario?.processo?.numero || 'Sem processo';
        info.appendChild(criarElemento('div', 'pay-desc', `${processo} - ${areaJuridica(honorario)}`));
        item.appendChild(info);

        const right = document.createElement('div');
        right.style.textAlign = 'right';
        const valor = criarElemento('div', 'pay-amount', moeda(honorario.valorTotal));
        valor.style.color = 'var(--red)';
        right.appendChild(valor);
        right.appendChild(criarElemento('span', 'pay-status ps-pendente', 'Marcado'));
        item.appendChild(right);
        container.appendChild(item);
      });
  }

  function renderRecebimentosRecentes(confirmados) {
    const container = byId('recebimentosBody');
    if (!container) return;
    limparElemento(container);

    const recentes = confirmados
      .slice()
      .sort((a, b) => {
        const data = dataParaOrdenacao(b.dataRecebimento) - dataParaOrdenacao(a.dataRecebimento);
        return data || Number(b.id || 0) - Number(a.id || 0);
      })
      .slice(0, 6);

    if (!recentes.length) {
      setEstado('recebimentosBody', 'empty', 'Nenhum recebimento confirmado', 'Recebimentos cancelados nao aparecem como receita recente.');
      return;
    }

    recentes.forEach(recebimento => {
      const item = criarElemento('div', 'pay-item');
      const avatar = criarElemento('div', 'pay-avatar', getIniciais(clienteNomeRecebimento(recebimento)));
      avatar.style.background = getCor(recebimento.clienteId || recebimento.honorarioId);
      item.appendChild(avatar);

      const info = criarElemento('div', 'pay-info');
      info.appendChild(criarElemento('div', 'pay-name', clienteNomeRecebimento(recebimento)));
      const desc = [
        numeroProcessoRecebimento(recebimento),
        formaPagamentoLabel(recebimento.formaPagamento),
        formatarData(recebimento.dataRecebimento)
      ].filter(Boolean).join(' - ');
      info.appendChild(criarElemento('div', 'pay-desc', desc));
      if (recebimento.observacao) {
        info.appendChild(criarElemento('div', 'pay-desc', recebimento.observacao));
      }
      item.appendChild(info);

      const right = document.createElement('div');
      right.style.textAlign = 'right';
      const valor = criarElemento('div', 'pay-amount', moeda(recebimento.valorRecebido));
      valor.style.color = 'var(--green)';
      right.appendChild(valor);
      right.appendChild(criarElemento('span', 'pay-status ps-recebido', 'Confirmado'));
      item.appendChild(right);
      container.appendChild(item);
    });
  }

  function iniciarEventos() {
    const inputMes = byId('mesFinanceiro');
    if (inputMes) {
      inputMes.value = mesSelecionado;
      inputMes.addEventListener('change', event => {
        mesSelecionado = event.target.value || mesAtual();
        renderFinanceiro();
      });
    }

    byId('btnAtualizarFinanceiro')?.addEventListener('click', carregarFinanceiro);
  }

  document.addEventListener('DOMContentLoaded', () => {
    iniciarEventos();
    carregarFinanceiro();
  });
})();
