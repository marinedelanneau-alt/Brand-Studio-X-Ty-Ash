# Inventaire du tutoiement — Brand Studio X Ty Ash

## État après harmonisation de l’application

La présentation client utilise désormais le vouvoiement : une correspondance éditoriale relue dans `lib/client-copy.ts` corrige les titres, introductions, questions, explications, placeholders, transcriptions et messages de feedback à la lecture, sans modifier le snapshot publié.

Le contrôle en lecture seule du contenu publié a confirmé 782 champs/libellés corrigés et aucun des tutoiements repérés restant dans cette présentation. Les modules, sous-modules, questions, groupes, positions et valeurs des choix restent identiques. Le miroir `module.exercises` n’est pas recompté.

Les réponses libres et les noms saisis par les clients ne sont jamais réécrits. Les libellés de choix prédéfinis sont affichés au vouvoiement, mais leurs valeurs enregistrées restent inchangées afin de conserver les sélections et la progression. Le suivi client applique la même présentation ; les écrans techniques Admin conservent leurs sources.

Les emails destinés à Julien et les messages de récupération du compte ont aussi été harmonisés. Les consignes d’assistance IA exigent le vouvoiement pour les conseils, tout en conservant la première personne pour les propositions rédigées au nom de la marque. Cette convention est inscrite dans `AGENTS.md` pour les prochains contenus.

Le relevé ci-dessous est conservé comme inventaire des formulations sources avant correction de leur affichage. Aucune écriture Supabase, modification de release, de réponse, d’accès ou de facturation, ni aucun envoi d’email n’a été effectué pour cette harmonisation.

Relevé du 21 octobre 2026. Projet : cplzwnlstcpqqzqeawgs.
Source : textes du parcours publié, lus uniquement par SELECT. Aucun brouillon ni aucune réponse utilisateur consulté ; aucune modification distante.
Le modèle local content/tyash-v1/pathway.json est déjà au vouvoiement et ne représente pas exactement les textes actuellement publiés.
Repérage des pronoms et des impératifs au singulier, puis contrôle des faux positifs.
Périmètre : titres, introductions, transcriptions, questions, explications, options, placeholders et messages de feedback. Les messages configurés sont inclus même si leur affichage dépend des réponses et de leur activation.
Décompte canonique : exercices parcourus uniquement dans leur sous-module ; le miroir module.exercises n'est pas compté une seconde fois.
La forme « êtes » n’est pas un possessif « tes ». Les emplois du nom « ton » (ton de voix, le ton…) et les chaînes techniques de recherche sont exclus. Aucune réécriture effectuée.

## Résultat

- 47 textes distincts au tutoiement.
- 782 champs/emplacements concernés, répétitions de feedback comprises.
- Module 1 : 234 champs concernés.
- Module 2 : 167 champs concernés.
- Module 3 : 90 champs concernés.
- Module 4 : 291 champs concernés.

## Liste exhaustive regroupée par texte

### 1. TON ENTREPRISE

Occurrences : 1.

- Module 1 — TON ENTREPRISE — `module[1].title`

### 2. TON HISTOIRE

Occurrences : 1.

- 1.1 — TON HISTOIRE — `module[1].submodule[1].title`

### 3. Que fait ton entreprise ?

Occurrences : 1.

- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-3;key=tyash_v1_question_c4389032-5351-46b1-941b-983f54ac8cef].question`

### 4. Présente ton entreprise Présente-nous ton entreprise simplement.

Occurrences : 1.

- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-3;key=tyash_v1_question_c4389032-5351-46b1-941b-983f54ac8cef].explanation`

### 5. Ta réponse est encore courte. Tu peux préciser qui tu aides, ce que tu apportes et comment.

Occurrences : 106.

- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-3;key=tyash_v1_question_c4389032-5351-46b1-941b-983f54ac8cef].feedback_config.rules[0].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-4;key=tyash_v1_question_81a6151c-6afe-4b2e-808e-7de0d4ffaa21].feedback_config.rules[0].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-5;key=tyash_v1_question_3cf4b9d1-dc5c-4462-8c41-da77e1809085].feedback_config.rules[0].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-6;key=tyash_v1_question_21727d86-9a91-4cc5-b7bd-d2f8554ee028].feedback_config.rules[0].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-7;key=tyash_v1_question_d28e8f73-2f6e-4e3a-b656-771bd46b6fda].feedback_config.rules[0].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-9;key=tyash_v1_question_d8d1270a-6bc1-4a18-9fe4-a81276d2a456].feedback_config.rules[0].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-10;key=tyash_v1_question_4698c6ab-4115-4f42-90fd-39de5e76f094].feedback_config.rules[0].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-11;key=tyash_v1_question_a8a8c7a5-f56b-42be-8fdd-aea303232b2a].feedback_config.rules[0].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-12;key=tyash_v1_question_93208543-81ac-462d-80cf-1ce901ae5be1].feedback_config.rules[0].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-13;key=tyash_v1_question_fbc98c27-aa31-4156-8d1b-d8c6efb82e54].feedback_config.rules[0].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-15;key=tyash_v1_question_8cf622ae-69ca-4e21-9d45-8f0dc988f858].feedback_config.rules[0].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-16;key=tyash_v1_question_5c51f7a6-f47a-440d-b0b9-17729d79a0ad].feedback_config.rules[0].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-17;key=tyash_v1_question_b90772e1-b46f-46b0-a8c8-9e3cc484bd9d].feedback_config.rules[0].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-18;key=tyash_v1_question_6119a01a-6b60-40f9-9696-04bd60b56ac6].feedback_config.rules[0].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-19;key=tyash_v1_question_2192dde4-4613-4972-84fa-1ec3b768c409].feedback_config.rules[0].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-20;key=tyash_v1_question_174d0783-eb40-4066-9efb-ac8125233486].feedback_config.rules[0].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-21;key=tyash_v1_question_f432312a-e508-4c59-9260-8d4fdc4c12ae].feedback_config.rules[0].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-22;key=tyash_v1_question_b61d3df1-8a4e-4028-854d-c18aad1e10f7].feedback_config.rules[0].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-23;key=tyash_v1_question_74c06ecc-f30c-4f7e-bbdd-dff9f648d7e7].feedback_config.rules[0].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-24;key=tyash_v1_question_b7d99986-dfc0-48d9-8a89-4c4c6277d4bc].feedback_config.rules[0].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-25;key=tyash_v1_question_21c2fdae-37b0-4a5e-bf76-24466e7ebe14].feedback_config.rules[0].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-26;key=tyash_v1_question_88f629f5-830d-417f-b0f9-404cfd8efcec].feedback_config.rules[0].message`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-28;key=tyash_v1_question_3887cc49-7322-4cea-b622-b746db9a121b].feedback_config.rules[0].message`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-29;key=tyash_v1_question_38f02fb7-0a97-4e00-bccf-4eae77fd3052].feedback_config.rules[0].message`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-30;key=tyash_v1_question_2e8b3cac-f238-40de-9918-034c07e383ac].feedback_config.rules[0].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-32;key=tyash_v1_question_afb6632b-2ef4-4033-b1ce-157e437e155d].feedback_config.rules[0].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-33;key=tyash_v1_question_5a839b8a-aaa6-4e92-8e7d-f6ee03030a7e].feedback_config.rules[0].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-34;key=tyash_v1_question_ba893b75-9398-4459-b5d8-5d624291b854].feedback_config.rules[0].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-35;key=tyash_v1_question_afcf80dd-9c90-45b3-a4ef-9e18fe3b10fa].feedback_config.rules[0].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-36;key=tyash_v1_question_a4fba8ad-606d-4ae2-9966-1dec711dd904].feedback_config.rules[0].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-37;key=tyash_v1_question_bfbab4db-1f27-4971-97d2-ecbafce11d95].feedback_config.rules[0].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-40;key=tyash_v1_question_08cd4cdb-646d-4b23-848a-56c564b3e0ad].feedback_config.rules[0].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-41;key=tyash_v1_question_76175718-ff39-47cb-9bf7-4cea1b158f8b].feedback_config.rules[0].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-42;key=tyash_v1_question_bf625f2f-38ae-4b24-8c31-6cf46da69b8a].feedback_config.rules[0].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-43;key=tyash_v1_question_9c1b5cc2-ab73-42f6-a3bf-fa1dff132559].feedback_config.rules[0].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-44;key=tyash_v1_question_be472850-7396-459e-9b0b-300c3f5ab405].feedback_config.rules[0].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-45;key=tyash_v1_question_52700898-015b-4685-b3e4-275ebefd167d].feedback_config.rules[0].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-46;key=tyash_v1_question_83b2d33d-c57a-4f49-9ce5-986d1f4accc6].feedback_config.rules[0].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-47;key=tyash_v1_question_c59e3054-449c-4030-8a6e-a7b67f6ce28f].feedback_config.rules[0].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-49;key=tyash_v1_question_3270721d-7d40-4525-b3ef-4f42f8808cc9].feedback_config.rules[0].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-50;key=tyash_v1_question_38e071cf-8fc9-4e6d-b6fb-ca9d3fde104f].feedback_config.rules[0].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-51;key=tyash_v1_question_0cf6fa9a-efe6-4de6-98d2-1ef25301b826].feedback_config.rules[0].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-52;key=tyash_v1_question_5212b0ed-b808-4a8f-bb42-7d8475c5ab40].feedback_config.rules[0].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-53;key=tyash_v1_question_e2f77c92-e79a-425d-a9e9-fefb30a70855].feedback_config.rules[0].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-54;key=tyash_v1_question_75e816ac-f9df-4802-a9a8-551f2fb38d80].feedback_config.rules[0].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-55;key=tyash_v1_question_0ddcf652-0fc0-417a-a777-b19c9fa38015].feedback_config.rules[0].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-56;key=tyash_v1_question_20fe9bcd-d768-43b5-9164-edb66e56286b].feedback_config.rules[0].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-57;key=tyash_v1_question_2b624ec6-0c4f-4c03-b49f-adbf671cb0ce].feedback_config.rules[0].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-58;key=tyash_v1_question_18fdab94-d60c-475b-9365-760621ed8caf].feedback_config.rules[0].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-60;key=tyash_v1_question_72a01b71-c2b7-4130-919c-9e0b1f93da8e].feedback_config.rules[0].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-61;key=tyash_v1_question_79a1d21e-1599-49f2-8a87-f6e8fc4ee66c].feedback_config.rules[0].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-62;key=tyash_v1_question_9e26bc34-310a-4214-9ae3-5910dbd01ec4].feedback_config.rules[0].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-63;key=tyash_v1_question_6e3a9099-f093-49af-9917-6b672fa0238a].feedback_config.rules[0].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-64;key=tyash_v1_question_2884aeee-070b-416d-a5db-74b34483d7e1].feedback_config.rules[0].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-67;key=tyash_v1_question_f0115e30-f501-460e-966a-c28b278ddef1].feedback_config.rules[0].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-68;key=tyash_v1_question_698a5cac-543c-4247-b96f-d9b1460e5026].feedback_config.rules[0].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-69;key=tyash_v1_question_6637b86b-46e7-424b-98e6-7187b0d07a17].feedback_config.rules[0].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-70;key=tyash_v1_question_a4f523a3-f56b-4343-8544-5336dab5bb58].feedback_config.rules[0].message`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-72;key=tyash_v1_question_82b11f2a-a7e7-4e9e-b00f-087cd564d47c].feedback_config.rules[0].message`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-73;key=tyash_v1_question_07a79c9e-f126-4b4e-9b14-9ab086b0abd9].feedback_config.rules[0].message`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-74;key=tyash_v1_question_539eaa77-1dff-41be-b42b-fa919fa5775e].feedback_config.rules[0].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-76;key=tyash_v1_question_8c30053c-fa86-49fc-b74e-6d65e48d3e5f].feedback_config.rules[0].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-77;key=tyash_v1_question_6f33b4c5-7135-4d42-b8b2-3dfffd10efa0].feedback_config.rules[0].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-78;key=tyash_v1_question_c980e516-8a60-47d7-832a-f74a68f4ddad].feedback_config.rules[0].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-79;key=tyash_v1_question_d5e62430-d470-4abd-bd7b-eb743f0b54c0].feedback_config.rules[0].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-80;key=tyash_v1_question_679dc1d7-079a-4862-bdd0-44aaea7e4e00].feedback_config.rules[0].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-83;key=tyash_v1_question_07b26c9c-3e82-4830-84de-0a8a0c835edf].feedback_config.rules[0].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-84;key=tyash_v1_question_96ba9eda-c05f-4548-a777-29b40ef158d8].feedback_config.rules[0].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-85;key=tyash_v1_question_9f9733b2-1c99-418e-abf2-6784e0d885ba].feedback_config.rules[0].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-86;key=tyash_v1_question_57903d0c-5d7a-48ab-a1a7-17f84379204c].feedback_config.rules[0].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-87;key=tyash_v1_question_9c3abc82-0368-4b91-89ba-0c827ba37758].feedback_config.rules[0].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-88;key=tyash_v1_question_f5ae167a-ade7-434b-8d6c-b5676da745e5].feedback_config.rules[0].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-89;key=tyash_v1_question_ebe7b0cc-29b5-46b1-95b0-948abff3448b].feedback_config.rules[0].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-91;key=tyash_v1_question_b3abaf18-e361-402d-bf26-d18b1c3daffe].feedback_config.rules[0].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-92;key=tyash_v1_question_067f7a4e-2f6e-4b82-b011-10ba26b511ea].feedback_config.rules[0].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-93;key=tyash_v1_question_9dc224e7-8001-4ad4-b0f6-0bba4722204d].feedback_config.rules[0].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-94;key=tyash_v1_question_461416af-c2a9-4291-924a-98bcb62d1faf].feedback_config.rules[0].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-95;key=tyash_v1_question_dee233fd-9be9-4a03-92f4-59225a01eda2].feedback_config.rules[0].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-96;key=tyash_v1_question_f924a439-9e88-4639-9b7e-92425a62ef32].feedback_config.rules[0].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-97;key=tyash_v1_question_202a8d04-3a1a-4ff6-98a4-ec54d8502041].feedback_config.rules[0].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-98;key=tyash_v1_question_d3d36a3a-baec-48d2-9856-90b7dc4f321b].feedback_config.rules[0].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-99;key=tyash_v1_question_a0898eb3-b3a1-4257-9bfe-14d2d4bb3cbf].feedback_config.rules[0].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-100;key=tyash_v1_question_ba70e79f-23b8-4e3c-acea-d191066ea7c5].feedback_config.rules[0].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-101;key=tyash_v1_question_ade0cf52-c89a-4c75-abdc-ff3f71fc7d3e].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-103;key=tyash_v1_question_21603c35-d58d-42b5-8bb2-6cc94b85ab26].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-104;key=tyash_v1_question_d15563f8-cd75-451e-a121-68eac1c14b10].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-105;key=tyash_v1_question_4fd26066-5d70-4c63-be9e-47783fb2ea2f].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-106;key=tyash_v1_question_f51a48ae-29d5-4510-a26b-3b4815d681ee].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-107;key=tyash_v1_question_be9d3a9b-90cd-422f-b036-0dc9e4fef5ab].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-108;key=tyash_v1_question_cd3c051e-6f2e-4497-b105-03064e88c2fd].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-109;key=tyash_v1_question_81fdb58b-e227-4c5f-a471-9e4cb92cb8a2].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-110;key=tyash_v1_question_fa304cde-7b74-4592-8c57-4a133cb951a5].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-111;key=tyash_v1_question_91888041-8e40-4b04-bc0e-c16035d4838b].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-112;key=tyash_v1_question_ddf9ba99-5491-411e-b800-ecdf826a8f38].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-113;key=tyash_v1_question_705847ab-c7c8-4734-b873-c99f532339ca].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-114;key=tyash_v1_question_3d406bc7-f1dd-4094-88ca-0f5112e6bd6f].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-115;key=tyash_v1_question_175c0733-d545-4bfd-ba33-75627b1b0b46].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-116;key=tyash_v1_question_24794f05-5437-4432-a705-148590a1997e].feedback_config.rules[0].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-117;key=tyash_v1_question_1ea060d0-7212-4878-889d-459a97fd05eb].feedback_config.rules[0].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-119;key=tyash_v1_question_e50a8d6b-dda9-43ad-a19e-fd76ae2a6ce8].feedback_config.rules[0].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-120;key=tyash_v1_question_eef6b057-08c7-4284-a58c-8c4223b5c43c].feedback_config.rules[0].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-121;key=tyash_v1_question_aae5364c-6bae-4e02-bca9-14e81497200c].feedback_config.rules[0].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-122;key=tyash_v1_question_4ed76d8a-77a3-4e80-ada6-619be735f919].feedback_config.rules[0].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-123;key=tyash_v1_question_b8c58e30-900e-46c1-ab19-81a953fea09b].feedback_config.rules[0].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-124;key=tyash_v1_question_ee9f7c5c-3fbf-4cab-8d31-1c03eab5679c].feedback_config.rules[0].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-125;key=tyash_v1_question_531a9650-49ba-421a-8266-4220689e5316].feedback_config.rules[0].message`

### 6. Certains mots sont encore génériques. Essaie de rendre ta réponse plus concrète.

Occurrences : 106.

- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-3;key=tyash_v1_question_c4389032-5351-46b1-941b-983f54ac8cef].feedback_config.rules[1].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-4;key=tyash_v1_question_81a6151c-6afe-4b2e-808e-7de0d4ffaa21].feedback_config.rules[1].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-5;key=tyash_v1_question_3cf4b9d1-dc5c-4462-8c41-da77e1809085].feedback_config.rules[1].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-6;key=tyash_v1_question_21727d86-9a91-4cc5-b7bd-d2f8554ee028].feedback_config.rules[1].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-7;key=tyash_v1_question_d28e8f73-2f6e-4e3a-b656-771bd46b6fda].feedback_config.rules[1].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-9;key=tyash_v1_question_d8d1270a-6bc1-4a18-9fe4-a81276d2a456].feedback_config.rules[1].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-10;key=tyash_v1_question_4698c6ab-4115-4f42-90fd-39de5e76f094].feedback_config.rules[1].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-11;key=tyash_v1_question_a8a8c7a5-f56b-42be-8fdd-aea303232b2a].feedback_config.rules[1].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-12;key=tyash_v1_question_93208543-81ac-462d-80cf-1ce901ae5be1].feedback_config.rules[1].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-13;key=tyash_v1_question_fbc98c27-aa31-4156-8d1b-d8c6efb82e54].feedback_config.rules[1].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-15;key=tyash_v1_question_8cf622ae-69ca-4e21-9d45-8f0dc988f858].feedback_config.rules[1].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-16;key=tyash_v1_question_5c51f7a6-f47a-440d-b0b9-17729d79a0ad].feedback_config.rules[1].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-17;key=tyash_v1_question_b90772e1-b46f-46b0-a8c8-9e3cc484bd9d].feedback_config.rules[1].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-18;key=tyash_v1_question_6119a01a-6b60-40f9-9696-04bd60b56ac6].feedback_config.rules[1].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-19;key=tyash_v1_question_2192dde4-4613-4972-84fa-1ec3b768c409].feedback_config.rules[1].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-20;key=tyash_v1_question_174d0783-eb40-4066-9efb-ac8125233486].feedback_config.rules[1].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-21;key=tyash_v1_question_f432312a-e508-4c59-9260-8d4fdc4c12ae].feedback_config.rules[1].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-22;key=tyash_v1_question_b61d3df1-8a4e-4028-854d-c18aad1e10f7].feedback_config.rules[1].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-23;key=tyash_v1_question_74c06ecc-f30c-4f7e-bbdd-dff9f648d7e7].feedback_config.rules[1].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-24;key=tyash_v1_question_b7d99986-dfc0-48d9-8a89-4c4c6277d4bc].feedback_config.rules[1].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-25;key=tyash_v1_question_21c2fdae-37b0-4a5e-bf76-24466e7ebe14].feedback_config.rules[1].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-26;key=tyash_v1_question_88f629f5-830d-417f-b0f9-404cfd8efcec].feedback_config.rules[1].message`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-28;key=tyash_v1_question_3887cc49-7322-4cea-b622-b746db9a121b].feedback_config.rules[1].message`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-29;key=tyash_v1_question_38f02fb7-0a97-4e00-bccf-4eae77fd3052].feedback_config.rules[1].message`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-30;key=tyash_v1_question_2e8b3cac-f238-40de-9918-034c07e383ac].feedback_config.rules[1].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-32;key=tyash_v1_question_afb6632b-2ef4-4033-b1ce-157e437e155d].feedback_config.rules[1].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-33;key=tyash_v1_question_5a839b8a-aaa6-4e92-8e7d-f6ee03030a7e].feedback_config.rules[1].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-34;key=tyash_v1_question_ba893b75-9398-4459-b5d8-5d624291b854].feedback_config.rules[1].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-35;key=tyash_v1_question_afcf80dd-9c90-45b3-a4ef-9e18fe3b10fa].feedback_config.rules[1].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-36;key=tyash_v1_question_a4fba8ad-606d-4ae2-9966-1dec711dd904].feedback_config.rules[1].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-37;key=tyash_v1_question_bfbab4db-1f27-4971-97d2-ecbafce11d95].feedback_config.rules[1].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-40;key=tyash_v1_question_08cd4cdb-646d-4b23-848a-56c564b3e0ad].feedback_config.rules[1].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-41;key=tyash_v1_question_76175718-ff39-47cb-9bf7-4cea1b158f8b].feedback_config.rules[1].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-42;key=tyash_v1_question_bf625f2f-38ae-4b24-8c31-6cf46da69b8a].feedback_config.rules[1].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-43;key=tyash_v1_question_9c1b5cc2-ab73-42f6-a3bf-fa1dff132559].feedback_config.rules[1].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-44;key=tyash_v1_question_be472850-7396-459e-9b0b-300c3f5ab405].feedback_config.rules[1].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-45;key=tyash_v1_question_52700898-015b-4685-b3e4-275ebefd167d].feedback_config.rules[1].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-46;key=tyash_v1_question_83b2d33d-c57a-4f49-9ce5-986d1f4accc6].feedback_config.rules[1].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-47;key=tyash_v1_question_c59e3054-449c-4030-8a6e-a7b67f6ce28f].feedback_config.rules[1].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-49;key=tyash_v1_question_3270721d-7d40-4525-b3ef-4f42f8808cc9].feedback_config.rules[1].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-50;key=tyash_v1_question_38e071cf-8fc9-4e6d-b6fb-ca9d3fde104f].feedback_config.rules[1].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-51;key=tyash_v1_question_0cf6fa9a-efe6-4de6-98d2-1ef25301b826].feedback_config.rules[1].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-52;key=tyash_v1_question_5212b0ed-b808-4a8f-bb42-7d8475c5ab40].feedback_config.rules[1].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-53;key=tyash_v1_question_e2f77c92-e79a-425d-a9e9-fefb30a70855].feedback_config.rules[1].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-54;key=tyash_v1_question_75e816ac-f9df-4802-a9a8-551f2fb38d80].feedback_config.rules[1].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-55;key=tyash_v1_question_0ddcf652-0fc0-417a-a777-b19c9fa38015].feedback_config.rules[1].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-56;key=tyash_v1_question_20fe9bcd-d768-43b5-9164-edb66e56286b].feedback_config.rules[1].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-57;key=tyash_v1_question_2b624ec6-0c4f-4c03-b49f-adbf671cb0ce].feedback_config.rules[1].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-58;key=tyash_v1_question_18fdab94-d60c-475b-9365-760621ed8caf].feedback_config.rules[1].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-60;key=tyash_v1_question_72a01b71-c2b7-4130-919c-9e0b1f93da8e].feedback_config.rules[1].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-61;key=tyash_v1_question_79a1d21e-1599-49f2-8a87-f6e8fc4ee66c].feedback_config.rules[1].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-62;key=tyash_v1_question_9e26bc34-310a-4214-9ae3-5910dbd01ec4].feedback_config.rules[1].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-63;key=tyash_v1_question_6e3a9099-f093-49af-9917-6b672fa0238a].feedback_config.rules[1].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-64;key=tyash_v1_question_2884aeee-070b-416d-a5db-74b34483d7e1].feedback_config.rules[1].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-67;key=tyash_v1_question_f0115e30-f501-460e-966a-c28b278ddef1].feedback_config.rules[1].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-68;key=tyash_v1_question_698a5cac-543c-4247-b96f-d9b1460e5026].feedback_config.rules[1].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-69;key=tyash_v1_question_6637b86b-46e7-424b-98e6-7187b0d07a17].feedback_config.rules[1].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-70;key=tyash_v1_question_a4f523a3-f56b-4343-8544-5336dab5bb58].feedback_config.rules[1].message`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-72;key=tyash_v1_question_82b11f2a-a7e7-4e9e-b00f-087cd564d47c].feedback_config.rules[1].message`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-73;key=tyash_v1_question_07a79c9e-f126-4b4e-9b14-9ab086b0abd9].feedback_config.rules[1].message`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-74;key=tyash_v1_question_539eaa77-1dff-41be-b42b-fa919fa5775e].feedback_config.rules[1].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-76;key=tyash_v1_question_8c30053c-fa86-49fc-b74e-6d65e48d3e5f].feedback_config.rules[1].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-77;key=tyash_v1_question_6f33b4c5-7135-4d42-b8b2-3dfffd10efa0].feedback_config.rules[1].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-78;key=tyash_v1_question_c980e516-8a60-47d7-832a-f74a68f4ddad].feedback_config.rules[1].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-79;key=tyash_v1_question_d5e62430-d470-4abd-bd7b-eb743f0b54c0].feedback_config.rules[1].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-80;key=tyash_v1_question_679dc1d7-079a-4862-bdd0-44aaea7e4e00].feedback_config.rules[1].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-83;key=tyash_v1_question_07b26c9c-3e82-4830-84de-0a8a0c835edf].feedback_config.rules[1].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-84;key=tyash_v1_question_96ba9eda-c05f-4548-a777-29b40ef158d8].feedback_config.rules[1].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-85;key=tyash_v1_question_9f9733b2-1c99-418e-abf2-6784e0d885ba].feedback_config.rules[1].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-86;key=tyash_v1_question_57903d0c-5d7a-48ab-a1a7-17f84379204c].feedback_config.rules[1].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-87;key=tyash_v1_question_9c3abc82-0368-4b91-89ba-0c827ba37758].feedback_config.rules[1].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-88;key=tyash_v1_question_f5ae167a-ade7-434b-8d6c-b5676da745e5].feedback_config.rules[1].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-89;key=tyash_v1_question_ebe7b0cc-29b5-46b1-95b0-948abff3448b].feedback_config.rules[1].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-91;key=tyash_v1_question_b3abaf18-e361-402d-bf26-d18b1c3daffe].feedback_config.rules[1].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-92;key=tyash_v1_question_067f7a4e-2f6e-4b82-b011-10ba26b511ea].feedback_config.rules[1].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-93;key=tyash_v1_question_9dc224e7-8001-4ad4-b0f6-0bba4722204d].feedback_config.rules[1].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-94;key=tyash_v1_question_461416af-c2a9-4291-924a-98bcb62d1faf].feedback_config.rules[1].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-95;key=tyash_v1_question_dee233fd-9be9-4a03-92f4-59225a01eda2].feedback_config.rules[1].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-96;key=tyash_v1_question_f924a439-9e88-4639-9b7e-92425a62ef32].feedback_config.rules[1].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-97;key=tyash_v1_question_202a8d04-3a1a-4ff6-98a4-ec54d8502041].feedback_config.rules[1].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-98;key=tyash_v1_question_d3d36a3a-baec-48d2-9856-90b7dc4f321b].feedback_config.rules[1].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-99;key=tyash_v1_question_a0898eb3-b3a1-4257-9bfe-14d2d4bb3cbf].feedback_config.rules[1].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-100;key=tyash_v1_question_ba70e79f-23b8-4e3c-acea-d191066ea7c5].feedback_config.rules[1].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-101;key=tyash_v1_question_ade0cf52-c89a-4c75-abdc-ff3f71fc7d3e].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-103;key=tyash_v1_question_21603c35-d58d-42b5-8bb2-6cc94b85ab26].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-104;key=tyash_v1_question_d15563f8-cd75-451e-a121-68eac1c14b10].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-105;key=tyash_v1_question_4fd26066-5d70-4c63-be9e-47783fb2ea2f].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-106;key=tyash_v1_question_f51a48ae-29d5-4510-a26b-3b4815d681ee].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-107;key=tyash_v1_question_be9d3a9b-90cd-422f-b036-0dc9e4fef5ab].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-108;key=tyash_v1_question_cd3c051e-6f2e-4497-b105-03064e88c2fd].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-109;key=tyash_v1_question_81fdb58b-e227-4c5f-a471-9e4cb92cb8a2].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-110;key=tyash_v1_question_fa304cde-7b74-4592-8c57-4a133cb951a5].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-111;key=tyash_v1_question_91888041-8e40-4b04-bc0e-c16035d4838b].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-112;key=tyash_v1_question_ddf9ba99-5491-411e-b800-ecdf826a8f38].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-113;key=tyash_v1_question_705847ab-c7c8-4734-b873-c99f532339ca].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-114;key=tyash_v1_question_3d406bc7-f1dd-4094-88ca-0f5112e6bd6f].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-115;key=tyash_v1_question_175c0733-d545-4bfd-ba33-75627b1b0b46].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-116;key=tyash_v1_question_24794f05-5437-4432-a705-148590a1997e].feedback_config.rules[1].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-117;key=tyash_v1_question_1ea060d0-7212-4878-889d-459a97fd05eb].feedback_config.rules[1].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-119;key=tyash_v1_question_e50a8d6b-dda9-43ad-a19e-fd76ae2a6ce8].feedback_config.rules[1].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-120;key=tyash_v1_question_eef6b057-08c7-4284-a58c-8c4223b5c43c].feedback_config.rules[1].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-121;key=tyash_v1_question_aae5364c-6bae-4e02-bca9-14e81497200c].feedback_config.rules[1].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-122;key=tyash_v1_question_4ed76d8a-77a3-4e80-ada6-619be735f919].feedback_config.rules[1].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-123;key=tyash_v1_question_b8c58e30-900e-46c1-ab19-81a953fea09b].feedback_config.rules[1].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-124;key=tyash_v1_question_ee9f7c5c-3fbf-4cab-8d31-1c03eab5679c].feedback_config.rules[1].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-125;key=tyash_v1_question_531a9650-49ba-421a-8266-4220689e5316].feedback_config.rules[1].message`

