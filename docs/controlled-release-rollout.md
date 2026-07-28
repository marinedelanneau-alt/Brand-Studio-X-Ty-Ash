# Releases contrôlées Brand Studio

## Principe de sécurité

La production continue à lire les tables historiques tant que
`CONTENT_RELEASE_READ_MODE` n'est pas explicitement défini à `controlled`.
La migration `20260728140000_controlled_content_releases.sql` est additive :
elle ne supprime, ne renomme et ne met à jour aucune ligne de contenu ou de
réponse historique.

La migration n'est volontairement pas appliquée à la base de production dans
cette branche. Elle doit d'abord être validée sur un projet Supabase Preview
isolé, initialisé depuis une sauvegarde anonymisée ou contrôlée.

## Environnements

### Production

- branche autorisée : `main` uniquement ;
- URL : `https://brand-studio-new.vercel.app` ;
- `NEXT_PUBLIC_APP_ENV=production` ;
- `NEXT_PUBLIC_ENABLE_ADMIN_DRAFT_PREVIEW=false` ;
- `CONTENT_RELEASE_READ_MODE=legacy` jusqu'au basculement volontaire ;
- aucune commande `vercel --prod` depuis une branche feature.

### Preview Admin

- branche : `feature/*` puis `develop` ;
- projet Supabase distinct de la production ;
- `NEXT_PUBLIC_APP_ENV=preview` ;
- `NEXT_PUBLIC_ENABLE_ADMIN_DRAFT_PREVIEW=true` ;
- `CONTENT_RELEASE_READ_MODE=legacy` ;
- variables Supabase et clés Stripe/Brevo de test uniquement ;
- Vercel Deployment Protection activée ;
- application `noindex, nofollow` et refus des comptes non Admin.

Le projet Supabase Preview est nécessaire : tester des migrations, des RPC et
des brouillons dans la base des bêta-testeurs contredirait l'exigence de
non-impact. Il ne doit contenir aucune donnée sensible non nécessaire.

## Procédure progressive

1. Exécuter `node --env-file=.env.local scripts/verify-production-baseline.mjs`.
2. Créer une sauvegarde Supabase vérifiée.
3. Restaurer la sauvegarde dans le projet Supabase Preview.
4. Appliquer la migration uniquement au projet Preview.
5. Exécuter `supabase/verification/controlled_release_migration_report.sql`.
6. Vérifier que les trois empreintes de contenu historique correspondent à
   `docs/production-baseline.json`.
7. Configurer les variables Preview dans Vercel et activer Deployment Protection.
8. Déployer la branche sans `--prod`.
9. Tester les scénarios Admin, non-Admin, réponses de test, PDF et Guide de Marque.
10. Rejouer le test de baseline contre la production : les empreintes doivent
    rester identiques.
11. Après validation seulement, préparer une fenêtre de migration production.
12. Appliquer la migration additive, conserver `CONTENT_RELEASE_READ_MODE=legacy`
    et vérifier à nouveau la baseline.
13. Créer et valider un brouillon sans publication : les bêta-testeurs doivent
    toujours lire les tables historiques.
14. Le basculement vers `controlled` nécessite une décision distincte, une PR
    vers `main`, un plan de retour à `legacy` et une validation explicite.

## Retour arrière

Avant le basculement, le retour arrière consiste uniquement à garder ou remettre
`CONTENT_RELEASE_READ_MODE=legacy`. Les nouvelles tables peuvent rester en place
sans influencer l'application publiée. Elles ne doivent pas être supprimées tant
qu'un historique ou un brouillon les référence.

Après le basculement, remettre `CONTENT_RELEASE_READ_MODE=legacy` restaure
immédiatement la lecture historique sans supprimer les nouvelles releases.

## Publication de contenu

1. Créer un brouillon depuis la release publiée.
2. Modifier via l'éditeur Admin : chaque sauvegarde synchronise uniquement le
   snapshot du brouillon courant.
3. Prévisualiser avec les réponses Admin existantes ou avec un jeu de test isolé.
4. Comparer publié et brouillon.
5. Saisir les notes et marquer la release comme prête.
6. La production reste inchangée.
7. Saisir exactement `PUBLIER POUR TOUS` pour appeler la RPC atomique.

La publication archive l'ancienne release et change le pointeur
`published_release_id` dans une transaction. Elle ne déploie jamais du code.

## Workflow Git et Vercel

```text
feature/* -> Pull Request vers develop -> Vercel Preview protégé
          -> validation Admin -> Pull Request contrôlée vers main
          -> déploiement production volontaire
```

Les protections à configurer manuellement :

- GitHub : protection de `main`, PR obligatoire, checks obligatoires, interdiction
  des pushes directs ;
- Vercel : Production Branch = `main`, Deployment Protection sur Preview,
  variables séparées par environnement ;
- supprimer l'autorisation opérationnelle d'utiliser `vercel --prod` depuis une
  branche non `main`.
