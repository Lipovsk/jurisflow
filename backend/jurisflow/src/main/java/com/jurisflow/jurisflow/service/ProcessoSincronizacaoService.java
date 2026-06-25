package com.jurisflow.jurisflow.service;

import com.jurisflow.jurisflow.model.Compromisso;
import com.jurisflow.jurisflow.model.Honorario;
import com.jurisflow.jurisflow.model.Processo;
import com.jurisflow.jurisflow.repository.CompromissoRepository;
import com.jurisflow.jurisflow.repository.HonorarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;

@Service
public class ProcessoSincronizacaoService {

    private static final String CHAVE_AUDIENCIA = "PROCESSO_AUDIENCIA_";
    private static final String CHAVE_PRAZO = "PROCESSO_PRAZO_";
    private static final String CHAVE_HONORARIO = "PROCESSO_HONORARIO_";

    private final CompromissoRepository compromissoRepository;
    private final HonorarioRepository honorarioRepository;

    public ProcessoSincronizacaoService(
            CompromissoRepository compromissoRepository,
            HonorarioRepository honorarioRepository
    ) {
        this.compromissoRepository = compromissoRepository;
        this.honorarioRepository = honorarioRepository;
    }

    @Transactional
    public void sincronizar(Processo processo) {
        if (processo == null || processo.getId() == null) {
            throw new IllegalArgumentException("Processo persistido e obrigatorio para sincronizacao.");
        }

        if (processo.getCliente() == null) {
            removerAutomaticos(processo);
            return;
        }

        sincronizarAudiencia(processo);
        sincronizarPrazo(processo);
        sincronizarHonorario(processo);
    }

    private void sincronizarAudiencia(Processo processo) {
        String chave = chaveAudiencia(processo);
        sincronizarCompromisso(
                processo,
                chave,
                processo.getDataAudiencia(),
                "audiencia",
                "Audiencia do processo " + numeroProcesso(processo),
                "Compromisso de audiencia gerado automaticamente pelo processo "
                        + numeroProcesso(processo) + "."
        );
    }

    private void sincronizarPrazo(Processo processo) {
        String chave = chavePrazo(processo);
        sincronizarCompromisso(
                processo,
                chave,
                processo.getPrazoFinal(),
                "prazo",
                "Prazo do processo " + numeroProcesso(processo),
                "Compromisso de prazo gerado automaticamente pelo processo "
                        + numeroProcesso(processo) + "."
        );
    }

    private void sincronizarCompromisso(
            Processo processo,
            String chave,
            String data,
            String tipo,
            String titulo,
            String descricao
    ) {
        if (isBlank(data)) {
            removerCompromissoAutomatico(chave);
            return;
        }

        Compromisso compromisso = compromissoRepository.findByChaveIntegracao(chave)
                .orElseGet(Compromisso::new);

        compromisso.setTitulo(titulo);
        compromisso.setTipo(tipo);
        compromisso.setData(data.trim());
        compromisso.setHora(null);
        compromisso.setDescricao(descricao);
        compromisso.setStatus("agendado");
        compromisso.setPrioridade(valorOuNull(processo.getPrioridade()));
        compromisso.setCliente(processo.getCliente());
        compromisso.setProcesso(processo);
        compromisso.setOrigem(Compromisso.ORIGEM_PROCESSO_AUTOMATICO);
        compromisso.setChaveIntegracao(chave);

        compromissoRepository.save(compromisso);
    }

    private void sincronizarHonorario(Processo processo) {
        String chave = chaveHonorario(processo);
        Double valorHonorario = processo.getValorHonorario();

        if (valorHonorario == null || valorHonorario <= 0) {
            removerHonorarioAutomatico(chave);
            return;
        }

        Honorario honorario = honorarioRepository.findByChaveIntegracao(chave)
                .orElseGet(Honorario::new);

        honorario.setTipoHonorario(tipoHonorario(processo.getFormaPagamento()));
        honorario.setValorTotal(valorHonorario);
        honorario.setCompetencia(competencia(processo.getVencimentoHonorario()));
        honorario.setStatus(statusHonorario(processo.getStatusFinanceiro()));
        honorario.setFormaPagamento(valorOuNull(processo.getFormaPagamento()));
        honorario.setDescricao("Honorario gerado automaticamente pelo processo "
                + numeroProcesso(processo) + ".");
        honorario.setCliente(processo.getCliente());
        honorario.setProcesso(processo);
        honorario.setOrigem(Honorario.ORIGEM_PROCESSO_AUTOMATICO);
        honorario.setChaveIntegracao(chave);

        honorarioRepository.save(honorario);
    }

