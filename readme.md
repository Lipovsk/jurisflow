# JurisFlow ⚖️

Sistema jurídico desenvolvido para auxiliar advogados na organização de clientes, processos, agenda, documentos e informações financeiras.

## 📌 Sobre o projeto

O JurisFlow é um sistema web voltado para escritórios de advocacia, com foco em praticidade, organização e produtividade.

A ideia principal é permitir que o advogado consiga gerenciar seus clientes e informações importantes de forma simples, rápida e intuitiva.

## 🚀 Funcionalidades já implementadas

- Tela de login
- Dashboard inicial
- Cadastro de clientes
- Listagem de clientes
- Perfil detalhado do cliente
- Edição de cliente
- Exclusão de cliente
- Integração frontend com backend
- API REST com Spring Boot
- CRUD completo de clientes

## 🛠️ Tecnologias utilizadas

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Java
- Spring Boot
- Spring Web
- Spring Data JPA
- PostgreSQL
- Flyway

## 🔗 Endpoints principais

### Clientes

```http
GET /clientes
POST /clientes
GET /clientes/{id}
PUT /clientes/{id}
DELETE /clientes/{id}
```

## 📚 Documentação do projeto

- [Estado atual](JURISFLOW_STATUS.md)
- [Roadmap](ROADMAP.md)
- [Plano de testes](TEST_PLAN.md)
- [Permissões por perfil](docs/PERMISSOES.md)
- [Backup e restauração](docs/BACKUP_RESTORE.md)
- [Flyway e migrations](docs/FLYWAY_MIGRATIONS.md)
