package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.Cliente;
import com.jurisflow.jurisflow.repository.ClienteRepository;
import com.jurisflow.jurisflow.service.DocumentoService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteRepository clienteRepository;
    private final DocumentoService documentoService;

    public ClienteController(ClienteRepository clienteRepository, DocumentoService documentoService) {
        this.clienteRepository = clienteRepository;
        this.documentoService = documentoService;
    }

    @GetMapping
    public List<Cliente> listar() {
        return clienteRepository.findAll();
    }

    @PostMapping
    public Cliente criar(@RequestBody Cliente cliente) {
        cliente.setId(null);
        cliente.setDataCadastro(null);
        return clienteRepository.save(cliente);
    }

    @GetMapping("/{id}")
    public Cliente buscarPorId(@PathVariable Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado."));
    }

    @PutMapping("/{id}")
    public Cliente atualizar(@PathVariable Long id, @RequestBody Cliente clienteAtualizado) {
        return clienteRepository.findById(id).map(cliente -> {
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
    public void deletar(@PathVariable Long id) {
        if (!clienteRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado.");
        }
        if (documentoService.existeDocumentoPorCliente(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Não é possível excluir este cliente porque existem documentos vinculados ao histórico dele."
            );
        }
        clienteRepository.deleteById(id);
    }
}