### 7. C'est clair. Tu peux encore renforcer ta réponse avec un exemple ou un bénéfice concret.

Occurrences : 106.

- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-3;key=tyash_v1_question_c4389032-5351-46b1-941b-983f54ac8cef].feedback_config.rules[2].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-4;key=tyash_v1_question_81a6151c-6afe-4b2e-808e-7de0d4ffaa21].feedback_config.rules[2].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-5;key=tyash_v1_question_3cf4b9d1-dc5c-4462-8c41-da77e1809085].feedback_config.rules[2].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-6;key=tyash_v1_question_21727d86-9a91-4cc5-b7bd-d2f8554ee028].feedback_config.rules[2].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-7;key=tyash_v1_question_d28e8f73-2f6e-4e3a-b656-771bd46b6fda].feedback_config.rules[2].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-9;key=tyash_v1_question_d8d1270a-6bc1-4a18-9fe4-a81276d2a456].feedback_config.rules[2].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-10;key=tyash_v1_question_4698c6ab-4115-4f42-90fd-39de5e76f094].feedback_config.rules[2].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-11;key=tyash_v1_question_a8a8c7a5-f56b-42be-8fdd-aea303232b2a].feedback_config.rules[2].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-12;key=tyash_v1_question_93208543-81ac-462d-80cf-1ce901ae5be1].feedback_config.rules[2].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-13;key=tyash_v1_question_fbc98c27-aa31-4156-8d1b-d8c6efb82e54].feedback_config.rules[2].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-15;key=tyash_v1_question_8cf622ae-69ca-4e21-9d45-8f0dc988f858].feedback_config.rules[2].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-16;key=tyash_v1_question_5c51f7a6-f47a-440d-b0b9-17729d79a0ad].feedback_config.rules[2].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-17;key=tyash_v1_question_b90772e1-b46f-46b0-a8c8-9e3cc484bd9d].feedback_config.rules[2].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-18;key=tyash_v1_question_6119a01a-6b60-40f9-9696-04bd60b56ac6].feedback_config.rules[2].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-19;key=tyash_v1_question_2192dde4-4613-4972-84fa-1ec3b768c409].feedback_config.rules[2].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-20;key=tyash_v1_question_174d0783-eb40-4066-9efb-ac8125233486].feedback_config.rules[2].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-21;key=tyash_v1_question_f432312a-e508-4c59-9260-8d4fdc4c12ae].feedback_config.rules[2].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-22;key=tyash_v1_question_b61d3df1-8a4e-4028-854d-c18aad1e10f7].feedback_config.rules[2].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-23;key=tyash_v1_question_74c06ecc-f30c-4f7e-bbdd-dff9f648d7e7].feedback_config.rules[2].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-24;key=tyash_v1_question_b7d99986-dfc0-48d9-8a89-4c4c6277d4bc].feedback_config.rules[2].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-25;key=tyash_v1_question_21c2fdae-37b0-4a5e-bf76-24466e7ebe14].feedback_config.rules[2].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-26;key=tyash_v1_question_88f629f5-830d-417f-b0f9-404cfd8efcec].feedback_config.rules[2].message`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-28;key=tyash_v1_question_3887cc49-7322-4cea-b622-b746db9a121b].feedback_config.rules[2].message`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-29;key=tyash_v1_question_38f02fb7-0a97-4e00-bccf-4eae77fd3052].feedback_config.rules[2].message`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-30;key=tyash_v1_question_2e8b3cac-f238-40de-9918-034c07e383ac].feedback_config.rules[2].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-32;key=tyash_v1_question_afb6632b-2ef4-4033-b1ce-157e437e155d].feedback_config.rules[2].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-33;key=tyash_v1_question_5a839b8a-aaa6-4e92-8e7d-f6ee03030a7e].feedback_config.rules[2].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-34;key=tyash_v1_question_ba893b75-9398-4459-b5d8-5d624291b854].feedback_config.rules[2].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-35;key=tyash_v1_question_afcf80dd-9c90-45b3-a4ef-9e18fe3b10fa].feedback_config.rules[2].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-36;key=tyash_v1_question_a4fba8ad-606d-4ae2-9966-1dec711dd904].feedback_config.rules[2].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-37;key=tyash_v1_question_bfbab4db-1f27-4971-97d2-ecbafce11d95].feedback_config.rules[2].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-40;key=tyash_v1_question_08cd4cdb-646d-4b23-848a-56c564b3e0ad].feedback_config.rules[2].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-41;key=tyash_v1_question_76175718-ff39-47cb-9bf7-4cea1b158f8b].feedback_config.rules[2].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-42;key=tyash_v1_question_bf625f2f-38ae-4b24-8c31-6cf46da69b8a].feedback_config.rules[2].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-43;key=tyash_v1_question_9c1b5cc2-ab73-42f6-a3bf-fa1dff132559].feedback_config.rules[2].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-44;key=tyash_v1_question_be472850-7396-459e-9b0b-300c3f5ab405].feedback_config.rules[2].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-45;key=tyash_v1_question_52700898-015b-4685-b3e4-275ebefd167d].feedback_config.rules[2].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-46;key=tyash_v1_question_83b2d33d-c57a-4f49-9ce5-986d1f4accc6].feedback_config.rules[2].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-47;key=tyash_v1_question_c59e3054-449c-4030-8a6e-a7b67f6ce28f].feedback_config.rules[2].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-49;key=tyash_v1_question_3270721d-7d40-4525-b3ef-4f42f8808cc9].feedback_config.rules[2].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-50;key=tyash_v1_question_38e071cf-8fc9-4e6d-b6fb-ca9d3fde104f].feedback_config.rules[2].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-51;key=tyash_v1_question_0cf6fa9a-efe6-4de6-98d2-1ef25301b826].feedback_config.rules[2].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-52;key=tyash_v1_question_5212b0ed-b808-4a8f-bb42-7d8475c5ab40].feedback_config.rules[2].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-53;key=tyash_v1_question_e2f77c92-e79a-425d-a9e9-fefb30a70855].feedback_config.rules[2].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-54;key=tyash_v1_question_75e816ac-f9df-4802-a9a8-551f2fb38d80].feedback_config.rules[2].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-55;key=tyash_v1_question_0ddcf652-0fc0-417a-a777-b19c9fa38015].feedback_config.rules[2].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-56;key=tyash_v1_question_20fe9bcd-d768-43b5-9164-edb66e56286b].feedback_config.rules[2].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-57;key=tyash_v1_question_2b624ec6-0c4f-4c03-b49f-adbf671cb0ce].feedback_config.rules[2].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-58;key=tyash_v1_question_18fdab94-d60c-475b-9365-760621ed8caf].feedback_config.rules[2].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-60;key=tyash_v1_question_72a01b71-c2b7-4130-919c-9e0b1f93da8e].feedback_config.rules[2].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-61;key=tyash_v1_question_79a1d21e-1599-49f2-8a87-f6e8fc4ee66c].feedback_config.rules[2].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-62;key=tyash_v1_question_9e26bc34-310a-4214-9ae3-5910dbd01ec4].feedback_config.rules[2].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-63;key=tyash_v1_question_6e3a9099-f093-49af-9917-6b672fa0238a].feedback_config.rules[2].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-64;key=tyash_v1_question_2884aeee-070b-416d-a5db-74b34483d7e1].feedback_config.rules[2].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-67;key=tyash_v1_question_f0115e30-f501-460e-966a-c28b278ddef1].feedback_config.rules[2].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-68;key=tyash_v1_question_698a5cac-543c-4247-b96f-d9b1460e5026].feedback_config.rules[2].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-69;key=tyash_v1_question_6637b86b-46e7-424b-98e6-7187b0d07a17].feedback_config.rules[2].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-70;key=tyash_v1_question_a4f523a3-f56b-4343-8544-5336dab5bb58].feedback_config.rules[2].message`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-72;key=tyash_v1_question_82b11f2a-a7e7-4e9e-b00f-087cd564d47c].feedback_config.rules[2].message`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-73;key=tyash_v1_question_07a79c9e-f126-4b4e-9b14-9ab086b0abd9].feedback_config.rules[2].message`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-74;key=tyash_v1_question_539eaa77-1dff-41be-b42b-fa919fa5775e].feedback_config.rules[2].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-76;key=tyash_v1_question_8c30053c-fa86-49fc-b74e-6d65e48d3e5f].feedback_config.rules[2].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-77;key=tyash_v1_question_6f33b4c5-7135-4d42-b8b2-3dfffd10efa0].feedback_config.rules[2].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-78;key=tyash_v1_question_c980e516-8a60-47d7-832a-f74a68f4ddad].feedback_config.rules[2].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-79;key=tyash_v1_question_d5e62430-d470-4abd-bd7b-eb743f0b54c0].feedback_config.rules[2].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-80;key=tyash_v1_question_679dc1d7-079a-4862-bdd0-44aaea7e4e00].feedback_config.rules[2].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-83;key=tyash_v1_question_07b26c9c-3e82-4830-84de-0a8a0c835edf].feedback_config.rules[2].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-84;key=tyash_v1_question_96ba9eda-c05f-4548-a777-29b40ef158d8].feedback_config.rules[2].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-85;key=tyash_v1_question_9f9733b2-1c99-418e-abf2-6784e0d885ba].feedback_config.rules[2].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-86;key=tyash_v1_question_57903d0c-5d7a-48ab-a1a7-17f84379204c].feedback_config.rules[2].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-87;key=tyash_v1_question_9c3abc82-0368-4b91-89ba-0c827ba37758].feedback_config.rules[2].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-88;key=tyash_v1_question_f5ae167a-ade7-434b-8d6c-b5676da745e5].feedback_config.rules[2].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-89;key=tyash_v1_question_ebe7b0cc-29b5-46b1-95b0-948abff3448b].feedback_config.rules[2].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-91;key=tyash_v1_question_b3abaf18-e361-402d-bf26-d18b1c3daffe].feedback_config.rules[2].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-92;key=tyash_v1_question_067f7a4e-2f6e-4b82-b011-10ba26b511ea].feedback_config.rules[2].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-93;key=tyash_v1_question_9dc224e7-8001-4ad4-b0f6-0bba4722204d].feedback_config.rules[2].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-94;key=tyash_v1_question_461416af-c2a9-4291-924a-98bcb62d1faf].feedback_config.rules[2].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-95;key=tyash_v1_question_dee233fd-9be9-4a03-92f4-59225a01eda2].feedback_config.rules[2].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-96;key=tyash_v1_question_f924a439-9e88-4639-9b7e-92425a62ef32].feedback_config.rules[2].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-97;key=tyash_v1_question_202a8d04-3a1a-4ff6-98a4-ec54d8502041].feedback_config.rules[2].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-98;key=tyash_v1_question_d3d36a3a-baec-48d2-9856-90b7dc4f321b].feedback_config.rules[2].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-99;key=tyash_v1_question_a0898eb3-b3a1-4257-9bfe-14d2d4bb3cbf].feedback_config.rules[2].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-100;key=tyash_v1_question_ba70e79f-23b8-4e3c-acea-d191066ea7c5].feedback_config.rules[2].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-101;key=tyash_v1_question_ade0cf52-c89a-4c75-abdc-ff3f71fc7d3e].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-103;key=tyash_v1_question_21603c35-d58d-42b5-8bb2-6cc94b85ab26].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-104;key=tyash_v1_question_d15563f8-cd75-451e-a121-68eac1c14b10].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-105;key=tyash_v1_question_4fd26066-5d70-4c63-be9e-47783fb2ea2f].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-106;key=tyash_v1_question_f51a48ae-29d5-4510-a26b-3b4815d681ee].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-107;key=tyash_v1_question_be9d3a9b-90cd-422f-b036-0dc9e4fef5ab].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-108;key=tyash_v1_question_cd3c051e-6f2e-4497-b105-03064e88c2fd].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-109;key=tyash_v1_question_81fdb58b-e227-4c5f-a471-9e4cb92cb8a2].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-110;key=tyash_v1_question_fa304cde-7b74-4592-8c57-4a133cb951a5].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-111;key=tyash_v1_question_91888041-8e40-4b04-bc0e-c16035d4838b].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-112;key=tyash_v1_question_ddf9ba99-5491-411e-b800-ecdf826a8f38].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-113;key=tyash_v1_question_705847ab-c7c8-4734-b873-c99f532339ca].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-114;key=tyash_v1_question_3d406bc7-f1dd-4094-88ca-0f5112e6bd6f].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-115;key=tyash_v1_question_175c0733-d545-4bfd-ba33-75627b1b0b46].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-116;key=tyash_v1_question_24794f05-5437-4432-a705-148590a1997e].feedback_config.rules[2].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-117;key=tyash_v1_question_1ea060d0-7212-4878-889d-459a97fd05eb].feedback_config.rules[2].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-119;key=tyash_v1_question_e50a8d6b-dda9-43ad-a19e-fd76ae2a6ce8].feedback_config.rules[2].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-120;key=tyash_v1_question_eef6b057-08c7-4284-a58c-8c4223b5c43c].feedback_config.rules[2].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-121;key=tyash_v1_question_aae5364c-6bae-4e02-bca9-14e81497200c].feedback_config.rules[2].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-122;key=tyash_v1_question_4ed76d8a-77a3-4e80-ada6-619be735f919].feedback_config.rules[2].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-123;key=tyash_v1_question_b8c58e30-900e-46c1-ab19-81a953fea09b].feedback_config.rules[2].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-124;key=tyash_v1_question_ee9f7c5c-3fbf-4cab-8d31-1c03eab5679c].feedback_config.rules[2].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-125;key=tyash_v1_question_531a9650-49ba-421a-8266-4220689e5316].feedback_config.rules[2].message`

### 8. Excellent. Ta réponse est claire, spécifique et exploitable.

Occurrences : 106.

- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-3;key=tyash_v1_question_c4389032-5351-46b1-941b-983f54ac8cef].feedback_config.rules[3].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-4;key=tyash_v1_question_81a6151c-6afe-4b2e-808e-7de0d4ffaa21].feedback_config.rules[3].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-5;key=tyash_v1_question_3cf4b9d1-dc5c-4462-8c41-da77e1809085].feedback_config.rules[3].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-6;key=tyash_v1_question_21727d86-9a91-4cc5-b7bd-d2f8554ee028].feedback_config.rules[3].message`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-7;key=tyash_v1_question_d28e8f73-2f6e-4e3a-b656-771bd46b6fda].feedback_config.rules[3].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-9;key=tyash_v1_question_d8d1270a-6bc1-4a18-9fe4-a81276d2a456].feedback_config.rules[3].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-10;key=tyash_v1_question_4698c6ab-4115-4f42-90fd-39de5e76f094].feedback_config.rules[3].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-11;key=tyash_v1_question_a8a8c7a5-f56b-42be-8fdd-aea303232b2a].feedback_config.rules[3].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-12;key=tyash_v1_question_93208543-81ac-462d-80cf-1ce901ae5be1].feedback_config.rules[3].message`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-13;key=tyash_v1_question_fbc98c27-aa31-4156-8d1b-d8c6efb82e54].feedback_config.rules[3].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-15;key=tyash_v1_question_8cf622ae-69ca-4e21-9d45-8f0dc988f858].feedback_config.rules[3].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-16;key=tyash_v1_question_5c51f7a6-f47a-440d-b0b9-17729d79a0ad].feedback_config.rules[3].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-17;key=tyash_v1_question_b90772e1-b46f-46b0-a8c8-9e3cc484bd9d].feedback_config.rules[3].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-18;key=tyash_v1_question_6119a01a-6b60-40f9-9696-04bd60b56ac6].feedback_config.rules[3].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-19;key=tyash_v1_question_2192dde4-4613-4972-84fa-1ec3b768c409].feedback_config.rules[3].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-20;key=tyash_v1_question_174d0783-eb40-4066-9efb-ac8125233486].feedback_config.rules[3].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-21;key=tyash_v1_question_f432312a-e508-4c59-9260-8d4fdc4c12ae].feedback_config.rules[3].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-22;key=tyash_v1_question_b61d3df1-8a4e-4028-854d-c18aad1e10f7].feedback_config.rules[3].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-23;key=tyash_v1_question_74c06ecc-f30c-4f7e-bbdd-dff9f648d7e7].feedback_config.rules[3].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-24;key=tyash_v1_question_b7d99986-dfc0-48d9-8a89-4c4c6277d4bc].feedback_config.rules[3].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-25;key=tyash_v1_question_21c2fdae-37b0-4a5e-bf76-24466e7ebe14].feedback_config.rules[3].message`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-26;key=tyash_v1_question_88f629f5-830d-417f-b0f9-404cfd8efcec].feedback_config.rules[3].message`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-28;key=tyash_v1_question_3887cc49-7322-4cea-b622-b746db9a121b].feedback_config.rules[3].message`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-29;key=tyash_v1_question_38f02fb7-0a97-4e00-bccf-4eae77fd3052].feedback_config.rules[3].message`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-30;key=tyash_v1_question_2e8b3cac-f238-40de-9918-034c07e383ac].feedback_config.rules[3].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-32;key=tyash_v1_question_afb6632b-2ef4-4033-b1ce-157e437e155d].feedback_config.rules[3].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-33;key=tyash_v1_question_5a839b8a-aaa6-4e92-8e7d-f6ee03030a7e].feedback_config.rules[3].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-34;key=tyash_v1_question_ba893b75-9398-4459-b5d8-5d624291b854].feedback_config.rules[3].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-35;key=tyash_v1_question_afcf80dd-9c90-45b3-a4ef-9e18fe3b10fa].feedback_config.rules[3].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-36;key=tyash_v1_question_a4fba8ad-606d-4ae2-9966-1dec711dd904].feedback_config.rules[3].message`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-37;key=tyash_v1_question_bfbab4db-1f27-4971-97d2-ecbafce11d95].feedback_config.rules[3].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-40;key=tyash_v1_question_08cd4cdb-646d-4b23-848a-56c564b3e0ad].feedback_config.rules[3].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-41;key=tyash_v1_question_76175718-ff39-47cb-9bf7-4cea1b158f8b].feedback_config.rules[3].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-42;key=tyash_v1_question_bf625f2f-38ae-4b24-8c31-6cf46da69b8a].feedback_config.rules[3].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-43;key=tyash_v1_question_9c1b5cc2-ab73-42f6-a3bf-fa1dff132559].feedback_config.rules[3].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-44;key=tyash_v1_question_be472850-7396-459e-9b0b-300c3f5ab405].feedback_config.rules[3].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-45;key=tyash_v1_question_52700898-015b-4685-b3e4-275ebefd167d].feedback_config.rules[3].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-46;key=tyash_v1_question_83b2d33d-c57a-4f49-9ce5-986d1f4accc6].feedback_config.rules[3].message`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-47;key=tyash_v1_question_c59e3054-449c-4030-8a6e-a7b67f6ce28f].feedback_config.rules[3].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-49;key=tyash_v1_question_3270721d-7d40-4525-b3ef-4f42f8808cc9].feedback_config.rules[3].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-50;key=tyash_v1_question_38e071cf-8fc9-4e6d-b6fb-ca9d3fde104f].feedback_config.rules[3].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-51;key=tyash_v1_question_0cf6fa9a-efe6-4de6-98d2-1ef25301b826].feedback_config.rules[3].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-52;key=tyash_v1_question_5212b0ed-b808-4a8f-bb42-7d8475c5ab40].feedback_config.rules[3].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-53;key=tyash_v1_question_e2f77c92-e79a-425d-a9e9-fefb30a70855].feedback_config.rules[3].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-54;key=tyash_v1_question_75e816ac-f9df-4802-a9a8-551f2fb38d80].feedback_config.rules[3].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-55;key=tyash_v1_question_0ddcf652-0fc0-417a-a777-b19c9fa38015].feedback_config.rules[3].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-56;key=tyash_v1_question_20fe9bcd-d768-43b5-9164-edb66e56286b].feedback_config.rules[3].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-57;key=tyash_v1_question_2b624ec6-0c4f-4c03-b49f-adbf671cb0ce].feedback_config.rules[3].message`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-58;key=tyash_v1_question_18fdab94-d60c-475b-9365-760621ed8caf].feedback_config.rules[3].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-60;key=tyash_v1_question_72a01b71-c2b7-4130-919c-9e0b1f93da8e].feedback_config.rules[3].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-61;key=tyash_v1_question_79a1d21e-1599-49f2-8a87-f6e8fc4ee66c].feedback_config.rules[3].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-62;key=tyash_v1_question_9e26bc34-310a-4214-9ae3-5910dbd01ec4].feedback_config.rules[3].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-63;key=tyash_v1_question_6e3a9099-f093-49af-9917-6b672fa0238a].feedback_config.rules[3].message`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-64;key=tyash_v1_question_2884aeee-070b-416d-a5db-74b34483d7e1].feedback_config.rules[3].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-67;key=tyash_v1_question_f0115e30-f501-460e-966a-c28b278ddef1].feedback_config.rules[3].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-68;key=tyash_v1_question_698a5cac-543c-4247-b96f-d9b1460e5026].feedback_config.rules[3].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-69;key=tyash_v1_question_6637b86b-46e7-424b-98e6-7187b0d07a17].feedback_config.rules[3].message`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-70;key=tyash_v1_question_a4f523a3-f56b-4343-8544-5336dab5bb58].feedback_config.rules[3].message`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-72;key=tyash_v1_question_82b11f2a-a7e7-4e9e-b00f-087cd564d47c].feedback_config.rules[3].message`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-73;key=tyash_v1_question_07a79c9e-f126-4b4e-9b14-9ab086b0abd9].feedback_config.rules[3].message`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-74;key=tyash_v1_question_539eaa77-1dff-41be-b42b-fa919fa5775e].feedback_config.rules[3].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-76;key=tyash_v1_question_8c30053c-fa86-49fc-b74e-6d65e48d3e5f].feedback_config.rules[3].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-77;key=tyash_v1_question_6f33b4c5-7135-4d42-b8b2-3dfffd10efa0].feedback_config.rules[3].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-78;key=tyash_v1_question_c980e516-8a60-47d7-832a-f74a68f4ddad].feedback_config.rules[3].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-79;key=tyash_v1_question_d5e62430-d470-4abd-bd7b-eb743f0b54c0].feedback_config.rules[3].message`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-80;key=tyash_v1_question_679dc1d7-079a-4862-bdd0-44aaea7e4e00].feedback_config.rules[3].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-83;key=tyash_v1_question_07b26c9c-3e82-4830-84de-0a8a0c835edf].feedback_config.rules[3].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-84;key=tyash_v1_question_96ba9eda-c05f-4548-a777-29b40ef158d8].feedback_config.rules[3].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-85;key=tyash_v1_question_9f9733b2-1c99-418e-abf2-6784e0d885ba].feedback_config.rules[3].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-86;key=tyash_v1_question_57903d0c-5d7a-48ab-a1a7-17f84379204c].feedback_config.rules[3].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-87;key=tyash_v1_question_9c3abc82-0368-4b91-89ba-0c827ba37758].feedback_config.rules[3].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-88;key=tyash_v1_question_f5ae167a-ade7-434b-8d6c-b5676da745e5].feedback_config.rules[3].message`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-89;key=tyash_v1_question_ebe7b0cc-29b5-46b1-95b0-948abff3448b].feedback_config.rules[3].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-91;key=tyash_v1_question_b3abaf18-e361-402d-bf26-d18b1c3daffe].feedback_config.rules[3].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-92;key=tyash_v1_question_067f7a4e-2f6e-4b82-b011-10ba26b511ea].feedback_config.rules[3].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-93;key=tyash_v1_question_9dc224e7-8001-4ad4-b0f6-0bba4722204d].feedback_config.rules[3].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-94;key=tyash_v1_question_461416af-c2a9-4291-924a-98bcb62d1faf].feedback_config.rules[3].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-95;key=tyash_v1_question_dee233fd-9be9-4a03-92f4-59225a01eda2].feedback_config.rules[3].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-96;key=tyash_v1_question_f924a439-9e88-4639-9b7e-92425a62ef32].feedback_config.rules[3].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-97;key=tyash_v1_question_202a8d04-3a1a-4ff6-98a4-ec54d8502041].feedback_config.rules[3].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-98;key=tyash_v1_question_d3d36a3a-baec-48d2-9856-90b7dc4f321b].feedback_config.rules[3].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-99;key=tyash_v1_question_a0898eb3-b3a1-4257-9bfe-14d2d4bb3cbf].feedback_config.rules[3].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-100;key=tyash_v1_question_ba70e79f-23b8-4e3c-acea-d191066ea7c5].feedback_config.rules[3].message`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-101;key=tyash_v1_question_ade0cf52-c89a-4c75-abdc-ff3f71fc7d3e].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-103;key=tyash_v1_question_21603c35-d58d-42b5-8bb2-6cc94b85ab26].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-104;key=tyash_v1_question_d15563f8-cd75-451e-a121-68eac1c14b10].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-105;key=tyash_v1_question_4fd26066-5d70-4c63-be9e-47783fb2ea2f].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-106;key=tyash_v1_question_f51a48ae-29d5-4510-a26b-3b4815d681ee].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-107;key=tyash_v1_question_be9d3a9b-90cd-422f-b036-0dc9e4fef5ab].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-108;key=tyash_v1_question_cd3c051e-6f2e-4497-b105-03064e88c2fd].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-109;key=tyash_v1_question_81fdb58b-e227-4c5f-a471-9e4cb92cb8a2].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-110;key=tyash_v1_question_fa304cde-7b74-4592-8c57-4a133cb951a5].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-111;key=tyash_v1_question_91888041-8e40-4b04-bc0e-c16035d4838b].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-112;key=tyash_v1_question_ddf9ba99-5491-411e-b800-ecdf826a8f38].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-113;key=tyash_v1_question_705847ab-c7c8-4734-b873-c99f532339ca].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-114;key=tyash_v1_question_3d406bc7-f1dd-4094-88ca-0f5112e6bd6f].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-115;key=tyash_v1_question_175c0733-d545-4bfd-ba33-75627b1b0b46].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-116;key=tyash_v1_question_24794f05-5437-4432-a705-148590a1997e].feedback_config.rules[3].message`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-117;key=tyash_v1_question_1ea060d0-7212-4878-889d-459a97fd05eb].feedback_config.rules[3].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-119;key=tyash_v1_question_e50a8d6b-dda9-43ad-a19e-fd76ae2a6ce8].feedback_config.rules[3].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-120;key=tyash_v1_question_eef6b057-08c7-4284-a58c-8c4223b5c43c].feedback_config.rules[3].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-121;key=tyash_v1_question_aae5364c-6bae-4e02-bca9-14e81497200c].feedback_config.rules[3].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-122;key=tyash_v1_question_4ed76d8a-77a3-4e80-ada6-619be735f919].feedback_config.rules[3].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-123;key=tyash_v1_question_b8c58e30-900e-46c1-ab19-81a953fea09b].feedback_config.rules[3].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-124;key=tyash_v1_question_ee9f7c5c-3fbf-4cab-8d31-1c03eab5679c].feedback_config.rules[3].message`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-125;key=tyash_v1_question_531a9650-49ba-421a-8266-4220689e5316].feedback_config.rules[3].message`

### 9. Bonne base. Tu peux préciser davantage pour rendre la réponse plus exploitable.

Occurrences : 106.

- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-3;key=tyash_v1_question_c4389032-5351-46b1-941b-983f54ac8cef].feedback_config.neutralMessage`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-4;key=tyash_v1_question_81a6151c-6afe-4b2e-808e-7de0d4ffaa21].feedback_config.neutralMessage`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-5;key=tyash_v1_question_3cf4b9d1-dc5c-4462-8c41-da77e1809085].feedback_config.neutralMessage`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-6;key=tyash_v1_question_21727d86-9a91-4cc5-b7bd-d2f8554ee028].feedback_config.neutralMessage`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-7;key=tyash_v1_question_d28e8f73-2f6e-4e3a-b656-771bd46b6fda].feedback_config.neutralMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-9;key=tyash_v1_question_d8d1270a-6bc1-4a18-9fe4-a81276d2a456].feedback_config.neutralMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-10;key=tyash_v1_question_4698c6ab-4115-4f42-90fd-39de5e76f094].feedback_config.neutralMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-11;key=tyash_v1_question_a8a8c7a5-f56b-42be-8fdd-aea303232b2a].feedback_config.neutralMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-12;key=tyash_v1_question_93208543-81ac-462d-80cf-1ce901ae5be1].feedback_config.neutralMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-13;key=tyash_v1_question_fbc98c27-aa31-4156-8d1b-d8c6efb82e54].feedback_config.neutralMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-15;key=tyash_v1_question_8cf622ae-69ca-4e21-9d45-8f0dc988f858].feedback_config.neutralMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-16;key=tyash_v1_question_5c51f7a6-f47a-440d-b0b9-17729d79a0ad].feedback_config.neutralMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-17;key=tyash_v1_question_b90772e1-b46f-46b0-a8c8-9e3cc484bd9d].feedback_config.neutralMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-18;key=tyash_v1_question_6119a01a-6b60-40f9-9696-04bd60b56ac6].feedback_config.neutralMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-19;key=tyash_v1_question_2192dde4-4613-4972-84fa-1ec3b768c409].feedback_config.neutralMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-20;key=tyash_v1_question_174d0783-eb40-4066-9efb-ac8125233486].feedback_config.neutralMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-21;key=tyash_v1_question_f432312a-e508-4c59-9260-8d4fdc4c12ae].feedback_config.neutralMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-22;key=tyash_v1_question_b61d3df1-8a4e-4028-854d-c18aad1e10f7].feedback_config.neutralMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-23;key=tyash_v1_question_74c06ecc-f30c-4f7e-bbdd-dff9f648d7e7].feedback_config.neutralMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-24;key=tyash_v1_question_b7d99986-dfc0-48d9-8a89-4c4c6277d4bc].feedback_config.neutralMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-25;key=tyash_v1_question_21c2fdae-37b0-4a5e-bf76-24466e7ebe14].feedback_config.neutralMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-26;key=tyash_v1_question_88f629f5-830d-417f-b0f9-404cfd8efcec].feedback_config.neutralMessage`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-28;key=tyash_v1_question_3887cc49-7322-4cea-b622-b746db9a121b].feedback_config.neutralMessage`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-29;key=tyash_v1_question_38f02fb7-0a97-4e00-bccf-4eae77fd3052].feedback_config.neutralMessage`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-30;key=tyash_v1_question_2e8b3cac-f238-40de-9918-034c07e383ac].feedback_config.neutralMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-32;key=tyash_v1_question_afb6632b-2ef4-4033-b1ce-157e437e155d].feedback_config.neutralMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-33;key=tyash_v1_question_5a839b8a-aaa6-4e92-8e7d-f6ee03030a7e].feedback_config.neutralMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-34;key=tyash_v1_question_ba893b75-9398-4459-b5d8-5d624291b854].feedback_config.neutralMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-35;key=tyash_v1_question_afcf80dd-9c90-45b3-a4ef-9e18fe3b10fa].feedback_config.neutralMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-36;key=tyash_v1_question_a4fba8ad-606d-4ae2-9966-1dec711dd904].feedback_config.neutralMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-37;key=tyash_v1_question_bfbab4db-1f27-4971-97d2-ecbafce11d95].feedback_config.neutralMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-40;key=tyash_v1_question_08cd4cdb-646d-4b23-848a-56c564b3e0ad].feedback_config.neutralMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-41;key=tyash_v1_question_76175718-ff39-47cb-9bf7-4cea1b158f8b].feedback_config.neutralMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-42;key=tyash_v1_question_bf625f2f-38ae-4b24-8c31-6cf46da69b8a].feedback_config.neutralMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-43;key=tyash_v1_question_9c1b5cc2-ab73-42f6-a3bf-fa1dff132559].feedback_config.neutralMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-44;key=tyash_v1_question_be472850-7396-459e-9b0b-300c3f5ab405].feedback_config.neutralMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-45;key=tyash_v1_question_52700898-015b-4685-b3e4-275ebefd167d].feedback_config.neutralMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-46;key=tyash_v1_question_83b2d33d-c57a-4f49-9ce5-986d1f4accc6].feedback_config.neutralMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-47;key=tyash_v1_question_c59e3054-449c-4030-8a6e-a7b67f6ce28f].feedback_config.neutralMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-49;key=tyash_v1_question_3270721d-7d40-4525-b3ef-4f42f8808cc9].feedback_config.neutralMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-50;key=tyash_v1_question_38e071cf-8fc9-4e6d-b6fb-ca9d3fde104f].feedback_config.neutralMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-51;key=tyash_v1_question_0cf6fa9a-efe6-4de6-98d2-1ef25301b826].feedback_config.neutralMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-52;key=tyash_v1_question_5212b0ed-b808-4a8f-bb42-7d8475c5ab40].feedback_config.neutralMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-53;key=tyash_v1_question_e2f77c92-e79a-425d-a9e9-fefb30a70855].feedback_config.neutralMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-54;key=tyash_v1_question_75e816ac-f9df-4802-a9a8-551f2fb38d80].feedback_config.neutralMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-55;key=tyash_v1_question_0ddcf652-0fc0-417a-a777-b19c9fa38015].feedback_config.neutralMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-56;key=tyash_v1_question_20fe9bcd-d768-43b5-9164-edb66e56286b].feedback_config.neutralMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-57;key=tyash_v1_question_2b624ec6-0c4f-4c03-b49f-adbf671cb0ce].feedback_config.neutralMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-58;key=tyash_v1_question_18fdab94-d60c-475b-9365-760621ed8caf].feedback_config.neutralMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-60;key=tyash_v1_question_72a01b71-c2b7-4130-919c-9e0b1f93da8e].feedback_config.neutralMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-61;key=tyash_v1_question_79a1d21e-1599-49f2-8a87-f6e8fc4ee66c].feedback_config.neutralMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-62;key=tyash_v1_question_9e26bc34-310a-4214-9ae3-5910dbd01ec4].feedback_config.neutralMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-63;key=tyash_v1_question_6e3a9099-f093-49af-9917-6b672fa0238a].feedback_config.neutralMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-64;key=tyash_v1_question_2884aeee-070b-416d-a5db-74b34483d7e1].feedback_config.neutralMessage`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-67;key=tyash_v1_question_f0115e30-f501-460e-966a-c28b278ddef1].feedback_config.neutralMessage`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-68;key=tyash_v1_question_698a5cac-543c-4247-b96f-d9b1460e5026].feedback_config.neutralMessage`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-69;key=tyash_v1_question_6637b86b-46e7-424b-98e6-7187b0d07a17].feedback_config.neutralMessage`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-70;key=tyash_v1_question_a4f523a3-f56b-4343-8544-5336dab5bb58].feedback_config.neutralMessage`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-72;key=tyash_v1_question_82b11f2a-a7e7-4e9e-b00f-087cd564d47c].feedback_config.neutralMessage`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-73;key=tyash_v1_question_07a79c9e-f126-4b4e-9b14-9ab086b0abd9].feedback_config.neutralMessage`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-74;key=tyash_v1_question_539eaa77-1dff-41be-b42b-fa919fa5775e].feedback_config.neutralMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-76;key=tyash_v1_question_8c30053c-fa86-49fc-b74e-6d65e48d3e5f].feedback_config.neutralMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-77;key=tyash_v1_question_6f33b4c5-7135-4d42-b8b2-3dfffd10efa0].feedback_config.neutralMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-78;key=tyash_v1_question_c980e516-8a60-47d7-832a-f74a68f4ddad].feedback_config.neutralMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-79;key=tyash_v1_question_d5e62430-d470-4abd-bd7b-eb743f0b54c0].feedback_config.neutralMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-80;key=tyash_v1_question_679dc1d7-079a-4862-bdd0-44aaea7e4e00].feedback_config.neutralMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-83;key=tyash_v1_question_07b26c9c-3e82-4830-84de-0a8a0c835edf].feedback_config.neutralMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-84;key=tyash_v1_question_96ba9eda-c05f-4548-a777-29b40ef158d8].feedback_config.neutralMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-85;key=tyash_v1_question_9f9733b2-1c99-418e-abf2-6784e0d885ba].feedback_config.neutralMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-86;key=tyash_v1_question_57903d0c-5d7a-48ab-a1a7-17f84379204c].feedback_config.neutralMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-87;key=tyash_v1_question_9c3abc82-0368-4b91-89ba-0c827ba37758].feedback_config.neutralMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-88;key=tyash_v1_question_f5ae167a-ade7-434b-8d6c-b5676da745e5].feedback_config.neutralMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-89;key=tyash_v1_question_ebe7b0cc-29b5-46b1-95b0-948abff3448b].feedback_config.neutralMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-91;key=tyash_v1_question_b3abaf18-e361-402d-bf26-d18b1c3daffe].feedback_config.neutralMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-92;key=tyash_v1_question_067f7a4e-2f6e-4b82-b011-10ba26b511ea].feedback_config.neutralMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-93;key=tyash_v1_question_9dc224e7-8001-4ad4-b0f6-0bba4722204d].feedback_config.neutralMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-94;key=tyash_v1_question_461416af-c2a9-4291-924a-98bcb62d1faf].feedback_config.neutralMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-95;key=tyash_v1_question_dee233fd-9be9-4a03-92f4-59225a01eda2].feedback_config.neutralMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-96;key=tyash_v1_question_f924a439-9e88-4639-9b7e-92425a62ef32].feedback_config.neutralMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-97;key=tyash_v1_question_202a8d04-3a1a-4ff6-98a4-ec54d8502041].feedback_config.neutralMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-98;key=tyash_v1_question_d3d36a3a-baec-48d2-9856-90b7dc4f321b].feedback_config.neutralMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-99;key=tyash_v1_question_a0898eb3-b3a1-4257-9bfe-14d2d4bb3cbf].feedback_config.neutralMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-100;key=tyash_v1_question_ba70e79f-23b8-4e3c-acea-d191066ea7c5].feedback_config.neutralMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-101;key=tyash_v1_question_ade0cf52-c89a-4c75-abdc-ff3f71fc7d3e].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-103;key=tyash_v1_question_21603c35-d58d-42b5-8bb2-6cc94b85ab26].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-104;key=tyash_v1_question_d15563f8-cd75-451e-a121-68eac1c14b10].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-105;key=tyash_v1_question_4fd26066-5d70-4c63-be9e-47783fb2ea2f].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-106;key=tyash_v1_question_f51a48ae-29d5-4510-a26b-3b4815d681ee].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-107;key=tyash_v1_question_be9d3a9b-90cd-422f-b036-0dc9e4fef5ab].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-108;key=tyash_v1_question_cd3c051e-6f2e-4497-b105-03064e88c2fd].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-109;key=tyash_v1_question_81fdb58b-e227-4c5f-a471-9e4cb92cb8a2].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-110;key=tyash_v1_question_fa304cde-7b74-4592-8c57-4a133cb951a5].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-111;key=tyash_v1_question_91888041-8e40-4b04-bc0e-c16035d4838b].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-112;key=tyash_v1_question_ddf9ba99-5491-411e-b800-ecdf826a8f38].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-113;key=tyash_v1_question_705847ab-c7c8-4734-b873-c99f532339ca].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-114;key=tyash_v1_question_3d406bc7-f1dd-4094-88ca-0f5112e6bd6f].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-115;key=tyash_v1_question_175c0733-d545-4bfd-ba33-75627b1b0b46].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-116;key=tyash_v1_question_24794f05-5437-4432-a705-148590a1997e].feedback_config.neutralMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-117;key=tyash_v1_question_1ea060d0-7212-4878-889d-459a97fd05eb].feedback_config.neutralMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-119;key=tyash_v1_question_e50a8d6b-dda9-43ad-a19e-fd76ae2a6ce8].feedback_config.neutralMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-120;key=tyash_v1_question_eef6b057-08c7-4284-a58c-8c4223b5c43c].feedback_config.neutralMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-121;key=tyash_v1_question_aae5364c-6bae-4e02-bca9-14e81497200c].feedback_config.neutralMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-122;key=tyash_v1_question_4ed76d8a-77a3-4e80-ada6-619be735f919].feedback_config.neutralMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-123;key=tyash_v1_question_b8c58e30-900e-46c1-ab19-81a953fea09b].feedback_config.neutralMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-124;key=tyash_v1_question_ee9f7c5c-3fbf-4cab-8d31-1c03eab5679c].feedback_config.neutralMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-125;key=tyash_v1_question_531a9650-49ba-421a-8266-4220689e5316].feedback_config.neutralMessage`

