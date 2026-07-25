# Test Data Seed Specification — Zan Visual Novel

**Objetivo:** Definir massa de dados de teste controlada e reproduzível para testes de regressão.  
**Formato:** Especificação para script de seed (SQL ou Drizzle).  
**Escopo:** Usuários, VNs, Capítulos, Cenas, Escolhas, Saves, Créditos.

---

## 1. Usuários de Teste

### 1.1 Jogador (player)

| Campo            | Valor                                  |
| ---------------- | -------------------------------------- |
| `id`             | `00000000-0000-0000-0000-000000000001` |
| `email`          | `jogador@teste.com`                    |
| `passwordHash`   | bcrypt(`Teste123!`, 12)                |
| `displayName`    | `Jogador Teste`                        |
| `role`           | `player`                               |
| `creditsBalance` | `50`                                   |
| `avatarUrl`      | `null`                                 |

### 1.2 Criador (creator)

| Campo            | Valor                                  |
| ---------------- | -------------------------------------- |
| `id`             | `00000000-0000-0000-0000-000000000002` |
| `email`          | `criador@teste.com`                    |
| `passwordHash`   | bcrypt(`Teste123!`, 12)                |
| `displayName`    | `Criador Teste`                        |
| `role`           | `creator`                              |
| `creditsBalance` | `0`                                    |
| `avatarUrl`      | `null`                                 |

### 1.3 Admin

| Campo            | Valor                                  |
| ---------------- | -------------------------------------- |
| `id`             | `00000000-0000-0000-0000-000000000003` |
| `email`          | `admin@teste.com`                      |
| `passwordHash`   | bcrypt(`Teste123!`, 12)                |
| `displayName`    | `Admin Teste`                          |
| `role`           | `admin`                                |
| `creditsBalance` | `0`                                    |

---

## 2. Visual Novels

### 2.1 VN 1 — Publicada (A Primeira Escolha)

| Campo           | Valor                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `id`            | `10000000-0000-0000-0000-000000000001`                                                                                   |
| `creatorId`     | `00000000-0000-0000-0000-000000000002`                                                                                   |
| `title`         | `A Primeira Escolha`                                                                                                     |
| `synopsis`      | `Uma aventura interativa onde cada decisão muda o destino. Explore um mundo de fantasia e descubra segredos ancestrais.` |
| `coverImageUrl` | `null`                                                                                                                   |
| `status`        | `published`                                                                                                              |
| `genre`         | `fantasy`                                                                                                                |
| `tags`          | `["fantasia", "aventura", "mistério"]`                                                                                   |
| `totalChapters` | `2`                                                                                                                      |
| `priceCredits`  | `10`                                                                                                                     |
| `llmConfig`     | `{"modelType": "lfm-230m", "persona": "narrador épico", "temperature": 0.8}`                                             |

### 2.2 VN 2 — Publicada (Noite Eterna)

| Campo           | Valor                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| `id`            | `10000000-0000-0000-0000-000000000002`                                                                   |
| `creatorId`     | `00000000-0000-0000-0000-000000000002`                                                                   |
| `title`         | `Noite Eterna`                                                                                           |
| `synopsis`      | `Um thriller psicológico em uma cidade onde o sol nunca nasce. Investigue desaparecimentos misteriosos.` |
| `coverImageUrl` | `null`                                                                                                   |
| `status`        | `published`                                                                                              |
| `genre`         | `thriller`                                                                                               |
| `tags`          | `["suspense", "mistério", "noir"]`                                                                       |
| `totalChapters` | `3`                                                                                                      |
| `priceCredits`  | `15`                                                                                                     |
| `llmConfig`     | `{"modelType": "lfm-350m", "persona": "detetive cético", "temperature": 0.7}`                            |

### 2.3 VN 3 — Publicada (Fragmentos do Amanhã)

