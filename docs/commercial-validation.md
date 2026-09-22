# Rapport de validation locale — 22 septembre 2026

## Résultats

| Vérification | Résultat |
| --- | --- |
| `npx vitest run` | 26 fichiers, 157 tests réussis |
| `npm run test:editorial` | 10 tests réussis |
| `npx tsc --noEmit` | Réussi ; TypeScript également réussi dans la compilation finale |
| `npm run lint` | 0 erreur, 12 avertissements dans les fichiers historiques non modifiés `app/debug/modules/page.tsx`, `app/ui/module-answer-form.tsx`, `lib/training.ts` |
| `npm run build` | Compilation optimisée Next.js 16.2.1 réussie, 29 pages statiques générées |
| `npm run test:brand-guide-visual` | 17 scénarios, 189 pages générées ; inspection ponctuelle d'une page, pas une revue humaine exhaustive |
| HTTP local, nouveau checkout désactivé | POST `/api/stripe/create-brand-studio-order` : 404 |
| HTTP local, droits désactivés | GET `/api/privacy/export` et POST `/api/privacy/withdrawal` : 404 |
| Secrets client | 36 fichiers JS/HTML/JSON dans `.next/static` inspectés : aucun secret factice serveur ni nom de clé privilégiée Stripe/Supabase détecté |
| `git diff --check` | Aucune erreur de contenu ; avertissements de conversion LF/CRLF propres au dépôt |

Les sorties PDF générées par les tests ont été remises à leur état Git initial pour éviter des modifications binaires sans rapport avec la livraison. Le rapport de génération local a été conservé sous `.runtime/commercial-validation/brand-guide-report.json`.

## Scénarios ajoutés et vérifiés

- Plans historiques : autorisation conservée même avec une ancienne date ou sans date ; aucune écriture lors du contrôle d'accès.
- Inscription historique : aucune nouvelle acceptation obligatoire, aucune consultation de commande commerciale, aucune nouvelle échéance.
- Nouveau paiement : pas d'échéance avant paiement ; refus des paiements gratuits/non validés, mauvais prix et consentement absent.
- Douze mois calendaires, borne exacte d'expiration, année bissextile ; inscription tardive ne prolongeant pas l'achat.
- Rejeu séquentiel et concurrence du webhook : même commande, récupération du code unique, date initiale inchangée. Reprise après échec Brevo sans seconde activation.
- Achat d'un compte préexistant bloqué avant checkout ; activation commerciale ne rattachant pas un compte bêta.
- Code commercial sans commande payée refusé ; anciennes notifications Stripe ne supprimant pas la limite commerciale.
- Activation juridique ne soumettant pas les comptes bêta à une nouvelle barrière de CGU.
- Flags séparés, blocage des documents incomplets, des paiements réels non approuvés, des consentements absents ou d'une version CGV obsolète.
- Échec d'enregistrement de la preuve : expiration de la session Stripe avant remise de son URL.
- Export authentifié limité au compte et sans identifiants d'accès.
- Confirmation contractuelle incluant les textes enregistrés à la commande.
- Rétractation sans compte : confirmation explicite, correspondance e-mail/référence, accusé horodaté, reprise après échec d'e-mail et déclaration unique sans modification d'accès.

## Ce que ces résultats ne prouvent pas

Stripe, Supabase et Brevo sont simulés dans les tests fonctionnels. Les index, politiques RLS et triggers doivent être validés sur PostgreSQL dans un projet de test isolé. Aucune migration distante n'a été exécutée, aucun paiement ou e-mail réel envoyé. La réception effective des pièces jointes, la configuration fiscale et les URL publiques restent à vérifier manuellement.

Le build et le serveur local ont utilisé des identifiants factices, les flags désactivés et `http://127.0.0.1:9` pour Supabase. Les paramètres persistants et la production n'ont pas été changés. Aucun déploiement ni push Git n'a été effectué.

## Risques à traiter dans la recette et l'exploitation

- Une panne après acceptation d'un e-mail par Brevo mais avant l'écriture de son statut peut occasionner un second e-mail. Les commandes et activations ont leurs contraintes d'unicité distinctes.
- L'inscription utilise plusieurs opérations Auth/base : une panne partielle peut exiger une récupération par le support. Tester ce cas sur des comptes synthétiques avant ouverture et documenter la reprise sans supprimer de données historiques.
- Les remboursements et leur effet sur l'accès restent manuels ; surveiller les rétractations quotidiennement.
- Le checkout historique est conservé : vérifier les points d'entrée commerciaux publics pour éviter un achat de la nouvelle offre par l'ancien parcours.
- Les durées non définies ne déclenchent aucune purge ; elles doivent être fixées avec leur procédure opérationnelle.

Procédures détaillées : [commercial-activation.md](commercial-activation.md).

PRÊT À ÊTRE ACTIVÉ : NON — textes et informations à valider, recette des services et migrations en environnement isolé, configuration de production et parcours public à finaliser, puis accord explicite de déploiement/activation.
