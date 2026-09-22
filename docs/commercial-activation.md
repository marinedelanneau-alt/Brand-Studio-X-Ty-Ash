# Activation commerciale — procédure manuelle

État : NON prêt à être activé tant que les validations ci-dessous ne sont pas terminées. Aucun déploiement, push Git, envoi réel, changement de configuration distante ou migration distante n'a été exécuté pendant cette reprise.

## Architecture et protection des bêta-testeurs

- Les modifications déjà présentes sont conservées, notamment les corrections des synthèses et PDF.
- Offre préparée : 289 EUR, paiement unique, 12 mois calendaires depuis l'événement Stripe confirmant le paiement, aucun renouvellement automatique. Le 29 février est ramené au 28 février l'année suivante.
- Seul le plan `brand-studio-289-12m-v1` est soumis à l'expiration. Aucun calcul rétroactif pour les autres plans, aucune purge ni modification des réponses.
- Le checkout commercial refuse les comptes existants avant paiement. Les renouvellements et conversions de bêta-testeurs ne sont pas ouverts.
- La commande est enregistrée sans échéance avant paiement ; le webhook fixe une seule fois `paid_at` et `expires_at`. Clé primaire de session, unicité de l'événement et index unique des activations commerciales empêchent les doublons lors des rejeux.
- Une fermeture des nouvelles ventes n'abandonne pas les commandes déjà payées : webhook et inscription continuent à utiliser leur preuve et leur échéance. Une activation commerciale ne peut pas devenir un ancien accès illimité.
- Les e-mails commerciaux contiennent une pièce jointe texte avec la commande, l'échéance et les quatre documents enregistrés à l'achat. L'e-mail historique conserve son contenu.
- Le parcours historique reste accessible. Avant ouverture publique, examiner ses liens d'acquisition pour que la nouvelle offre ne soit pas vendue via cet ancien checkout. Ne pas remplacer l'inscription bêta.

## 1. Informations et documents à finaliser

1. Confirmer l'identité présente dans le code : Marine DELANNEAU, entrepreneur individuel, SIREN 880 074 497, contact@marined-communication.fr ; compléter adresse professionnelle, téléphone et informations d'immatriculation applicables.
2. Confirmer la TVA et que 289 EUR est bien le total payé. Définir les territoires de vente et le public B2B/B2C.
3. Confirmer les fonctionnalités, compatibilité, assistance, garanties, accès après échéance et récupération des exports. Les données ne sont pas supprimées à l'expiration.
4. Faire valider la qualification du service et le mode d'exécution immédiate sans renonciation automatique. Si le juriste choisit une autre qualification, adapter le texte et le parcours avant activation.
5. Compléter médiateur si applicable, réclamations, rétractation, formulaire type, traitement des remboursements et fin d'accès. Faire vérifier `/retractation`, son accusé et la confirmation contractuelle.
6. Documenter hébergeur, régions, sous-traitants, transferts, cookies/médias tiers et durées de conservation. Faire valider la matrice dans `lib/retention-policy.ts` ; aucune purge automatique n'est installée.
7. Dans l'environnement de validation, ouvrir `/admin/legal`, préparer les brouillons, compléter puis publier les quatre textes approuvés. Les marqueurs incomplets bloquent la publication, mais leur absence ne remplace pas la validation juridique. Garder l'application globale des CGU désactivée.

## 2. Supabase — validation isolée, puis production seulement sur accord

