package com.jurisflow.jurisflow.dto.usuario;

import com.jurisflow.jurisflow.model.PerfilUsuario;
import com.jurisflow.jurisflow.model.Usuario;

import java.time.Instant;

public record UsuarioResponse(
        Long id,
        String nome,
        String email,
        PerfilUsuario perfil,
        Boolean ativo,
        Instant criadoEm
) {
    public static UsuarioResponse from(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil(),
                usuario.getAtivo(),
                usuario.getDataCadastro()
        );
    }
}
