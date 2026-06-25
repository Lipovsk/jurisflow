package com.jurisflow.jurisflow.model;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
public class Processo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
    private String dataCadastro;

    private Double valorHonorario;
    private String formaPagamento;
    private Integer parcelasHonorario;
    private String vencimentoHonorario;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    public Long getId() {
        return id;
    }

    @PrePersist
    public void preencherDataCadastro() {
        if (dataCadastro == null || dataCadastro.isBlank()) {
            dataCadastro = Instant.now().toString();
        }
    }

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

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
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

    public String getDataCadastro() {
        return dataCadastro;
    }
}
