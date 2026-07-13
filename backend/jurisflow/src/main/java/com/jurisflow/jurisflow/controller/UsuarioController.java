package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.dto.usuario.AlterarMinhaSenhaRequest;
import com.jurisflow.jurisflow.dto.usuario.AtualizarUsuarioRequest;
import com.jurisflow.jurisflow.dto.usuario.CriarUsuarioRequest;
import com.jurisflow.jurisflow.dto.usuario.ResetarSenhaRequest;
import com.jurisflow.jurisflow.dto.usuario.UsuarioResponse;
import com.jurisflow.jurisflow.security.UsuarioAutenticado;
import com.jurisflow.jurisflow.service.UsuarioService;
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

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
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
    public UsuarioResponse criar(@Valid @RequestBody CriarUsuarioRequest request) {
        return usuarioService.criar(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarUsuarioRequest request,
            Authentication authentication
    ) {
        return usuarioService.atualizar(id, request, principal(authentication));
    }

    @PatchMapping("/{id}/senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void resetarSenha(
            @PathVariable Long id,
            @Valid @RequestBody ResetarSenhaRequest request,
            Authentication authentication
    ) {
        usuarioService.resetarSenha(id, request, principal(authentication));
    }

    @GetMapping("/me")
    public UsuarioResponse me(Authentication authentication) {
        return usuarioService.dadosDoUsuarioLogado(principal(authentication));
    }

    @PatchMapping("/me/senha")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void alterarMinhaSenha(
            @Valid @RequestBody AlterarMinhaSenhaRequest request,
            Authentication authentication
    ) {
        usuarioService.alterarMinhaSenha(principal(authentication), request);
    }

    private UsuarioAutenticado principal(Authentication authentication) {
        return (UsuarioAutenticado) authentication.getPrincipal();
    }
}