### 10. C'est clair, tu peux encore ajouter un exemple.

Occurrences : 106.

- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-3;key=tyash_v1_question_c4389032-5351-46b1-941b-983f54ac8cef].feedback_config.positiveMessage`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-4;key=tyash_v1_question_81a6151c-6afe-4b2e-808e-7de0d4ffaa21].feedback_config.positiveMessage`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-5;key=tyash_v1_question_3cf4b9d1-dc5c-4462-8c41-da77e1809085].feedback_config.positiveMessage`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-6;key=tyash_v1_question_21727d86-9a91-4cc5-b7bd-d2f8554ee028].feedback_config.positiveMessage`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-7;key=tyash_v1_question_d28e8f73-2f6e-4e3a-b656-771bd46b6fda].feedback_config.positiveMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-9;key=tyash_v1_question_d8d1270a-6bc1-4a18-9fe4-a81276d2a456].feedback_config.positiveMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-10;key=tyash_v1_question_4698c6ab-4115-4f42-90fd-39de5e76f094].feedback_config.positiveMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-11;key=tyash_v1_question_a8a8c7a5-f56b-42be-8fdd-aea303232b2a].feedback_config.positiveMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-12;key=tyash_v1_question_93208543-81ac-462d-80cf-1ce901ae5be1].feedback_config.positiveMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-13;key=tyash_v1_question_fbc98c27-aa31-4156-8d1b-d8c6efb82e54].feedback_config.positiveMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-15;key=tyash_v1_question_8cf622ae-69ca-4e21-9d45-8f0dc988f858].feedback_config.positiveMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-16;key=tyash_v1_question_5c51f7a6-f47a-440d-b0b9-17729d79a0ad].feedback_config.positiveMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-17;key=tyash_v1_question_b90772e1-b46f-46b0-a8c8-9e3cc484bd9d].feedback_config.positiveMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-18;key=tyash_v1_question_6119a01a-6b60-40f9-9696-04bd60b56ac6].feedback_config.positiveMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-19;key=tyash_v1_question_2192dde4-4613-4972-84fa-1ec3b768c409].feedback_config.positiveMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-20;key=tyash_v1_question_174d0783-eb40-4066-9efb-ac8125233486].feedback_config.positiveMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-21;key=tyash_v1_question_f432312a-e508-4c59-9260-8d4fdc4c12ae].feedback_config.positiveMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-22;key=tyash_v1_question_b61d3df1-8a4e-4028-854d-c18aad1e10f7].feedback_config.positiveMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-23;key=tyash_v1_question_74c06ecc-f30c-4f7e-bbdd-dff9f648d7e7].feedback_config.positiveMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-24;key=tyash_v1_question_b7d99986-dfc0-48d9-8a89-4c4c6277d4bc].feedback_config.positiveMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-25;key=tyash_v1_question_21c2fdae-37b0-4a5e-bf76-24466e7ebe14].feedback_config.positiveMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-26;key=tyash_v1_question_88f629f5-830d-417f-b0f9-404cfd8efcec].feedback_config.positiveMessage`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-28;key=tyash_v1_question_3887cc49-7322-4cea-b622-b746db9a121b].feedback_config.positiveMessage`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-29;key=tyash_v1_question_38f02fb7-0a97-4e00-bccf-4eae77fd3052].feedback_config.positiveMessage`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-30;key=tyash_v1_question_2e8b3cac-f238-40de-9918-034c07e383ac].feedback_config.positiveMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-32;key=tyash_v1_question_afb6632b-2ef4-4033-b1ce-157e437e155d].feedback_config.positiveMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-33;key=tyash_v1_question_5a839b8a-aaa6-4e92-8e7d-f6ee03030a7e].feedback_config.positiveMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-34;key=tyash_v1_question_ba893b75-9398-4459-b5d8-5d624291b854].feedback_config.positiveMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-35;key=tyash_v1_question_afcf80dd-9c90-45b3-a4ef-9e18fe3b10fa].feedback_config.positiveMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-36;key=tyash_v1_question_a4fba8ad-606d-4ae2-9966-1dec711dd904].feedback_config.positiveMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-37;key=tyash_v1_question_bfbab4db-1f27-4971-97d2-ecbafce11d95].feedback_config.positiveMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-40;key=tyash_v1_question_08cd4cdb-646d-4b23-848a-56c564b3e0ad].feedback_config.positiveMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-41;key=tyash_v1_question_76175718-ff39-47cb-9bf7-4cea1b158f8b].feedback_config.positiveMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-42;key=tyash_v1_question_bf625f2f-38ae-4b24-8c31-6cf46da69b8a].feedback_config.positiveMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-43;key=tyash_v1_question_9c1b5cc2-ab73-42f6-a3bf-fa1dff132559].feedback_config.positiveMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-44;key=tyash_v1_question_be472850-7396-459e-9b0b-300c3f5ab405].feedback_config.positiveMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-45;key=tyash_v1_question_52700898-015b-4685-b3e4-275ebefd167d].feedback_config.positiveMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-46;key=tyash_v1_question_83b2d33d-c57a-4f49-9ce5-986d1f4accc6].feedback_config.positiveMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-47;key=tyash_v1_question_c59e3054-449c-4030-8a6e-a7b67f6ce28f].feedback_config.positiveMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-49;key=tyash_v1_question_3270721d-7d40-4525-b3ef-4f42f8808cc9].feedback_config.positiveMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-50;key=tyash_v1_question_38e071cf-8fc9-4e6d-b6fb-ca9d3fde104f].feedback_config.positiveMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-51;key=tyash_v1_question_0cf6fa9a-efe6-4de6-98d2-1ef25301b826].feedback_config.positiveMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-52;key=tyash_v1_question_5212b0ed-b808-4a8f-bb42-7d8475c5ab40].feedback_config.positiveMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-53;key=tyash_v1_question_e2f77c92-e79a-425d-a9e9-fefb30a70855].feedback_config.positiveMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-54;key=tyash_v1_question_75e816ac-f9df-4802-a9a8-551f2fb38d80].feedback_config.positiveMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-55;key=tyash_v1_question_0ddcf652-0fc0-417a-a777-b19c9fa38015].feedback_config.positiveMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-56;key=tyash_v1_question_20fe9bcd-d768-43b5-9164-edb66e56286b].feedback_config.positiveMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-57;key=tyash_v1_question_2b624ec6-0c4f-4c03-b49f-adbf671cb0ce].feedback_config.positiveMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-58;key=tyash_v1_question_18fdab94-d60c-475b-9365-760621ed8caf].feedback_config.positiveMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-60;key=tyash_v1_question_72a01b71-c2b7-4130-919c-9e0b1f93da8e].feedback_config.positiveMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-61;key=tyash_v1_question_79a1d21e-1599-49f2-8a87-f6e8fc4ee66c].feedback_config.positiveMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-62;key=tyash_v1_question_9e26bc34-310a-4214-9ae3-5910dbd01ec4].feedback_config.positiveMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-63;key=tyash_v1_question_6e3a9099-f093-49af-9917-6b672fa0238a].feedback_config.positiveMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-64;key=tyash_v1_question_2884aeee-070b-416d-a5db-74b34483d7e1].feedback_config.positiveMessage`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-67;key=tyash_v1_question_f0115e30-f501-460e-966a-c28b278ddef1].feedback_config.positiveMessage`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-68;key=tyash_v1_question_698a5cac-543c-4247-b96f-d9b1460e5026].feedback_config.positiveMessage`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-69;key=tyash_v1_question_6637b86b-46e7-424b-98e6-7187b0d07a17].feedback_config.positiveMessage`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-70;key=tyash_v1_question_a4f523a3-f56b-4343-8544-5336dab5bb58].feedback_config.positiveMessage`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-72;key=tyash_v1_question_82b11f2a-a7e7-4e9e-b00f-087cd564d47c].feedback_config.positiveMessage`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-73;key=tyash_v1_question_07a79c9e-f126-4b4e-9b14-9ab086b0abd9].feedback_config.positiveMessage`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-74;key=tyash_v1_question_539eaa77-1dff-41be-b42b-fa919fa5775e].feedback_config.positiveMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-76;key=tyash_v1_question_8c30053c-fa86-49fc-b74e-6d65e48d3e5f].feedback_config.positiveMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-77;key=tyash_v1_question_6f33b4c5-7135-4d42-b8b2-3dfffd10efa0].feedback_config.positiveMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-78;key=tyash_v1_question_c980e516-8a60-47d7-832a-f74a68f4ddad].feedback_config.positiveMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-79;key=tyash_v1_question_d5e62430-d470-4abd-bd7b-eb743f0b54c0].feedback_config.positiveMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-80;key=tyash_v1_question_679dc1d7-079a-4862-bdd0-44aaea7e4e00].feedback_config.positiveMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-83;key=tyash_v1_question_07b26c9c-3e82-4830-84de-0a8a0c835edf].feedback_config.positiveMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-84;key=tyash_v1_question_96ba9eda-c05f-4548-a777-29b40ef158d8].feedback_config.positiveMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-85;key=tyash_v1_question_9f9733b2-1c99-418e-abf2-6784e0d885ba].feedback_config.positiveMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-86;key=tyash_v1_question_57903d0c-5d7a-48ab-a1a7-17f84379204c].feedback_config.positiveMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-87;key=tyash_v1_question_9c3abc82-0368-4b91-89ba-0c827ba37758].feedback_config.positiveMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-88;key=tyash_v1_question_f5ae167a-ade7-434b-8d6c-b5676da745e5].feedback_config.positiveMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-89;key=tyash_v1_question_ebe7b0cc-29b5-46b1-95b0-948abff3448b].feedback_config.positiveMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-91;key=tyash_v1_question_b3abaf18-e361-402d-bf26-d18b1c3daffe].feedback_config.positiveMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-92;key=tyash_v1_question_067f7a4e-2f6e-4b82-b011-10ba26b511ea].feedback_config.positiveMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-93;key=tyash_v1_question_9dc224e7-8001-4ad4-b0f6-0bba4722204d].feedback_config.positiveMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-94;key=tyash_v1_question_461416af-c2a9-4291-924a-98bcb62d1faf].feedback_config.positiveMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-95;key=tyash_v1_question_dee233fd-9be9-4a03-92f4-59225a01eda2].feedback_config.positiveMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-96;key=tyash_v1_question_f924a439-9e88-4639-9b7e-92425a62ef32].feedback_config.positiveMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-97;key=tyash_v1_question_202a8d04-3a1a-4ff6-98a4-ec54d8502041].feedback_config.positiveMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-98;key=tyash_v1_question_d3d36a3a-baec-48d2-9856-90b7dc4f321b].feedback_config.positiveMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-99;key=tyash_v1_question_a0898eb3-b3a1-4257-9bfe-14d2d4bb3cbf].feedback_config.positiveMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-100;key=tyash_v1_question_ba70e79f-23b8-4e3c-acea-d191066ea7c5].feedback_config.positiveMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-101;key=tyash_v1_question_ade0cf52-c89a-4c75-abdc-ff3f71fc7d3e].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-103;key=tyash_v1_question_21603c35-d58d-42b5-8bb2-6cc94b85ab26].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-104;key=tyash_v1_question_d15563f8-cd75-451e-a121-68eac1c14b10].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-105;key=tyash_v1_question_4fd26066-5d70-4c63-be9e-47783fb2ea2f].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-106;key=tyash_v1_question_f51a48ae-29d5-4510-a26b-3b4815d681ee].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-107;key=tyash_v1_question_be9d3a9b-90cd-422f-b036-0dc9e4fef5ab].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-108;key=tyash_v1_question_cd3c051e-6f2e-4497-b105-03064e88c2fd].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-109;key=tyash_v1_question_81fdb58b-e227-4c5f-a471-9e4cb92cb8a2].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-110;key=tyash_v1_question_fa304cde-7b74-4592-8c57-4a133cb951a5].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-111;key=tyash_v1_question_91888041-8e40-4b04-bc0e-c16035d4838b].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-112;key=tyash_v1_question_ddf9ba99-5491-411e-b800-ecdf826a8f38].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-113;key=tyash_v1_question_705847ab-c7c8-4734-b873-c99f532339ca].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-114;key=tyash_v1_question_3d406bc7-f1dd-4094-88ca-0f5112e6bd6f].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-115;key=tyash_v1_question_175c0733-d545-4bfd-ba33-75627b1b0b46].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-116;key=tyash_v1_question_24794f05-5437-4432-a705-148590a1997e].feedback_config.positiveMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-117;key=tyash_v1_question_1ea060d0-7212-4878-889d-459a97fd05eb].feedback_config.positiveMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-119;key=tyash_v1_question_e50a8d6b-dda9-43ad-a19e-fd76ae2a6ce8].feedback_config.positiveMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-120;key=tyash_v1_question_eef6b057-08c7-4284-a58c-8c4223b5c43c].feedback_config.positiveMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-121;key=tyash_v1_question_aae5364c-6bae-4e02-bca9-14e81497200c].feedback_config.positiveMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-122;key=tyash_v1_question_4ed76d8a-77a3-4e80-ada6-619be735f919].feedback_config.positiveMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-123;key=tyash_v1_question_b8c58e30-900e-46c1-ab19-81a953fea09b].feedback_config.positiveMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-124;key=tyash_v1_question_ee9f7c5c-3fbf-4cab-8d31-1c03eab5679c].feedback_config.positiveMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-125;key=tyash_v1_question_531a9650-49ba-421a-8266-4220689e5316].feedback_config.positiveMessage`

### 11. Ta réponse est encore un peu floue. Essaie d'ajouter un résultat concret.

Occurrences : 106.

- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-3;key=tyash_v1_question_c4389032-5351-46b1-941b-983f54ac8cef].feedback_config.improvementMessage`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-4;key=tyash_v1_question_81a6151c-6afe-4b2e-808e-7de0d4ffaa21].feedback_config.improvementMessage`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-5;key=tyash_v1_question_3cf4b9d1-dc5c-4462-8c41-da77e1809085].feedback_config.improvementMessage`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-6;key=tyash_v1_question_21727d86-9a91-4cc5-b7bd-d2f8554ee028].feedback_config.improvementMessage`
- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-7;key=tyash_v1_question_d28e8f73-2f6e-4e3a-b656-771bd46b6fda].feedback_config.improvementMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-9;key=tyash_v1_question_d8d1270a-6bc1-4a18-9fe4-a81276d2a456].feedback_config.improvementMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-10;key=tyash_v1_question_4698c6ab-4115-4f42-90fd-39de5e76f094].feedback_config.improvementMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-11;key=tyash_v1_question_a8a8c7a5-f56b-42be-8fdd-aea303232b2a].feedback_config.improvementMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-12;key=tyash_v1_question_93208543-81ac-462d-80cf-1ce901ae5be1].feedback_config.improvementMessage`
- 1.2 — CE QUI VOUS ANIME — `module[1].submodule[2].exercise[id=-13;key=tyash_v1_question_fbc98c27-aa31-4156-8d1b-d8c6efb82e54].feedback_config.improvementMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-15;key=tyash_v1_question_8cf622ae-69ca-4e21-9d45-8f0dc988f858].feedback_config.improvementMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-16;key=tyash_v1_question_5c51f7a6-f47a-440d-b0b9-17729d79a0ad].feedback_config.improvementMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-17;key=tyash_v1_question_b90772e1-b46f-46b0-a8c8-9e3cc484bd9d].feedback_config.improvementMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-18;key=tyash_v1_question_6119a01a-6b60-40f9-9696-04bd60b56ac6].feedback_config.improvementMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-19;key=tyash_v1_question_2192dde4-4613-4972-84fa-1ec3b768c409].feedback_config.improvementMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-20;key=tyash_v1_question_174d0783-eb40-4066-9efb-ac8125233486].feedback_config.improvementMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-21;key=tyash_v1_question_f432312a-e508-4c59-9260-8d4fdc4c12ae].feedback_config.improvementMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-22;key=tyash_v1_question_b61d3df1-8a4e-4028-854d-c18aad1e10f7].feedback_config.improvementMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-23;key=tyash_v1_question_74c06ecc-f30c-4f7e-bbdd-dff9f648d7e7].feedback_config.improvementMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-24;key=tyash_v1_question_b7d99986-dfc0-48d9-8a89-4c4c6277d4bc].feedback_config.improvementMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-25;key=tyash_v1_question_21c2fdae-37b0-4a5e-bf76-24466e7ebe14].feedback_config.improvementMessage`
- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-26;key=tyash_v1_question_88f629f5-830d-417f-b0f9-404cfd8efcec].feedback_config.improvementMessage`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-28;key=tyash_v1_question_3887cc49-7322-4cea-b622-b746db9a121b].feedback_config.improvementMessage`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-29;key=tyash_v1_question_38f02fb7-0a97-4e00-bccf-4eae77fd3052].feedback_config.improvementMessage`
- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-30;key=tyash_v1_question_2e8b3cac-f238-40de-9918-034c07e383ac].feedback_config.improvementMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-32;key=tyash_v1_question_afb6632b-2ef4-4033-b1ce-157e437e155d].feedback_config.improvementMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-33;key=tyash_v1_question_5a839b8a-aaa6-4e92-8e7d-f6ee03030a7e].feedback_config.improvementMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-34;key=tyash_v1_question_ba893b75-9398-4459-b5d8-5d624291b854].feedback_config.improvementMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-35;key=tyash_v1_question_afcf80dd-9c90-45b3-a4ef-9e18fe3b10fa].feedback_config.improvementMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-36;key=tyash_v1_question_a4fba8ad-606d-4ae2-9966-1dec711dd904].feedback_config.improvementMessage`
- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-37;key=tyash_v1_question_bfbab4db-1f27-4971-97d2-ecbafce11d95].feedback_config.improvementMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-40;key=tyash_v1_question_08cd4cdb-646d-4b23-848a-56c564b3e0ad].feedback_config.improvementMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-41;key=tyash_v1_question_76175718-ff39-47cb-9bf7-4cea1b158f8b].feedback_config.improvementMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-42;key=tyash_v1_question_bf625f2f-38ae-4b24-8c31-6cf46da69b8a].feedback_config.improvementMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-43;key=tyash_v1_question_9c1b5cc2-ab73-42f6-a3bf-fa1dff132559].feedback_config.improvementMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-44;key=tyash_v1_question_be472850-7396-459e-9b0b-300c3f5ab405].feedback_config.improvementMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-45;key=tyash_v1_question_52700898-015b-4685-b3e4-275ebefd167d].feedback_config.improvementMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-46;key=tyash_v1_question_83b2d33d-c57a-4f49-9ce5-986d1f4accc6].feedback_config.improvementMessage`
- 2.1 — AUJOURD'HUI — `module[2].submodule[1].exercise[id=-47;key=tyash_v1_question_c59e3054-449c-4030-8a6e-a7b67f6ce28f].feedback_config.improvementMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-49;key=tyash_v1_question_3270721d-7d40-4525-b3ef-4f42f8808cc9].feedback_config.improvementMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-50;key=tyash_v1_question_38e071cf-8fc9-4e6d-b6fb-ca9d3fde104f].feedback_config.improvementMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-51;key=tyash_v1_question_0cf6fa9a-efe6-4de6-98d2-1ef25301b826].feedback_config.improvementMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-52;key=tyash_v1_question_5212b0ed-b808-4a8f-bb42-7d8475c5ab40].feedback_config.improvementMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-53;key=tyash_v1_question_e2f77c92-e79a-425d-a9e9-fefb30a70855].feedback_config.improvementMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-54;key=tyash_v1_question_75e816ac-f9df-4802-a9a8-551f2fb38d80].feedback_config.improvementMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-55;key=tyash_v1_question_0ddcf652-0fc0-417a-a777-b19c9fa38015].feedback_config.improvementMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-56;key=tyash_v1_question_20fe9bcd-d768-43b5-9164-edb66e56286b].feedback_config.improvementMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-57;key=tyash_v1_question_2b624ec6-0c4f-4c03-b49f-adbf671cb0ce].feedback_config.improvementMessage`
- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-58;key=tyash_v1_question_18fdab94-d60c-475b-9365-760621ed8caf].feedback_config.improvementMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-60;key=tyash_v1_question_72a01b71-c2b7-4130-919c-9e0b1f93da8e].feedback_config.improvementMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-61;key=tyash_v1_question_79a1d21e-1599-49f2-8a87-f6e8fc4ee66c].feedback_config.improvementMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-62;key=tyash_v1_question_9e26bc34-310a-4214-9ae3-5910dbd01ec4].feedback_config.improvementMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-63;key=tyash_v1_question_6e3a9099-f093-49af-9917-6b672fa0238a].feedback_config.improvementMessage`
- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-64;key=tyash_v1_question_2884aeee-070b-416d-a5db-74b34483d7e1].feedback_config.improvementMessage`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-67;key=tyash_v1_question_f0115e30-f501-460e-966a-c28b278ddef1].feedback_config.improvementMessage`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-68;key=tyash_v1_question_698a5cac-543c-4247-b96f-d9b1460e5026].feedback_config.improvementMessage`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-69;key=tyash_v1_question_6637b86b-46e7-424b-98e6-7187b0d07a17].feedback_config.improvementMessage`
- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-70;key=tyash_v1_question_a4f523a3-f56b-4343-8544-5336dab5bb58].feedback_config.improvementMessage`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-72;key=tyash_v1_question_82b11f2a-a7e7-4e9e-b00f-087cd564d47c].feedback_config.improvementMessage`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-73;key=tyash_v1_question_07a79c9e-f126-4b4e-9b14-9ab086b0abd9].feedback_config.improvementMessage`
- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-74;key=tyash_v1_question_539eaa77-1dff-41be-b42b-fa919fa5775e].feedback_config.improvementMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-76;key=tyash_v1_question_8c30053c-fa86-49fc-b74e-6d65e48d3e5f].feedback_config.improvementMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-77;key=tyash_v1_question_6f33b4c5-7135-4d42-b8b2-3dfffd10efa0].feedback_config.improvementMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-78;key=tyash_v1_question_c980e516-8a60-47d7-832a-f74a68f4ddad].feedback_config.improvementMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-79;key=tyash_v1_question_d5e62430-d470-4abd-bd7b-eb743f0b54c0].feedback_config.improvementMessage`
- 3.3 — CE QU'IL FAUT RACONTER — `module[3].submodule[3].exercise[id=-80;key=tyash_v1_question_679dc1d7-079a-4862-bdd0-44aaea7e4e00].feedback_config.improvementMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-83;key=tyash_v1_question_07b26c9c-3e82-4830-84de-0a8a0c835edf].feedback_config.improvementMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-84;key=tyash_v1_question_96ba9eda-c05f-4548-a777-29b40ef158d8].feedback_config.improvementMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-85;key=tyash_v1_question_9f9733b2-1c99-418e-abf2-6784e0d885ba].feedback_config.improvementMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-86;key=tyash_v1_question_57903d0c-5d7a-48ab-a1a7-17f84379204c].feedback_config.improvementMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-87;key=tyash_v1_question_9c3abc82-0368-4b91-89ba-0c827ba37758].feedback_config.improvementMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-88;key=tyash_v1_question_f5ae167a-ade7-434b-8d6c-b5676da745e5].feedback_config.improvementMessage`
- 4.1 — LE CONTEXTE — `module[4].submodule[1].exercise[id=-89;key=tyash_v1_question_ebe7b0cc-29b5-46b1-95b0-948abff3448b].feedback_config.improvementMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-91;key=tyash_v1_question_b3abaf18-e361-402d-bf26-d18b1c3daffe].feedback_config.improvementMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-92;key=tyash_v1_question_067f7a4e-2f6e-4b82-b011-10ba26b511ea].feedback_config.improvementMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-93;key=tyash_v1_question_9dc224e7-8001-4ad4-b0f6-0bba4722204d].feedback_config.improvementMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-94;key=tyash_v1_question_461416af-c2a9-4291-924a-98bcb62d1faf].feedback_config.improvementMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-95;key=tyash_v1_question_dee233fd-9be9-4a03-92f4-59225a01eda2].feedback_config.improvementMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-96;key=tyash_v1_question_f924a439-9e88-4639-9b7e-92425a62ef32].feedback_config.improvementMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-97;key=tyash_v1_question_202a8d04-3a1a-4ff6-98a4-ec54d8502041].feedback_config.improvementMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-98;key=tyash_v1_question_d3d36a3a-baec-48d2-9856-90b7dc4f321b].feedback_config.improvementMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-99;key=tyash_v1_question_a0898eb3-b3a1-4257-9bfe-14d2d4bb3cbf].feedback_config.improvementMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-100;key=tyash_v1_question_ba70e79f-23b8-4e3c-acea-d191066ea7c5].feedback_config.improvementMessage`
- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-101;key=tyash_v1_question_ade0cf52-c89a-4c75-abdc-ff3f71fc7d3e].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-103;key=tyash_v1_question_21603c35-d58d-42b5-8bb2-6cc94b85ab26].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-104;key=tyash_v1_question_d15563f8-cd75-451e-a121-68eac1c14b10].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-105;key=tyash_v1_question_4fd26066-5d70-4c63-be9e-47783fb2ea2f].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-106;key=tyash_v1_question_f51a48ae-29d5-4510-a26b-3b4815d681ee].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-107;key=tyash_v1_question_be9d3a9b-90cd-422f-b036-0dc9e4fef5ab].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-108;key=tyash_v1_question_cd3c051e-6f2e-4497-b105-03064e88c2fd].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-109;key=tyash_v1_question_81fdb58b-e227-4c5f-a471-9e4cb92cb8a2].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-110;key=tyash_v1_question_fa304cde-7b74-4592-8c57-4a133cb951a5].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-111;key=tyash_v1_question_91888041-8e40-4b04-bc0e-c16035d4838b].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-112;key=tyash_v1_question_ddf9ba99-5491-411e-b800-ecdf826a8f38].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-113;key=tyash_v1_question_705847ab-c7c8-4734-b873-c99f532339ca].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-114;key=tyash_v1_question_3d406bc7-f1dd-4094-88ca-0f5112e6bd6f].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-115;key=tyash_v1_question_175c0733-d545-4bfd-ba33-75627b1b0b46].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-116;key=tyash_v1_question_24794f05-5437-4432-a705-148590a1997e].feedback_config.improvementMessage`
- 4.3 — LA MATIÈRE À FILMER — `module[4].submodule[3].exercise[id=-117;key=tyash_v1_question_1ea060d0-7212-4878-889d-459a97fd05eb].feedback_config.improvementMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-119;key=tyash_v1_question_e50a8d6b-dda9-43ad-a19e-fd76ae2a6ce8].feedback_config.improvementMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-120;key=tyash_v1_question_eef6b057-08c7-4284-a58c-8c4223b5c43c].feedback_config.improvementMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-121;key=tyash_v1_question_aae5364c-6bae-4e02-bca9-14e81497200c].feedback_config.improvementMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-122;key=tyash_v1_question_4ed76d8a-77a3-4e80-ada6-619be735f919].feedback_config.improvementMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-123;key=tyash_v1_question_b8c58e30-900e-46c1-ab19-81a953fea09b].feedback_config.improvementMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-124;key=tyash_v1_question_ee9f7c5c-3fbf-4cab-8d31-1c03eab5679c].feedback_config.improvementMessage`
- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-125;key=tyash_v1_question_531a9650-49ba-421a-8266-4220689e5316].feedback_config.improvementMessage`

