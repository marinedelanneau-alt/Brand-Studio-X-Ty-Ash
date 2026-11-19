# Inscription par e-mail, paiement et activation — Brand Studio X TyASH

## État de livraison

Implémentation locale du parcours e-mail → Checkout existant → webhook signé → compte → e-mail Brevo → mot de passe → `/mon-espace`.

Aucun déploiement, aucune migration distante, aucun paiement réel et aucun envoi d’e-mail réel n’ont été effectués pour cette mission. Les modifications de présentation déjà présentes dans `app/page.tsx` sont conservées.

La recette Stripe TEST réelle n’est **pas validée** : les clés Stripe, le prix et le webhook TEST ainsi qu’un projet Supabase TEST distinct ne sont pas configurés dans les environnements accessibles. Les tests automatisés utilisent des doubles Stripe/Auth/Brevo et PostgreSQL PGlite ; ils ne remplacent pas cette recette.

## Fichiers du parcours

| Fichier | Changement |
| --- | --- |
| `app/page.tsx` | CTA « Entrer dans l’outil » et explication du mot de passe après paiement, en conservant la présentation vidéo et le co-branding précédemment demandés. |
| `app/register/page.tsx` | Nouvelle présentation, champ e-mail uniquement, prix 55 € TTC / 365 jours, acceptation CGU/CGV publiées, liens légaux. Redirection des comptes authentifiés déjà actifs ou expirés. |
| `app/ui/guest-checkout-form.tsx` | Validation navigateur, envoi de l’e-mail et des identifiants juridiques ; redirection uniquement vers Stripe Checkout. |
| `app/ui/legacy-registration-page.tsx` | Conservation de l’ancienne interface pour les liens d’activation historiques déjà émis uniquement. |
| `app/register-account.ts` | Fermeture de la création publique de comptes sans paiement ; conservation des activations historiques. |
| `app/commander/page.tsx` | Redirection vers le parcours unique `/register` ; conservation de l’état d’abandon. |
| `app/api/stripe/create-checkout-session/route.ts` | Même endpoint et même offre annuelle, désormais accessibles aux visiteurs : normalisation de l’e-mail, vérification juridique et tarifaire, réservation serveur, cookie privé, idempotence Stripe. Aucun compte créé à cette étape. |
| `lib/annual-payments.ts` | Validation du checkout invité contre le registre serveur, puis appel de l’association de compte après application du paiement. Anciennes commandes authentifiées conservées. |
| `lib/annual-activation.ts` | Création/reprise Auth après paiement, association transactionnelle, bail d’envoi, outbox chiffrée, reçu Brevo et reprise des erreurs partielles. |
| `lib/annual-guest-security.ts` | Normalisation e-mail, secrets aléatoires et empreintes SHA-256, options du cookie HttpOnly. |
| `lib/annual-email-payload.ts` | Chiffrement AES-256-GCM de l’outbox contenant le lien personnel. |
| `lib/mailer.ts` | Nouveau message de bienvenue via le service Brevo existant ; aucun mot de passe envoyé. Message de connexion habituel pour un compte dont le mot de passe existe déjà. |
| `app/commander/confirmation/page.tsx` | Lecture du registre avec cookie privé, session Stripe et environnement concordants ; l’e-mail n’est annoncé qu’après un reçu fournisseur enregistré. Attente, reprise ou revue selon l’état. |
| `app/activer/page.tsx` | Page de création du mot de passe et demande de renvoi. Un GET ne consomme pas le lien, ce qui évite son utilisation par un scanner d’e-mails. |
| `app/activer/actions.ts` | Contrôle du paiement, du grant serveur et de l’identité, consommation atomique puis `verifyOtp` Supabase et `updateUser`. Deux mots de passe identiques requis ; redirection vers le dashboard. |
| `app/ui/annual-password-form.tsx` | Deux champs de mot de passe et formulaire de renvoi indépendant. |
| `app/api/annual-activation/resend/route.ts` | Réponse publique générique identique pour toute adresse ; recherche et envoi après la réponse, cooldown persistant et contrôle des droits payés. |
| `docs/stripe-annual-access.md` | Renvoi vers ce guide pour remplacer les anciennes consignes d’inscription avant paiement. |
| `docs/tyash-guest-checkout.md` | Présent guide de livraison, configuration, migration et recette. |

