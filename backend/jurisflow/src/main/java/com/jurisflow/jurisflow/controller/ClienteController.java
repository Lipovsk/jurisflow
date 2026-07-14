package com.jurisflow.jurisflow.controller;

import com.jurisflow.jurisflow.model.Cliente;
import com.jurisflow.jurisflow.repository.ClienteRepository;
import com.jurisflow.jurisflow.security.UsuarioAutenticado;
import com.jurisflow.jurisflow.service.AuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
@PreAuthorize("hasAnyRole('ADMIN','ADVOGADO','ASSISTENTE')")
public class ClienteController {

    private final ClienteRepository clienteRepository;
    private final AuditoriaService auditoriaService;

    public ClienteController(ClienteRepository clienteRepository, AuditoriaService auditoriaService) {
        this.clienteRepository = clienteRepository;
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    public List<Cliente> listar(@RequestParam(required = false, defaultValue = "false") boolean incluirInativos) {
        return incluirInativos ? clienteRepository.findAll() : clienteRepository.findAllAtivos();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','ADVOGADO')")
    public Cliente criar(
            @RequestBody Cliente cliente,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UsuarioAutenticado usuario = principal(authentication);
        try {
            cliente.setId(null);
            cliente.setDataCadastro(null);
            cliente.setAtivo(true);
            cliente.setDataExclusao(null);
            cliente.setMotivoExclusao(null);
            Cliente salvo = clienteRepository.save(cliente);
            auditoriaService.registrarSucesso(usuario, "CRIAR_CLIENTE", "CLIENTE", salvo.getId(), "Cliente criado.", httpRequest);
            return salvo;
        } catch (RuntimeException ex) {
            auditoriaService.registrarFalha(usuario, "CRIAR_CLIENTE", "CLIENTE", null, "Falha ao criar cliente.", httpRequest);
            throw ex;
        }
    }

    @GetMapping("/{id}")
    public Cliente buscarPorId(@PathVariable Long id) {
        return clienteRepository.findAtivoById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado."));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ADVOGADO')")
    public Cliente atualizar(
            @PathVariable Long id,
            @RequestBody Cliente clienteAtualizado,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UsuarioAutenticado usuario = principal(authentication);
        try {
            Cliente salvo = clienteRepository.findAtivoById(id).map(cliente -> {
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
            auditoriaService.registrarSucesso(usuario, "EDITAR_CLIENTE", "CLIENTE", id, "Cliente atualizado.", httpRequest);
            return salvo;
        } catch (RuntimeException ex) {
            auditoriaService.registrarFalha(usuario, "EDITAR_CLIENTE", "CLIENTE", id, "Falha ao atualizar cliente.", httpRequest);
            throw ex;
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','ADVOGADO')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(
            @PathVariable Long id,
            @RequestParam(required = false) String motivoExclusao,
            Authentication authentication,
            HttpServletRequest httpRequest
    ) {
        UsuarioAutenticado usuario = principal(authentication);
        try {
            Cliente cliente = clienteRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente nao encontrado."));

            if (!Boolean.FALSE.equals(cliente.getAtivo())) {
                cliente.setAtivo(false);
                cliente.setDataExclusao(Instant.now());
                cliente.setMotivoExclusao(textoOuNull(motivoExclusao));
                clienteRepository.save(cliente);
            }
            auditoriaService.registrarSucesso(usuario, "ARQUIVAR_CLIENTE", "CLIENTE", id, "Cliente arquivado.", httpRequest);
        } catch (RuntimeException ex) {
            auditoriaService.registrarFalha(usuario, "ARQUIVAR_CLIENTE", "CLIENTE", id, "Falha ao arquivar cliente.", httpRequest);
            throw ex;
        }
    }

    private UsuarioAutenticado principal(Authentication authentication) {
        return authentication != null && authentication.getPrincipal() instanceof UsuarioAutenticado usuario ? usuario : null;
    }

    private String textoOuNull(String valor) {
        String texto = valor == null ? null : valor.trim();
        return texto == null || texto.isBlank() ? null : texto;
    }
}
