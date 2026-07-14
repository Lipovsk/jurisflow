/**
 * JurisFlow — Lançar Honorário
 */

function getIniciais(nome) {
  if (!nome) return '?';
  const p = nome.trim().split(' ').filter(Boolean);
  return p.length === 1 ? p[0].substring(0, 2).toUpperCase() : (p[0][0] + p[1][0]).toUpperCase();
}

let clientesBackend = [];
let processosBackend = [];

async function carregarClientesBackend() {
  try {
    const response = await fetch('http://localhost:8080/clientes');
    if (!response.ok) throw new Error(`GET /clientes retornou ${response.status}`);
    const dados = await response.json();
    clientesBackend = Array.isArray(dados) ? dados : [];
  } catch (erro) {
    console.error('Erro clientes:', erro);
    clientesBackend = [];
    window.JurisFlow?.showToast('Não foi possível carregar os clientes reais da API.', 'error');
  }
}

async function carregarProcessosBackend() {
  try {
    const response = await fetch('http://localhost:8080/processos');
    if (!response.ok) throw new Error(`GET /processos retornou ${response.status}`);
    const dados = await response.json();
    processosBackend = Array.isArray(dados) ? dados : [];
  } catch (erro) {
    console.error('Erro processos:', erro);
    processosBackend = [];
    window.JurisFlow?.showToast('Não foi possível carregar os processos reais da API.', 'warning');
  }
}

function getClientesDisponiveis() {
  return clientesBackend.map(c => ({
    id: String(c.id),
    nome: String(c.nome ?? ''),
    cpf: String(c.cpfCnpj ?? ''),
    iniciais: getIniciais(c.nome)
  }));
}

function getProcessosDisponiveis() {
  return processosBackend.map(p => ({
    id: String(p.id),
    num: String(p.numero ?? ''),
    area: String(p.areaJuridica ?? ''),
    clienteId: String(p.cliente?.id || p.clienteId || '')
  }));
}

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const TIPO_LABELS = {
  fixo: 'Contrato Fixo',
  exito: 'Por Êxito',
  consulta: 'Consulta',
  hora: 'Hora Trabalhada',
  retainer: 'Retainer Mensal',
  adhoc: 'Avulso / Ad Hoc',
};

const PGTO_LABELS = {
  pix: 'PIX',
  boleto: 'Boleto',
  ted: 'TED / DOC',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  cheque: 'Cheque',
};

