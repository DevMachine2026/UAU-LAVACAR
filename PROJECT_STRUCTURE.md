# UAU+ Project Structure

Este arquivo define a estrutura oficial do projeto antes do deploy.

## Backend oficial

```text
uau-clube-api/uau-core-backend
```

Use este diretorio para:

- instalar dependencias do backend;
- rodar Prisma;
- rodar migrations;
- rodar seed;
- gerar OpenAPI;
- rodar build;
- executar deploy da API.

Comandos de backend devem ser executados a partir de:

```bash
cd uau-clube-api/uau-core-backend
```

## Pasta nao oficial

```text
uau-core-backend
```

Esta pasta na raiz nao contem o backend funcional. Ela nao deve ser usada para deploy, build, migrations ou seed.

Um aviso foi adicionado em:

```text
uau-core-backend/README_DO_NOT_USE.md
```

Nenhuma pasta foi movida ou apagada neste modulo.

## Mobile oficial

```text
uau-mobile-app
```

Use este diretorio para o app mobile do assinante/cliente.

## Web Dashboard oficial

```text
uau-web-dashboard
```

Use este diretorio para os dashboards Super Admin, franqueado, parceiro e operador.

## Documentacao de producao

Arquivos oficiais na raiz:

```text
PRODUCTION_CHECKLIST.md
DEPLOYMENT_GUIDE.md
ARCHITECTURE_SUMMARY.md
FINAL_AUDIT_REPORT.md
PROJECT_STRUCTURE.md
```

## Regra operacional

Antes de qualquer deploy, confirme o diretorio atual com:

```bash
pwd
```

ou, no PowerShell:

```powershell
Get-Location
```

O deploy do backend so deve continuar se o caminho terminar em:

```text
uau-clube-api/uau-core-backend
```