Tests ajoutés : `annual-activation.test.ts`, `annual-password.test.ts`, `annual-activation-resend.test.ts`, `annual-guest-confirmation.test.tsx`, `annual-guest-sql.test.ts` dans `tests/`. Tests adaptés : `annual-checkout.test.ts`, `annual-registration.test.ts`, `annual-webhook.test.ts`, `annual-confirmation.test.tsx`.

## Migration Supabase

Nouvelle migration : `supabase/migrations/20261117160000_tyash_guest_checkout.sql`.

Elle dépend des migrations existantes `20261113180000_account_lifetime.sql` et `20261117120000_tyash_annual_payments.sql`. Vérifier leur présence dans l’historique du projet cible avant application. Ne pas réinitialiser Supabase et ne pas rejouer aveuglément les anciennes migrations sur la production.

- Étend **la table annuelle existante** `annual_payments` pour permettre une commande sans compte préalable : e-mail normalisé, empreinte du propriétaire, versions/contenus juridiques acceptés, état de préparation, outbox chiffrée, reçu d’envoi et initialisation du mot de passe.
- Ajoute `annual_activation_grants`, inaccessible aux clients, avec empreinte du token, échéance d’une heure et consommation unique.
- Ajoute trois fonctions réservées à `service_role` : `reserve_guest_annual_checkout`, `annual_auth_identity`, `bind_guest_annual_payment`.
- Les commandes avant paiement ont `account_id` et `auth_user_id` nuls. Le webhook crée l’identité Auth puis la fonction SQL associe/crée le profil et reprend les dates du paiement en une transaction.
- Aucun rôle existant, mot de passe existant, réponse, projet, module, exercice ou version ADMIN n’est réécrit.
- Les droits commencent au `event.created` du premier événement signé payé accepté et expirent exactement 31 536 000 secondes plus tard. Un rejeu ne prolonge pas cette durée.
- La migration annuelle précédente neutralise les anciennes fonctions de suppression à expiration ; conserver cette protection et ne pas réactiver un ancien worker de suppression.

Les acceptations avant paiement sont conservées dans `annual_payments.terms_snapshot` avec les documents publiés complets et leur date d’acceptation, indépendamment des futurs changements éditoriaux. Le système ADMIN de brouillon/publication juridique reste inchangé. Vérifier que les CGV publiées décrivent bien l’offre **55 € / 365 jours**, avant d’ouvrir les paiements ; aucun ancien texte publié n’a été réécrit automatiquement.

## Variables Vercel

Configurer les variables dans le bon périmètre Vercel. Ne jamais mettre une clé secrète dans une variable `NEXT_PUBLIC_*`.

| Variable | Valeur attendue |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Origine exacte du déploiement testé, puis domaine de production après validation. L’origine Checkout doit correspondre à celle des liens d’activation. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase de cet environnement. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique du même projet. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé serveur du même projet. |
| `STRIPE_MODE` | `test` en Preview/recette ; `live` uniquement après validation. |
| `STRIPE_SECRET_KEY` | Clé `sk_test_…` en recette, puis clé LIVE dédiée. |
| `STRIPE_PRICE_ID` | Prix Stripe actif, paiement unique, 5 200 centimes, EUR, TVA incluse ou prix final sans taxe supplémentaire. |
| `STRIPE_WEBHOOK_SECRET` | Secret `whsec_…` de l’endpoint de cet environnement. |
| `STRIPE_TEST_SUPABASE_PROJECT_REF` | Référence du projet Supabase TEST. |
| `STRIPE_LIVE_SUPABASE_PROJECT_REF` | Référence du projet de production, différente de TEST. Requise aussi en TEST pour contrôler la séparation. |
| `STRIPE_LIVE_PAYMENTS_APPROVED` | Absent pendant la recette. `yes` uniquement après accord explicite pour LIVE. |
| `ANNUAL_ACTIVATION_ENCRYPTION_KEY` | **Nouvelle variable serveur** : 32 octets aléatoires encodés en base64, distincts par environnement. Génération locale : `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. Stocker directement dans le gestionnaire de secrets. Ne pas changer sans traiter les outboxes chiffrées en attente. |
| `BREVO_API_KEY` | Clé du service transactionnel existant. |
| `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | Expéditeur vérifié ; nom conseillé : Brand Studio X TyASH. |
| `BREVO_REPLY_TO_EMAIL` / `BREVO_REPLY_TO_NAME` | Facultatif, adresse de support. |

