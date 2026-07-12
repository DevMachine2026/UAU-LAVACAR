# Ficha da Play Store — Uau Lava Car+

> Fonte da verdade dos textos e respostas de formulário da listagem.
> Cole cada bloco no campo correspondente do Play Console.
> Limites: nome ≤30 · descrição curta ≤80 · descrição completa ≤4000.

---

## Nome do app (30 max)

```
Uau Lava Car+
```

## Descrição curta (80 max)

```
Assine, lave sempre e ganhe cashback a cada lavagem do seu carro.
```

## Descrição completa (4000 max)

```
Seu carro sempre limpo por um valor que cabe no bolso — e com dinheiro de volta a cada lavagem.

O Uau Lava Car+ é o clube de assinatura do Uau! Lava Car: você escolhe um plano, lava seu carro nas unidades participantes e acumula cashback direto na sua carteira digital.

POR QUE ASSINAR

✓ Planos flexíveis — mensal, parcelado, semestral ou anual: escolha o ritmo ideal para a sua rotina
✓ Cashback em toda lavagem — parte do valor volta para você, automaticamente
✓ Carteira digital — acompanhe seu saldo e use quando quiser
✓ Indique e ganhe — R$ 10 de bônus para cada amigo que assinar
✓ Tudo no app — cobranças, histórico de lavagens, veículos e unidades em um só lugar
✓ Clube de parceiros — vantagens exclusivas para assinantes

COMO FUNCIONA

1. Crie sua conta em menos de um minuto
2. Escolha o plano ideal e finalize o checkout com segurança
3. Cadastre seu veículo e encontre a unidade mais próxima
4. Lave, acumule cashback e acompanhe tudo pelo app

PAGAMENTO SIMPLES E SEGURO

Assinatura com cobrança automática e pagamento processado por parceiro certificado. Sem surpresa, sem letra miúda: você acompanha cada cobrança dentro do app.

PARA QUEM É

Para quem cuida do carro e do bolso: motoristas de aplicativo, famílias, apaixonados por carro limpo e qualquer pessoa cansada de pagar caro em lavagem avulsa.

Baixe agora, escolha seu plano e comece a ganhar cashback na primeira lavagem.

Dúvidas ou sugestões? Fale com a gente: contato@uaulavacar.com.br
```

---

## Campos da ficha

| Campo | Valor |
|---|---|
| Categoria | Auto e veículos |
| Tags | lava car, lavagem de carro, assinatura, cashback, clube de vantagens |
| E-mail de contato | contato@uaulavacar.com.br |
| Site | https://uau-lavacar.vercel.app |
| Política de privacidade | https://uau-lavacar.vercel.app/privacidade (testada, HTTP 200) |

## Classificação de conteúdo (questionário IARC)

Respostas esperadas — app utilitário sem conteúdo sensível:

- Violência / sexo / linguagem imprópria / drogas / apostas: **Não** em tudo
- Conteúdo gerado por usuário visível a terceiros: **Não**
- Compartilha localização do usuário com terceiros: **Não**
- Permite compras digitais: **Sim** (assinaturas)
- Resultado esperado: **Livre (L)**

## Público-alvo

- Faixa etária: **18+** (app transacional com cobrança — evita exigências extras de apps infantis)
- App não é direcionado a crianças: **Sim, confirmar**

## Segurança dos dados (Data safety)

Dados coletados (declarar):

| Dado | Coletado? | Compartilhado? | Finalidade |
|---|---|---|---|
| Nome | Sim | Não | Gestão de conta |
| E-mail | Sim | Não | Gestão de conta, login |
| Telefone | Se cadastro pedir | Não | Gestão de conta |
| Histórico de compras | Sim | Com processador de pagamento (Asaas) | Funcionalidade do app |
| Info de pagamento | Processada pelo Asaas (não armazenada no app) | — | Pagamento |
| Registros de falhas (crash logs) | Sim (Sentry) | Com Sentry (operador) | Diagnóstico |
| Identificadores de dispositivo | Sim (Sentry/diagnóstico) | Com Sentry | Diagnóstico |

Práticas: dados criptografados em trânsito (HTTPS) — **Sim**. Usuário pode pedir exclusão — **Sim** (via e-mail de suporte). Sem venda de dados.

## Checklist de publicação (1ª vez — manual)

1. [ ] Verificação de desenvolvedor Android (banner da conta)
2. [ ] Ficha da loja: textos acima + ícone 512 + feature graphic + 3 screenshots
3. [ ] Corrigir nome da listagem: "Uau Lavacar+" → "Uau Lava Car+"
4. [ ] Classificação de conteúdo, público-alvo, data safety (guias acima)
5. [ ] URL da política de privacidade
6. [ ] AAB de produção (EAS build) enviado na faixa **Teste interno**
7. [ ] Adicionar testadores internos (e-mails) e publicar na faixa
8. [ ] Depois do teste: promover para Produção
9. [ ] (futuro) Service account JSON → `eas submit` automatizado
