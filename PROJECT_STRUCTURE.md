# UAU+ Project Structure

Este arquivo define a estrutura oficial do projeto antes do deploy.

## Backend oficial

```text
uau-core-backend
```

O backend NestJS ativo fica **diretamente na raiz do repositório**, em `uau-core-backend/`. Use este diretório para:

- instalar dependências do backend;
- rodar Prisma;
- rodar migrations;
- rodar seed;
- gerar OpenAPI;
- rodar build;
- executar deploy da API (Render, Docker, etc.).

Comandos de backend devem ser executados a partir de:

```bash
cd uau-core-backend
```

## Pasta obsoleta

```text
uau-clube-api
```

A pasta `uau-clube-api` está **obsoleta e vazia** no monorepo atual. Ela existia em uma organização anterior do repositório e **não deve** ser usada para build, migrations, seed ou deploy.

Um aviso foi adicionado em:

```text
uau-clube-api/README_DO_NOT_USE.md
```

Nenhuma pasta foi movida ou apagada neste módulo.

## Mobile oficial

```text
uau-mobile-app
```

Use este diretório para o app mobile do assinante/cliente.

## Web Dashboard oficial

```text
uau-web-dashboard
```

Use este diretório para os dashboards Super Admin, franqueado, parceiro e operador.

## Documentação de produção

Arquivos oficiais na raiz:

```text
PRODUCTION_CHECKLIST.md
DEPLOYMENT_GUIDE.md
ARCHITECTURE_SUMMARY.md
FINAL_AUDIT_REPORT.md
PROJECT_STRUCTURE.md
```

## Regra operacional

Antes de qualquer deploy, confirme o diretório atual com:

```bash
pwd
```

ou, no PowerShell:

```powershell
Get-Location
```

O deploy do backend só deve continuar se o caminho terminar em:

```text
uau-core-backend
```
