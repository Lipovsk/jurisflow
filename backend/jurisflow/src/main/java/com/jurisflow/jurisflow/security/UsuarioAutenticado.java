package com.jurisflow.jurisflow.security;

import com.jurisflow.jurisflow.model.PerfilUsuario;
import com.jurisflow.jurisflow.model.Usuario;

public record UsuarioAutenticado(
        Long id,
        String nome,
        String email,
        PerfilUsuario perfil,
        boolean ativo
) {
    public static UsuarioAutenticado from(Usuario usuario) {
        return new UsuarioAutenticado(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPerfil(),
                Boolean.TRUE.equals(usuario.getAtivo())
        );
    }
}
