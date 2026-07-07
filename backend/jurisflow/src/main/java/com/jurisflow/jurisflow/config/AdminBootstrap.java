package com.jurisflow.jurisflow.config;

import com.jurisflow.jurisflow.model.PerfilUsuario;
import com.jurisflow.jurisflow.model.Usuario;
import com.jurisflow.jurisflow.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.regex.Pattern;

@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
    private static final Pattern EMAIL_MINIMO = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrap(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (usuarioRepository.existsByPerfil(PerfilUsuario.ADMIN)) {
            return;
        }

        String nome = System.getenv("JURISFLOW_ADMIN_NOME");
        String email = System.getenv("JURISFLOW_ADMIN_EMAIL");
        String senha = System.getenv("JURISFLOW_ADMIN_PASSWORD");

        if (isBlank(nome) || isBlank(email) || isBlank(senha)) {
            log.warn("Nenhum usuario ADMIN encontrado. Configure JURISFLOW_ADMIN_NOME, JURISFLOW_ADMIN_EMAIL e JURISFLOW_ADMIN_PASSWORD para criar o administrador inicial.");
            return;
        }

        String emailNormalizado = email.trim().toLowerCase(Locale.ROOT);
        if (!EMAIL_MINIMO.matcher(emailNormalizado).matches()) {
            log.warn("Administrador inicial nao criado: JURISFLOW_ADMIN_EMAIL invalido.");
            return;
        }

        if (senha.length() < 12) {
            log.warn("Administrador inicial nao criado: JURISFLOW_ADMIN_PASSWORD deve ter no minimo 12 caracteres.");
            return;
        }

        Usuario admin = new Usuario();
        admin.setNome(nome.trim());
        admin.setEmail(emailNormalizado);
        admin.setSenhaHash(passwordEncoder.encode(senha));
        admin.setPerfil(PerfilUsuario.ADMIN);
        admin.setAtivo(true);
        usuarioRepository.save(admin);

        log.info("Administrador inicial criado para o e-mail configurado em JURISFLOW_ADMIN_EMAIL.");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
