package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.service.RecebimentoHonorarioService;
import com.jurisflow.jurisflow.service.RecebimentoHonorarioService.CancelamentoRecebimentoRequest;
import com.jurisflow.jurisflow.service.RecebimentoHonorarioService.RecebimentoHonorarioRequest;
import com.jurisflow.jurisflow.service.RecebimentoHonorarioService.RecebimentoHonorarioResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/recebimentos")
public class RecebimentoHonorarioController {

    private final RecebimentoHonorarioService recebimentoHonorarioService;

    public RecebimentoHonorarioController(RecebimentoHonorarioService recebimentoHonorarioService) {
        this.recebimentoHonorarioService = recebimentoHonorarioService;
    }

    @GetMapping
    public List<RecebimentoHonorarioResponse> listarTodos() {
        return recebimentoHonorarioService.listarTodos();
    }

    @GetMapping("/honorario/{honorarioId}")
    public List<RecebimentoHonorarioResponse> listarPorHonorario(@PathVariable Long honorarioId) {
        return recebimentoHonorarioService.listarPorHonorario(honorarioId);
    }

    @PostMapping("/honorario/{honorarioId}")
    @ResponseStatus(HttpStatus.CREATED)
    public RecebimentoHonorarioResponse registrar(
            @PathVariable Long honorarioId,
            @RequestBody RecebimentoHonorarioRequest request
    ) {
        return recebimentoHonorarioService.registrar(honorarioId, request);
    }

    @PostMapping("/{id}/cancelar")
    public RecebimentoHonorarioResponse cancelar(
            @PathVariable Long id,
            @RequestBody CancelamentoRecebimentoRequest request
    ) {
        return recebimentoHonorarioService.cancelar(id, request);
    }
}
