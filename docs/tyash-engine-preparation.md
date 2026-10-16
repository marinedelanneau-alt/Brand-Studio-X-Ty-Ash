# Préparation du moteur Ty Ash

Cette étape modifie uniquement le code local. Aucun contenu, brouillon, identifiant
en base ou release n'est créé. Le snapshot officiel vide reste inchangé.

## Identité des réponses

Les modules dont la stableKey commence par `tyash_v1_` utilisent exclusivement
le projet, la stableKey du module et celle de l'exercice pour associer les réponses.
Les recherches par position, les réponses numériques historiques, les anciens
backups et cookies de complétion ne sont pas repris pour ces modules.

Les contenus historiques conservent leurs chemins de compatibilité. Les sauvegardes
Ty Ash n'écrivent pas dans les backups positionnels ou les tables de réponses historiques.
Les mutations de synchronisation et formulaires portent les identités attendues ;
le serveur refuse une identité devenue différente.

LocalStorage et sessionStorage utilisent une enveloppe dédiée au projet/module,
indexée par stableKey d'exercice. IndexedDB utilise des clés dédiées et filtre aussi
les identités enregistrées. Les anciens enregistrements ne sont ni migrés ni effacés.
Les lectures de consultation/export admin suivent le contenu officiel et ces mêmes
associations. Les PDF générés depuis le workspace reçoivent les réponses filtrées.
Les anciens guides enregistrés restent des documents historiques.

## Facultatif

La propriété JSON optionnelle `completion` est conservée dans le snapshot :

```json
{
  "required": true,
  "optionalFields": [1],
  "optionalRows": [],
  "optionalCells": []
}
```

Cet exemple décrit uniquement le format ; ce n'est pas un contenu à injecter.
Les index commencent à zéro. `optionalFields` s'applique aux champs group_open
ou aux blocs d'un tableau ; `optionalRows` et `optionalCells` aux tableaux.
Une cellule utilise l'index ligne × nombre de colonnes + colonne.
Une ligne facultative rend toutes ses cellules facultatives.

Sans métadonnée, les règles historiques restent inchangées. `required: false`
exclut l'exercice du dénominateur de progression. Un exercice obligatoire est terminé
lorsque tous ses champs/cellules obligatoires sont renseignés. La règle est partagée
par l'interface et le serveur. Une validation manuelle Ty Ash ne contourne pas les
réponses obligatoires manquantes.

Aucune migration Supabase n'est nécessaire : les snapshots sont JSON et les clés
de user_answers sont déjà textuelles. Les métadonnées sont validées et conservées
par l'éditeur, mais aucun snapshot n'est écrit pendant cette préparation.

## Identités numériques futures

`allocateReleaseNumericIdentities` est une fonction pure non appelée par le circuit
de publication. Lors de la future préparation, lui fournir les éléments nouveaux
avec leurs stableKeys et tous les snapshots conservés nécessaires pour réserver les IDs.
Les snapshots historiques doivent être normalisés avec leurs identités existantes.

La fonction réserve les anciens IDs, attribue de nouveaux IDs négatifs uniques,
établit les relations et préserve les IDs des stableKeys déjà connues. Le résultat
devra être enregistré explicitement dans le futur brouillon pour garder les mêmes
IDs après publication. Une nouvelle clé ne peut pas reprendre arbitrairement un ID.
Cette fonction ne remplace pas le contrôle de concurrence de la future sauvegarde.

## Limite avant création

Le moteur est préparé, mais le circuit admin exige toujours un snapshot officiel
valide. La préparation d'un nouveau brouillon indépendant puis l'amorçage du système
doivent être définis et autorisés séparément. Ne pas modifier la V1 vide pour contourner
cette limite et ne pas importer automatiquement les anciennes réponses ou contenus.
