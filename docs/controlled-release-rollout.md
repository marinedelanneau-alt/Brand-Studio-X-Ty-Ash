# Releases contrôlées — Brand Studio X Ty Ash

## Environnement Ty Ash

- Site de production : https://brand-studio-x-ty-ash.vercel.app.
- Projet Supabase : cplzwnlstcpqqzqeawgs.
- NEXT_PUBLIC_SITE_URL doit désigner le site Ty Ash.
- Les clés Supabase doivent appartenir à ce même projet et rester hors de Git.
- Aucun identifiant de déploiement Vercel n'est présumé : la baseline n'en contient pas tant qu'un identifiant Ty Ash réel n'a pas été vérifié.

## Baseline en lecture seule

Exécuter, avec des variables Ty Ash valides :

```powershell
node --env-file=.env.production.local scripts/verify-production-baseline.mjs
```

Le script refuse un project ref différent de celui de docs/production-baseline.json.
Il compare les nombres et empreintes des tables principales, inventorie les réponses
sans les modifier et vérifie que l'URL Ty Ash est accessible. Les éventuels identifiants
de commit et de déploiement sont informatifs, pas une preuve de la version déployée.
La baseline capture le contenu intermédiaire Ty Ash (3 modules, 15 sous-modules,
51 exercices), pas les anciens chiffres du Brand Studio original. Une évolution
volontaire de contenu nécessitera une nouvelle baseline revue ; ne pas la régénérer
pour masquer une différence inattendue.

## Avant activation de la publication contrôlée

Le code corrigé requiert CONTENT_RELEASE_READ_MODE=controlled et un snapshot officiel
valide, non vide. Il n'offre aucun retour automatique vers les tables historiques.
Ne pas activer ni déployer ce code tant que l'initialisation du contenu officiel
n'a pas été préparée et validée séparément. La V1 vide ne constitue pas une base valide.

Les brouillons brand_exports, copies Storage, anciennes versions et URL audio restent
conservés. Aucun import, remplacement de média ou amorçage de release n'est automatique.
Les notes vocales héritées peuvent encore dépendre du Storage original ; ce nettoyage
technique ne les copie pas et ne change pas leurs URL.

Les variables à vérifier lors d'une activation expressément autorisée sont :

```dotenv
NEXT_PUBLIC_SITE_URL=https://brand-studio-x-ty-ash.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://cplzwnlstcpqqzqeawgs.supabase.co
CONTENT_RELEASE_READ_MODE=controlled
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_ENABLE_ADMIN_DRAFT_PREVIEW=false
ENABLE_CONTROLLED_ADMIN_PUBLISHING=true
```

Voir docs/tyash-controlled-publication.md pour le fonctionnement du circuit.
Vérifier l'état des migrations avant toute action ; ne pas réappliquer une migration
historique ni réécrire son SQL pour remplacer une référence de projet.

## Recette et déploiement

Utiliser une base de recette isolée explicitement choisie pour Ty Ash, avec des données
de test. Aucun ancien projet Preview Brand Studio n'est imposé par cette procédure.
Tester sauvegarde privée, publication explicite, conservation des identifiants,
réponses et progressions avant toute activation. Tout commit, push, déploiement,
publication ou changement de variable distante exige l'autorisation correspondante.

Le retour à CONTENT_RELEASE_READ_MODE=legacy n'est pas compatible avec le code corrigé.
Un éventuel retour arrière doit être préparé et validé séparément ; ne supprimer aucune
release, réponse ou table pour revenir à une version antérieure.