| Campo           | Valor                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `id`            | `10000000-0000-0000-0000-000000000003`                                                                 |
| `creatorId`     | `00000000-0000-0000-0000-000000000002`                                                                 |
| `title`         | `Fragmentos do Amanhã`                                                                                 |
| `synopsis`      | `Uma história de amor e perda em um futuro distópico. Cada memória recuperada revela um novo caminho.` |
| `coverImageUrl` | `null`                                                                                                 |
| `status`        | `published`                                                                                            |
| `genre`         | `romance`                                                                                              |
| `tags`          | `["romance", "ficção científica", "drama"]`                                                            |
| `totalChapters` | `2`                                                                                                    |
| `priceCredits`  | `10`                                                                                                   |
| `llmConfig`     | `{"modelType": "lfm-230m", "persona": "narrador poético", "temperature": 0.9}`                         |

### 2.4 VN 4 — Rascunho (Projeto Secreto)

| Campo           | Valor                                     |
| --------------- | ----------------------------------------- |
| `id`            | `10000000-0000-0000-0000-000000000004`    |
| `creatorId`     | `00000000-0000-0000-0000-000000000002`    |
| `title`         | `Projeto Secreto`                         |
| `synopsis`      | `Rascunho de uma história de espionagem.` |
| `coverImageUrl` | `null`                                    |
| `status`        | `draft`                                   |
| `genre`         | `action`                                  |
| `tags`          | `["espionagem", "ação"]`                  |
| `totalChapters` | `1`                                       |
| `priceCredits`  | `0`                                       |
| `llmConfig`     | `null`                                    |

### 2.5 VN 5 — Rascunho (Sem Título)

| Campo           | Valor                                  |
| --------------- | -------------------------------------- |
| `id`            | `10000000-0000-0000-0000-000000000005` |
| `creatorId`     | `00000000-0000-0000-0000-000000000002` |
| `title`         | `Sem Título`                           |
| `synopsis`      | `...`                                  |
| `coverImageUrl` | `null`                                 |
| `status`        | `draft`                                |
| `genre`         | `other`                                |
| `tags`          | `[]`                                   |
| `totalChapters` | `0`                                    |
| `priceCredits`  | `0`                                    |
| `llmConfig`     | `null`                                 |

---

## 3. Capítulos

### 3.1 VN 1: A Primeira Escolha

#### Capítulo 1

| Campo          | Valor                                  |
| -------------- | -------------------------------------- |
| `id`           | `20000000-0000-0000-0000-000000000001` |
| `vnId`         | `10000000-0000-0000-0000-000000000001` |
| `title`        | `O Despertar`                          |
| `orderIndex`   | `0`                                    |
| `status`       | `published`                            |
| `startSceneId` | `30000000-0000-0000-0000-000000000001` |
| `priceCredits` | `0`                                    |

#### Capítulo 2

| Campo          | Valor                                  |
| -------------- | -------------------------------------- |
| `id`           | `20000000-0000-0000-0000-000000000002` |
| `vnId`         | `10000000-0000-0000-0000-000000000001` |
| `title`        | `A Encruzilhada`                       |
| `orderIndex`   | `1`                                    |
| `status`       | `published`                            |
| `startSceneId` | `30000000-0000-0000-0000-000000000004` |
| `priceCredits` | `10`                                   |

### 3.2 VN 2: Noite Eterna

#### Capítulo 1

| Campo          | Valor                                  |
| -------------- | -------------------------------------- |
| `id`           | `20000000-0000-0000-0000-000000000003` |
| `vnId`         | `10000000-0000-0000-0000-000000000002` |
| `title`        | `O Caso`                               |
| `orderIndex`   | `0`                                    |
| `status`       | `published`                            |
| `startSceneId` | `30000000-0000-0000-0000-000000000007` |
| `priceCredits` | `0`                                    |

#### Capítulo 2

| Campo          | Valor                                  |
| -------------- | -------------------------------------- |
| `id`           | `20000000-0000-0000-0000-000000000004` |
| `vnId`         | `10000000-0000-0000-0000-000000000002` |
| `title`        | `Pistas`                               |
| `orderIndex`   | `1`                                    |
| `status`       | `published`                            |
| `startSceneId` | `30000000-0000-0000-0000-000000000009` |
| `priceCredits` | `5`                                    |

