package com.jurisflow.jurisflow.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(
        name = "auditoria",
        indexes = {
                @Index(name = "idx_auditoria_data_hora", columnList = "data_hora"),
                @Index(name = "idx_auditoria_acao", columnList = "acao"),
                @Index(name = "idx_auditoria_usuario_id", columnList = "usuario_id")
        }
)
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id")
    private Long usuarioId;

    @Column(length = 160)
    private String usuarioNome;

    @Column(length = 254)
    private String usuarioEmail;

    @Column(nullable = false, length = 80)
    private String acao;

    @Column(length = 80)
    private String entidade;

    private Long entidadeId;

    @Column(length = 300)
    private String descricao;

    @Column(length = 64)
    private String ip;

    @Column(length = 500)
    private String userAgent;

    @Column(name = "data_hora", nullable = false, updatable = false)
    private Instant dataHora;

    @Column(nullable = false)
    private boolean sucesso;

    @Column(length = 1000)
    private String detalhes;

    @PrePersist
    public void aoCriar() {
        if (dataHora == null) dataHora = Instant.now();
    }

    public Long getId() { return id; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getUsuarioNome() { return usuarioNome; }
    public void setUsuarioNome(String usuarioNome) { this.usuarioNome = usuarioNome; }
    public String getUsuarioEmail() { return usuarioEmail; }
    public void setUsuarioEmail(String usuarioEmail) { this.usuarioEmail = usuarioEmail; }
    public String getAcao() { return acao; }
    public void setAcao(String acao) { this.acao = acao; }
    public String getEntidade() { return entidade; }
    public void setEntidade(String entidade) { this.entidade = entidade; }
    public Long getEntidadeId() { return entidadeId; }
    public void setEntidadeId(Long entidadeId) { this.entidadeId = entidadeId; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public Instant getDataHora() { return dataHora; }
    public void setDataHora(Instant dataHora) { this.dataHora = dataHora; }
    public boolean isSucesso() { return sucesso; }
    public void setSucesso(boolean sucesso) { this.sucesso = sucesso; }
    public String getDetalhes() { return detalhes; }
    public void setDetalhes(String detalhes) { this.detalhes = detalhes; }
}
