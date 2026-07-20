# Audit du versioning éditorial

## Architecture actuelle

- Contenu : `brand_modules`, `brand_submodules`, `module_exercises`.
- Réponses : `project_exercise_answers`, reliées aux IDs d'exercices avec suppression en cascade.
- Progression : `project_module_states`, reliée aux IDs de modules avec suppression en cascade.
- Brouillon admin : snapshot JSON `admin_module_draft` dans `brand_exports`.
- Publication : recréation des modules/exercices et remappage des réponses par ordre.
- Autorisation : booléen `is_admin`, contrôlé côté serveur.

## Risques identifiés

1. Une publication supprime les lignes éditoriales auxquelles les réponses sont rattachées.
2. Le remappage par position associe mal les réponses après ajout, déplacement ou suppression.
3. Les snapshots admin ne fournissent ni historique structuré, ni programmation atomique.
4. Le booléen historique ne représente pas un rôle extensible en base.
5. La progression est attachée à une version technique du module et non à son identité permanente.

## Stratégie retenue

La migration est additive et réversible. Elle conserve les tables historiques pendant la transition,
crée des identités permanentes, initialise une version publiée depuis l'existant et copie les réponses
vers `user_answers`. Aucun `DROP TABLE`, aucune suppression de réponse et aucune publication automatique
ne sont exécutés.
