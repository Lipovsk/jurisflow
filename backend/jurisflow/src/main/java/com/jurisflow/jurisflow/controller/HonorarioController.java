package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.Cliente;
import com.jurisflow.jurisflow.model.Honorario;
import com.jurisflow.jurisflow.model.Processo;
import com.jurisflow.jurisflow.repository.ClienteRepository;
import com.jurisflow.jurisflow.repository.HonorarioRepository;
import com.jurisflow.jurisflow.repository.ProcessoRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/honorarios")
@CrossOrigin(origins = "*")
public class HonorarioController {

    private final HonorarioRepository honorarioRepository;
    private final ClienteRepository clienteRepository;
    private final ProcessoRepository processoRepository;

    public HonorarioController(
            HonorarioRepository honorarioRepository,
            ClienteRepository clienteRepository,
            ProcessoRepository processoRepository
    ) {
        this.honorarioRepository = honorarioRepository;
        this.clienteRepository = clienteRepository;
        this.processoRepository = processoRepository;
    }

    @GetMapping
    public List<Honorario> listar() {
        return honorarioRepository.findAll();
    }

    @GetMapping("/{id}")
    public Honorario buscarPorId(@PathVariable Long id) {
        return honorarioRepository.findById(id).orElse(null);
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Honorario> listarPorCliente(@PathVariable Long clienteId) {
        return honorarioRepository.findByClienteId(clienteId);
    }

    @GetMapping("/processo/{processoId}")
    public List<Honorario> listarPorProcesso(@PathVariable Long processoId) {
        return honorarioRepository.findByProcessoId(processoId);
    }

    @PostMapping
    public Honorario criar(@RequestBody HonorarioRequest request) {
        Cliente cliente = null;
        Processo processo = null;

        if (request.getClienteId() != null) {
            cliente = clienteRepository.findById(request.getClienteId()).orElse(null);
        }

        if (request.getProcessoId() != null) {
            processo = processoRepository.findById(request.getProcessoId()).orElse(null);
        }

        Honorario honorario = new Honorario();

        honorario.setTipoHonorario(request.getTipoHonorario());
        honorario.setValorTotal(request.getValorTotal());
        honorario.setCompetencia(request.getCompetencia());
        honorario.setStatus(request.getStatus());
        honorario.setFormaPagamento(request.getFormaPagamento());
        honorario.setDescricao(request.getDescricao());
        honorario.setCliente(cliente);
        honorario.setProcesso(processo);

        return honorarioRepository.save(honorario);
    }

    @PutMapping("/{id}")
    public Honorario atualizar(@PathVariable Long id, @RequestBody HonorarioRequest request) {
        return honorarioRepository.findById(id).map(honorario -> {

            Cliente cliente = null;
            Processo processo = null;

            if (request.getClienteId() != null) {
                cliente = clienteRepository.findById(request.getClienteId()).orElse(null);
            }

            if (request.getProcessoId() != null) {
                processo = processoRepository.findById(request.getProcessoId()).orElse(null);
            }

            honorario.setTipoHonorario(request.getTipoHonorario());
            honorario.setValorTotal(request.getValorTotal());
            honorario.setCompetencia(request.getCompetencia());
            honorario.setStatus(request.getStatus());
            honorario.setFormaPagamento(request.getFormaPagamento());
            honorario.setDescricao(request.getDescricao());

            if (cliente != null) {
                honorario.setCliente(cliente);
            }

            if (processo != null) {
                honorario.setProcesso(processo);
            }

            return honorarioRepository.save(honorario);

        }).orElse(null);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        honorarioRepository.deleteById(id);
    }

    public static class HonorarioRequest {
        private String tipoHonorario;
        private Double valorTotal;
        private String competencia;
        private String status;
        private String formaPagamento;
        private String descricao;
        private Long clienteId;
        private Long processoId;

        public String getTipoHonorario() {
            return tipoHonorario;
        }

        public void setTipoHonorario(String tipoHonorario) {
            this.tipoHonorario = tipoHonorario;
        }

        public Double getValorTotal() {
            return valorTotal;
        }

        public void setValorTotal(Double valorTotal) {
            this.valorTotal = valorTotal;
        }

        public String getCompetencia() {
            return competencia;
        }

        public void setCompetencia(String competencia) {
            this.competencia = competencia;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getFormaPagamento() {
            return formaPagamento;
        }

        public void setFormaPagamento(String formaPagamento) {
            this.formaPagamento = formaPagamento;
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

        public Long getProcessoId() {
            return processoId;
        }

        public void setProcessoId(Long processoId) {
            this.processoId = processoId;
        }
    }
}