#### Capítulo 3

| Campo          | Valor                                  |
| -------------- | -------------------------------------- |
| `id`           | `20000000-0000-0000-0000-000000000005` |
| `vnId`         | `10000000-0000-0000-0000-000000000002` |
| `title`        | `Revelação`                            |
| `orderIndex`   | `2`                                    |
| `status`       | `published`                            |
| `startSceneId` | `30000000-0000-0000-0000-000000000011` |
| `priceCredits` | `10`                                   |

### 3.3 VN 3: Fragmentos do Amanhã

#### Capítulo 1

| Campo          | Valor                                  |
| -------------- | -------------------------------------- |
| `id`           | `20000000-0000-0000-0000-000000000006` |
| `vnId`         | `10000000-0000-0000-0000-000000000003` |
| `title`        | `Memórias Perdidas`                    |
| `orderIndex`   | `0`                                    |
| `status`       | `published`                            |
| `startSceneId` | `30000000-0000-0000-0000-000000000013` |
| `priceCredits` | `0`                                    |

#### Capítulo 2

| Campo          | Valor                                  |
| -------------- | -------------------------------------- |
| `id`           | `20000000-0000-0000-0000-000000000007` |
| `vnId`         | `10000000-0000-0000-0000-000000000003` |
| `title`        | `Reencontro`                           |
| `orderIndex`   | `1`                                    |
| `status`       | `published`                            |
| `startSceneId` | `30000000-0000-0000-0000-000000000016` |
| `priceCredits` | `10`                                   |

### 3.4 VN 4: Projeto Secreto (rascunho)

#### Capítulo 1

| Campo          | Valor                                  |
| -------------- | -------------------------------------- |
| `id`           | `20000000-0000-0000-0000-000000000008` |
| `vnId`         | `10000000-0000-0000-0000-000000000004` |
| `title`        | `Infiltração`                          |
| `orderIndex`   | `0`                                    |
| `status`       | `draft`                                |
| `startSceneId` | `30000000-0000-0000-0000-000000000019` |
| `priceCredits` | `0`                                    |

---

## 4. Cenas

### 4.1 VN 1 — A Primeira Escolha

#### Cena 1.1 — Introdução (narration)

| Campo         | Valor                                                                                                                                                                                                                                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `30000000-0000-0000-0000-000000000001`                                                                                                                                                                                                                                                                                                                     |
| `chapterId`   | `20000000-0000-0000-0000-000000000001`                                                                                                                                                                                                                                                                                                                     |
| `title`       | `O Começo`                                                                                                                                                                                                                                                                                                                                                 |
| `type`        | `narration`                                                                                                                                                                                                                                                                                                                                                |
| `content`     | `[{"id":"tb-001","type":"narration","text":"Você acorda em uma clareira iluminada por cogumelos luminescentes. O ar cheira a terra molhada e flores noturnas. Não há memória de como chegou aqui."},{"id":"tb-002","type":"narration","text":"Ao longe, você avista duas trilhas: uma leva a uma torre iluminada, outra desce para uma caverna escura."}]` |
| `nextSceneId` | `null`                                                                                                                                                                                                                                                                                                                                                     |
| `choices`     | `[{"id":"ch-001","text":"Seguir para a torre iluminada","targetSceneId":"30000000-0000-0000-0000-000000000002","conditions":null,"effects":null},{"id":"ch-002","text":"Descer para a caverna escura","targetSceneId":"30000000-0000-0000-0000-000000000003","conditions":null,"effects":null}]`                                                           |

#### Cena 1.2 — Torre (dialogue)

