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

  const name = AppState.user?.name || '';
  el.textContent = name ? `${greeting}, ${name} 👋` : `${greeting} 👋`;
}

// ─── Confirmação de logout ────────────────────────────────────────────────────
function initLogout() {
  $$('[data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Deseja sair do JurisFlow?')) {
        window.location.href = 'index.html';
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

// ─── Global Search ────────────────────────────────────────────────────────────
const SEARCH_DATA = [];

function initGlobalSearch() {
  const input = $('#searchGlobalInput');
  const dropdown = $('#searchDropdown');
  const overlay = $('#searchOverlay');
  if (!input) return;

  function highlight(text, query) {
    if (!query) return text;
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark>$1</mark>');
  }

  function renderResults(query) {
    if (!query.trim()) {
      closeSearch();
      return;
    }
    const q = query.toLowerCase();
    const matches = SEARCH_DATA.filter(d =>
      d.name.toLowerCase().includes(q) || d.sub.toLowerCase().includes(q)
    ).slice(0, 7);

    if (!matches.length) {
      dropdown.innerHTML = `<div class="sd-footer">Nenhum resultado para "<strong>${query}</strong>"</div>`;
      openSearch();
      return;
    }

    const groups = { cliente: [], processo: [], pagina: [] };
    matches.forEach(m => groups[m.type]?.push(m));
    const labels = { cliente: 'Clientes', processo: 'Processos', pagina: 'Páginas' };
    const typeLabel = { cliente: 'Cliente', processo: 'Processo', pagina: 'Página' };

    let html = '';
    ['cliente', 'processo', 'pagina'].forEach(type => {
      if (!groups[type].length) return;
      html += `<div class="sd-section-label">${labels[type]}</div>`;
      groups[type].forEach(item => {
        html += `
          <div class="sd-item" data-page="${item.page || type + 's'}">
            <div class="sd-item-icon ${type}">${item.icon}</div>
            <div class="sd-item-info">
              <div class="sd-item-name">${highlight(item.name, query)}</div>
              <div class="sd-item-sub">${item.sub}</div>
            </div>
            <span class="sd-item-type ${type}">${typeLabel[type]}</span>
          </div>`;
      });
    });
    html += `<div class="sd-footer"><span>${matches.length} resultado(s)</span><span><kbd>↵</kbd> para abrir</span></div>`;
    dropdown.innerHTML = html;

    $$('.sd-item', dropdown).forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        if (page && navigateTo) navigateTo(page);
        closeSearch();
      });
    });
    openSearch();
  }

  function openSearch() {
    dropdown.classList.add('active');
    overlay.classList.add('active');
  }
  function closeSearch() {
    dropdown.classList.remove('active');
    overlay.classList.remove('active');
  }

  input.addEventListener('input', e => renderResults(e.target.value));
  overlay.addEventListener('click', () => { closeSearch(); input.value = ''; });

  // Focus on Ctrl+K
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
    if (e.key === 'Escape') {
      closeSearch();
      input.value = '';
      input.blur();
    }
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
  ];

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
  $('#btnNovoClienteTopbar')?.addEventListener('click', () => navigateTo('novo-cliente'));
  $('#btnNovoProcessoTopbar')?.addEventListener('click', () => navigateTo('novo-processo'));
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
  initGlobalSearch();
  initFAB();
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
async function carregarDashboardReal() {

  try {

    const [
      clientesRes,
      processosRes,
      compromissosRes,
      honorariosRes
    ] = await Promise.all([

      fetch('http://localhost:8080/clientes'),
      fetch('http://localhost:8080/processos'),
      fetch('http://localhost:8080/compromissos'),
      fetch('http://localhost:8080/honorarios')

    ]);

    const clientes = await clientesRes.json();
    const processos = await processosRes.json();
    const compromissos = await compromissosRes.json();
    const honorarios = await honorariosRes.json();

    atualizarCardsDashboard({
      clientes,
      processos,
      compromissos,
      honorarios
    });

  } catch (erro) {

    console.error('Erro ao carregar dashboard:', erro);

  }

}

