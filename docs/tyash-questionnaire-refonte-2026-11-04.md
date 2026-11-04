# Refonte du questionnaire TYASH — 4 novembre 2026

## État de livraison

Implémentation locale, non déployée. Aucun questionnaire client publié, compte, droit, réponse ou pointeur distant n’a été modifié. Le brouillon complet est préparé dans `.runtime/questionnaire-refonte/draft.json` et une action Admin permet de l’enregistrer par le circuit authentifié existant. **Il n’est pas encore enregistré dans Supabase** : la clé de service disponible permet l’audit, mais ne remplace pas une session Admin pour les RPC de brouillon. Ne pas usurper cette identité ni contourner les RPC.

La migration de préremplissage est préparée et testée localement, non appliquée à distance. Aucune clé OpenAI n’a été créée, copiée ou révélée ; aucun appel OpenAI réel ni payant n’a été réalisé.

## Audit réel avant modification

Cible contrôlée : Supabase `cplzwnlstcpqqzqeawgs`, exclusivement TYASH. Snapshot officiel audité : `9ec7a3d0-5dfb-4f15-8931-d3caa8920bbe`, aucun brouillon ouvert. Les 4 modules, 15 sous-modules et 106 questions ont été lus depuis `content_release_snapshots`. La correspondance complète, question de référence / texte réellement publié / ID numérique / stableKey / parents, figure dans `content/tyash-refonte/question-map.json`.

Une sauvegarde locale hors Git des comptes, projets, releases, snapshots, réponses et états a été créée avant les changements : `.supabase-backups/tyash-before-questionnaire-refonte-2026-11-04.json`. Elle contient des données privées et ne doit pas être publiée. L’audit constate deux comptes, dont un rôle administrateur et un accès de consultation ; leurs permissions n’ont pas été transformées pour correspondre à l’expression « deux administrateurs » de la mission.

### Tables et publication

- `client_access_codes` → `brand_projects.account_id` : identité et propriété du projet.
- `user_answers` : réponses TYASH isolées par projet, utilisateur, module stable et question stable ; `upsert_user_answers_if_newer` conserve les protections de concurrence et les tombstones de réponses effacées.
- `project_exercise_answers`, `project_module_states`, sauvegardes dans `brand_exports` : compatibilité historique conservée, pas de réécriture des données TYASH vers ces tables.
- `content_releases`, `content_release_snapshots`, `application_release_state` : contenu versionné, snapshot courant et pointeur officiel.
- `admin_preview_answer_sets` : réponses de test séparées des données client.
- `admin_audit_logs`, programmations : circuit existant conservé.

L’éditeur sauvegarde uniquement le brouillon via `saveAdminReleaseModules` et la RPC de sauvegarde concurrente. « Déployer pour tous » vérifie la compatibilité, passe le brouillon à l’état prêt, puis appelle la publication atomique. Aucun de ces appels de publication n’a été exécuté. La refonte conserve tous les IDs, positions, types et parents **stockés**, ce qui reste compatible avec le garde-fou SQL existant.

## Comptages vérifiés

| Mesure | Avant | Après publication de la refonte |
| --- | ---: | ---: |
| Questions stockées, archives comprises | 106 | 106 |
| Questions du parcours client | 106 | 54 |
| Questions conservées actives hors préremplissage | — | 48 |
| Questions préremplissables | 0 | 6 |
| Questions retirées, archivées | 0 | 45 |
| Sources fusionnées, archivées | 0 | 7 |
| Champs ouverts à rédiger par le client | 74, justifications comprises | 26 |
| Groupes de références / liens, comptés séparément | 1 | 1, facultatif |
| Curseurs | 12 | 12, sans justification attendue |
| Groupes éditoriaux d’exercices | 43 | 29 |
| Écrans d’exercices réellement rendus | 74 | 43 |
| Introductions de sous-modules | 15 | 14 |

Le chiffre de 74 correspond aux 62 questions de type `open` plus les 12 justifications de curseurs. Le groupe de références, de type `group_open`, est distinct. Après refonte, les 31 questions `open` comprennent 5 préremplissages : il reste donc 26 questions ouvertes client. Le sixième préremplissage est le contexte à choix multiples. Les écrans réels diffèrent des groupes éditoriaux : les groupes mixtes et les curseurs étaient séparés par l’interface.

### Changements par module

| Module | Avant | Actives après | Traitement |
| --- | ---: | ---: | --- |
| Ton entreprise | 31 | 20 | 4 préremplissages, 11 archives, 6 curseurs sans commentaire, deux questions de personnalité sur un écran |
| Ta communication | 23 | 6 | 17 archives, suppression des sept affirmations, un curseur sans commentaire |
| Ton besoin | 12 | 9 | 1 préremplissage, 3 archives, sujets interdits fusionnés au module 4, action attendue reçue du module 4 |
| Ton projet vidéo | 40 | 19 | 1 préremplissage, 14 archives, 6 sources fusionnées, action attendue déplacée, 5 curseurs, retrait du sous-module formats |

