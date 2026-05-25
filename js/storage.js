/**
 * JurisFlow — Camada de dados (localStorage)
 */
(function () {
  'use strict';

  const KEY = { c: 'jf_clientes', p: 'jf_processos', h: 'jf_honorarios' };

  const SEED_C = [
    { id:'sc1',  nome:'Maria Aparecida Souza', cpfCnpj:'111.222.333-44',      telefone1:'(11) 93333-2222', email:'maria@email.com',     areaJuridica:'Cível',      tipoCliente:'Pessoa Física',   status:'ativo',    cidade:'São Paulo',    estado:'SP', dataCadastro:'2024-03-05T14:00:00.000Z' },
    { id:'sc2',  nome:'Construtora Beta Ltda',  cpfCnpj:'98.765.432/0001-11',  telefone1:'(11) 2222-3333', email:'beta@construcao.com', areaJuridica:'Empresarial', tipoCliente:'Pessoa Jurídica', status:'ativo',    cidade:'São Paulo',    estado:'SP', dataCadastro:'2024-04-15T13:00:00.000Z' },
    { id:'sc3',  nome:'João Paulo Ferreira',    cpfCnpj:'444.555.666-77',      telefone1:'(11) 94444-5555', email:'joao@email.com',      areaJuridica:'Trabalhista', tipoCliente:'Pessoa Física',   status:'ativo',    cidade:'São Paulo',    estado:'SP', dataCadastro:'2024-03-20T11:00:00.000Z' },
    { id:'sc4',  nome:'Tecno Solutions S/A',    cpfCnpj:'12.345.678/0001-99',  telefone1:'(11) 3333-4444', email:'contato@tecno.com',   areaJuridica:'Empresarial', tipoCliente:'Pessoa Jurídica', status:'ativo',    cidade:'São Paulo',    estado:'SP', dataCadastro:'2024-04-01T08:00:00.000Z' },
    { id:'sc5',  nome:'Roberto Alves Costa',    cpfCnpj:'777.888.999-00',      telefone1:'(11) 97777-8888', email:'ralves@email.com',    areaJuridica:'Criminal',    tipoCliente:'Pessoa Física',   status:'ativo',    cidade:'São Paulo',    estado:'SP', dataCadastro:'2024-04-28T16:00:00.000Z' },
    { id:'sc6',  nome:'Ana Lima Rodrigues',     cpfCnpj:'222.333.444-55',      telefone1:'(11) 91111-2222', email:'analima@email.com',   areaJuridica:'Família',     tipoCliente:'Pessoa Física',   status:'ativo',    cidade:'Rio de Janeiro',estado:'RJ', dataCadastro:'2024-02-14T10:00:00.000Z' },
    { id:'sc7',  nome:'Holding Nobre Ltda',     cpfCnpj:'45.678.901/0001-22',  telefone1:'(11) 5555-6666', email:'nobre@holding.com',   areaJuridica:'Empresarial', tipoCliente:'Pessoa Jurídica', status:'ativo',    cidade:'São Paulo',    estado:'SP', dataCadastro:'2024-01-10T09:00:00.000Z' },
    { id:'sc8',  nome:'Carlos Eduardo Pinto',   cpfCnpj:'333.444.555-66',      telefone1:'(11) 93333-4444', email:'cpinto@email.com',    areaJuridica:'Cível',       tipoCliente:'Pessoa Física',   status:'pendente', cidade:'São Paulo',    estado:'SP', dataCadastro:'2024-05-10T10:00:00.000Z' },
    { id:'sc9',  nome:'Fernanda Melo Braga',    cpfCnpj:'555.666.777-88',      telefone1:'(11) 95555-6666', email:'fmelo@email.com',     areaJuridica:'Trabalhista', tipoCliente:'Pessoa Física',   status:'inativo',  cidade:'Campinas',     estado:'SP', dataCadastro:'2024-01-20T11:00:00.000Z' },
    { id:'sc10', nome:'Grupo Águia S/A',        cpfCnpj:'67.890.123/0001-44',  telefone1:'(11) 7777-8888', email:'aguia@grupo.com',     areaJuridica:'Empresarial', tipoCliente:'Pessoa Jurídica', status:'ativo',    cidade:'São Paulo',    estado:'SP', dataCadastro:'2024-03-01T08:00:00.000Z' },
  ];

  const SEED_P = [
    { id:'sp1',  numero:'0012345-88.2024.8.26.0100', clienteId:'sc1',  clienteNome:'Maria Aparecida Souza', areaJuridica:'Cível',      tipoAcao:'Contestação — Ação de Cobrança',        status:'urgente',   prioridade:'alta',  tribunal:'TJSP', comarca:'São Paulo', vara:'3ª Vara Cível',            dataAbertura:'2024-01-20', prazoFinal:'2024-05-20', dataAudiencia:'2024-05-20', valorCausa:'45.000,00', honorarios:'4.500,00',  statusFinanceiro:'Pendente',          andamento:65,  observacoes:'', dataCadastro:'2024-01-20T10:00:00.000Z' },
    { id:'sp2',  numero:'0045678-22.2023.5.02.0001', clienteId:'sc2',  clienteNome:'Construtora Beta Ltda',  areaJuridica:'Empresarial', tipoAcao:'Recurso de Apelação',                   status:'urgente',   prioridade:'alta',  tribunal:'TJSP', comarca:'São Paulo', vara:'1ª Câmara Empresarial',    dataAbertura:'2023-08-10', prazoFinal:'2024-05-20', dataAudiencia:'',           valorCausa:'120.000,00',honorarios:'12.000,00', statusFinanceiro:'Parcialmente pago', andamento:80,  observacoes:'', dataCadastro:'2023-08-10T11:00:00.000Z' },
    { id:'sp3',  numero:'0078901-55.2024.5.15.0005', clienteId:'sc3',  clienteNome:'João Paulo Ferreira',    areaJuridica:'Trabalhista', tipoAcao:'Petição Inicial — Ação Trabalhista',    status:'andamento', prioridade:'media', tribunal:'TRT',  comarca:'São Paulo', vara:'2ª Vara do Trabalho',      dataAbertura:'2024-03-01', prazoFinal:'2024-05-22', dataAudiencia:'2024-05-22', valorCausa:'35.000,00', honorarios:'3.500,00',  statusFinanceiro:'Pendente',          andamento:20,  observacoes:'', dataCadastro:'2024-03-01T09:00:00.000Z' },
    { id:'sp4',  numero:'0098761-22.2024.8.26.0300', clienteId:'sc4',  clienteNome:'Tecno Solutions S/A',    areaJuridica:'Empresarial', tipoAcao:'Manifestação — Fase de Liquidação',    status:'andamento', prioridade:'media', tribunal:'TJSP', comarca:'São Paulo', vara:'1ª Vara Empresarial',      dataAbertura:'2024-02-15', prazoFinal:'2024-05-23', dataAudiencia:'',           valorCausa:'200.000,00',honorarios:'20.000,00', statusFinanceiro:'Parcialmente pago', andamento:50,  observacoes:'', dataCadastro:'2024-02-15T11:00:00.000Z' },
    { id:'sp5',  numero:'0056789-11.2023.8.26.0200', clienteId:'sc5',  clienteNome:'Roberto Alves Costa',    areaJuridica:'Criminal',    tipoAcao:'Alegações Finais — Processo Criminal',  status:'andamento', prioridade:'alta',  tribunal:'TJSP', comarca:'São Paulo', vara:'1ª Vara Criminal',         dataAbertura:'2023-10-05', prazoFinal:'2024-05-26', dataAudiencia:'',           valorCausa:'0,00',      honorarios:'8.000,00',  statusFinanceiro:'Em dia',            andamento:90,  observacoes:'', dataCadastro:'2023-10-05T14:00:00.000Z' },
    { id:'sp6',  numero:'0034512-44.2024.8.26.0050', clienteId:'sc6',  clienteNome:'Ana Lima Rodrigues',     areaJuridica:'Cível',       tipoAcao:'Ação de Divórcio Litigioso',            status:'andamento', prioridade:'baixa', tribunal:'TJSP', comarca:'São Paulo', vara:'2ª Vara de Família',       dataAbertura:'2024-02-01', prazoFinal:'2024-06-01', dataAudiencia:'2024-06-01', valorCausa:'0,00',      honorarios:'6.000,00',  statusFinanceiro:'Pendente',          andamento:35,  observacoes:'', dataCadastro:'2024-02-01T09:00:00.000Z' },
    { id:'sp7',  numero:'0067890-33.2024.5.02.0010', clienteId:'sc7',  clienteNome:'Holding Nobre Ltda',     areaJuridica:'Trabalhista', tipoAcao:'Reclamação Trabalhista — Horas Extras', status:'suspenso',  prioridade:'baixa', tribunal:'TRT',  comarca:'São Paulo', vara:'3ª Vara do Trabalho',      dataAbertura:'2024-01-15', prazoFinal:'2024-06-10', dataAudiencia:'',           valorCausa:'25.000,00', honorarios:'2.500,00',  statusFinanceiro:'Em dia',            andamento:15,  observacoes:'', dataCadastro:'2024-01-15T08:00:00.000Z' },
    { id:'sp8',  numero:'0011223-77.2024.8.26.0400', clienteId:'sc8',  clienteNome:'Carlos Eduardo Pinto',   areaJuridica:'Cível',       tipoAcao:'Execução Fiscal — IPTU',                status:'andamento', prioridade:'media', tribunal:'TJSP', comarca:'São Paulo', vara:'1ª Vara de Exec. Fiscais', dataAbertura:'2024-03-10', prazoFinal:'2024-06-15', dataAudiencia:'',           valorCausa:'15.000,00', honorarios:'1.500,00',  statusFinanceiro:'Pendente',          andamento:45,  observacoes:'', dataCadastro:'2024-03-10T10:00:00.000Z' },
    { id:'sp9',  numero:'0099887-66.2023.8.26.0500', clienteId:'sc10', clienteNome:'Grupo Águia S/A',        areaJuridica:'Empresarial', tipoAcao:'Ação Revisional de Contrato',           status:'andamento', prioridade:'media', tribunal:'TJSP', comarca:'São Paulo', vara:'2ª Vara Empresarial',      dataAbertura:'2023-07-20', prazoFinal:'2024-06-20', dataAudiencia:'2024-06-20', valorCausa:'80.000,00', honorarios:'8.000,00',  statusFinanceiro:'Pendente',          andamento:70,  observacoes:'', dataCadastro:'2023-07-20T10:00:00.000Z' },
    { id:'sp10', numero:'0055443-11.2022.8.26.0100', clienteId:'sc9',  clienteNome:'Fernanda Melo Braga',    areaJuridica:'Cível',       tipoAcao:'Indenização por Dano Moral',            status:'concluido', prioridade:'baixa', tribunal:'TJSP', comarca:'São Paulo', vara:'5ª Vara Cível',            dataAbertura:'2022-05-15', prazoFinal:'',           dataAudiencia:'',           valorCausa:'30.000,00', honorarios:'3.000,00',  statusFinanceiro:'Em dia',            andamento:100, observacoes:'', dataCadastro:'2022-05-15T10:00:00.000Z' },
  ];

  const SEED_H = [
    { id:'sh1', clienteId:'sc1',  clienteNome:'Maria Aparecida Souza', processoId:'sp1',  processoNumero:'0012345-88', tipoHonorario:'fixo',     competencia:'2024-05', valorBruto:'5000',  desconto:'0',   acrescimos:'0', valorTotal:'5000',  meioPagamento:'ted',      parcelas:1, vencimento:'2024-05-31', status:'pendente', observacoes:'', dataCadastro:'2024-05-01T10:00:00.000Z' },
    { id:'sh2', clienteId:'sc2',  clienteNome:'Construtora Beta Ltda',  processoId:'sp2',  processoNumero:'0045678-22', tipoHonorario:'retainer', competencia:'2024-05', valorBruto:'8500',  desconto:'0',   acrescimos:'0', valorTotal:'8500',  meioPagamento:'pix',      parcelas:1, vencimento:'2024-05-18', status:'pago',     observacoes:'', dataCadastro:'2024-05-16T09:00:00.000Z' },
    { id:'sh3', clienteId:'sc3',  clienteNome:'João Paulo Ferreira',    processoId:'sp3',  processoNumero:'0078901-55', tipoHonorario:'fixo',     competencia:'2024-04', valorBruto:'3200',  desconto:'0',   acrescimos:'0', valorTotal:'3200',  meioPagamento:'boleto',   parcelas:1, vencimento:'2024-04-30', status:'inadimpl', observacoes:'', dataCadastro:'2024-04-01T10:00:00.000Z' },
    { id:'sh4', clienteId:'sc4',  clienteNome:'Tecno Solutions S/A',    processoId:'sp4',  processoNumero:'0098761-22', tipoHonorario:'exito',    competencia:'2024-05', valorBruto:'4500',  desconto:'0',   acrescimos:'0', valorTotal:'4500',  meioPagamento:'boleto',   parcelas:1, vencimento:'2024-05-25', status:'pendente', observacoes:'', dataCadastro:'2024-05-02T10:00:00.000Z' },
    { id:'sh5', clienteId:'sc5',  clienteNome:'Roberto Alves Costa',    processoId:'sp5',  processoNumero:'0056789-11', tipoHonorario:'exito',    competencia:'2024-04', valorBruto:'8000',  desconto:'500', acrescimos:'0', valorTotal:'7500',  meioPagamento:'pix',      parcelas:1, vencimento:'2024-04-20', status:'pago',     observacoes:'', dataCadastro:'2024-04-15T10:00:00.000Z' },
    { id:'sh6', clienteId:'sc7',  clienteNome:'Holding Nobre Ltda',     processoId:'sp7',  processoNumero:'0067890-33', tipoHonorario:'retainer', competencia:'2024-05', valorBruto:'12000', desconto:'0',   acrescimos:'0', valorTotal:'12000', meioPagamento:'ted',      parcelas:1, vencimento:'2024-05-15', status:'pago',     observacoes:'', dataCadastro:'2024-05-13T10:00:00.000Z' },
    { id:'sh7', clienteId:'sc8',  clienteNome:'Carlos Eduardo Pinto',   processoId:'sp8',  processoNumero:'0011223-77', tipoHonorario:'consulta', competencia:'2024-05', valorBruto:'1600',  desconto:'0',   acrescimos:'0', valorTotal:'1600',  meioPagamento:'dinheiro', parcelas:1, vencimento:'2024-05-20', status:'inadimpl', observacoes:'', dataCadastro:'2024-05-05T10:00:00.000Z' },
  ];

  function seed() {
    if (!localStorage.getItem(KEY.c)) localStorage.setItem(KEY.c, JSON.stringify(SEED_C));
    if (!localStorage.getItem(KEY.p)) localStorage.setItem(KEY.p, JSON.stringify(SEED_P));
    if (!localStorage.getItem(KEY.h)) localStorage.setItem(KEY.h, JSON.stringify(SEED_H));
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

  seed();
})();
