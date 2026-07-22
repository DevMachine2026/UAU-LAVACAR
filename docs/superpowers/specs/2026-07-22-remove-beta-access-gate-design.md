# Remover trava de acesso restrito (betaAccess) no login

## Contexto

O login (`POST /auth/login`) bloqueia qualquer usuário não-`SUPER_ADMIN` com
`betaAccess: false`, retornando 401 "Acesso restrito. Entre em contato para
liberar seu acesso." Novos cadastros nascem com `betaAccess: false`
(default no schema Prisma) e o único jeito de liberar é um endpoint manual
(`PATCH /users/:id/beta-access`, SUPER_ADMIN-only) sem nenhuma UI no
dashboard ou no app. Isso bloqueia testadores da Play Store e qualquer
usuário novo de usar o app de forma autônoma.

Ver memória `project-login-bug-root-cause` para o histórico de como esse
gate foi descoberto.

## Objetivo

Qualquer pessoa deve conseguir se cadastrar e logar imediatamente, sem
aprovação manual.

## Mudança

Remover a checagem de `betaAccess` em
`uau-core-backend/src/auth/auth.service.ts` (bloco atual nas linhas 43-45):

```ts
if (user.role !== UserRole.SUPER_ADMIN && !user.betaAccess) {
  throw new UnauthorizedException('Acesso restrito. Entre em contato para liberar seu acesso.');
}
```

Login passa a depender só de `status === 'ACTIVE'` (já verificado antes).

## O que NÃO muda (escopo deliberadamente pequeno)

- Coluna `betaAccess` no `schema.prisma` — fica no banco, sem migration.
- Endpoint `PATCH /users/:id/beta-access` e `BetaAccessDto` — ficam mortos,
  mas intactos, caso um beta fechado precise ser reativado no futuro
  (basta devolver as 2 linhas removidas).
- Fluxo de cadastro (`customers.service.ts`) — continua criando usuários
  sem setar `betaAccess` (default `false` no schema), irrelevante já que o
  login não checa mais.
- Tela de login do mobile — já tem link "Não tem conta? Criar cadastro"
  sempre visível (`app/(auth)/login.tsx:223-232`), então o requisito de
  "direcionar para criar cadastro" já está atendido sem mudança de UI. O
  backend continua devolvendo uma mensagem genérica ("Credenciais
  inválidas") tanto para e-mail inexistente quanto para senha errada —
  não vamos abrir uma brecha de enumeração de e-mail para diferenciar os
  dois casos.

## Testes

Localizar e ajustar qualquer teste (unit/e2e) que hoje espera 401
"Acesso restrito" para `betaAccess: false`, e confirmar/adicionar um teste
de que um usuário `betaAccess: false` consegue logar com sucesso.

## Alternativas descartadas

- Remover coluna/endpoint por completo: mais "limpo", mas exige migration
  Prisma em produção e é mais difícil de reverter — descartado a pedido
  do usuário (menor risco > limpeza).
- Backend distinguir "usuário não encontrado" para o app redirecionar
  automaticamente: abriria enumeração de e-mail — descartado, o link de
  cadastro já visível resolve o mesmo problema de UX sem esse risco.