1. Créer un projet de validation distinct, avec des comptes et données synthétiques ; ne pas connecter une Preview à la base bêta.
2. Vérifier l'historique des migrations. La migration juridique de base est `20260729100000_legal_documents.sql`. Ne pas relancer aveuglément toutes les migrations du dépôt.
3. Faire relire les trois migrations `20260918100000`, `20260918110000`, `20260918120000`. Elles ne mettent à jour ni comptes, ni abonnements, ni réponses existantes. La seconde ajoute un contrôle sur les nouvelles insertions d'acceptations.
4. Exécuter uniquement les migrations manquantes sur ce projet de validation, dans l'ordre, via SQL Editor. Ne jamais employer reset/drop/truncate ni une commande de migration globale visant la production.
5. Vérifier que `commercial_orders_v1`, `commercial_withdrawals_v1`, `privacy_requests` sont inaccessibles aux rôles anon/authenticated et accessibles seulement au serveur. Vérifier RLS/Storage des autres tables séparément.
6. Vérifier la clé primaire des commandes, l'unicité `payment_event_id` et l'index partiel `activation_v1_unique_session`. Rejouer un webhook en parallèle et vérifier une seule activation et une échéance inchangée.
7. Créer un compte synthétique avec plan historique et ancienne date `current_period_end` : connexion, réponses, sauvegarde, export et accès doivent fonctionner comme avant. Aucun compte bêta réel ne sert de fixture.
8. Pour la production, obtenir d'abord l'accord explicite de la propriétaire, sauvegarder et vérifier la restauration, comparer le schéma, puis préparer une intervention limitée aux migrations relues. Aucun SQL de backfill d'expiration n'est nécessaire.

## 3. Stripe — mode test d'abord

1. Ouvrir un environnement de test Stripe.
2. Créer un prix dédié Brand Studio de 289 EUR, ponctuel, sans récurrence. Choisir le traitement fiscal conforme à la validation comptable ; ne pas ajouter de taxe qui changerait le total attendu de 289 EUR.
3. Copier son identifiant dans `STRIPE_BRAND_STUDIO_PRICE_ID` de l'environnement de validation ; conserver `STRIPE_PRICE_ID` historique.
4. Configurer les coordonnées vendeur, l'URL des CGV et la politique de confidentialité accessibles sur le domaine de validation.
5. Configurer l'endpoint `/api/stripe/webhook` de validation avec les événements `checkout.session.completed` et `checkout.session.async_payment_succeeded`. Conserver les événements déjà nécessaires à l'ancien parcours. Utiliser le secret propre à cet endpoint dans `STRIPE_WEBHOOK_SECRET`.
6. Faire un achat test complet, vérifier le montant, les deux consentements, les instantanés contractuels, l'e-mail et l'inscription. Vérifier aussi abandon, refus et paiement non validé : aucun accès commercial ne doit être créé.
7. Renvoyer le même événement plusieurs fois, y compris simultanément : une commande, un code d'activation, mêmes dates. Vérifier la récupération après une panne temporaire d'e-mail.
8. Tester une rétractation sans compte ; vérifier la déclaration dans `/admin/privacy` et l'accusé Brevo. Exécuter un remboursement test manuellement dans Stripe. Le code ne rembourse et ne retire aucun accès automatiquement.
9. Avant l'ouverture réelle approuvée, recréer/vérifier le prix et les paramètres en mode réel. Ne pas remplacer un endpoint bêta ni ses secrets sans plan de transition validé.

## 4. Brevo