| Campo         | Valor                                                                                                                                                                                                                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`          | `30000000-0000-0000-0000-000000000002`                                                                                                                                                                                                                                                                                                                             |
| `chapterId`   | `20000000-0000-0000-0000-000000000001`                                                                                                                                                                                                                                                                                                                             |
| `title`       | `A Torre`                                                                                                                                                                                                                                                                                                                                                          |
| `type`        | `dialogue`                                                                                                                                                                                                                                                                                                                                                         |
| `content`     | `[{"id":"tb-003","type":"narration","text":"Você sobe as escadas da torre. Uma figura encapuzada espera no topo."},{"id":"tb-004","type":"dialogue","speaker":"Guardião","text":"Eu sabia que você viria. O destino finalmente nos reuniu."},{"id":"tb-005","type":"dialogue","speaker":"Guardião","text":"Mas preciso saber: você está pronto para a verdade?"}]` |
| `nextSceneId` | `30000000-0000-0000-0000-000000000004`                                                                                                                                                                                                                                                                                                                             |
| `choices`     | `[]`                                                                                                                                                                                                                                                                                                                                                               |

#### Cena 1.3 — Caverna (narration + thought)

| Campo         | Valor                                                                                                                                                                                                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `30000000-0000-0000-0000-000000000003`                                                                                                                                                                                                                                                                                                               |
| `chapterId`   | `20000000-0000-0000-0000-000000000001`                                                                                                                                                                                                                                                                                                               |
| `title`       | `A Caverna`                                                                                                                                                                                                                                                                                                                                          |
| `type`        | `narration`                                                                                                                                                                                                                                                                                                                                          |
| `content`     | `[{"id":"tb-006","type":"narration","text":"A escuridão da caverna é quase total. Você tateia as paredes úmidas."},{"id":"tb-007","type":"thought","speaker":"Você","text":"Será que foi uma boa ideia entrar aqui?"},{"id":"tb-008","type":"narration","text":"Seus dedos encontram uma superfície lisa — uma porta de pedra com runas antigas."}]` |
| `nextSceneId` | `30000000-0000-0000-0000-000000000004`                                                                                                                                                                                                                                                                                                               |
| `choices`     | `[]`                                                                                                                                                                                                                                                                                                                                                 |

#### Cena 1.4 — Encruzilhada (Cap 2)

| Campo         | Valor                                                                                                                                                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `30000000-0000-0000-0000-000000000004`                                                                                                                                                                                                                                                            |
| `chapterId`   | `20000000-0000-0000-0000-000000000002`                                                                                                                                                                                                                                                            |
| `title`       | `A Encruzilhada`                                                                                                                                                                                                                                                                                  |
| `type`        | `narration`                                                                                                                                                                                                                                                                                       |
| `content`     | `[{"id":"tb-009","type":"narration","text":"Independente do caminho escolhido, você chega ao mesmo ponto: uma encruzilhada no coração da floresta."},{"id":"tb-010","type":"narration","text":"Três estátuas antigas marcam as direções: Sabedoria, Poder e Sacrifício."}]`                       |
| `nextSceneId` | `null`                                                                                                                                                                                                                                                                                            |
| `choices`     | `[{"id":"ch-003","text":"Escolher o caminho da Sabedoria","targetSceneId":"30000000-0000-0000-0000-000000000005","conditions":null,"effects":null},{"id":"ch-004","text":"Escolher o caminho do Poder","targetSceneId":"30000000-0000-0000-0000-000000000006","conditions":null,"effects":null}]` |

#### Cena 1.5 — Final Sabedoria

| Campo         | Valor                                                                                                                                                                                                                                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `30000000-0000-0000-0000-000000000005`                                                                                                                                                                                                                                                                                                  |
| `chapterId`   | `20000000-0000-0000-0000-000000000002`                                                                                                                                                                                                                                                                                                  |
| `title`       | `Sabedoria`                                                                                                                                                                                                                                                                                                                             |
| `type`        | `narration`                                                                                                                                                                                                                                                                                                                             |
| `content`     | `[{"id":"tb-011","type":"narration","text":"Você escolhe a Sabedoria. O conhecimento flui como um rio cristalino em sua mente."},{"id":"tb-012","type":"narration","text":"As respostas que buscava sempre estiveram dentro de você. A jornada apenas as revelou."},{"id":"tb-013","type":"narration","text":"FIM — Final Sabedoria"}]` |
| `nextSceneId` | `null`                                                                                                                                                                                                                                                                                                                                  |
| `choices`     | `[]`                                                                                                                                                                                                                                                                                                                                    |

#### Cena 1.6 — Final Poder

| Campo         | Valor                                                                                                                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`          | `30000000-0000-0000-0000-000000000006`                                                                                                                                                                                                                                                           |
| `chapterId`   | `20000000-0000-0000-0000-000000000002`                                                                                                                                                                                                                                                           |
| `title`       | `Poder`                                                                                                                                                                                                                                                                                          |
| `type`        | `narration`                                                                                                                                                                                                                                                                                      |
| `content`     | `[{"id":"tb-014","type":"narration","text":"Você escolhe o Poder. Uma energia ancestral percorre seu corpo."},{"id":"tb-015","type":"narration","text":"Mas poder sem sabedoria é perigoso. A floresta estremece ao seu redor."},{"id":"tb-016","type":"narration","text":"FIM — Final Poder"}]` |
| `nextSceneId` | `null`                                                                                                                                                                                                                                                                                           |
| `choices`     | `[]`                                                                                                                                                                                                                                                                                             |

