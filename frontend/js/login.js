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
      // Simula chamada à API — substituir por fetch real ao Spring Boot
      await simulateLogin(emailInput.value.trim(), passInput.value);
      // Redireciona para o dashboard
      window.location.href = 'dashboard.html';
    } catch (err) {
      btnLogin.classList.remove('loading');
      btnLogin.disabled = false;
      showError(emailInput, emailError, '');
      showError(passInput, passError, err.message || 'Credenciais inválidas. Tente novamente.');
    }
  });

  /**
   * Autenticação: tenta chamar o backend real. Se o endpoint não existir
   * ou ocorrer erro de rede, retorna erro informativo sem usar credenciais demo.
   */
  async function simulateLogin(email, password) {
    try {
      const res = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || 'E-mail ou senha incorretos.');
      }

      const data = await res.json();
      if (data?.token) localStorage.setItem('jurisflow_token', data.token);
      return data;
    } catch (err) {
      throw new Error('Serviço de autenticação indisponível. Verifique o backend.');
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
    btnForgot.classList.add('loading');
    btnForgot.disabled = true;

    await new Promise(r => setTimeout(r, 1200));

    btnForgot.classList.remove('loading');
    modalSuccess.classList.add('show');

    setTimeout(closeModal, 3000);
  });

})();