    @Transactional
    public void removerRegistrosAutomaticosDoProcesso(Processo processo) {
        if (processo == null || processo.getId() == null) {
            throw new IllegalArgumentException("Processo persistido e obrigatorio para remocao automatica.");
        }

        removerCompromissoAutomatico(chaveAudiencia(processo));
        removerCompromissoAutomatico(chavePrazo(processo));
        removerHonorarioAutomatico(chaveHonorario(processo));
    }

    public boolean isCompromissoAutomaticoSeguroDoProcesso(Processo processo, Compromisso compromisso) {
        if (processo == null || processo.getId() == null || compromisso == null) {
            return false;
        }

        return Compromisso.ORIGEM_PROCESSO_AUTOMATICO.equals(compromisso.getOrigem())
                && chavesCompromissosDoProcesso(processo).contains(compromisso.getChaveIntegracao());
    }

    public boolean isHonorarioAutomaticoSeguroDoProcesso(Processo processo, Honorario honorario) {
        if (processo == null || processo.getId() == null || honorario == null) {
            return false;
        }

        return Honorario.ORIGEM_PROCESSO_AUTOMATICO.equals(honorario.getOrigem())
                && chaveHonorario(processo).equals(honorario.getChaveIntegracao());
    }

    private void removerAutomaticos(Processo processo) {
        removerRegistrosAutomaticosDoProcesso(processo);
    }

    private void removerCompromissoAutomatico(String chave) {
        compromissoRepository.findByChaveIntegracao(chave)
                .filter(compromisso -> Compromisso.ORIGEM_PROCESSO_AUTOMATICO.equals(compromisso.getOrigem()))
                .ifPresent(compromissoRepository::delete);
    }

    private void removerHonorarioAutomatico(String chave) {
        honorarioRepository.findByChaveIntegracao(chave)
                .filter(honorario -> Honorario.ORIGEM_PROCESSO_AUTOMATICO.equals(honorario.getOrigem()))
                .ifPresent(honorarioRepository::delete);
    }

    private Set<String> chavesCompromissosDoProcesso(Processo processo) {
        return Set.of(chaveAudiencia(processo), chavePrazo(processo));
    }

    private String chaveAudiencia(Processo processo) {
        return CHAVE_AUDIENCIA + processo.getId();
    }

    private String chavePrazo(Processo processo) {
        return CHAVE_PRAZO + processo.getId();
    }

    private String chaveHonorario(Processo processo) {
        return CHAVE_HONORARIO + processo.getId();
    }

    private String tipoHonorario(String formaPagamento) {
        String valor = normalizar(formaPagamento);

        if (valor.contains("exito")) {
            return "exito";
        }

        if (valor.contains("mensal")) {
            return "retainer";
        }

        if (valor.contains("contrato fixo")) {
            return "fixo";
        }

        return null;
    }

    private String competencia(String vencimentoHonorario) {
        String valor = valorOuNull(vencimentoHonorario);

        if (valor == null) {
            return null;
        }

        if (valor.matches("\\d{4}-\\d{2}-\\d{2}") || valor.matches("\\d{4}-\\d{2}")) {
            return valor.substring(0, 7);
        }

        return null;
    }

    private String statusHonorario(String statusFinanceiro) {
        String valor = normalizar(statusFinanceiro);

        if (valor.equals("em dia") || valor.equals("quitado") || valor.equals("pago")) {
            return "pago";
        }

        if (valor.equals("parcialmente pago") || valor.equals("parcial")) {
            return "parcial";
        }

        if (valor.equals("pendente")) {
            return "pendente";
        }

        if (valor.equals("inadimplente") || valor.equals("atrasado")) {
            return "inadimpl";
        }

        return null;
    }

    private String numeroProcesso(Processo processo) {
        return valorOuNull(processo.getNumero()) != null
                ? processo.getNumero().trim()
                : "#" + processo.getId();
    }

    private String valorOuNull(String valor) {
        return isBlank(valor) ? null : valor.trim();
    }

    private boolean isBlank(String valor) {
        return valor == null || valor.isBlank();
    }

    private String normalizar(String valor) {
        if (valor == null) {
            return "";
        }

        return Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('_', ' ')
                .replace('-', ' ')
                .trim()
                .replaceAll("\\s+", " ")
                .toLowerCase(Locale.ROOT);
    }
}
