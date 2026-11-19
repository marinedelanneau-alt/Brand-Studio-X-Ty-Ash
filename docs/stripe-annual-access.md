# Stripe — Brand Studio X TyASH, 55 € TTC pour 365 jours

> Le parcours d’inscription décrit dans ce document correspond à la première
> intégration annuelle. Il est remplacé par le parcours invité documenté dans
> [tyash-guest-checkout.md](tyash-guest-checkout.md) : e-mail avant paiement,
> compte et mot de passe après paiement. Consulter ce nouveau guide pour les
> migrations, variables, cas de comptes existants et la recette à jour.

## État du livrable

Implémentation locale. Aucune migration distante, aucun paiement, aucun envoi
d’e-mail, aucune modification de compte administrateur et aucun déploiement
n’ont été effectués pour cette mission.

Le parcours est vérifié avec des tests automatisés locaux : inscription,
identité Supabase, Checkout simulé, signatures Stripe réelles sur événements
de test fabriqués localement, confirmation, activation transactionnelle dans
PostgreSQL/PGlite, expiration, RLS, remboursement et litige.

Il n’y a pas d’environnement TEST dédié selon la réponse de Marine.
Aucune clé Stripe TEST n’est configurée localement. Un paiement dans Stripe
et le trajet réseau Stripe → Vercel → Supabase n’ont donc **pas** été vérifiés.
L’intégration ne doit pas être considérée comme entièrement recettée ni mise
en production sans validation explicite.

## Architecture et règles

- `/register` crée un compte Supabase et un compte applicatif sans droits
  payants, puis redirige vers `/commander`. Le mécanisme historique de liens
  d’activation reste disponible pour les achats déjà engagés.
- `/api/stripe/create-checkout-session` exige une identité Supabase vérifiée
  côté serveur, cohérente avec le compte applicatif. Les identifiants et prix
  transmis par le navigateur sont ignorés. Même origine obligatoire.
- Checkout hébergé Stripe, `mode: payment`, 5 500 centimes EUR, quantité 1,
  prix ponctuel configurable, sans code promotionnel ni taxe supplémentaire.
- Le prix doit être actif, ponctuel, en EUR, à 55 €, et ne pas être configuré
  hors taxes. Le mode TEST/LIVE doit correspondre à la clé et au prix.
- `annual_payments` constitue le registre faisant autorité pour les nouveaux
  comptes `annual_access_required`. Les anciennes lignes `subscriptions` ne
  peuvent pas accorder de droits à ces comptes.
- Une réservation SQL verrouille le compte. Une clé d’idempotence Stripe
  stable par commande/tentative évite les achats simultanés. Un Checkout
  encore ouvert est réutilisé ; un paiement asynchrone en cours interdit
  une nouvelle commande. Après échec définitif ou expiration, une nouvelle
  tentative est possible. Un achat déjà payé interdit tout nouvel achat,
  même après expiration : le renouvellement manuel n’est pas activé.
- Une erreur réseau ambiguë ne déclenche pas un nouvel achat arbitraire :
  la même réservation et la même clé Stripe sont reprises. Si la réservation
  n’a jamais pu être reliée à une session avant son échéance, le support doit
  retrouver la session par `metadata.order_id` dans Stripe avant toute reprise.
- Le webhook vérifie la signature sur le corps brut, le mode, la session
  enregistrée, l’identité, le montant, la devise et la ligne de prix.
- Seul le webhook payé appelle `apply_annual_payment`. Cette fonction SQL
  enregistre paiement, début et fin d’accès dans la même transaction. La fin
  correspond à exactement 31 536 000 secondes après confirmation, en UTC.
  Les doublons ne déplacent jamais cette période.
- La page de retour lit uniquement la commande du compte connecté. Elle
  n’active aucun droit. Elle attend le webhook et vérifie à nouveau pendant
  une minute, puis propose une vérification manuelle et le contact support.
- Les comptes administrateurs restent gratuits et illimités selon les rôles
  existants. Aucun compte de Marine ou Julien n’est modifié par la migration.
- Les comptes ordinaires actifs sans achat Stripe enregistré passent à
  `annual_access_required`, même s’ils disposaient d’un accès offert. Leurs
  projets, réponses, fichiers et identités sont conservés. Leur première
  période payante commence au paiement, jamais à leur ancienne inscription.