const MESES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// ── Currency mask ─────────────────────────────────────────
function maskCurrency(v) {
  v = v.replace(/\D/g, '');
  if (!v) return '';
  return (parseInt(v, 10) / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
}

function parseCurrency(v) {
  if (!v) return 0;
  const limpo = String(v)
    .trim()
    .replace(/^R\$\s?/i, '')
    .replace(/[^\d,.-]/g, '');
  if (!limpo) return 0;
  const normalizado = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo.replace(/\.(?=\d{3}(\D|$))/g, '');
  return Number.parseFloat(normalizado) || 0;
}

function formatBRL(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toPayloadMoney(n) {
  return Number(Number(n || 0).toFixed(2));
}

function getValoresHonorario() {
  const bruto = parseCurrency(document.getElementById('valorBruto')?.value);
  const acrescimos = parseCurrency(document.getElementById('acrescimos')?.value);
  const descInp = document.getElementById('desconto')?.value;
  const descMode = document.getElementById('descTypeBtn')?.dataset.mode || 'pct';
  let desconto = 0;

  if (descInp) {
    const raw = parseCurrency(descInp);
    desconto = descMode === 'pct' ? (bruto * raw / 100) : raw;
  }

  return {
    valorBruto: bruto,
    desconto,
    acrescimos,
    valorTotal: bruto - desconto + acrescimos
  };
}

function clienteSelecionado() {
  const id = document.getElementById('clienteId')?.value;
  return getClientesDisponiveis().find(c => c.id === id) || null;
}

function processoSelecionado() {
  const id = document.getElementById('processoId')?.value;
  return getProcessosDisponiveis().find(p => p.id === id) || null;
}

function processoPertenceAoCliente(processo, clienteId) {
  return Boolean(processo && clienteId && String(processo.clienteId) === String(clienteId));
}

function limparProcessoSelecionado() {
  const input = document.getElementById('processoBusca');
  const hidden = document.getElementById('processoId');
  if (input) input.value = '';
  if (hidden) hidden.value = '';
  updatePreview();
}

function applyMasks() {
  document.querySelectorAll('[data-mask="currency"]').forEach(el => {
    el.addEventListener('input', e => {
      e.target.value = maskCurrency(e.target.value);
      recalcularValores();
    });
  });
}

// ── Validation ────────────────────────────────────────────
function setField(input, ok, msg) {
  if (!input) return;
  const g = input.closest('.fg');
  if (!g) return;
  g.classList.toggle('has-error', !ok);
  input.classList.toggle('error', !ok);
  input.classList.toggle('valid', ok && String(input.value).trim() !== '');
  const e = g.querySelector('.ferr');
  if (e && msg) e.textContent = msg;
}

function validateForm() {
  let ok = true;
  document.querySelectorAll('#formHonorario [required]').forEach(el => {
    const v = String(el.value).trim() !== '';
    setField(el, v);
    if (!v) ok = false;
  });

  const clienteInput = document.getElementById('clienteBusca');
  const clienteHidden = document.getElementById('clienteId');
  const cliente = clienteSelecionado();
  if (!clienteHidden?.value || !cliente) {
    setField(clienteInput, false, 'Selecione um cliente da lista');
    ok = false;
  }

  const processoInput = document.getElementById('processoBusca');
  const processoHidden = document.getElementById('processoId');
  const processoInformado = Boolean(processoInput?.value.trim() || processoHidden?.value);
  if (processoInformado) {
    const processo = processoSelecionado();
    if (!processo) {
      setField(processoInput, false, 'Selecione um processo da lista ou deixe em branco');
      ok = false;
    } else if (!processoPertenceAoCliente(processo, clienteHidden?.value)) {
      setField(processoInput, false, 'O processo selecionado não pertence ao cliente');
      ok = false;
    } else {
      setField(processoInput, true);
    }
  } else {
    setField(processoInput, true);
  }

  const compMes = document.getElementById('compMes');
  const compAno = document.getElementById('compAno');
  if (Boolean(compMes?.value) !== Boolean(compAno?.value)) {
    setField(compMes?.value ? compAno : compMes, false, 'Preencha mês e ano, ou deixe ambos em branco');
    ok = false;
  } else {
    setField(compMes, true);
    setField(compAno, true);
  }

  const valores = getValoresHonorario();
  const valorBrutoInput = document.getElementById('valorBruto');
  if (valores.valorBruto <= 0) {
    setField(valorBrutoInput, false, 'Informe um valor bruto maior que zero');
    ok = false;
  }

  if (valores.valorTotal < 0) {
    setField(document.getElementById('desconto'), false, 'O valor total não pode ser negativo');
    ok = false;
  } else {
    setField(document.getElementById('desconto'), true);
  }

  return ok;
}

function initRealtimeValidation() {
  document.querySelectorAll('#formHonorario .finput').forEach(el => {
    el.addEventListener('blur', () => {
      if (el.hasAttribute('required')) setField(el, String(el.value).trim() !== '');
    });
    el.addEventListener('input', () => {
      if (el.classList.contains('error')) setField(el, String(el.value).trim() !== '');
    });
  });
}

// ── Autocomplete helper ───────────────────────────────────
function appendHighlightedText(container, text, q) {
  const value = String(text ?? '');
  const query = String(q ?? '');
  if (!query) {
    container.textContent = value;
    return;
  }

  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  value.split(re).forEach((part, index) => {
    if (!part) return;
    if (index % 2 === 0) {
      container.appendChild(document.createTextNode(part));
      return;
    }
    const mark = document.createElement('mark');
    mark.textContent = part;
    container.appendChild(mark);
  });
}

// ── Cliente Autocomplete ──────────────────────────────────
function initClienteAutocomplete() {
  const input = document.getElementById('clienteBusca');
  const dropdown = document.getElementById('acDropdown');
  const hidden = document.getElementById('clienteId');
  if (!input) return;

  function openDropdown(results, q) {
    if (!results.length) {
      const empty = document.createElement('div');
      empty.className = 'ac-empty';
      empty.textContent = `Nenhum cliente encontrado para "${q}"`;
      dropdown.replaceChildren(empty);
    } else {
      const fragment = document.createDocumentFragment();
      results.forEach(c => {
        const item = document.createElement('div');
        item.className = 'ac-item';
        item.dataset.id = c.id;

        const avatar = document.createElement('div');
        avatar.className = 'ac-item-avatar';
        avatar.textContent = c.iniciais;
        item.appendChild(avatar);

        const info = document.createElement('div');
        info.className = 'ac-item-info';
        const name = document.createElement('div');
        name.className = 'ac-item-name';
        appendHighlightedText(name, c.nome, q);
        info.appendChild(name);

        const cpf = document.createElement('div');
        cpf.className = 'ac-item-cpf';
        cpf.textContent = c.cpf;
        info.appendChild(cpf);
        item.appendChild(info);

        item.addEventListener('mousedown', e => {
          e.preventDefault();
          const c = getClientesDisponiveis().find(x => x.id === item.dataset.id);
          if (c) selectCliente(c);
        });
        fragment.appendChild(item);
      });
      dropdown.replaceChildren(fragment);
    }
    dropdown.classList.add('active');
  }

  function selectCliente(c) {
    input.value = c.nome;
    hidden.value = c.id;
    dropdown.classList.remove('active');
    input.classList.remove('error');
    input.classList.add('valid');
    input.closest('.fg')?.classList.remove('has-error');
    const processo = processoSelecionado();
    if (processo && !processoPertenceAoCliente(processo, c.id)) {
      limparProcessoSelecionado();
      window.JurisFlow?.showToast('Processo removido porque pertence a outro cliente.', 'warning');
    }
    updatePreview();
    window.JurisFlow?.showToast(`Cliente "${c.nome}" vinculado.`, 'success');
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    hidden.value = '';
    limparProcessoSelecionado();
    if (!q) { dropdown.classList.remove('active'); return; }
    const busca = normalizarTexto(q);
    const results = getClientesDisponiveis().filter(c =>
      normalizarTexto(c.nome).includes(busca) || c.cpf.includes(q)
    );
    openDropdown(results, q);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.remove('active'), 180);
    if (!hidden.value && input.value.trim()) {
      input.value = '';
      window.JurisFlow?.showToast('Selecione um cliente da lista.', 'warning');
    }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#clienteWrap')) dropdown.classList.remove('active');
  });
}

