# Permissões por perfil

O backend é a fonte de verdade para autorização. O frontend apenas oculta ações indisponíveis para melhorar a experiência; uma chamada direta continua sujeita às regras do backend e recebe HTTP 403 quando o perfil não é autorizado.

## Matriz

| Recurso | ADMIN | ADVOGADO | ASSISTENTE |
| --- | --- | --- | --- |
| Usuários e reset de senha de terceiros | Gerenciar | Sem acesso | Sem acesso |
| Próprios dados e própria senha | Acessar | Acessar | Acessar |
| Auditoria | Consultar | Sem acesso | Sem acesso |
| Clientes | Ler, criar, editar e arquivar | Ler, criar, editar e arquivar | Somente listar e visualizar |
| Processos | Ler, criar, editar e arquivar | Ler, criar, editar e arquivar | Somente listar e visualizar |
| Documentos | Listar, enviar, baixar e excluir | Listar, enviar, baixar e excluir | Listar, enviar e baixar |
| Compromissos | Ler, criar, editar e excluir | Ler, criar, editar e excluir | Ler, criar e editar |
| Honorários e recebimentos | Acesso completo | Acesso completo | Sem acesso |

A exclusão de compromisso foi considerada destrutiva e, por isso, ficou restrita a ADMIN e ADVOGADO. Registros automáticos continuam sujeitos às regras de negócio já existentes.

## Endpoints protegidos

### Somente ADMIN

- `GET /usuarios`
- `GET /usuarios/{id}`
- `POST /usuarios`
- `PUT /usuarios/{id}`
- `PATCH /usuarios/{id}/senha`
- `GET /auditoria`

### Qualquer usuário autenticado

- `GET /usuarios/me`
- `PATCH /usuarios/me/senha`
- `GET /clientes`
- `GET /clientes/{id}`
- `GET /processos`
- `GET /processos/{id}`
- `GET /processos/cliente/{clienteId}`
- `GET /documentos`
- `GET /documentos/{id}`
- `GET /documentos/{id}/download`
- `POST /documentos`
- leituras, criação e edição em `/compromissos`

### ADMIN ou ADVOGADO

- `POST /clientes`
- `PUT /clientes/{id}`
- `DELETE /clientes/{id}`
- `POST /processos`
- `PUT /processos/{id}`
- `DELETE /processos/{id}`
- `DELETE /documentos/{id}`
- `DELETE /compromissos/{id}`
- todos os endpoints de `/honorarios`
- todos os endpoints de `/recebimentos`

## Comportamento do frontend

- Usuários e Auditoria são exibidos somente para ADMIN.
- A troca da própria senha permanece disponível para todos os perfis.
- Para ASSISTENTE, ações de criação, edição e arquivamento de clientes e processos ficam ocultas.
- Para ASSISTENTE, upload e download de documentos permanecem disponíveis e a exclusão fica oculta.
- Para ASSISTENTE, a navegação financeira é ocultada e o acesso direto redireciona ao dashboard com aviso.
- Respostas 401 continuam encerrando a sessão e redirecionando ao login.
- Respostas 403 não encerram a sessão e apresentam mensagem de permissão.

## Limitações atuais

- As permissões são por perfil, sem regras por proprietário, equipe, processo ou cliente.
- Ações bloqueadas por 403 ainda não geram eventos próprios de auditoria.
- Não há painel para configurar permissões personalizadas.
- O frontend usa o perfil armazenado na sessão autenticada; o backend sempre revalida a autoridade proveniente do usuário associado ao JWT.

## Próximos refinamentos possíveis

- Permissões granulares por operação e escopo.
- Vínculo de usuários a equipes ou carteiras de clientes.
- Auditoria opcional de tentativas bloqueadas.
- Testes de integração específicos para cada combinação de endpoint e perfil.
