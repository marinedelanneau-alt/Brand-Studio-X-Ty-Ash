# Persistance hors ligne des réponses

## Flux de données

Chaque changement utilisateur suit ce flux : interface React → transaction IndexedDB immédiate → mutation persistante → synchronisation Supabase différée. Supabase refuse une mutation plus ancienne selon `client_updated_at`, puis `client_revision` en cas d'égalité.

IndexedDB contient les réponses courantes, la mutation la plus récente en attente pour chaque exercice et cinq versions historiques. Un champ vide ne devient une suppression que lorsqu'une interaction utilisateur l'a explicitement vidé.

## Vérifications automatiques

```powershell
npm run test:persistence
npx tsc --noEmit
npm run lint -- --quiet
npm run build
```

## Vérifications manuelles

### Actualisation et fermeture brutale

1. Ouvrir un module et saisir une phrase identifiable.
2. Actualiser immédiatement la page, puis vérifier que la phrase réapparaît.
3. Modifier la phrase, fermer l'onglet immédiatement et rouvrir le même module.
4. Vérifier que la dernière version est visible.

### Mode hors ligne et reconnexion

1. Dans les outils développeur du navigateur, onglet Réseau, activer `Offline`.
2. Modifier plusieurs champs et naviguer entre les questions.
3. Vérifier l'indicateur « Hors ligne » et actualiser la page : les réponses doivent rester présentes.
4. Rétablir `Online`, attendre l'état « Synchronisé », puis ouvrir une session sur un autre appareil ou dans un profil de navigateur distinct.
5. Vérifier que les réponses synchronisées y sont visibles.

### Réseau lent et erreur Supabase

1. Sélectionner un débit `Slow 3G` et saisir rapidement dans plusieurs champs.
2. Vérifier que l'interface reste fluide et que la file finit par se synchroniser.
3. Bloquer temporairement les requêtes Supabase, modifier une réponse, puis lever le blocage.
4. Vérifier que « Réessayer » fonctionne et que la valeur locale n'a jamais disparu.

### Deux onglets

1. Ouvrir le même module dans deux onglets du même navigateur.
2. Modifier une réponse dans le premier onglet.
3. Vérifier que le second onglet reçoit la nouvelle valeur sans actualisation.
4. Modifier ensuite le même champ dans le second onglet et vérifier que la version la plus récente gagne dans les deux onglets.

### Suppression volontaire et historique

1. Enregistrer une réponse, la recharger, puis effacer manuellement tout son contenu.
2. Vérifier après actualisation que le champ reste vide.
3. Vérifier qu'un simple chargement d'un champ vide ne supprime jamais une réponse existante.

### Déploiement d'un module

1. Saisir et synchroniser des réponses sur un compte de test.
2. Publier une modification de contenu depuis l'administration sans réinitialiser les réponses.
3. Revenir sur le compte et vérifier les réponses, la progression et les modules terminés.

