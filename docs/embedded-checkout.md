# Commande intégrée — accès plateforme à 50 €

La page `/commander` est indépendante des boutons et des deux parcours de paiement historiques. Elle utilise uniquement le tarif existant `price_1USuHRA2d51krBog8jNnci82` ; aucun produit ou tarif n’est créé. L’offre commerciale `brand-studio-289-12m-v1` reste inchangée.

## Configuration

- `STRIPE_SECRET_KEY` : serveur uniquement, compte Stripe contenant le tarif fourni.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` : clé publique du même compte et du même mode (test ou réel).
- `STRIPE_WEBHOOK_SECRET` : signature du webhook existant `/api/stripe/webhook`.
- Conserver les événements `checkout.session.completed` et `checkout.session.async_payment_succeeded`.

Le SDK serveur installé utilise `ui_mode: embedded_page`. Stripe.js monte le Checkout via `EmbeddedCheckoutProvider`. Les moyens de paiement restent pilotés par Stripe et les codes promotionnels restent autorisés comme dans le parcours général. Le serveur refuse un tarif différent de 50 EUR ponctuel, inactif ou explicitement hors taxes.

Le navigateur reçoit le client secret de la session, jamais la clé secrète Stripe. Le retour consulte Stripe côté serveur ; un cookie HttpOnly associe le retour au navigateur ayant préparé la commande. Aucune donnée personnelle de commande n’est affichée. Le webhook conserve sa vérification de signature et sa logique d’activation ; les nouvelles sessions ajoutent une vérification du tarif et enregistrent le bon Price ID dans les accès.

## Validation avant remplacement d’un bouton

Avec les clés et le tarif correspondants, vérifier : affichage desktop/mobile, codes promotionnels, carte acceptée/refusée, 3D Secure, abandon, retour à la commande, paiement différé si disponible, visite directe de la confirmation sans session et rejeu du webhook. Vérifier un seul lien d’activation par commande et l’accès au compte après inscription. Une page de confirmation ne doit jamais attribuer d’accès.

Ne pas créer un tarif test ou réel supplémentaire automatiquement. Si le tarif fourni est uniquement en mode réel, les scénarios de paiement test nécessitent un tarif test existant autorisé ; les mocks locaux ne remplacent pas cette validation Stripe. Ne remplacer aucun bouton avant cette recette.
