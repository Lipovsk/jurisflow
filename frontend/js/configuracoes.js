(() => {
  'use strict';

  const Preferencias = window.JurisFlowPreferencias;
  const API_BASE = 'http://localhost:8080';
  const ESCALA_LABEL = {
    pequeno: '90%',
    padrao: '100%',
    grande: '110%'
  };
  const ESCALA_ORDEM = ['pequeno', 'padrao', 'grande'];

  let draft = Preferencias?.carregar?.() || {
    tema: 'claro',
    corPrincipal: 'azul',
    escalaFonte: 'padrao',
    formatoData: 'ddmmyyyy',
    paginaInicial: 'dashboard.html'
  };
  let usuarios = [];
  let usuarioEditandoId = null;
  let usuarioResetSenhaId = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function toast(mensagem, tipo = 'info') {
    if (window.JurisFlow?.showToast) {
      window.JurisFlow.showToast(mensagem, tipo);
      return;
    }
    console[tipo === 'error' ? 'error' : 'log'](mensagem);
  }

  async function lerMensagemErroApi(response, fallback) {
    try {
      const data = await response.json();
      return data?.message || data?.erro || data?.error || fallback;
    } catch {
      return fallback;
    }
  }

  function usuarioLogado() {
    return window.JurisFlowAuth?.getUsuarioLogado?.() || window.JurisFlowAuth?.getUsuario?.() || null;
  }

  function isAdmin() {
    return window.JurisFlowAuth?.isAdmin?.() === true;
  }

  function respostaAutenticacaoTratada(response) {
    return response?.status === 401 || response?.status === 403;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function iniciais(nome) {
    return String(nome || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(parte => parte[0] || '')
      .join('')
      .toUpperCase() || '?';
  }

  function badgePerfil(perfil) {
    const cls = perfil === 'ADMIN' ? 'ab-admin' : perfil === 'ADVOGADO' ? 'ab-editor' : 'ab-viewer';
    return `<span class="access-badge ${cls}">${escapeHtml(perfil)}</span>`;
  }

  function setPreviewImage(preview, src, alt) {
    if (!preview) return;
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    preview.replaceChildren(img);
  }

  function lerArquivoImagem(input, previewId, alt) {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => setPreviewImage(byId(previewId), event.target.result, alt);
    reader.readAsDataURL(file);
  }

  function aplicarFormulario(pref) {
    draft = { ...pref };

    document.querySelectorAll('.theme-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.theme === draft.tema);
    });

    document.querySelectorAll('.color-opt').forEach(opt => {
      opt.classList.toggle('selected', opt.dataset.color === draft.corPrincipal);
    });

    const fonte = byId('fontSizeVal');
    if (fonte) fonte.textContent = ESCALA_LABEL[draft.escalaFonte] || ESCALA_LABEL.padrao;

    const formato = byId('prefFormatoData');
    if (formato) formato.value = draft.formatoData;

    const pagina = byId('prefPaginaInicial');
    if (pagina) pagina.value = draft.paginaInicial;
  }

  function mudarEscala(direcao) {
    const atual = ESCALA_ORDEM.indexOf(draft.escalaFonte);
    const proximo = Math.min(ESCALA_ORDEM.length - 1, Math.max(0, atual + direcao));
    draft.escalaFonte = ESCALA_ORDEM[proximo] || 'padrao';
    aplicarFormulario(draft);
  }

  function addTagFromInput(inputId, listId) {
    const input = byId(inputId);
    const list = byId(listId);
    const valor = input?.value?.trim();
    if (!input || !list || !valor) return;

    const tag = document.createElement('div');
    tag.className = 'tag-item';
    tag.appendChild(document.createTextNode(valor));

    const remover = document.createElement('span');
    remover.className = 'tag-remove';
    remover.textContent = 'x';
    tag.appendChild(remover);

    list.appendChild(tag);
    input.value = '';
    input.focus();
  }

  function recursoNaoConectado(mensagem) {
    toast(mensagem, 'warning');
  }

  function initNavegacaoInterna() {
    const navBtns = document.querySelectorAll('.snav-item[data-target]');
    const sections = document.querySelectorAll('.cfg-section');

    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        sections.forEach(section => section.classList.remove('active'));
        btn.classList.add('active');
        byId(`sec-${btn.dataset.target}`)?.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function initUploads() {
    byId('avatarInput')?.addEventListener('change', function onAvatarChange() {
      lerArquivoImagem(this, 'avatarPreview', 'Avatar');
    });

    byId('logoInput')?.addEventListener('change', function onLogoChange() {
      lerArquivoImagem(this, 'logoPreview', 'Logo');
    });

    byId('docLogoInput')?.addEventListener('change', function onDocLogoChange() {
      lerArquivoImagem(this, 'docLogoPreview', 'Logo de documentos');
    });
  }

  function initSenha() {
    byId('novaSenha')?.addEventListener('input', function onSenhaInput() {
      const valor = this.value;
      let strength = 0;
      if (valor.length >= 8) strength += 1;
      if (/[A-Z]/.test(valor)) strength += 1;
      if (/[0-9]/.test(valor)) strength += 1;
      if (/[^A-Za-z0-9]/.test(valor)) strength += 1;

      const fill = byId('strengthFill');
      const text = byId('strengthText');
      const colors = ['#EF4444', '#F59E0B', '#10B981', '#059669'];
      const labels = ['Fraca', 'Moderada', 'Boa', 'Forte'];

      if (!fill || !text) return;
      if (!valor) {
        fill.style.width = '0';
        text.textContent = '';
        return;
      }

      const index = Math.max(0, strength - 1);
      fill.style.width = `${(strength / 4) * 100}%`;
      fill.style.background = colors[index];
      text.textContent = labels[index];
      text.style.color = colors[index];
    });

    byId('btnAlterarSenha')?.addEventListener('click', async () => {
      const atual = byId('senhaAtual')?.value;
      const nova = byId('novaSenha')?.value;
      const conf = byId('confirmaSenha')?.value;

      if (!atual || !nova || !conf) {
        toast('Preencha todos os campos de senha.', 'warning');
        return;
      }
      if (nova !== conf) {
        toast('Nova senha e confirmação não coincidem.', 'error');
        return;
      }
      if (nova.length < 8) {
        toast('A senha deve ter pelo menos 8 caracteres.', 'error');
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/usuarios/me/senha`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senhaAtual: atual, novaSenha: nova })
        });

        if (respostaAutenticacaoTratada(response)) return;

        if (!response.ok) {
          throw new Error(await lerMensagemErroApi(response, 'Erro ao alterar senha.'));
        }

        ['senhaAtual', 'novaSenha', 'confirmaSenha'].forEach(id => {
          const input = byId(id);
          if (input) input.value = '';
        });
        const fill = byId('strengthFill');
        const text = byId('strengthText');
        if (fill) fill.style.width = '0';
        if (text) text.textContent = '';
        toast('Senha alterada com sucesso.', 'success');
      } catch (erro) {
        toast(erro.message || 'Erro ao alterar senha.', 'error');
      }
    });
  }

  function initAparencia() {
    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        draft.tema = card.dataset.theme || draft.tema;
        aplicarFormulario(draft);
      });
    });

    document.querySelectorAll('.color-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        draft.corPrincipal = opt.dataset.color || draft.corPrincipal;
        aplicarFormulario(draft);
      });
    });

    byId('fontMinus')?.addEventListener('click', () => mudarEscala(-1));
    byId('fontPlus')?.addEventListener('click', () => mudarEscala(1));

    byId('prefFormatoData')?.addEventListener('change', event => {
      draft.formatoData = event.target.value;
    });

    byId('prefPaginaInicial')?.addEventListener('change', event => {
      draft.paginaInicial = event.target.value;
    });
  }

  function initTags() {
    window.addTagFromInput = addTagFromInput;

    document.querySelectorAll('.tag-input-row input').forEach(input => {
      input.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        addTagFromInput(input.id, input.id.replace('Input', 'List'));
      });
    });

    document.querySelectorAll('.tag-list').forEach(list => {
      list.addEventListener('click', event => {
        if (event.target.classList.contains('tag-remove')) {
          event.target.closest('.tag-item')?.remove();
        }
      });
    });
  }

  function initUsuarios() {
    const navUsuarios = document.querySelector('.snav-item[data-target="usuarios"]');
    const semPermissao = byId('usuariosSemPermissao');
    const tabela = document.querySelector('#sec-usuarios .user-table')?.closest('div');

    if (!isAdmin()) {
      navUsuarios?.classList.add('hidden');
      byId('btnAddUser')?.classList.add('hidden');
      if (semPermissao) semPermissao.style.display = 'block';
      if (tabela) tabela.style.display = 'none';
      return;
    }

    carregarUsuarios();

    byId('btnAddUser')?.addEventListener('click', () => {
      abrirFormularioUsuario();
    });

    byId('btnCancelAddUser')?.addEventListener('click', () => {
      fecharFormularioUsuario();
    });

    byId('btnSaveUser')?.addEventListener('click', salvarUsuario);

    byId('btnCancelResetSenha')?.addEventListener('click', fecharResetSenha);
    byId('btnConfirmResetSenha')?.addEventListener('click', resetarSenhaUsuario);

    byId('usuariosTabelaBody')?.addEventListener('click', event => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const id = Number(button.dataset.id);
      const usuario = usuarios.find(item => item.id === id);
      if (!usuario) return;

      if (button.dataset.action === 'editar') abrirFormularioUsuario(usuario);
      if (button.dataset.action === 'toggle') alternarStatusUsuario(usuario);
      if (button.dataset.action === 'reset') abrirResetSenha(usuario);
    });
  }

  async function carregarUsuarios() {
    const tbody = byId('usuariosTabelaBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:24px;">Carregando usuários...</td></tr>';
    }

    try {
      const response = await fetch(`${API_BASE}/usuarios?incluirInativos=true`);
      if (response.status === 401) return;
      if (response.status === 403) {
        const semPermissao = byId('usuariosSemPermissao');
        if (semPermissao) semPermissao.style.display = 'block';
        if (tbody) tbody.replaceChildren();
        return;
      }
      if (!response.ok) {
        throw new Error(await lerMensagemErroApi(response, 'Erro ao carregar usuários.'));
      }
      usuarios = await response.json();
      renderUsuarios();
    } catch (erro) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--red);padding:24px;">${escapeHtml(erro.message || 'Erro ao carregar usuários.')}</td></tr>`;
      }
      toast(erro.message || 'Erro ao carregar usuários.', 'error');
    }
  }

  function renderUsuarios() {
    const tbody = byId('usuariosTabelaBody');
    if (!tbody) return;

    if (!usuarios.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-400);padding:24px;">Nenhum usuário cadastrado.</td></tr>';
      return;
    }

    const logado = usuarioLogado();
    tbody.innerHTML = usuarios.map(usuario => {
      const ativo = usuario.ativo === true;
      const isSelf = logado && Number(logado.id) === Number(usuario.id);
      const usuarioId = escapeHtml(String(usuario.id ?? ''));
      const toggleLabel = ativo ? 'Desativar' : 'Ativar';
      const toggleClass = ativo ? 'btn-danger' : '';
      const toggleDisabled = isSelf ? ' disabled title="Você não pode desativar seu próprio usuário por aqui."' : '';

      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#0D1B2A,#1a2f52);display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;color:var(--gold);">${escapeHtml(iniciais(usuario.nome))}</div>
              <div>
                <div style="font-weight:600;font-size:.84rem;">${escapeHtml(usuario.nome)}</div>
                <div style="font-size:.72rem;color:var(--gray-400);">${isSelf ? 'Você' : 'Usuário'}</div>
              </div>
            </div>
          </td>
          <td style="font-size:.82rem;color:var(--gray-600);">${escapeHtml(usuario.email)}</td>
          <td>${badgePerfil(usuario.perfil)}</td>
          <td><span class="${ativo ? 'status-active' : 'status-inactive'}">● ${ativo ? 'Ativo' : 'Inativo'}</span></td>
          <td>
            <div class="user-actions">
              <button class="btn-outline btn-sm" data-action="editar" data-id="${usuarioId}">Editar</button>
              <button class="btn-outline btn-sm" data-action="reset" data-id="${usuarioId}"${isSelf ? ' disabled title="Use Minha senha para alterar sua senha."' : ''}>Resetar senha</button>
              <button class="btn-outline btn-sm ${toggleClass}" data-action="toggle" data-id="${usuarioId}"${toggleDisabled}>${toggleLabel}</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function abrirFormularioUsuario(usuario = null) {
    usuarioEditandoId = usuario?.id ?? null;
    byId('userFormTitle').textContent = usuario ? 'Editar Usuário' : 'Novo Usuário';
    byId('newUserNome').value = usuario?.nome || '';
    byId('newUserEmail').value = usuario?.email || '';
    byId('newUserTipo').value = usuario?.perfil || 'ADVOGADO';
    byId('newUserAtivo').value = String(usuario?.ativo ?? true);
    byId('newUserSenha').value = '';
    byId('newUserSenha').closest('.field').style.display = usuario ? 'none' : 'flex';
    byId('newUserSenhaHint').textContent = usuario ? '' : 'Obrigatória no cadastro.';
    byId('addUserPanel').style.display = 'block';
    byId('resetSenhaPanel').style.display = 'none';
  }

  function fecharFormularioUsuario() {
    usuarioEditandoId = null;
    byId('addUserPanel').style.display = 'none';
  }

  async function salvarUsuario() {
    const nome = byId('newUserNome')?.value.trim();
    const email = byId('newUserEmail')?.value.trim();
    const perfil = byId('newUserTipo')?.value;
    const ativo = byId('newUserAtivo')?.value === 'true';
    const senha = byId('newUserSenha')?.value;

    if (!nome || !email || !perfil) {
      toast('Preencha nome, e-mail e perfil.', 'warning');
      return;
    }
    if (!usuarioEditandoId && !senha) {
      toast('Informe a senha inicial do usuário.', 'warning');
      return;
    }
    if (!usuarioEditandoId && senha.length < 8) {
      toast('A senha deve ter pelo menos 8 caracteres.', 'error');
      return;
    }

    const editando = Boolean(usuarioEditandoId);
    const body = editando
      ? { nome, email, perfil, ativo }
      : { nome, email, perfil, senha };

    try {
      const response = await fetch(`${API_BASE}/usuarios${editando ? `/${usuarioEditandoId}` : ''}`, {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (respostaAutenticacaoTratada(response)) return;

      if (!response.ok) {
        throw new Error(await lerMensagemErroApi(response, 'Erro ao salvar usuário.'));
      }

      toast(editando ? 'Usuário atualizado com sucesso.' : 'Usuário criado com sucesso.', 'success');
      fecharFormularioUsuario();
      await carregarUsuarios();
    } catch (erro) {
      toast(erro.message || 'Erro ao salvar usuário.', 'error');
    }
  }

  async function alternarStatusUsuario(usuario) {
    const proximoAtivo = usuario.ativo !== true;
    const acao = proximoAtivo ? 'ativar' : 'desativar';
    if (!confirm(`Deseja ${acao} este usuário?`)) return;

    try {
      const response = await fetch(`${API_BASE}/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          ativo: proximoAtivo
        })
      });

      if (respostaAutenticacaoTratada(response)) return;

      if (!response.ok) {
        throw new Error(await lerMensagemErroApi(response, `Erro ao ${acao} usuário.`));
      }

      toast(`Usuário ${proximoAtivo ? 'ativado' : 'desativado'} com sucesso.`, 'success');
      await carregarUsuarios();
    } catch (erro) {
      toast(erro.message || `Erro ao ${acao} usuário.`, 'error');
    }
  }

  function abrirResetSenha(usuario) {
    usuarioResetSenhaId = usuario.id;
    byId('resetSenhaTitle').textContent = `Resetar senha de ${usuario.nome}`;
    byId('resetUserSenha').value = '';
    byId('resetSenhaPanel').style.display = 'block';
    byId('addUserPanel').style.display = 'none';
  }

  function fecharResetSenha() {
    usuarioResetSenhaId = null;
    byId('resetSenhaPanel').style.display = 'none';
  }

  async function resetarSenhaUsuario() {
    const novaSenha = byId('resetUserSenha')?.value;
    if (!usuarioResetSenhaId) return;
    if (!novaSenha) {
      toast('Informe a nova senha.', 'warning');
      return;
    }
    if (novaSenha.length < 8) {
      toast('A senha deve ter pelo menos 8 caracteres.', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/usuarios/${usuarioResetSenhaId}/senha`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novaSenha })
      });

      if (respostaAutenticacaoTratada(response)) return;

      if (!response.ok) {
        throw new Error(await lerMensagemErroApi(response, 'Erro ao resetar senha.'));
      }

      toast('Senha resetada com sucesso.', 'success');
      fecharResetSenha();
    } catch (erro) {
      toast(erro.message || 'Erro ao resetar senha.', 'error');
    }
  }

  function initAuditoria() {
    const navAuditoria = document.querySelector('.snav-item[data-target="auditoria"]');
    const secAuditoria = byId('sec-auditoria');

    if (!isAdmin()) {
      navAuditoria?.classList.add('hidden');
      secAuditoria?.classList.add('hidden');
      return;
    }

    carregarAuditoria();
  }

  async function carregarAuditoria() {
    const tbody = byId('auditoriaTabelaBody');
    const semPermissao = byId('auditoriaSemPermissao');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray-400);padding:24px;">Carregando auditoria...</td></tr>';
    }

    try {
      const response = await fetch(`${API_BASE}/auditoria?limite=100`);
      if (response.status === 401) return;
      if (response.status === 403) {
        if (semPermissao) semPermissao.style.display = 'block';
        if (tbody) tbody.replaceChildren();
        return;
      }
      if (!response.ok) {
        throw new Error(await lerMensagemErroApi(response, 'Erro ao carregar auditoria.'));
      }
      const eventos = await response.json();
      renderAuditoria(eventos);
    } catch (erro) {
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--red);padding:24px;">${escapeHtml(erro.message || 'Erro ao carregar auditoria.')}</td></tr>`;
      }
      toast(erro.message || 'Erro ao carregar auditoria.', 'error');
    }
  }

  function renderAuditoria(eventos) {
    const tbody = byId('auditoriaTabelaBody');
    if (!tbody) return;
    if (!Array.isArray(eventos) || !eventos.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray-400);padding:24px;">Nenhum evento de auditoria registrado.</td></tr>';
      return;
    }

    tbody.innerHTML = eventos.map(evento => {
      const dataHora = evento.dataHora ? new Date(evento.dataHora).toLocaleString('pt-BR') : '—';
      const usuario = evento.usuarioNome || evento.usuarioEmail || 'Não identificado';
      const sucesso = evento.sucesso === true;
      return `
        <tr>
          <td>${escapeHtml(dataHora)}</td>
          <td>${escapeHtml(usuario)}</td>
          <td>${escapeHtml(evento.acao || '—')}</td>
          <td>${escapeHtml(evento.entidade || '—')}</td>
          <td>${escapeHtml(evento.entidadeId ?? '—')}</td>
          <td><span class="${sucesso ? 'audit-success' : 'audit-failure'}">${sucesso ? 'Sucesso' : 'Falha'}</span></td>
          <td>${escapeHtml(evento.descricao || '—')}</td>
        </tr>
      `;
    }).join('');
  }

  function initFooter() {
    byId('btnSalvar')?.addEventListener('click', () => {
      if (!Preferencias?.salvar || !Preferencias?.aplicar) {
        toast('Preferências de aparência indisponíveis nesta página.', 'error');
        return;
      }
      const salvas = Preferencias.salvar(draft);
      Preferencias.aplicar(salvas);
      aplicarFormulario(salvas);
      toast('Preferências de aparência salvas.', 'success');
    });

    byId('btnCancelar')?.addEventListener('click', () => {
      if (!confirm('Deseja descartar as alterações não salvas?')) return;
      const atuais = Preferencias?.carregar?.() || draft;
      Preferencias?.aplicar?.(atuais);
      aplicarFormulario(atuais);
      toast('Alterações descartadas.', 'info');
    });

    byId('btnRestaurar')?.addEventListener('click', () => {
      if (!confirm('Restaurar preferências de aparência e navegação para o padrão?')) return;
      const padrao = Preferencias?.restaurarPadrao?.() || draft;
      Preferencias?.aplicar?.(padrao);
      aplicarFormulario(padrao);
      toast('Preferências restauradas ao padrão.', 'warning');
    });
  }

  function initAcoesNaoConectadas() {
    document.querySelectorAll('[data-action-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        recursoNaoConectado('Esta ação ainda não está conectada a um endpoint real.');
      });
    });

    document.querySelectorAll('.int-card .btn-outline').forEach(btn => {
      btn.addEventListener('click', () => {
        recursoNaoConectado('Integração ainda não conectada a um endpoint real.');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    Preferencias?.aplicar?.(draft);
    aplicarFormulario(draft);
    initNavegacaoInterna();
    initUploads();
    initSenha();
    initAparencia();
    initTags();
    initUsuarios();
    initAuditoria();
    initFooter();
    initAcoesNaoConectadas();
  });
})();
