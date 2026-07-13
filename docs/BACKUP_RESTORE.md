# Backup e restauração local

Esta rotina cria um backup manual do PostgreSQL e da pasta privada de documentos do JurisFlow. Ela não agenda execuções, não remove backups antigos e não armazena senhas.

## Pré-requisitos

- Windows PowerShell 5.1 ou PowerShell 7.
- Ferramentas cliente do PostgreSQL (`pg_dump` e `pg_restore`) disponíveis no `PATH`.
- Acesso ao banco e à pasta privada de documentos.

Confirme a instalação:

```powershell
pg_dump --version
pg_restore --version
```

Se o Windows informar que a execução de scripts está desabilitada, libere somente a sessão atual do PowerShell (não altere a política da máquina permanentemente):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Senha do PostgreSQL

Os scripts não aceitam senha por parâmetro. Use um arquivo `pgpass.conf` ou carregue `PGPASSWORD` apenas na sessão atual. Para evitar que a senha apareça na tela ou no histórico, use um prompt seguro:

```powershell
$credencial = Get-Credential -UserName postgres -Message 'Senha local do PostgreSQL'
$env:PGPASSWORD = $credencial.GetNetworkCredential().Password
```

Ao terminar, remova a variável e a credencial da sessão:

```powershell
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
Remove-Variable credencial -ErrorAction SilentlyContinue
```

No Windows, o PostgreSQL também reconhece `%APPDATA%\postgresql\pgpass.conf`. Proteja esse arquivo e nunca o versione.

## Gerar um backup

Na raiz do projeto:

```powershell
.\scripts\backup-jurisflow.ps1
```

Os padrões são banco `jurisflow`, usuário `postgres`, host `localhost`, porta `5432`, documentos em `JURISFLOW_DOCUMENTOS_STORAGE_PATH` ou `$HOME\.jurisflow\documentos`, e saída em `backups\` na raiz do projeto.

Exemplo com destinos personalizados:

```powershell
.\scripts\backup-jurisflow.ps1 `
  -Database jurisflow `
  -Username postgres `
  -Host localhost `
  -Port 5432 `
  -BackupRoot 'D:\Backups\JurisFlow' `
  -DocumentosPath 'D:\JurisFlow\documentos'
```

Se a pasta de documentos ainda não existir porque nenhum documento foi enviado, permita explicitamente um backup somente do banco:

```powershell
.\scripts\backup-jurisflow.ps1 -AllowMissingDocumentos
```

Cada execução cria uma pasta com timestamp:

```text
backups/
  2026-07-08_19-30-00/
    database/
      jurisflow.dump
    documentos/
      documentos.zip
    manifest.json
```

O manifesto registra os parâmetros sem senha e informa sucesso, aviso ou falha de cada etapa. Backups antigos não são apagados automaticamente.

## Validar e restaurar

Restauração pode sobrescrever dados. Faça primeiro uma validação sem alterações, omitindo `-ConfirmRestore`:

```powershell
.\scripts\restore-jurisflow.ps1 `
  -BackupPath '.\backups\2026-07-08_19-30-00' `
  -DocumentosPath "$HOME\.jurisflow\documentos"
```

O script valida o `.dump`, o ZIP e a disponibilidade de `pg_restore`, mostra o comando planejado e encerra sem restaurar.

Depois de revisar banco e caminhos, habilite a restauração. O script ainda exigirá que seja digitado `RESTAURAR`:

```powershell
.\scripts\restore-jurisflow.ps1 `
  -BackupPath '.\backups\2026-07-08_19-30-00' `
  -Database jurisflow `
  -Username postgres `
  -Host localhost `
  -Port 5432 `
  -DocumentosPath "$HOME\.jurisflow\documentos" `
  -ConfirmRestore
```

Por padrão, o script não limpa o banco antes de chamar `pg_restore`. Isso é mais seguro, mas pode causar conflitos em um banco já preenchido. `-CleanDatabase` adiciona `--clean --if-exists` e pode remover objetos existentes; use somente após validar o backup e confirmar que o banco de destino está correto:

```powershell
.\scripts\restore-jurisflow.ps1 `
  -BackupPath '.\backups\2026-07-08_19-30-00' `
  -DocumentosPath "$HOME\.jurisflow\documentos" `
  -CleanDatabase `
  -ConfirmRestore
```

O script não apaga o banco nem limpa a pasta de documentos. Durante a extração, arquivos de mesmo nome podem ser sobrescritos, enquanto arquivos adicionais permanecem no destino.

## Testar sem destruir dados

1. Gere o backup e confirme no `manifest.json` que as duas etapas tiveram sucesso.
2. Verifique se o `.dump` pode ser listado: `pg_restore --list .\backups\<timestamp>\database\jurisflow.dump`.
3. Crie manualmente um banco de teste vazio, por exemplo `jurisflow_restore_test`.
4. Execute primeiro a validação da restauração apontando `-Database jurisflow_restore_test` e uma pasta temporária vazia para documentos.
5. Execute com `-ConfirmRestore`, valide tabelas, login e abertura dos documentos e, somente depois, considere o backup aprovado.
6. Nunca teste a primeira restauração diretamente sobre o banco principal.

## Recomendações

- Copie o backup para HD externo ou nuvem segura.
- Não versione backups no Git; `backups/` está no `.gitignore`.
- Não compartilhe backups que contenham dados reais.
- Restrinja o acesso à pasta de backup.
- Adote criptografia dos backups em uma versão futura.
- Teste a restauração periodicamente.
- Remova `PGPASSWORD` da sessão após o uso.
