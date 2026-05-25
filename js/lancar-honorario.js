/**
 * JurisFlow — Lançar Honorário
 */

function getIniciais(nome) {
  if (!nome) return '?';
  const p = nome.trim().split(' ').filter(Boolean);
  return p.length === 1 ? p[0].substring(0,2).toUpperCase() : (p[0][0]+p[1][0]).toUpperCase();
}

function getClientesMock() {
  const list = window.JurisFlow?.db?.getClientes() || [];
  return list.map(c => ({ id: c.id, nome: c.nome, cpf: c.cpfCnpj || '', iniciais: getIniciais(c.nome) }));
}

function getProcessosMock() {
  const list = window.JurisFlow?.db?.getProcessos() || [];
  return list.map(p => ({ id: p.id, num: p.numero, area: p.areaJuridica, clienteId: p.clienteId }));
}

const TIPO_LABELS = {
  fixo:     'Contrato Fixo',
  exito:    'Por Êxito',
  consulta: 'Consulta',
  hora:     'Hora Trabalhada',
  retainer: 'Retainer Mensal',
  adhoc:    'Avulso / Ad Hoc',
};

const PGTO_LABELS = {
  pix:      'PIX',
  boleto:   'Boleto',
  ted:      'TED / DOC',
  cartao:   'Cartão',
  dinheiro: 'Dinheiro',
  cheque:   'Cheque',
};

const MESES = ['', 'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

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
  return parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatBRL(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const clienteId = document.getElementById('clienteId');
  if (!clienteId?.value) {
    const inp = document.getElementById('clienteBusca');
    inp?.closest('.fg')?.classList.add('has-error');
    inp?.classList.add('error');
    ok = false;
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
function highlight(text, q) {
  if (!q) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

// ── Cliente Autocomplete ──────────────────────────────────
function initClienteAutocomplete() {
  const input    = document.getElementById('clienteBusca');
  const dropdown = document.getElementById('acDropdown');
  const hidden   = document.getElementById('clienteId');
  if (!input) return;

  function openDropdown(results, q) {
    if (!results.length) {
      dropdown.innerHTML = `<div class="ac-empty">Nenhum cliente encontrado para "${q}"</div>`;
    } else {
      dropdown.innerHTML = results.map(c => `
        <div class="ac-item" data-id="${c.id}">
          <div class="ac-item-avatar">${c.iniciais}</div>
          <div class="ac-item-info">
            <div class="ac-item-name">${highlight(c.nome, q)}</div>
            <div class="ac-item-cpf">${c.cpf}</div>
          </div>
        </div>`).join('');
      dropdown.querySelectorAll('.ac-item').forEach(item => {
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          const c = getClientesMock().find(x => x.id === item.dataset.id);
          if (c) selectCliente(c);
        });
      });
    }
    dropdown.classList.add('active');
  }

  function selectCliente(c) {
    input.value  = c.nome;
    hidden.value = c.id;
    dropdown.classList.remove('active');
    input.classList.remove('error');
    input.classList.add('valid');
    input.closest('.fg')?.classList.remove('has-error');
    updatePreview();
    window.JurisFlow?.showToast(`Cliente "${c.nome}" vinculado.`, 'success');
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    hidden.value = '';
    if (!q) { dropdown.classList.remove('active'); return; }
    const results = getClientesMock().filter(c =>
      c.nome.toLowerCase().includes(q) || c.cpf.includes(q)
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
  const input    = document.getElementById('processoBusca');
  const dropdown = document.getElementById('acDropdownProc');
  const hidden   = document.getElementById('processoId');
  if (!input) return;

  function openDropdown(results, q) {
    if (!results.length) {
      dropdown.innerHTML = `<div class="ac-empty">Nenhum processo encontrado</div>`;
    } else {
      dropdown.innerHTML = results.map(p => `
        <div class="ac-item" data-id="${p.id}">
          <div class="ac-item-avatar" style="background:var(--blue-soft);color:var(--blue-accent);font-size:.7rem;">📁</div>
          <div class="ac-item-info">
            <div class="ac-item-name">${highlight(p.num, q)}</div>
            <div class="ac-item-cpf">${p.area}</div>
          </div>
        </div>`).join('');
      dropdown.querySelectorAll('.ac-item').forEach(item => {
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          const p = getProcessosMock().find(x => x.id === item.dataset.id);
          if (p) { input.value = p.num; hidden.value = p.id; dropdown.classList.remove('active'); }
        });
      });
    }
    dropdown.classList.add('active');
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    hidden.value = '';
    if (!q) { dropdown.classList.remove('active'); return; }
    const results = getProcessosMock().filter(p =>
      p.num.includes(q) || p.area.toLowerCase().includes(q)
    );
    openDropdown(results, q);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.remove('active'), 180);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#processoWrap')) dropdown.classList.remove('active');
  });
}

