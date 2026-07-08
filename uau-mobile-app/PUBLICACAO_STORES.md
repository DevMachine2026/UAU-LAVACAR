# Guia de Publicação — Google Play & Apple App Store

> Estado atual: Expo SDK 54, React Native 0.81.5, `newArchEnabled=false`
> Bundle ID: `com.uauplus.mobile` | Versão: `1.0.0` (versionCode 1)

---

## ÍNDICE

1. [Pré-requisitos gerais](#1-pré-requisitos-gerais)
2. [Correções obrigatórias antes de publicar](#2-correções-obrigatórias-antes-de-publicar)
3. [Google Play Store](#3-google-play-store)
4. [Apple App Store](#4-apple-app-store)
5. [EAS Build — geração dos pacotes](#5-eas-build--geração-dos-pacotes)
6. [Checklist final](#6-checklist-final)

---

## 1. Pré-requisitos gerais

### Contas necessárias

| Conta | Custo | Link |
|---|---|---|
| Expo (EAS Build) | Grátis (tier Free tem 30 builds/mês) | expo.dev |
| Google Play Console | U$ 25 taxa única | play.google.com/console |
| Apple Developer Program | U$ 99/ano | developer.apple.com |

### Ferramenta EAS CLI

```bash
npm install -g eas-cli
eas login          # fazer login com conta Expo
eas whoami         # confirmar login
```

---

## 2. Correções obrigatórias antes de publicar

### 2.1 Corrigir `owner` no app.json

O campo `owner: "dev-machine"` é o nome da conta Expo. Deve ser o nome real da sua conta.

```json
// app.json
"owner": "SEU_USERNAME_EXPO"
```

Para descobrir seu username: `eas whoami`

### 2.2 Remover permissões perigosas desnecessárias

O `AndroidManifest.xml` atual tem permissões que a Play Store rejeita sem justificativa:

- `READ_EXTERNAL_STORAGE` — não utilizada pelo app → **remover**
- `WRITE_EXTERNAL_STORAGE` — não utilizada → **remover**
- `SYSTEM_ALERT_WINDOW` — sobrepõe outros apps → **remover** (adicionada pelo dev build, não vai para produção via EAS se não declarada no app.json)

Essas permissões são geradas pelo Expo em debug. O build de produção via EAS limpa as que não estão declaradas em `app.json`.

### 2.3 Verificar ícone iOS (sem canal alpha)

A App Store rejeita ícones com canal alpha (transparência). O `icon.png` atual é **RGB** (sem alpha), o que é correto. Manter assim.

```bash
python3 -c "
from PIL import Image
img = Image.open('assets/icon.png')
print(img.mode)  # deve ser RGB, não RGBA
"
```

Se for RGBA, converter:
```bash
python3 -c "
from PIL import Image
img = Image.open('assets/icon.png').convert('RGB')
img.save('assets/icon.png')
print('convertido para RGB')
"
```

### 2.4 Adicionar metadata de privacidade ao app.json

Status atual: configurado como `"privacy": "public"`.

```json
// app.json → dentro de "expo"
"privacy": "public",
```

### 2.5 URL da Política de Privacidade

Obrigatória em ambas as lojas para qualquer app com login/dados de usuário.

- Criar uma página simples (pode usar Notion, Google Sites ou uma rota no seu backend)
- A URL será exigida no cadastro da Play Console e App Store Connect
- Rotas internas já preparadas no dashboard: `/privacidade` e `/suporte`

---

## 3. Google Play Store

### 3.1 Criar conta na Play Console

1. Acesse play.google.com/console
2. Pague a taxa única de U$ 25
3. Preencha perfil de desenvolvedor (pode ser como pessoa física ou CNPJ)

### 3.2 Criar o app na Play Console

1. **Criar aplicativo** → nome: "UAU+ Lavacar"
2. Idioma padrão: Português (Brasil)
3. Tipo: Aplicativo (não jogo)
4. Gratuito ou pago: definir

### 3.3 Configurar o google-play-service-account.json

O `eas.json` já aponta para `./google-play-service-account.json`. Para gerar:

1. Play Console → Configurações → Acesso à API → Vincular ao Google Cloud
2. Criar conta de serviço → Papel: **Administrador de versão**
3. Baixar chave JSON → salvar como `uau-mobile-app/google-play-service-account.json`
4. **Não commitar esse arquivo no git** — adicionar ao `.gitignore`

```bash
echo "google-play-service-account.json" >> .gitignore
```

### 3.4 Configurar assinatura (Play App Signing)

A Play Store gerencia a chave de produção. O EAS gera um keystore de upload:

```bash
cd uau-mobile-app
eas credentials --platform android
# Escolher: "Generate new keystore" → EAS armazena com segurança
```

O EAS salva automaticamente o keystore no seu projeto Expo. **Guarde o backup** que o EAS disponibiliza no painel expo.dev → Credentials.

### 3.5 Preparar assets da listagem

**Obrigatórios:**
- Ícone da loja: **512×512 px, PNG, sem alpha** (diferente do ícone do app)
- Feature graphic: **1024×500 px, PNG/JPG** (banner exibido no topo da página)
- Screenshots: mínimo 2, máximo 8 por tipo de dispositivo
  - Celular: resolução mínima 320px, máxima 3840px, proporção entre 16:9 e 9:16

**Texto da listagem:**
- Nome do app: até 30 caracteres → `UAU+ Lavacar`
- Descrição curta: até 80 caracteres
- Descrição completa: até 4000 caracteres
- URL da política de privacidade

### 3.6 Classificação de conteúdo

Play Console → Classificação de conteúdo → responder o questionário.
Para um app de lavagem de carros com login: classificação provável **Livre**.

### 3.7 Configurar faixas de lançamento

O `eas.json` está configurado para enviar para a faixa **internal** (até 100 testers).
Fluxo recomendado:

```
internal (100 testers) → closed testing (beta) → open testing → production
```

Não é obrigatório passar por todas, mas a revisão da Play Store pode ser mais rápida em open testing primeiro.

### 3.8 Gerar e enviar o AAB

```bash
# Gerar o bundle de produção
eas build --platform android --profile production

# Quando o build terminar, enviar para a Play Store
eas submit --platform android --profile production
# ou fazer upload manual do .aab na Play Console
```

O processo de revisão leva de algumas horas até 7 dias na primeira submissão.

---

## 4. Apple App Store

### 4.1 Criar conta no Apple Developer Program

1. developer.apple.com → Enroll → Individual ou Organization
2. Pagar U$ 99/ano
3. Aguardar aprovação (pode levar de horas a dias)

### 4.2 Criar o app no App Store Connect

1. appstoreconnect.apple.com → Meus Apps → "+"
2. Nome: "UAU+ Lavacar"
3. Bundle ID: `com.uauplus.mobile`
4. SKU: qualquer string única (ex: `uauplus-lavacar-001`)

### 4.3 Configurar certificados via EAS

O EAS gerencia os certificados automaticamente:

```bash
eas credentials --platform ios
# Escolher: "Add new Distribution Certificate" e "Add new Provisioning Profile"
# O EAS cria e armazena tudo automaticamente
```

### 4.4 Preparar assets da listagem

**Screenshots obrigatórias** (mínimo para aprovação):
- iPhone 6.7" (iPhone 14 Pro Max / 16 Pro Max): 1290×2796 px
- iPhone 6.5" (iPhone 14 Plus / 11 Pro Max): 1242×2688 px
- *Opcional mas recomendado:* iPhone 5.5" (iPhone 8 Plus): 1242×2208 px

**Ícone da App Store:**
- 1024×1024 px, PNG, **sem alpha** → usar `assets/icon.png` (já está correto)

**Texto:**
- Nome: até 30 caracteres
- Subtítulo: até 30 caracteres (aparece abaixo do nome)
- Palavras-chave: até 100 caracteres (separe por vírgula)
- Descrição: até 4000 caracteres
- Notas de versão (o que há de novo)
- URL de suporte (obrigatório)
- URL de política de privacidade (obrigatório)

### 4.5 Informações de revisão da Apple

A Apple exige uma conta de demonstração para apps com login:

- App Store Connect → Informações de Revisão do App
- Fornecer e-mail e senha de uma conta de teste válida
- Comentários explicando o fluxo principal

### 4.6 Privacy Manifest (obrigatório desde iOS 17)

Apps que usam certas APIs precisam declarar o uso em `PrivacyInfo.xcprivacy`. O Expo SDK 54 já inclui o manifest base, mas verifique se as bibliotecas usadas precisam de entradas adicionais.

`expo-secure-store` → usa `NSUserDefaults` → deve estar declarado.

Isso é tratado automaticamente pelo EAS Build com SDK 54.

### 4.7 Gerar e enviar o IPA

```bash
# Gerar build de produção iOS (roda nos servidores EAS — não precisa de Mac)
eas build --platform ios --profile production

# Quando terminar, enviar para App Store Connect
eas submit --platform ios --profile production
```

O processo de revisão da Apple leva tipicamente de 24h a 3 dias. Pode ser rejeitado e você terá que corrigir e reenviar.

---

## 5. EAS Build — geração dos pacotes

### 5.1 Configurar variáveis de ambiente no EAS

As variáveis já estão em `eas.json` com a URL da API de produção. Para variáveis sensíveis, use secrets do EAS (não ficam no repositório):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://uau-core-backend.onrender.com/api/v1"
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://PUBLIC_KEY@SENTRY_HOST/PROJECT_ID"
```

### 5.2 Sequência de builds

```bash
# Primeiro: build de preview para testar antes de produção
eas build --platform android --profile preview

# Instalar no celular e testar exaustivamente

# Se ok, build de produção
eas build --platform android --profile production
eas build --platform ios --profile production

# Enviar para as lojas
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

### 5.3 Acompanhar builds

```bash
eas build:list          # listar builds
eas build:view <id>     # detalhes de um build específico
```

Ou acessar expo.dev → seu projeto → Builds.

---

## 6. Checklist final

### Antes de gerar o build de produção

- [ ] `owner` no `app.json` corrigido para o username real do Expo
- [x] `privacy` no `app.json` configurado como `public`
- [ ] `version` e `versionCode` incrementados se for atualização
- [ ] URL da Política de Privacidade definida
- [ ] Ícone `assets/icon.png` é RGB (sem alpha) e 1024×1024
- [ ] `adaptive-icon.png` com fundo teal e logo visível
- [ ] App testado end-to-end em aparelho real (login, tabs, fluxos principais)
- [ ] API de produção (`https://uau-core-backend.onrender.com`) respondendo

### Google Play

- [ ] Conta Play Console criada e taxa paga
- [ ] App criado na Play Console
- [ ] `google-play-service-account.json` obtido e configurado
- [ ] Keystore gerado via `eas credentials`
- [ ] Ícone 512×512 preparado
- [ ] Feature graphic 1024×500 preparado
- [ ] Screenshots de celular prontas (mínimo 2)
- [ ] Textos da listagem escritos (nome, descrição curta, descrição completa)
- [ ] Classificação de conteúdo respondida
- [ ] AAB gerado via `eas build --profile production`
- [ ] AAB enviado para faixa internal para teste final
- [ ] Promovido para produção após aprovação

### Apple App Store

- [ ] Apple Developer Program ativo e pago
- [ ] App criado no App Store Connect
- [ ] Certificados configurados via `eas credentials --platform ios`
- [ ] Screenshots 6.7" prontas (obrigatório)
- [ ] Screenshots 6.5" prontas (obrigatório)
- [ ] Textos da listagem escritos
- [ ] Conta de demo para revisão da Apple configurada
- [ ] URL de suporte definida
- [ ] IPA gerado via `eas build --platform ios --profile production`
- [ ] IPA enviado via `eas submit --platform ios`
- [ ] Aguardar revisão (24h–3 dias)

---

## Notas importantes

**`newArchEnabled=false`:** A Play Store e App Store aceitam normalmente. Não é bloqueante para publicação. Migrar para New Architecture é recomendado mas não obrigatório agora.

**Primeira submissão:** Sempre demora mais. Google leva até 7 dias, Apple até 3 dias. Submissões de atualização são mais rápidas.

**Incrementar versão a cada envio:**
```json
// app.json
"version": "1.0.1",        // visível para o usuário
"android": { "versionCode": 2 }   // deve ser sempre maior que o anterior
"ios": { "buildNumber": "2" }
```

Com `"autoIncrement": true` no perfil production do `eas.json`, o EAS incrementa `versionCode` e `buildNumber` automaticamente.
