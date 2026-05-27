package com.jurisflow.jurisflow.model;

import jakarta.persistence.*;

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

    public Cliente getCliente() {
        return cliente;
    }

    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
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