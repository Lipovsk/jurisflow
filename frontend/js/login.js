/* =============================================
   JurisFlow — Login JS
   ============================================= */

(function () {
  'use strict';

  // ---- Elements ----
  const form        = document.getElementById('loginForm');
  const emailInput  = document.getElementById('email');
  const passInput   = document.getElementById('password');
  const emailError  = document.getElementById('emailError');
  const passError   = document.getElementById('passwordError');
  const toggleBtn   = document.getElementById('togglePassword');
  const btnLogin    = document.getElementById('btnLogin');
  const forgotLink  = document.getElementById('forgotLink');
  const forgotModal = document.getElementById('forgotModal');
  const modalClose  = document.getElementById('modalClose');
  const btnForgot   = document.getElementById('btnForgot');
  const forgotEmail = document.getElementById('forgotEmail');
  const modalSuccess= document.getElementById('modalSuccess');
  const rememberChk = document.getElementById('remember');

  // ---- Restore remembered email ----
  const savedEmail = localStorage.getItem('jf_email');
  if (savedEmail) {
    emailInput.value = savedEmail;
    rememberChk.checked = true;
  }

  // ---- Validation helpers ----
  const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  function showError(input, msgEl, msg) {
    input.classList.add('error-field');
    msgEl.textContent = msg;
  }
  function clearError(input, msgEl) {
    input.classList.remove('error-field');
    msgEl.textContent = '';
  }

  function paginaInicialPreferida() {
    try {
      const preferencias = JSON.parse(localStorage.getItem('jurisflow_preferencias_v1') || '{}');
      const pagina = preferencias?.paginaInicial;
      const permitidas = new Set(['dashboard.html', 'clientes.html', 'processos.html', 'agenda.html', 'honorarios.html', 'financeiro.html']);
      return permitidas.has(pagina) ? pagina : 'dashboard.html';
    } catch {
      return 'dashboard.html';
    }
  }

  async function lerErroApi(response) {
    const body = await response.json().catch(() => null);
    return body?.message || body?.erro || body?.error || 'E-mail ou senha inválidos.';
  }

  // Live validation
  emailInput.addEventListener('input', () => {
    if (emailInput.value && !isValidEmail(emailInput.value)) {
      showError(emailInput, emailError, 'Informe um e-mail válido.');
    } else {
      clearError(emailInput, emailError);
    }
  });
  passInput.addEventListener('input', () => {
    if (passInput.value.length > 0 && passInput.value.length < 6) {
      showError(passInput, passError, 'A senha deve ter ao menos 6 caracteres.');
    } else {
      clearError(passInput, passError);
    }
  });

  // ---- Toggle password visibility ----
  toggleBtn.addEventListener('click', () => {
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    toggleBtn.setAttribute('aria-pressed', String(isPass));
    toggleBtn.querySelector('.eye-icon').style.opacity = isPass ? '.5' : '1';
  });

  // ---- Form submit ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    if (!emailInput.value.trim()) {
      showError(emailInput, emailError, 'O e-mail é obrigatório.');
      valid = false;
    } else if (!isValidEmail(emailInput.value)) {
      showError(emailInput, emailError, 'Informe um e-mail válido.');
      valid = false;
    } else {
      clearError(emailInput, emailError);
    }

    if (!passInput.value) {
      showError(passInput, passError, 'A senha é obrigatória.');
      valid = false;
    } else if (passInput.value.length < 6) {
      showError(passInput, passError, 'A senha deve ter ao menos 6 caracteres.');
      valid = false;
    } else {
      clearError(passInput, passError);
    }

    if (!valid) return;

    // Save remember me
    if (rememberChk.checked) {
      localStorage.setItem('jf_email', emailInput.value.trim());
    } else {
      localStorage.removeItem('jf_email');
    }

    // Loading state
    btnLogin.classList.add('loading');
    btnLogin.disabled = true;

    try {
      const data = await autenticar(emailInput.value.trim(), passInput.value);
      window.JurisFlowAuth.salvarSessao(data);
      window.location.href = paginaInicialPreferida();
    } catch (err) {
      btnLogin.classList.remove('loading');
      btnLogin.disabled = false;
      showError(emailInput, emailError, '');
      showError(passInput, passError, err.message || 'Credenciais inválidas. Tente novamente.');
    }
  });

  async function autenticar(email, senha) {
    try {
      const res = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      if (!res.ok) {
        throw new Error(await lerErroApi(res));
      }

      const data = await res.json();
      if (!data?.token || !data?.usuario) {
        throw new Error('Resposta de autenticação inválida.');
      }
      return data;
    } catch (err) {
      throw new Error(err.message || 'Serviço de autenticação indisponível. Verifique o backend.');
    }
  }

  // ---- Forgot Password Modal ----
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotModal.classList.add('open');
    forgotEmail.focus();
  });

  function closeModal() {
    forgotModal.classList.remove('open');
    forgotEmail.value = '';
    modalSuccess.classList.remove('show');
    btnForgot.classList.remove('loading');
    btnForgot.disabled = false;
  }

  modalClose.addEventListener('click', closeModal);
  forgotModal.addEventListener('click', (e) => {
    if (e.target === forgotModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && forgotModal.classList.contains('open')) closeModal();
  });

  btnForgot.addEventListener('click', async () => {
    const val = forgotEmail.value.trim();
    if (!val || !isValidEmail(val)) {
      forgotEmail.classList.add('error-field');
      forgotEmail.placeholder = 'Informe um e-mail válido';
      return;
    }
    forgotEmail.classList.remove('error-field');
    modalSuccess.querySelector('span').textContent = 'Recuperação de senha ainda não está disponível.';
    modalSuccess.classList.add('show');
  });

})();