### 12. Quels produits ou services proposes-tu aujourd'hui ?

Occurrences : 1.

- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-4;key=tyash_v1_question_81a6151c-6afe-4b2e-808e-7de0d4ffaa21].question`

### 13. Comment tout a commencé ? Derrière chaque entreprise, il y a un point de départ. Quel a été le tien ? Une envie, une rencontre, un problème que tu voulais résoudre, une opportunité, une conviction...

Occurrences : 1.

- 1.1 — TON HISTOIRE — `module[1].submodule[1].exercise[id=-6;key=tyash_v1_question_21727d86-9a91-4cc5-b7bd-d2f8554ee028].explanation`

### 14. TA PERSONNALITÉ

Occurrences : 1.

- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].title`

### 15. Imagine : ton entreprise entre dans une pièce remplie de monde. Comment se comporte-t-elle ?

Occurrences : 1.

- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-15;key=tyash_v1_question_8cf622ae-69ca-4e21-9d45-8f0dc988f858].question`

### 16. Si ton entreprise était une personne...

Occurrences : 1.

- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-15;key=tyash_v1_question_8cf622ae-69ca-4e21-9d45-8f0dc988f858].explanation`

### 17. Et qu'aimerais-tu que les gens disent d'elle une fois qu'elle est partie ?

