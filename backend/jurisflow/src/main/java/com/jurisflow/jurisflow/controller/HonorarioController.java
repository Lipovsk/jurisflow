package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.Cliente;
import com.jurisflow.jurisflow.model.Honorario;
import com.jurisflow.jurisflow.model.Processo;
import com.jurisflow.jurisflow.repository.ClienteRepository;
import com.jurisflow.jurisflow.repository.HonorarioRepository;
import com.jurisflow.jurisflow.repository.ProcessoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/honorarios")
public class HonorarioController {

    private static final String REGISTRO_GERENCIADO_PELO_PROCESSO =
            "Este registro e gerenciado pelo processo vinculado. Edite o processo para altera-lo.";

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
        return honorarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Honorario nao encontrado."
                ));
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
        Cliente cliente = buscarClienteObrigatorio(request.getClienteId());
        Processo processo = buscarProcessoOpcional(request.getProcessoId(), cliente);

        Honorario honorario = new Honorario();

        honorario.setTipoHonorario(request.getTipoHonorario());
        honorario.setCompetencia(request.getCompetencia());
        honorario.setStatus(request.getStatus());
        honorario.setFormaPagamento(request.getFormaPagamento());
        honorario.setDescricao(request.getDescricao());
        honorario.setResponsavel(request.getResponsavel());
        honorario.setObservacoesInternas(request.getObservacoesInternas());
        honorario.setCliente(cliente);
        honorario.setProcesso(processo);
        honorario.setOrigem(Honorario.ORIGEM_MANUAL);
        honorario.setChaveIntegracao(null);
        aplicarValores(honorario, request, true);

        return honorarioRepository.save(honorario);
    }

    @PutMapping("/{id}")
    public Honorario atualizar(@PathVariable Long id, @RequestBody HonorarioRequest request) {
        Honorario honorario = honorarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Honorario nao encontrado."
                ));

        bloquearSeGerenciadoPeloProcesso(honorario);

        Cliente cliente = request.getClienteId() != null
                ? buscarClienteExistente(request.getClienteId())
                : honorario.getCliente();

        Processo processo = request.getProcessoId() != null
                ? buscarProcessoExistente(request.getProcessoId())
                : honorario.getProcesso();

        validarProcessoDoCliente(processo, cliente);

        honorario.setTipoHonorario(request.getTipoHonorario());
        honorario.setCompetencia(request.getCompetencia());
        honorario.setStatus(request.getStatus());
        honorario.setFormaPagamento(request.getFormaPagamento());
        honorario.setDescricao(request.getDescricao());
        honorario.setResponsavel(request.getResponsavel());
        honorario.setObservacoesInternas(request.getObservacoesInternas());
        honorario.setCliente(cliente);
        honorario.setProcesso(processo);
        aplicarValores(honorario, request, false);

        return honorarioRepository.save(honorario);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        honorarioRepository.findById(id).ifPresent(honorario -> {
            bloquearSeGerenciadoPeloProcesso(honorario);
            honorarioRepository.delete(honorario);
        });
    }

    private Cliente buscarClienteObrigatorio(Long clienteId) {
        if (clienteId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "clienteId e obrigatorio para criar honorario."
            );
        }

        return buscarClienteExistente(clienteId);
    }

    private Cliente buscarClienteExistente(Long clienteId) {
        return clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cliente informado nao existe."
                ));
    }

    private Processo buscarProcessoOpcional(Long processoId, Cliente cliente) {
        if (processoId == null) {
            return null;
        }

        Processo processo = buscarProcessoExistente(processoId);
        validarProcessoDoCliente(processo, cliente);
        return processo;
    }

    private Processo buscarProcessoExistente(Long processoId) {
        return processoRepository.findById(processoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Processo informado nao existe."
                ));
    }

    private void validarProcessoDoCliente(Processo processo, Cliente cliente) {
        if (processo == null) {
            return;
        }

        if (cliente == null || cliente.getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Honorario com processo vinculado precisa ter cliente."
            );
        }

        if (processo.getCliente() == null || processo.getCliente().getId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Processo informado nao possui cliente vinculado."
            );
        }

        if (!Objects.equals(processo.getCliente().getId(), cliente.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Processo informado nao pertence ao cliente informado."
            );
        }
    }

    private void aplicarValores(Honorario honorario, HonorarioRequest request, boolean criacao) {
        BigDecimal valorBruto = primeiroValorNaoNulo(
                request.getValorBruto(),
                request.getValorTotal(),
                criacao ? null : honorario.getValorBruto(),
                criacao ? null : honorario.getValorTotal()
        );

        if (valorBruto == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe valorBruto ou valorTotal para o honorario."
            );
        }

        BigDecimal desconto = primeiroValorNaoNulo(
                request.getDesconto(),
                criacao ? null : honorario.getDesconto(),
                BigDecimal.ZERO
        );

        BigDecimal acrescimos = primeiroValorNaoNulo(
                request.getAcrescimos(),
                criacao ? null : honorario.getAcrescimos(),
                BigDecimal.ZERO
        );

        valorBruto = moeda(valorBruto);
        desconto = moeda(desconto);
        acrescimos = moeda(acrescimos);

        BigDecimal valorTotal = moeda(valorBruto.subtract(desconto).add(acrescimos));

        if (valorTotal.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Valor total do honorario nao pode ser negativo."
            );
        }

        honorario.setValorBruto(valorBruto);
        honorario.setDesconto(desconto);
        honorario.setAcrescimos(acrescimos);
        honorario.setValorTotal(valorTotal);
    }

    private BigDecimal primeiroValorNaoNulo(BigDecimal... valores) {
        for (BigDecimal valor : valores) {
            if (valor != null) {
                return valor;
            }
        }

        return null;
    }

    private BigDecimal moeda(BigDecimal valor) {
        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    private void bloquearSeGerenciadoPeloProcesso(Honorario honorario) {
        if (isGerenciadoPeloProcesso(honorario)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    REGISTRO_GERENCIADO_PELO_PROCESSO
            );
        }
    }

    private boolean isGerenciadoPeloProcesso(Honorario honorario) {
        return Honorario.ORIGEM_PROCESSO_AUTOMATICO.equals(honorario.getOrigem())
                || temTexto(honorario.getChaveIntegracao());
    }

    private boolean temTexto(String valor) {
        return valor != null && !valor.isBlank();
    }

    public static class HonorarioRequest {
        private String tipoHonorario;
        private BigDecimal valorBruto;
        private BigDecimal desconto;
        private BigDecimal acrescimos;
        private BigDecimal valorTotal;
        private String competencia;
        private String status;
        private String formaPagamento;
        private String descricao;
        private String responsavel;
        private String observacoesInternas;
        private Long clienteId;
        private Long processoId;

        public String getTipoHonorario() {
            return tipoHonorario;
        }

        public void setTipoHonorario(String tipoHonorario) {
            this.tipoHonorario = tipoHonorario;
        }

        public BigDecimal getValorBruto() {
            return valorBruto;
        }

        public void setValorBruto(BigDecimal valorBruto) {
            this.valorBruto = valorBruto;
        }

        public BigDecimal getDesconto() {
            return desconto;
        }

        public void setDesconto(BigDecimal desconto) {
            this.desconto = desconto;
        }

        public BigDecimal getAcrescimos() {
            return acrescimos;
        }

        public void setAcrescimos(BigDecimal acrescimos) {
            this.acrescimos = acrescimos;
        }

        public BigDecimal getValorTotal() {
            return valorTotal;
        }

        public void setValorTotal(BigDecimal valorTotal) {
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

        public String getResponsavel() {
            return responsavel;
        }

        public void setResponsavel(String responsavel) {
            this.responsavel = responsavel;
        }

        public String getObservacoesInternas() {
            return observacoesInternas;
        }

        public void setObservacoesInternas(String observacoesInternas) {
            this.observacoesInternas = observacoesInternas;
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
