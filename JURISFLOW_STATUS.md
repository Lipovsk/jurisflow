# JURISFLOW_STATUS.md

## Última atualização

22/07/2026 (UTC-03:00, America/Sao_Paulo).

## Estado geral

O JurisFlow está em desenvolvimento avançado. Autenticação, documentos, usuários, backup, auditoria e permissões por perfil já foram implementados e testados nos sprints recentes. O suporte ao Flyway e a migration V1 do schema físico atual foram validados em PostgreSQL vazio e isolado. O banco principal recebeu o baseline explícito da versão 1 sem executar a V1, e o Flyway está habilitado por padrão com as proteções permanentes definidas no projeto.

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
- Dependências do Flyway compatíveis com Spring Boot 4.0.6.
- Migration `V1__baseline_schema_atual.sql` derivada do schema físico aprovado e validada em banco vazio.
- Baseline explícito da versão 1 registrado no banco principal sem executar a V1.
- Hibernate configurado com `ddl-auto=validate` e Flyway habilitado por padrão.
- `baseline-on-migrate=false` e `clean-disabled=true` mantidos como proteções permanentes.
- V1 congelada; futuras alterações de schema devem usar V2 ou superior.
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
- Pré-validação no frontend para bloquear arquivos acima de 10 MB antes da requisição.
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
- Revisão geral de telas antigas que ainda possam conter texto fixo, mock residual ou uso legado de `localStorage`.
- Validação visual completa após futuras alterações.
- Testes automatizados mais abrangentes.

## Bugs conhecidos

- O `mvnw.cmd` apresenta um bug local conhecido de `NullArray` em alguns comandos no Windows; a alternativa usada nos sprints recentes foi o Maven instalado pelo próprio wrapper.
- O Git exibe avisos de conversão LF/CRLF no Windows, sem erro real no `git diff --check`.
- Há risco de XSS persistente em trechos da Dashboard e do autocomplete de novo processo que interpolam dados da API em `innerHTML` sem escape; deve ser corrigido antes de uso real.
- O logout possui handlers sobrepostos em `auth.js` e `dashboard.js`; o encerramento imediato da sessão pode ocorrer antes da confirmação visual.

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
- O procedimento e o estado da implantação estão documentados em [docs/FLYWAY_MIGRATIONS.md](docs/FLYWAY_MIGRATIONS.md).
- Próximo passo técnico recomendado: manter a V1 congelada e criar somente migrations V2 ou superiores quando houver uma alteração real de schema.

## Testes realizados

Resultados conhecidos dos sprints recentes e das validações do Flyway em 21 e 22/07/2026:

- `mvn compile` aprovado.
- Suíte automatizada existente: 1 teste executado, 0 falhas e 0 erros.
- Primeiro startup no banco vazio `jurisflow_flyway_v1_test`: V1 aplicada, Hibernate `validate` aprovado e backend iniciado.
- Segundo startup no mesmo banco: schema na versão 1, sem reaplicação da V1.
- Em 22/07/2026, dois startups consecutivos no banco principal com o Flyway habilitado por padrão reconheceram a versão 1, não executaram a V1, mantiveram uma única linha `BASELINE` no histórico e passaram pelo Hibernate `validate`.
- Comparação com os catálogos aprovados: 9 tabelas de aplicação, 138 colunas, 62 constraints, 20 índices, 9 sequences, 9 colunas identity e 11 foreign keys.
- Smoke sem token: `/auth/me`, `/clientes`, `/processos` e `/documentos` retornaram HTTP 401.
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

A implementação inicial do Flyway foi registrada no commit `fa174f7 Adiciona Flyway com baseline inicial do schema`. O baseline explícito da versão 1 foi concluído no banco principal antes da ativação padrão do Flyway.

## Próximo passo recomendado

1. Manter a V1 congelada.
2. Criar futuras alterações de schema somente como V2 ou superior.
3. Validar cada nova migration em ambiente isolado e com backup antes do banco principal.
4. Criar testes automatizados por perfil e para endpoints críticos.
5. Fazer uma revisão final de segurança antes de uso real.
