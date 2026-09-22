# Mise en place juridique et protection des données

## État

Le code apporte les pages, des brouillons structurés, le versionnement existant, l’acceptation explicite des CGU, les liens permanents, un export authentifié et un circuit de demandes de droits. Ce travail ne certifie pas la conformité effective de l’exploitation. Les migrations et la configuration distante ne sont pas appliquées par cette modification.

Le nouveau parcours retourne 404 sans activation explicite, puis 503 si ses prérequis ne sont pas satisfaits. L'ancien parcours reste distinct. Les comptes historiques ne reçoivent aucune expiration. Procédure détaillée : [activation commerciale](commercial-activation.md).

## Finalisation et déploiement

1. Après revue manuelle, appliquer uniquement sur un environnement de validation isolé les migrations juridiques manquantes, puis `20260918100000_privacy_requests.sql`, `20260918110000_legal_acceptance_validation.sql` et `20260918120000_commercial_orders_v1.sql`. Vérifier les politiques et contraintes. Aucune migration distante ni mise en production n'est autorisée automatiquement.
2. Ouvrir `/admin/legal` et préparer les quatre brouillons. L’opération n’écrase pas les versions existantes. Les copies lisibles se trouvent dans `docs/legal-drafts/`.
3. Renseigner l’éditeur, les contacts, l’hébergeur, les offres et prix, le public B2B/B2C, les durées, le médiateur si applicable et les modalités de rétractation/résiliation. Valider les textes avec un professionnel du droit avant publication. Aucun contenu incomplet ne doit être rendu contractuel.
4. Vérifier les régions, transferts internationaux, contrats de sous-traitance et paramètres de conservation de Supabase, Stripe, Brevo, OpenAI et de l’hébergeur réellement utilisés. Examiner les médias externes pour les traceurs avant leur chargement ; l’absence de script marketing local ne garantit pas l’absence de traceurs tiers.
5. Publier les documents et configurer l’URL des CGV dans les paramètres publics Stripe pour le consentement obligatoire de Checkout. Vérifier une commande test, la preuve d’acceptation et la remise des documents sur support durable. La version CGV est enregistrée dans les métadonnées de session Stripe.
6. Le nouveau parcours est désactivé par défaut : `BRAND_STUDIO_LEGAL_RELEASE=enabled` est requis, et `BRAND_STUDIO_COMMERCIAL_RELEASE=enabled` est également nécessaire pour vendre. L'ancien aperçu administratif conserve son option Preview. Ne migrer aucun compte historique. Même après activation juridique, les comptes sans le plan commercial explicite sont exclus du nouveau contrôle des CGU.
7. Facultatif : définir un secret `LEGAL_IP_HASH_SALT` si une empreinte IP est nécessaire à la preuve. Sans secret, aucune empreinte IP n’est conservée par l’action d’acceptation.

## Exercice des droits et conservation

- Surveiller `/admin/privacy` quotidiennement et répondre à l’e-mail du compte après vérification proportionnée de l’identité. Les notifications par e-mail ne sont pas automatisées.
- L’export JSON contient le compte, le projet courant, ses réponses et les demandes. Il ne constitue pas à lui seul une réponse exhaustive au droit d’accès : fournir également, si demandés, fichiers, facturation, acceptations, archives et informations chez les prestataires.
- Les demandes d’effacement sont des demandes, pas des suppressions immédiates. Coordonner les projets, réponses, versions historiques, exports, stockage d’objets, comptes Auth, prestataires, factures et preuves contractuelles. L’ancienne table `legal_acceptances` interdit la suppression et référence Auth avec `restrict` : une procédure d’archivage/pseudonymisation et sa durée doivent être validées avant de supprimer un compte.
- Les copies locales/hors connexion et exports sur les appareils ne disparaissent pas avec le compte serveur. Prévenir l’utilisateur et prévoir une purge après synchronisation et fermeture du compte.
- Définir et appliquer une matrice de durées avec purge contrôlée et journalisée, y compris l’expiration des sauvegardes. Aucune durée ni purge automatique n’est inventée dans ce changement.
- `/retractation` permet désormais une déclaration sans compte pour une nouvelle commande payée, avec vérification de sa référence et de son e-mail, confirmation explicite et accusé par Brevo. Les déclarations sont visibles dans `/admin/privacy`. Le remboursement et son effet sur l'accès restent manuels après validation. La conformité du parcours, les modalités, exceptions et le formulaire type contractuel restent à valider juridiquement. Le formulaire RGPD authentifié ne remplace pas ce parcours.

## Registre initial à compléter

| Traitement | Finalité / base envisagée | Données | Prestataires à vérifier | Durée |
|---|---|---|---|---|
| Comptes, accès, projets | Exécution du contrat | Coordonnées, réponses, fichiers | Supabase, hébergeur | À définir |
| Paiement | Contrat et obligations comptables | Coordonnées, références de paiement, factures | Stripe | À définir selon obligations |
| Assistance IA | Fonction demandée dans le service | Extraits envoyés à l’assistant | OpenAI | À vérifier |
| E-mails de service | Exécution du contrat | E-mail, événements du compte | Brevo | À définir |
| Demandes de droits | Obligation légale | Identifiant, message, suivi | Supabase | À définir |
| Preuve contractuelle | Défense de droits / obligations applicables | Version, date, identifiant | Supabase, Stripe | À valider |

La prospection doit disposer de sa propre base légale et, lorsque requis, d’un consentement distinct non précoché et d’une désinscription effective. Ne pas utiliser les comptes créés comme liste de consentements marketing.

## Sécurité opérationnelle

Limiter les comptes administrateurs, activer leur MFA, ne jamais exposer la clé service_role, vérifier les autorisations côté serveur et les politiques RLS/Storage, tester les restaurations et documenter les incidents. Les en-têtes HTTP ajoutés ne remplacent pas un audit de sécurité complet. En cas de violation, qualifier le risque, conserver les faits et évaluer notification CNIL sous 72 heures et information des personnes selon les conditions applicables.

## Références consultées

- https://www.cnil.fr/fr/informer-les-personnes
- https://www.cnil.fr/fr/passer-laction/les-droits-des-personnes-sur-leurs-donnees
- https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/comment-mettre-mon-site-web-en-conformite
- https://www.cnil.fr/fr/communication-electronique-quelles-regles
- https://www.economie.gouv.fr/dgccrf/les-fiches-pratiques/e-commerce-les-regles-entre-professionnels-et-consommateurs
