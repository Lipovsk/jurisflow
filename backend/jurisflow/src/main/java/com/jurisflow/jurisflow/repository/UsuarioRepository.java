package com.jurisflow.jurisflow.repository;

import com.jurisflow.jurisflow.model.PerfilUsuario;
import com.jurisflow.jurisflow.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    boolean existsByPerfil(PerfilUsuario perfil);
}