Les fusions combinent en lecture les anciennes réponses avec leurs libellés, sans modifier les lignes sources. Une réponse enregistrée au champ fusionné après la publication, même vide, devient prioritaire. Le déplacement de l’action attendue modifie son emplacement affiché, pas son emplacement de sauvegarde : le serveur et la synchronisation gardent le module stable d’origine.

La révision `julien-2026-11-04` est nécessaire dans les quatre modules pour activer la projection. Une préparation partielle ou une destination invalide est refusée. Sans cette révision, la sélection des questions historiques reste inchangée. Aucun filtre global par titre ou par position ne transforme le Brand Studio principal.

## Préremplissage

Depuis `/admin/clients` ou une fiche utilisateur : « Préparer le questionnaire ». Julien utilise son identité Supabase vérifiée et son droit existant de consultation pour cette fonctionnalité ciblée ; aucune modification des rôles n’est nécessaire. Si le compte client existe mais n’a pas encore de projet, une action prépare son projet avant la première connexion, sans créer de compte ni envoyer d’e-mail.

Les six champs sont identifiés par leurs stableKeys auditées : activité, produits/services, ancienneté, clients actuels, importance du sujet, contexte du projet. Le contexte conserve ses options multiples existantes. Les autres champs sont libres.

La nouvelle table `tyash_questionnaire_prefills` contient seulement la base préparée par TYASH. La réponse effective vient de `user_answers` dès qu’une ligne client existe, y compris une réponse vide. Une nouvelle publication ou une modification Admin ne remplace jamais cette correction. La fiche de préparation présente séparément la base Admin et la réponse actuelle du client. Le client voit une indication de préremplissage et conserve les mêmes champs et la sauvegarde automatique.

RLS activée ; aucun accès direct public, anon ou authenticated. Lecture et écriture passent par le serveur, après contrôle d’identité et de permission. Le projet est résolu depuis le compte ciblé ; un `projectId` soumis par le navigateur n’est jamais utilisé. Les actions de mutation refusent un Supabase différent de TYASH.

La migration est additive et rejouable. Pour revenir en arrière, restaurer le précédent pointeur par le circuit de releases et désactiver la fonctionnalité ; conserver la table et les réponses comme archive. Aucun `DROP`, `TRUNCATE`, effacement ou backfill client n’est nécessaire.

## Synthèses et PDF

Le workspace, la progression et les synthèses utilisent la même projection des questions actives. Les douze curseurs présentent leur score et leurs libellés, pas leur justification. Le lecteur Admin utilise également cette projection et les préremplissages. Les anciennes questions et justifications restent accessibles depuis « Consulter les réponses historiques ».

Les PDF de fin de module reprennent les réponses courantes. Le bouton « Compte-rendu PDF » sur la fiche client génère en complément un document avec les quatre modules, les sous-modules et les réponses actuelles, adapté à la préparation d’un tournage. Ce téléchargement est disponible aux lecteurs clients autorisés, sans élargir leurs droits sur l’administration générale. Les anciens PDF enregistrés sont des archives et restent inchangés.

## Aide IA

La clé est lue uniquement sur le serveur : `OPENAI_API_KEY`, dans `lib/module-answer-ai.ts`, désormais protégé par `server-only`. Les fichiers `.env.local`, `.env.preview.local` et `.env.production.local` disponibles ne contiennent pas cette variable. L’état réel des variables Vercel n’a pas été consulté.

Configurer `OPENAI_API_KEY` dans les variables du **projet Vercel TYASH**, pour **Preview** pendant la recette et **Production** avant la mise en service, jamais avec le préfixe `NEXT_PUBLIC_`. Utiliser une clé autorisée pour TYASH, pas une clé copiée depuis le Brand Studio principal. Le projet Vercel est à vérifier dans le tableau de bord avant intervention ; les documents du dépôt mentionnent `brand-studio-tyash`, sans liaison locale Vercel vérifiée.

Le modèle existant est conservé. L’appel reçoit la question affichée et les réponses du projet. Le prompt TYASH tutoie le client, interdit d’inventer des faits et ne renégocie pas les éléments du devis. Sans contexte, l’aide propose une méthode de réponse sans remplir des faits imaginaires. Les erreurs du fournisseur et noms de variables ne sont pas renvoyés au navigateur. Les requêtes ont des délais limites. Les tests utilisent exclusivement des réponses simulées.

