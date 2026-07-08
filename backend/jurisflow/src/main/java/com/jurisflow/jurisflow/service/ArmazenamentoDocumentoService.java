package com.jurisflow.jurisflow.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class ArmazenamentoDocumentoService {

    private final Path diretorioBase;

    public ArmazenamentoDocumentoService(
            @Value("${jurisflow.documentos.storage-path}") String storagePath
    ) {
        this.diretorioBase = Path.of(storagePath).toAbsolutePath().normalize();
        criarDiretorio();
    }

    public ArquivoArmazenado armazenar(MultipartFile arquivo, String extensao) {
        String chave = UUID.randomUUID() + "." + extensao;
        Path destino = resolver(chave);

        try (InputStream input = arquivo.getInputStream()) {
            Files.copy(input, destino);
            return new ArquivoArmazenado(chave, destino);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nao foi possivel armazenar o documento.");
        }
    }

    public Path resolverArquivoExistente(String chaveArmazenamento) {
        Path arquivo = resolver(chaveArmazenamento);
        if (!Files.isRegularFile(arquivo)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arquivo fisico do documento nao encontrado.");
        }
        return arquivo;
    }

    public void removerSeExistir(String chaveArmazenamento) {
        try {
            Files.deleteIfExists(resolver(chaveArmazenamento));
        } catch (IOException ignored) {
            // O metadado nao deve ficar preso a falha de limpeza de arquivo recem-criado.
        }
    }

    public String caminhoConfigurado() {
        return diretorioBase.toString();
    }

    private void criarDiretorio() {
        try {
            Files.createDirectories(diretorioBase);
        } catch (IOException ex) {
            throw new IllegalStateException("Nao foi possivel criar o diretorio privado de documentos.", ex);
        }
    }

    private Path resolver(String chaveArmazenamento) {
        if (chaveArmazenamento == null || chaveArmazenamento.isBlank()
                || chaveArmazenamento.contains("/") || chaveArmazenamento.contains("\\")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chave de armazenamento invalida.");
        }

        Path resolvido = diretorioBase.resolve(chaveArmazenamento).normalize();
        if (!resolvido.startsWith(diretorioBase)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Caminho de documento invalido.");
        }
        return resolvido;
    }

    public record ArquivoArmazenado(String chaveArmazenamento, Path caminho) {}
}
