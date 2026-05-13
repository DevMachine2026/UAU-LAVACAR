# UAU+ Mobile App

App mobile do assinante UAU+ criado com React Native, Expo, TypeScript e Expo Router.

Este app e focado no cliente/assinante. Dashboards administrativos, operacionais, franqueado e parceiro ficam no projeto separado `uau-web-dashboard`.

## Stack

- React Native
- Expo
- TypeScript
- Expo Router
- Axios
- TanStack React Query
- Zustand
- Expo SecureStore
- NativeWind
- React Hook Form
- Zod

## Instalar

```bash
npm install
```

## Configurar API

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Padrao local:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
```

No Android Emulator, `localhost` aponta para o proprio emulador. Use:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1
```

No celular fisico com Expo Go, use o IP LAN da maquina onde o backend esta rodando:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000/api/v1
```

Staging:

```env
EXPO_PUBLIC_API_URL=https://api-staging.seudominio.com/api/v1
```

O arquivo de exemplo para staging esta em:

```text
.env.staging.example
```

## Rodar

```bash
npm run start
```

Android:

```bash
npm run android
```

iOS:

```bash
npm run ios
```

## Autenticacao

O app consome a API do UAU+ Core em `/api/v1`:

- `POST /auth/login`
- `POST /customers`
- `GET /users/me`

O backend retorna envelope:

```json
{
  "success": true,
  "data": {}
}
```

O token JWT e salvo com Expo SecureStore. O Axios anexa `Authorization: Bearer <token>` automaticamente e limpa a sessao quando recebe `401`.

## Home conectada

A Home usa React Query e consome dados reais do backend:

- `GET /users/me`
- `GET /wallet/me`
- `GET /billing/my-current`
- `GET /campaigns/app/active`
- `POST /campaigns/:id/view`
- `POST /campaigns/:id/click`
- `POST /campaigns/:id/dismiss`
- `GET /notifications/me/unread-count`

Telas auxiliares:

- Wallet: `GET /wallet/me` e `GET /wallet/me/statement`
- Billing: `GET /billing/my-current` e `GET /billing/my-history`
- Notificacoes: `GET /notifications/me`, `PATCH /notifications/:id/read` e `PATCH /notifications/read-all`

Para testar, suba o backend, faca login com usuario seedado e garanta que existam dados seedados de wallet, cobrancas, campanhas ou notificacoes. Quando algum modulo ainda nao tiver dados, o app mostra estado vazio em vez de quebrar.

## Fluxo de assinatura

A rota `/subscribe` permite o cliente montar uma assinatura em etapas:

1. Estado
2. Cidade
3. Unidade
4. Plano
5. Veiculo
6. Forma de pagamento
7. Preview
8. Confirmacao

Endpoints usados:

- `GET /states`
- `GET /cities`
- `GET /franchise-units`
- `GET /plans`
- `GET /vehicles`
- `POST /vehicles`
- `POST /checkout/subscription/preview`
- `POST /checkout/subscription/confirm`

O checkout usa os metodos `PIX` e `CREDIT_CARD`. Quando o backend estiver com Asaas configurado, o PIX real ou sandbox pode voltar com QR/copia e cola no retorno do confirm. Se o backend estiver em modo fake, o app tambem exibe os dados retornados.

Atalhos:

- Home: `Assinar agora` abre `/subscribe`.
- Se ja existir cobranca atual, a Home leva para `Minhas Cobrancas`.
- Billing: quando nao existe cobranca atual, aparece `Escolher plano`.

## Modulo 26 — Minha Rede

A rota `/referrals` mostra a rede MMN em ate 3 linhas:

- codigo de indicacao
- link fake de indicacao
- status de qualificacao
- totais das linhas 1, 2 e 3
- ganhos por linha
- lista de usuarios por linha
- arvore simples da rede

Endpoints usados:

- `GET /referrals/me`
- `GET /referrals/me/tree`

Na Home, o atalho `Minha Rede` abre `/referrals`.

## Modulo 27 — Parceiros no App

A aba `Parceiros` lista parceiros locais e a rota `/partners/:id` permite:

- ver detalhes e regras do parceiro
- informar valor da compra
- informar cashback que deseja usar
- escolher PIX ou cartao
- simular a transacao
- confirmar o uso de cashback
- gerar QR Code/payload fake para uso no parceiro

Endpoints usados:

- `GET /partners`
- `GET /partners/:id`
- `POST /partners/:partnerId/transactions/preview`
- `POST /partners/:partnerId/transactions/confirm`
- `POST /partners/:partnerId/transactions/create-qr`

Regras exibidas no app:

- Cashback usado no parceiro funciona como desconto operacional do parceiro e nao gera divida da UAU.
- Novo cashback incide somente sobre o valor pago via PIX/cartao.

Apos confirmar uma transacao, a query da wallet e invalidada para atualizar o saldo.

## Modulo 28 — Veiculos e Historico

A rota `/vehicles` permite ao cliente:

- listar veiculos
- cadastrar nova placa
- editar marca, modelo e cor
- ativar/desativar veiculo
- definir veiculo principal

Endpoints usados:

- `GET /vehicles`
- `POST /vehicles`
- `PUT /vehicles/:id`
- `PATCH /vehicles/:id/activate`
- `PATCH /vehicles/:id/deactivate`
- `PATCH /vehicles/:id/set-primary`

A rota `/history` mostra o historico real de atendimentos/lavagens do cliente.

Endpoint usado:

- `GET /operational/my-attendances`

Dados exibidos:

- unidade
- placa
- tipo
- status
- origem manual/camera
- data de entrada
- data de saida
- valor pago
- cashback usado

Se ainda nao houver atendimentos registrados, a tela mostra estado vazio profissional.

Atalhos na Home:

- `Meus Veiculos` abre `/vehicles`
- `Historico` abre `/history`

## Dashboards administrativos

As areas abaixo nao fazem parte do app mobile do assinante:

- Operacao da Unidade
- Minha Franquia
- Meu Parceiro
- Super Admin

Esses portais ficam no projeto web separado:

```text
uau-web-dashboard
```

O mobile deve permanecer focado em:

- Home
- Wallet/Cashback
- Minhas Cobrancas
- Assinar
- Parceiros
- Minha Rede
- Meus Veiculos
- Historico
- Notificacoes
- Perfil

## Testar login

1. Suba o backend UAU+ Core.
2. Configure `EXPO_PUBLIC_API_URL`.
3. Inicie o app com `npm run start`.
4. Entre com um cliente/assinante criado no backend.

Para cadastro:

1. Abra `Criar cadastro`.
2. Informe nome, e-mail, telefone, CPF e senha.
3. Os campos `stateId`, `cityId` e `defaultUnitId` sao opcionais nesta fase.
4. Ao cadastrar com sucesso, o app faz login automatico.

## Rotas

- `/`
- `/(auth)/login`
- `/(auth)/register`
- `/(tabs)/home`
- `/(tabs)/wallet`
- `/(tabs)/billing`
- `/(tabs)/partners`
- `/(tabs)/profile`
- `/subscribe`
- `/referrals`
- `/partners/:id`
- `/vehicles`
- `/history`
- `/notifications`

As antigas rotas mobile administrativas foram removidas de `app/` e preservadas fora do Expo Router em:

```text
src/legacy-admin-mobile
```

Isso inclui:

- `app/operator`
- `app/franchise`
- `app/partner-dashboard`

Rotas internas sao protegidas. Enquanto a sessao esta sendo restaurada, o app mostra loading e nao renderiza as abas.

## Validacoes

```bash
npm run typecheck
npx expo-doctor
```
