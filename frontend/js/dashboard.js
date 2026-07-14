/**
 * JurisFlow — Dashboard JavaScript
 * Módulo principal da aplicação
 */

// ─── Estado global (mock — será substituído pela API Spring Boot) ────────────
const AppState = {
  user: {
    name: '',
    initials: '',
    oab: '',
    role: '',
  },
  sidebar: {
    open: false,
    activeItem: 'dashboard',
  },
};

// ─── Utilitários ─────────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function escapeHtmlDashboard(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizarIdDashboard(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? String(id) : '';
}

function formatDate(date) {
  if (typeof window.JurisFlowFormatarData === 'function') {
    return window.JurisFlowFormatarData(date);
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function timeAgo(minutesAgo) {
  if (minutesAgo < 60) return `${minutesAgo} min atrás`;
  const h = Math.floor(minutesAgo / 60);
  return `${h}h atrás`;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function initSidebar() {
  const sidebar = $('#sidebar');
  const overlay = $('#sidebarOverlay');
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
  if (path.includes('clientes')) return 'clientes';
  if (path.includes('processos')) return 'processos';
  if (path.includes('agenda')) return 'agenda';
  if (path.includes('financeiro')) return 'financeiro';
  if (path.includes('documentos')) return 'documentos';
  if (path.includes('config')) return 'configuracoes';
  return 'dashboard';
}

function setActiveNavItem(page) {
  $$('.nav-item').forEach(item => item.classList.remove('active'));
  const active = $(`.nav-item[data-page="${page}"]`);
  active?.classList.add('active');
}

function navigateTo(page) {
  if (page === 'novo-cliente'
      && window.JurisFlowAuth?.podeEditarClientes?.() !== true) {
    showToast('Você não tem permissão para realizar esta ação.', 'error');
    return;
  }

  if (page === 'novo-processo'
      && window.JurisFlowAuth?.podeEditarProcessos?.() !== true) {
    showToast('Você não tem permissão para realizar esta ação.', 'error');
    return;
  }

  const routes = {
    dashboard: 'dashboard.html',
    clientes: 'clientes.html',
    processos: 'processos.html',
    agenda: 'agenda.html',
    financeiro: 'financeiro.html',
    documentos: 'documentos.html',
    configuracoes: 'configuracoes.html',
    'novo-cliente': 'novo-cliente.html',
    'novo-processo': 'novo-processo.html',
  };
  if (routes[page]) window.location.href = routes[page];
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function initTopbar() {
  $('#notifBtn')?.addEventListener('click', () => {
    showToast('Nenhuma notificação no momento.', 'info');
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

  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
  const colors = {
    info: '#2563EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  };

  const safeType = Object.hasOwn(colors, type) ? type : 'info';
  const toast = document.createElement('div');
  toast.style.cssText = `
    background:#fff; border-radius:10px; padding:14px 18px;
    box-shadow:0 8px 32px rgba(13,27,42,.14);
    border-left:4px solid ${colors[safeType]};
    font-family:'DM Sans',sans-serif; font-size:.85rem;
    color:#2E3647; max-width:320px; display:flex; gap:10px;
    align-items:flex-start;
    animation: toastIn .3s cubic-bezier(.4,0,.2,1) both;
  `;
  const icon = document.createElement('span');
  icon.textContent = icons[safeType];
  const text = document.createElement('span');
  text.textContent = String(message ?? '');
  toast.append(icon, text);

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

  const name = window.JurisFlowAuth?.getIdentidadeUsuario?.().nome || 'Usuário';
  el.textContent = `${greeting}, ${name} 👋`;
}

// ─── Confirmação de logout ────────────────────────────────────────────────────
function initLogout() {
  $$('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Deseja sair do JurisFlow?')) {
        if (window.JurisFlowAuth?.logout) {
          window.JurisFlowAuth.logout();
        } else {
          sessionStorage.clear();
          window.location.href = 'login.html';
        }
      }
    });
  });
}

// ─── Data na topbar ───────────────────────────────────────────────────────────
function initTopbarDate() {
  const el = $('#topbarDate');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── FAB (draggable) ─────────────────────────────────────────────────────────
function initFAB() {
  const items = [
    { icon: '👤', label: 'Novo Cliente', page: 'novo-cliente' },
    { icon: '📁', label: 'Novo Processo', page: 'novo-processo' },
    { icon: '📅', label: 'Nova Audiência', page: 'agenda' },
    { icon: '⏰', label: 'Novo Prazo', page: 'agenda' },
    { icon: '📄', label: 'Novo Documento', page: 'documentos' },
  ].filter(item => item.page !== 'novo-processo'
    || window.JurisFlowAuth?.podeEditarProcessos?.() === true);

  const backdrop = document.createElement('div');
  backdrop.className = 'fab-backdrop';
  backdrop.id = 'fabBackdrop';

  const container = document.createElement('div');
  container.className = 'fab-container';
  container.id = 'fabContainer';

  const menu = document.createElement('div');
  menu.className = 'fab-menu';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'fab-item-row';
    row.innerHTML = `
      <div class="fab-item-label">${item.label}</div>
      <button class="fab-item-btn" data-page="${item.page}" title="${item.label}">${item.icon}</button>
    `;
    row.querySelector('.fab-item-btn').addEventListener('click', () => navigateTo(item.page));
    menu.appendChild(row);
  });

  const mainBtn = document.createElement('button');
  mainBtn.className = 'fab-main-btn';
  mainBtn.id = 'fabMainBtn';
  mainBtn.title = 'Ações rápidas (Alt+N) · Arraste para mover';
  mainBtn.innerHTML = '<i class="fab-main-icon">＋</i>';
  mainBtn.style.cursor = 'grab';

  container.appendChild(menu);
  container.appendChild(mainBtn);
  document.body.appendChild(backdrop);
  document.body.appendChild(container);

  // ── Open / Close ──────────────────────────────────────
  function openFAB() { container.classList.add('open'); backdrop.classList.add('active'); }
  function closeFAB() { container.classList.remove('open'); backdrop.classList.remove('active'); }
  function toggleFAB() { container.classList.contains('open') ? closeFAB() : openFAB(); }

  backdrop.addEventListener('click', closeFAB);
  document.addEventListener('keydown', e => {
    if (e.altKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); toggleFAB(); }
    if (e.key === 'Escape') closeFAB();
  });

  // ── Position helpers ──────────────────────────────────
  const FAB_SIZE = 56;
  const MARGIN = 20;
  const STORE_KEY = 'jf_fab_pos';
  const SPRING = 'left .3s cubic-bezier(.34,1.56,.64,1), top .3s cubic-bezier(.34,1.56,.64,1)';

  function clamp(x, y) {
    return {
      x: Math.max(MARGIN, Math.min(x, window.innerWidth - FAB_SIZE - MARGIN)),
      y: Math.max(MARGIN, Math.min(y, window.innerHeight - FAB_SIZE - MARGIN)),
    };
  }

  function applyPos(x, y, animate = false) {
    container.style.transition = animate ? SPRING : 'none';
    container.style.left = x + 'px';
    container.style.top = y + 'px';
    container.style.right = 'auto';
    container.style.bottom = 'auto';
  }

  // Snap to nearest horizontal edge (premium feel)
  function snapEdge() {
    const r = container.getBoundingClientRect();
    const cx = r.left + FAB_SIZE / 2;
    const isLeft = cx < window.innerWidth / 2;
    const tx = isLeft ? MARGIN : window.innerWidth - FAB_SIZE - MARGIN;
    const c = clamp(tx, r.top);
    applyPos(c.x, c.y, true);
    container.classList.toggle('left-side', isLeft);
    localStorage.setItem(STORE_KEY, JSON.stringify({ ...c, side: isLeft ? 'left' : 'right' }));
    setTimeout(() => { container.style.transition = ''; }, 380);
  }

  // Restore saved position or default (bottom-right via CSS)
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved && typeof saved.x === 'number') {
      const c = clamp(saved.x, saved.y);
      applyPos(c.x, c.y);
      if (saved.side === 'left') container.classList.add('left-side');
      requestAnimationFrame(() => { container.style.transition = ''; });
    }
  } catch (_) { localStorage.removeItem(STORE_KEY); }

  // Double-click to reset to default position
  mainBtn.addEventListener('dblclick', () => {
    localStorage.removeItem(STORE_KEY);
    container.removeAttribute('style');
    showToast('Posição do botão resetada.', 'info', 2000);
  });

  // Re-clamp on window resize
  window.addEventListener('resize', () => {
    const r = container.getBoundingClientRect();
    if (r.left === 0 && r.top === 0) return; // not yet positioned via JS
    const c = clamp(r.left, r.top);
    applyPos(c.x, c.y, true);
    localStorage.setItem(STORE_KEY, JSON.stringify(c));
    setTimeout(() => { container.style.transition = ''; }, 380);
  });

  // ── Drag logic (mouse + touch) ────────────────────────
  let dragging = false;
  let didMove = false;
  let ox, oy, sx, sy; // pointer offset and start coords

  function dragStart(px, py) {
    const r = container.getBoundingClientRect();
    // Anchor pointer relative to container corner
    ox = px - r.left;
    oy = py - r.top;
    sx = px;
    sy = py;
    dragging = true;
    didMove = false;
    applyPos(r.left, r.top);           // lock in left/top, cancel CSS bottom/right
    container.style.transition = 'none';
    mainBtn.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    closeFAB();
  }

  function dragMove(px, py) {
    if (!dragging) return;
    if (Math.abs(px - sx) > 4 || Math.abs(py - sy) > 4) didMove = true;
    if (!didMove) return;
    const c = clamp(px - ox, py - oy);
    container.style.left = c.x + 'px';
    container.style.top = c.y + 'px';
  }

  function dragEnd(px, py) {
    if (!dragging) return;
    dragging = false;
    mainBtn.style.cursor = 'grab';
    document.body.style.userSelect = '';

    if (!didMove) {
      // Short press = toggle menu
      toggleFAB();
      addRipple({ clientX: px, clientY: py }, mainBtn);
    } else {
      // Released after drag = snap to edge
      snapEdge();
    }
  }

  // Mouse
  mainBtn.addEventListener('mousedown', e => { e.preventDefault(); dragStart(e.clientX, e.clientY); });
  document.addEventListener('mousemove', e => dragMove(e.clientX, e.clientY));
  document.addEventListener('mouseup', e => { if (dragging) dragEnd(e.clientX, e.clientY); });

  // Touch
  mainBtn.addEventListener('touchstart', e => {
    const t = e.touches[0];
    dragStart(t.clientX, t.clientY);
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    dragMove(t.clientX, t.clientY);
  }, { passive: false });
  document.addEventListener('touchend', e => {
    if (!dragging) return;
    const t = e.changedTouches[0];
    dragEnd(t.clientX, t.clientY);
  });
}