`VERCEL_ENV` est fourni par Vercel. Pour une recette locale, utiliser `development` et un Supabase de test. Les gardes existantes refusent TEST en production et LIVE hors production ou sans validation explicite.

## Supabase Auth et Brevo

- Activer le fournisseur e-mail/mot de passe. Vérifier une longueur minimale de mot de passe compatible avec les 8 caractères minimum du formulaire ; les règles plus strictes d’Auth restent prioritaires.
- Configurer le Site URL du projet TEST sur le domaine de recette. Conserver les URL de redirection légitimes existantes ; ne pas utiliser de wildcard général en production.
- Régler la durée des OTP e-mail à **3 600 secondes** pour correspondre à la limite applicative. Les liens restent limités par le premier des deux délais.
- Le compte initial est créé serveur sans mot de passe et sans confirmation artificielle de l’e-mail. `admin.generateLink(type: recovery)` génère le token ; **Brevo** envoie le message. L’action sur `/activer` échange le token via Supabase Auth avant l’écriture du mot de passe et conserve la session SSR.
- L’ouverture du lien seule ne connecte pas et ne consomme pas le token. Le formulaire protège également le changement contre une simple session navigateur sans lien valide.
- Ne pas modifier les mots de passe ou les rôles de Marine et Julien pour cette mise en place. Aucun e-mail d’activation de paiement ne doit leur être envoyé.
- Les resends sont limités par le bail persistant d’envoi (au moins deux minutes entre tentatives). L’API renvoie la même réponse avant de rechercher le compte, pour éviter la divulgation de son existence ou du temps de réponse fournisseur.
- Le reçu Brevo correspond à la prise en charge du message, pas à sa réception dans la boîte du destinataire. Vérifier SPF/DKIM, l’expéditeur autorisé et les journaux de délivrabilité pendant la recette.
- Une tentative interrompue reprend le même lien chiffré et la même clé d’idempotence tant que le payload est valable. L’idempotence du fournisseur a une durée limitée ; une panne ambiguë prolongée exige une vérification des journaux Brevo avant une reprise manuelle. Elle ne peut en aucun cas prolonger les droits.

## Stripe