Références OpenAI Docs consultées : [authentification côté serveur](https://developers.openai.com/api/reference/overview), [sorties structurées](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat).

## Fichiers principaux

- Contenu et préparation : `content/tyash-refonte/question-map.json`, `lib/tyash-questionnaire-refonte.ts`, `scripts/audit-tyash-questionnaire.mjs`, `scripts/prepare-tyash-questionnaire.ts`, `app/admin/modules/prepare-tyash-refonte.ts`.
- Identités et lecture : `lib/training-types.ts`, `lib/training.ts`, `lib/release-content-validation.ts`, `lib/admin-content-release.ts`, `app/save-module-answers.ts`, `app/sync-answer-mutations.ts`.
- Préremplissage : `lib/tyash-questionnaire-prefill.ts`, `app/admin/clients/prepare/[id]/*`, liens dans les fiches et la liste clients.
- Compte-rendu : `lib/admin-user-insights.ts`, `app/admin/users/[id]/archives/page.tsx`, `lib/tyash-questionnaire-pdf.tsx`, `app/admin/users/[id]/questionnaire/pdf/route.ts`, `lib/module-summary.ts`, `lib/module-pdf-summary.tsx`, `lib/brand-guide.ts`, `app/ui/admin-answer-value.tsx`.
- Interface, tutoiement et groupes : `lib/client-copy.ts`, `lib/exercise-groups.ts`, `app/ui/admin-module-editor.tsx`, `app/ui/module-answer-form.tsx`, `app/ui/module-completion-screen.tsx`, `app/ui/module-submodule-viewer.tsx`, `app/mon-espace/page.tsx`.
- IA : `lib/module-answer-ai.ts`, `app/generate-module-answer-assistance.ts`.
- Migration : `supabase/migrations/20261104150000_tyash_questionnaire_prefills.sql`.
- Tests : `tests/tyash-refonte.test.ts`, `tests/tyash-prefill-security.test.ts`, `tests/tyash-ai-assistance.test.ts`, `tests/tyash-ai-errors.test.ts`, `tests/tyash-questionnaire-pdf.test.tsx`, complément dans `tests/tyash-workspace.test.ts`, `scripts/verify-tyash-prefill-sql.mjs`.

Les changements Stripe et les introductions de sous-modules déjà présents dans le workspace avant cette mission ont été conservés. Aucun commit, push ou déploiement n’est déclenché.

## Vérifications exécutées

- `npx vitest run --maxWorkers=2` : 60 fichiers, 420 tests réussis. Une première exécution concurrente avec le build avait dépassé le délai de 5 secondes d’un test PDF historique ; la suite complète repasse sans modification de ce délai avec deux workers.
- `npm run test:editorial` : 10 tests réussis.
- `npm run build` : compilation de production et TypeScript réussis, nouvelles routes incluses.
- ESLint sur les nouveaux fichiers et services ciblés : aucune erreur. La vérification élargie conserve sept avertissements déjà présents dans `module-answer-form.tsx` (variables et dépendances de hooks), sans nouvelle erreur après correction du nom de variable réservé.
- `npm exec --yes --package=@electric-sql/pglite -- node scripts/verify-tyash-prefill-sql.mjs` : migration rejouable, RLS et permissions vérifiées dans PostgreSQL en mémoire ; réponses et rôles inchangés.
- `npm exec --yes --package=@electric-sql/pglite -- node scripts/verify-controlled-publication-sql.mjs` : sauvegardes A/B, concurrence, publication atomique, audit, archivage et protections des identités vérifiés en mémoire. Aucun appel à une base distante par ces deux scripts SQL.
- PDF de compte-rendu réellement généré et relu avec PDF.js : quatre modules présents, score de curseur lisible, anciennes justifications absentes.
- Contrôle du brouillon préparé : aucun vouvoiement ou nom de marque incorrect dans les textes actifs, aides, feedbacks ou libellés d’options affichés. Les valeurs historiques d’options restent stockées à l’identique.
- Comparaison finale des huit tables sauvegardées avec Supabase : empreintes et nombres de lignes identiques pour l’état de release, les releases, snapshots, comptes, projets, réponses stables, réponses historiques et états de module. Résultat conservé dans `.runtime/questionnaire-refonte/remote-verification.json`.
- `git diff --check` : aucune erreur de contenu.

La recette mobile visuelle et les interactions dans une session Admin/client réelle ne sont pas couvertes par ces tests locaux. La configuration et les permissions Supabase Auth réelles devront être vérifiées dans cette recette, après application autorisée de la migration.

## Étapes restant à exécuter avant publication

1. Relire la sauvegarde et la migration, vérifier la cible TYASH, puis appliquer uniquement la migration de préremplissage dans l’environnement de recette autorisé.
2. Déployer le code dans une Preview TYASH autorisée et configurer sa clé OpenAI côté serveur. Ne pas pointer un environnement d’essai vers le Brand Studio principal.
3. Avec une session Admin réelle, cliquer sur « Préparer la refonte en brouillon ». Cette action utilise les RPC existantes et ne publie pas. Un brouillon préexistant non issu de cette préparation est refusé pour ne pas l’écraser.
4. Prévisualiser le brouillon avec les mécanismes Admin existants, vérifier les six préremplissages et leur correction, la reprise, le mobile, la navigation, les archives, la synthèse et les PDF. Une recette interactive dans un navigateur authentifié reste nécessaire.
5. Vérifier les variables et la migration dans l’environnement de production TYASH. Le contrôle de publication refuse la refonte si la table ou la clé IA manque. L’autorisation de publier reste une décision distincte.
6. Après validation explicite de la propriétaire uniquement, déployer le code de production puis utiliser « Déployer pour tous » pour publier le brouillon complet. Ne programmer aucune publication automatique.

L’enregistrement distant du brouillon, l’application de la migration, la configuration distante, le test IA réel et la recette dans un navigateur authentifié restent à réaliser. Le travail n’est donc pas déclaré intégralement terminé en production.
