# Introduction proposée — Ce qui vous anime

Statut : texte préparé localement, non enregistré dans une release et non publié.

Projet : Brand Studio X Ty Ash, module 1, sous-module 2.

## Contenu à renseigner

Dans le champ « Contenu » du sous-module :

> Ce que vous faites compte. Mais ce qui vous pousse à le faire en dit encore plus sur votre marque. Allons chercher ce qui vous anime vraiment.

Valeur HTML correspondante pour `content_html` :

```html
<p>Ce que vous faites compte. Mais ce qui vous pousse à le faire en dit encore plus sur votre marque. Allons chercher ce qui vous anime vraiment.</p>
```

## Architecture existante

- `BrandSubmodule.content_html` existe dans `lib/training-types.ts`.
- L’éditeur du sous-module expose ce champ via « Contenu » dans `app/ui/admin-module-editor.tsx`.
- `app/ui/module-submodule-viewer.tsx` affiche déjà ce contenu sous le titre, avant le bouton de démarrage des exercices, avec les styles `module-content` et les couleurs du thème.
- Le modèle local `content/tyash-v1/pathway.json` contient actuellement une chaîne vide pour ce sous-module. Il n’a pas été modifié.
- L’enregistrement Admin passe par `saveAdminReleaseModules` : renseigner le champ modifierait donc une release de travail.

Aucune évolution du schéma ni migration Supabase n’est nécessaire. Aucun texte de remplacement spécifique à ce sous-module ne doit être ajouté au composant.

## Suite nécessaire

Autoriser explicitement l’enregistrement de ce seul champ dans le brouillon pédagogique pour intégrer le texte au contenu administrable. Cet enregistrement reste distinct d’une publication. Sans cette autorisation, conserver ce document comme proposition locale.

Aucun exercice, réponse, identifiant, mécanisme de progression, release ou service distant n’a été modifié pour préparer ce document.
