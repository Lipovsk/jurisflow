package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.Cliente;
import com.jurisflow.jurisflow.repository.ClienteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteRepository clienteRepository;

    public ClienteController(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @GetMapping
    public List<Cliente> listar(@RequestParam(required = false, defaultValue = "false") boolean incluirInativos) {
        return incluirInativos ? clienteRepository.findAll() : clienteRepository.findAllAtivos();
    }

    @PostMapping
    public Cliente criar(@RequestBody Cliente cliente) {
        cliente.setId(null);
        cliente.setDataCadastro(null);
        cliente.setAtivo(true);
        cliente.setDataExclusao(null);
        cliente.setMotivoExclusao(null);
        return clienteRepository.save(cliente);
    }

    @GetMapping("/{id}")
    public Cliente buscarPorId(@PathVariable Long id) {
        return clienteRepository.findAtivoById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado."));
    }

    @PutMapping("/{id}")
    public Cliente atualizar(@PathVariable Long id, @RequestBody Cliente clienteAtualizado) {
        return clienteRepository.findAtivoById(id).map(cliente -> {
            cliente.setNome(clienteAtualizado.getNome());
            cliente.setCpfCnpj(clienteAtualizado.getCpfCnpj());
            cliente.setTelefone(clienteAtualizado.getTelefone());
            cliente.setEmail(clienteAtualizado.getEmail());
            cliente.setEndereco(clienteAtualizado.getEndereco());
            cliente.setStatus(clienteAtualizado.getStatus());
            cliente.setAreaJuridica(clienteAtualizado.getAreaJuridica());
            cliente.setTipoCliente(clienteAtualizado.getTipoCliente());
            cliente.setRg(clienteAtualizado.getRg());
            cliente.setDataNascimento(clienteAtualizado.getDataNascimento());
            cliente.setSexo(clienteAtualizado.getSexo());
            cliente.setEstadoCivil(clienteAtualizado.getEstadoCivil());
            cliente.setProfissao(clienteAtualizado.getProfissao());
            cliente.setTelefoneSecundario(clienteAtualizado.getTelefoneSecundario());
            cliente.setWhatsapp(clienteAtualizado.getWhatsapp());
            cliente.setCep(clienteAtualizado.getCep());
            cliente.setBairro(clienteAtualizado.getBairro());
            cliente.setCidade(clienteAtualizado.getCidade());
            cliente.setEstado(clienteAtualizado.getEstado());
            cliente.setComplemento(clienteAtualizado.getComplemento());
            cliente.setObsRapida(clienteAtualizado.getObsRapida());
            cliente.setObservacoes(clienteAtualizado.getObservacoes());
            return clienteRepository.save(cliente);
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado."));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(
            @PathVariable Long id,
            @RequestParam(required = false) String motivoExclusao
    ) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado."));

        if (Boolean.FALSE.equals(cliente.getAtivo())) {
            return;
        }

        cliente.setAtivo(false);
        cliente.setDataExclusao(Instant.now());
        cliente.setMotivoExclusao(textoOuNull(motivoExclusao));
        clienteRepository.save(cliente);
    }

    private String textoOuNull(String valor) {
        String texto = valor == null ? null : valor.trim();
        return texto == null || texto.isBlank() ? null : texto;
    }
}
