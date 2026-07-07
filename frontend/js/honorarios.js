(() => {
  const API_BASE = 'http://localhost:8080';
  const COLSPAN = 10;

  let honorarios = [];
  let filtroStatus = 'todos';
  let filtroOrigem = 'todos';
  let buscaAtual = '';
  let honorarioEditandoId = null;
  let honorarioRecebimentoId = null;
  let honorarioHistoricoId = null;
  let saldoRecebimentoAtual = 0;

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
    if (valor === 'parcial' || valor === 'parcialmente pago') return 'parcial';
    if (valor === 'inadimplente' || valor === 'inadimpl' || valor === 'atrasado') return 'inadimplente';
    return 'pendente';
  }

  function statusLabel(status) {
    const valor = normalizarStatus(status);
    if (valor === 'pago') return 'Pago';
    if (valor === 'parcial') return 'Parcial';
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
    const textoData = String(valor);
    const data = /^\d{4}-\d{2}-\d{2}$/.test(textoData)
      ? new Date(`${textoData}T00:00:00`)
      : new Date(textoData);
    if (Number.isNaN(data.getTime())) return texto(valor, '--');
    return data.toLocaleDateString('pt-BR');
  }

  function hojeISO() {
    const data = new Date();
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
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

  async function carregarRecebimentosHonorario(honorarioId) {
    const resposta = await fetch(`${API_BASE}/recebimentos/honorario/${honorarioId}`);
    if (!resposta.ok) throw new Error(await lerMensagemErro(resposta));
    const dados = await resposta.json();
    return Array.isArray(dados) ? dados : [];
  }

  function isRecebimentoConfirmado(recebimento) {
    return normalizarTexto(recebimento?.status).trim() === 'confirmado';
  }

  function isRecebimentoCancelado(recebimento) {
    return normalizarTexto(recebimento?.status).trim() === 'cancelado';
  }

  function totalConfirmadoRecebimentos(recebimentos) {
    return recebimentos
      .filter(isRecebimentoConfirmado)
      .reduce((soma, recebimento) => soma + Number(recebimento.valorRecebido || 0), 0);
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
    byId('cardPendente').textContent = moeda(somarPorStatus('pendente') + somarPorStatus('parcial'));
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

  function adicionarAcoesRecebimento(wrap, honorario) {
    wrap.appendChild(criarBotaoAcao('btn-pay', 'Registrar recebimento', () => abrirModalRecebimento(honorario.id)));
    wrap.appendChild(criarBotaoAcao('btn-history', 'Historico', () => abrirModalHistorico(honorario.id)));
  }

  function criarCelulaAcoes(honorario) {
    const td = document.createElement('td');
    const wrap = criarElemento('div', 'actions-cell');

    if (isHonorarioAutomatico(honorario)) {
      if (honorario.processo?.id) {
        wrap.appendChild(criarBotaoAcao('btn-open', 'Abrir processo', () => abrirProcesso(honorario.processo.id)));
      }
      adicionarAcoesRecebimento(wrap, honorario);
    } else {
      adicionarAcoesRecebimento(wrap, honorario);
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

  async function abrirModalRecebimento(id) {
    const honorario = honorarios.find(h => h.id === id);
    if (!honorarioExisteSeguro(honorario)) {
      toast('Honorario nao encontrado na lista atual.', 'error');
      return;
    }

    honorarioRecebimentoId = id;
    saldoRecebimentoAtual = 0;

    byId('receiptModalSubtitle').textContent = `${clienteNome(honorario)} - ${processoNumero(honorario)}`;
    byId('receiptCliente').value = clienteNome(honorario);
    byId('receiptProcesso').value = processoNumero(honorario);
    byId('receiptValor').value = '';
    byId('receiptData').value = hojeISO();
    byId('receiptForma').value = 'pix';
    byId('receiptObservacao').value = '';
    byId('receiptValorTotal').textContent = moeda(honorario.valorTotal);
    byId('receiptTotalConfirmado').textContent = 'Carregando...';
    byId('receiptSaldo').textContent = 'Carregando...';
    byId('receiptSubmit').disabled = true;
    byId('receiptModal').classList.add('open');

    try {
      const recebimentos = await carregarRecebimentosHonorario(id);
      const totalConfirmado = totalConfirmadoRecebimentos(recebimentos);
      const valorTotal = Number(honorario.valorTotal || 0);
      saldoRecebimentoAtual = Math.max(0, Number((valorTotal - totalConfirmado).toFixed(2)));

      byId('receiptTotalConfirmado').textContent = moeda(totalConfirmado);
      byId('receiptSaldo').textContent = moeda(saldoRecebimentoAtual);
      byId('receiptSubmit').disabled = saldoRecebimentoAtual <= 0;

      if (saldoRecebimentoAtual <= 0) {
        toast('Este honorario nao possui saldo restante.', 'warning');
      }
    } catch (erro) {
      console.error('Erro ao carregar recebimentos do honorario:', erro);
      byId('receiptTotalConfirmado').textContent = '--';
      byId('receiptSaldo').textContent = '--';
      toast(`Erro ao carregar saldo do honorario. ${erro.message || ''}`.trim(), 'error');
    }
  }

  function honorarioExisteSeguro(honorario) {
    return Boolean(honorario && honorario.id != null);
  }

  function fecharModalRecebimento() {
    honorarioRecebimentoId = null;
    saldoRecebimentoAtual = 0;
    byId('receiptModal').classList.remove('open');
  }

  function validarPayloadRecebimento() {
    const valorRecebido = parseMoeda(byId('receiptValor').value);
    const dataRecebimento = byId('receiptData').value;
    const formaPagamento = byId('receiptForma').value;

    if (!valorRecebido || valorRecebido <= 0) {
      throw new Error('Informe um valor recebido maior que zero.');
    }

    if (valorRecebido > saldoRecebimentoAtual) {
      throw new Error('Valor recebido maior que o saldo restante.');
    }

    if (!dataRecebimento) {
      throw new Error('Informe a data do recebimento.');
    }

    if (!formaPagamento) {
      throw new Error('Informe a forma de pagamento.');
    }

    return {
      valorRecebido: toPayloadMoney(valorRecebido),
      dataRecebimento,
      formaPagamento,
      observacao: byId('receiptObservacao').value.trim()
    };
  }

  async function salvarRecebimento(event) {
    event.preventDefault();

    if (honorarioRecebimentoId == null) return;

    let payload;
    try {
      payload = validarPayloadRecebimento();
    } catch (erro) {
      toast(erro.message, 'warning');
      return;
    }

    byId('receiptSubmit').disabled = true;

    try {
      const resposta = await fetch(`${API_BASE}/recebimentos/honorario/${honorarioRecebimentoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resposta.ok) throw new Error(await lerMensagemErro(resposta));

      toast('Recebimento registrado com sucesso.', 'success');
      fecharModalRecebimento();
      await carregarHonorarios();
    } catch (erro) {
      console.error('Erro ao registrar recebimento:', erro);
      toast(`Erro ao registrar recebimento. ${erro.message || ''}`.trim(), 'error');
      byId('receiptSubmit').disabled = false;
    }
  }

  function setHistoricoEstado(tipo, titulo, mensagem) {
    const body = byId('historyBody');
    limparElemento(body);
    const box = criarElemento('div', `${tipo}-state`);
    box.appendChild(criarElemento('strong', null, titulo));
    box.appendChild(criarElemento('span', null, mensagem));
    body.appendChild(box);
  }

  async function abrirModalHistorico(id) {
    const honorario = honorarios.find(h => h.id === id);
    if (!honorarioExisteSeguro(honorario)) {
      toast('Honorario nao encontrado na lista atual.', 'error');
      return;
    }

    honorarioHistoricoId = id;
    byId('historyModalSubtitle').textContent = `${clienteNome(honorario)} - ${processoNumero(honorario)}`;
    byId('historyModal').classList.add('open');
    await carregarHistoricoHonorario(id);
  }

  function fecharModalHistorico() {
    honorarioHistoricoId = null;
    byId('historyModal').classList.remove('open');
  }

  async function carregarHistoricoHonorario(id) {
    setHistoricoEstado('loading', 'Carregando historico', 'Buscando recebimentos reais no backend.');

    try {
      const recebimentos = await carregarRecebimentosHonorario(id);
      renderizarHistorico(recebimentos);
    } catch (erro) {
      console.error('Erro ao carregar historico:', erro);
      setHistoricoEstado('error', 'Nao foi possivel carregar o historico', erro.message || 'Verifique a API de recebimentos.');
      toast(`Erro ao carregar historico. ${erro.message || ''}`.trim(), 'error');
    }
  }

  function renderizarHistorico(recebimentos) {
    const body = byId('historyBody');
    limparElemento(body);

    if (!recebimentos.length) {
      setHistoricoEstado('empty', 'Nenhum recebimento encontrado', 'Este honorario ainda nao possui recebimentos registrados.');
      return;
    }

    const lista = criarElemento('div', 'history-list');
    recebimentos.forEach(recebimento => lista.appendChild(criarItemHistorico(recebimento)));
    body.appendChild(lista);
  }

  function criarLinhaHistorico(rotulo, valor, classe) {
    const item = criarElemento('div', classe || null);
    const forte = criarElemento('strong', null, `${rotulo}: `);
    item.appendChild(forte);
    item.appendChild(document.createTextNode(texto(valor, '--')));
    return item;
  }

  function criarItemHistorico(recebimento) {
    const cancelado = isRecebimentoCancelado(recebimento);
    const item = criarElemento('div', `history-item${cancelado ? ' cancelado' : ''}`);

    const topo = criarElemento('div', 'history-top');
    const info = document.createElement('div');
    info.appendChild(criarElemento('div', 'history-value', moeda(recebimento.valorRecebido)));
    info.appendChild(criarElemento('div', 'cell-sub', dataLabel(recebimento.dataRecebimento)));
    topo.appendChild(info);

    const status = criarElemento(
      'span',
      `status-badge ${cancelado ? 'status-cancelado' : 'status-pago'}`,
      cancelado ? 'Cancelado' : 'Confirmado'
    );
    topo.appendChild(status);
    item.appendChild(topo);

    const grade = criarElemento('div', 'history-grid');
    grade.appendChild(criarLinhaHistorico('Forma', recebimento.formaPagamento));
    grade.appendChild(criarLinhaHistorico('Cadastro', dataLabel(recebimento.dataCadastro)));
    grade.appendChild(criarLinhaHistorico('Observacao', recebimento.observacao, 'history-note'));

    if (cancelado) {
      grade.appendChild(criarLinhaHistorico('Cancelamento', dataLabel(recebimento.dataCancelamento)));
      grade.appendChild(criarLinhaHistorico('Motivo', recebimento.motivoCancelamento, 'history-note'));
    }

    item.appendChild(grade);

    if (isRecebimentoConfirmado(recebimento)) {
      const acoes = criarElemento('div', 'actions-cell');
      acoes.style.marginTop = '12px';
      acoes.appendChild(criarBotaoAcao('btn-delete', 'Cancelar recebimento', () => cancelarRecebimento(recebimento.id)));
      item.appendChild(acoes);
    }

    return item;
  }

  async function cancelarRecebimento(id) {
    if (!confirm('Deseja cancelar este recebimento?')) return;

    const motivoCancelamento = window.prompt('Informe o motivo do cancelamento:');
    if (!motivoCancelamento || !motivoCancelamento.trim()) {
      toast('Motivo do cancelamento e obrigatorio.', 'warning');
      return;
    }

    try {
      const resposta = await fetch(`${API_BASE}/recebimentos/${id}/cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivoCancelamento: motivoCancelamento.trim() })
      });

      if (!resposta.ok) throw new Error(await lerMensagemErro(resposta));

      toast('Recebimento cancelado com sucesso.', 'success');

      if (honorarioHistoricoId != null) {
        await carregarHistoricoHonorario(honorarioHistoricoId);
      }

      await carregarHonorarios();
    } catch (erro) {
      console.error('Erro ao cancelar recebimento:', erro);
      toast(`Erro ao cancelar recebimento. ${erro.message || ''}`.trim(), 'error');
    }
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
    byId('receiptForm')?.addEventListener('submit', salvarRecebimento);
    byId('editModal')?.addEventListener('click', event => {
      if (event.target === byId('editModal')) fecharModalEdicao();
    });
    byId('receiptModal')?.addEventListener('click', event => {
      if (event.target === byId('receiptModal')) fecharModalRecebimento();
    });
    byId('historyModal')?.addEventListener('click', event => {
      if (event.target === byId('historyModal')) fecharModalHistorico();
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
      if (event.key === 'Escape') {
        fecharModalEdicao();
        fecharModalRecebimento();
        fecharModalHistorico();
      }
    });
  }

  window.carregarHonorarios = carregarHonorarios;
  window.fecharModalEdicao = fecharModalEdicao;
  window.fecharModalRecebimento = fecharModalRecebimento;
  window.fecharModalHistorico = fecharModalHistorico;

  document.addEventListener('DOMContentLoaded', () => {
    iniciarEventos();
    carregarHonorarios();
  });
})();
