/**
 * JurisFlow — Novo Cliente
 */

// ── Máscaras ──────────────────────────────────────────────
function maskCPF(v) {
  v = v.replace(/\D/g, '');
  if (v.length <= 11) {
    v = v.substring(0, 11);
    if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    return v;
  }
  v = v.substring(0, 14);
  if (v.length > 12) return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
  if (v.length > 8)  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
  if (v.length > 5)  return v.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
  if (v.length > 2)  return v.replace(/(\d{2})(\d{1,3})/, '$1.$2');
  return v;
}

function maskPhone(v) {
  v = v.replace(/\D/g, '').substring(0, 11);
  if (v.length === 11) return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (v.length === 10) return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  if (v.length > 6)   return v.replace(/(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
  if (v.length > 2)   return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
  return v;
}

function maskCEP(v) {
  v = v.replace(/\D/g, '').substring(0, 8);
  if (v.length > 5) return v.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  return v;
}

function applyMasks() {
  document.querySelectorAll('[data-mask="cpf"]').forEach(el => {
    el.addEventListener('input', e => { e.target.value = maskCPF(e.target.value); });
  });
  document.querySelectorAll('[data-mask="phone"]').forEach(el => {
    el.addEventListener('input', e => { e.target.value = maskPhone(e.target.value); });
  });
  document.querySelectorAll('[data-mask="cep"]').forEach(el => {
    el.addEventListener('input', e => { e.target.value = maskCEP(e.target.value); });
  });
}

// ── Validação ─────────────────────────────────────────────
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
  document.querySelectorAll('#formNovoCliente [required]').forEach(el => {
    const v = el.value.trim() !== '';
    setField(el, v);
    if (!v) ok = false;
  });
  const email = document.getElementById('email');
  if (email && email.value.trim()) {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
    setField(email, emailOk, 'E-mail inválido');
    if (!emailOk) ok = false;
  }
  return ok;
}

function initRealtimeValidation() {
  document.querySelectorAll('#formNovoCliente .finput').forEach(el => {
    el.addEventListener('blur', () => {
      if (el.hasAttribute('required')) setField(el, el.value.trim() !== '');
      if (el.type === 'email' && el.value.trim())
        setField(el, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value), 'E-mail inválido');
    });
    el.addEventListener('input', () => {
      if (el.classList.contains('error')) setField(el, el.value.trim() !== '');
    });
  });
}

// ── Status Selector ───────────────────────────────────────
function initStatusSelector() {
  const btns = document.querySelectorAll('.sstbtn');
  const hidden = document.getElementById('statusCliente');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (hidden) hidden.value = btn.dataset.status;
    });
  });
}

// ── CEP Lookup ────────────────────────────────────────────
function initCEPLookup() {
  const btn = document.getElementById('btnBuscarCep');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const cepEl = document.getElementById('cep');
    const cep = cepEl?.value.replace(/\D/g, '');
    if (!cep || cep.length !== 8) {
      window.JurisFlow?.showToast('Digite um CEP válido com 8 dígitos.', 'warning');
      return;
    }
    const orig = btn.textContent;
    btn.textContent = '⏳';
    btn.disabled = true;
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        window.JurisFlow?.showToast('CEP não encontrado.', 'warning');
      } else {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        set('rua',        data.logradouro);
        set('bairro',     data.bairro);
        set('cidade',     data.localidade);
        set('estado',     data.uf);
        document.getElementById('complemento')?.focus();
        window.JurisFlow?.showToast('Endereço preenchido automaticamente!', 'success');
      }
    } catch {
      window.JurisFlow?.showToast('Erro ao buscar CEP. Verifique sua conexão.', 'error');
    } finally {
      btn.textContent = orig;
      btn.disabled = false;
    }
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
  zone.addEventListener('click', e => {
    if (!e.target.closest('.btn-upload')) input.click();
  });

  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    addFiles([...e.dataTransfer.files]);
  });

  input.addEventListener('change', () => {
    addFiles([...input.files]);
    input.value = '';
  });

  function addFiles(files) {
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        window.JurisFlow?.showToast(`"${file.name}" excede 10 MB.`, 'warning');
        return;
      }
      uploadedFiles.push(file);
      renderFile(file);
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
      <button class="file-item-del" title="Remover arquivo">✕</button>
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
  const form   = document.getElementById('formNovoCliente');
  const btnTop = document.getElementById('btnSalvar');

  function doSave(e) {
    if (e?.type === 'submit') e.preventDefault();
    if (!validateForm()) {
      window.JurisFlow?.showToast('Corrija os campos em vermelho antes de salvar.', 'warning');
      document.querySelector('.fg.has-error .finput')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const g = id => document.getElementById(id);
    const v = id => g(id)?.value?.trim() || '';

    const cliente = {
      nome:        v('nomeCompleto'),
      cpfCnpj:     v('cpfCnpj'),
      rg:          v('rg'),
      dataNasc:    v('dataNasc'),
      sexo:        v('sexo'),
      estadoCivil: v('estadoCivil'),
      profissao:   v('profissao'),
      telefone1:   v('telefone1'),
      telefone2:   v('telefone2'),
      whatsapp:    v('whatsapp'),
      email:       v('email'),
      cep:         v('cep'),
      rua:         v('rua'),
      numero:      v('numero'),
      complemento: v('complemento'),
      bairro:      v('bairro'),
      cidade:      v('cidade'),
      estado:      v('estado'),
      areaJuridica:v('areaJuridica'),
      tipoCliente: v('tipoCliente'),
      status:      v('statusCliente') || 'ativo',
      obsRapida:   v('obsRapida'),
      observacoes: v('observacoes'),
      dataCadastro: new Date().toISOString(),
    };

    window.JurisFlow?.db?.saveCliente(cliente);

    const allBtns = [
      document.getElementById('btnSalvar'),
      document.getElementById('btnSalvarBottom'),
    ];
    allBtns.forEach(b => { if (b) { b.disabled = true; const t = b.querySelector('.bfs-text'); if (t) t.textContent = 'Salvando…'; } });

    setTimeout(() => {
      window.JurisFlow?.showToast('✅ Cliente salvo com sucesso!', 'success');
      setTimeout(() => { window.location.href = 'clientes.html'; }, 1400);
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
        window.location.href = 'clientes.html';
      }
    });
  });
  document.getElementById('btnRascunho')?.addEventListener('click', () => {
    window.JurisFlow?.showToast('Rascunho salvo.', 'info');
  });
}

// ── Progress tracker (scroll-based) ──────────────────────
function initProgressTracker() {
  const ids   = ['sec1', 'sec2', 'sec3', 'sec4', 'sec5'];
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
document.addEventListener('DOMContentLoaded', () => {
  applyMasks();
  initRealtimeValidation();
  initStatusSelector();
  initCEPLookup();
  initFileUpload();
  initCharCounter();
  initFormSubmit();
  initCancel();
  initProgressTracker();
});
