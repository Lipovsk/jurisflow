(() => {
  'use strict';

  const API_BASE = 'http://localhost:8080';
  const MESES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  let compromissos = [];
  let clientes = [];
  let curDate = new Date();
  let filtroTipo = '';
  let filtroData = '';

  const byId = id => document.getElementById(id);

  function toast(mensagem, tipo = 'info') {
    if (window.JurisFlow?.showToast) {
      window.JurisFlow.showToast(mensagem, tipo);
      return;
    }
    console[tipo === 'error' ? 'error' : 'log'](mensagem);
  }

  function limpar(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function criar(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (textContent !== undefined) el.textContent = textContent;
    return el;
  }

  function texto(valor, vazio = '--') {
    const normalizado = String(valor ?? '').trim();
    return normalizado || vazio;
  }

  function normalizar(valor) {
    return String(valor ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]+/g, ' ');
  }

  function dataISO(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function parseData(data) {
    if (!data) return null;
    const parsed = new Date(`${data}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function formatarData(data) {
    const parsed = parseData(data);
    if (!parsed) return 'Sem data';
    if (typeof window.JurisFlowFormatarData === 'function') {
      return window.JurisFlowFormatarData(data);
    }
    return parsed.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });
  }

  function isAutomatico(compromisso) {
    return compromisso?.origem === 'PROCESSO_AUTOMATICO'
      || String(compromisso?.chaveIntegracao ?? '').trim() !== '';
  }

  function origemTipo(compromisso) {
    if (isAutomatico(compromisso)) return 'automatico';
    if (compromisso?.origem === 'MANUAL') return 'manual';
    return 'legado';
  }

  function origemLabel(compromisso) {
    const tipo = origemTipo(compromisso);
    if (tipo === 'automatico') return 'Gerado pelo processo';
    if (tipo === 'manual') return 'Manual';
    return 'Legado';
  }

  function tipoNormalizado(tipo) {
    return normalizar(tipo || 'compromisso');
  }

  function tipoLabel(tipo) {
    const labels = {
      audiencia: 'Audiencia',
      prazo: 'Prazo',
      reuniao: 'Reuniao',
      lembrete: 'Lembrete',
      tarefa: 'Tarefa',
      protocolo: 'Protocolo'
    };
    return labels[tipoNormalizado(tipo)] || 'Compromisso';
  }

  function dotClass(compromisso) {
    const tipo = tipoNormalizado(compromisso?.tipo);
    if (tipo === 'prazo') return 'red';
    if (tipo === 'audiencia') return 'blue';
    if (tipo === 'reuniao') return 'gold';
    if (tipo === 'tarefa') return 'green';
    if (normalizar(compromisso?.prioridade) === 'urgente') return 'red';
    return 'amber';
  }

  function iconePorTipo(tipo) {
    const icons = {
      audiencia: '📋',
      prazo: '⏰',
      reuniao: '🤝',
      lembrete: '🔔',
      tarefa: '✅',
      protocolo: '📄'
    };
    return icons[tipoNormalizado(tipo)] || '📌';
  }

  async function lerMensagemErro(response) {
    const body = await response.text();
    if (!body) return `HTTP ${response.status}`;
    try {
      const json = JSON.parse(body);
      return json.message || json.erro || json.error || body;
    } catch {
      return body;
    }
  }

  async function buscarJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(await lerMensagemErro(response));
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  function setEstado(containerId, tipo, titulo, mensagem) {
    const container = byId(containerId);
    if (!container) return;
    limpar(container);
    const box = criar('div', `state-box ${tipo}`);
    box.appendChild(criar('strong', null, titulo));
    box.appendChild(criar('span', null, mensagem));
    container.appendChild(box);
  }

  async function carregarCompromissos() {
    setEstado('tlBody', 'loading', 'Carregando agenda', 'Buscando compromissos reais no backend.');
    setEstado('prazosRapidosBody', 'loading', 'Carregando prazos', 'Buscando prazos reais no backend.');

    try {
      compromissos = await buscarJson(`${API_BASE}/compromissos`);
      renderCal();
      renderPrazosRapidos();
      renderTimeline();
    } catch (erro) {
      console.error('Erro ao carregar compromissos:', erro);
      setEstado('tlBody', 'error', 'Nao foi possivel carregar a agenda', erro.message || 'Verifique a API.');
      setEstado('prazosRapidosBody', 'error', 'Nao foi possivel carregar prazos', erro.message || 'Verifique a API.');
      toast(`Erro ao carregar agenda. ${erro.message || ''}`.trim(), 'error');
    }
  }

  function renderCal() {
    const month = byId('calMonth');
    const days = byId('calDays');
    if (!month || !days) return;

    month.textContent = `${MESES[curDate.getMonth()]} ${curDate.getFullYear()}`;
    limpar(days);

    const first = new Date(curDate.getFullYear(), curDate.getMonth(), 1).getDay();
    const total = new Date(curDate.getFullYear(), curDate.getMonth() + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < first; i += 1) {
      const other = criar('div', 'cal-day other-month', String(new Date(curDate.getFullYear(), curDate.getMonth(), -(first - 1 - i)).getDate()));
      days.appendChild(other);
    }

    for (let d = 1; d <= total; d += 1) {
      const date = new Date(curDate.getFullYear(), curDate.getMonth(), d);
      const iso = dataISO(date);
      const isToday = d === today.getDate() && curDate.getMonth() === today.getMonth() && curDate.getFullYear() === today.getFullYear();
      const hasEvent = compromissos.some(c => c.data === iso);
      const classes = ['cal-day'];
      if (isToday) classes.push('today');
      if (hasEvent) classes.push('has-event');
      if (filtroData === iso && !isToday) classes.push('selected');

      const day = criar('div', classes.join(' '), String(d));
      day.addEventListener('click', () => {
        filtroData = filtroData === iso ? '' : iso;
        renderCal();
        renderTimeline();
      });
      days.appendChild(day);
    }
  }

  function renderPrazosRapidos() {
    const box = byId('prazosRapidosBody');
    if (!box) return;
    limpar(box);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const prazos = compromissos
      .filter(c => tipoNormalizado(c.tipo) === 'prazo')
      .filter(c => c.data)
      .sort((a, b) => String(a.data).localeCompare(String(b.data)))
      .slice(0, 5);

    if (!prazos.length) {
      setEstado('prazosRapidosBody', 'empty', 'Nenhum prazo cadastrado', 'Nao ha prazos reais para listar.');
      return;
    }

    prazos.forEach(c => {
      const data = parseData(c.data);
      const diff = data ? Math.ceil((data - hoje) / 86400000) : null;
      const label = diff === 0 ? 'Hoje'
        : diff === 1 ? 'Amanha'
          : data ? formatarData(c.data) : 'Sem data';
      const cor = diff != null && diff <= 0 ? '#DC2626'
        : diff != null && diff <= 3 ? '#D97706'
          : '#2563EB';
      const bg = diff != null && diff <= 0 ? '#FEF2F2'
        : diff != null && diff <= 3 ? '#FFFBEB'
          : '#EEF3FF';

      const item = criar('div', 'deadline-item');
      const strip = criar('div', 'dl-strip');
      strip.style.background = cor;
      item.appendChild(strip);

      const info = criar('div', 'dl-info');
      info.appendChild(criar('div', 'dl-title', texto(c.titulo, 'Prazo sem titulo')));
      info.appendChild(criar('div', 'dl-client', texto(c.cliente?.nome, 'Cliente nao informado')));
      item.appendChild(info);

      const date = criar('div', 'dl-date', label);
      date.style.background = bg;
      date.style.color = cor;
      item.appendChild(date);
      box.appendChild(item);
    });
  }

  function filtrosAtuais() {
    return {
      busca: normalizar(byId('agendaBusca')?.value),
      status: normalizar(byId('agendaStatus')?.value),
      prioridade: normalizar(byId('agendaPrioridade')?.value),
      origem: normalizar(byId('agendaOrigem')?.value)
    };
  }

  function compromissosFiltrados() {
    const filtros = filtrosAtuais();

    return compromissos
      .filter(c => c.data)
      .filter(c => !filtroTipo || tipoNormalizado(c.tipo) === filtroTipo)
      .filter(c => !filtroData || c.data === filtroData)
      .filter(c => !filtros.status || normalizar(c.status) === filtros.status)
      .filter(c => !filtros.prioridade || normalizar(c.prioridade) === filtros.prioridade)
      .filter(c => !filtros.origem || origemTipo(c) === filtros.origem)
      .filter(c => {
        if (!filtros.busca) return true;
        const textoBusca = normalizar([
          c.titulo,
          c.descricao,
          c.cliente?.nome,
          c.processo?.numero
        ].join(' '));
        return textoBusca.includes(filtros.busca);
      })
      .sort((a, b) => String(a.data).localeCompare(String(b.data)) || String(a.hora || '').localeCompare(String(b.hora || '')));
  }

  function renderTimeline() {
    const box = byId('tlBody');
    if (!box) return;
    limpar(box);

    const lista = compromissosFiltrados();
    const sub = byId('agendaTimelineSub');
    if (sub) {
      sub.textContent = filtroData
        ? `${lista.length} compromisso(s) em ${filtroData}`
        : `${lista.length} compromisso(s) real(is) carregado(s)`;
    }

    if (!lista.length) {
      setEstado('tlBody', 'empty', 'Nenhum compromisso encontrado', 'Ajuste os filtros ou crie um compromisso manual.');
      return;
    }

    lista.forEach(c => box.appendChild(criarItemTimeline(c)));
  }

  function criarItemTimeline(c) {
    const tipo = tipoNormalizado(c.tipo);
    const cor = dotClass(c);
    const automatico = isAutomatico(c);
    const item = criar('div', 'tl-item');
    item.dataset.tipo = tipoLabel(tipo);

    const left = criar('div', 'tl-left');
    left.appendChild(criar('div', `tl-dot ${cor}`, iconePorTipo(tipo)));
    left.appendChild(criar('div', 'tl-line'));
    item.appendChild(left);

    const content = criar('div', 'tl-content');
    content.appendChild(criar('div', 'tl-date-tag', `${formatarData(c.data)} - ${c.hora || 'Dia inteiro'}`));
    content.appendChild(criar('div', 'tl-event-title', texto(c.titulo, 'Compromisso sem titulo')));

    const detalhes = [];
    if (c.cliente?.nome) detalhes.push(`Cliente: ${c.cliente.nome}`);
    if (c.processo?.numero) detalhes.push(`Processo: ${c.processo.numero}`);
    if (c.descricao) detalhes.push(c.descricao);
    content.appendChild(criar('div', 'tl-event-detail', detalhes.join(' - ') || 'Sem cliente/processo vinculado.'));

    const tags = criar('div', 'tl-tags');
    tags.appendChild(criar('span', `tl-tag ${cor}`, tipoLabel(tipo)));
    tags.appendChild(criar('span', `tl-tag ${cor}`, texto(c.status, 'agendado')));
    tags.appendChild(criar('span', `tl-tag ${cor}`, texto(c.prioridade, 'sem prioridade')));
    tags.appendChild(criar('span', `origin-badge origin-${origemTipo(c)}`, origemLabel(c)));
    content.appendChild(tags);

    const actions = criar('div', 'tl-actions');
    if (automatico) {
      if (c.processo?.id) {
        actions.appendChild(criarBotao('btn-abrir-processo', 'Abrir processo', () => {
          window.location.href = `detalhes-processo.html?id=${encodeURIComponent(c.processo.id)}`;
        }));
      }
    } else {
      if (normalizar(c.status) !== 'concluido') {
        actions.appendChild(criarBotao('btn-concluir-compromisso', 'Concluir', () => concluirCompromisso(c.id)));
      }
      actions.appendChild(criarBotao('btn-excluir-compromisso', 'Excluir', () => excluirCompromisso(c.id)));
    }

    if (actions.childNodes.length) content.appendChild(actions);
    item.appendChild(content);
    return item;
  }

  function criarBotao(className, label, handler) {
    const button = criar('button', className, label);
    button.type = 'button';
    button.addEventListener('click', handler);
    return button;
  }

  async function concluirCompromisso(id) {
    const compromisso = compromissos.find(c => String(c.id) === String(id));
    if (!compromisso || isAutomatico(compromisso)) return;

    try {
      const response = await fetch(`${API_BASE}/compromissos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: compromisso.titulo,
          tipo: compromisso.tipo,
          data: compromisso.data,
          hora: compromisso.hora,
          descricao: compromisso.descricao,
          status: 'concluido',
          prioridade: compromisso.prioridade,
          clienteId: compromisso.cliente?.id ?? null,
          processoId: compromisso.processo?.id ?? null
        })
      });

      if (!response.ok) throw new Error(await lerMensagemErro(response));
      toast('Compromisso concluido com sucesso.', 'success');
      await carregarCompromissos();
    } catch (erro) {
      console.error('Erro ao concluir compromisso:', erro);
      toast(`Erro ao concluir compromisso. ${erro.message || ''}`.trim(), 'error');
    }
  }

  async function excluirCompromisso(id) {
    const compromisso = compromissos.find(c => String(c.id) === String(id));
    if (!compromisso || isAutomatico(compromisso)) return;
    if (!confirm('Deseja realmente excluir este compromisso?')) return;

    try {
      const response = await fetch(`${API_BASE}/compromissos/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await lerMensagemErro(response));
      toast('Compromisso excluido com sucesso.', 'success');
      await carregarCompromissos();
    } catch (erro) {
      console.error('Erro ao excluir compromisso:', erro);
      toast(`Erro ao excluir compromisso. ${erro.message || ''}`.trim(), 'error');
    }
  }

  async function carregarClientes() {
    try {
      clientes = await buscarJson(`${API_BASE}/clientes`);
    } catch (erro) {
      console.error('Erro ao carregar clientes:', erro);
      clientes = [];
    }
  }

  function renderAutocompleteClientes() {
    const input = byId('ncClienteBusca');
    const drop = byId('ncAcDrop');
    if (!input || !drop) return;

    const q = normalizar(input.value);
    limpar(drop);

    if (!q) {
      drop.classList.remove('active');
      return;
    }

    const hits = clientes
      .filter(c => normalizar(`${c.nome || ''} ${c.cpfCnpj || ''}`).includes(q))
      .slice(0, 8);

    if (!hits.length) {
      drop.appendChild(criar('div', 'nc-ac-empty', 'Nenhum cliente encontrado'));
      drop.classList.add('active');
      return;
    }

    hits.forEach(cliente => {
      const item = criar('div', 'nc-ac-item');
      item.dataset.id = cliente.id;
      item.dataset.nome = cliente.nome || '';
      item.appendChild(criar('div', 'nc-ac-av', iniciais(cliente.nome)));
      const info = document.createElement('div');
      info.appendChild(criar('div', 'nc-ac-name', texto(cliente.nome, 'Cliente sem nome')));
      info.appendChild(criar('div', 'nc-ac-cpf', texto(cliente.cpfCnpj, 'Documento nao informado')));
      item.appendChild(info);
      item.addEventListener('mousedown', event => {
        event.preventDefault();
        input.value = cliente.nome || '';
        byId('ncClienteId').value = cliente.id || '';
        drop.classList.remove('active');
        updateSummary();
      });
      drop.appendChild(item);
    });
    drop.classList.add('active');
  }

  function iniciais(nome) {
    const partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'JF';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
  }

  function openDrawer() {
    byId('dwOverlay')?.classList.add('open');
    byId('ncDrawer')?.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => byId('ncTitulo')?.focus(), 80);
  }

  function closeDrawer() {
    byId('dwOverlay')?.classList.remove('open');
    byId('ncDrawer')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  function setActive(selector, current) {
    document.querySelectorAll(selector).forEach(button => button.classList.toggle('active', button === current));
  }

  function updateSummary() {
    const hint = byId('dwsHint');
    const content = byId('dwsSummaryContent');
    const badge = byId('dwsBadgeWrap');
    const rows = byId('dwsRows');
    if (!hint || !content || !badge || !rows) return;

    const values = [
      ['Titulo', byId('ncTitulo')?.value],
      ['Cliente', byId('ncClienteBusca')?.value],
      ['Processo', byId('ncProcesso')?.value],
      ['Data', byId('ncData')?.value],
      ['Horario', byId('ncDiaInteiro')?.checked ? 'Dia inteiro' : byId('ncHoraInicio')?.value],
      ['Prioridade', byId('ncPrioridade')?.value],
      ['Status', byId('ncStatus')?.value]
    ].filter(([, value]) => String(value ?? '').trim());

    if (!values.length) {
      hint.style.display = '';
      content.style.display = 'none';
      return;
    }

    hint.style.display = 'none';
    content.style.display = 'flex';
    limpar(badge);
    const tipo = document.querySelector('.nc-type.active')?.dataset.type || 'audiencia';
    badge.appendChild(criar('span', `tl-tag ${dotClass({ tipo })}`, `${iconePorTipo(tipo)} ${tipoLabel(tipo)}`));

    limpar(rows);
    values.forEach(([label, value], index) => {
      if (index > 0) rows.appendChild(criar('div', 'dws-sep'));
      const item = criar('div', 'dws-item');
      item.appendChild(criar('div', 'dws-rlabel', label));
      item.appendChild(criar('div', 'dws-rvalue', texto(value)));
      rows.appendChild(item);
    });
  }

  function resetForm() {
    ['ncTitulo', 'ncClienteBusca', 'ncClienteId', 'ncProcesso', 'ncDescricao', 'ncData', 'ncLocal', 'ncCidade', 'ncLink', 'ncTribunal', 'ncSala', 'ncObs']
      .forEach(id => {
        const el = byId(id);
        if (el) el.value = '';
      });
    limpar(byId('ncFileList'));
    byId('ncHoraInicio').value = '09:00';
    byId('ncHoraFim').value = '10:00';
    byId('ncPrioridade').value = 'media';
    byId('ncStatus').value = 'agendado';
    byId('ncDiaInteiro').checked = false;
    byId('ncHoraInicioWrap').style.display = '';
    byId('ncHoraFimWrap').style.display = '';
    document.querySelectorAll('.nc-type').forEach((button, index) => button.classList.toggle('active', index === 0));
    document.querySelectorAll('.nc-pri').forEach(button => button.classList.toggle('active', button.dataset.p === 'media'));
    document.querySelectorAll('.nc-stat').forEach(button => button.classList.toggle('active', button.dataset.s === 'agendado'));
    byId('ncObsCount').textContent = '0';
    updateSummary();
  }

  async function salvarCompromisso(createAnother) {
    const titulo = byId('ncTitulo')?.value.trim();
    const data = byId('ncData')?.value;
    const saveBtn = byId('dwSave');

    if (!titulo) {
      byId('ncTitulo')?.classList.add('error');
      byId('ncTitulo')?.focus();
      toast('Preencha o titulo do compromisso.', 'warning');
      return;
    }

    if (!data) {
      byId('ncData')?.classList.add('error');
      byId('ncData')?.focus();
      toast('Selecione a data do compromisso.', 'warning');
      return;
    }

    const payload = {
      titulo,
      tipo: document.querySelector('.nc-type.active')?.dataset.type || 'audiencia',
      data,
      hora: byId('ncDiaInteiro')?.checked ? '' : byId('ncHoraInicio')?.value,
      descricao: byId('ncDescricao')?.value.trim(),
      status: byId('ncStatus')?.value,
      prioridade: byId('ncPrioridade')?.value,
      clienteId: Number(byId('ncClienteId')?.value) || null,
      processoId: null
    };

    try {
      if (saveBtn) saveBtn.disabled = true;
      const response = await fetch(`${API_BASE}/compromissos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(await lerMensagemErro(response));
      toast('Compromisso salvo com sucesso.', 'success');

      if (createAnother) resetForm();
      else closeDrawer();

      await carregarCompromissos();
    } catch (erro) {
      console.error('Erro ao salvar compromisso:', erro);
      toast(`Erro ao salvar compromisso. ${erro.message || ''}`.trim(), 'error');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  function desabilitarRecursosNaoConfigurados() {
    const repeticao = byId('ncRepeticao');
    if (repeticao) {
      repeticao.value = 'nao';
      repeticao.disabled = true;
      repeticao.title = 'Recorrencia ainda nao configurada.';
    }

    const lembrete = byId('ncLembreteToggle');
    if (lembrete) {
      lembrete.checked = false;
      lembrete.disabled = true;
      lembrete.title = 'Lembretes automaticos ainda nao configurados.';
    }

    const lembreteOptions = byId('ncLembreteOptions');
    if (lembreteOptions) lembreteOptions.style.display = 'none';

    const uploadBtn = byId('ncUploadBtn');
    const fileInput = byId('ncFileInput');
    const uploadZone = byId('ncUploadZone');
    if (uploadBtn) {
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Upload ainda nao configurado';
    }
    if (fileInput) fileInput.disabled = true;
    if (uploadZone) uploadZone.title = 'Upload de arquivos ainda nao configurado.';
  }

  function iniciarEventos() {
    byId('calPrev')?.addEventListener('click', () => {
      curDate.setMonth(curDate.getMonth() - 1);
      renderCal();
    });
    byId('calNext')?.addEventListener('click', () => {
      curDate.setMonth(curDate.getMonth() + 1);
      renderCal();
    });

    byId('btnNovoCompromisso')?.addEventListener('click', openDrawer);
    byId('dwClose')?.addEventListener('click', closeDrawer);
    byId('dwCancel')?.addEventListener('click', closeDrawer);
    byId('dwOverlay')?.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeDrawer();
      if (event.altKey && (event.key === 'n' || event.key === 'N')) {
        event.preventDefault();
        openDrawer();
      }
    });

    document.querySelectorAll('.nc-type').forEach(button => {
      button.addEventListener('click', () => {
        setActive('.nc-type', button);
        byId('dwHeaderIcon').textContent = iconePorTipo(button.dataset.type);
        updateSummary();
      });
    });

    document.querySelectorAll('.nc-pri').forEach(button => {
      button.addEventListener('click', () => {
        setActive('.nc-pri', button);
        byId('ncPrioridade').value = button.dataset.p;
        updateSummary();
      });
    });

    document.querySelectorAll('.nc-stat').forEach(button => {
      button.addEventListener('click', () => {
        setActive('.nc-stat', button);
        byId('ncStatus').value = button.dataset.s;
        updateSummary();
      });
    });

    byId('ncDiaInteiro')?.addEventListener('change', event => {
      byId('ncHoraInicioWrap').style.display = event.target.checked ? 'none' : '';
      byId('ncHoraFimWrap').style.display = event.target.checked ? 'none' : '';
      updateSummary();
    });

    byId('ncClienteBusca')?.addEventListener('input', renderAutocompleteClientes);
    byId('ncClienteBusca')?.addEventListener('blur', () => setTimeout(() => byId('ncAcDrop')?.classList.remove('active'), 160));

    ['ncTitulo', 'ncClienteBusca', 'ncProcesso', 'ncData', 'ncHoraInicio'].forEach(id => {
      byId(id)?.addEventListener('input', updateSummary);
      byId(id)?.addEventListener('change', updateSummary);
    });

    byId('ncTitulo')?.addEventListener('input', () => byId('ncTitulo')?.classList.remove('error'));
    byId('ncData')?.addEventListener('change', () => byId('ncData')?.classList.remove('error'));

    byId('ncObs')?.addEventListener('input', event => {
      if (event.target.value.length > 600) event.target.value = event.target.value.substring(0, 600);
      byId('ncObsCount').textContent = String(event.target.value.length);
    });

    byId('dwSave')?.addEventListener('click', () => salvarCompromisso(false));
    byId('dwSaveOther')?.addEventListener('click', () => salvarCompromisso(true));

    ['agendaBusca', 'agendaStatus', 'agendaPrioridade', 'agendaOrigem'].forEach(id => {
      byId(id)?.addEventListener('input', renderTimeline);
      byId(id)?.addEventListener('change', renderTimeline);
    });

    desabilitarRecursosNaoConfigurados();
  }

  window.filterTl = (tipo, btn) => {
    document.querySelectorAll('.tab-btn').forEach(button => button.classList.remove('active'));
    btn?.classList.add('active');
    filtroTipo = tipo ? tipoNormalizado(tipo) : '';
    renderTimeline();
  };

  document.addEventListener('DOMContentLoaded', async () => {
    iniciarEventos();
    await carregarClientes();
    await carregarCompromissos();
  });
})();
