# L’impact recherché — publication du 17 novembre 2026

Modification appliquée dans le projet Supabase TYASH
`cplzwnlstcpqqzqeawgs`, via le circuit ADMIN existant : clonage de la
version 17, enregistrement avec contrôle de concurrence, passage à l’état
prêt, puis publication de la **version 18**.

- Version source : `f7e191be-4b4c-4acd-843e-5c9122108c9a`.
- Version publiée : `a886ff8f-08b0-4111-a40f-357f1f0342ed`.
- Identité du parcours conservée : `73205e8c-0d4a-4cea-a64b-ebbf673842d5`.
- Le snapshot de la version source reste intégralement inchangé.

## Contenus ciblés

| Contenu | Identifiant unique conservé | Nouvelle formulation |
| --- | --- | --- |
| Étape / module 3 (`-65`) | `tyash_v1_module_d48f8c27-79ba-4e8a-b0d2-e978a461f7d9` | L'IMPACT DE TON PROJET |
| Sous-module (`-66`) | `tyash_v1_submodule_1c046537-f890-4444-803e-bffc7a6635ba` | L'IMPACT RECHERCHÉ |
| Question 1 (`-69`) | `tyash_v1_question_6637b86b-46e7-424b-98e6-7187b0d07a17` | Qu'aimerais-tu faire évoluer ou changer grâce à ce projet ? |
| Question 2 (`-70`) | `tyash_v1_question_a4f523a3-f56b-4343-8544-5336dab5bb58` | Quel impact concret aimerais-tu que cette vidéo ait sur ton activité, ton public ou ton environnement ? |

Les quatre formulations demandées sont reprises exactement. Les introductions
du module et de ce seul sous-module sont également alignées sur l’impact,
l’évolution et le résultat recherché ; ces nouvelles phrases utilisent le
vouvoiement conformément à la convention éditoriale du projet.

L’introduction conserve sa mise en page `brand_video`, sa phrase clé et ses
trois paragraphes. Aucun style, composant, média, option de réponse, ordre,
type de question, statut de préremplissage ou clé de sauvegarde n’est modifié.
La révision de l’éditeur du module est renouvelée pour éviter un écrasement
par une ancienne session d’édition.

## Cohérence pédagogique

L’enchaînement reste :

1. **L’impact recherché** : identifier l’évolution souhaitée et l’effet concret
   que la vidéo doit produire.
2. **La priorité** : choisir le résultat principal et les signes de réussite.
3. **Ce qu’il faut raconter** : définir le message, les preuves et l’action
   attendue du public.

Les deux sous-modules suivants sont identiques à ceux de la version 17,
y compris leurs introductions, questions, options et identifiants.

## Vérifications effectuées

- Comparaison exhaustive des snapshots : seuls les libellés et introductions
  ciblés, ainsi que la révision de l’éditeur du module, changent.
- Réglages de PDF, de carnet, d’interface et version de schéma inchangés.
- Empreintes avant/après identiques pour les 38 lignes de `user_answers`.
  Les tables de progression, de réponses historiques et de préremplissage
  sont également inchangées. Aucun contenu de réponse n’est inscrit dans
  les journaux ni dans ce document.
- Pages de production `/mon-espace` et module 3 : HTTP 200 et nouveaux
  libellés présents.
- PDF du module téléchargé depuis la production : HTTP 200, quatre pages,
  deux nouveaux titres et deux nouvelles questions retrouvés par extraction
  de texte ; ancien titre du sous-module absent.
- Tests locaux du PDF du module et du carnet complet : libellés actualisés
  et réponses de vérification conservées.
- Test d’une modification manuelle ultérieure : le texte enregistré dans
  l’ADMIN reste la source utilisée par la vue client, la synthèse et le carnet.
- 19 tests ciblés réussis ; TypeScript et ESLint réussis.

Les synthèses et les nouveaux téléchargements PDF utilisent déjà les contenus
de la release sélectionnée. Aucun remplacement forcé dans les composants,
aucune migration de schéma et aucun redéploiement applicatif n’ont été
nécessaires. Les anciennes releases et les documents déjà téléchargés ne sont
pas réécrits.

## Fichiers de suivi

- `scripts/lib/tyash-impact-content.mjs` : transformation ciblée et vérification
  exhaustive du périmètre.
- `scripts/update-tyash-impact.mjs` : exécution contrôlée via les RPC ADMIN,
  vérification des réponses et des pages de production.
- `tests/tyash-impact-content.test.tsx` : identités, réponses, édition ADMIN,
  synthèses et deux générateurs PDF.

Les sauvegardes de snapshots et rapports techniques locaux se trouvent sous
`.runtime/tyash-impact/`, dossier ignoré par Git. Le script est ponctuel : il
refuse un nouveau passage si les formulations ont changé, afin de ne pas
écraser les prochaines modifications ADMIN. Il ne remplace pas l’éditeur.
