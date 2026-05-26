package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.Cliente;
import com.jurisflow.jurisflow.model.Processo;
import com.jurisflow.jurisflow.repository.ClienteRepository;
import com.jurisflow.jurisflow.repository.ProcessoRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/processos")
@CrossOrigin(origins = "*")
public class ProcessoController {

    private final ProcessoRepository processoRepository;
    private final ClienteRepository clienteRepository;

    public ProcessoController(ProcessoRepository processoRepository, ClienteRepository clienteRepository) {
        this.processoRepository = processoRepository;
        this.clienteRepository = clienteRepository;
    }

    @GetMapping
    public List<Processo> listar() {
        return processoRepository.findAll();
    }

    @GetMapping("/{id}")
    public Processo buscarPorId(@PathVariable Long id) {
        return processoRepository.findById(id).orElse(null);
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Processo> listarPorCliente(@PathVariable Long clienteId) {
        return processoRepository.findByClienteId(clienteId);
    }

    @PostMapping
    public Processo criar(@RequestBody ProcessoRequest request) {
        Cliente cliente = clienteRepository.findById(request.getClienteId()).orElse(null);

        Processo processo = new Processo();
        processo.setNumero(request.getNumero());
        processo.setTipoAcao(request.getTipoAcao());
        processo.setAreaJuridica(request.getAreaJuridica());
        processo.setStatus(request.getStatus());
        processo.setDescricao(request.getDescricao());
        processo.setCliente(cliente);

        return processoRepository.save(processo);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        processoRepository.deleteById(id);
    }

    public static class ProcessoRequest {
        private String numero;
        private String tipoAcao;
        private String areaJuridica;
        private String status;
        private String descricao;
        private Long clienteId;

        public String getNumero() {
            return numero;
        }

        public void setNumero(String numero) {
            this.numero = numero;
        }

        public String getTipoAcao() {
            return tipoAcao;
        }

        public void setTipoAcao(String tipoAcao) {
            this.tipoAcao = tipoAcao;
        }

        public String getAreaJuridica() {
            return areaJuridica;
        }

        public void setAreaJuridica(String areaJuridica) {
            this.areaJuridica = areaJuridica;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getDescricao() {
            return descricao;
        }

        public void setDescricao(String descricao) {
            this.descricao = descricao;
        }

        public Long getClienteId() {
            return clienteId;
        }

        public void setClienteId(Long clienteId) {
            this.clienteId = clienteId;
        }
    }
}