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

  function isAdmin() {
    return getUsuario()?.perfil === 'ADMIN';
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
    isAdmin,
    exigirAdmin,
    limparSessao,
    temSessao,
    logout
  };
})();
