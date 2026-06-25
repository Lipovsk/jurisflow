package com.jurisflow.jurisflow.model;

import jakarta.persistence.*;

@Entity
public class Honorario {

    public static final String ORIGEM_MANUAL = "MANUAL";
    public static final String ORIGEM_PROCESSO_AUTOMATICO = "PROCESSO_AUTOMATICO";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tipoHonorario;
    private Double valorTotal;
    private String competencia;
    private String status;
    private String formaPagamento;
    private String descricao;
    private String origem;

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

    public String getTipoHonorario() {
        return tipoHonorario;
    }

    public void setTipoHonorario(String tipoHonorario) {
        this.tipoHonorario = tipoHonorario;
    }

    public Double getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(Double valorTotal) {
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
