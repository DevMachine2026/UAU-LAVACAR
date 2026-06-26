# Unit Staff API — Design Spec

**Data:** 2026-06-26  
**Status:** Aprovado  
**Escopo:** `uau-core-backend` — módulo `franchise-units`

---

## Contexto

O frontend (`UnitStaffManager.tsx`) chama 3 endpoints para gerenciar a equipe de cada unidade franqueada. Nenhum deles existe no backend. O model `UnitStaff` já está definido no schema Prisma e as tabelas existem no banco — apenas a camada NestJS (service + controller + DTO) está faltando.

---

## Contrato da API (ditado pelo frontend)

| Método | Path | Body | Resposta esperada |
|--------|------|------|-------------------|
| GET | `/api/v1/franchise-units/:id/staff` | — | `UnitStaff[]` com `user` incluso |
| POST | `/api/v1/franchise-units/:id/staff` | `{ userId: string, role: "MANAGER"\|"OPERATOR" }` | `UnitStaff` criado |
| PATCH | `/api/v1/franchise-units/:id/staff/:staffId/activate` | — | `{ id, isActive: true }` |
| PATCH | `/api/v1/franchise-units/:id/staff/:staffId/deactivate` | — | `{ id, isActive: false }` |

**Tipo `Staff` esperado pelo frontend:**
```ts
{
  id: string;
  role: "MANAGER" | "OPERATOR";
  isActive: boolean;
  user: { id: string; name: string; email: string; role: string; status?: string };
  unit?: { id: string; name: string };
}
```

---

## Arquitetura

Nenhum novo módulo, arquivo de módulo ou dependência externa. Tudo vai dentro do módulo `franchise-units` já existente.

### Arquivo novo: `dto/add-unit-staff.dto.ts`

```ts
class AddUnitStaffDto {
  userId: string;   // @IsString() @IsNotEmpty()
  role: string;     // @IsIn(['MANAGER', 'OPERATOR'])
}
```

### Métodos novos no `FranchiseUnitsService`

| Método | Assinatura | Comportamento |
|--------|-----------|---------------|
| `getStaff` | `(unitId, actorId?)` | Verifica unidade existe; se actorId → assertFranchiseOwnerOwnsUnit; retorna staff com `user` e `unit` inclusos |
| `addStaff` | `(unitId, dto, actorId?)` | Verifica unidade; verifica userId existe; se actorId → assertOwnership; cria UnitStaff. `@@unique[unitId, userId]` — captura P2002 e lança `ConflictException` |
| `activateStaff` | `(unitId, staffId, actorId?)` | Busca `{ id, unitId: unitId }` — lança `NotFoundException` se não encontrar; se actorId → assertOwnership; atualiza `isActive: true` |
| `deactivateStaff` | `(unitId, staffId, actorId?)` | Igual ao activate com `isActive: false` |

**Reutilização:** `assertFranchiseOwnerOwnsUnit` já existe no service — nenhuma mudança necessária.

### Rotas novas no `FranchiseUnitsController`

```
GET    :id/staff                          @Roles(SUPER_ADMIN, FRANCHISE_OWNER)
POST   :id/staff                          @Roles(SUPER_ADMIN, FRANCHISE_OWNER)
PATCH  :id/staff/:staffId/activate        @Roles(SUPER_ADMIN, FRANCHISE_OWNER)
PATCH  :id/staff/:staffId/deactivate      @Roles(SUPER_ADMIN, FRANCHISE_OWNER)
```

O `@CurrentUser()` é passado para o service nos 4 endpoints para extrair `actorId` quando o role for `FRANCHISE_OWNER`.

---

## Controle de Acesso

| Role | Pode gerenciar staff? | Restrição |
|------|-----------------------|-----------|
| SUPER_ADMIN | Sim | Qualquer unidade |
| FRANCHISE_OWNER | Sim | Apenas sua unidade (`defaultUnitId`) |
| OPERATOR | Não | — |
| CUSTOMER | Não | — |

---

## Error Handling

| Situação | Exceção |
|----------|---------|
| Unidade não encontrada | `NotFoundException` |
| Usuário (`userId`) não encontrado | `NotFoundException` |
| Vínculo já existe (`@@unique` violado) | `ConflictException` |
| Staff não pertence à unidade | `NotFoundException` |
| FRANCHISE_OWNER em unidade alheia | `ForbiddenException` (via `assertFranchiseOwnerOwnsUnit`) |

---

## Arquivos modificados / criados

```
uau-core-backend/src/franchise-units/
  dto/
    add-unit-staff.dto.ts          ← NOVO
  franchise-units.service.ts       ← adicionar 4 métodos
  franchise-units.controller.ts    ← adicionar 4 rotas
```

Nenhuma migration Prisma necessária (model e tabela já existem).

---

## Fora do escopo

- Busca de usuários por nome/email para popular o campo de vincular funcionário (o frontend usa input de ID)
- Edição do role após vincular (não há `PUT /staff/:staffId`)
- Remoção (hard delete) de um vínculo de staff
