/**
 * JurisFlow — Dashboard JavaScript
 * Módulo principal da aplicação
 */

// ─── Estado global (mock — será substituído pela API Spring Boot) ────────────
const AppState = {
  user: {
    name: 'Dr. Carlos Mendes',
    initials: 'CM',
    oab: '12.345/SP',
    role: 'Advogado Sênior',
  },
  stats: {
    clientes:  48,
    processos: 127,
    prazos:    9,
    honorarios: 'R$ 38.400',
  },
  sidebar: {
    open: false,
    activeItem: 'dashboard',
  },
};

// ─── Utilitários ─────────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function formatDate(date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function timeAgo(minutesAgo) {
  if (minutesAgo < 60) return `${minutesAgo} min atrás`;
  const h = Math.floor(minutesAgo / 60);
  return `${h}h atrás`;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function initSidebar() {
  const sidebar  = $('#sidebar');
  const overlay  = $('#sidebarOverlay');
  const toggleBtn = $('#sidebarToggle');

  if (!sidebar) return;

  toggleBtn?.addEventListener('click', () => toggleSidebar(sidebar, overlay));
  overlay?.addEventListener('click', () => closeSidebar(sidebar, overlay));

  // Nav items — navegação entre páginas
  $$('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigateTo(page);
      if (window.innerWidth <= 900) closeSidebar(sidebar, overlay);
    });
  });

  // Highlight item ativo baseado na URL atual
  const currentPage = getCurrentPage();
  setActiveNavItem(currentPage);
}

function toggleSidebar(sidebar, overlay) {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
  AppState.sidebar.open = sidebar.classList.contains('open');
}

function closeSidebar(sidebar, overlay) {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
  AppState.sidebar.open = false;
}

function getCurrentPage() {
  const path = window.location.pathname;
  if (path.includes('clientes'))  return 'clientes';
  if (path.includes('processos')) return 'processos';
  if (path.includes('agenda'))    return 'agenda';
  if (path.includes('financeiro'))return 'financeiro';
  if (path.includes('config'))    return 'configuracoes';
  return 'dashboard';
}

function setActiveNavItem(page) {
  $$('.nav-item').forEach(item => item.classList.remove('active'));
  const active = $(`.nav-item[data-page="${page}"]`);
  active?.classList.add('active');
}

function navigateTo(page) {
  const routes = {
    dashboard:     'dashboard.html',
    clientes:      'clientes.html',
    processos:     'processos.html',
    agenda:        'agenda.html',
    financeiro:    'financeiro.html',
    configuracoes: 'configuracoes.html',
  };
  if (routes[page]) window.location.href = routes[page];
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function initTopbar() {
  // Botão de notificações
  const notifBtn = $('#notifBtn');
  notifBtn?.addEventListener('click', () => {
    showToast('📬 Você tem 3 novas notificações.', 'info');
  });

  // Botão de busca
  const searchBtn = $('#searchBtn');
  searchBtn?.addEventListener('click', () => {
    showToast('🔍 Busca global — em breve!', 'info');
  });
}

// ─── Animação dos contadores nas stat cards ───────────────────────────────────
function animateCounters() {
  $$('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1200;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * ease).toLocaleString('pt-BR');
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  let container = $('#toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = `
      position:fixed; bottom:28px; right:28px; z-index:9999;
      display:flex; flex-direction:column; gap:10px;
    `;
    document.body.appendChild(container);
  }

  const icons  = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  const colors = {
    info:    '#2563EB',
    success: '#10B981',
    warning: '#F59E0B',
    error:   '#EF4444',
  };

  const toast = document.createElement('div');
  toast.style.cssText = `
    background:#fff; border-radius:10px; padding:14px 18px;
    box-shadow:0 8px 32px rgba(13,27,42,.14);
    border-left:4px solid ${colors[type]};
    font-family:'DM Sans',sans-serif; font-size:.85rem;
    color:#2E3647; max-width:320px; display:flex; gap:10px;
    align-items:flex-start;
    animation: toastIn .3s cubic-bezier(.4,0,.2,1) both;
  `;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;

  if (!$('#toastStyle')) {
    const style = document.createElement('style');
    style.id = 'toastStyle';
    style.textContent = `
      @keyframes toastIn  { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:none; } }
      @keyframes toastOut { from { opacity:1; transform:none; } to { opacity:0; transform:translateX(24px); } }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut .3s ease both';
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// ─── Relógio na topbar ────────────────────────────────────────────────────────
function initClock() {
  const el = $('#topbarClock');
  if (!el) return;

  function update() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  update();
  setInterval(update, 30_000);
}

// ─── Boas-vindas personalizada ────────────────────────────────────────────────
function initGreeting() {
  const el = $('#greeting');
  if (!el) return;

  const hour = new Date().getHours();
  let greeting = 'Boa noite';
  if (hour < 12) greeting = 'Bom dia';
  else if (hour < 18) greeting = 'Boa tarde';

  el.textContent = `${greeting}, Dr. Mendes 👋`;
}

// ─── Confirmação de logout ────────────────────────────────────────────────────
function initLogout() {
  $$('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Deseja sair do JurisFlow?')) {
        window.location.href = 'login.html';
      }
    });
  });
}

// ─── Inicialização ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initTopbar();
  initClock();
  initGreeting();
  initLogout();
  animateCounters();

  // Confirma que a UI está pronta
  console.log(
    '%c⚖ JurisFlow carregado',
    'background:#0D1B2A;color:#C9A84C;font-weight:bold;padding:4px 10px;border-radius:4px',
  );
});

// ─── API Helper (para integração futura com Spring Boot) ─────────────────────
const API = {
  BASE_URL: '/api/v1', // alterar para o endereço do backend

  async get(endpoint) {
    try {
      const res = await fetch(`${this.BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jurisflow_token')}` },
      });
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    } catch (err) {
      console.error('[API GET]', err);
      return null;
    }
  },

  async post(endpoint, body) {
    try {
      const res = await fetch(`${this.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jurisflow_token')}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    } catch (err) {
      console.error('[API POST]', err);
      return null;
    }
  },
};

// Exporta para uso em outros módulos
window.JurisFlow = { AppState, API, showToast, navigateTo };