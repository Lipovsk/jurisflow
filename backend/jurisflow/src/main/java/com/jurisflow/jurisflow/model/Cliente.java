package com.jurisflow.jurisflow.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Data
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String cpfCnpj;
    private String telefone;
    private String email;
    private String endereco;
    private String status;

    private String areaJuridica;
    private String tipoCliente;

    private String rg;
    private String dataNascimento;
    private String sexo;
    private String estadoCivil;
    private String profissao;

    private String telefoneSecundario;
    private String whatsapp;

    private String cep;
    private String bairro;
    private String cidade;
    private String estado;
    private String complemento;

    private String obsRapida;
    private String observacoes;

    private String dataCadastro;
    private Boolean ativo = true;
    private Instant dataExclusao;
    private String motivoExclusao;

    @PrePersist
    public void preencherDataCadastro() {
        if (dataCadastro == null || dataCadastro.isBlank()) {
            dataCadastro = Instant.now().toString();
        }
        if (ativo == null) {
            ativo = true;
        }
    }
}
