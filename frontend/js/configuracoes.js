(() => {
  'use strict';

  const Preferencias = window.JurisFlowPreferencias;
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

    byId('btnAlterarSenha')?.addEventListener('click', () => {
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

      recursoNaoConectado('Alteração de senha não está conectada a um endpoint real nesta tela.');
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
    byId('btnAddUser')?.addEventListener('click', () => {
      const panel = byId('addUserPanel');
      if (panel) panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    });

    byId('btnCancelAddUser')?.addEventListener('click', () => {
      const panel = byId('addUserPanel');
      if (panel) panel.style.display = 'none';
    });

    byId('btnSaveUser')?.addEventListener('click', () => {
      recursoNaoConectado('Cadastro de usuário não está conectado a um endpoint real nesta tela.');
    });
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
    initFooter();
    initAcoesNaoConectadas();
  });
})();
