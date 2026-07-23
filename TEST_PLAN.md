# TEST_PLAN.md

## Objetivo

Definir como testar o JurisFlow antes de considerar funcionalidades concluídas.

## Testes por perfil

### ADMIN

- Login.
- Gerenciamento de usuários e reset de senha.
- Consulta de auditoria.
- Clientes.
- Processos.
- Documentos.
- Agenda e compromissos.
- Financeiro e honorários.
- Backup e respectiva documentação operacional.

### ADVOGADO

- Não acessa gestão de usuários.
- Não acessa auditoria.
- Cria, edita e arquiva clientes.
- Cria, edita e arquiva processos.
- Envia, baixa e exclui documentos.
- Acessa financeiro e honorários.
- Altera a própria senha.

### ASSISTENTE

- Não acessa gestão de usuários.
- Não acessa auditoria.
- Não acessa financeiro nem honorários.
- Visualiza clientes.
- Não cria, edita nem arquiva clientes.
- Visualiza processos.
- Não cria, edita nem arquiva processos.
- Envia e baixa documentos.
- Não exclui documentos.
- Cria e edita compromissos.
- Não exclui compromissos.
- Altera a própria senha.
- O acesso direto a páginas restritas redireciona ou mostra aviso.
- Uma resposta HTTP 403 não encerra a sessão.

## Testes de autenticação

- Login com credenciais corretas.
- Login com credenciais incorretas.
- Login de usuário inativo.
- Requisição sem token.
- Requisição com token inválido.
- Logout.
- Atualização da página com sessão válida.
- Consulta de `GET /auth/me`.

## Testes de documentos

- Upload válido.
- Upload acima de 10 MB.
- Resposta e mensagem adequadas para upload acima de 10 MB, sem HTTP 500 genérico.
- Upload de extensão proibida.
- Upload com assinatura de arquivo incompatível.
- Download protegido.
- Exclusão lógica.
- Vínculo com cliente.
- Vínculo com processo.
- Tentativa de vínculo com cliente ou processo inativo.

## Testes de clientes/processos

- Criação.
- Edição.
- Arquivamento.
- Listagem sem inativos.
- Listagem com inativos quando autorizada.
- Bloqueio de alteração de registro inativo.
- Preservação de documentos históricos.

## Testes de auditoria

- Login com sucesso.
- Falha de login.
- Ações de usuários.
- Ações de clientes.
- Ações de processos.
- Ações de documentos.
- Ausência de senha, JWT, token e conteúdo de documento nos eventos.
- Acesso permitido apenas para ADMIN.

## Testes de backup/restauração

- Backup com PostgreSQL e documentos.
- Backup com caminho customizado.
- Comportamento quando a pasta de documentos não existe.
- Validação do `manifest.json`.
- Restauração em ambiente de teste.
- Confirmação explícita de restauração.

## Testes de Flyway e migrations

### Banco novo e vazio

- Confirmar que o banco isolado escolhido não existe antes de criá-lo; nunca apagar um banco encontrado automaticamente.
- Confirmar que o banco novo inicia sem tabelas de aplicação.
- Subir o backend com datasource explicitamente isolado e Hibernate em `validate`.
- Confirmar que V1 cria `flyway_schema_history` e registra uma migration SQL bem-sucedida.
- Confirmar que o primeiro startup cria 9 tabelas de aplicação, 138 colunas, 62 constraints, 20 índices, 9 sequences, 9 colunas identity e 11 foreign keys.
- Repetir o startup e confirmar que nenhuma migration é reaplicada.
- Confirmar que as tabelas de aplicação permanecem vazias.

### Banco principal com baseline explícito

- Antes do startup, confirmar exatamente uma linha `BASELINE`, versão 1, com sucesso, e nenhuma migration SQL registrada.
- Subir o backend com a configuração padrão: Flyway habilitado, `baseline-on-migrate=false`, `clean-disabled=true` e Hibernate em `validate`.
- Confirmar que Flyway encontra a versão atual 1 e não executa V1.
- Repetir o startup e confirmar idempotência.
- Confirmar que o histórico permanece com uma única linha `BASELINE`.
- Comparar a estrutura de negócio antes e depois e confirmar que permaneceu idêntica.
- Confirmar HTTP 401 em endpoints protegidos e em `/auth/me` sem token.

### Evoluções futuras

- Nunca alterar a V1 depois do baseline.
- Criar qualquer futura alteração de schema como V2 ou superior.
- Validar cada migration em ambiente isolado antes de aplicá-la ao banco principal.

## Testes automatizados desejados

- Testes unitários de services.
- Testes de controllers com MockMvc.
- Testes de autorização por perfil.
- Testes de integração com banco de teste.
- Testes de upload e download.
- Testes de auditoria.
- Testes de segurança para escape de conteúdo renderizado e prevenção de XSS.
- Teste do cancelamento da confirmação de logout.

## Checklist antes de commit

- `git status --short` revisado.
- `git diff --check` executado.
- `node --check` executado em cada JavaScript alterado.
- Testes/build Maven executados; em alteração exclusivamente documental, a dispensa deve ser registrada.
- Teste manual relevante concluído.
- Documentação atualizada quando necessário.
- Nenhum dado sensível incluído no commit.
- Nenhum dump, ZIP, backup ou catálogo operacional incluído no commit.
