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
