package com.jurisflow.jurisflow.dto.usuario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetarSenhaRequest(
        @NotBlank @Size(min = 8) String novaSenha
) {}