- À expiration : fonctionnalités payantes bloquées ; identité, projets,
  réponses et documents conservés. `/acces-expire` explique la situation.
- Un remboursement **intégral** révoque l’accès. Un remboursement partiel
  le conserve. Toute contestation suspend l’accès. Une contestation gagnée
  ne réactive pas automatiquement les droits : examen manuel nécessaire.
  Un webhook de paiement reçu après la révocation ne réactive pas l’accès.
- Les anciens points de création à 50 € et 289 € retournent HTTP 410. Les
  webhooks historiques continuent à traiter les achats déjà engagés.

Les contrôles s’appliquent dans `getAuthenticatedAccount`,
`getSubscriptionAccessStatus` et `hasActiveAccess` : pages, actions serveur,
exercices, téléversements, sauvegardes et téléchargements PDF. Des politiques
RLS restrictives complètent les politiques de propriété existantes pour
interdire les accès directs Supabase sans droits. Les administrateurs
conservent leurs politiques d’édition et de publication.

Les droits d’accès ne changent pas le fonctionnement des exports légaux de
données personnelles. Les URL publiques des images/polices déjà téléversées
dans le bucket historique `project-assets` restent publiques : la migration
ne déplace ni ne privatise ce stockage existant.

Le registre contient les références nécessaires à un futur renouvellement
manuel. Celui-ci demandera une évolution versionnée de la contrainte actuelle
d’un achat par compte et du choix de la période courante ; aucune commande de
renouvellement ni aucun prélèvement récurrent n’est activé.

## Migration Supabase

Nouvelle migration :
`supabase/migrations/20261117120000_tyash_annual_payments.sql`.

Elle dépend des migrations antérieures, notamment
`20261017120000_client_viewer.sql` et
`20261113180000_account_lifetime.sql`, déjà présentes dans le travail local.
Appliquer les migrations manquantes dans leur ordre chronologique, sur le
projet TYASH choisi, après sauvegarde et vérification de sa référence.
Ne pas réinitialiser Supabase ni rejouer le schéma complet.

La nouvelle migration :

1. Ajoute `annual_access_required`, puis y bascule les comptes ordinaires
   actifs sans achat Stripe enregistré. Les comptes Admin et les achats
   historiques enregistrés ne sont pas modifiés.
2. Crée `annual_payments`, avec unicité des sessions, paiements et événements,
   et stockage des dates, montants, devise, environnement et statuts.
3. Crée les fonctions serveur de réservation et d’activation transactionnelle.
4. Protège les identités, privilèges et dates contre les modifications clientes.
5. Ajoute les contrôles RLS d’accès payant.
6. Neutralise `claim_expired_accounts` et `finalize_expired_account` pour
   empêcher la suppression automatique même par un ancien worker.

Les échéances des achats historiques enregistrés ne sont pas recalculées. Les fonctions
d’expiration précédentes restent présentes mais ne peuvent plus supprimer.
Le cron actuel envoie uniquement les rappels, avec un texte de conservation.
Avant un déploiement coordonné, suspendre l’ancien cron d’expiration s’il est
déjà actif, appliquer la migration de conservation, déployer le nouveau code,
puis réactiver le cron. Ne jamais rétablir l’ancien code de suppression seul.

## Variables Vercel

Variables exclusivement serveur sauf celles déjà préfixées `NEXT_PUBLIC_` :