// ── Processo Autocomplete ─────────────────────────────────
function initProcessoAutocomplete() {
  const input = document.getElementById('processoBusca');
  const dropdown = document.getElementById('acDropdownProc');
  const hidden = document.getElementById('processoId');
  if (!input) return;

  function openDropdown(results, q) {
    const clienteId = document.getElementById('clienteId')?.value;
    if (!clienteId) {
      const empty = document.createElement('div');
      empty.className = 'ac-empty';
      empty.textContent = 'Selecione um cliente antes de vincular um processo';
      dropdown.replaceChildren(empty);
      dropdown.classList.add('active');
      return;
    }
    if (!results.length) {
      const empty = document.createElement('div');
      empty.className = 'ac-empty';
      empty.textContent = 'Nenhum processo encontrado para este cliente';
      dropdown.replaceChildren(empty);
    } else {
      const fragment = document.createDocumentFragment();
      results.forEach(p => {
        const item = document.createElement('div');
        item.className = 'ac-item';
        item.dataset.id = p.id;

        const avatar = document.createElement('div');
        avatar.className = 'ac-item-avatar';
        avatar.style.cssText = 'background:var(--blue-soft);color:var(--blue-accent);font-size:.7rem;';
        avatar.textContent = '📁';
        item.appendChild(avatar);

        const info = document.createElement('div');
        info.className = 'ac-item-info';
        const numero = document.createElement('div');
        numero.className = 'ac-item-name';
        appendHighlightedText(numero, p.num, q);
        const area = document.createElement('div');
        area.className = 'ac-item-cpf';
        area.textContent = p.area;
        info.append(numero, area);
        item.appendChild(info);

        item.addEventListener('mousedown', e => {
          e.preventDefault();
          const p = getProcessosDisponiveis().find(x => x.id === item.dataset.id);
          if (p) {
            input.value = p.num;
            hidden.value = p.id;
            dropdown.classList.remove('active');
            input.classList.remove('error');
            input.classList.add('valid');
            input.closest('.fg')?.classList.remove('has-error');
            updatePreview();
          }
        });
        fragment.appendChild(item);
      });
      dropdown.replaceChildren(fragment);
    }
    dropdown.classList.add('active');
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    hidden.value = '';
    if (!q) { dropdown.classList.remove('active'); return; }
    const clienteId = document.getElementById('clienteId')?.value;
    const busca = normalizarTexto(q);
    const results = getProcessosDisponiveis().filter(p =>
      processoPertenceAoCliente(p, clienteId) &&
      (normalizarTexto(p.num).includes(busca) || normalizarTexto(p.area).includes(busca))
    );
    openDropdown(results, q);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.remove('active'), 180);
    if (!hidden.value && input.value.trim()) {
      input.value = '';
      window.JurisFlow?.showToast('Selecione um processo da lista ou deixe em branco.', 'warning');
      updatePreview();
    }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#processoWrap')) dropdown.classList.remove('active');
  });
}