Occurrences : 1.

- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-16;key=tyash_v1_question_5c51f7a6-f47a-440d-b0b9-17729d79a0ad].question`

### 18. Si tu ne pouvais garder que 3 mots pour décrire la personnalité de ton entreprise, lesquels choisirais-tu ?

Occurrences : 1.

- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-23;key=tyash_v1_question_74c06ecc-f30c-4f7e-bbdd-dff9f648d7e7].question`

### 19. Si ton entreprise prenait la parole, comment parlerait-elle ?

Occurrences : 1.

- 1.3 — TA PERSONNALITÉ — `module[1].submodule[3].exercise[id=-25;key=tyash_v1_question_21c2fdae-37b0-4a5e-bf76-24466e7ebe14].question`

### 20. TES AMBITIONS

Occurrences : 1.

- 1.4 — TES AMBITIONS — `module[1].submodule[4].title`

### 21. Dans un an, qu'aimerais-tu avoir fait évoluer ?

Occurrences : 1.

- 1.4 — TES AMBITIONS — `module[1].submodule[4].exercise[id=-29;key=tyash_v1_question_38f02fb7-0a97-4e00-bccf-4eae77fd3052].question`

### 22. TES PUBLICS

Occurrences : 1.

- 1.5 — TES PUBLICS — `module[1].submodule[5].title`