### 4.2 VN 2 — Noite Eterna

#### Cena 2.1 — Escritório (Cap 1)

| Campo         | Valor                                                                                                                                                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `30000000-0000-0000-0000-000000000007`                                                                                                                                                                                                                            |
| `chapterId`   | `20000000-0000-0000-0000-000000000003`                                                                                                                                                                                                                            |
| `title`       | `O Escritório`                                                                                                                                                                                                                                                    |
| `type`        | `narration`                                                                                                                                                                                                                                                       |
| `content`     | `[{"id":"tb-017","type":"narration","text":"A chuva bate contra a janela do seu escritório. São 3 da manhã e a cidade nunca viu o sol."},{"id":"tb-018","type":"narration","text":"Um dossiê está sobre sua mesa: 'Caso 47 — Desaparecimentos na Zona Norte'."}]` |
| `nextSceneId` | `null`                                                                                                                                                                                                                                                            |
| `choices`     | `[{"id":"ch-005","text":"Abrir o dossiê e investigar","targetSceneId":"30000000-0000-0000-0000-000000000008","conditions":null,"effects":null}]`                                                                                                                  |

#### Cena 2.2 — Investigação

| Campo         | Valor                                                                                                                                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `30000000-0000-0000-0000-000000000008`                                                                                                                                                                                                                         |
| `chapterId`   | `20000000-0000-0000-0000-000000000003`                                                                                                                                                                                                                         |
| `title`       | `Investigação`                                                                                                                                                                                                                                                 |
| `type`        | `dialogue`                                                                                                                                                                                                                                                     |
| `content`     | `[{"id":"tb-019","type":"narration","text":"O dossiê contém fotos, depoimentos e um padrão perturbador."},{"id":"tb-020","type":"dialogue","speaker":"Detetive","text":"Todas as vítimas desapareceram entre meia-noite e 1h da manhã. Todas na mesma rua."}]` |
| `nextSceneId` | `30000000-0000-0000-0000-000000000009`                                                                                                                                                                                                                         |
| `choices`     | `[]`                                                                                                                                                                                                                                                           |

### 4.3 VN 3 — Fragmentos do Amanhã

#### Cena 3.1 — Despertar (Cap 1)