// ── Tipo de Honorário ─────────────────────────────────────
function initTipoHonorario() {
  const btns = document.querySelectorAll('.thbtn');
  const hidden = document.getElementById('tipoHonorario');
  const campoHora = document.getElementById('campoHora');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tipo = btn.dataset.tipo;
      if (hidden) hidden.value = tipo;
      campoHora.style.display = tipo === 'hora' ? 'block' : 'none';
      updatePreview();
    });
  });

  // Hora trabalhada: calcular valor bruto automaticamente
  const horasInput = document.getElementById('horasTrabalhadas');
  const valorHoraInput = document.getElementById('valorHora');
  function calcHoras() {
    const h = parseFloat(horasInput?.value || 0);
    const v = parseCurrency(valorHoraInput?.value);
    if (h > 0 && v > 0) {
      const total = h * v;
      const brutoInput = document.getElementById('valorBruto');
      if (brutoInput) {
        brutoInput.value = formatBRL(total);
        recalcularValores();
      }
    }
  }
  horasInput?.addEventListener('input', calcHoras);
  valorHoraInput?.addEventListener('input', calcHoras);
}

// ── Forma de Pagamento ────────────────────────────────────
function initPagamento() {
  const btns = document.querySelectorAll('.pgbtn');
  const hidden = document.getElementById('formaPagamento');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (hidden) hidden.value = btn.dataset.pgto;
      updatePreview();
    });
  });
}

// ── Parcelamento ──────────────────────────────────────────
function initParcelamento() {
  const pFooter = document.getElementById('pcParcelas');
  if (pFooter) {
    pFooter.textContent = 'Parcelamento, vencimento e baixa serão configurados na próxima etapa financeira.';
  }
}

// ── Status Inicial ────────────────────────────────────────
function initStatusHonorario() {
  const btns = document.querySelectorAll('.shbtn');
  const hidden = document.getElementById('statusHonorario');
  const campoPgto = document.getElementById('campoDataPgto');
  const campoParcial = document.getElementById('campoValorParcial');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const s = btn.dataset.s;
      if (hidden) hidden.value = s;
      if (campoPgto) campoPgto.style.display = 'none';
      if (campoParcial) campoParcial.style.display = 'none';
      updatePreview();
    });
  });
}

// ── Notificações ficam para a etapa financeira ────────────
function initNotifToggle() {
}

// ── Desconto toggle (%/R$) ────────────────────────────────
function initDescontoToggle() {
  const btn = document.getElementById('descTypeBtn');
  const pfx = document.getElementById('descPfx');
  const inp = document.getElementById('desconto');
  if (!btn) return;
  inp?.addEventListener('input', recalcularValores);
  btn.addEventListener('click', () => {
    const isP = btn.dataset.mode === 'pct';
    btn.dataset.mode = isP ? 'val' : 'pct';
    btn.textContent = isP ? 'R$' : '%';
    pfx.textContent = isP ? 'R$' : '%';
    inp.value = '';
    recalcularValores();
  });
}

// ── Recalcular Valores ────────────────────────────────────
function recalcularValores() {
  const valores = getValoresHonorario();

  document.getElementById('vrBruto').textContent = `R$ ${formatBRL(valores.valorBruto)}`;
  document.getElementById('vrDesconto').textContent = `— R$ ${formatBRL(valores.desconto)}`;
  document.getElementById('vrAcrescimos').textContent = `+ R$ ${formatBRL(valores.acrescimos)}`;
  document.getElementById('vrTotal').textContent = `R$ ${formatBRL(valores.valorTotal)}`;

  document.getElementById('pcTotal').textContent = `R$ ${formatBRL(valores.valorTotal)}`;

  // Mostrar preview se tiver dados
  updatePreview();
}