| Variable | Preview / développement | Production après validation |
| --- | --- | --- |
| `STRIPE_MODE` | `test` | `live` |
| `STRIPE_SECRET_KEY` | clé secrète TEST `sk_test_…` | clé secrète LIVE `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | secret du webhook TEST ou du CLI | secret du webhook LIVE |
| `STRIPE_PRICE_ID` | identifiant du prix TEST à 55 € | identifiant du prix LIVE à 55 € |
| `STRIPE_TEST_SUPABASE_PROJECT_REF` | référence du projet Supabase TEST distinct | facultative si aucun TEST n’existe |
| `STRIPE_LIVE_SUPABASE_PROJECT_REF` | référence Supabase TYASH de production, pour empêcher un mélange | référence Supabase TYASH de production |
| `STRIPE_LIVE_PAYMENTS_APPROVED` | absente | `yes` uniquement après approbation de mise en service |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet TEST | URL TYASH de production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé publique du projet TEST | clé publique de production |
| `SUPABASE_SERVICE_ROLE_KEY` | clé serveur du projet TEST | clé serveur de production |
| `NEXT_PUBLIC_SITE_URL` | URL Preview retenue | domaine public TYASH |

Conserver `CRON_SECRET` et les variables Brevo existantes pour les rappels.
`STRIPE_CHECKOUT_MODE` n’est plus utilisé par le nouveau parcours : le mode
est toujours `payment`. Ni clé publiable Stripe ni composant Embedded Checkout
ne sont nécessaires pour le nouveau paiement hébergé.

Les variables Supabase et Stripe d’une Preview doivent appartenir aux
environnements TEST, jamais à la production. Le code vérifie le projet
Supabase attendu, refuse les clés LIVE en Preview/développement, refuse les
paiements TEST sur Vercel Production et exige l’approbation explicite LIVE.

## Manipulations Stripe et URL du webhook

1. Dans Stripe, sélectionner le bon environnement (Sandbox/TEST pour une
   recette isolée ; LIVE uniquement après validation).
2. Créer ou réutiliser un produit nommé
   **Brand Studio X TyASH — Accès 1 an**.
3. Ajouter un prix **ponctuel de 55,00 EUR TTC**, sans récurrence. Inclure les
   taxes dans le prix si la configuration fiscale l’exige ; ne pas ajouter
   de taxe augmentant le total. Copier son `price_…` dans `STRIPE_PRICE_ID`.
4. Créer une destination webhook vers :
   `https://<domaine-TYASH>/api/stripe/webhook`.
5. Abonner cette destination aux événements suivants :
   `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`,
   `checkout.session.expired`,
   `charge.refunded`,
   `charge.dispute.created`.
6. Copier le secret de signature de cette destination dans
   `STRIPE_WEBHOOK_SECRET`, dans le même environnement Vercel.
7. Si les anciens abonnements sont toujours utilisés, conserver aussi leurs
   événements existants `customer.subscription.created/updated/deleted` et
   `invoice.payment_succeeded/failed` sur la destination historique.

Le domaine de production utilisé par défaut dans le dépôt est
`brand-studio-x-ty-ash.vercel.app`. S’il est confirmé comme domaine de cette
mise en service, l’URL sera :
`https://brand-studio-x-ty-ash.vercel.app/api/stripe/webhook`.
Ne pas utiliser cette URL pour une recette TEST ; son domaine Preview reste
à choisir. Sur une Preview protégée, Stripe doit disposer d’un accès réseau
au webhook. Le secret `whsec_…` du CLI est distinct de celui du Dashboard.

