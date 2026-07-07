package com.jurisflow.jurisflow.service;

import com.jurisflow.jurisflow.model.Cliente;
import com.jurisflow.jurisflow.model.Honorario;
import com.jurisflow.jurisflow.model.Processo;
import com.jurisflow.jurisflow.model.RecebimentoHonorario;
import com.jurisflow.jurisflow.repository.HonorarioRepository;
import com.jurisflow.jurisflow.repository.RecebimentoHonorarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class RecebimentoHonorarioService {

    private static final String STATUS_HONORARIO_PENDENTE = "pendente";
    private static final String STATUS_HONORARIO_PARCIAL = "parcial";
    private static final String STATUS_HONORARIO_PAGO = "pago";

    private final RecebimentoHonorarioRepository recebimentoHonorarioRepository;
    private final HonorarioRepository honorarioRepository;

    public RecebimentoHonorarioService(
            RecebimentoHonorarioRepository recebimentoHonorarioRepository,
            HonorarioRepository honorarioRepository
    ) {
        this.recebimentoHonorarioRepository = recebimentoHonorarioRepository;
        this.honorarioRepository = honorarioRepository;
    }

    @Transactional(readOnly = true)
    public List<RecebimentoHonorarioResponse> listarTodos() {
        return recebimentoHonorarioRepository.findAllByOrderByDataRecebimentoDescIdDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecebimentoHonorarioResponse> listarPorHonorario(Long honorarioId) {
        buscarHonorario(honorarioId);

        return recebimentoHonorarioRepository.findByHonorarioIdOrderByDataRecebimentoDescIdDesc(honorarioId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RecebimentoHonorarioResponse registrar(Long honorarioId, RecebimentoHonorarioRequest request) {
        Honorario honorario = buscarHonorario(honorarioId);

        BigDecimal valorRecebido = moeda(validarValorRecebido(request));
        LocalDate dataRecebimento = validarDataRecebimento(request);
        String formaPagamento = validarFormaPagamento(request);
        BigDecimal valorTotal = valorTotalObrigatorio(honorario);
        BigDecimal totalConfirmadoAtual = totalConfirmado(honorario.getId());
        BigDecimal saldoRestante = moeda(valorTotal.subtract(totalConfirmadoAtual));

        if (saldoRestante.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Honorario nao possui saldo restante para recebimento."
            );
        }

        if (valorRecebido.compareTo(saldoRestante) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Valor recebido maior que o saldo restante do honorario."
            );
        }

        RecebimentoHonorario recebimento = new RecebimentoHonorario();
        recebimento.setHonorario(honorario);
        recebimento.setValorRecebido(valorRecebido);
        recebimento.setDataRecebimento(dataRecebimento);
        recebimento.setFormaPagamento(formaPagamento);
        recebimento.setObservacao(valorOuNull(request.getObservacao()));
        recebimento.setStatus(RecebimentoHonorario.STATUS_CONFIRMADO);

        RecebimentoHonorario salvo = recebimentoHonorarioRepository.save(recebimento);
        atualizarStatusHonorario(honorario, totalConfirmadoAtual.add(valorRecebido));

        return toResponse(salvo);
    }

    @Transactional
    public RecebimentoHonorarioResponse cancelar(Long id, CancelamentoRecebimentoRequest request) {
        RecebimentoHonorario recebimento = recebimentoHonorarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Recebimento de honorario nao encontrado."
                ));

        if (RecebimentoHonorario.STATUS_CANCELADO.equals(recebimento.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Recebimento de honorario ja esta cancelado."
            );
        }

        String motivoCancelamento = request == null ? null : valorOuNull(request.getMotivoCancelamento());

        if (motivoCancelamento == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "motivoCancelamento e obrigatorio."
            );
        }

        recebimento.setStatus(RecebimentoHonorario.STATUS_CANCELADO);
        recebimento.setDataCancelamento(Instant.now());
        recebimento.setMotivoCancelamento(motivoCancelamento);

        RecebimentoHonorario salvo = recebimentoHonorarioRepository.save(recebimento);
        Honorario honorario = salvo.getHonorario();
        atualizarStatusHonorario(honorario, totalConfirmado(honorario.getId()));

        return toResponse(salvo);
    }

    private Honorario buscarHonorario(Long honorarioId) {
        return honorarioRepository.findById(honorarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Honorario nao encontrado."
                ));
    }

    private BigDecimal validarValorRecebido(RecebimentoHonorarioRequest request) {
        BigDecimal valor = request == null ? null : request.getValorRecebido();

        if (valor == null || valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "valorRecebido deve ser maior que zero."
            );
        }

        return valor;
    }

    private LocalDate validarDataRecebimento(RecebimentoHonorarioRequest request) {
        LocalDate dataRecebimento = request == null ? null : request.getDataRecebimento();

        if (dataRecebimento == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "dataRecebimento e obrigatoria."
            );
        }

        return dataRecebimento;
    }

    private String validarFormaPagamento(RecebimentoHonorarioRequest request) {
        String formaPagamento = request == null ? null : valorOuNull(request.getFormaPagamento());

        if (formaPagamento == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "formaPagamento e obrigatoria."
            );
        }

        return formaPagamento;
    }

    private BigDecimal valorTotalObrigatorio(Honorario honorario) {
        if (honorario.getValorTotal() == null) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Honorario nao possui valorTotal para calcular saldo."
            );
        }

        return moeda(honorario.getValorTotal());
    }

    private BigDecimal totalConfirmado(Long honorarioId) {
        return moeda(recebimentoHonorarioRepository.somarConfirmadosPorHonorario(honorarioId));
    }

    private void atualizarStatusHonorario(Honorario honorario, BigDecimal totalConfirmado) {
        BigDecimal valorTotal = valorTotalObrigatorio(honorario);
        BigDecimal total = moeda(totalConfirmado);

        if (total.compareTo(BigDecimal.ZERO) == 0) {
            honorario.setStatus(STATUS_HONORARIO_PENDENTE);
        } else if (total.compareTo(valorTotal) < 0) {
            honorario.setStatus(STATUS_HONORARIO_PARCIAL);
        } else {
            honorario.setStatus(STATUS_HONORARIO_PAGO);
        }

        honorarioRepository.save(honorario);
    }

    private RecebimentoHonorarioResponse toResponse(RecebimentoHonorario recebimento) {
        Honorario honorario = recebimento.getHonorario();
        Processo processo = honorario == null ? null : honorario.getProcesso();
        Cliente cliente = honorario == null ? null : honorario.getCliente();

        RecebimentoHonorarioResponse response = new RecebimentoHonorarioResponse();
        response.setId(recebimento.getId());
        response.setHonorarioId(honorario == null ? null : honorario.getId());
        response.setProcessoId(processo == null ? null : processo.getId());
        response.setNumeroProcesso(processo == null ? null : processo.getNumero());
        response.setClienteId(cliente == null ? null : cliente.getId());
        response.setNomeCliente(cliente == null ? null : cliente.getNome());
        response.setValorRecebido(recebimento.getValorRecebido());
        response.setDataRecebimento(recebimento.getDataRecebimento());
        response.setFormaPagamento(recebimento.getFormaPagamento());
        response.setObservacao(recebimento.getObservacao());
        response.setStatus(recebimento.getStatus());
        response.setDataCadastro(recebimento.getDataCadastro());
        response.setDataCancelamento(recebimento.getDataCancelamento());
        response.setMotivoCancelamento(recebimento.getMotivoCancelamento());

        return response;
    }

    private String valorOuNull(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private BigDecimal moeda(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    public static class RecebimentoHonorarioRequest {
        private BigDecimal valorRecebido;
        private LocalDate dataRecebimento;
        private String formaPagamento;
        private String observacao;

        public BigDecimal getValorRecebido() {
            return valorRecebido;
        }

        public void setValorRecebido(BigDecimal valorRecebido) {
            this.valorRecebido = valorRecebido;
        }

        public LocalDate getDataRecebimento() {
            return dataRecebimento;
        }

        public void setDataRecebimento(LocalDate dataRecebimento) {
            this.dataRecebimento = dataRecebimento;
        }

        public String getFormaPagamento() {
            return formaPagamento;
        }

        public void setFormaPagamento(String formaPagamento) {
            this.formaPagamento = formaPagamento;
        }

        public String getObservacao() {
            return observacao;
        }

        public void setObservacao(String observacao) {
            this.observacao = observacao;
        }
    }

    public static class CancelamentoRecebimentoRequest {
        private String motivoCancelamento;

        public String getMotivoCancelamento() {
            return motivoCancelamento;
        }

        public void setMotivoCancelamento(String motivoCancelamento) {
            this.motivoCancelamento = motivoCancelamento;
        }
    }

    public static class RecebimentoHonorarioResponse {
        private Long id;
        private Long honorarioId;
        private Long processoId;
        private String numeroProcesso;
        private Long clienteId;
        private String nomeCliente;
        private BigDecimal valorRecebido;
        private LocalDate dataRecebimento;
        private String formaPagamento;
        private String observacao;
        private String status;
        private Instant dataCadastro;
        private Instant dataCancelamento;
        private String motivoCancelamento;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getHonorarioId() {
            return honorarioId;
        }

        public void setHonorarioId(Long honorarioId) {
            this.honorarioId = honorarioId;
        }

        public Long getProcessoId() {
            return processoId;
        }

        public void setProcessoId(Long processoId) {
            this.processoId = processoId;
        }

        public String getNumeroProcesso() {
            return numeroProcesso;
        }

        public void setNumeroProcesso(String numeroProcesso) {
            this.numeroProcesso = numeroProcesso;
        }

        public Long getClienteId() {
            return clienteId;
        }

        public void setClienteId(Long clienteId) {
            this.clienteId = clienteId;
        }

        public String getNomeCliente() {
            return nomeCliente;
        }

        public void setNomeCliente(String nomeCliente) {
            this.nomeCliente = nomeCliente;
        }

        public BigDecimal getValorRecebido() {
            return valorRecebido;
        }

        public void setValorRecebido(BigDecimal valorRecebido) {
            this.valorRecebido = valorRecebido;
        }

        public LocalDate getDataRecebimento() {
            return dataRecebimento;
        }

        public void setDataRecebimento(LocalDate dataRecebimento) {
            this.dataRecebimento = dataRecebimento;
        }

        public String getFormaPagamento() {
            return formaPagamento;
        }

        public void setFormaPagamento(String formaPagamento) {
            this.formaPagamento = formaPagamento;
        }

        public String getObservacao() {
            return observacao;
        }

        public void setObservacao(String observacao) {
            this.observacao = observacao;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Instant getDataCadastro() {
            return dataCadastro;
        }

        public void setDataCadastro(Instant dataCadastro) {
            this.dataCadastro = dataCadastro;
        }

        public Instant getDataCancelamento() {
            return dataCancelamento;
        }

        public void setDataCancelamento(Instant dataCancelamento) {
            this.dataCancelamento = dataCancelamento;
        }

        public String getMotivoCancelamento() {
            return motivoCancelamento;
        }

        public void setMotivoCancelamento(String motivoCancelamento) {
            this.motivoCancelamento = motivoCancelamento;
        }
    }
}