// ── Preview ───────────────────────────────────────────────
function updatePreview() {
  const clienteResumo = document.getElementById('clienteBusca')?.value;
  const total = document.getElementById('vrTotal')?.textContent || 'R$ 0,00';
  const tipo = document.getElementById('tipoHonorario')?.value || 'fixo';
  const pgto = document.getElementById('formaPagamento')?.value || 'pix';
  const status = document.getElementById('statusHonorario')?.value || 'pendente';
  const mes = document.getElementById('compMes')?.value;
  const ano = document.getElementById('compAno')?.value;
  const processoResumo = document.getElementById('processoBusca')?.value;

  const pc = document.getElementById('previewCard');

  if (!clienteResumo) {
    pc.classList.remove('visible');
    return;
  }
  pc.classList.add('visible');

  document.getElementById('pcCliente').textContent = clienteResumo;
  document.getElementById('pcTotal').textContent = total;
  document.getElementById('pcBadgeTipo').textContent = TIPO_LABELS[tipo] || tipo;
  document.getElementById('pcPgto').textContent = PGTO_LABELS[pgto] || pgto;
  document.getElementById('pcCompetencia').textContent = (mes && ano) ? `${MESES[parseInt(mes)]} / ${ano}` : '—';
  document.getElementById('pcProcesso').textContent = processoResumo || 'Sem processo';

  const statusLabels = { pendente: 'Pendente', parcial: 'Parc. Pago', pago: 'Pago', inadimpl: 'Inadimplente' };
  document.getElementById('pcStatus').textContent = statusLabels[status] || status;

  const pFooter = document.getElementById('pcParcelas');
  pFooter.textContent = 'Parcelamento, vencimento e baixa serão configurados na próxima etapa financeira.';
}

// ── Char Counter ──────────────────────────────────────────
function initCharCounters() {
  const pairs = [
    { ta: 'descServicos', ct: 'descCount', max: 500 },
    { ta: 'observacoes', ct: 'obsCount', max: 600 },
  ];
  pairs.forEach(({ ta, ct, max }) => {
    const el = document.getElementById(ta);
    const counter = document.getElementById(ct);
    if (!el || !counter) return;
    el.setAttribute('maxlength', max);
    el.addEventListener('input', () => {
      const len = el.value.length;
      counter.textContent = len;
      counter.style.color = len > max * 0.9 ? 'var(--amber)' : 'var(--gray-400)';
    });
  });
}

// ── Competência listener ──────────────────────────────────
function initCompetencia() {
  ['compMes', 'compAno'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', updatePreview);
  });
}

