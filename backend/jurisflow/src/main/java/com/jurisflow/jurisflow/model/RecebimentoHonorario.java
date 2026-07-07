package com.jurisflow.jurisflow.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        indexes = {
                @Index(name = "idx_recebimento_honorario", columnList = "honorario_id"),
                @Index(name = "idx_recebimento_honorario_data", columnList = "dataRecebimento")
        }
)
public class RecebimentoHonorario {

    public static final String STATUS_CONFIRMADO = "CONFIRMADO";
    public static final String STATUS_CANCELADO = "CANCELADO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "honorario_id", nullable = false)
    private Honorario honorario;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal valorRecebido;

    @Column(nullable = false)
    private LocalDate dataRecebimento;

    @Column(nullable = false)
    private String formaPagamento;

    private String observacao;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false, updatable = false)
    private Instant dataCadastro;

    private Instant dataCancelamento;
    private String motivoCancelamento;

    @PrePersist
    public void preencherDadosCadastro() {
        if (dataCadastro == null) {
            dataCadastro = Instant.now();
        }

        if (status == null || status.isBlank()) {
            status = STATUS_CONFIRMADO;
        }
    }

    public Long getId() {
        return id;
    }

    public Honorario getHonorario() {
        return honorario;
    }

    public void setHonorario(Honorario honorario) {
        this.honorario = honorario;
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
