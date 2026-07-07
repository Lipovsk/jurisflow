package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.Cliente;
import com.jurisflow.jurisflow.model.Compromisso;
import com.jurisflow.jurisflow.model.Honorario;
import com.jurisflow.jurisflow.model.Processo;
import com.jurisflow.jurisflow.repository.ClienteRepository;
import com.jurisflow.jurisflow.repository.CompromissoRepository;
import com.jurisflow.jurisflow.repository.HonorarioRepository;
import com.jurisflow.jurisflow.repository.ProcessoRepository;
import com.jurisflow.jurisflow.service.ProcessoSincronizacaoService;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/processos")
public class ProcessoController {

    private static final String PROCESSO_COM_VINCULOS_MANUAIS =
            "Nao e possivel excluir este processo porque existem compromissos ou honorarios manuais ou legados vinculados a ele. Remova ou trate esses registros antes de excluir o processo.";

    private final ProcessoRepository processoRepository;
    private final ClienteRepository clienteRepository;
    private final CompromissoRepository compromissoRepository;
    private final HonorarioRepository honorarioRepository;
    private final ProcessoSincronizacaoService processoSincronizacaoService;

    public ProcessoController(
            ProcessoRepository processoRepository,
            ClienteRepository clienteRepository,
            CompromissoRepository compromissoRepository,
            HonorarioRepository honorarioRepository,
            ProcessoSincronizacaoService processoSincronizacaoService
    ) {
        this.processoRepository = processoRepository;
        this.clienteRepository = clienteRepository;
        this.compromissoRepository = compromissoRepository;
        this.honorarioRepository = honorarioRepository;
        this.processoSincronizacaoService = processoSincronizacaoService;
    }

    @GetMapping
    public List<Processo> listar() {
        return processoRepository.findAll();
    }