### 23. Pour ce projet, qui veux-tu toucher en priorité ?

Occurrences : 1.

- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-35;key=tyash_v1_question_afcf80dd-9c90-45b3-a4ef-9e18fe3b10fa].question`

### 24. TA COMMUNICATION

Occurrences : 1.

- Module 2 — TA COMMUNICATION — `module[2].title`

### 25. Faisons le point Aujourd'hui, ta communication...

Occurrences : 1.

- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-49;key=tyash_v1_question_3270721d-7d40-4525-b3ef-4f42f8808cc9].explanation`

### 26. fait comprendre clairement ton activité ;

Occurrences : 1.

- 2.2 — CE QUI FONCTIONNE... OU PAS — `module[2].submodule[2].exercise[id=-50;key=tyash_v1_question_38e071cf-8fc9-4e6d-b6fb-ca9d3fde104f].question`

### 27. Quand tu regardes ta communication actuelle, retrouves-tu vraiment la personnalité que tu viens de décrire ?

Occurrences : 1.

- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-61;key=tyash_v1_question_79a1d21e-1599-49f2-8a87-f6e8fc4ee66c].question`

### 28. Comment penses-tu que les autres perçoivent ton entreprise aujourd'hui ?

Occurrences : 1.

- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-63;key=tyash_v1_question_6e3a9099-f093-49af-9917-6b672fa0238a].question`

