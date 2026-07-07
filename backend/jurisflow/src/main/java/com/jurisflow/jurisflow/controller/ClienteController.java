package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.Cliente;
import com.jurisflow.jurisflow.repository.ClienteRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteRepository clienteRepository;

    public ClienteController(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
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
        return clienteRepository.findById(id).orElse(null);
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
        }).orElse(null);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        clienteRepository.deleteById(id);
    }
}
