(() => {
  const API_BASE = 'http://localhost:8080';
  const COLSPAN = 10;

  let honorarios = [];
  let filtroStatus = 'todos';
  let filtroOrigem = 'todos';
  let buscaAtual = '';
  let honorarioEditandoId = null;

  const byId = id => document.getElementById(id);

  function toast(mensagem, tipo = 'info') {
    if (window.JurisFlow?.showToast) {
      window.JurisFlow.showToast(mensagem, tipo);
      return;
    }
    alert(mensagem);
  }

  function texto(valor, vazio = 'Nao informado') {
    const normalizado = String(valor ?? '').trim();
    return normalizado || vazio;
  }

  function normalizarTexto(valor) {
    return String(valor ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function normalizarStatus(status) {
    const valor = normalizarTexto(status).trim();
    if (valor === 'pago' || valor === 'em dia' || valor === 'quitado') return 'pago';
    if (valor === 'inadimplente' || valor === 'inadimpl' || valor === 'atrasado') return 'inadimplente';
    return 'pendente';
  }

  function statusLabel(status) {
    const valor = normalizarStatus(status);
    if (valor === 'pago') return 'Pago';
    if (valor === 'inadimplente') return 'Inadimplente';
    return 'Pendente';
  }

  function isHonorarioAutomatico(honorario) {
    return honorario?.origem === 'PROCESSO_AUTOMATICO'
      || String(honorario?.chaveIntegracao ?? '').trim() !== '';
  }

  function origemTipo(honorario) {
    if (isHonorarioAutomatico(honorario)) return 'automatico';
    if (!honorario?.origem && !honorario?.chaveIntegracao) return 'legado';
    return 'manual';
  }

  function origemLabel(honorario) {
    const tipo = origemTipo(honorario);
    if (tipo === 'automatico') return 'Automatico do Processo';
    if (tipo === 'legado') return 'Legado';
    return 'Manual';
  }

  function origemSelo(honorario) {
    return isHonorarioAutomatico(honorario) ? 'Gerado pelo processo' : origemLabel(honorario);
  }

  function moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function moedaInput(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function parseMoeda(valor) {
    const limpo = String(valor ?? '')
      .trim()
      .replace(/^R\$\s?/i, '')
      .replace(/[^\d,.-]/g, '');

    if (!limpo) return 0;

    const normalizado = limpo.includes(',')
      ? limpo.replace(/\./g, '').replace(',', '.')
      : limpo.replace(/\.(?=\d{3}(\D|$))/g, '');

    const numero = Number.parseFloat(normalizado);
    return Number.isFinite(numero) ? numero : 0;
  }

  function toPayloadMoney(valor) {
    return Number(Number(valor || 0).toFixed(2));
  }

  function dataLabel(valor) {
    if (!valor) return '--';
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return texto(valor, '--');
    return data.toLocaleDateString('pt-BR');
  }

  function competenciaLabel(valor) {
    if (!valor) return '--';
    const partes = String(valor).split('-');
    if (partes.length < 2) return valor;
    const data = new Date(Number(partes[0]), Number(partes[1]) - 1, 1);
    if (Number.isNaN(data.getTime())) return valor;
    return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  }

  function iniciais(nome) {
    const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'JF';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
  }

  function clienteNome(honorario) {
    return honorario?.cliente?.nome || 'Cliente nao vinculado';
  }

  function clienteDoc(honorario) {
    return honorario?.cliente?.cpfCnpj || honorario?.cliente?.cpf || '--';
  }

  function processoNumero(honorario) {
    return honorario?.processo?.numero || 'Sem processo';
  }

  function processoResumo(honorario) {
    return honorario?.processo?.tipoAcao || honorario?.processo?.areaJuridica || '--';
  }

  function limparElemento(elemento) {
    while (elemento.firstChild) elemento.removeChild(elemento.firstChild);
  }

  function criarElemento(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
  }

  function renderizarEstado(tipo, titulo, mensagem) {
    const tbody = byId('honorariosBody');
    limparElemento(tbody);

    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = COLSPAN;

    const box = criarElemento('div', `${tipo}-state`);
    box.appendChild(criarElemento('strong', null, titulo));
    box.appendChild(criarElemento('span', null, mensagem));
    td.appendChild(box);
    tr.appendChild(td);
    tbody.appendChild(tr);
  }

  function setCarregando() {
    byId('tableCount').textContent = 'Carregando dados da API...';
    renderizarEstado('loading', 'Carregando honorarios', 'Buscando dados reais no backend.');
  }

  function setErro(mensagem) {
    byId('tableCount').textContent = 'API indisponivel';
    renderizarEstado('error', 'Nao foi possivel carregar os honorarios', mensagem);
  }

  async function lerMensagemErro(response) {
    const textoResposta = await response.text();
    if (!textoResposta) return `HTTP ${response.status}`;
    try {
      const json = JSON.parse(textoResposta);
      return json.message || json.erro || json.error || textoResposta;
    } catch {
      return textoResposta;
    }
  }

  async function carregarHonorarios() {
    setCarregando();

    try {
      const resposta = await fetch(`${API_BASE}/honorarios`);
      if (!resposta.ok) throw new Error(await lerMensagemErro(resposta));
      const dados = await resposta.json();
      honorarios = Array.isArray(dados) ? dados : [];
      renderizar();
    } catch (erro) {
      console.error('Erro ao carregar honorarios:', erro);
      honorarios = [];
      renderizarCards();
      setErro(erro.message || 'Verifique se o backend esta disponivel em http://localhost:8080.');
      toast('Erro ao carregar honorarios do backend.', 'error');
    }
  }

  function honorariosFiltrados() {
    return honorarios.filter(honorario => {
      const status = normalizarStatus(honorario.status);
      const origem = origemTipo(honorario);
      const busca = normalizarTexto([
        clienteNome(honorario),
        processoNumero(honorario),
        honorario.descricao,
        honorario.responsavel
      ].join(' '));

      const passaStatus = filtroStatus === 'todos' || status === filtroStatus;
      const passaOrigem = filtroOrigem === 'todos' || origem === filtroOrigem;
      const passaBusca = !buscaAtual || busca.includes(buscaAtual);

      return passaStatus && passaOrigem && passaBusca;
    });
  }

  function renderizarCards() {
    const somarPorStatus = statusEsperado => honorarios
      .filter(h => normalizarStatus(h.status) === statusEsperado)
      .reduce((soma, h) => soma + Number(h.valorTotal || 0), 0);

    byId('cardRecebido').textContent = moeda(somarPorStatus('pago'));
    byId('cardPendente').textContent = moeda(somarPorStatus('pendente'));
    byId('cardInadimplente').textContent = moeda(somarPorStatus('inadimplente'));
    byId('cardQuantidade').textContent = String(honorarios.length);
  }

  function criarCelulaCliente(honorario) {
    const td = document.createElement('td');
    const wrap = criarElemento('div', 'client-cell');
    wrap.appendChild(criarElemento('div', 'client-avatar', iniciais(clienteNome(honorario))));

    const info = document.createElement('div');
    info.appendChild(criarElemento('div', 'cell-main', clienteNome(honorario)));
    info.appendChild(criarElemento('div', 'cell-sub', clienteDoc(honorario)));
    wrap.appendChild(info);
    td.appendChild(wrap);
    return td;
  }

  function criarCelulaProcesso(honorario) {
    const td = document.createElement('td');
    td.appendChild(criarElemento('div', 'process-num', processoNumero(honorario)));
    td.appendChild(criarElemento('div', 'cell-sub', processoResumo(honorario)));
    return td;
  }

  function criarCelulaTipo(honorario) {
    const td = document.createElement('td');
    td.appendChild(criarElemento('div', 'cell-main', texto(honorario.tipoHonorario)));
    td.appendChild(criarElemento('div', 'cell-sub', `Responsavel: ${texto(honorario.responsavel, '--')}`));
    td.appendChild(criarElemento('div', 'cell-sub', `Descricao: ${texto(honorario.descricao, '--')}`));
    return td;
  }

  function criarCelulaValores(honorario) {
    const td = document.createElement('td');
    td.appendChild(criarElemento('div', 'value-cell', moeda(honorario.valorTotal)));
    td.appendChild(criarElemento('div', 'cell-sub', `Bruto: ${moeda(honorario.valorBruto)}`));
    td.appendChild(criarElemento('div', 'cell-sub', `Desc.: ${moeda(honorario.desconto)}`));
    td.appendChild(criarElemento('div', 'cell-sub', `Acresc.: ${moeda(honorario.acrescimos)}`));
    return td;
  }

  function criarCelulaOrigem(honorario) {
    const td = document.createElement('td');
    const tipo = origemTipo(honorario);
    td.appendChild(criarElemento('span', `origin-badge origin-${tipo}`, origemSelo(honorario)));
    return td;
  }

  function criarCelulaStatus(honorario) {
    const status = normalizarStatus(honorario.status);
    const td = document.createElement('td');
    td.appendChild(criarElemento('span', `status-badge status-${status}`, statusLabel(honorario.status)));
    return td;
  }

  function criarBotaoAcao(classe, textoBotao, handler) {
    const botao = criarElemento('button', `btn-action ${classe}`, textoBotao);
    botao.type = 'button';
    botao.addEventListener('click', handler);
    return botao;
  }

  function criarCelulaAcoes(honorario) {
    const td = document.createElement('td');
    const wrap = criarElemento('div', 'actions-cell');

    if (isHonorarioAutomatico(honorario)) {
      if (honorario.processo?.id) {
        wrap.appendChild(criarBotaoAcao('btn-open', 'Abrir processo', () => abrirProcesso(honorario.processo.id)));
      } else {
        wrap.appendChild(criarElemento('span', 'cell-sub', 'Sem acao disponivel'));
      }
    } else {
      wrap.appendChild(criarBotaoAcao('btn-edit', 'Editar', () => abrirModalEdicao(honorario.id)));
      wrap.appendChild(criarBotaoAcao('btn-delete', 'Excluir', () => excluirHonorario(honorario.id)));
    }

    td.appendChild(wrap);
    return td;
  }

  function renderizarTabela(lista) {
    byId('tableCount').textContent = `${lista.length} honorario(s) encontrado(s)`;

    if (!lista.length) {
      renderizarEstado('empty', 'Nenhum honorario encontrado', 'Ajuste os filtros ou cadastre um novo honorario.');
      return;
    }

    const tbody = byId('honorariosBody');
    limparElemento(tbody);

    lista.forEach(honorario => {
      const tr = document.createElement('tr');
      tr.appendChild(criarCelulaCliente(honorario));
      tr.appendChild(criarCelulaProcesso(honorario));
      tr.appendChild(criarCelulaTipo(honorario));
      tr.appendChild(criarCelulaValores(honorario));
      tr.appendChild(criarElemento('td', null, competenciaLabel(honorario.competencia)));
      tr.appendChild(criarElemento('td', null, texto(honorario.formaPagamento)));
      tr.appendChild(criarCelulaOrigem(honorario));
      tr.appendChild(criarElemento('td', null, dataLabel(honorario.dataCadastro)));
      tr.appendChild(criarCelulaStatus(honorario));
      tr.appendChild(criarCelulaAcoes(honorario));
      tbody.appendChild(tr);
    });
  }

  function renderizar() {
    renderizarCards();
    renderizarTabela(honorariosFiltrados());
  }

  function recalcularTotalEdicao() {
    const valorBruto = parseMoeda(byId('editValorBruto').value);
    const desconto = parseMoeda(byId('editDesconto').value);
    const acrescimos = parseMoeda(byId('editAcrescimos').value);
    byId('editValorTotal').value = moeda(valorBruto - desconto + acrescimos);
  }

  function montarPayloadEdicao() {
    const valorBruto = parseMoeda(byId('editValorBruto').value);
    const desconto = parseMoeda(byId('editDesconto').value);
    const acrescimos = parseMoeda(byId('editAcrescimos').value);
    const valorTotal = valorBruto - desconto + acrescimos;

    return {
      tipoHonorario: byId('editTipo').value.trim(),
      valorBruto: toPayloadMoney(valorBruto),
      desconto: toPayloadMoney(desconto),
      acrescimos: toPayloadMoney(acrescimos),
      valorTotal: toPayloadMoney(valorTotal),
      competencia: byId('editCompetencia').value.trim(),
      status: byId('editStatus').value,
      formaPagamento: byId('editForma').value.trim(),
      descricao: byId('editDescricao').value.trim(),
      responsavel: byId('editResponsavel').value.trim(),
      observacoesInternas: byId('editObservacoes').value.trim(),
      clienteId: Number(byId('editClienteId').value),
      processoId: byId('editProcessoId').value ? Number(byId('editProcessoId').value) : null
    };
  }

  function abrirModalEdicao(id) {
    const honorario = honorarios.find(h => h.id === id);
    if (!honorarioEditavel(honorario)) {
      toast('Honorarios automaticos devem ser alterados pelo processo vinculado.', 'warning');
      return;
    }

    honorarioEditandoId = id;
    byId('editModalSubtitle').textContent = `${clienteNome(honorario)} - ${processoNumero(honorario)}`;
    byId('editClienteId').value = honorario.cliente?.id || '';
    byId('editProcessoId').value = honorario.processo?.id || '';
    byId('editTipo').value = honorario.tipoHonorario || '';
    byId('editValorBruto').value = moedaInput(honorario.valorBruto ?? honorario.valorTotal);
    byId('editDesconto').value = moedaInput(honorario.desconto);
    byId('editAcrescimos').value = moedaInput(honorario.acrescimos);
    byId('editCompetencia').value = honorario.competencia || '';
    byId('editStatus').value = normalizarStatus(honorario.status);
    byId('editForma').value = honorario.formaPagamento || '';
    byId('editResponsavel').value = honorario.responsavel || '';
    byId('editClienteNome').value = clienteNome(honorario);
    byId('editProcessoNumero').value = processoNumero(honorario);
    byId('editDescricao').value = honorario.descricao || '';
    byId('editObservacoes').value = honorario.observacoesInternas || '';
    recalcularTotalEdicao();
    byId('editModal').classList.add('open');
  }

  function honorarioExiste(honorario) {
    return Boolean(honorario && honorario.id != null);
  }

  function honorarioEditavel(honorario) {
    return honorarioExiste(honorario) && !isHonorarioAutomatico(honorario);
  }

  function fecharModalEdicao() {
    honorarioEditandoId = null;
    byId('editModal').classList.remove('open');
  }

  function abrirProcesso(id) {
    window.location.href = `detalhes-processo.html?id=${encodeURIComponent(id)}`;
  }

  async function salvarEdicao(event) {
    event.preventDefault();
    const honorario = honorarios.find(h => h.id === honorarioEditandoId);
    if (!honorarioEditavel(honorario)) return;

    const payload = montarPayloadEdicao();
    if (!payload.clienteId) {
      toast('Honorario sem cliente vinculado nao pode ser salvo pela interface.', 'error');
      return;
    }

    if (payload.valorTotal < 0) {
      toast('Valor total nao pode ser negativo.', 'warning');
      return;
    }

    try {
      const resposta = await fetch(`${API_BASE}/honorarios/${honorario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resposta.ok) throw new Error(await lerMensagemErro(resposta));

      toast('Honorario atualizado com sucesso.', 'success');
      fecharModalEdicao();
      await carregarHonorarios();
    } catch (erro) {
      console.error('Erro ao editar honorario:', erro);
      toast(`Erro ao salvar alteracoes do honorario. ${erro.message || ''}`.trim(), 'error');
    }
  }

  async function excluirHonorario(id) {
    const honorario = honorarios.find(h => h.id === id);
    if (!honorarioEditavel(honorario)) {
      toast('Honorarios automaticos nao podem ser excluidos pela interface.', 'warning');
      return;
    }

    if (!confirm(`Deseja excluir o honorario de ${clienteNome(honorario)}?`)) return;

    try {
      const resposta = await fetch(`${API_BASE}/honorarios/${id}`, { method: 'DELETE' });
      if (!resposta.ok) throw new Error(await lerMensagemErro(resposta));

      toast('Honorario excluido com sucesso.', 'success');
      await carregarHonorarios();
    } catch (erro) {
      console.error('Erro ao excluir honorario:', erro);
      toast(`Erro ao excluir honorario. ${erro.message || ''}`.trim(), 'error');
    }
  }

  function iniciarEventos() {
    byId('editForm')?.addEventListener('submit', salvarEdicao);
    byId('editModal')?.addEventListener('click', event => {
      if (event.target === byId('editModal')) fecharModalEdicao();
    });

    ['editValorBruto', 'editDesconto', 'editAcrescimos'].forEach(id => {
      byId(id)?.addEventListener('input', recalcularTotalEdicao);
    });

    byId('filterTabs')?.addEventListener('click', event => {
      const botao = event.target.closest('.filter-tab');
      if (!botao) return;

      document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
      botao.classList.add('active');
      filtroStatus = botao.dataset.filter;
      renderizar();
    });

    byId('origemFilter')?.addEventListener('change', event => {
      filtroOrigem = event.target.value;
      renderizar();
    });

    byId('searchInput')?.addEventListener('input', event => {
      buscaAtual = normalizarTexto(event.target.value);
      renderizar();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') fecharModalEdicao();
    });
  }

  window.carregarHonorarios = carregarHonorarios;
  window.fecharModalEdicao = fecharModalEdicao;

  document.addEventListener('DOMContentLoaded', () => {
    iniciarEventos();
    carregarHonorarios();
  });
})();
