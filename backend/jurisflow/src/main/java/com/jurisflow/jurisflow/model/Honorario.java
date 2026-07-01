package com.jurisflow.jurisflow.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
public class Honorario {

    public static final String ORIGEM_MANUAL = "MANUAL";
    public static final String ORIGEM_PROCESSO_AUTOMATICO = "PROCESSO_AUTOMATICO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipoHonorario;

    @Column(precision = 15, scale = 2)
    private BigDecimal valorBruto;

    @Column(precision = 15, scale = 2)
    private BigDecimal desconto;

    @Column(precision = 15, scale = 2)
    private BigDecimal acrescimos;

    @Column(precision = 15, scale = 2)
    private BigDecimal valorTotal;

    private String competencia;
    private String status;
    private String formaPagamento;
    private String descricao;
    private String responsavel;
    private String observacoesInternas;
    private String origem;
    private String dataCadastro;

    @Column(unique = true)
    private String chaveIntegracao;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "processo_id")
    private Processo processo;

    public Long getId() {
        return id;
    }

    @PrePersist
    public void preencherDataCadastro() {
        if (dataCadastro == null || dataCadastro.isBlank()) {
            dataCadastro = Instant.now().toString();
        }
    }

    public String getTipoHonorario() {
        return tipoHonorario;
    }

    public void setTipoHonorario(String tipoHonorario) {
        this.tipoHonorario = tipoHonorario;
    }

    public BigDecimal getValorBruto() {
        return valorBruto;
    }

    public void setValorBruto(BigDecimal valorBruto) {
        this.valorBruto = valorBruto;
    }

    public BigDecimal getDesconto() {
        return desconto;
    }

    public void setDesconto(BigDecimal desconto) {
        this.desconto = desconto;
    }

    public BigDecimal getAcrescimos() {
        return acrescimos;
    }

    public void setAcrescimos(BigDecimal acrescimos) {
        this.acrescimos = acrescimos;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(BigDecimal valorTotal) {
        this.valorTotal = valorTotal;
    }

    public String getCompetencia() {
        return competencia;
    }

    public void setCompetencia(String competencia) {
        this.competencia = competencia;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getFormaPagamento() {
        return formaPagamento;
    }

    public void setFormaPagamento(String formaPagamento) {
        this.formaPagamento = formaPagamento;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getResponsavel() {
        return responsavel;
    }

    public void setResponsavel(String responsavel) {
        this.responsavel = responsavel;
    }

    public String getObservacoesInternas() {
        return observacoesInternas;
    }

    public void setObservacoesInternas(String observacoesInternas) {
        this.observacoesInternas = observacoesInternas;
    }

    public String getOrigem() {
        return origem;
    }

    public void setOrigem(String origem) {
        this.origem = origem;
    }

    public String getChaveIntegracao() {
        return chaveIntegracao;
    }

    public void setChaveIntegracao(String chaveIntegracao) {
        this.chaveIntegracao = chaveIntegracao;
    }

    public String getDataCadastro() {
        return dataCadastro;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }

    public Processo getProcesso() {
        return processo;
    }

    public void setProcesso(Processo processo) {
        this.processo = processo;
    }
}