// ── Tipo de Honorário ─────────────────────────────────────
function initTipoHonorario() {
  const btns   = document.querySelectorAll('.thbtn');
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
  const btns   = document.querySelectorAll('.pgbtn');
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
  const btns   = document.querySelectorAll('.parbtn');
  const hidden = document.getElementById('numeroParcelas');
  const info   = document.getElementById('parcelamentoInfo');
  const texto  = document.getElementById('parcelamentoTexto');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const p = parseInt(btn.dataset.p);
      if (hidden) hidden.value = p;
      atualizarParcelamento(p);
      updatePreview();
    });
  });

  function atualizarParcelamento(p) {
    const total = parseCurrency(document.getElementById('vrTotal')?.textContent.replace('R$ ', '').replace('.', '').replace(',', '.'));
    if (p <= 1) {
      info.style.display = 'none';
      document.getElementById('vrParcelaHint').style.display = 'none';
    } else {
      const por = total / p;
      texto.textContent = `${p}x de R$ ${formatBRL(por)} — primeira parcela no vencimento definido`;
      info.style.display = 'block';
      const hint = document.getElementById('vrParcelaHint');
      hint.textContent = `${p}x de R$ ${formatBRL(por)}`;
      hint.style.display = 'block';
    }
  }
}

// ── Status Inicial ────────────────────────────────────────
function initStatusHonorario() {
  const btns        = document.querySelectorAll('.shbtn');
  const hidden      = document.getElementById('statusHonorario');
  const campoPgto   = document.getElementById('campoDataPgto');
  const campoParcial = document.getElementById('campoValorParcial');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const s = btn.dataset.s;
      if (hidden) hidden.value = s;
      campoPgto.style.display   = s === 'pago' ? 'block' : 'none';
      campoParcial.style.display = s === 'parcial' ? 'block' : 'none';
      updatePreview();
    });
  });
}

// ── Notif Toggle ──────────────────────────────────────────
function initNotifToggle() {
  const toggle = document.getElementById('notifToggle');
  const checkbox = document.getElementById('enviarNotif');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('on');
    if (checkbox) checkbox.checked = toggle.classList.contains('on');
  });
}

// ── Desconto toggle (%/R$) ────────────────────────────────
function initDescontoToggle() {
  const btn  = document.getElementById('descTypeBtn');
  const pfx  = document.getElementById('descPfx');
  const inp  = document.getElementById('desconto');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isP = btn.dataset.mode === 'pct';
    btn.dataset.mode  = isP ? 'val' : 'pct';
    btn.textContent   = isP ? 'R$' : '%';
    pfx.textContent   = isP ? 'R$' : '%';
    inp.value = '';
    recalcularValores();
  });
}