function atualizarCardsDashboard(dados) {

  const totalClientes = dados.clientes.length;

  const totalProcessos = dados.processos.length;

  const totalPrazos = dados.compromissos.filter(c =>
    c.tipo === 'prazo'
  ).length;

  const totalHonorarios = dados.honorarios.reduce(
    (soma, h) => soma + (h.valorTotal || 0),
    0
  );

  const cards = document.querySelectorAll('[data-count]');

  document.getElementById('dashClientes').textContent = totalClientes;
document.getElementById('dashProcessos').textContent = totalProcessos;
document.getElementById('dashPrazos').textContent = totalPrazos;

  document.getElementById('dashHonorarios').textContent =
  totalHonorarios.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  // ===== PRAZOS CRÍTICOS =====
  const prazosCriticos = dados.compromissos
    .filter(c => c.tipo === 'prazo')
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 5);

  const prazosBox = document.getElementById('dashPrazosCriticos');

  if (prazosBox) {
    prazosBox.innerHTML = prazosCriticos.length
      ? prazosCriticos.map(c => `
        <div class="prazo-item">
          <div class="prazo-date urgent">
            <div class="day">${new Date(c.data + 'T00:00:00').getDate()}</div>
            <div class="mon">${new Date(c.data + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</div>
          </div>
          <div class="prazo-info">
            <div class="prazo-title">${c.titulo || 'Prazo sem título'}</div>
            <div class="prazo-client">👤 ${c.cliente?.nome || 'Cliente não informado'}</div>
          </div>
          <span class="prazo-tag urgente">Prazo</span>
        </div>
      `).join('')
      : '<div style="padding:16px;color:#999;">Nenhum prazo cadastrado</div>';
  }

  // ===== AUDIÊNCIAS =====
  const audiencias = dados.compromissos
    .filter(c => c.tipo === 'audiencia')
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 3);

  const audBox = document.getElementById('dashAudiencias');

  if (audBox) {
    audBox.innerHTML = audiencias.length
      ? audiencias.map(c => `
        <div class="audiencia-item prazo-border">
          <div class="audiencia-time">${c.hora || '--:--'}</div>
          <div class="audiencia-info">
            <div class="audiencia-title">${c.titulo || 'Audiência'}</div>
            <div class="audiencia-local">📍 ${c.descricao || 'Sem descrição'} · ${c.data || ''}</div>
          </div>
        </div>
      `).join('')
      : '<div style="padding:16px;color:#999;">Nenhuma audiência cadastrada</div>';
  }

  // ===== CLIENTES RECENTES =====
  const clientesRecentes = [...dados.clientes]
    .slice(-5)
    .reverse();

  const cliBox = document.getElementById('dashClientesRecentes');

  function getIniciaisLocal(nome) {
    if (!nome) return '?';
    const p = String(nome).trim().split(' ').filter(Boolean);
    if (!p.length) return '?';
    return p.length === 1
      ? p[0].substring(0, 2).toUpperCase()
      : (p[0][0] + p[1][0]).toUpperCase();
  }

  if (cliBox) {
    cliBox.innerHTML = clientesRecentes.length
      ? clientesRecentes.map(c => `
        <div class="client-row" onclick="location.href='detalhes-cliente.html?id=${c.id}'">
          <div class="client-avatar">${getIniciaisLocal(c.nome)}</div>
          <div class="client-info">
            <div class="client-name">${c.nome || 'Sem nome'}</div>
            <div class="client-meta">${c.email || 'Sem e-mail'}</div>
          </div>
          <span class="client-status status-ativo">${c.status || 'ativo'}</span>
        </div>
      `).join('')
      : '<div style="padding:16px;color:#999;">Nenhum cliente cadastrado</div>';
  }

  // ===== ALERTAS =====
  const alertasBox = document.getElementById('dashAlertas');

  const alertas = [];

  // prazos urgentes
  dados.compromissos.forEach(c => {
    if (c.tipo === 'prazo') {
      alertas.push({
        tipo: 'red',
        texto: `Prazo próximo: ${c.titulo}`,
        tempo: c.data,
      });
    }
  });

  // honorários pendentes
  dados.honorarios.forEach(h => {
    if (h.status === 'pendente') {
      alertas.push({
        tipo: 'amber',
        texto: `Honorário pendente — R$ ${Number(h.valorTotal || 0).toLocaleString('pt-BR')}`,
        tempo: h.competencia || '',
      });
    }
  });

  if (alertasBox) {
    alertasBox.innerHTML = alertas.length
      ? alertas.slice(0, 5).map(a => `
        <div class="alert-item">
          <div class="alert-dot ${a.tipo}"></div>
          <div>
            <div class="alert-text">${a.texto}</div>
            <div class="alert-time">${a.tempo}</div>
          </div>
        </div>
      `).join('')
      : '<div style="padding:16px;color:#999;">Nenhum alerta encontrado</div>';
  }

  // ===== FINANCEIRO =====
  const financeiroBox = document.getElementById('dashFinanceiro');

  const recebidos = dados.honorarios
    .filter(h => h.status === 'pago')
    .reduce((s, h) => s + (h.valorTotal || 0), 0);

  const pendentes = dados.honorarios
    .filter(h => h.status === 'pendente')
    .reduce((s, h) => s + (h.valorTotal || 0), 0);

  const total = recebidos + pendentes;

  const meta = 50000;

  const percentual = Math.min((total / meta) * 100, 100);

  if (financeiroBox) {
    financeiroBox.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px;">
        <div style="background:var(--gray-50);border-radius:var(--radius-sm);padding:12px;">
          <div style="font-size:.7rem;color:var(--gray-400);margin-bottom:4px;">Recebido</div>
          <div style="font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;color:var(--green);">
            ${recebidos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>

        <div style="background:var(--gray-50);border-radius:var(--radius-sm);padding:12px;">
          <div style="font-size:.7rem;color:var(--gray-400);margin-bottom:4px;">A receber</div>
          <div style="font-family:'Playfair Display',serif;font-size:1.05rem;font-weight:700;color:var(--amber);">
            ${pendentes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
      </div>

      <div style="margin-top:16px;">
        <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--gray-400);margin-bottom:6px;">
          <span>Meta mensal</span>
          <span style="color:var(--navy);font-weight:600;">${percentual.toFixed(0)}%</span>
        </div>
        <div style="height:6px;background:var(--gray-100);border-radius:3px;overflow:hidden;">
          <div style="
            height:100%;
            width:${percentual}%;
            background:linear-gradient(90deg,var(--gold),var(--gold-light));
            border-radius:3px;
          "></div>
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