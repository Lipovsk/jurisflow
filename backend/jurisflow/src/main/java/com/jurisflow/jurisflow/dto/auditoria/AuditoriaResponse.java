package com.jurisflow.jurisflow.dto.auditoria;

import com.jurisflow.jurisflow.model.Auditoria;

import java.time.Instant;

public record AuditoriaResponse(
        Long id,
        Long usuarioId,
        String usuarioNome,
        String usuarioEmail,
        String acao,
        String entidade,
        Long entidadeId,
        String descricao,
        Instant dataHora,
        boolean sucesso
) {
    public static AuditoriaResponse from(Auditoria auditoria) {
        return new AuditoriaResponse(
                auditoria.getId(),
                auditoria.getUsuarioId(),
                auditoria.getUsuarioNome(),
                auditoria.getUsuarioEmail(),
                auditoria.getAcao(),
                auditoria.getEntidade(),
                auditoria.getEntidadeId(),
                auditoria.getDescricao(),
                auditoria.getDataHora(),
                auditoria.isSucesso()
        );
    }
}