// ── Recalcular Valores ────────────────────────────────────
function recalcularValores() {
  const bruto     = parseCurrency(document.getElementById('valorBruto')?.value);
  const acrescimo = parseCurrency(document.getElementById('acrescimos')?.value);
  const descInp   = document.getElementById('desconto')?.value;
  const descMode  = document.getElementById('descTypeBtn')?.dataset.mode || 'pct';
  let descValor   = 0;

  if (descInp) {
    const raw = parseFloat(descInp.replace(',', '.')) || 0;
    descValor = descMode === 'pct' ? (bruto * raw / 100) : raw;
  }

  const total = Math.max(0, bruto - descValor + acrescimo);

  document.getElementById('vrBruto').textContent     = `R$ ${formatBRL(bruto)}`;
  document.getElementById('vrDesconto').textContent  = `— R$ ${formatBRL(descValor)}`;
  document.getElementById('vrAcrescimos').textContent = `+ R$ ${formatBRL(acrescimo)}`;
  document.getElementById('vrTotal').textContent      = `R$ ${formatBRL(total)}`;

  document.getElementById('pcTotal').textContent = `R$ ${formatBRL(total)}`;

  // Atualizar parcelamento hint
  const pAtual = parseInt(document.getElementById('numeroParcelas')?.value || 1);
  if (pAtual > 1) {
    const hint = document.getElementById('vrParcelaHint');
    hint.textContent = `${pAtual}x de R$ ${formatBRL(total / pAtual)}`;
    hint.style.display = 'block';
    const texto = document.getElementById('parcelamentoTexto');
    if (texto) texto.textContent = `${pAtual}x de R$ ${formatBRL(total / pAtual)} — primeira parcela no vencimento definido`;
  }

  // Mostrar preview se tiver dados
  updatePreview();
}

// ── Preview ───────────────────────────────────────────────
function updatePreview() {
  const clienteNome = document.getElementById('clienteBusca')?.value;
  const total       = document.getElementById('vrTotal')?.textContent || 'R$ 0,00';
  const tipo        = document.getElementById('tipoHonorario')?.value || 'fixo';
  const pgto        = document.getElementById('formaPagamento')?.value || 'pix';
  const status      = document.getElementById('statusHonorario')?.value || 'pendente';
  const mes         = document.getElementById('compMes')?.value;
  const ano         = document.getElementById('compAno')?.value;
  const venc        = document.getElementById('dataVencimento')?.value;
  const parcelas    = parseInt(document.getElementById('numeroParcelas')?.value || 1);

  const pc = document.getElementById('previewCard');

  if (!clienteNome) {
    pc.classList.remove('visible');
    return;
  }
  pc.classList.add('visible');

  document.getElementById('pcCliente').textContent     = clienteNome;
  document.getElementById('pcTotal').textContent       = total;
  document.getElementById('pcBadgeTipo').textContent   = TIPO_LABELS[tipo] || tipo;
  document.getElementById('pcPgto').textContent        = PGTO_LABELS[pgto] || pgto;
  document.getElementById('pcCompetencia').textContent = mes ? `${MESES[parseInt(mes)]} / ${ano}` : '—';
  document.getElementById('pcVencimento').textContent  = venc
    ? new Date(venc + 'T00:00:00').toLocaleDateString('pt-BR') : '—';

  const statusLabels = { pendente: 'Pendente', parcial: 'Parc. Pago', pago: 'Pago', inadimpl: 'Inadimplente' };
  document.getElementById('pcStatus').textContent = statusLabels[status] || status;

  const pFooter = document.getElementById('pcParcelas');
  if (parcelas > 1) {
    const totalNum = parseCurrency(total.replace('R$ ', ''));
    pFooter.textContent = `Parcelado em ${parcelas}x de R$ ${formatBRL(totalNum / parcelas)}`;
  } else {
    pFooter.textContent = 'Pagamento à vista';
  }
}