1. Vérifier le domaine d'envoi et l'expéditeur, les DNS SPF/DKIM et la réception des réponses sur le contact annoncé.
2. Configurer côté serveur `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, et si nécessaire `BREVO_REPLY_TO_EMAIL`/`BREVO_REPLY_TO_NAME`. Aucun préfixe NEXT_PUBLIC pour ces secrets.
3. Sur une boîte de test, contrôler la réception du lien d'inscription, la pièce jointe `confirmation-brand-studio.txt`, les quatre textes, le prix et l'échéance.
4. Tester l'accusé de rétractation, son contenu, son destinataire choisi, la date et l'heure. Simuler une panne, renvoyer la demande avec la même référence et vérifier qu'une seule déclaration subsiste.
5. Désigner la personne qui surveille les erreurs et demandes quotidiennement. Une panne après envoi et avant confirmation en base peut produire un doublon d'e-mail, jamais une seconde commande ou un second accès.
6. Ne pas importer les comptes dans une liste marketing au titre de leur inscription ou acceptation des CGU.

## 5. Vercel et activation explicite

1. Ne lancer aucun déploiement tant que la propriétaire ne l'a pas autorisé. Préparer une Preview isolée seulement après accord ; utiliser le Supabase de validation, Stripe test et une boîte d'e-mail de test.
2. Sans activation, laisser `BRAND_STUDIO_LEGAL_RELEASE` et `BRAND_STUDIO_COMMERCIAL_RELEASE` absents ou `disabled`, et `BRAND_STUDIO_LIVE_PAYMENTS_APPROVED` absent ou `no`.
3. Pour la recette autorisée uniquement : définir les deux premiers à `enabled`, `BRAND_STUDIO_WITHDRAWAL_MODE=service_immediate_validated` seulement après validation de ce mode, `BRAND_STUDIO_VAT_STATUS` à la description fiscale approuvée et `STRIPE_BRAND_STUDIO_PRICE_ID` au prix test.
4. Vérifier `NEXT_PUBLIC_SITE_URL` et `NEXT_PUBLIC_FORMATION_URL` : ils doivent désigner le même domaine cible, sans URL de production dans la Preview. Configurer aussi les URL Auth Supabase correspondantes.
5. Garder les clés Stripe/Supabase privilégiées/Brevo uniquement dans les variables serveur. Les seules clés Supabase publiques sont l'URL et la clé anon ; elles nécessitent RLS. Vérifier les droits d'accès aux variables Vercel.
6. Effectuer la recette complète ci-dessus, contrôler les journaux et faire valider les documents. Vérifier que le prix affiché, Stripe et les CGV concordent, et que l'ancienne acquisition publique ne contourne pas le nouveau parcours.
7. Seulement après accord explicite final : préparer la production avec ses identifiants, les deux flags à `enabled`, puis `BRAND_STUDIO_LIVE_PAYMENTS_APPROVED=yes`. Un déploiement contrôlé est nécessaire pour appliquer certaines configurations ; rien n'est exécuté automatiquement ici.
8. Retour arrière commercial : désactiver `BRAND_STUDIO_COMMERCIAL_RELEASE` et l'accord paiements réels, puis appliquer la configuration par une intervention approuvée. Conserver le juridique pour les commandes existantes. Ne supprimer aucune table, commande, activation ni donnée bêta.

## 6. Exploitation manuelle

1. Consulter `/admin/privacy` quotidiennement, distinguer demandes RGPD et rétractations commerciales.
2. Pour une rétractation : relever la commande et la date, vérifier les modalités applicables, effectuer le remboursement approuvé dans Stripe, puis consigner le traitement dans `commercial_withdrawals_v1.status` via Table Editor. Ne modifier l'accès que pour la commande commerciale concernée selon la procédure validée ; ne toucher à aucun accès historique.
3. Si l'accusé a échoué, demander le renvoi de la même déclaration ou envoyer manuellement un accusé contenant le texte et l'horodatage enregistrés. La référence unique empêche une nouvelle déclaration pour la même commande.
4. Pour les demandes de données : vérifier l'identité proportionnellement, compléter l'export avec les fichiers, preuves et facturation si nécessaire ; répondre, puis clôturer. Aucun effacement automatique n'est déclenché par le formulaire.
5. Avant tout effacement autorisé ultérieurement, valider les obligations d'archive et les références restrictives de `legal_acceptances`. Aucune suppression de compte bêta n'est incluse dans cette livraison.

## Limites de la validation locale

Les tests utilisent des doubles de Stripe, Supabase et Brevo. La compilation emploie des identifiants factices et une adresse Supabase locale inutilisable. Les migrations n'ont pas été exécutées sur PostgreSQL : leurs contraintes et RLS nécessitent la recette isolée. Aucun paiement, e-mail ni changement de données réels n'a été effectué. Les modifications visuelles antérieures des synthèses et PDF sont conservées ; leur génération locale ne change pas les réponses enregistrées.

## Références à faire examiner par le juriste

- [Rétractation en ligne, article L221-21](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053310520/2026-09-22).
- [Modalités de la fonctionnalité, article D221-5](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000053303365/2026-09-22).
- [CNIL : durées de conservation](https://cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees).

La validation du juriste doit porter sur l'offre réelle et la version des textes applicable au lancement. Ces références ne constituent pas une certification de conformité.
