(() => {
  'use strict';

  const API_BASE = 'http://localhost:8080';
  const CATEGORIAS = ['', 'peticao', 'contrato', 'laudo', 'procuracao', 'decisao', 'outros'];
  const catLabel = {
    peticao: 'Petição',
    contrato: 'Contrato',
    laudo: 'Laudo',
    procuracao: 'Procuração',
    decisao: 'Decisão Judicial',
    outros: 'Outros'
  };
  const catClass = {
    peticao: 'cb-peticao',
    contrato: 'cb-contrato',
    laudo: 'cb-laudo',
    procuracao: 'cb-procuracao',
    decisao: 'cb-decisao',
    outros: 'cb-outros'
  };

  const state = {
    documentos: [],
    clientes: [],
    processos: [],
    categoriaAtiva: '',
    carregando: false
  };

  const el = {
    docsBody: document.getElementById('docsBody'),
    docCount: document.getElementById('docCount'),
    searchInput: document.getElementById('searchInput'),
    filterCat: document.getElementById('filterCat'),
    catRow: document.getElementById('catRow'),
    uploadZone: document.getElementById('uploadZone'),
    openUploadBtn: document.getElementById('openUploadBtn'),
    uploadModal: document.getElementById('uploadModal'),
    closeUploadBtn: document.getElementById('closeUploadBtn'),
    cancelUploadBtn: document.getElementById('cancelUploadBtn'),
    uploadForm: document.getElementById('uploadForm'),
    arquivoInput: document.getElementById('arquivoInput'),
    fileMeta: document.getElementById('fileMeta'),
    tituloInput: document.getElementById('tituloInput'),
    categoriaInput: document.getElementById('categoriaInput'),
    clienteInput: document.getElementById('clienteInput'),
    processoInput: document.getElementById('processoInput'),
    descricaoInput: document.getElementById('descricaoInput'),
    submitUploadBtn: document.getElementById('submitUploadBtn')
  };

  function toast(mensagem, tipo = 'info') {
    if (window.JurisFlow?.showToast) {
      window.JurisFlow.showToast(mensagem, tipo);
      return;
    }
    alert(mensagem);
  }

  function normalizar(valor) {
    return String(valor ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function texto(valor, fallback = 'Não informado') {
    const t = String(valor ?? '').trim();
    return t || fallback;
  }

  function formatBytes(bytes) {
    const n = Number(bytes || 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  function formatDate(iso) {
    if (!iso) return 'Não informado';
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return 'Não informado';
    return data.toLocaleDateString('pt-BR');
  }

  function iconByExt(extensao) {
    const ext = String(extensao || '').toLowerCase();
    if (ext === 'pdf') return { icon: '??', cor: '#EEF3FF' };
    if (['doc', 'docx'].includes(ext)) return { icon: '??', cor: '#ECFDF5' };
    if (['xls', 'xlsx'].includes(ext)) return { icon: '??', cor: '#FFFBEB' };
    if (['jpg', 'jpeg', 'png'].includes(ext)) return { icon: '??', cor: '#F5F3FF' };
    return { icon: '??', cor: '#F1F5F9' };
  }

  async function lerErroApi(response, fallback) {
    try {
      const data = await response.json();
      return data?.message || fallback;
    } catch {
      return fallback;
    }
  }

  async function buscarJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(await lerErroApi(response, `Erro HTTP ${response.status}`));
    }
    return response.json();
  }

  function limparTabela() {
    while (el.docsBody.firstChild) el.docsBody.removeChild(el.docsBody.firstChild);
  }

  function renderEstado(mensagem, titulo = '') {
    limparTabela();
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    const div = document.createElement('div');
    div.className = 'docs-empty';
    if (titulo) {
      const strong = document.createElement('strong');
      strong.textContent = titulo;
      div.appendChild(strong);
    }
    const span = document.createElement('span');
    span.textContent = mensagem;
    div.appendChild(span);
    td.appendChild(div);
    tr.appendChild(td);
    el.docsBody.appendChild(tr);
  }

  function renderErro(mensagem) {
    limparTabela();
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    const div = document.createElement('div');
    div.className = 'docs-error';
    div.textContent = mensagem;
    td.appendChild(div);
    tr.appendChild(td);
    el.docsBody.appendChild(tr);
    el.docCount.textContent = 'Erro ao carregar';
  }

  function documentosFiltrados() {
    const q = normalizar(el.searchInput.value);
    const cat = el.filterCat.value || state.categoriaAtiva;
    return state.documentos.filter(doc => {
      const textoBusca = normalizar([
        doc.titulo,
        doc.nomeOriginal,
        doc.descricao,
        doc.clienteNome,
        doc.processoNumero,
        catLabel[doc.categoria]
      ].join(' '));
      return (!q || textoBusca.includes(q)) && (!cat || doc.categoria === cat);
    });
  }

  function atualizarContadores() {
    CATEGORIAS.forEach(cat => {
      const btn = document.querySelector(`.cat-btn[data-cat="${cat}"]`);
      const count = cat ? state.documentos.filter(doc => doc.categoria === cat).length : state.documentos.length;
      const span = btn?.querySelector('.cat-count');
      if (span) span.textContent = count;
    });
  }

  function renderDocumentos() {
    const lista = documentosFiltrados();
    el.docCount.textContent = `${lista.length} documento(s)`;
    atualizarContadores();
    limparTabela();

    if (!state.carregando && !state.documentos.length) {
      renderEstado('Os documentos aparecerão aqui depois do primeiro upload real.', 'Nenhum documento cadastrado');
      return;
    }

    if (!lista.length) {
      renderEstado('Nenhum documento corresponde aos filtros atuais.', 'Sem resultados');
      return;
    }

    lista.forEach(doc => {
      const visual = iconByExt(doc.extensao);
      const tr = document.createElement('tr');

      const tdDocumento = document.createElement('td');
      const cell = document.createElement('div');
      cell.className = 'doc-cell';
      const icon = document.createElement('div');
      icon.className = 'doc-icon';
      icon.style.background = visual.cor;
      icon.textContent = visual.icon;
      const info = document.createElement('div');
      const nome = document.createElement('div');
      nome.className = 'doc-name';
      nome.textContent = texto(doc.titulo, doc.nomeOriginal);
      const origem = document.createElement('div');
      origem.className = 'doc-proc';
      origem.textContent = [
        doc.clienteNome ? `Cliente: ${doc.clienteNome}` : '',
        doc.processoNumero ? `Processo: ${doc.processoNumero}` : ''
      ].filter(Boolean).join(' · ') || texto(doc.nomeOriginal);
      info.append(nome, origem);
      cell.append(icon, info);
      tdDocumento.appendChild(cell);

      const tdCategoria = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `cat-badge ${catClass[doc.categoria] || 'cb-outros'}`;
      badge.textContent = catLabel[doc.categoria] || 'Outros';
      tdCategoria.appendChild(badge);

      const tdTamanho = document.createElement('td');
      tdTamanho.className = 'doc-size';
      tdTamanho.textContent = formatBytes(doc.tamanhoBytes);

      const tdData = document.createElement('td');
      tdData.className = 'doc-date';
      tdData.textContent = formatDate(doc.dataUpload);

      const tdAcoes = document.createElement('td');
      const actions = document.createElement('div');
      actions.className = 'doc-actions';
      const baixar = document.createElement('button');
      baixar.className = 'btn-doc';
      baixar.type = 'button';
      baixar.title = 'Baixar';
      baixar.textContent = '?';
      baixar.addEventListener('click', () => baixarDocumento(doc));
      const excluir = document.createElement('button');
      excluir.className = 'btn-doc';
      excluir.type = 'button';
      excluir.title = 'Excluir';
      excluir.textContent = '×';
      excluir.addEventListener('click', () => excluirDocumento(doc));
      actions.append(baixar, excluir);
      tdAcoes.appendChild(actions);

      tr.append(tdDocumento, tdCategoria, tdTamanho, tdData, tdAcoes);
      el.docsBody.appendChild(tr);
    });
  }

  async function carregarDocumentos() {
    state.carregando = true;
    el.docCount.textContent = 'Carregando...';
    renderEstado('Carregando documentos reais da API...');
    try {
      const data = await buscarJson(`${API_BASE}/documentos`);
      state.documentos = Array.isArray(data) ? data : [];
      state.carregando = false;
      renderDocumentos();
    } catch (erro) {
      state.carregando = false;
      console.error('Erro ao carregar documentos:', erro);
      renderErro(erro.message || 'Não foi possível carregar documentos.');
    }
  }

  function preencherSelect(select, itens, placeholder, labelFn) {
    select.replaceChildren();
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = placeholder;
    select.appendChild(empty);
    itens.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = labelFn(item);
      select.appendChild(option);
    });
  }

  function preencherClientes() {
    preencherSelect(el.clienteInput, state.clientes, 'Selecione um cliente', cliente => texto(cliente.nome, `Cliente #${cliente.id}`));
  }

  function preencherProcessos(clienteId = '') {
    const lista = clienteId
      ? state.processos.filter(processo => String(processo.cliente?.id ?? processo.clienteId ?? '') === String(clienteId))
      : state.processos;
    preencherSelect(el.processoInput, lista, 'Sem processo vinculado', processo => {
      const numero = texto(processo.numero, `Processo #${processo.id}`);
      const tipo = processo.tipoAcao ? ` — ${processo.tipoAcao}` : '';
      return `${numero}${tipo}`;
    });
  }

  async function carregarVinculos() {
    try {
      const [clientes, processos] = await Promise.all([
        buscarJson(`${API_BASE}/clientes`),
        buscarJson(`${API_BASE}/processos`)
      ]);
      state.clientes = Array.isArray(clientes) ? clientes : [];
      state.processos = Array.isArray(processos) ? processos : [];
      preencherClientes();
      preencherProcessos();
    } catch (erro) {
      console.error('Erro ao carregar clientes/processos:', erro);
      toast(erro.message || 'Não foi possível carregar clientes e processos.', 'error');
    }
  }

  function abrirModal(file = null) {
    el.uploadForm.reset();
    el.categoriaInput.value = 'outros';
    preencherClientes();
    preencherProcessos();
    atualizarFileMeta(null);
    el.uploadModal.classList.add('open');
    if (file) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      el.arquivoInput.files = dataTransfer.files;
      atualizarFileMeta(file);
    }
    el.arquivoInput.focus();
  }

  function fecharModal() {
    el.uploadModal.classList.remove('open');
  }

  function atualizarFileMeta(file) {
    if (!file) {
      el.fileMeta.textContent = 'PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG ou PNG. Limite de 10 MB.';
      return;
    }
    el.fileMeta.textContent = `${file.name} · ${formatBytes(file.size)} · ${file.type || 'tipo não informado pelo navegador'}`;
  }

  async function enviarDocumento(event) {
    event.preventDefault();
    const arquivo = el.arquivoInput.files?.[0];
    const clienteId = el.clienteInput.value;
    const processoId = el.processoInput.value;

    if (!arquivo) {
      toast('Selecione um arquivo para enviar.', 'warning');
      return;
    }
    if (!clienteId && !processoId) {
      toast('Vincule o documento a um cliente ou processo.', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('arquivo', arquivo);
    if (el.tituloInput.value.trim()) formData.append('titulo', el.tituloInput.value.trim());
    if (el.categoriaInput.value) formData.append('categoria', el.categoriaInput.value);
    if (el.descricaoInput.value.trim()) formData.append('descricao', el.descricaoInput.value.trim());
    if (clienteId) formData.append('clienteId', clienteId);
    if (processoId) formData.append('processoId', processoId);

    el.submitUploadBtn.disabled = true;
    el.submitUploadBtn.textContent = 'Enviando...';
    try {
      const response = await fetch(`${API_BASE}/documentos`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error(await lerErroApi(response, 'Erro ao enviar documento.'));
      }
      fecharModal();
      toast('Documento enviado com sucesso.', 'success');
      await carregarDocumentos();
    } catch (erro) {
      console.error('Erro no upload:', erro);
      toast(erro.message || 'Erro ao enviar documento.', 'error');
    } finally {
      el.submitUploadBtn.disabled = false;
      el.submitUploadBtn.textContent = 'Enviar';
    }
  }

  async function baixarDocumento(doc) {
    try {
      const response = await fetch(`${API_BASE}/documentos/${doc.id}/download`);
      if (!response.ok) {
        throw new Error(await lerErroApi(response, 'Erro ao baixar documento.'));
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.nomeOriginal || doc.titulo || `documento-${doc.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (erro) {
      console.error('Erro ao baixar documento:', erro);
      toast(erro.message || 'Erro ao baixar documento.', 'error');
    }
  }

  async function excluirDocumento(doc) {
    if (!confirm(`Excluir o documento "${texto(doc.titulo, doc.nomeOriginal)}"?`)) return;
    try {
      const response = await fetch(`${API_BASE}/documentos/${doc.id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(await lerErroApi(response, 'Erro ao excluir documento.'));
      }
      toast('Documento excluído.', 'success');
      await carregarDocumentos();
    } catch (erro) {
      console.error('Erro ao excluir documento:', erro);
      toast(erro.message || 'Erro ao excluir documento.', 'error');
    }
  }

  el.searchInput.addEventListener('input', renderDocumentos);
  el.filterCat.addEventListener('change', renderDocumentos);
  el.catRow.addEventListener('click', event => {
    const btn = event.target.closest('.cat-btn');
    if (!btn) return;
    document.querySelectorAll('.cat-btn').forEach(item => item.classList.remove('active'));
    btn.classList.add('active');
    state.categoriaAtiva = btn.dataset.cat || '';
    el.filterCat.value = '';
    renderDocumentos();
  });
  el.openUploadBtn.addEventListener('click', () => abrirModal());
  el.uploadZone.addEventListener('click', () => abrirModal());
  el.uploadZone.addEventListener('dragover', event => {
    event.preventDefault();
    el.uploadZone.classList.add('drag');
  });
  el.uploadZone.addEventListener('dragleave', () => el.uploadZone.classList.remove('drag'));
  el.uploadZone.addEventListener('drop', event => {
    event.preventDefault();
    el.uploadZone.classList.remove('drag');
    const file = event.dataTransfer.files?.[0];
    if (file) abrirModal(file);
  });
  el.closeUploadBtn.addEventListener('click', fecharModal);
  el.cancelUploadBtn.addEventListener('click', fecharModal);
  el.uploadModal.addEventListener('click', event => {
    if (event.target === el.uploadModal) fecharModal();
  });
  el.arquivoInput.addEventListener('change', () => atualizarFileMeta(el.arquivoInput.files?.[0] || null));
  el.clienteInput.addEventListener('change', () => {
    preencherProcessos(el.clienteInput.value);
  });
  el.processoInput.addEventListener('change', () => {
    const processo = state.processos.find(item => String(item.id) === String(el.processoInput.value));
    if (processo?.cliente?.id) {
      el.clienteInput.value = processo.cliente.id;
    }
  });
  el.uploadForm.addEventListener('submit', enviarDocumento);

  carregarVinculos();
  carregarDocumentos();
})();
