package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.Documento;
import com.jurisflow.jurisflow.security.UsuarioAutenticado;
import com.jurisflow.jurisflow.service.AuditoriaService;
import com.jurisflow.jurisflow.service.DocumentoService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/documentos")
@PreAuthorize("hasAnyRole('ADMIN','ADVOGADO','ASSISTENTE')")
public class DocumentoController {

    private final DocumentoService documentoService;
    private final AuditoriaService auditoriaService;

    public DocumentoController(DocumentoService documentoService, AuditoriaService auditoriaService) {
        this.documentoService = documentoService;
        this.auditoriaService = auditoriaService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentoResponse> criar(
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam(required = false) String titulo,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String descricao,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long processoId,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UsuarioAutenticado usuario = usuarioAutenticado(authentication);
        try {
            Documento documento = documentoService.criar(
                    arquivo,
                    titulo,
                    categoria,
                    descricao,
                    clienteId,
                    processoId,
                    usuario
            );
            auditoriaService.registrarSucesso(
                    usuario, "UPLOAD_DOCUMENTO", "DOCUMENTO", documento.getId(),
                    "Documento enviado: " + documento.getTitulo() + ".", httpRequest
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(DocumentoResponse.from(documento));
        } catch (RuntimeException ex) {
            auditoriaService.registrarFalha(usuario, "UPLOAD_DOCUMENTO", "DOCUMENTO", null, "Falha ao enviar documento.", httpRequest);
            throw ex;
        }
    }

    @GetMapping
    public List<DocumentoResponse> listar(
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long processoId,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String busca
    ) {
        return documentoService.listar(clienteId, processoId, categoria, busca)
                .stream()
                .map(DocumentoResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    public DocumentoResponse buscar(@PathVariable Long id) {
        return DocumentoResponse.from(documentoService.buscarAtivo(id));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UsuarioAutenticado usuario = usuarioAutenticado(authentication);
        try {
            DocumentoService.DownloadDocumento download = documentoService.prepararDownload(id);
            Documento documento = download.documento();
            FileSystemResource resource = new FileSystemResource(download.caminho());
            ContentDisposition disposition = ContentDisposition.attachment()
                    .filename(documento.getNomeOriginal(), StandardCharsets.UTF_8)
                    .build();
            auditoriaService.registrarSucesso(
                    usuario, "DOWNLOAD_DOCUMENTO", "DOCUMENTO", id,
                    "Documento baixado: " + documento.getTitulo() + ".", httpRequest
            );
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(documento.getContentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                    .contentLength(documento.getTamanhoBytes())
                    .body(resource);
        } catch (RuntimeException ex) {
            auditoriaService.registrarFalha(usuario, "DOWNLOAD_DOCUMENTO", "DOCUMENTO", id, "Falha ao baixar documento.", httpRequest);
            throw ex;
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ADVOGADO')")
    public ResponseEntity<Void> excluir(
            @PathVariable Long id,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UsuarioAutenticado usuario = usuarioAutenticado(authentication);
        try {
            Documento documento = documentoService.buscarAtivo(id);
            documentoService.excluir(id, usuario);
            auditoriaService.registrarSucesso(
                    usuario, "EXCLUIR_DOCUMENTO", "DOCUMENTO", id,
                    "Documento excluido: " + documento.getTitulo() + ".", httpRequest
            );
            return ResponseEntity.noContent().build();
        } catch (RuntimeException ex) {
            auditoriaService.registrarFalha(usuario, "EXCLUIR_DOCUMENTO", "DOCUMENTO", id, "Falha ao excluir documento.", httpRequest);
            throw ex;
        }
    }

    private UsuarioAutenticado usuarioAutenticado(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UsuarioAutenticado usuario)) {
            return null;
        }
        return usuario;
    }

    public record DocumentoResponse(
            Long id,
            String titulo,
            String nomeOriginal,
            String extensao,
            String contentType,
            Long tamanhoBytes,
            String categoria,
            String descricao,
            Long clienteId,
            String clienteNome,
            Long processoId,
            String processoNumero,
            Long usuarioUploadId,
            String usuarioUploadNome,
            java.time.Instant dataUpload,
            Boolean ativo
    ) {
        public static DocumentoResponse from(Documento documento) {
            return new DocumentoResponse(
                    documento.getId(),
                    documento.getTitulo(),
                    documento.getNomeOriginal(),
                    documento.getExtensao(),
                    documento.getContentType(),
                    documento.getTamanhoBytes(),
                    documento.getCategoria(),
                    documento.getDescricao(),
                    documento.getCliente() == null ? null : documento.getCliente().getId(),
                    documento.getCliente() == null ? null : documento.getCliente().getNome(),
                    documento.getProcesso() == null ? null : documento.getProcesso().getId(),
                    documento.getProcesso() == null ? null : documento.getProcesso().getNumero(),
                    documento.getUsuarioUpload() == null ? null : documento.getUsuarioUpload().getId(),
                    documento.getUsuarioUpload() == null ? null : documento.getUsuarioUpload().getNome(),
                    documento.getDataUpload(),
                    documento.getAtivo()
            );
        }
    }
}
