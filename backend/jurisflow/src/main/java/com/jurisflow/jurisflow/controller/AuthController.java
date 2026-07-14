package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.PerfilUsuario;
import com.jurisflow.jurisflow.model.Usuario;
import com.jurisflow.jurisflow.security.UsuarioAutenticado;
import com.jurisflow.jurisflow.service.AuditoriaService;
import com.jurisflow.jurisflow.service.AutenticacaoService;
import com.jurisflow.jurisflow.service.AutenticacaoService.LoginResult;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Locale;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AutenticacaoService autenticacaoService;
    private final AuditoriaService auditoriaService;

    public AuthController(AutenticacaoService autenticacaoService, AuditoriaService auditoriaService) {
        this.autenticacaoService = autenticacaoService;
        this.auditoriaService = auditoriaService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        try {
            LoginResult result = autenticacaoService.autenticar(request.email(), request.senhaNormalizada());
            Usuario usuario = result.usuario();
            auditoriaService.registrarSucesso(
                    UsuarioAutenticado.from(usuario),
                    "LOGIN_SUCESSO",
                    "USUARIO",
                    usuario.getId(),
                    "Login realizado.",
                    httpRequest
            );
            return ResponseEntity.ok(new LoginResponse(
                    result.token().token(),
                    "Bearer",
                    result.token().expiresAt(),
                    UsuarioResponse.from(usuario)
            ));
        } catch (RuntimeException ex) {
            auditoriaService.registrarFalha(
                    null,
                    "LOGIN_FALHA",
                    "USUARIO",
                    null,
                    "Falha de login para " + mascararEmail(request.email()) + ".",
                    httpRequest
            );
            throw ex;
        }
    }

    private String mascararEmail(String email) {
        String normalizado = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        int arroba = normalizado.indexOf('@');
        if (arroba <= 0 || arroba == normalizado.length() - 1) return "e-mail nao informado";
        return normalizado.charAt(0) + "***" + normalizado.substring(arroba);
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(Authentication authentication) {
        UsuarioAutenticado principal = (UsuarioAutenticado) authentication.getPrincipal();
        return ResponseEntity.ok(new MeResponse(
                principal.id(),
                principal.nome(),
                principal.email(),
                principal.perfil(),
                principal.ativo()
        ));
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            String senha,
            String password
    ) {
        String senhaNormalizada() {
            return senha != null ? senha : password;
        }
    }

    public record LoginResponse(
            String token,
            String tokenType,
            Instant expiresAt,
            UsuarioResponse usuario
    ) {}

    public record UsuarioResponse(
            Long id,
            String nome,
            String email,
            PerfilUsuario perfil
    ) {
        static UsuarioResponse from(Usuario usuario) {
            return new UsuarioResponse(
                    usuario.getId(),
                    usuario.getNome(),
                    usuario.getEmail(),
                    usuario.getPerfil()
            );
        }
    }

    public record MeResponse(
            Long id,
            String nome,
            String email,
            PerfilUsuario perfil,
            boolean ativo
    ) {}
}
