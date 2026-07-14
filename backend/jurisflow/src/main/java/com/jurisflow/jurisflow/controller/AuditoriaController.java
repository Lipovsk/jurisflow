package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.dto.auditoria.AuditoriaResponse;
import com.jurisflow.jurisflow.service.AuditoriaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/auditoria")
@PreAuthorize("hasRole('ADMIN')")
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    public AuditoriaController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    public List<AuditoriaResponse> listar(
            @RequestParam(required = false) String acao,
            @RequestParam(required = false) String entidade,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) Boolean sucesso,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant dataInicial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant dataFinal,
            @RequestParam(required = false, defaultValue = "100") int limite
    ) {
        int limiteSeguro = Math.min(500, Math.max(1, limite));
        return auditoriaService.listar(acao, entidade, usuarioId, sucesso, dataInicial, dataFinal, limiteSeguro);
    }
}
