package com.jurisflow.jurisflow.repository;

import com.jurisflow.jurisflow.model.PerfilUsuario;
import com.jurisflow.jurisflow.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByEmailIgnoreCase(String email);
    boolean existsByPerfil(PerfilUsuario perfil);
    boolean existsByPerfilAndAtivoTrue(PerfilUsuario perfil);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);
    List<Usuario> findByAtivoTrueOrderByNomeAsc();

    @Query("select count(u) from Usuario u where u.perfil = :perfil and u.ativo = true")
    long countAtivosByPerfil(@Param("perfil") PerfilUsuario perfil);
}
