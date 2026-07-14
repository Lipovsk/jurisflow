package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.Cliente;
import com.jurisflow.jurisflow.model.Compromisso;
import com.jurisflow.jurisflow.model.Processo;
import com.jurisflow.jurisflow.repository.ClienteRepository;
import com.jurisflow.jurisflow.repository.CompromissoRepository;
import com.jurisflow.jurisflow.repository.ProcessoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/compromissos")
@PreAuthorize("hasAnyRole('ADMIN','ADVOGADO','ASSISTENTE')")
public class CompromissoController {

    private static final String REGISTRO_GERENCIADO_PELO_PROCESSO =
            "Este registro e gerenciado pelo processo vinculado. Edite o processo para altera-lo.";

    private final CompromissoRepository compromissoRepository;
    private final ClienteRepository clienteRepository;
    private final ProcessoRepository processoRepository;

    public CompromissoController(
            CompromissoRepository compromissoRepository,
            ClienteRepository clienteRepository,
            ProcessoRepository processoRepository
    ) {
        this.compromissoRepository = compromissoRepository;
        this.clienteRepository = clienteRepository;
        this.processoRepository = processoRepository;
    }

    @GetMapping
    public List<Compromisso> listar() {
        return compromissoRepository.findAll();
    }

    @GetMapping("/{id}")
    public Compromisso buscarPorId(@PathVariable Long id) {
        return compromissoRepository.findById(id).orElse(null);
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Compromisso> listarPorCliente(@PathVariable Long clienteId) {
        return compromissoRepository.findByClienteId(clienteId);
    }

    @GetMapping("/processo/{processoId}")
    public List<Compromisso> listarPorProcesso(@PathVariable Long processoId) {
        return compromissoRepository.findByProcessoId(processoId);
    }

    @PostMapping
    public Compromisso criar(@RequestBody CompromissoRequest request) {
        Cliente cliente = null;
        Processo processo = null;

        if (request.getClienteId() != null) {
            cliente = clienteRepository.findById(request.getClienteId()).orElse(null);
        }

        if (request.getProcessoId() != null) {
            processo = processoRepository.findById(request.getProcessoId()).orElse(null);
        }

        Compromisso compromisso = new Compromisso();

        compromisso.setTitulo(request.getTitulo());
        compromisso.setTipo(request.getTipo());
        compromisso.setData(request.getData());
        compromisso.setHora(request.getHora());
        compromisso.setDescricao(request.getDescricao());
        compromisso.setStatus(request.getStatus());
        compromisso.setPrioridade(request.getPrioridade());
        compromisso.setCliente(cliente);
        compromisso.setProcesso(processo);
        compromisso.setOrigem(Compromisso.ORIGEM_MANUAL);
        compromisso.setChaveIntegracao(null);

        return compromissoRepository.save(compromisso);
    }

    @PutMapping("/{id}")
    public Compromisso atualizar(@PathVariable Long id, @RequestBody CompromissoRequest request) {
        return compromissoRepository.findById(id).map(compromisso -> {
            bloquearSeGerenciadoPeloProcesso(compromisso);

            compromisso.setTitulo(request.getTitulo());
            compromisso.setTipo(request.getTipo());
            compromisso.setData(request.getData());
            compromisso.setHora(request.getHora());
            compromisso.setDescricao(request.getDescricao());
            compromisso.setStatus(request.getStatus());
            compromisso.setPrioridade(request.getPrioridade());

            if (request.getClienteId() != null) {
                Cliente cliente = clienteRepository.findById(request.getClienteId()).orElse(null);
                compromisso.setCliente(cliente);
            }

            if (request.getProcessoId() != null) {
                Processo processo = processoRepository.findById(request.getProcessoId()).orElse(null);
                compromisso.setProcesso(processo);
            }

            return compromissoRepository.save(compromisso);
        }).orElse(null);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ADVOGADO')")
    public void deletar(@PathVariable Long id) {
        compromissoRepository.findById(id).ifPresent(compromisso -> {
            bloquearSeGerenciadoPeloProcesso(compromisso);
            compromissoRepository.delete(compromisso);
        });
    }

    private void bloquearSeGerenciadoPeloProcesso(Compromisso compromisso) {
        if (isGerenciadoPeloProcesso(compromisso)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    REGISTRO_GERENCIADO_PELO_PROCESSO
            );
        }
    }

    private boolean isGerenciadoPeloProcesso(Compromisso compromisso) {
        return Compromisso.ORIGEM_PROCESSO_AUTOMATICO.equals(compromisso.getOrigem())
                || temTexto(compromisso.getChaveIntegracao());
    }

    private boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    public static class CompromissoRequest {
        private String titulo;
        private String tipo;
        private String data;
        private String hora;
        private String descricao;
        private String status;
        private String prioridade;
        private Long clienteId;
        private Long processoId;

        public String getTitulo() {
            return titulo;
        }

        public void setTitulo(String titulo) {
            this.titulo = titulo;
        }

        public String getTipo() {
            return tipo;
        }

        public void setTipo(String tipo) {
            this.tipo = tipo;
        }

        public String getData() {
            return data;
        }

        public void setData(String data) {
            this.data = data;
        }

        public String getHora() {
            return hora;
        }

        public void setHora(String hora) {
            this.hora = hora;
        }

        public String getDescricao() {
            return descricao;
        }

        public void setDescricao(String descricao) {
            this.descricao = descricao;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getPrioridade() {
            return prioridade;
        }

        public void setPrioridade(String prioridade) {
            this.prioridade = prioridade;
        }

        public Long getClienteId() {
            return clienteId;
        }

        public void setClienteId(Long clienteId) {
            this.clienteId = clienteId;
        }

        public Long getProcessoId() {
            return processoId;
        }

        public void setProcessoId(Long processoId) {
            this.processoId = processoId;
        }
    }
}
