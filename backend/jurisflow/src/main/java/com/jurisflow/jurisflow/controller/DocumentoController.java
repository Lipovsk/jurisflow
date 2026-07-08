package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.Documento;
import com.jurisflow.jurisflow.security.UsuarioAutenticado;
import com.jurisflow.jurisflow.service.DocumentoService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
public class DocumentoController {

    private final DocumentoService documentoService;

    public DocumentoController(DocumentoService documentoService) {
        this.documentoService = documentoService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentoResponse> criar(
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam(required = false) String titulo,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String descricao,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long processoId,
            Authentication authentication
    ) {
        Documento documento = documentoService.criar(
                arquivo,
                titulo,
                categoria,
                descricao,
                clienteId,
                processoId,
                usuarioAutenticado(authentication)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(DocumentoResponse.from(documento));
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
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        DocumentoService.DownloadDocumento download = documentoService.prepararDownload(id);
        Documento documento = download.documento();

        FileSystemResource resource = new FileSystemResource(download.caminho());
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(documento.getNomeOriginal(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(documento.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentLength(documento.getTamanhoBytes())
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id, Authentication authentication) {
        documentoService.excluir(id, usuarioAutenticado(authentication));
        return ResponseEntity.noContent().build();
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