| Campo         | Valor                                                                                                                                                                                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `30000000-0000-0000-0000-000000000013`                                                                                                                                                                                                                                            |
| `chapterId`   | `20000000-0000-0000-0000-000000000006`                                                                                                                                                                                                                                            |
| `title`       | `Despertar`                                                                                                                                                                                                                                                                       |
| `type`        | `narration`                                                                                                                                                                                                                                                                       |
| `content`     | `[{"id":"tb-021","type":"narration","text":"Ano 2157. O mundo como conhecemos acabou. Mas hoje, algo diferente acontece."},{"id":"tb-022","type":"thought","speaker":"Você","text":"Lembro... lembro do rosto dela. Depois de todos esses anos."}]`                               |
| `nextSceneId` | `null`                                                                                                                                                                                                                                                                            |
| `choices`     | `[{"id":"ch-006","text":"Seguir a memória","targetSceneId":"30000000-0000-0000-0000-000000000014","conditions":null,"effects":null},{"id":"ch-007","text":"Ignorar e seguir em frente","targetSceneId":"30000000-0000-0000-0000-000000000015","conditions":null,"effects":null}]` |

#### Cena 3.2 — Seguir Memória

| Campo         | Valor                                                                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `30000000-0000-0000-0000-000000000014`                                                                                                                                                                                                      |
| `chapterId`   | `20000000-0000-0000-0000-000000000006`                                                                                                                                                                                                      |
| `title`       | `Fragmento`                                                                                                                                                                                                                                 |
| `type`        | `dialogue`                                                                                                                                                                                                                                  |
| `content`     | `[{"id":"tb-023","type":"narration","text":"Você fecha os olhos e se concentra na memória."},{"id":"tb-024","type":"dialogue","speaker":"Ela","text":"Não importa o que aconteça, sempre vou te encontrar. Em todas as linhas do tempo."}]` |
| `nextSceneId` | `30000000-0000-0000-0000-000000000016`                                                                                                                                                                                                      |
| `choices`     | `[]`                                                                                                                                                                                                                                        |

#### Cena 3.3 — Ignorar

| Campo         | Valor                                                                                                                                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `30000000-0000-0000-0000-000000000015`                                                                                                                                                                                                                     |
| `chapterId`   | `20000000-0000-0000-0000-000000000006`                                                                                                                                                                                                                     |
| `title`       | `Seguir em Frente`                                                                                                                                                                                                                                         |
| `type`        | `narration`                                                                                                                                                                                                                                                |
| `content`     | `[{"id":"tb-025","type":"narration","text":"Você abre os olhos e segue seu caminho. Algumas memórias são melhor deixadas no passado."},{"id":"tb-026","type":"narration","text":"Mas no fundo, você sabe que esse fragmento voltará para te assombrar."}]` |
| `nextSceneId` | `30000000-0000-0000-0000-000000000016`                                                                                                                                                                                                                     |
| `choices`     | `[]`                                                                                                                                                                                                                                                       |

### 4.4 VN 4 — Projeto Secreto (rascunho)

#### Cena 4.1

| Campo         | Valor                                                                                                                              |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | `30000000-0000-0000-0000-000000000019`                                                                                             |
| `chapterId`   | `20000000-0000-0000-0000-000000000008`                                                                                             |
| `title`       | `Ponto de Encontro`                                                                                                                |
| `type`        | `narration`                                                                                                                        |
| `content`     | `[{"id":"tb-027","type":"narration","text":"O café está vazio, exceto por um homem de sobretudo no canto. Ele acena para você."}]` |
| `nextSceneId` | `null`                                                                                                                             |
| `choices`     | `[]`                                                                                                                               |

---

## 5. Saves de Teste

### 5.1 Save do Jogador — Slot 1 (Auto Save)

| Campo            | Valor                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `id`             | `40000000-0000-0000-0000-000000000001`                                                                        |
| `userId`         | `00000000-0000-0000-0000-000000000001`                                                                        |
| `vnId`           | `10000000-0000-0000-0000-000000000001`                                                                        |
| `slotNumber`     | `1`                                                                                                           |
| `label`          | `Auto Save`                                                                                                   |
| `currentSceneId` | `30000000-0000-0000-0000-000000000002`                                                                        |
| `flags`          | `{}`                                                                                                          |
| `choiceHistory`  | `[{"sceneId":"30000000-0000-0000-0000-000000000001","choiceId":"ch-001","timestamp":"2026-07-25T10:00:00Z"}]` |

