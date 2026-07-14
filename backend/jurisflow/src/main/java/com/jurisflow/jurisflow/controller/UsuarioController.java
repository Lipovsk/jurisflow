package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.dto.usuario.AlterarMinhaSenhaRequest;
import com.jurisflow.jurisflow.dto.usuario.AtualizarUsuarioRequest;
import com.jurisflow.jurisflow.dto.usuario.CriarUsuarioRequest;
import com.jurisflow.jurisflow.dto.usuario.ResetarSenhaRequest;
import com.jurisflow.jurisflow.dto.usuario.UsuarioResponse;
import com.jurisflow.jurisflow.security.UsuarioAutenticado;
import com.jurisflow.jurisflow.service.AuditoriaService;
import com.jurisflow.jurisflow.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;
    private final AuditoriaService auditoriaService;

    public UsuarioController(UsuarioService usuarioService, AuditoriaService auditoriaService) {
        this.usuarioService = usuarioService;
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UsuarioResponse> listar(@RequestParam(required = false, defaultValue = "false") boolean incluirInativos) {
        return usuarioService.listar(incluirInativos);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse buscar(@PathVariable Long id) {
        return usuarioService.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse criar(
            @Valid @RequestBody CriarUsuarioRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UsuarioAutenticado principal = principal(authentication);
        try {
            UsuarioResponse criado = usuarioService.criar(request);
            auditoriaService.registrarSucesso(principal, "CRIAR_USUARIO", "USUARIO", criado.id(), "Usuario criado.", httpRequest);
            return criado;
        } catch (RuntimeException ex) {
            auditoriaService.registrarFalha(principal, "CRIAR_USUARIO", "USUARIO", null, "Falha ao criar usuario.", httpRequest);
            throw ex;
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarUsuarioRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UsuarioAutenticado principal = principal(authentication);
        String acao = "EDITAR_USUARIO";
        try {
            UsuarioResponse antes = usuarioService.buscar(id);
            if (!Boolean.TRUE.equals(antes.ativo()) && Boolean.TRUE.equals(request.ativo())) acao = "ATIVAR_USUARIO";
            if (Boolean.TRUE.equals(antes.ativo()) && !Boolean.TRUE.equals(request.ativo())) acao = "DESATIVAR_USUARIO";
            UsuarioResponse atualizado = usuarioService.atualizar(id, request, principal);
            auditoriaService.registrarSucesso(principal, acao, "USUARIO", id, "Usuario atualizado.", httpRequest);
            return atualizado;
        } catch (RuntimeException ex) {
            auditoriaService.registrarFalha(principal, acao, "USUARIO", id, "Falha ao atualizar usuario.", httpRequest);
            throw ex;
        }
    }

    @PatchMapping("/{id}/senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void resetarSenha(
            @PathVariable Long id,
            @Valid @RequestBody ResetarSenhaRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UsuarioAutenticado principal = principal(authentication);
        try {
            usuarioService.resetarSenha(id, request, principal);
            auditoriaService.registrarSucesso(principal, "RESETAR_SENHA", "USUARIO", id, "Senha de usuario resetada.", httpRequest);
        } catch (RuntimeException ex) {
            auditoriaService.registrarFalha(principal, "RESETAR_SENHA", "USUARIO", id, "Falha ao resetar senha de usuario.", httpRequest);
            throw ex;
        }
    }

    @GetMapping("/me")
    public UsuarioResponse me(Authentication authentication) {
        return usuarioService.dadosDoUsuarioLogado(principal(authentication));
    }

    @PatchMapping("/me/senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void alterarMinhaSenha(
            @Valid @RequestBody AlterarMinhaSenhaRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UsuarioAutenticado principal = principal(authentication);
        try {
            usuarioService.alterarMinhaSenha(principal, request);
            auditoriaService.registrarSucesso(principal, "ALTERAR_MINHA_SENHA", "USUARIO", principal.id(), "Senha propria alterada.", httpRequest);
        } catch (RuntimeException ex) {
            auditoriaService.registrarFalha(principal, "ALTERAR_MINHA_SENHA", "USUARIO", principal.id(), "Falha ao alterar senha propria.", httpRequest);
            throw ex;
        }
    }

    private UsuarioAutenticado principal(Authentication authentication) {
        return (UsuarioAutenticado) authentication.getPrincipal();
    }
}
