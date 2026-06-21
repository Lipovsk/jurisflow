/**
 * JurisFlow — Camada de dados (localStorage)
 */
(function () {
  'use strict';

  const KEY = { c: 'jf_clientes', p: 'jf_processos', h: 'jf_honorarios' };

  const SEED_C = [];

  const SEED_P = [];

  const SEED_H = [];

  function seed() {
    // Intencionalmente vazio: não inicializar localStorage com dados fictícios.
  }

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function getAll(k) { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } }
  function saveAll(k, arr) { localStorage.setItem(k, JSON.stringify(arr)); }
  function getById(k, id) { return getAll(k).find(x => x.id === id) || null; }
  function upsert(k, item) {
    const arr = getAll(k);
    const i = arr.findIndex(x => x.id === item.id);
    if (i >= 0) arr[i] = item; else arr.unshift(item);
    saveAll(k, arr);
    return item;
  }
  function remove(k, id) { saveAll(k, getAll(k).filter(x => x.id !== id)); }

  window.JurisFlow = window.JurisFlow || {};
  window.JurisFlow.db = {
    getClientes:    ()    => getAll(KEY.c),
    getCliente:     (id)  => getById(KEY.c, id),
    saveCliente:    (d)   => { if (!d.id) d.id = uid(); return upsert(KEY.c, d); },
    deleteCliente:  (id)  => remove(KEY.c, id),

    getProcessos:   ()    => getAll(KEY.p),
    getProcesso:    (id)  => getById(KEY.p, id),
    saveProcesso:   (d)   => { if (!d.id) d.id = uid(); return upsert(KEY.p, d); },
    deleteProcesso: (id)  => remove(KEY.p, id),

    getHonorarios:   ()    => getAll(KEY.h),
    getHonorario:    (id)  => getById(KEY.h, id),
    saveHonorario:   (d)   => { if (!d.id) d.id = uid(); return upsert(KEY.h, d); },
    deleteHonorario: (id)  => remove(KEY.h, id),

    getProcessosByCliente:   (cId) => getAll(KEY.p).filter(p => p.clienteId === cId),
    getHonorariosByCliente:  (cId) => getAll(KEY.h).filter(h => h.clienteId === cId),
    getHonorariosByProcesso: (pId) => getAll(KEY.h).filter(h => h.processoId === pId),
  };

  // Não semear dados automaticamente. localStorage ficará vazio até operações do usuário/backend.
})();
