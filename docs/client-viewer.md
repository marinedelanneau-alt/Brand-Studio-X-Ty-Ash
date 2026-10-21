# Julien : utilisateur normal + consultation clients

Préparation locale uniquement pour Brand Studio X Ty Ash, Supabase
`cplzwnlstcpqqzqeawgs`. Aucun compte, email, migration distante, commit ou push.

## Analyse de l'architecture existante

`/admin/clients` appelait `getAdminAccounts()` dans `lib/training.ts`, qui utilise
le client serveur service role pour lire comptes et projets. La progression et
les réponses sont assemblées séparément par `getAdminUsers()` dans
`lib/admin-user-insights.ts`, à partir de comptes, projets, réponses et exports.
Ce DTO de lecture ne contient pas les codes d'accès ni les clés serveur.

Ce modèle serveur est conservé. Avant toute lecture clients, la garde
`getAuthenticatedClientReader()` vérifie `supabase.auth.getUser()`, charge le
compte lié à cet identifiant et exige un compte actif avec les droits Admin
existants OU `can_view_clients=true`. Aucun cookie historique ne suffit pour
cette consultation. `getAdminUsers()` applique la garde lui-même ; la page et
le layout ne sont pas l'unique protection. La clé service reste dans les modules
`server-only` et les variables serveur, jamais dans les composants clients.

Julien accède à `/admin/clients`, à la liste/progression et aux fiches de réponses
`/admin/users/[id]`, uniquement en lecture. Le formulaire d'invitation est réservé
à Marine/Admin. Les pages/actions modules, releases, publication et gestion des
accès conservent leur garde Admin indépendante. La permission ne devient jamais
`is_admin=true`. Les mécanismes existants de sauvegarde personnelle ne changent
pas : compte issu de la session, contrôle du projet et de l'identité des mutations.

## Migration minimale réelle

`supabase/migrations/20261017120000_client_viewer.sql` remplace intégralement la
version refusée, qui n'a jamais été exécutée. Elle contient uniquement BEGIN,
un ALTER TABLE de `client_access_codes` ajoutant `can_view_clients` et
`complimentary_access` (boolean NOT NULL DEFAULT false), puis COMMIT.

Cette table est le compte applicatif existant, lié à Auth par `auth_user_id`.
La première colonne ouvre le suivi, la seconde accorde un accès gratuit indépendant
de Stripe. Elles sont séparées : consulter les clients ne confère pas à lui seul
un accès gratuit. Les valeurs ne sont pas attribuées lors de la migration.

Aucune policy, fonction, boucle, trigger, REVOKE, GRANT, activation RLS ou modification
de rôle. Aucune réponse, donnée métier existante, table Stripe, subscription,
release, snapshot ou pointeur controlled n'est modifié. Les nouvelles colonnes
valent false pour les lignes existantes. Les restrictions SQL existantes de
`client_access_codes` restent responsables de protéger ses attributs privilégiés,
comme elles le font déjà pour `is_admin` et `role` ; aucun droit d'écriture client
supplémentaire n'est ajouté. Sélectionner explicitement le projet Ty Ash avant
l'exécution manuelle : le commentaire ne constitue pas un contrôle de project ref.

## Invitation préparée, jamais déclenchée

Marine/Admin utilise « Inviter Julien » dans `/admin/clients`.
`getAuthenticatedInvitationAdmin()` exige une session Supabase vérifiée et des
droits Admin, à l'entrée de l'action ainsi que dans les helpers de préparation et
d'attribution. Le serveur refuse tout projet différent et exige sa clé service.

Le système recherche Auth avec pagination, génère un lien invite si absent ou
recovery si présent, puis `grantJulienAccess()` vérifie à nouveau l'identité Auth
exacte `jsene@ty-ash.com`. Il crée/réutilise uniquement le compte applicatif ciblé,
avec role=user, is_admin=false, can_view_clients=true, complimentary_access=true.
L'insertion gère le conflit d'unicité par relecture ; une identité ou un rôle
incompatible provoque un refus. L'UPDATE compare le compte et son rattachement
pour ne pas écraser un changement concurrent. Le profil `profiles` est inséré
seulement s'il n'existe pas déjà. Aucun mot de passe choisi par Marine et aucune
écriture de subscription. Aucune RPC SQL de l'ancienne migration n'est requise.

Brevo envoie le texte demandé seulement après attribution complète. La callback
`https://brand-studio-x-ty-ash.vercel.app/auth/reset/callback` vérifie le token
Supabase et dirige vers le choix du mot de passe puis `/mon-espace`.
L'UI distingue compte, accès et email. Sans confirmation Brevo, aucun succès
d'envoi n'est affiché ; une erreur ne supprime ni ne recrée le compte.

L'identité et le rattachement restent idempotents grâce aux contraintes existantes
et aux contrôles ciblés. Les clics simultanés sur la même instance serveur sont
regroupés et le succès conservé une minute en mémoire. Aucun verrou distribué
n'est installé en base : plusieurs instances peuvent préparer plusieurs emails,
mais pas plusieurs comptes pour la même identité. Un timeout fournisseur impose
de vérifier les journaux Brevo avant une relance ; aucune livraison en boîte mail
n'est promise à partir d'une seule acceptation API.

## Configuration à vérifier avant activation autorisée

Vercel Production :
- NEXT_PUBLIC_SITE_URL : https://brand-studio-x-ty-ash.vercel.app
- NEXT_PUBLIC_FORMATION_URL, si présente : même domaine
- NEXT_PUBLIC_SUPABASE_URL : https://cplzwnlstcpqqzqeawgs.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY : clé publique de ce projet
- SUPABASE_SERVICE_ROLE_KEY : clé serveur de ce projet, jamais NEXT_PUBLIC
- BREVO_API_KEY et BREVO_SENDER_EMAIL : clé et expéditeur transactionnels valides
- BREVO_SENDER_NAME : nom souhaité ; BREVO_REPLY_TO_EMAIL/NAME : optionnels

Supabase Auth : Site URL sur le domaine de production, Redirect URLs incluant
/auth/reset/callback et /auth/callback pour les connexions existantes.
Aucun réglage distant modifié. L'invitation personnalisée utilise Brevo.

## Vérification locale

`node scripts/verify-client-viewer-sql.mjs` examine l'intégralité du SQL et vérifie
qu'il ne contient que les deux colonnes et la transaction. Il n'exécute aucun SQL.
`npx vitest run` teste les sessions, l'autorisation avant lectures service role,
la séparation Admin/consultation, le DTO, les sauvegardes personnelles des trois
profils, les mutations étrangères refusées, l'invitation, l'attribution ciblée,
l'email et la callback. Aucune connexion distante nécessaire dans ces tests.
