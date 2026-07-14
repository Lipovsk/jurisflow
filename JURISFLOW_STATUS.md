# JURISFLOW_STATUS.md

## Última atualização

14/07/2026 às 17:38 (UTC-03:00, America/Sao_Paulo).

## Estado geral

O JurisFlow está em desenvolvimento avançado. Autenticação, documentos, usuários, backup, auditoria e permissões por perfil já foram implementados e testados nos sprints recentes. O projeto ainda precisa de migrações controladas, ampliação dos testes automatizados e uma revisão final de segurança antes de uso real.

## Ambiente atual

- Frontend: HTML, CSS e JavaScript.
- Backend: Java Spring Boot.
- Banco: PostgreSQL.
- ORM: Spring Data JPA/Hibernate.
- Autenticação: JWT.
- Testes manuais/API: navegador, Postman e PowerShell, quando aplicável.
- Versionamento: Git/GitHub.
- Branch principal: `main`.
- Repositório: <https://github.com/Lipovsk/jurisflow.git>.
- Ambiente do usuário: Windows, VS Code e PowerShell.

## Funcionalidades concluídas

- Cadastro e gerenciamento de clientes.
- Cadastro e gerenciamento de processos.
- PostgreSQL configurado como banco principal.
- Autenticação JWT.
- Proteção de rotas autenticadas.
- Preferências visuais persistentes.
- Exclusão lógica de clientes.
- Exclusão lógica de processos.
- Documentos reais, sem geração de dados fictícios.
- Upload protegido.
- Armazenamento privado de arquivos.
- Metadados de documentos persistidos no PostgreSQL.
- Vínculo de documentos com clientes e processos.
- Limite de upload de 10 MB.
- Download protegido.
- Exclusão lógica de documentos.
- Bloqueio prático da exclusão física nos fluxos de clientes e processos: as operações de exclusão fazem arquivamento lógico e preservam os vínculos com documentos históricos.
- Gerenciamento de usuários.
- Troca da própria senha.
- Reset de senha de terceiros por ADMIN.
- Proteção contra desativar ou rebaixar o último ADMIN ativo.
- Bloqueio de login de usuário inativo.
- Backup manual do PostgreSQL e dos documentos privados.
- Script de restauração com validação e confirmação explícita.
- Auditoria de ações sensíveis.
- Controle de permissões por perfil.
- Identidade dinâmica do usuário autenticado na interface.
- Remoção da busca do topo da Dashboard.
- Desativação em runtime do atalho flutuante, removendo da interface o comportamento arrastável.

## Permissões atuais

- **ADMIN:** acesso total aos recursos administrativos e operacionais.
- **ADVOGADO:** acessa clientes, processos, documentos, agenda/compromissos e financeiro/honorários; não acessa gestão de usuários nem auditoria.
- **ASSISTENTE:** visualiza clientes e processos, envia e baixa documentos e cria/edita compromissos sem poder excluí-los; não acessa financeiro, auditoria nem gestão de usuários.

A matriz detalhada e os endpoints protegidos estão em [docs/PERMISSOES.md](docs/PERMISSOES.md). O backend é a fonte de verdade para autorização; as restrições visuais do frontend servem para melhorar a experiência.

## Funcionalidades parcialmente concluídas ou a verificar

- Validação e normalização mais fortes de campos como área jurídica e tipo de cliente.
- UX específica no frontend para erro de upload acima de 10 MB.
- Revisão geral de telas antigas que ainda possam conter texto fixo, mock residual ou uso legado de `localStorage`.
- Validação visual completa após futuras alterações.
- Testes automatizados mais abrangentes.

## Bugs conhecidos

- O `mvnw.cmd` apresenta um bug local conhecido de `NullArray` em alguns comandos no Windows; a alternativa usada nos sprints recentes foi o Maven instalado pelo próprio wrapper.
- O Git exibe avisos de conversão LF/CRLF no Windows, sem erro real no `git diff --check`.
- Há risco de XSS persistente em trechos da Dashboard e do autocomplete de novo processo que interpolam dados da API em `innerHTML` sem escape; deve ser corrigido antes de uso real.
- O logout possui handlers sobrepostos em `auth.js` e `dashboard.js`; o encerramento imediato da sessão pode ocorrer antes da confirmação visual.
- Uploads acima de 10 MB não têm pré-validação no frontend e podem cair no tratamento genérico do backend, resultando em HTTP 500 e mensagem pouco clara.

## Decisões técnicas

- JWT como mecanismo de autenticação.
- PostgreSQL como banco principal.
- Segredos carregados por variáveis de ambiente.
- Arquivos de documentos armazenados fora de URL pública previsível.
- Exclusão lógica para preservar o histórico jurídico.
- Auditoria de ações sensíveis sem registrar senha, JWT, token ou conteúdo de documento.
- Backend como fonte de verdade para permissões.
- Frontend ocultando ações indisponíveis apenas para melhorar a UX.
- Backup e restauração documentados em [docs/BACKUP_RESTORE.md](docs/BACKUP_RESTORE.md).
- Próximo passo técnico recomendado: migrações controladas com Flyway.

## Testes realizados

Resultados conhecidos dos sprints recentes; o Maven não foi reexecutado nesta atualização exclusivamente documental:

- Build Maven aprovado nos sprints recentes.
- Suíte automatizada existente: 1 teste executado, 0 falhas e 0 erros.
- Testes manuais de autenticação.
- Testes manuais de usuários e troca/reset de senha.
- Testes manuais de documentos.
- Testes manuais de backup.
- Testes manuais de auditoria.
- Testes manuais de permissões por perfil.
- Testes manuais da identidade dinâmica do usuário autenticado.
- Testes manuais de bloqueio de acesso direto.
- Testes de respostas HTTP 403 sem encerramento da sessão.
- `git diff --check` executado nos sprints, com apenas avisos de LF/CRLF.
- `node --check` executado nos arquivos JavaScript alterados, quando aplicável.

## Últimos commits relevantes

Resultado de `git log -12 --oneline` em 14/07/2026:

- `4011a82` — Adiciona controle de permissoes por perfil
- `7867a80` — Adiciona auditoria de acoes sensiveis
- `4175f7b` — Adiciona rotina de backup do banco e documentos
- `629c4ba` — Adiciona gerenciamento de usuarios e troca de senha
- `eb188ad` — Remove comportamento arrastavel dos botoes flutuantes
- `1666d99` — Implementa exclusao logica de clientes e processos
- `668f198` — Adiciona documentos reais com upload protegido
- `3f77e3c` — Adiciona autenticacao JWT e protecao de rotas
- `66b5d95` — Adiciona preferencias visuais persistentes
- `a2ac070` — Protege compromissos automaticos na agenda
- `32d6efc` — Atualiza financeiro com recebimentos reais
- `c14b84b` — Adiciona recebimentos reais na tela de honorarios

## Estado do worktree

Antes desta atualização documental, `git status --short` não produziu saída: o worktree estava limpo.

Após a criação e o ajuste dos documentos desta atualização:

```text
 M readme.md
?? JURISFLOW_STATUS.md
?? ROADMAP.md
?? TEST_PLAN.md
```

## Próximo passo recomendado

1. Criar migrações controladas com Flyway.
2. Reduzir a dependência de `spring.jpa.hibernate.ddl-auto=update`.
3. Criar um plano de testes automatizados por perfil e para endpoints críticos.
4. Fazer uma revisão final de segurança antes de uso real.