// ── Char Counter ──────────────────────────────────────────
function initCharCounters() {
  const pairs = [
    { ta: 'descServicos', ct: 'descCount', max: 500 },
    { ta: 'observacoes',  ct: 'obsCount',  max: 600 },
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

// ── Data vencimento listener ──────────────────────────────
function initDataVencimento() {
  document.getElementById('dataVencimento')?.addEventListener('change', updatePreview);
}

// ── Progress tracker ──────────────────────────────────────
function initProgressTracker() {
  const ids   = ['sec1', 'sec2', 'sec3', 'sec4', 'sec5'];
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
  const form   = document.getElementById('formHonorario');
  const btnTop = document.getElementById('btnSalvar');

  function doSave(e) {
    if (e?.type === 'submit') e.preventDefault();
    if (!validateForm()) {
      window.JurisFlow?.showToast('Corrija os campos obrigatórios antes de lançar.', 'warning');
      document.querySelector('.fg.has-error .finput')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const allBtns = [
      document.getElementById('btnSalvar'),
      document.getElementById('btnSalvarBottom'),
    ];
    allBtns.forEach(b => {
      if (!b) return;
      b.disabled = true;
      const t = b.querySelector('.bfs-text');
      if (t) t.textContent = 'Lançando…';
      else b.textContent = 'Lançando…';
    });

    const notif = document.getElementById('enviarNotif')?.checked;

    const g = id => document.getElementById(id);
    const v = id => g(id)?.value?.trim() || '';

    const totalEl = g('vrTotal');
    const totalStr = totalEl ? totalEl.textContent.replace('R$ ','').replace(/\./g,'').replace(',','.') : '0';

    const honorario = {
      clienteId:       g('clienteId')?.value || '',
      clienteNome:     v('clienteBusca'),
      processoId:      g('processoId')?.value || '',
      processoNumero:  v('processoBusca'),
      tipoHonorario:   v('tipoHonorario') || 'fixo',
      competencia:     (v('compAno') && v('compMes')) ? v('compAno') + '-' + v('compMes').padStart(2,'0') : '',
      valorBruto:      v('valorBruto').replace(/\./g,'').replace(',','.'),
      desconto:        v('desconto'),
      acrescimos:      v('acrescimos').replace(/\./g,'').replace(',','.'),
      valorTotal:      totalStr,
      meioPagamento:   v('formaPagamento') || 'pix',
      parcelas:        parseInt(v('numeroParcelas') || '1'),
      vencimento:      v('dataVencimento'),
      status:          v('statusHonorario') || 'pendente',
      descServicos:    v('descServicos'),
      observacoes:     v('observacoes'),
      dataCadastro:    new Date().toISOString(),
    };

    window.JurisFlow?.db?.saveHonorario(honorario);

    setTimeout(() => {
      window.JurisFlow?.showToast('✅ Honorário lançado com sucesso!', 'success');
      if (notif) {
        setTimeout(() => window.JurisFlow?.showToast('📧 Cobrança enviada ao cliente por e-mail.', 'info'), 700);
      }
      setTimeout(() => { window.location.href = 'financeiro.html'; }, 1600);
    }, 800);
  }

  form?.addEventListener('submit', doSave);
  btnTop?.addEventListener('click', doSave);
}

// ── Cancel ────────────────────────────────────────────────
function initCancel() {
  document.querySelectorAll('#btnCancelar, #btnCancelarBottom').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Deseja cancelar? Os dados não salvos serão perdidos.')) {
        window.location.href = 'financeiro.html';
      }
    });
  });
  document.getElementById('btnRascunho')?.addEventListener('click', () => {
    window.JurisFlow?.showToast('Rascunho salvo com sucesso.', 'info');
  });
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
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
  initDataVencimento();
  initProgressTracker();
  initFormSubmit();
  initCancel();

  // Set default vencimento to end of current month
  const hoje = new Date();
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const vencInput = document.getElementById('dataVencimento');
  if (vencInput) vencInput.value = fimMes.toISOString().split('T')[0];
  updatePreview();
});
