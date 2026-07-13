package com.jurisflow.jurisflow.dto.usuario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AlterarMinhaSenhaRequest(
        @NotBlank String senhaAtual,
        @NotBlank @Size(min = 8) String novaSenha
) {}
