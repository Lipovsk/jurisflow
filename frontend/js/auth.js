(() => {
  'use strict';

  const API_ORIGIN = 'http://localhost:8080';
  const TOKEN_KEY = 'jurisflow_auth_token';
  const USER_KEY = 'jurisflow_auth_usuario';
  const LOGIN_PAGE = 'login.html';
  const LEGACY_LOGIN_PAGE = 'index.html';
  const originalFetch = window.fetch.bind(window);

  function isLoginPage() {
    const page = window.location.pathname.split('/').pop() || '';
    return page === LOGIN_PAGE || page === LEGACY_LOGIN_PAGE;
  }

  function isJurisFlowApi(input) {
    try {
      const url = new URL(typeof input === 'string' ? input : input.url, window.location.href);
      return url.origin === API_ORIGIN;
    } catch {
      return false;
    }
  }

  function isAuthLoginCall(input) {
    try {
      const url = new URL(typeof input === 'string' ? input : input.url, window.location.href);
      return url.origin === API_ORIGIN && url.pathname === '/auth/login';
    } catch {
      return false;
    }
  }

  function salvarSessao(data) {
    if (!data?.token || !data?.usuario) {
      throw new Error('Resposta de autenticacao invalida.');
    }
    sessionStorage.setItem(TOKEN_KEY, data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
  }

  function getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  function getUsuario() {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function limparSessao() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  function temSessao() {
    return Boolean(getToken());
  }

  function logout() {
    limparSessao();
    window.location.href = LOGIN_PAGE;
  }

  function getUsuarioLogado() {
    return getUsuario();
  }

  function getIdentidadeUsuario() {
    const usuario = getUsuarioLogado();
    const nomeInformado = String(usuario?.nome ?? '').trim();
    const nome = nomeInformado || 'Usuário';
    const perfilInformado = String(usuario?.perfil ?? '').trim().toUpperCase();
    const perfil = ['ADMIN', 'ADVOGADO', 'ASSISTENTE'].includes(perfilInformado)
      ? perfilInformado
      : 'Perfil';
    const partesNome = nomeInformado.split(/\s+/).filter(Boolean);
    const iniciais = partesNome.length > 1
      ? `${partesNome[0][0]}${partesNome[partesNome.length - 1][0]}`.toUpperCase()
      : (partesNome[0]?.slice(0, 2).toUpperCase() || 'U');
    const email = String(usuario?.email ?? '').trim();

    return { nome, perfil, iniciais, email };
  }

  function aplicarIdentidadeUsuarioNaTela() {
    const identidade = getIdentidadeUsuario();
    const atualizarTexto = (seletor, texto) => {
      document.querySelectorAll(seletor).forEach(elemento => {
        elemento.textContent = texto;
      });
    };

    atualizarTexto('.topbar-user-name', identidade.nome);
    atualizarTexto('.topbar-avatar', identidade.iniciais);
    atualizarTexto('.sidebar .user-card .user-name', identidade.nome);
    atualizarTexto('.sidebar .user-card .user-role', identidade.perfil);
    atualizarTexto('.sidebar .user-card .user-avatar', identidade.iniciais);
    atualizarTexto('[data-auth-user-name]', identidade.nome);
    atualizarTexto('[data-auth-user-profile]', identidade.perfil);
    atualizarTexto('[data-auth-user-initials]', identidade.iniciais);

    const nomePerfilInput = document.querySelector('[data-auth-user-name-input]');
    if (nomePerfilInput) nomePerfilInput.value = identidade.nome;
    const emailPerfilInput = document.querySelector('[data-auth-user-email-input]');
    if (emailPerfilInput) emailPerfilInput.value = identidade.email;

    const responsavelSelect = document.querySelector('[data-auth-user-responsible]');
    if (responsavelSelect) {
      const option = document.createElement('option');
      option.value = identidade.nome;
      option.textContent = `${identidade.nome} — ${identidade.perfil}`;
      option.selected = true;
      responsavelSelect.replaceChildren(option);
    }
  }

  function isAdmin() {
    return getPerfilUsuario() === 'ADMIN';
  }

  function getPerfilUsuario() {
    return getUsuarioLogado()?.perfil || null;
  }

  function isAdvogado() {
    return getPerfilUsuario() === 'ADVOGADO';
  }

  function isAssistente() {
    return getPerfilUsuario() === 'ASSISTENTE';
  }

  function podeGerenciarUsuarios() {
    return isAdmin();
  }

  function podeVerAuditoria() {
    return isAdmin();
  }

  function podeEditarClientes() {
    return isAdmin() || isAdvogado();
  }

  function podeArquivarClientes() {
    return podeEditarClientes();
  }

  function podeEditarProcessos() {
    return isAdmin() || isAdvogado();
  }

  function podeArquivarProcessos() {
    return podeEditarProcessos();
  }

  function podeEnviarDocumentos() {
    return isAdmin() || isAdvogado() || isAssistente();
  }

  function podeExcluirDocumentos() {
    return isAdmin() || isAdvogado();
  }

  function podeAcessarFinanceiro() {
    return isAdmin() || isAdvogado();
  }

  function exigirAdmin() {
    if (isAdmin()) return true;
    throw new Error('Você não tem permissão para acessar esta área.');
  }

  function redirecionarLogin() {
    limparSessao();
    if (!isLoginPage()) {
      window.location.href = LOGIN_PAGE;
    }
  }

  function ocultarSeletores(seletores) {
    document.querySelectorAll(seletores).forEach(elemento => {
      elemento.hidden = true;
      elemento.style.display = 'none';
    });
  }

  function aplicarPermissoesNaTela() {
    if (!podeGerenciarUsuarios()) {
      ocultarSeletores('[data-target="usuarios"], #sec-usuarios');
    }
    if (!podeVerAuditoria()) {
      ocultarSeletores('[data-target="auditoria"], #sec-auditoria');
    }
    if (!podeEditarClientes()) {
      ocultarSeletores('#btnNovoCliente, #btnEditarCliente');
    }
    if (!podeArquivarClientes()) {
      ocultarSeletores('#btnExcluirCliente');
    }
    if (!podeEditarProcessos()) {
      ocultarSeletores('#btnNovoProcesso, #btnEditarProcesso');
    }
    if (!podeArquivarProcessos()) {
      ocultarSeletores('#btnExcluirProcesso');
    }
    if (!podeAcessarFinanceiro()) {
      ocultarSeletores('a[href="financeiro.html"], a[href="honorarios.html"], a[href="lancar-honorario.html"], [data-target="fin-cfg"], #sec-fin-cfg');
    }
  }

  function protegerPaginaPorPerfil() {
    const pagina = window.location.pathname.split('/').pop() || '';
    const paginaFinanceira = ['financeiro.html', 'honorarios.html', 'lancar-honorario.html'].includes(pagina);
    const paginaCriarCliente = pagina === 'novo-cliente.html';
    const paginaCriarProcesso = pagina === 'novo-processo.html';

    if ((paginaFinanceira && !podeAcessarFinanceiro())
        || (paginaCriarCliente && !podeEditarClientes())
        || (paginaCriarProcesso && !podeEditarProcessos())) {
      alert('Você não tem permissão para acessar esta área.');
      window.location.replace('dashboard.html');
      return false;
    }
    return true;
  }

  window.fetch = async function fetchAutenticado(input, init = {}) {
    const shouldAuthenticate = isJurisFlowApi(input);
    const requestInit = { ...init };

    if (shouldAuthenticate && !isAuthLoginCall(input)) {
      const currentToken = getToken();
      if (currentToken) {
        const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
        headers.set('Authorization', `Bearer ${currentToken}`);
        requestInit.headers = headers;
      }
    }

    const response = await originalFetch(input, requestInit);

    if (shouldAuthenticate && !isAuthLoginCall(input) && response.status === 401) {
      redirecionarLogin();
    }

    return response;
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (!isLoginPage() && !temSessao()) {
      redirecionarLogin();
      return;
    }

    if (!isLoginPage() && !protegerPaginaPorPerfil()) return;
    aplicarIdentidadeUsuarioNaTela();
    aplicarPermissoesNaTela();

    document.querySelectorAll('[data-action="logout"]').forEach(element => {
      element.addEventListener('click', event => {
        event.preventDefault();
        logout();
      });
    });
  });

  window.JurisFlowAuth = {
    salvarSessao,
    getToken,
    getUsuario,
    getUsuarioLogado,
    getIdentidadeUsuario,
    aplicarIdentidadeUsuarioNaTela,
    getPerfilUsuario,
    isAdmin,
    isAdvogado,
    isAssistente,
    exigirAdmin,
    podeGerenciarUsuarios,
    podeVerAuditoria,
    podeEditarClientes,
    podeArquivarClientes,
    podeEditarProcessos,
    podeArquivarProcessos,
    podeEnviarDocumentos,
    podeExcluirDocumentos,
    podeAcessarFinanceiro,
    limparSessao,
    temSessao,
    logout
  };
})();