    @GetMapping("/{id}")
    public Processo buscarPorId(@PathVariable Long id) {
        return processoRepository.findById(id).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Processo nao encontrado."
        ));
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Processo> listarPorCliente(@PathVariable Long clienteId) {
        return processoRepository.findByClienteId(clienteId);
    }

    @PostMapping
    @Transactional
    public Processo criar(@RequestBody ProcessoRequest request) {
        Cliente cliente = buscarClienteObrigatorio(request.getClienteId());

        Processo processo = new Processo();

        preencherProcesso(processo, request);
        processo.setCliente(cliente);

        Processo processoSalvo = processoRepository.save(processo);
        processoSincronizacaoService.sincronizar(processoSalvo);

        return processoSalvo;
    }

    @PutMapping("/{id}")
    @Transactional
    public Processo atualizar(@PathVariable Long id, @RequestBody ProcessoRequest request) {
        return processoRepository.findById(id).map(processo -> {

            if (request.getClienteId() != null) {
                Cliente cliente = buscarClienteExistente(request.getClienteId());
                processo.setCliente(cliente);
            }

            preencherProcesso(processo, request);

            Processo processoSalvo = processoRepository.save(processo);
            processoSincronizacaoService.sincronizar(processoSalvo);

            return processoSalvo;

        }).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Processo nao encontrado."
        ));
    }

    private void preencherProcesso(Processo processo, ProcessoRequest request) {
        processo.setNumero(request.getNumero());
        processo.setTipoAcao(request.getTipoAcao());
        processo.setAreaJuridica(request.getAreaJuridica());
        processo.setStatus(request.getStatus());
        processo.setDescricao(request.getDescricao());

        processo.setDataAbertura(request.getDataAbertura());
        processo.setDataAudiencia(request.getDataAudiencia());
        processo.setPrazoFinal(request.getPrazoFinal());

        processo.setTribunal(request.getTribunal());
        processo.setComarca(request.getComarca());
        processo.setVara(request.getVara());
        processo.setJuiz(request.getJuiz());
        processo.setPrioridade(request.getPrioridade());
        processo.setValorCausa(request.getValorCausa());
        processo.setStatusFinanceiro(request.getStatusFinanceiro());
        processo.setUltMovimentacao(request.getUltMovimentacao());

        processo.setValorHonorario(request.getValorHonorario());
        processo.setFormaPagamento(request.getFormaPagamento());
        processo.setParcelasHonorario(request.getParcelasHonorario());
        processo.setVencimentoHonorario(request.getVencimentoHonorario());
    }

    private Cliente buscarClienteObrigatorio(Long clienteId) {
        if (clienteId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "clienteId e obrigatorio para cadastrar processo."
            );
        }

        return buscarClienteExistente(clienteId);
    }

    private Cliente buscarClienteExistente(Long clienteId) {
        return clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "clienteId nao corresponde a cliente existente."
                ));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void deletar(@PathVariable Long id) {
        Processo processo = processoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Processo nao encontrado."
                ));

        List<Compromisso> compromissos = compromissoRepository.findByProcessoId(id);
        List<Honorario> honorarios = honorarioRepository.findByProcessoId(id);

        boolean possuiVinculoNaoAutomatico = compromissos.stream()
                .anyMatch(compromisso -> !processoSincronizacaoService
                        .isCompromissoAutomaticoSeguroDoProcesso(processo, compromisso))
                || honorarios.stream()
                .anyMatch(honorario -> !processoSincronizacaoService
                        .isHonorarioAutomaticoSeguroDoProcesso(processo, honorario));

        if (possuiVinculoNaoAutomatico) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    PROCESSO_COM_VINCULOS_MANUAIS
            );
        }

        processoSincronizacaoService.removerRegistrosAutomaticosDoProcesso(processo);
        processoRepository.delete(processo);
    }

    public static class ProcessoRequest {
        private String numero;
        private String tipoAcao;
        private String areaJuridica;
        private String status;
        private String descricao;

        private String dataAbertura;
        private String dataAudiencia;
        private String prazoFinal;

        private String tribunal;
        private String comarca;
        private String vara;
        private String juiz;
        private String prioridade;
        private Double valorCausa;
        private String statusFinanceiro;
        private String ultMovimentacao;

        private Long clienteId;

        private Double valorHonorario;
        private String formaPagamento;
        private Integer parcelasHonorario;
        private String vencimentoHonorario;

        public String getNumero() {
            return numero;
        }

        public void setNumero(String numero) {
            this.numero = numero;
        }

        public String getTipoAcao() {
            return tipoAcao;
        }

        public void setTipoAcao(String tipoAcao) {
            this.tipoAcao = tipoAcao;
        }

        public String getAreaJuridica() {
            return areaJuridica;
        }

        public void setAreaJuridica(String areaJuridica) {
            this.areaJuridica = areaJuridica;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getDescricao() {
            return descricao;
        }

        public void setDescricao(String descricao) {
            this.descricao = descricao;
        }

        public String getDataAbertura() {
            return dataAbertura;
        }

        public void setDataAbertura(String dataAbertura) {
            this.dataAbertura = dataAbertura;
        }

        public String getDataAudiencia() {
            return dataAudiencia;
        }

        public void setDataAudiencia(String dataAudiencia) {
            this.dataAudiencia = dataAudiencia;
        }

        public String getPrazoFinal() {
            return prazoFinal;
        }

        public void setPrazoFinal(String prazoFinal) {
            this.prazoFinal = prazoFinal;
        }

        public String getTribunal() {
            return tribunal;
        }

        public void setTribunal(String tribunal) {
            this.tribunal = tribunal;
        }

        public String getComarca() {
            return comarca;
        }

        public void setComarca(String comarca) {
            this.comarca = comarca;
        }

        public String getVara() {
            return vara;
        }

        public void setVara(String vara) {
            this.vara = vara;
        }

        public String getJuiz() {
            return juiz;
        }

        public void setJuiz(String juiz) {
            this.juiz = juiz;
        }

        public String getPrioridade() {
            return prioridade;
        }

        public void setPrioridade(String prioridade) {
            this.prioridade = prioridade;
        }

        public Double getValorCausa() {
            return valorCausa;
        }

        public void setValorCausa(Double valorCausa) {
            this.valorCausa = valorCausa;
        }

        public String getStatusFinanceiro() {
            return statusFinanceiro;
        }

        public void setStatusFinanceiro(String statusFinanceiro) {
            this.statusFinanceiro = statusFinanceiro;
        }

        public String getUltMovimentacao() {
            return ultMovimentacao;
        }

        public void setUltMovimentacao(String ultMovimentacao) {
            this.ultMovimentacao = ultMovimentacao;
        }

        public Long getClienteId() {
            return clienteId;
        }

        public void setClienteId(Long clienteId) {
            this.clienteId = clienteId;
        }

        public Double getValorHonorario() {
            return valorHonorario;
        }

        public void setValorHonorario(Double valorHonorario) {
            this.valorHonorario = valorHonorario;
        }

        public String getFormaPagamento() {
            return formaPagamento;
        }

        public void setFormaPagamento(String formaPagamento) {
            this.formaPagamento = formaPagamento;
        }

        public Integer getParcelasHonorario() {
            return parcelasHonorario;
        }

        public void setParcelasHonorario(Integer parcelasHonorario) {
            this.parcelasHonorario = parcelasHonorario;
        }

        public String getVencimentoHonorario() {
            return vencimentoHonorario;
        }

        public void setVencimentoHonorario(String vencimentoHonorario) {
            this.vencimentoHonorario = vencimentoHonorario;
        }
    }
}