// ── Progress tracker ──────────────────────────────────────
function initProgressTracker() {
  const ids = ['sec1', 'sec2', 'sec3', 'sec4', 'sec5'];
  const steps = document.querySelectorAll('.fstep');
  const lines = document.querySelectorAll('.fstep-line');

  function update() {
    const mid = window.scrollY + window.innerHeight * 0.4;
    let current = 0;
    ids.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el && mid >= el.offsetTop) current = i;
    });
    steps.forEach((s, i) => {
      s.classList.toggle('active', i === current);
      s.classList.toggle('done', i < current);
    });
    lines.forEach((l, i) => l.classList.toggle('done', i < current));
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ── Submit ────────────────────────────────────────────────
function initFormSubmit() {
  const form = document.getElementById('formHonorario');
  const btnTop = document.getElementById('btnSalvar');

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

  function getSelectText(id) {
    const select = document.getElementById(id);
    return select?.selectedOptions?.[0]?.textContent?.trim() || select?.value?.trim() || '';
  }

  function getCompetenciaPayload() {
    const mes = document.getElementById('compMes')?.value;
    const ano = document.getElementById('compAno')?.value;
    return (mes && ano) ? `${ano}-${mes.padStart(2, '0')}` : '';
  }

  function montarPayload() {
    const g = id => document.getElementById(id);
    const v = id => g(id)?.value?.trim() || '';
    const valores = getValoresHonorario();
    const payload = {
      tipoHonorario: v('tipoHonorario') || 'fixo',
      valorBruto: toPayloadMoney(valores.valorBruto),
      desconto: toPayloadMoney(valores.desconto),
      acrescimos: toPayloadMoney(valores.acrescimos),
      valorTotal: toPayloadMoney(valores.valorTotal),
      status: v('statusHonorario') || 'pendente',
      formaPagamento: v('formaPagamento') || 'pix',
      descricao: v('descServicos'),
      responsavel: getSelectText('responsavel'),
      clienteId: Number(v('clienteId'))
    };

    const competencia = getCompetenciaPayload();
    if (competencia) payload.competencia = competencia;

    const observacoesInternas = v('observacoes');
    if (observacoesInternas) payload.observacoesInternas = observacoesInternas;

    const processoId = v('processoId');
    if (processoId) payload.processoId = Number(processoId);

    return payload;
  }

  function setSaving(saving) {
    [
      document.getElementById('btnSalvar'),
      document.getElementById('btnSalvarBottom'),
    ].forEach(b => {
      if (!b) return;
      if (!b.dataset.originalHtml) b.dataset.originalHtml = b.innerHTML;
      b.disabled = saving;
      if (saving) {
        const t = b.querySelector('.bfs-text');
        if (t) t.textContent = 'Lançando...';
        else b.textContent = 'Lançando...';
      } else {
        b.innerHTML = b.dataset.originalHtml;
      }
    });
  }

  async function doSave(e) {
    if (e?.type === 'submit') e.preventDefault();
    if (!validateForm()) {
      window.JurisFlow?.showToast('Corrija os campos obrigatórios antes de lançar.', 'warning');
      document.querySelector('.fg.has-error .finput')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('http://localhost:8080/honorarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(montarPayload())
      });

      if (!response.ok) {
        throw new Error(await lerMensagemErro(response));
      }

      window.JurisFlow?.showToast('Honorário lançado com sucesso.', 'success');
      setTimeout(() => {
        window.location.href = 'honorarios.html';
      }, 900);
    } catch (erro) {
      console.error('Erro ao salvar honorário:', erro);
      setSaving(false);
      window.JurisFlow?.showToast(`Honorário não foi salvo. ${erro.message || 'Verifique os dados e tente novamente.'}`, 'error');
    }
  }

  form?.addEventListener('submit', doSave);
  btnTop?.addEventListener('click', doSave);
}

// ── Cancel ────────────────────────────────────────────────
function initCancel() {
  function selecionarBotaoPadrao(selector, dataKey, value) {
    document.querySelectorAll(selector).forEach(btn => {
      btn.classList.toggle('active', btn.dataset[dataKey] === value);
    });
  }

  document.querySelectorAll('#btnCancelar, #btnCancelarBottom').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Deseja cancelar? Os dados não salvos serão perdidos.')) {
        window.location.href = 'honorarios.html';
      }
    });
  });
  document.getElementById('btnRascunho')?.addEventListener('click', () => {
    if (confirm('Limpar todos os dados preenchidos?')) {
      document.getElementById('formHonorario')?.reset();
      document.getElementById('clienteId').value = '';
      document.getElementById('processoId').value = '';
      document.getElementById('tipoHonorario').value = 'fixo';
      document.getElementById('formaPagamento').value = 'pix';
      document.getElementById('statusHonorario').value = 'pendente';
      selecionarBotaoPadrao('.thbtn', 'tipo', 'fixo');
      selecionarBotaoPadrao('.pgbtn', 'pgto', 'pix');
      selecionarBotaoPadrao('.shbtn', 's', 'pendente');
      const campoHora = document.getElementById('campoHora');
      if (campoHora) campoHora.style.display = 'none';
      document.querySelectorAll('.error, .valid').forEach(el => el.classList.remove('error', 'valid'));
      document.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));
      recalcularValores();
      updatePreview();
    }
  });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  await carregarClientesBackend();
  await carregarProcessosBackend();
  applyMasks();
  initRealtimeValidation();
  initClienteAutocomplete();
  initProcessoAutocomplete();
  initTipoHonorario();
  initPagamento();
  initParcelamento();
  initStatusHonorario();
  initNotifToggle();
  initDescontoToggle();
  initCharCounters();
  initCompetencia();
  initProgressTracker();
  initFormSubmit();
  initCancel();

  updatePreview();
});
