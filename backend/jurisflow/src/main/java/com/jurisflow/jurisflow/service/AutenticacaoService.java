package com.jurisflow.jurisflow.service;

import com.jurisflow.jurisflow.model.Usuario;
import com.jurisflow.jurisflow.repository.UsuarioRepository;
import com.jurisflow.jurisflow.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AutenticacaoService {

    private static final String CREDENCIAIS_INVALIDAS = "E-mail ou senha invalidos.";

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AutenticacaoService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResult autenticar(String email, String senha) {
        String emailNormalizado = normalizarEmail(email);
        if (emailNormalizado.isBlank() || senha == null || senha.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, CREDENCIAIS_INVALIDAS);
        }

        Usuario usuario = usuarioRepository.findByEmail(emailNormalizado)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, CREDENCIAIS_INVALIDAS));

        if (!passwordEncoder.matches(senha, usuario.senhaHashParaAutenticacao())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, CREDENCIAIS_INVALIDAS);
        }

        if (!Boolean.TRUE.equals(usuario.getAtivo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuario inativo.");
        }

        JwtService.TokenGerado token = jwtService.gerarToken(usuario);
        return new LoginResult(usuario, token);
    }

    private String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    public record LoginResult(Usuario usuario, JwtService.TokenGerado token) {}
}
