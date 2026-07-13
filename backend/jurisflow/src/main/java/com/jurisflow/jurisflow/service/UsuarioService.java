package com.jurisflow.jurisflow.service;

import com.jurisflow.jurisflow.dto.usuario.AlterarMinhaSenhaRequest;
import com.jurisflow.jurisflow.dto.usuario.AtualizarUsuarioRequest;
import com.jurisflow.jurisflow.dto.usuario.CriarUsuarioRequest;
import com.jurisflow.jurisflow.dto.usuario.ResetarSenhaRequest;
import com.jurisflow.jurisflow.dto.usuario.UsuarioResponse;
import com.jurisflow.jurisflow.model.PerfilUsuario;
import com.jurisflow.jurisflow.model.Usuario;
import com.jurisflow.jurisflow.repository.UsuarioRepository;
import com.jurisflow.jurisflow.security.UsuarioAutenticado;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UsuarioResponse> listar(boolean incluirInativos) {
        List<Usuario> usuarios = incluirInativos
                ? usuarioRepository.findAll()
                : usuarioRepository.findByAtivoTrueOrderByNomeAsc();

        return usuarios.stream()
                .sorted(Comparator.comparing(Usuario::getNome, String.CASE_INSENSITIVE_ORDER))
                .map(UsuarioResponse::from)
                .toList();
    }

    public UsuarioResponse buscar(Long id) {
        return UsuarioResponse.from(buscarEntidade(id));
    }

    public UsuarioResponse criar(CriarUsuarioRequest request) {
        String email = normalizarEmail(request.email());
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe usuario cadastrado com este e-mail.");
        }

        Usuario usuario = new Usuario();
        usuario.setNome(request.nome().trim());
        usuario.setEmail(email);
        usuario.setSenhaHash(passwordEncoder.encode(request.senha()));
        usuario.setPerfil(request.perfil());
        usuario.setAtivo(true);

        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    public UsuarioResponse atualizar(Long id, AtualizarUsuarioRequest request, UsuarioAutenticado adminLogado) {
        Usuario usuario = buscarEntidade(id);
        String email = normalizarEmail(request.email());

        if (usuarioRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ja existe usuario cadastrado com este e-mail.");
        }

        validarAlteracaoAdmin(usuario, request.perfil(), request.ativo(), adminLogado);

        usuario.setNome(request.nome().trim());
        usuario.setEmail(email);
        usuario.setPerfil(request.perfil());
        usuario.setAtivo(request.ativo());

        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    public void resetarSenha(Long id, ResetarSenhaRequest request, UsuarioAutenticado adminLogado) {
        if (adminLogado.id().equals(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a troca de propria senha para alterar sua senha.");
        }

        Usuario usuario = buscarEntidade(id);
        usuario.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        usuarioRepository.save(usuario);
    }

    public UsuarioResponse dadosDoUsuarioLogado(UsuarioAutenticado usuarioLogado) {
        return UsuarioResponse.from(buscarEntidade(usuarioLogado.id()));
    }

    public void alterarMinhaSenha(UsuarioAutenticado usuarioLogado, AlterarMinhaSenhaRequest request) {
        Usuario usuario = buscarEntidade(usuarioLogado.id());

        if (!passwordEncoder.matches(request.senhaAtual(), usuario.senhaHashParaAutenticacao())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Senha atual incorreta.");
        }

        usuario.setSenhaHash(passwordEncoder.encode(request.novaSenha()));
        usuarioRepository.save(usuario);
    }

    private Usuario buscarEntidade(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario nao encontrado."));
    }

    private void validarAlteracaoAdmin(
            Usuario usuario,
            PerfilUsuario novoPerfil,
            Boolean novoAtivo,
            UsuarioAutenticado adminLogado
    ) {
        boolean estaAlterandoASiMesmo = adminLogado.id().equals(usuario.getId());
        boolean ficaraInativo = !Boolean.TRUE.equals(novoAtivo);

        if (estaAlterandoASiMesmo && ficaraInativo) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Voce nao pode desativar seu proprio usuario pela administracao.");
        }

        boolean usuarioEraAdminAtivo = usuario.getPerfil() == PerfilUsuario.ADMIN && Boolean.TRUE.equals(usuario.getAtivo());
        boolean deixaraDeSerAdminAtivo = usuarioEraAdminAtivo
                && (novoPerfil != PerfilUsuario.ADMIN || ficaraInativo);

        if (deixaraDeSerAdminAtivo && usuarioRepository.countAtivosByPerfil(PerfilUsuario.ADMIN) <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nao e possivel desativar ou rebaixar o ultimo ADMIN ativo.");
        }
    }

    private String normalizarEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
