package com.jurisflow.jurisflow.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_parcela_honorario_numero",
                        columnNames = {"honorario_id", "numero_parcela"}
                )
        },
        indexes = {
                @Index(name = "idx_parcela_honorario", columnList = "honorario_id")
        }
)
public class ParcelaHonorario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "honorario_id", nullable = false)
    private Honorario honorario;

    @Column(name = "numero_parcela", nullable = false)
    private Integer numeroParcela;

    @Column(precision = 15, scale = 2, nullable = false)
    private BigDecimal valorPrevisto;

    private LocalDate vencimento;
    private String status;

    @Column(precision = 15, scale = 2)
    private BigDecimal valorRecebido;

    private LocalDate dataRecebimento;
    private String dataCadastro;

    @PrePersist
    public void preencherDataCadastro() {
        if (dataCadastro == null || dataCadastro.isBlank()) {
            dataCadastro = Instant.now().toString();
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

    public Integer getNumeroParcela() {
        return numeroParcela;
    }

    public void setNumeroParcela(Integer numeroParcela) {
        this.numeroParcela = numeroParcela;
    }

    public BigDecimal getValorPrevisto() {
        return valorPrevisto;
    }

    public void setValorPrevisto(BigDecimal valorPrevisto) {
        this.valorPrevisto = valorPrevisto;
    }

    public LocalDate getVencimento() {
        return vencimento;
    }

    public void setVencimento(LocalDate vencimento) {
        this.vencimento = vencimento;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public String getDataCadastro() {
        return dataCadastro;
    }
}
