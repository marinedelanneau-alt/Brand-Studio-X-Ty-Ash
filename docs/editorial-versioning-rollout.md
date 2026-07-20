# Déploiement progressif

1. Sauvegarder la base Supabase et exécuter le rapport de vérification pré-migration.
2. Appliquer `20260720190000_editorial_versioning.sql` sur un environnement de préproduction.
3. Exécuter `editorial_migration_report.sql` : tous les compteurs doivent être à zéro.
4. Tester un compte admin et deux comptes clients avec des réponses différentes.
5. Activer les lectures versionnées module par module, avec retour possible aux tables historiques.
6. Activer les écritures doubles vers `user_answers`, puis vérifier les volumes et propriétaires.
7. Basculer la publication vers `publish_module_version` seulement après validation fonctionnelle.
8. Configurer `CRON_SECRET`, puis déclencher chaque minute le point d'entrée sécurisé
   `/api/cron/publish-scheduled` depuis Supabase Cron. L'offre Vercel Hobby du projet
   n'autorise pas une fréquence suffisante pour une publication à l'heure demandée.

Les tables historiques ne doivent être supprimées qu'après une période d'observation et une
sauvegarde vérifiée. Cette livraison ne les supprime pas.
