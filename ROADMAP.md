# ROADMAP.md

## Objetivo

Finalizar o JurisFlow como sistema jurídico utilizável, seguro e organizado para gestão de clientes, processos, documentos, compromissos e atividades administrativas.

## Concluído

### Base e infraestrutura

- Frontend em HTML, CSS e JavaScript integrado ao backend.
- API REST em Java com Spring Boot e Spring Data JPA/Hibernate.
- PostgreSQL configurado como banco principal.
- Preferências visuais persistentes.

### Clientes

- Cadastro, consulta, edição e arquivamento.
- Arquivamento lógico nos fluxos de exclusão, sem remoção física do registro.
- Preservação dos vínculos com documentos históricos.

### Processos

- Cadastro, consulta, edição e arquivamento.
- Arquivamento lógico nos fluxos de exclusão, sem remoção física do registro.
- Sincronização dos registros automáticos associados.
- Preservação dos vínculos com documentos históricos.

### Documentos

- Upload e download protegidos.
- Armazenamento privado de arquivos.
- Metadados persistidos no PostgreSQL.
- Vínculo com clientes e processos.
- Validação de extensão, assinatura e limite de 10 MB.
- Exclusão lógica.

### Autenticação e usuários

- Autenticação JWT e proteção de rotas.
- Gerenciamento de usuários por ADMIN.
- Troca da própria senha e reset administrativo.
- Bloqueio de usuário inativo.
- Proteção do último ADMIN ativo.

### Backup e restauração

- Backup manual do PostgreSQL e dos documentos.
- Manifesto de execução e caminhos configuráveis.
- Validação prévia e restauração com confirmação explícita.
- Procedimento operacional documentado.

### Auditoria

- Registro de ações sensíveis e de seus resultados.
- Consulta restrita a ADMIN.
- Não registro de senha, token e outros dados sensíveis.

### Permissões

- Perfis ADMIN, ADVOGADO e ASSISTENTE.
- Autorização aplicada no backend por endpoint/operação.
- Adequação visual do frontend às ações permitidas.
- Respostas HTTP 403 sem logout automático.

### Interface

- Identidade dinâmica do usuário autenticado.
- Remoção da busca do topo da Dashboard.
- Desativação em runtime do atalho/FAB arrastável.
- Ocultação de ações incompatíveis com o perfil.

## Em andamento / próximo

1. Migrações controladas do banco com Flyway.
2. Plano de testes automatizados.
3. Revisão de segurança e integridade.
4. Refinamento de UX e mensagens de erro.
5. Limpeza de código legado, `localStorage` e mocks residuais.
6. Documentação final para uso.

## Próximas tarefas prioritárias

1. Levantar o schema atual do PostgreSQL.
2. Configurar Flyway.
3. Criar um baseline seguro do banco atual.
4. Trocar `ddl-auto=update` por um modo seguro depois da validação.
5. Criar testes de autorização por perfil.
6. Criar testes de documentos.
7. Criar testes de clientes e processos com exclusão lógica.
8. Melhorar o tratamento de upload acima de 10 MB no frontend.
9. Revisar telas antigas em busca de dados fixos e mocks residuais.
10. Preparar um checklist de uso real.

## Fora de escopo agora

- Site público de advocacia.
- Bot Aurora/WhatsApp.
- Integrações externas não solicitadas.
- Funcionalidades financeiras avançadas além do que já existe.
- Deploy em produção antes de migrações e testes.