Conserver l’endpoint existant `/api/stripe/webhook`, son corps brut et sa vérification de signature. Configurer en TEST les événements suivants :

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.refunded`
- `charge.dispute.created`

Conserver aussi les événements des anciens achats/subscriptions encore utilisés ; leur traitement historique n’est pas supprimé.

Créer un prix TEST **55 € EUR, paiement unique**, puis vérifier son comportement fiscal. Aucun abonnement, code promotionnel ou montant fourni par le navigateur n’est utilisé. Ne pas activer une taxe additionnelle qui ferait dépasser 55 € TTC.

Le Checkout reçoit l’e-mail enregistré et un identifiant de commande interne. La signature, le mode, le prix réel de la ligne, sa quantité, la devise, le montant, les métadonnées et l’e-mail serveur sont contrôlés avant association. La page de retour n’accorde aucun droit.

## Comptes existants et confidentialité

- Un utilisateur authentifié déjà actif est redirigé vers son espace ; un compte expiré conserve la politique existante sans renouvellement automatique.
- Un compte existant sans paiement peut être associé après paiement ; son profil, ses réponses et son mot de passe sont conservés. Si son mot de passe existe, le mail invite à se connecter, sans lien permettant de le remplacer.
- Un visiteur non connecté voit le même comportement Checkout quelle que soit l’existence du compte. Bloquer publiquement un achat sur la seule saisie d’une adresse révélerait cette existence. Le formulaire propose donc de se connecter **avant tout nouvel achat**.
- Si un visiteur achète malgré un accès déjà actif, expiré, inactif ou administrateur, la commande payée passe en **revue support** (`existing_access`, `expired_access` ou `inactive_account`). Aucun droit ni mot de passe existant n’est modifié. Cette situation nécessite une vérification et, le cas échéant, un remboursement manuel dans Stripe ; aucun remboursement réel automatique n’est déclenché.
- Une même session et une même commande sont réutilisées lors des reprises depuis le même navigateur. Un autre navigateur n’obtient pas la session privée existante. Deux achats payés pour la même identité ne peuvent pas cumuler/prolonger les droits.

## Recette complète à exécuter en TEST

Préparer un déploiement Preview et un Supabase TEST distinct, appliquer les migrations en ordre, publier les CGU/CGV validées pour cette offre, configurer les variables, le prix et le webhook. Utiliser uniquement des adresses de recette dont on contrôle la boîte e-mail. Ne pas utiliser les comptes clients réels.

| Nº | Vérification | Résultat attendu |
| --- | --- | --- |
| 1 | Ouvrir `/register` en navigation privée ; saisir un e-mail invalide, puis une adresse valide avec espaces/majuscules. | Aucun mot de passe/nom/entreprise demandé ; e-mail normalisé côté serveur. CGU/CGV requises. Aucun compte créé avant paiement. |
| 2 | Accepter les conditions puis continuer ; répéter rapidement la soumission. | Checkout Stripe TEST, 55 € TTC, une seule session pour la commande et la tentative ; aucun secret dans le navigateur. |
| 3 | Payer avec la carte TEST `4242 4242 4242 4242`, date future et CVC de test. | Paiement unique sans abonnement. Ne jamais utiliser une carte réelle. |
| 4 | Consulter l’événement dans Stripe et livrer un événement à signature invalide au endpoint de recette. | Paiement confirmé signé traité ; signature invalide rejetée sans droits. |
| 5 | Comparer Auth et profils avant/après le webhook. | Un seul utilisateur Auth et un seul profil non administrateur, associés à l’e-mail du registre. |
| 6 | Comparer `paid_at`, `expires_at` et les dates du profil. | Écart exactement 31 536 000 secondes ; droits ouverts uniquement après paiement. |
| 7 | Consulter la boîte de recette et les journaux Brevo. | Objet et contenu de bienvenue demandés, lien individuel ; aucun mot de passe envoyé. Reçu enregistré avant l’annonce sur la confirmation. |
| 8 | Ouvrir le lien sur un autre appareil, puis le soumettre. | Page `/activer` co-brandée ; Auth vérifie le token lors de la soumission, aucun GET ne le consomme. |
| 9 | Soumettre des mots de passe différents, trop courts, puis valides. | Erreurs lisibles, puis enregistrement via Supabase Auth. |
| 10 | Se déconnecter puis se connecter avec le mot de passe défini. | Connexion normale à l’identité payée, sans création de doublon. |
| 11 | Ouvrir le dashboard, un exercice et le carnet PDF. | Fonctionnalités payantes disponibles, données sauvegardées et inchangées. |
| 12 | Abandonner un autre Checkout, puis réessayer. | Message d’abandon ; aucun compte/droit créé. Reprise de la session ouverte ou nouvelle tentative seulement après expiration confirmée par Stripe. |
| 13 | Expirer un grant **dans TEST seulement** ou attendre une heure, puis soumettre son lien. | Mot de passe inchangé, aucun accès ajouté ; proposition de renvoi. Rejouer un lien déjà consommé : refus. |
| 14 | Demander un renvoi pour une adresse payée, inconnue, malformée puis répétée rapidement. | Même réponse publique ; seul l’accès éligible reçoit un lien, avec cooldown ; aucun compte créé par le renvoi. |
| 15 | Tester séparément compte sans paiement, compte actif connecté, actif non connecté, expiré et inactif. | Sans paiement : association et données conservées. Actif connecté : achat évité. Autres achats incompatibles : revue support, aucun changement de droits/mot de passe. Ne pas révéler publiquement l’existence du compte. |
| 16 | Rejouer le même événement signé, y compris après activation ; simuler une panne DB ou Brevo puis relivrer après le bail. | Même compte/transaction/dates ; aucun cumul ; reprise de l’étape manquante. Vérifier aussi deux événements concurrents et deux navigateurs pour la même adresse. |
| 17 | Visiter directement le retour de succès et `/mon-espace` sans paiement ; appeler les tables avec anon/JWT impayé. | Aucune activation sur retour navigateur, aucune lecture payante ; ledger/grants/fonctions sensibles interdits aux clients. |
| 18 | Vérifier Marine et Julien, avant/après paiement simulé, remboursement, contestation et expiration d’un compte de recette. | Administrateurs inchangés et permanents ; droits clients suspendus/expirés sans suppression de réponses, projet ou compte. |

Contrôler également les états asynchrones, le webhook arrivé avant la page de retour, le retour sans cookie propriétaire, un e-mail modifié dans Checkout et l’échec d’envoi après création Auth. La confirmation doit attendre tant que le compte ou le reçu Brevo manque.

## Vérifications locales et exploitation

Résultats locaux : **89 fichiers / 528 tests réussis** ; lint des fichiers modifiés et build de production avec TypeScript réussis. Contrôles navigateur sur `/register`, `/activer` et le formulaire de renvoi : **24 combinaisons** de largeur (320, 390, 768 et 1 440 px) et de thème clair/sombre, sans débordement horizontal ni texte coupé ; logos chargés et champ e-mail seul avant paiement. Captures et rapport dans `.runtime/tyash-guest-checkout/`. Les documents juridiques publiés requis sont absents de l’environnement utilisé pour le rendu : le bouton de paiement y est correctement désactivé.

Commandes :

```text
npx vitest run --testTimeout=20000 --maxWorkers=2
npx eslint <fichiers modifiés listés ci-dessus>
npm run build -- --webpack
```

Limiter les workers sur cette machine : les tests PDF/PostgreSQL peuvent dépasser leur délai si tous sont lancés en parallèle. Les tests SQL s’exécutent dans PGlite, sans connexion à Supabase distant.

En cas de préparation bloquée : rechercher la commande dans `annual_payments` côté serveur, vérifier `status`, `fulfillment_state`, `email_claim_until`, `email_message_id` et les événements Stripe. Relivrer le webhook original signé après correction de la panne. Ne pas écrire manuellement de nouveau `paid_at`, modifier un rôle ou réinitialiser un mot de passe existant pour débloquer une commande. Une réservation sans session après timeout ambigu doit être rapprochée dans Stripe avant toute nouvelle tentative.

Une fois les 18 scénarios TEST validés, faire valider la mise en production. Ne pas pousser sur `main` auparavant : ce dépôt déclenche automatiquement Vercel Production lors d’un push.

Références techniques : [fulfillment Stripe](https://docs.stripe.com/checkout/fulfillment), [génération de liens Supabase Auth](https://supabase.com/docs/reference/javascript/auth-admin-generatelink), [vérification OTP](https://supabase.com/docs/reference/javascript/auth-verifyotp), [envoi transactionnel Brevo](https://developers.brevo.com/reference/send-transac-email).
