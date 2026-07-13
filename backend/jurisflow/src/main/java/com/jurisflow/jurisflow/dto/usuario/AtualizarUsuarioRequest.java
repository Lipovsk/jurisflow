package com.jurisflow.jurisflow.dto.usuario;

import com.jurisflow.jurisflow.model.PerfilUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AtualizarUsuarioRequest(
        @NotBlank String nome,
        @NotBlank @Email String email,
        @NotNull PerfilUsuario perfil,
        @NotNull Boolean ativo
) {}