Références Stripe : [exécution après paiement](https://docs.stripe.com/checkout/fulfillment),
[signature du webhook](https://docs.stripe.com/webhooks/signature),
[tests de paiement](https://docs.stripe.com/testing).

## Recette Stripe à effectuer lorsque l’environnement existe

Les étapes suivantes ne sont pas exécutées automatiquement et ne doivent
jamais utiliser une vraie carte en mode TEST.

1. Préparer une Preview avec un projet Supabase TEST distinct, appliquer les
   migrations et renseigner les variables TEST ci-dessus.
2. Ouvrir `/register`, créer un utilisateur inédit et vérifier sa redirection
   vers `/commander`. L’ouverture directe d’un module doit être bloquée.
3. Cliquer « Accéder à Brand Studio — 55 € ». Vérifier 55 € TTC et paiement
   unique dans Checkout. En TEST, utiliser `4242 4242 4242 4242`, une date
   future et un CVC de trois chiffres.
4. Vérifier la livraison du webhook en HTTP 200 dans Stripe et la ligne
   `annual_payments` : session, identité, paiement, montant `5500`, devise
   `eur`, `status = paid`, `paid_at` et `expires_at` séparés de 365 jours.
5. Vérifier l’accueil de confirmation, le bouton d’accès, les modules,
   l’enregistrement d’une réponse et le téléchargement du carnet de projet.
   La date doit apparaître sur le dashboard.
6. Suspendre temporairement la livraison du webhook dans l’environnement
   TEST, payer et vérifier l’état d’attente. Relivrer l’événement : l’accès
   doit s’activer. Relivrer deux fois : aucune date ne doit changer.
7. Abandonner un autre Checkout puis le reprendre : la session ouverte est
   réutilisée. Simuler un refus avec `4000 0000 0000 0002` ; aucun droit ne
   doit être accordé. Vérifier également une session expirée et, si activés,
   les moyens de paiement asynchrones.
8. Rembourser intégralement un paiement TEST : l’accès doit être bloqué et
   les réponses conservées. Vérifier un remboursement partiel séparément.
   Pour un litige TEST, utiliser la carte Stripe `4000 0000 0000 0259` selon
   le scénario documenté par Stripe et vérifier `charge.dispute.created`.
9. Sur un compte TEST payé uniquement, simuler une échéance passée avec le
   SQL suivant. Aucun compte réel ne doit être modifié :

   ```sql
   begin;
   update public.annual_payments
   set paid_at = now() - interval '366 days',
       expires_at = now() - interval '1 day'
   where account_id = <ID_COMPTE_TEST> and live_mode = false;
   update public.client_access_codes
   set access_started_at = now() - interval '366 days',
       access_expires_at = now() - interval '1 day'
   where id = <ID_COMPTE_TEST> and annual_access_required;
   commit;
   ```

10. Vérifier `/acces-expire`, les refus d’actions et de téléchargements
    directs, puis la présence inchangée du compte, des réponses et des fichiers.
    Vérifier aussi les appels REST Supabase avec un JWT expiré/non payant.
11. Vérifier Marine et Julien : accès gratuit, modules, exercices et fonctions
    Admin disponibles, aucun achat demandé, aucun indicateur annuel affiché.

Commandes locales de vérification :

```text
npx vitest run --testTimeout=20000
npx tsc --noEmit --incremental false
npm run build -- --webpack
```

## Interventions manuelles restantes

- Choisir un environnement de recette isolé, ou décider explicitement du
  traitement de cette recette manquante avant une validation de lancement.
- Créer le produit/prix et le webhook dans le compte Stripe concerné.
- Renseigner les variables Vercel sans transmettre les secrets dans le chat.
- Appliquer les migrations sur le bon projet Supabase et coordonner le cron.
- Publier via l’Admin des **nouvelles versions** des documents de vente et
  de conservation cohérentes avec 55 € TTC, 365 jours, sans renouvellement
  automatique et sans suppression automatique à l’échéance. Les textes
  publiés existants ne sont pas réécrits par ce changement de code.
- Activer `BRAND_STUDIO_LEGAL_RELEASE=enabled` pour rendre les liens légaux
  existants accessibles et vérifier qu’ils affichent les documents finalisés.
- Réaliser la recette Stripe, puis approuver explicitement le déploiement
  Production. Le simple ajout de variables ne déploie pas le code.

## Fichiers de cette mission

Créés :

```text
lib/annual-offer.ts
lib/annual-stripe.ts
lib/annual-payments.ts
app/acces-expire/page.tsx
app/ui/payment-confirmation-refresh.tsx
supabase/migrations/20261117120000_tyash_annual_payments.sql
tests/annual-access.test.ts
tests/annual-checkout.test.ts
tests/annual-confirmation.test.tsx
tests/annual-payments-sql.test.ts
tests/annual-registration.test.ts
tests/annual-webhook.test.ts
docs/stripe-annual-access.md
```

Modifiés (certains comportaient déjà des changements locaux conservés) :

```text
app/api/stripe/create-checkout-session/route.ts
app/api/stripe/create-embedded-checkout-session/route.ts
app/api/stripe/create-brand-studio-order/route.ts
app/api/stripe/webhook/route.ts
app/api/account/backup/route.ts
app/commander/page.tsx
app/commander/confirmation/page.tsx
app/pricing/page.tsx
app/offre-brand-studio/page.tsx
app/page.tsx
app/login.ts
app/register-account.ts
app/register/page.tsx
app/validate-access-code.ts
app/ui/checkout-button.tsx
app/ui/register-form.tsx
app/ui/account-expiry-notice.tsx
lib/access-codes.ts
lib/session.ts
lib/subscriptions.ts
lib/account-expiry-jobs.ts
lib/account-expiry-email.ts
docs/account-lifetime.md
tests/account-expiry-jobs.test.ts
tests/account-lifetime.test.ts
tests/client-viewer.test.ts
tests/commercial-checkout.test.ts
tests/embedded-checkout.test.ts
tests/embedded-confirmation.test.ts
tests/embedded-webhook.test.ts
```

Les autres changements préexistants du dépôt, dont les modules et les outils
de publication, ne font pas partie de cette mission.
