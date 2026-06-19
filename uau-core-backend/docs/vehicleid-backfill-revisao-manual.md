# Backfill vehicleId — Casos para Revisão Manual no Atendimento

**Data do backfill:** 2026-06-17  
**Contexto:** Migração do sistema legado. As Subscriptions foram importadas sem `vehicleId` (campo não existia).  
Para 391 casos houve associação automática confiável (cliente com 1 veículo único ou com `isPrimary` marcado).  
Para os casos abaixo, o critério usado foi **"veículo mais recentemente cadastrado na data da migração"** — na prática arbitrário, pois todos os veículos foram inseridos no mesmo dia (2026-06-09) e não há histórico de uso (DailyWash) que permita distinguir qual carro estava ativo na assinatura.

**Ação para o time de atendimento:** Se algum desses clientes reclamar que o sistema está rejeitando o carro errado na lavagem, corrija o `vehicleId` da Subscription via painel admin e marque `isPrimary = true` no veículo correto.

---

## Casos do Passo B — Veículos genuinamente diferentes, critério arbitrário

| # | customerId | vehicleId escolhido | Placa escolhida | Outras placas disponíveis | Obs |
|---|---|---|---|---|---|
| 1 | `66f5b8e9841a4dd1aa8f7eb29bade23c` | `c2f60d42f7ad48bbb34a1436614e4469` | ABE4321 | UAW1234 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 2 | `d5b468bbd9f5459884cf90e9f3f041f3` | `b5734e2ea009426fba98b0f5ae7bcbac` | QST4D33 | PON4285 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 3 | `0efc004609e8492282ec91cb8dc5daf8` | `f316a31e42594ff18740c9371a618195` | TXY9E25 | TXT9D69 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 4 | `be5e8b36f6804f449227fb97be7b76c5` | `b0d808656e304dba9af32c6a03571893` | PNI5C25 | PSZ8F78 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 5 | `8249293ef8c149cd9305d27c9e103ae4` | `3988799facc547a095d7b2cd061dbf51` | PNC5J77 | PCN5J78 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 6 | `90794ad5e508470f9f4e488aa429c86c` | `371fd404cedc448d94da5e3b60631dec` | TCM2I40 | SIV3E82 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 7 | `3b4533eb2144453090f23d446e2c517d` | `4be57263a770425daa6c5c82f8be7939` | THU0F47 | PKO4B35, POG1D84 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 8 | `ee0ae023060f4b378e1cbd8033915d3c` | `3dc5117c7a074f3fb69ca9b2cd0689c5` | TIM6H93 | THS2H26 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 9 | `a23f656f2e8348d48c124edc8b2459bf` | `c07da57caf45447f8ffbd28593427838` | TIG8J16 | TIG1111 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 10 | `8ef1327c988743f090c6eee56f020e71` | `6af2e7a829334262b32a8614786e73c2` | SAO6F77 | SBB1D01 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 11 | `2121ea48bdb449179aae6f54cda6acde` | `af7020ce7c3a48c4b4df26d87d1db4f9` | TID7I58 | TID1234 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 12 | `9da2fbc755c84b818758c0c040f3c7c5` | `e176a8b7943f42af9a26e6cac54ccbab` | QQQ8H57 | TID2G10 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 13 | `210d103b0f5b4020a317e252e31bfb9e` | `4fb929cf216d47b79857d47146fc5764` | SBQ4G92 | SS04J84 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 14 | `7429b0ae79d14a70b4f018a585183133` | `83bb51a92cd045ab907f05fc5df7b169` | QFS9B74 | TER4H87 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 15 | `29f4b544826c4d8bbacc8f808f619601` | `88706a0c02a84fb68ed26194a723aa8d` | POI8A37 | SAT0H80, SAU1I87 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 16 | `e9092c9a8dc646b78b1aff7cc3aaf463` | `7bace70edcbd427198eddc22f468f26e` | SBT8H01 | HQD0J64 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 17 | `a37528e697334852b5cefd5308f03c8b` | `517459bca3ef4fb2b9bc7ac5a4d2370a` | THQ2F37 | THT0G62 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 18 | `0725a357696c48619f7fdef708fcb98c` | `4332562fd2a34192bb0539e72d9555d9` | THP6H94 | SAN7C96 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 19 | `7e02443e33604327b6b2798f52a83147` | `60680a44485f4f358cd1e3fd9f11fa28` | OCC1964 | OAV9A99 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 20 | `25d6bd2689b247d080f8c42218aa001f` | `36cde3c9fc5b4404908d16777ced7746` | SAS0J47 | TID7D87 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 21 | `02cf6a45495e46b9a445dd53f280ecc4` | `4ad741dec8b148f48ce4fdaf558ac49c` | SBT8J49 | THQ3HO4 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 22 | `0fd8f6427cc648028b0c8eecd49dd73a` | `5e381796304e420190a8ef26510f80e9` | POY5080 | POF8D19 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |
| 23 | `b72bab2690ce44df9c7a0380a8f5c068` | `d259eca190a14f5ba31ddcb7f49cf7c5` | TIE4H80 | SPM2H10 | vehicleId associado por critério arbitrário (data de cadastro) — confirmar no primeiro contato com o cliente |

---

## Casos do Passo A — Dado sujo tratado com critério de mais recente

Estes clientes tinham placas com similaridade muito alta (Levenshtein ≤ 2), indicando possível erro de digitação no legado. O vehicleId foi associado ao veículo mais recentemente cadastrado (mesmo critério do Passo B), mas **os veículos duplicados precisam de atenção adicional**.

| # | customerId | vehicleId escolhido | Placa escolhida | Placas suspeitas | Ação recomendada |
|---|---|---|---|---|---|
| 24 | `f6887ba169c3428982a33f202cd01a34` | `1e86cb5635694be9958e693fb896c4f2` | SAQ5B95 | SAQ5B95 ↔ SAQ5B96 (Lev=1) | Verificar qual é a placa real do cliente. Se SAQ5B96 for erro de digitação, corrigir/deletar o Vehicle SAQ5B96 (`fa9254514bec46e2a56392a2d429af12`). |
| 25 | `f0b259c7ce3b4a8791c1b823e3f1764b` | `17645603196d4d2b823ce18ca927f36f` | TIH3F01 | TIH3F01 ↔ TOH3F01 (Lev=1, confusão I/O) | Verificar qual é a placa real (I ou O). Se TOH3F01 for erro, corrigir/deletar o Vehicle TOH3F01 (`6efea273363345a995c81c8c915e49e6`). |
| 26 | `befa9903b47a4561894586c1822d109e` | `dac06628b00c4017aed672f2956db2c3` | OUC9G90 | OUC9G90 / WOUC9G90 / OUC9G900 | ✅ Já corrigido: veículos duplicados WOUC9G90 e OUC9G900 foram deletados do banco (zero dependências). Subscription associada a OUC9G90. |

---

## Clientes sem veículo cadastrado (2 casos — sem ação possível)

Estes clientes têm Subscription no sistema legado mas nenhum Vehicle cadastrado. A Subscription permanece com `vehicleId = NULL`. O sistema bloqueará lavagem até que um veículo seja cadastrado manualmente.

| customerId | subscriptionId |
|---|---|
| `0f51ec772ebb46cbae834423278b7601` | `51a87bcde1d94f2d8921fdaf8b9889ca` |
| `be8354c0d2a44b5bab80cc99fe84b967` | `7f283329ec734603a067c0f5c38add1c` |