### 29. Comment voudrais-tu qu'ils la perçoivent demain ?

Occurrences : 1.

- 2.3 — L'IMAGE PERÇUE — `module[2].submodule[3].exercise[id=-64;key=tyash_v1_question_2884aeee-070b-416d-a5db-74b34483d7e1].question`

### 30. TON BESOIN

Occurrences : 1.

- Module 3 — TON BESOIN — `module[3].title`

### 31. Si cette communication fonctionne parfaitement, qu'est-ce qui aura changé pour ton entreprise ?

Occurrences : 1.

- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-67;key=tyash_v1_question_f0115e30-f501-460e-966a-c28b278ddef1].question`

### 32. Quels changements recherches-tu ?

Occurrences : 1.

- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-68;key=tyash_v1_question_698a5cac-543c-4247-b96f-d9b1460e5026].question`

### 33. Quel problème concret aimerais-tu résoudre en priorité ?

Occurrences : 1.

- 3.1 — LE PROBLÈME À RÉSOUDRE — `module[3].submodule[1].exercise[id=-70;key=tyash_v1_question_a4f523a3-f56b-4343-8544-5336dab5bb58].question`

### 34. Comment saurais-tu que le projet a vraiment fonctionné ?

Occurrences : 1.

- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-73;key=tyash_v1_question_07a79c9e-f126-4b4e-9b14-9ab086b0abd9].question`

### 35. As-tu déjà un indicateur ou un résultat chiffré en tête ?

Occurrences : 1.

- 3.2 — LA PRIORITÉ — `module[3].submodule[2].exercise[id=-74;key=tyash_v1_question_539eaa77-1dff-41be-b42b-fa919fa5775e].question`

### 36. TON PROJET VIDÉO

Occurrences : 1.

- Module 4 — TON PROJET VIDÉO — `module[4].title`

### 37. DE TA PERSONNALITÉ À TON UNIVERS VIDÉO

Occurrences : 1.

- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].title`

### 38. Maintenant, voyons comment la personnalité de ta marque pourrait prendre vie à l'écran.

Occurrences : 1.

- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].content_html`

### 39. Qu'aimerais-tu que l'on ressente en regardant votre vidéo ?

Occurrences : 1.

- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-91;key=tyash_v1_question_b3abaf18-e361-402d-bf26-d18b1c3daffe].question`

### 40. Y a-t-il des vidéos, campagnes, films, marques ou univers qui t'inspirent ?

Occurrences : 1.

- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-92;key=tyash_v1_question_067f7a4e-2f6e-4b82-b011-10ba26b511ea].question`

### 41. Qu'est-ce que tu aimes dedans ?

Occurrences : 1.

- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-93;key=tyash_v1_question_9dc224e7-8001-4ad4-b0f6-0bba4722204d].question`

### 42. Traduisons ta personnalité en images Ces choix sont des préférences et non des décisions de réalisation définitives.

Occurrences : 1.

- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-95;key=tyash_v1_question_dee233fd-9be9-4a03-92f4-59225a01eda2].explanation`

### 43. Qu'est-ce que tu ne veux surtout pas voir dans cette vidéo ?

Occurrences : 1.

- 4.2 — DE TA PERSONNALITÉ À TON UNIVERS VIDÉO — `module[4].submodule[2].exercise[id=-101;key=tyash_v1_question_ade0cf52-c89a-4c75-abdc-ff3f71fc7d3e].question`

### 44. As-tu déjà imaginé un format ou préfères-tu être conseillé ?

Occurrences : 1.

- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-119;key=tyash_v1_question_e50a8d6b-dda9-43ad-a19e-fd76ae2a6ce8].question`

### 45. As-tu déjà quelque chose en tête ? Ce choix est une piste, pas un engagement. Le format doit servir ton objectif, pas l'inverse.

Occurrences : 1.

- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-119;key=tyash_v1_question_e50a8d6b-dda9-43ad-a19e-fd76ae2a6ce8].explanation`

### 46. Que souhaites-tu que la personne fasse après avoir regardé ?

Occurrences : 1.

- 4.4 — LES FORMATS ENVISAGÉS — `module[4].submodule[4].exercise[id=-125;key=tyash_v1_question_531a9650-49ba-421a-8266-4220689e5316].question`

### 47. La priorité Décris-nous une seule personne ou catégorie de personnes.

Occurrences : 1.

- 1.5 — TES PUBLICS — `module[1].submodule[5].exercise[id=-35;key=tyash_v1_question_afcf80dd-9c90-45b3-a4ef-9e18fe3b10fa].explanation`

## Hors parcours : email client à harmoniser ultérieurement

L’email personnalisé de Julien reste au tutoiement dans lib/mailer.ts : objet « Julien, ton accès à Brand Studio X Ty Ash est prêt » et corps « Ton accès… », « Je t’invite… », « Clique… ton accès… ton mot de passe ». Versions texte et HTML concernées. Non inclus dans les décomptes du parcours ; ces versions ont depuis été corrigées au vouvoiement dans le code, sans envoi d’email.

## Faux positifs à ne pas convertir automatiquement

« Ton de voix », « Ton de marque », « Ton en 3 mots » et « donner le ton » désignent le ton de communication. Les correspondances historiques dans lib/module-summary.ts, lib/brand-guide-final-answers.ts, lib/brand-guide.ts et les stop words de moodboard ne sont pas des messages au client.

## Règle pour les prochains contenus

Rédiger directement au vouvoiement tous les textes adressés aux clients, y compris les messages d’erreur et emails. Conserver les ids, stableKeys, groupes et positions. Ne pas convertir les réponses libres ni les noms saisis par les clients, les phrases à la première personne de la marque ou le nom « ton » au sens de ton de voix.
