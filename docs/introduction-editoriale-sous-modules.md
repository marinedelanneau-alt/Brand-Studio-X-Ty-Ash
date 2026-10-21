# Carte éditoriale d’introduction — préparation locale

Le composant `SubmoduleIntroduction` remplace le panneau blanc bordé par un fond rose discret et un filet bordeaux. Les couleurs suivent les thèmes clair et sombre. Sans contenu, aucun panneau vide n’est rendu.

Le champ existant `content_html` reste affiché sans réécriture. Le nouveau contrat de présentation optionnel `editorialIntroduction` permet un label, une accroche, des paragraphes et une transition. Aucune sélection par titre, position ou identifiant de sous-module n’a été ajoutée.

## Proposition « Ce qui vous anime »

Ces valeurs servent uniquement à la prévisualisation locale ; elles ne sont pas injectées dans le parcours publié.

```json
{
  "label": "L’ESSENCE DE VOTRE MARQUE",
  "headline": "Ce que vous faites raconte votre activité.\nCe qui vous anime raconte votre marque.",
  "paragraphs": [
    "Vos convictions, vos motivations, votre manière de faire… C’est souvent là que se cache ce qui vous rend vraiment différent.",
    "Dans ce sous-module, vous allez mettre des mots sur ce qui guide votre entreprise, parfois sans même vous en rendre compte."
  ],
  "transition": "{exercises} pour faire émerger ce qui vous anime vraiment."
}
```

`{exercises}` est remplacé par le nombre d’exercices répondables déjà calculé par le viewer, avec accord singulier/pluriel. La flèche est fournie par le composant.

## Administration à prévoir

L’Admin existant sait modifier le contenu riche historique, mais pas encore les quatre éléments séparément. `editorialIntroduction` est pour l’instant un contrat de présentation, pas un champ distant sauvegardé.

Pour activer l’édition structurée, prévoir les champs « Label éditorial », « Accroche », « Texte d’introduction » et « Transition » dans l’éditeur de sous-module ; transmettre ce même objet optionnel dans la conversion des données, la validation et la sauvegarde des snapshots. Le mécanisme de publication reste celui des brouillons existants. Les snapshots étant en JSON, une colonne Supabase supplémentaire n’est pas a priori nécessaire ; la compatibilité des validations SQL doit être vérifiée avant toute activation. Le repli sur `content_html` conserve les anciens contenus.

Aucun changement de schéma, de release, de données distantes, d’exercice, de réponse ou de progression n’a été effectué pour cette préparation. Aucun push ni déploiement.
