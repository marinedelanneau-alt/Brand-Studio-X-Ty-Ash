# Versions indépendantes de parcours

La correction est locale. Aucune migration distante, création de brouillon ou
publication n'a été effectuée pendant cette intervention.

`content_releases.pathway_root_id` distingue une nouvelle version de parcours des
révisions de contenu de ce même parcours. Les releases historiques restent à NULL,
sans backfill. La RPC explicite `create_independent_pathway_draft` crée une racine,
son snapshot et le pointeur de brouillon en une transaction. Elle refuse un
brouillon déjà présent ou un pointeur officiel devenu périmé.

Le bouton « Créer le nouveau parcours Ty Ash » dans Versions utilise le modèle
de snapshot natif `content/tyash-v1/pathway.json`, côté serveur uniquement. Les
43 exercices sont les groupes existants `exercise_group_id`, comprenant 106
questions et les 12 curseurs. Chaque entité reçoit une nouvelle stable key
Ty Ash et un nouvel ID négatif réservé contre tous les snapshots conservés.
Le contenu reste dans les snapshots, jamais dans le front. L'éditeur Modules
charge ensuite le brouillon par le mécanisme habituel.

`assertReleaseAnswerCompatibility` reste intacte. Les révisions d'un parcours
indépendant sont comparées à toutes les releases déjà publiées de ce parcours,
même si une autre version est actuellement officielle. Avant sa première
publication, l'ordre et la structure du nouveau brouillon sont libres.

Les triggers SQL conservent la protection des identités lors des publications
historiques et protègent aussi les parcours indépendants : clés et IDs distincts
des autres parcours, identité de racine immuable, slots publiés conservés au sein
du parcours, snapshots historiques immuables. Les clones héritent de la racine.
Les lecteurs utilisateurs gardent exclusivement `published_release_id` (le nom
réel du pointeur officiel dans cette base). Les réponses Ty Ash utilisent les
identités stables exactes, sans lecture des réponses ou backups positionnels.

## Durcissement de la migration

La migration entière est transactionnelle. Les tables, colonnes et signatures de
fonctions du circuit controlled sont contrôlées avant toute modification de
schéma ; l'état officiel doit également référencer une release publiée avec un
snapshot de version 1. Un échec annule l'installation. Ces préconditions ne sont
pas une preuve du project ref : PostgreSQL ne fournit pas de primitive portable
fiable pour identifier un projet Supabase. Le projet Ty Ash doit être sélectionné
explicitement au moment d'une éventuelle exécution.

Le trigger `controlled_release_publication_compatible`, attendu depuis
`20261008120000_guard_controlled_draft_saves.sql`, est réinstallé et activé par
`CREATE OR REPLACE TRIGGER`. Les deux nouveaux triggers sont également
idempotents et activés. Aucun trigger tiers n'est supprimé ou désactivé.

La fonction préexistante `guard_controlled_release_publication()` est remplacée
pour distinguer une révision classique d'une version indépendante. La branche
classique conserve exactement la comparaison antérieure des IDs : un ancien ID
numérique absent n'impose pas de nouvelle contrainte. La fonction TypeScript
`assertReleaseAnswerCompatibility` reste conservée avec ses vérifications.

Le contrat `lib/pathway-snapshot.schema.json` décrit la structure des snapshots
existants, sans nouvelle table de contenu. Il est partagé entre la validation
serveur TypeScript et la garde SQL. Les types d'exercices viennent de cette même
liste ; les validateurs existants de releases et de complétion restent utilisés
côté serveur. `scripts/sync-pathway-contract.mjs --check` détecte une divergence
entre le contrat et sa copie générée dans la migration autonome.

Avant toute insertion, la RPC vérifie ce contrat, les parents, les positions et
les identités uniques, les options, les aides, les paramètres des curseurs et les
métadonnées facultatives. La garde du snapshot contrôle en plus l'indépendance
avec tous les autres parcours. Une erreur ne laisse aucune release, snapshot ou
modification du pointeur. Les contraintes strictes d'import concernent uniquement
les nouvelles versions indépendantes, pas les publications historiques.

## Activation restant nécessaire

Appliquer uniquement sur `cplzwnlstcpqqzqeawgs` la migration additive
`supabase/migrations/20261016120000_independent_pathway_versions.sql`, après la
migration de garde existante `20261008120000_guard_controlled_draft_saves.sql`.
L'accès REST avec une Secret key ne permet pas d'exécuter une migration DDL.
Aucun accès SQL, mot de passe PostgreSQL ou CLI Supabase authentifiée n'était
disponible pendant cette intervention. La lecture distante a confirmé l'absence
de la colonne `pathway_root_id` : aucun brouillon indépendant n'a donc été créé.

Utiliser le SQL Editor du seul projet Ty Ash ou un accès SQL authentifié local.
Ne modifier aucune clé locale. Après application, rendre ce code disponible dans
l'Admin avant la création du nouveau parcours ; ne pas publier de contenu.

Le brief approuvé est conservé dans `content/tyash-v1/brief.txt`. Le générateur
local `scripts/build-tyash-seed.py` en extrait sans réécriture les titres,
introductions, questions, aides et choix. Ce générateur ne se lance ni au build
ni au démarrage, et n'accède jamais à Supabase. Le contenu est écrit dans le
brouillon uniquement après clic par un Admin authentifié, via la RPC existante
et sa session. Le modèle n'est jamais lu par les pages du parcours utilisateur.

Les titres des exercices et introductions utilisent le champ d'aide riche
existant de la première question de chaque groupe. Ils restent éditables dans
ce champ de l'Admin. La personnalité n'est pas interpolée depuis les réponses :
l'introduction générique du sous-module vidéo est éditable. Le composant actuel
de choix multiples n'impose pas de plafond de trois choix ; la question conserve
la consigne exacte « 3 mots ». Les trois champs de références restent facultatifs
pour permettre de laisser Ty Ash proposer une direction.

## Vérifications locales

`npx vitest run tests/pathway-versions.test.ts tests/admin-publication.test.ts tests/tyash-engine.test.ts tests/tyash-workspace.test.ts`

Les tests utilisent des fixtures, dont un brouillon de 4 modules, 15 sous-modules
et 43 questions. Ils appellent le chargement Admin, l'action de sauvegarde et le
workspace utilisateur réels avec une base simulée. Ils ne constituent pas une
recette sur le contenu métier distant.

`npm exec --yes --package=@electric-sql/pglite -- node scripts/verify-pathway-versions-sql.mjs`

Cette simulation exécute les fonctions SQL et migrations dans PostgreSQL en
mémoire, y compris la publication. Elle vérifie la conservation de l'historique,
des fixtures utilisateur, l'héritage des racines et le rejet des réaffectations.
Elle ne publie rien sur Supabase et ne vérifie pas les comptes/RLS distants.

La simulation couvre aussi l'installation répétée, un trigger précédent absent,
le rejet d'un schéma incomplet, les publications classiques compatibles et
incompatibles, et 32 fixtures communes aux validateurs SQL et TypeScript, ainsi
que la validation SQL du parcours métier complet. Le
chargement Admin et l'action d'import sont testés avec les fonctions réelles et
une base simulée. Aucun contenu métier réel n'est créé par ces tests.
