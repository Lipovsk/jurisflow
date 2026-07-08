package com.jurisflow.jurisflow.service;

import com.jurisflow.jurisflow.model.Cliente;
import com.jurisflow.jurisflow.model.Documento;
import com.jurisflow.jurisflow.model.Processo;
import com.jurisflow.jurisflow.model.Usuario;
import com.jurisflow.jurisflow.repository.ClienteRepository;
import com.jurisflow.jurisflow.repository.DocumentoRepository;
import com.jurisflow.jurisflow.repository.ProcessoRepository;
import com.jurisflow.jurisflow.repository.UsuarioRepository;
import com.jurisflow.jurisflow.security.UsuarioAutenticado;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class DocumentoService {

    private static final long TAMANHO_MAXIMO = 10L * 1024L * 1024L;
    private static final Set<String> EXTENSOES_PERMITIDAS = Set.of("pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png");
    private static final Map<String, Set<String>> CONTENT_TYPES_PERMITIDOS = Map.of(
            "pdf", Set.of("application/pdf"),
            "doc", Set.of("application/msword", "application/octet-stream"),
            "docx", Set.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/octet-stream"),
            "xls", Set.of("application/vnd.ms-excel", "application/octet-stream"),
            "xlsx", Set.of("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/zip", "application/octet-stream"),
            "jpg", Set.of("image/jpeg"),
            "jpeg", Set.of("image/jpeg"),
            "png", Set.of("image/png")
    );

    private final DocumentoRepository documentoRepository;
    private final ClienteRepository clienteRepository;
    private final ProcessoRepository processoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ArmazenamentoDocumentoService armazenamentoService;

    public DocumentoService(
            DocumentoRepository documentoRepository,
            ClienteRepository clienteRepository,
            ProcessoRepository processoRepository,
            UsuarioRepository usuarioRepository,
            ArmazenamentoDocumentoService armazenamentoService
    ) {
        this.documentoRepository = documentoRepository;
        this.clienteRepository = clienteRepository;
        this.processoRepository = processoRepository;
        this.usuarioRepository = usuarioRepository;
        this.armazenamentoService = armazenamentoService;
    }

    @Transactional
    public Documento criar(
            MultipartFile arquivo,
            String titulo,
            String categoria,
            String descricao,
            Long clienteId,
            Long processoId,
            UsuarioAutenticado usuarioAutenticado
    ) {
        validarArquivo(arquivo);

        String nomeOriginal = sanitizarNomeArquivo(arquivo.getOriginalFilename());
        String extensao = extensao(nomeOriginal);
        validarExtensaoEConteudo(arquivo, extensao);

        Vinculos vinculos = resolverVinculos(clienteId, processoId);
        Usuario usuarioUpload = buscarUsuario(usuarioAutenticado);
        String tituloNormalizado = textoOuNull(titulo);
        if (tituloNormalizado == null) {
            tituloNormalizado = nomeSemExtensao(nomeOriginal);
        }

        ArmazenamentoDocumentoService.ArquivoArmazenado armazenado = armazenamentoService.armazenar(arquivo, extensao);

        try {
            Documento documento = new Documento();
            documento.setTitulo(tituloNormalizado);
            documento.setNomeOriginal(nomeOriginal);
            documento.setChaveArmazenamento(armazenado.chaveArmazenamento());
            documento.setExtensao(extensao);
            documento.setContentType(contentTypeSeguro(arquivo, extensao));
            documento.setTamanhoBytes(arquivo.getSize());
            documento.setCategoria(textoOuNull(categoria));
            documento.setDescricao(textoOuNull(descricao));
            documento.setCliente(vinculos.cliente());
            documento.setProcesso(vinculos.processo());
            documento.setUsuarioUpload(usuarioUpload);
            documento.setAtivo(true);
            return documentoRepository.save(documento);
        } catch (RuntimeException ex) {
            armazenamentoService.removerSeExistir(armazenado.chaveArmazenamento());
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public List<Documento> listar(Long clienteId, Long processoId, String categoria, String busca) {
        String categoriaNormalizada = normalizarFiltro(categoria);
        String buscaNormalizada = normalizarFiltro(busca);
        String buscaPattern = buscaNormalizada == null ? null : "%" + buscaNormalizada + "%";

        Specification<Documento> specification = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("ativo")));

            if (clienteId != null) {
                predicates.add(cb.equal(root.get("cliente").get("id"), clienteId));
            }

            if (processoId != null) {
                predicates.add(cb.equal(root.get("processo").get("id"), processoId));
            }

            if (categoriaNormalizada != null) {
                predicates.add(cb.equal(cb.lower(root.get("categoria")), categoriaNormalizada));
            }

            if (buscaPattern != null) {
                Join<Documento, Cliente> cliente = root.join("cliente", JoinType.LEFT);
                Join<Documento, Processo> processo = root.join("processo", JoinType.LEFT);
                predicates.add(cb.or(
                        likeNormalizado(cb, root.get("titulo"), buscaPattern),
                        likeNormalizado(cb, root.get("nomeOriginal"), buscaPattern),
                        likeNormalizado(cb, root.get("descricao"), buscaPattern),
                        likeNormalizado(cb, cliente.get("nome"), buscaPattern),
                        likeNormalizado(cb, processo.get("numero"), buscaPattern)
                ));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };

        return documentoRepository.findAll(specification, Sort.by(Sort.Direction.DESC, "dataUpload"));
    }

    @Transactional(readOnly = true)
    public Documento buscarAtivo(Long id) {
        return documentoRepository.findByIdAndAtivoTrue(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documento nao encontrado."));
    }

    @Transactional(readOnly = true)
    public DownloadDocumento prepararDownload(Long id) {
        Documento documento = buscarAtivo(id);
        Path caminho = armazenamentoService.resolverArquivoExistente(documento.getChaveArmazenamento());
        return new DownloadDocumento(documento, caminho);
    }

    @Transactional
    public void excluir(Long id, UsuarioAutenticado usuarioAutenticado) {
        Documento documento = buscarAtivo(id);
        documento.setAtivo(false);
        documento.setDataExclusao(Instant.now());
        documento.setUsuarioExclusao(buscarUsuario(usuarioAutenticado));
        documentoRepository.save(documento);
    }

    public boolean existeDocumentoAtivoPorCliente(Long clienteId) {
        return documentoRepository.existsByClienteIdAndAtivoTrue(clienteId);
    }

    public boolean existeDocumentoAtivoPorProcesso(Long processoId) {
        return documentoRepository.existsByProcessoIdAndAtivoTrue(processoId);
    }

    public boolean existeDocumentoPorCliente(Long clienteId) {
        return documentoRepository.existsByClienteId(clienteId);
    }

    public boolean existeDocumentoPorProcesso(Long processoId) {
        return documentoRepository.existsByProcessoId(processoId);
    }

    private Vinculos resolverVinculos(Long clienteId, Long processoId) {
        Cliente cliente = null;
        Processo processo = null;

        if (clienteId == null && processoId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe clienteId ou processoId para vincular o documento.");
        }

        if (processoId != null) {
            processo = processoRepository.findAtivoById(processoId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "processoId nao corresponde a processo ativo existente."));

            if (processo.getCliente() != null) {
                cliente = processo.getCliente();
            }
        }

        if (clienteId != null) {
            Cliente clienteInformado = clienteRepository.findAtivoById(clienteId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "clienteId nao corresponde a cliente ativo existente."));
            if (cliente != null && !cliente.getId().equals(clienteInformado.getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O processo informado nao pertence ao cliente informado.");
            }
            cliente = clienteInformado;
        }

        return new Vinculos(cliente, processo);
    }

    private Usuario buscarUsuario(UsuarioAutenticado usuarioAutenticado) {
        if (usuarioAutenticado == null || usuarioAutenticado.id() == null) return null;
        return usuarioRepository.findById(usuarioAutenticado.id()).orElse(null);
    }

    private void validarArquivo(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo vazio ou ausente.");
        }
        if (arquivo.getSize() > TAMANHO_MAXIMO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo excede o limite de 10 MB.");
        }
    }

    private void validarExtensaoEConteudo(MultipartFile arquivo, String extensao) {
        if (!EXTENSOES_PERMITIDAS.contains(extensao)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Extensao de arquivo nao permitida.");
        }

        String contentType = contentTypeSeguro(arquivo, extensao).toLowerCase(Locale.ROOT);
        if (!CONTENT_TYPES_PERMITIDOS.getOrDefault(extensao, Set.of()).contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de arquivo nao permitido.");
        }

        if (!assinaturaCompativel(arquivo, extensao)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conteudo do arquivo nao corresponde ao tipo permitido.");
        }
    }

    private boolean assinaturaCompativel(MultipartFile arquivo, String extensao) {
        try {
            byte[] bytes = arquivo.getInputStream().readNBytes(8);
            if (bytes.length < 4) return false;

            if ("pdf".equals(extensao)) {
                return bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46;
            }
            if ("png".equals(extensao)) {
                return bytes.length >= 8
                        && (bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47
                        && bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A;
            }
            if ("jpg".equals(extensao) || "jpeg".equals(extensao)) {
                return (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF;
            }
            if ("doc".equals(extensao) || "xls".equals(extensao)) {
                return (bytes[0] & 0xFF) == 0xD0 && (bytes[1] & 0xFF) == 0xCF
                        && (bytes[2] & 0xFF) == 0x11 && (bytes[3] & 0xFF) == 0xE0;
            }
            if ("docx".equals(extensao) || "xlsx".equals(extensao)) {
                return bytes[0] == 0x50 && bytes[1] == 0x4B;
            }
            return false;
        } catch (Exception ex) {
            return false;
        }
    }

    private String contentTypeSeguro(MultipartFile arquivo, String extensao) {
        String contentType = textoOuNull(arquivo.getContentType());
        if (contentType != null) return contentType;
        return switch (extensao) {
            case "pdf" -> "application/pdf";
            case "doc" -> "application/msword";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xls" -> "application/vnd.ms-excel";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            default -> "application/octet-stream";
        };
    }

    private String sanitizarNomeArquivo(String nome) {
        String base = textoOuNull(nome);
        if (base == null) base = "documento";
        base = base.replace('\\', '_').replace('/', '_').replaceAll("[\\r\\n\\t]", "_").trim();
        base = Normalizer.normalize(base, Normalizer.Form.NFKC).replaceAll("[\\p{Cntrl}]", "_");
        if (base.isBlank() || ".".equals(base) || "..".equals(base)) return "documento";
        return base.length() > 180 ? base.substring(base.length() - 180) : base;
    }

    private String extensao(String nome) {
        int index = nome.lastIndexOf('.');
        if (index < 0 || index == nome.length() - 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo sem extensao.");
        }
        return nome.substring(index + 1).toLowerCase(Locale.ROOT);
    }

    private String nomeSemExtensao(String nome) {
        int index = nome.lastIndexOf('.');
        String base = index > 0 ? nome.substring(0, index) : nome;
        String texto = textoOuNull(base);
        return texto == null ? "Documento" : texto;
    }

    private String textoOuNull(String valor) {
        String texto = valor == null ? null : valor.trim();
        return texto == null || texto.isBlank() ? null : texto;
    }

    private String normalizarFiltro(String valor) {
        String texto = textoOuNull(valor);
        return texto == null ? null : texto.toLowerCase(Locale.ROOT);
    }

    private Predicate likeNormalizado(CriteriaBuilder cb, Expression<String> campo, String pattern) {
        return cb.like(cb.lower(cb.coalesce(campo, "")), pattern);
    }

    private record Vinculos(Cliente cliente, Processo processo) {}

    public record DownloadDocumento(Documento documento, Path caminho) {}
}
