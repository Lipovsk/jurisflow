/**
 * JurisFlow — Novo Processo
 */

function getIniciais(nome) {
  if (!nome) return '?';
  const p = nome.trim().split(' ').filter(Boolean);
  return p.length === 1 ? p[0].substring(0,2).toUpperCase() : (p[0][0]+p[1][0]).toUpperCase();
}

let clientesBackend = [];

async function carregarClientesBackend() {
  try {
    const resposta = await fetch('http://localhost:8080/clientes');
    clientesBackend = await resposta.json();
  } catch (erro) {
    console.error('Erro ao buscar clientes:', erro);
    clientesBackend = [];
  }
}

function getClientesMock() {
  return clientesBackend.map(c => ({
    id: String(c.id),
    nome: c.nome,
    cpf: c.cpfCnpj || '',
    iniciais: getIniciais(c.nome)
  }));
}

// ── Masks ─────────────────────────────────────────────────
function maskCurrency(v) {
  v = v.replace(/\D/g, '');
  if (!v) return '';
  const n = parseInt(v, 10) / 100;
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function maskProcesso(v) {
  v = v.replace(/[^\d-./]/g, '');
  return v.substring(0, 25);
}

function applyMasks() {
  document.querySelectorAll('[data-mask="currency"]').forEach(el => {
    el.addEventListener('input', e => { e.target.value = maskCurrency(e.target.value); });
  });
  document.querySelectorAll('[data-mask="processo"]').forEach(el => {
    el.addEventListener('input', e => { e.target.value = maskProcesso(e.target.value); });
  });
}

// ── Validation ────────────────────────────────────────────
function setField(input, ok, msg) {
  const g = input.closest('.fg');
  if (!g) return;
  g.classList.toggle('has-error', !ok);
  input.classList.toggle('error', !ok);
  input.classList.toggle('valid', ok && input.value.trim() !== '');
  const e = g.querySelector('.ferr');
  if (e && msg) e.textContent = msg;
}

function validateForm() {
  let ok = true;
  document.querySelectorAll('#formNovoProcesso [required]').forEach(el => {
    const v = el.value.trim() !== '';
    setField(el, v);
    if (!v) ok = false;
  });
  // Validate hidden client field
  const clienteId = document.getElementById('clienteId');
  const clienteInput = document.getElementById('clienteBusca');
  if (clienteId && !clienteId.value) {
    const g = clienteInput?.closest('.fg');
    if (g) {
      g.classList.add('has-error');
      clienteInput?.classList.add('error');
    }
    ok = false;
  }
  return ok;
}

function initRealtimeValidation() {
  document.querySelectorAll('#formNovoProcesso .finput').forEach(el => {
    el.addEventListener('blur', () => {
      if (el.hasAttribute('required')) setField(el, el.value.trim() !== '');
    });
    el.addEventListener('input', () => {
      if (el.classList.contains('error')) setField(el, el.value.trim() !== '');
    });
  });
}

// ── Client Autocomplete ───────────────────────────────────
function initClienteAutocomplete() {
  const input    = document.getElementById('clienteBusca');
  const dropdown = document.getElementById('acDropdown');
  const hiddenId = document.getElementById('clienteId');
  if (!input) return;

  let selectedCliente = null;

  function highlight(text, q) {
    if (!q) return text;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
  }

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
        </div>
      `).join('');
      dropdown.querySelectorAll('.ac-item').forEach(item => {
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          const clientId = item.dataset.id;
          const client = getClientesMock().find(c => c.id === clientId);
          if (client) selectCliente(client);
        });
      });
    }
    dropdown.classList.add('active');
  }

  function selectCliente(client) {
    selectedCliente = client;
    input.value = client.nome;
    hiddenId.value = client.id;
    dropdown.classList.remove('active');
    input.classList.remove('error');
    input.classList.add('valid');
    const g = input.closest('.fg');
    if (g) g.classList.remove('has-error');
    window.JurisFlow?.showToast(`Cliente "${client.nome}" vinculado.`, 'success');
  }

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    hiddenId.value = '';
    selectedCliente = null;
    if (!q) { dropdown.classList.remove('active'); return; }
    const results = getClientesMock().filter(c =>
      c.nome.toLowerCase().includes(q) || c.cpf.includes(q)
    );
    openDropdown(results, q);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.remove('active'), 180);
    if (!hiddenId.value && input.value.trim()) {
      input.value = '';
      window.JurisFlow?.showToast('Selecione um cliente da lista.', 'warning');
    }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.autocomplete-wrap')) {
      dropdown.classList.remove('active');
    }
  });
}

// ── Process Status Selector ───────────────────────────────
function initProcStatus() {
  const btns   = document.querySelectorAll('.pstbtn');
  const hidden = document.getElementById('statusProcesso');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (hidden) hidden.value = btn.dataset.status;
    });
  });
}

// ── Priority Selector ─────────────────────────────────────
function initPriority() {
  const btns   = document.querySelectorAll('.pribtn');
  const hidden = document.getElementById('prioridade');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (hidden) hidden.value = btn.dataset.p;
    });
  });
}

// ── Date Alerts ───────────────────────────────────────────
function initDateAlerts() {
  const audienciaInput = document.getElementById('dataAudiencia');
  const prazoInput     = document.getElementById('prazoFinal');
  const banner         = document.getElementById('prazoBanner');
  const bannerText     = document.getElementById('prazoBannerText');

  function checkDate(input, alertEl, label) {
    const val = input.value;
    if (!val) { alertEl.style.display = 'none'; return; }
    const date = new Date(val + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.ceil((date - today) / 86400000);

    if (diff < 0) {
      alertEl.textContent = `⚠️ ${label} já passou`;
      alertEl.className = 'date-alert urgent';
      alertEl.style.display = 'flex';
    } else if (diff <= 3) {
      alertEl.textContent = `⚡ ${label} em ${diff === 0 ? 'hoje' : diff + ' dia(s)'}`;
      alertEl.className = 'date-alert urgent';
      alertEl.style.display = 'flex';
    } else if (diff <= 7) {
      alertEl.textContent = `📅 ${label} em ${diff} dia(s)`;
      alertEl.className = 'date-alert';
      alertEl.style.display = 'flex';
    } else {
      alertEl.style.display = 'none';
    }
  }

  function updateBanner() {
    const prazo = document.getElementById('prazoFinal').value;
    if (!prazo) { banner.style.display = 'none'; return; }
    const date = new Date(prazo + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const diff = Math.ceil((date - today) / 86400000);
    if (diff <= 7) {
      bannerText.textContent = diff < 0
        ? `O prazo final já venceu há ${Math.abs(diff)} dia(s)!`
        : diff === 0 ? 'O prazo final é hoje!'
        : `O prazo final é em ${diff} dia(s). Atenção!`;
      banner.className = diff <= 3 ? 'prazo-banner urgent' : 'prazo-banner';
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  }

  audienciaInput?.addEventListener('change', () => {
    checkDate(audienciaInput, document.getElementById('audienciaAlert'), 'Audiência');
  });
  prazoInput?.addEventListener('change', () => {
    checkDate(prazoInput, document.getElementById('prazoAlert'), 'Prazo final');
    updateBanner();
  });
}

// ── Timeline ──────────────────────────────────────────────
function initTimeline() {
  const tl        = document.getElementById('timeline');
  const addForm   = document.getElementById('tlAddForm');
  const btnAdd    = document.getElementById('btnAddEvento');
  const btnTlAdd  = document.getElementById('btnTlAdd');
  const btnCancel = document.getElementById('btnTlCancel');
  if (!tl) return;

  // Set today's date on the first item
  const firstMeta = tl.querySelector('.tl-meta');
  if (firstMeta) {
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    firstMeta.textContent = `${today} · Dr. Carlos Mendes`;
  }

  btnAdd?.addEventListener('click', () => {
    addForm.style.display = addForm.style.display === 'none' ? 'block' : 'none';
    if (addForm.style.display === 'block') {
      document.getElementById('tlEventoData').value = new Date().toISOString().split('T')[0];
      document.getElementById('tlEventoDesc')?.focus();
    }
  });

  btnCancel?.addEventListener('click', () => { addForm.style.display = 'none'; });

  btnTlAdd?.addEventListener('click', () => {
    const desc = document.getElementById('tlEventoDesc')?.value.trim();
    const data = document.getElementById('tlEventoData')?.value;
    if (!desc) {
      window.JurisFlow?.showToast('Descreva o evento antes de adicionar.', 'warning');
      return;
    }
    const dataFmt = data
      ? new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'Sem data';

    const item = document.createElement('div');
    item.className = 'tl-item';
    item.innerHTML = `
      <div class="tl-dot green"></div>
      <div class="tl-content">
        <div class="tl-title">${desc}</div>
        <div class="tl-meta">${dataFmt} · Dr. Carlos Mendes</div>
      </div>
      <div class="tl-badge">Manual</div>
      <button class="tl-item-del" title="Remover">✕</button>
    `;
    item.querySelector('.tl-item-del').addEventListener('click', () => item.remove());
    tl.appendChild(item);

    document.getElementById('tlEventoDesc').value = '';
    addForm.style.display = 'none';
    window.JurisFlow?.showToast('Evento adicionado à timeline.', 'success');
  });
}

// ── File Upload ───────────────────────────────────────────
const uploadedFiles = [];

function initFileUpload() {
  const zone  = document.getElementById('uploadArea');
  const input = document.getElementById('fileInput');
  const btn   = document.getElementById('btnUpload');
  const list  = document.getElementById('fileList');
  if (!zone || !input) return;

  btn?.addEventListener('click', () => input.click());
  zone.addEventListener('click', e => { if (!e.target.closest('.btn-upload')) input.click(); });
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    addFiles([...e.dataTransfer.files]);
  });
  input.addEventListener('change', () => { addFiles([...input.files]); input.value = ''; });

  function addFiles(files) {
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        window.JurisFlow?.showToast(`"${file.name}" excede 10 MB.`, 'warning');
        return;
      }
      uploadedFiles.push(file);
      renderFile(file);
      // Add to timeline
      const tl = document.getElementById('timeline');
      if (tl) {
        const item = document.createElement('div');
        item.className = 'tl-item';
        const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        item.innerHTML = `
          <div class="tl-dot amber"></div>
          <div class="tl-content">
            <div class="tl-title">Documento anexado: ${file.name}</div>
            <div class="tl-meta">${today} · Dr. Carlos Mendes</div>
          </div>
          <div class="tl-badge">Documento</div>
          <button class="tl-item-del" title="Remover">✕</button>
        `;
        item.querySelector('.tl-item-del').addEventListener('click', () => item.remove());
        tl.appendChild(item);
      }
    });
  }

  function renderFile(file) {
    const ext = file.name.split('.').pop().toUpperCase();
    const iconMap = { PDF: '📕', DOC: '📘', DOCX: '📘', JPG: '🖼', JPEG: '🖼', PNG: '🖼' };
    const icon = iconMap[ext] || '📎';
    const size = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(0)} KB`
      : `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    const item = document.createElement('div');
    item.className = 'file-item';
    item.innerHTML = `
      <div class="file-item-ico">${icon}</div>
      <div class="file-item-info">
        <div class="file-item-name">${file.name}</div>
        <div class="file-item-meta">${ext} · ${size}</div>
      </div>
      <button class="file-item-del" title="Remover">✕</button>
    `;
    item.querySelector('.file-item-del').addEventListener('click', () => {
      const idx = uploadedFiles.indexOf(file);
      if (idx > -1) uploadedFiles.splice(idx, 1);
      item.remove();
    });
    list.appendChild(item);
  }
}

// ── Char Counter ──────────────────────────────────────────
function initCharCounter() {
  const ta = document.getElementById('observacoes');
  const ct = document.getElementById('obsCount');
  if (!ta || !ct) return;
  ta.setAttribute('maxlength', '1000');
  ta.addEventListener('input', () => {
    const len = ta.value.length;
    ct.textContent = len;
    ct.style.color = len > 900 ? 'var(--amber)' : 'var(--gray-400)';
  });
}

// ── Form Submit ───────────────────────────────────────────
function initFormSubmit() {
  const form   = document.getElementById('formNovoProcesso');
  const btnTop = document.getElementById('btnSalvar');

  function doSave(e) {
    if (e?.type === 'submit') e.preventDefault();
    if (!validateForm()) {
      window.JurisFlow?.showToast('Corrija os campos em vermelho antes de salvar.', 'warning');
      document.querySelector('.fg.has-error .finput')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const allBtns = [
      document.getElementById('btnSalvar'),
      document.getElementById('btnSalvarBottom'),
    ];
    allBtns.forEach(b => {
      if (b) {
        b.disabled = true;
        const t = b.querySelector('.bfs-text');
        if (t) t.textContent = 'Salvando…';
      }
    });
    const g = id => document.getElementById(id);
    const v = id => g(id)?.value?.trim() || '';

    const clienteEl = g('clienteBusca');
    const clienteId = g('clienteId')?.value || '';
    const clienteNome = clienteEl?.value?.trim() || '';

    const processo = {
      numero:          v('numProcesso'),
      clienteId,
      clienteNome,
      areaJuridica:    v('areaJuridica'),
      tipoAcao:        v('tipoAcao'),
      status:          v('statusProcesso') || 'andamento',
      prioridade:      v('prioridade') || 'media',
      tribunal:        v('tribunal'),
      comarca:         v('comarca'),
      vara:            v('vara'),
      juiz:            v('juiz'),
      dataAbertura:    v('dataAbertura'),
      dataAudiencia:   v('dataAudiencia'),
      prazoFinal:      v('prazoFinal'),
      valorCausa:      v('valorCausa'),
      honorarios:      v('honorarios'),
      statusFinanceiro:v('statusFinanceiro'),
      formaPagamento:  v('formaPagamento'),
      observacoes:     v('observacoes'),
      andamento:       0,
      dataCadastro:    new Date().toISOString(),
    };

  fetch('http://localhost:8080/processos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    numero: processo.numero,
    tipoAcao: processo.tipoAcao,
    areaJuridica: processo.areaJuridica,
    status: processo.status,
    descricao: processo.observacoes,
    clienteId: Number(processo.clienteId)
  })
})
.then(res => {
  if (!res.ok) {
    throw new Error('Erro ao salvar processo');
  }

  return res.json();
})
.then(async data => {
  console.log('Processo salvo:', data);

  const compromissosParaCriar = [];

  if (processo.dataAudiencia) {
    compromissosParaCriar.push({
      titulo: `Audiência — ${processo.tipoAcao || processo.numero}`,
      tipo: "audiencia",
      data: processo.dataAudiencia,
      hora: "09:00",
      descricao: `Audiência do processo ${processo.numero}`,
      status: "agendado",
      prioridade: processo.prioridade || "media",
      clienteId: Number(processo.clienteId),
      processoId: data.id
    });
  }

  if (processo.prazoFinal) {
    compromissosParaCriar.push({
      titulo: `Prazo — ${processo.tipoAcao || processo.numero}`,
      tipo: "prazo",
      data: processo.prazoFinal,
      hora: "",
      descricao: `Prazo final do processo ${processo.numero}`,
      status: "agendado",
      prioridade: "alta",
      clienteId: Number(processo.clienteId),
      processoId: data.id
    });
  }

  for (const compromisso of compromissosParaCriar) {
    await fetch("http://localhost:8080/compromissos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(compromisso)
    });
  }

  window.JurisFlow?.showToast('✅ Processo salvo e agenda atualizada!', 'success');

  setTimeout(() => {
    window.location.href = `detalhes-cliente.html?id=${processo.clienteId}`;
  }, 1000);
})
.catch(erro => {
  console.error(erro);

  allBtns.forEach(b => {
    if (b) {
      b.disabled = false;
      const t = b.querySelector('.bfs-text');
      if (t) t.textContent = 'Salvar Processo';
    }
  });

  window.JurisFlow?.showToast('Erro ao salvar processo no backend.', 'error');
});
  }

  form?.addEventListener('submit', doSave);
  btnTop?.addEventListener('click', doSave);
}

// ── Cancel ────────────────────────────────────────────────
function initCancel() {
  document.querySelectorAll('#btnCancelar, #btnCancelarBottom').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Deseja cancelar? Os dados não salvos serão perdidos.')) {
        window.location.href = 'processos.html';
      }
    });
  });
  document.getElementById('btnRascunho')?.addEventListener('click', () => {
    window.JurisFlow?.showToast('Rascunho salvo.', 'info');
  });
}

// ── Progress tracker ──────────────────────────────────────
function initProgressTracker() {
  const ids   = ['sec1', 'sec2', 'sec3', 'sec4', 'sec5', 'sec6'];
  const steps = document.querySelectorAll('.fstep');
  const lines = document.querySelectorAll('.fstep-line');

  function update() {
    const mid = window.scrollY + window.innerHeight * 0.45;
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

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await carregarClientesBackend();
  
  applyMasks();
  initRealtimeValidation();
  initClienteAutocomplete();
  initProcStatus();
  initPriority();
  initDateAlerts();
  initTimeline();
  initFileUpload();
  initCharCounter();
  initFormSubmit();
  initCancel();
  initProgressTracker();
});
