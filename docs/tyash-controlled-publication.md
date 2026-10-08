# Publication contrôlée — Brand Studio X Ty Ash

## Flux corrigé

L'éditeur lit le brouillon courant de `content_release_snapshots`, ou le snapshot
publié quand aucun brouillon n'existe. Une sauvegarde crée un brouillon si nécessaire
et met uniquement son snapshot à jour. Elle ne publie jamais et conserve les
paramètres du guide, du PDF et de l'interface. La publication volontaire valide le
brouillon enregistré puis utilise `mark_content_release_ready` et
`publish_content_release`, avec l'audit et le changement atomique du pointeur existants.

Les lecteurs utilisent exclusivement le pointeur officiel et son snapshot. Un mode
autre que `controlled`, une release non publiée, un snapshot absent, incompatible ou
malformé provoque une erreur explicite. Aucun repli vers les tables historiques.

Les brouillons historiques dans `brand_exports` et Storage restent intacts, mais
ne sont plus importés automatiquement. Aucun compte « Marine Communication »,
chemin Storage global ou brouillon sans filtre de projet ne sélectionne le contenu.

## Étapes manuelles avant activation

1. Vérifier que Vercel `brand-studio-tyash` utilise bien le Supabase Ty Ash
   (`cplzwnlstcpqqzqeawgs` dans la configuration locale), jamais le projet original.
2. Vérifier en lecture seule le pointeur publié, le snapshot et leur cohérence avec
   les IDs des réponses/progressions actuelles. Les publications historiques antérieures
   ont pu changer ces IDs : la conservation ne peut pas être certifiée sur la base
   réelle avec la clé serveur locale invalide. Ne pas basculer sans cette recette.
3. Examiner les anciens brouillons historiques et les déploiements programmés avant
   activation. Ils ne sont ni supprimés ni automatiquement repris. Une reprise de
   contenu non synchronisé doit être revue et effectuée uniquement dans un brouillon.
4. Appliquer uniquement `supabase/migrations/20261008120000_guard_controlled_draft_saves.sql`
   sur le Supabase Ty Ash vérifié, après validation. Cette migration ajoute une RPC
   de sauvegarde concurrente qui réutilise la RPC existante et protège les identités
   lors des publications, y compris celles de pg_cron. Aucun backfill, aucune
   suppression et aucune modification des réponses, progressions, projets ou comptes.
   Sans cette RPC, les nouvelles sauvegardes échouent explicitement.
5. Configurer manuellement dans Vercel :

   ```dotenv
   CONTENT_RELEASE_READ_MODE=controlled
   NEXT_PUBLIC_ENABLE_ADMIN_DRAFT_PREVIEW=false
   NEXT_PUBLIC_APP_ENV=production
   ENABLE_CONTROLLED_ADMIN_PUBLISHING=true
   ```

6. Vérifier `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et
   `SUPABASE_SERVICE_ROLE_KEY` dans Ty Ash. Les secrets restent dans les variables
   d'environnement, jamais dans Git. La clé serveur locale doit être remplacée
   manuellement par un identifiant valide du même projet pour une recette réelle.
7. Après autorisation de déploiement, vérifier dans une recette isolée : texte A,
   sauvegarde B, utilisateur encore sur A, publication B, rechargement sur B, réponses
   et progression conservées. Aucun déploiement ni changement de variable distante
   n'est effectué par cette correction locale.

## Protection des identités existantes

Les `id`, `legacyId` et `stableKey` sont conservés. Les nouveaux éléments ont leurs
propres identités ; ils ne récupèrent jamais l'identité de l'ancien occupant d'un
index. Une révision de module détecte les onglets périmés et une comparaison atomique
du timestamp du snapshot refuse les sauvegardes concurrentes perdues.

Des réponses, sauvegardes et brouillons navigateur utilisent encore des positions.
Les déplacements, suppressions, changements de type des éléments publiés et changements
de structure des sous-questions/tableaux sont donc refusés avant écriture. Les textes
et paramètres compatibles restent éditables. Les ajouts sont autorisés dans les
emplacements finaux libres, sans déplacer un élément publié. Les éléments uniquement
dans le brouillon peuvent être retirés tant que cela ne déplace aucun élément publié.

Une migration d'identités pour permettre tous les réordonnancements reste un travail
distinct : aucune réponse existante n'est migrée ou réécrite ici.

## Validation locale

Les tests fonctionnels utilisent une base en mémoire et exécutent les actions admin,
le service de releases et le chargement du workspace. Les RPC distantes y sont simulées.
Le script ci-dessous exécute en plus les vraies fonctions SQL et la nouvelle migration
dans PostgreSQL en mémoire : sauvegarde A/B, rejet d'un timestamp périmé, publication
atomique, pointeur, archivage, audit, données utilisateur inchangées, rejet des déplacements,
retraits, changements de type et changements d'identifiants. L'identité Auth est simulée.

```powershell
npm exec --yes --package=@electric-sql/pglite -- node scripts/verify-controlled-publication-sql.mjs
```

Les politiques RLS et identités Auth réelles nécessitent toujours une recette isolée
après application de la migration. Le build n'est pas une preuve d'accès à la base distante.
