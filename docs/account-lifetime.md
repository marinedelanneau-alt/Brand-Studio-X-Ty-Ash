# Durée des comptes et sauvegarde

La gestion actuelle des paiements est décrite dans [stripe-annual-access.md](./stripe-annual-access.md).

## Nouveaux accès payants

Les comptes créés avant paiement portent `annual_access_required = true`.
Ils n’obtiennent aucun droit payant avant confirmation du webhook Stripe.
L’accès coûte 55 € TTC, en paiement unique, pour exactement 365 jours à compter
de la confirmation. Les dates sont stockées en UTC. Aucun renouvellement
récurrent ou manuel n’est activé.

Les administrateurs autorisés par les rôles existants restent gratuits et
illimités. Les comptes de Marine et Julien ne sont pas modifiés par la
migration annuelle.

## Comptes historiques

La migration précédente `20261113180000_account_lifetime.sql` avait attribué
une année calendaire aux comptes historiques depuis sa première installation.
La nouvelle migration `20261117120000_tyash_annual_payments.sql` conserve ces
échéances pour les achats Stripe historiques enregistrés, sans les recalculer
ni réécrire ces achats. Les comptes ordinaires actifs sans achat enregistré,
y compris les accès offerts, passent au paiement annuel : leurs anciennes
dates sont effacées pour que leur première période commence au paiement.
Leurs identités, projets, réponses et fichiers sont conservés.

## Expiration et conservation

À l’échéance, les fonctionnalités payantes sont bloquées côté serveur, même
sans passage du cron. L’utilisateur peut toujours s’authentifier pour voir
la page `/acces-expire`. Son compte, ses réponses, ses projets, ses documents
et ses fichiers ne sont pas supprimés automatiquement. Les exports légaux
de données personnelles conservent leur parcours distinct.

La précédente logique de suppression à expiration est remplacée : le worker
applicatif ne supprime plus les identités Auth ni les fichiers ; la nouvelle
migration neutralise aussi les fonctions SQL de suppression afin qu’un ancien
worker ne puisse pas les utiliser après application de cette migration.
Les données déjà supprimées avant cette évolution ne peuvent pas être
restaurées par le code.

## Rappels et sauvegarde

Le cron authentifié `/api/cron/account-expiry` conserve les rappels un mois
calendaire et quatorze jours avant l’échéance, avec un texte indiquant la
conservation des données. Il conserve les garanties de réservation et de
non-réémission après accusé de réception du fournisseur.

L’espace utilisateur affiche un indicateur discret avec la date d’expiration.
La route `/api/account/backup` nécessite un accès actif et fournit une archive
ZIP des réponses enregistrées et des fichiers originaux. Les PDF du carnet
restent disponibles depuis leurs écrans pendant la période d’accès.

## Déploiement coordonné

Ne pas réinitialiser Supabase. Appliquer les migrations manquantes dans leur
ordre chronologique sur le projet TYASH voulu. Si l’ancien cron de suppression
est actif, le suspendre avant l’intervention, appliquer la migration de
conservation, déployer le nouveau code puis réactiver les rappels.

Aucune migration distante, aucun déploiement ni aucun e-mail réel n’est
exécuté par la modification de ces fichiers. Les variables, le webhook et
la recette de mise en service sont détaillés dans le guide Stripe.
