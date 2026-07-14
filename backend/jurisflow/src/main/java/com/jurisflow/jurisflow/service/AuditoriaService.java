package com.jurisflow.jurisflow.service;

import com.jurisflow.jurisflow.dto.auditoria.AuditoriaResponse;
import com.jurisflow.jurisflow.model.Auditoria;
import com.jurisflow.jurisflow.repository.AuditoriaRepository;
import com.jurisflow.jurisflow.security.UsuarioAutenticado;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class AuditoriaService {

    private static final Logger log = LoggerFactory.getLogger(AuditoriaService.class);
    private static final int LIMITE_DESCRICAO = 300;
    private static final int LIMITE_USER_AGENT = 500;

    private final AuditoriaPersistenciaService persistenciaService;
    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaService(
            AuditoriaPersistenciaService persistenciaService,
            AuditoriaRepository auditoriaRepository
    ) {
        this.persistenciaService = persistenciaService;
        this.auditoriaRepository = auditoriaRepository;
    }

    public void registrarSucesso(
            UsuarioAutenticado usuario,
            String acao,
            String entidade,
            Long entidadeId,
            String descricao,
            HttpServletRequest request
    ) {
        registrar(usuario, acao, entidade, entidadeId, descricao, true, request);
    }

    public void registrarFalha(
            UsuarioAutenticado usuario,
            String acao,
            String entidade,
            Long entidadeId,
            String descricao,
            HttpServletRequest request
    ) {
        registrar(usuario, acao, entidade, entidadeId, descricao, false, request);
    }

    public void registrarSucesso(UsuarioAutenticado usuario, String acao, String entidade, Long entidadeId, String descricao) {
        registrarSucesso(usuario, acao, entidade, entidadeId, descricao, null);
    }

    public void registrarFalha(UsuarioAutenticado usuario, String acao, String entidade, Long entidadeId, String descricao) {
        registrarFalha(usuario, acao, entidade, entidadeId, descricao, null);
    }

    @Transactional(readOnly = true)
    public List<AuditoriaResponse> listar(
            String acao,
            String entidade,
            Long usuarioId,
            Boolean sucesso,
            Instant dataInicial,
            Instant dataFinal,
            int limite
    ) {
        Specification<Auditoria> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (textoOuNull(acao) != null) {
                predicates.add(cb.equal(cb.upper(root.get("acao")), acao.trim().toUpperCase(Locale.ROOT)));
            }
            if (textoOuNull(entidade) != null) {
                predicates.add(cb.equal(cb.upper(root.get("entidade")), entidade.trim().toUpperCase(Locale.ROOT)));
            }
            if (usuarioId != null) predicates.add(cb.equal(root.get("usuarioId"), usuarioId));
            if (sucesso != null) predicates.add(cb.equal(root.get("sucesso"), sucesso));
            if (dataInicial != null) predicates.add(cb.greaterThanOrEqualTo(root.get("dataHora"), dataInicial));
            if (dataFinal != null) predicates.add(cb.lessThanOrEqualTo(root.get("dataHora"), dataFinal));
            return cb.and(predicates.toArray(Predicate[]::new));
        };

        return auditoriaRepository.findAll(
                        specification,
                        PageRequest.of(0, limite, Sort.by(Sort.Direction.DESC, "dataHora"))
                ).getContent().stream()
                .map(AuditoriaResponse::from)
                .toList();
    }

    private void registrar(
            UsuarioAutenticado usuario,
            String acao,
            String entidade,
            Long entidadeId,
            String descricao,
            boolean sucesso,
            HttpServletRequest request
    ) {
        try {
            Auditoria auditoria = new Auditoria();
            if (usuario != null) {
                auditoria.setUsuarioId(usuario.id());
                auditoria.setUsuarioNome(limitar(usuario.nome(), 160));
                auditoria.setUsuarioEmail(limitar(usuario.email(), 254));
            }
            auditoria.setAcao(limitarObrigatorio(acao, 80));
            auditoria.setEntidade(limitar(entidade, 80));
            auditoria.setEntidadeId(entidadeId);
            auditoria.setDescricao(limitar(sanitizar(descricao), LIMITE_DESCRICAO));
            auditoria.setSucesso(sucesso);
            if (request != null) {
                auditoria.setIp(limitar(request.getRemoteAddr(), 64));
                auditoria.setUserAgent(limitar(sanitizar(request.getHeader("User-Agent")), LIMITE_USER_AGENT));
            }
            persistenciaService.salvar(auditoria);
        } catch (Exception ex) {
            log.error("Falha interna ao persistir evento de auditoria da acao {}.", acao, ex);
        }
    }

    private String sanitizar(String valor) {
        String texto = textoOuNull(valor);
        if (texto == null) return null;
        return texto.replaceAll("[\\r\\n\\t]+", " ")
                .replaceAll("(?i)bearer\\s+[^\\s]+", "Bearer [REDACTED]")
                .replaceAll("(?i)(senha|password|token)\\s*[:=]\\s*[^\\s]+", "$1=[REDACTED]");
    }

    private String limitarObrigatorio(String valor, int limite) {
        String texto = textoOuNull(valor);
        if (texto == null) throw new IllegalArgumentException("Acao de auditoria obrigatoria.");
        return limitar(texto, limite);
    }

    private String limitar(String valor, int limite) {
        String texto = textoOuNull(valor);
        if (texto == null) return null;
        return texto.length() <= limite ? texto : texto.substring(0, limite);
    }

    private String textoOuNull(String valor) {
        String texto = valor == null ? null : valor.trim();
        return texto == null || texto.isBlank() ? null : texto;
    }
}