### 5.2 Save do Jogador — Slot 2

| Campo            | Valor                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `id`             | `40000000-0000-0000-0000-000000000002`                                                                        |
| `userId`         | `00000000-0000-0000-0000-000000000001`                                                                        |
| `vnId`           | `10000000-0000-0000-0000-000000000001`                                                                        |
| `slotNumber`     | `2`                                                                                                           |
| `label`          | `Antes da escolha final`                                                                                      |
| `currentSceneId` | `30000000-0000-0000-0000-000000000004`                                                                        |
| `flags`          | `{}`                                                                                                          |
| `choiceHistory`  | `[{"sceneId":"30000000-0000-0000-0000-000000000001","choiceId":"ch-001","timestamp":"2026-07-25T10:00:00Z"}]` |

---

## 6. Transações de Créditos

### 6.1 Compra inicial do Jogador

| Campo           | Valor                                  |
| --------------- | -------------------------------------- |
| `userId`        | `00000000-0000-0000-0000-000000000001` |
| `type`          | `purchase`                             |
| `amount`        | `50`                                   |
| `balanceBefore` | `0`                                    |
| `balanceAfter`  | `50`                                   |
| `description`   | `Compra: Pacote Inicial (50 créditos)` |

---

## 7. Notas de Implementação do Seed

### 7.1 Script SQL (resumo)

```sql
-- Executar após drizzle migrate
-- Ordem: users → visual_novels → chapters → scenes → saves → credit_transactions

-- Users (senha: Teste123!)
INSERT INTO users (id, email, password_hash, display_name, role, credits_balance) VALUES
('00000000-0000-0000-0000-000000000001', 'jogador@teste.com', '$2a$12$...', 'Jogador Teste', 'player', 50),
('00000000-0000-0000-0000-000000000002', 'criador@teste.com', '$2a$12$...', 'Criador Teste', 'creator', 0),
('00000000-0000-0000-0000-000000000003', 'admin@teste.com', '$2a$12$...', 'Admin Teste', 'admin', 0);

-- Visual Novels
INSERT INTO visual_novels (...) VALUES (...);
-- (ver tabelas completas nas seções acima)

-- Chapters
INSERT INTO chapters (...) VALUES (...);

-- Scenes (content e choices como JSONB)
INSERT INTO scenes (...) VALUES (...);

-- Saves
INSERT INTO saves (...) VALUES (...);

-- Credit Transactions
INSERT INTO credit_transactions (...) VALUES (...);
```

### 7.2 Script Drizzle (recomendado)

```typescript
// backend/api/drizzle/seed-test.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function seed() {
  const hash = await bcrypt.hash('Teste123!', 12);

  // Users
  await db.insert(schema.users).values([...]);
  // VNs
  await db.insert(schema.visualNovels).values([...]);
  // ... etc

  console.log('✅ Test seed complete!');
  await pool.end();
}

seed();
```

### 7.3 Comando de seed

```bash
# Adicionar ao package.json:
# "db:seed:test": "tsx drizzle/seed-test.ts"

npm run db:seed:test
```

---

## 8. Limpeza dos Dados de Teste

Para resetar o ambiente de teste:

```sql
DELETE FROM credit_transactions WHERE user_id LIKE '00000000-%';
DELETE FROM saves WHERE user_id LIKE '00000000-%';
DELETE FROM scenes WHERE id LIKE '30000000-%';
DELETE FROM chapters WHERE id LIKE '20000000-%';
DELETE FROM visual_novels WHERE id LIKE '10000000-%';
DELETE FROM user_sessions WHERE user_id LIKE '00000000-%';
DELETE FROM users WHERE id LIKE '00000000-%';
```

Ou via script:

```bash
npm run db:seed:test:clean
```