// ─── Ripple Effects ───────────────────────────────────────────────────────────
function addRipple(e, el) {
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = (e.clientX - rect.left) - size / 2;
  const y = (e.clientY - rect.top) - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple-wave';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

function initRippleEffects() {
  const selectors = '.qbtn, .topbar-btn, .nav-item';
  document.addEventListener('click', e => {
    const el = e.target.closest(selectors);
    if (el) addRipple(e, el);
  });
}

// ─── Quick Actions (botões no topbar) ────────────────────────────────────────
function initQuickActions() {
  const btnNovoCliente = $('#btnNovoClienteTopbar');
  if (btnNovoCliente && window.JurisFlowAuth?.podeEditarClientes?.() !== true) {
    btnNovoCliente.hidden = true;
    btnNovoCliente.disabled = true;
    btnNovoCliente.style.display = 'none';
  } else {
    btnNovoCliente?.addEventListener('click', () => navigateTo('novo-cliente'));
  }

  const btnNovoProcesso = $('#btnNovoProcessoTopbar');
  if (btnNovoProcesso && window.JurisFlowAuth?.podeEditarProcessos?.() !== true) {
    btnNovoProcesso.hidden = true;
    btnNovoProcesso.disabled = true;
    btnNovoProcesso.style.display = 'none';
  } else {
    btnNovoProcesso?.addEventListener('click', () => navigateTo('novo-processo'));
  }

  const quickActions = $('#topbarQuickActions');
  if (quickActions && btnNovoCliente?.hidden && btnNovoProcesso?.hidden) {
    quickActions.hidden = true;
    quickActions.style.display = 'none';
  }
}

// ─── Stat Progress Bars ───────────────────────────────────────────────────────
function initStatProgressBars() {
  const configs = [
    { count: 48, max: 60, color: 'blue' },
    { count: 127, max: 150, color: 'gold' },
    { count: 9, max: 20, color: 'red' },
    { count: null, pct: 80, color: 'green' },
  ];
  const cards = $$('.stat-card');
  cards.forEach((card, i) => {
    if (!configs[i]) return;
    const bar = document.createElement('div');
    bar.className = 'stat-progress';
    const fill = document.createElement('div');
    fill.className = `stat-progress-fill ${configs[i].color}`;
    bar.appendChild(fill);
    card.appendChild(bar);
    const pct = configs[i].pct ?? Math.round((configs[i].count / configs[i].max) * 100);
    setTimeout(() => { fill.style.width = `${pct}%`; }, 400);
  });
}

// ─── Inicialização ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initTopbar();
  initClock();
  initGreeting();
  initTopbarDate();
  initLogout();
  animateCounters();
  // Atalho flutuante desativado para evitar a bolinha móvel nas telas.
  initRippleEffects();
  initQuickActions();
  initStatProgressBars();
  carregarDashboardReal();

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
      const res = await fetch(`${this.BASE_URL}${endpoint}`);
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

function normalizarTextoDashboard(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizarStatusHonorario(status) {
  const valor = normalizarTextoDashboard(status).replace(/[_-]+/g, ' ');
  if (valor === 'pago' || valor === 'quitado' || valor === 'em dia') return 'pago';
  if (valor === 'inadimplente' || valor === 'inadimpl' || valor === 'atrasado') return 'inadimplente';
  return 'pendente';
}

function valorHonorarioDashboard(honorario) {
  const valor = honorario?.valorTotal;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  const texto = String(valor ?? '').trim();
  if (!texto) return 0;
  const normalizado = texto.includes(',')
    ? texto.replace(/\./g, '').replace(',', '.')
    : texto;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}

function competenciaAtualDashboard() {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
}

function mesAtualDashboard() {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

function formatarMoedaDashboard(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function setDashboardText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

async function carregarDashboardReal() {

  try {

    const podeAcessarFinanceiro = window.JurisFlowAuth?.podeAcessarFinanceiro?.() === true;

    const [
      clientesRes,
      processosRes,
      compromissosRes,
      honorariosRes
    ] = await Promise.all([

      fetch('http://localhost:8080/clientes'),
      fetch('http://localhost:8080/processos'),
      fetch('http://localhost:8080/compromissos'),
      podeAcessarFinanceiro ? fetch('http://localhost:8080/honorarios') : Promise.resolve(null)

    ]);

    [clientesRes, processosRes, compromissosRes, honorariosRes].filter(Boolean).forEach(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    });

    const clientes = await clientesRes.json();
    const processos = await processosRes.json();
    const compromissos = await compromissosRes.json();
    const honorarios = honorariosRes ? await honorariosRes.json() : [];

    atualizarCardsDashboard({
      clientes,
      processos,
      compromissos,
      honorarios
    });

  } catch (erro) {

    console.error('Erro ao carregar dashboard:', erro);
    atualizarCardsDashboard({
      clientes: [],
      processos: [],
      compromissos: [],
      honorarios: []
    });

  }

}

function atualizarCardsDashboard(dados) {
  const clientes = Array.isArray(dados.clientes) ? dados.clientes : [];
  const processos = Array.isArray(dados.processos) ? dados.processos : [];
  const compromissos = Array.isArray(dados.compromissos) ? dados.compromissos : [];
  const honorarios = Array.isArray(dados.honorarios) ? dados.honorarios : [];
  const competenciaAtual = competenciaAtualDashboard();
  const mesAtual = mesAtualDashboard();

  const clientesAtivos = clientes.filter(c => normalizarTextoDashboard(c.status) === 'ativo');
  const prazos = compromissos.filter(c => normalizarTextoDashboard(c.tipo) === 'prazo');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const emSeteDias = new Date(hoje);
  emSeteDias.setDate(hoje.getDate() + 7);

  const prazosSemana = prazos.filter(c => {
    if (!c.data) return false;
    const data = new Date(`${c.data}T00:00:00`);
    return data >= hoje && data <= emSeteDias;
  });

  const honorariosPagosMes = honorarios.filter(
    h => normalizarStatusHonorario(h.status) === 'pago'
      && String(h.competencia || '').startsWith(competenciaAtual)
  );
  const honorariosPendentes = honorarios.filter(h => normalizarStatusHonorario(h.status) === 'pendente');
  const honorariosInadimplentes = honorarios.filter(h => normalizarStatusHonorario(h.status) === 'inadimplente');
  const recebidoMes = honorariosPagosMes.reduce((soma, h) => soma + valorHonorarioDashboard(h), 0);
  const pendenteTotal = honorariosPendentes.reduce((soma, h) => soma + valorHonorarioDashboard(h), 0);
  const inadimplenteTotal = honorariosInadimplentes.reduce((soma, h) => soma + valorHonorarioDashboard(h), 0);
  const lancadoTotal = honorarios.reduce((soma, h) => soma + valorHonorarioDashboard(h), 0);

  setDashboardText('dashClientes', clientesAtivos.length);
  setDashboardText('dashProcessos', processos.length);
  setDashboardText('dashPrazos', prazosSemana.length);
  setDashboardText('dashHonorarios', formatarMoedaDashboard(recebidoMes));
  setDashboardText('dashClientesFooter', `${clientes.length} cliente(s) cadastrado(s)`);
  setDashboardText('dashProcessosFooter', `${processos.length} processo(s) no backend`);
  setDashboardText('dashPrazosFooter', `${prazosSemana.length} prazo(s) nos próximos 7 dias`);
  setDashboardText('dashHonorariosFooter', `${honorariosPagosMes.length} recebimento(s) em ${mesAtual}`);
  setDashboardText('dashHonorariosLabel', `Recebido em ${mesAtual}`);
  setDashboardText('dashFinanceiroTitulo', `Honorários — ${mesAtual}`);

  const prazosCriticos = [...prazosSemana]
    .sort((a, b) => new Date(`${a.data}T00:00:00`) - new Date(`${b.data}T00:00:00`))
    .slice(0, 5);

  const prazosBox = document.getElementById('dashPrazosCriticos');
  if (prazosBox) {
    prazosBox.innerHTML = prazosCriticos.length
      ? prazosCriticos.map(c => `
        <div class="prazo-item">
          <div class="prazo-date urgent">
            <div class="day">${escapeHtmlDashboard(new Date(`${c.data}T00:00:00`).getDate())}</div>
            <div class="mon">${escapeHtmlDashboard(new Date(`${c.data}T00:00:00`).toLocaleDateString('pt-BR', { month: 'short' }))}</div>
          </div>
          <div class="prazo-info">
            <div class="prazo-title">${escapeHtmlDashboard(c.titulo || 'Prazo sem título')}</div>
            <div class="prazo-client">👤 ${escapeHtmlDashboard(c.cliente?.nome || 'Cliente não informado')}</div>
          </div>
          <span class="prazo-tag urgente">Prazo</span>
        </div>
      `).join('')
      : '<div style="padding:16px;color:#999;">Nenhum prazo cadastrado nos próximos 7 dias</div>';
  }

  const audiencias = compromissos
    .filter(c => normalizarTextoDashboard(c.tipo) === 'audiencia')
    .sort((a, b) => new Date(`${a.data || ''}T00:00:00`) - new Date(`${b.data || ''}T00:00:00`))
    .slice(0, 3);

  const audBox = document.getElementById('dashAudiencias');
  if (audBox) {
    audBox.innerHTML = audiencias.length
      ? audiencias.map(c => `
        <div class="audiencia-item prazo-border">
          <div class="audiencia-time">${escapeHtmlDashboard(c.hora || '--:--')}</div>
          <div class="audiencia-info">
            <div class="audiencia-title">${escapeHtmlDashboard(c.titulo || 'Audiência')}</div>
            <div class="audiencia-local">📍 ${escapeHtmlDashboard(c.descricao || 'Sem descrição')} · ${escapeHtmlDashboard(c.data || '')}</div>
          </div>
        </div>
      `).join('')
      : '<div style="padding:16px;color:#999;">Nenhuma audiência cadastrada</div>';
  }

  const clientesRecentes = [...clientes].slice(-5).reverse();
  const cliBox = document.getElementById('dashClientesRecentes');

  function getIniciaisLocal(nome) {
    const partes = String(nome || '').trim().split(' ').filter(Boolean);
    if (!partes.length) return '?';
    return partes.length === 1
      ? partes[0].substring(0, 2).toUpperCase()
      : (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  if (cliBox) {
    cliBox.innerHTML = clientesRecentes.length
      ? clientesRecentes.map(c => {
        const clienteId = normalizarIdDashboard(c.id);
        const atributoId = clienteId ? ` data-cliente-id="${clienteId}"` : '';
        return `
        <div class="client-row"${atributoId}>
          <div class="client-avatar">${escapeHtmlDashboard(getIniciaisLocal(c.nome))}</div>
          <div class="client-info">
            <div class="client-name">${escapeHtmlDashboard(c.nome || 'Sem nome')}</div>
            <div class="client-meta">${escapeHtmlDashboard(c.email || 'Sem e-mail')}</div>
          </div>
          <span class="client-status status-ativo">${escapeHtmlDashboard(c.status || 'ativo')}</span>
        </div>
      `;
      }).join('')
      : '<div style="padding:16px;color:#999;">Nenhum cliente cadastrado</div>';

    cliBox.querySelectorAll('[data-cliente-id]').forEach(row => {
      row.addEventListener('click', () => {
        const clienteId = normalizarIdDashboard(row.dataset.clienteId);
        if (clienteId) window.location.href = `detalhes-cliente.html?id=${clienteId}`;
      });
    });
  }

  const alertas = [];

  prazosSemana.forEach(c => {
    alertas.push({
      tipo: 'red',
      texto: `Prazo próximo: ${c.titulo || 'sem título'}`,
      tempo: c.data || '',
    });
  });

  honorariosPendentes.forEach(h => {
    alertas.push({
      tipo: 'amber',
      texto: `Honorário pendente — ${formatarMoedaDashboard(valorHonorarioDashboard(h))}`,
      tempo: h.competencia || '',
    });
  });

  const alertasBox = document.getElementById('dashAlertas');
  if (alertasBox) {
    alertasBox.innerHTML = alertas.length
      ? alertas.slice(0, 5).map(a => `
        <div class="alert-item">
          <div class="alert-dot ${a.tipo}"></div>
          <div>
            <div class="alert-text">${escapeHtmlDashboard(a.texto)}</div>
            <div class="alert-time">${escapeHtmlDashboard(a.tempo)}</div>
          </div>
        </div>
      `).join('')
      : '<div style="padding:16px;color:#999;">Nenhum alerta encontrado</div>';
  }

  const financeiroBox = document.getElementById('dashFinanceiro');
  if (financeiroBox) {
    const totalAberto = pendenteTotal + inadimplenteTotal;
    const totalMes = honorarios
      .filter(h => String(h.competencia || '').startsWith(competenciaAtual))
      .reduce((soma, h) => soma + valorHonorarioDashboard(h), 0);
    const percentualCalculado = totalMes ? (recebidoMes / totalMes) * 100 : 0;
    const percentualRecebido = Number.isFinite(percentualCalculado)
      ? Math.max(0, Math.min(percentualCalculado, 100))
      : 0;

    financeiroBox.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px;">
        <div style="background:var(--gray-50);border-radius:var(--radius-sm);padding:12px;">
          <div style="font-size:.7rem;color:var(--gray-400);margin-bottom:4px;">Recebido no mês</div>
          <div style="font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;color:var(--green);">
            ${escapeHtmlDashboard(formatarMoedaDashboard(recebidoMes))}
          </div>
        </div>

        <div style="background:var(--gray-50);border-radius:var(--radius-sm);padding:12px;">
          <div style="font-size:.7rem;color:var(--gray-400);margin-bottom:4px;">A receber/inadimplente</div>
          <div style="font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;color:var(--amber);">
            ${escapeHtmlDashboard(formatarMoedaDashboard(totalAberto))}
          </div>
        </div>
      </div>

      <div style="margin-top:16px;">
        <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--gray-400);margin-bottom:6px;">
          <span>Recebido sobre o lançado no mês</span>
          <span style="color:var(--navy);font-weight:600;">${escapeHtmlDashboard(percentualRecebido.toFixed(0))}%</span>
        </div>
        <div style="height:6px;background:var(--gray-100);border-radius:3px;overflow:hidden;">
          <div style="
            height:100%;
            width:${percentualRecebido}%;
            background:linear-gradient(90deg,var(--gold),var(--gold-light));
            border-radius:3px;
          "></div>
        </div>
        <div style="margin-top:8px;font-size:.72rem;color:var(--gray-400);">
          Total lançado: ${escapeHtmlDashboard(formatarMoedaDashboard(lancadoTotal))}
        </div>
      </div>
    `;
  }
}
// Exporta para uso em outros módulos
// Exporta sem sobrescrever o .db do storage.js
window.JurisFlow = Object.assign(window.JurisFlow || {}, {
  AppState, API, showToast, navigateTo
});
