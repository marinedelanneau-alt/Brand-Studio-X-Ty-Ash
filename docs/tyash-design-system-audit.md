# Adaptation du design system Ty Ash Studio

État de référence : `b08bbc8`. Le répertoire était propre au début de l'intervention ; la précédente adaptation était déjà commitée. Comparaison historique également effectuée avec `dd79e58`, avant la recolorisation.

## Corrections

- Suppression des sélecteurs globaux `[class*="…"]` qui appliquaient à la fois texte, fond et bordure à un élément, y compris lorsqu'ils reconnaissaient simplement une classe `hover:` ou `focus:`.
- Migration des styles des pages et composants vers des variables par rôle. Les fonds pâles, textes d'accent, bordures, boutons et progressions n'utilisent plus indistinctement la couleur principale.
- Conservation de la composition, des espacements, des typographies et des animations existantes. Conservation des adaptations pertinentes de l'espace de travail déjà présentes dans les commits précédents.
- États hover, focus clavier, actif et désactivé des boutons principaux/secondaires. Les boutons désactivés utilisent un couple fond/texte dédié, sans dépendre d'une opacité qui rendrait leur texte illisible.
- Formulaires : texte, placeholder, bordure et focus distincts. La présence d'une classe de focus ne recolore plus le champ au repos.
- Transparences conservées sur les halos, ombres, cartes et bordures. Les reflets blancs deviennent plus discrets dans le thème sombre, sans supprimer les dégradés.
- Les panneaux intentionnellement clairs et les exports possèdent une palette locale claire, même dans le thème sombre. La sidebar admin possède une palette inverse locale. Les données de palette des utilisateurs restent inchangées.
- Les couleurs de succès, erreur et avertissement gardent leur signification ; seules leurs valeurs de texte sont adaptées au contraste. Les statuts à fond pastel conservent une palette locale claire.
- Styles de présentation des exports PDF et stories harmonisés. Aucun changement des données exportées.

## Palette

Les tokens existants ont été conservés et raccordés aux composants. Les variantes inutilisées ou contournées par des valeurs fixes sont désormais utilisées selon leur fonction.

| Token | Clair | Sombre |
| --- | --- | --- |
| `--tyash-primary` | `#7a2d46` | `#d998ab` |
| `--tyash-primary-hover` | `#652239` | `#e9b4c3` |
| `--tyash-primary-dark` | `#4a1d2d` | `#f7deea` |
| `--tyash-soft` | `#f5e4eb` | `#3d2b34` |
| `--tyash-soft-hover` | `#ecd4df` | `#503a47` |
| `--tyash-subtle` | `#fbf2f7` | `#2c2329` |
| `--tyash-ultra-light` | `#fffafc` | `#211d22` |
| `--tyash-border` | `#e8d1dc` | `#66505d` |
| `--tyash-label-bg` | prune à 8 % | rose à 10 % |
| `--tyash-label-text` | `#7a2d46` | `#edc4d1` |
| `--tyash-text-on-primary` | `#fffaf7` | `#201217` |
| `--tyash-focus-ring` | `#7a2d46` | `#e9b4c3` |

Tokens ajoutés :

- `--tyash-medium` : accent décoratif intermédiaire.
- `--tyash-progress-end` : deuxième extrémité du dégradé de progression, distincte de l'accent décoratif pour rester visible sur sa piste.
- `--tyash-on-dark-accent` : accent lisible sur une surface toujours sombre.
- `--tyash-action-gradient`, `--tyash-progress-gradient`, `--tyash-surface-gradient` : dégradés par fonction.
- `--tyash-glow-rgb`, `--tyash-highlight-rgb`, `--surface-highlight` : halos et reflets à opacité variable.
- `--tyash-selection` : sélection de texte.
- `--tyash-disabled-bg`, `--tyash-disabled-text` : éléments désactivés.
- `--input-border` : séparation visible des champs.
- `--status-success-text`, `--status-error-text`, `--status-warning-text` : textes fonctionnels qui restent verts, rouges et ambrés.

En clair, le fond crème `#fbf8f1` et les surfaces chaudes sont conservés. Le prune se concentre sur les actions et les textes d'accent ; les surfaces secondaires sont neutres ou rose très pâle.

En sombre, le fond `#19171c`, les surfaces `#242127`, les cartes `#2a242d` et les surfaces secondaires `#2d2830` construisent plusieurs niveaux. Les accents rose poudré portent un texte très sombre lorsqu'ils constituent un bouton plein ; les labels sur fond sombre utilisent un texte rose clair. Ce thème possède ses propres valeurs, sans inversion automatique.

## Vérifications et limites

- Tests de contraste : texte courant, petits labels, texte secondaire, boutons et leurs deux extrémités de dégradé, états désactivés, champs, focus et progression.
- Tests PDF existants exécutés avec les tests de contraste : **28 tests réussis**.
- ESLint sur les sources modifiées : aucune erreur ; sept avertissements préexistants dans `module-answer-form.tsx` (variables inutilisées et dépendances de hooks), laissés intacts pour ne pas modifier la logique.
- Vérification AST des 80 sources TypeScript modifiées : structure, expressions et textes JSX inchangés hors attributs de style. Les changements concernent les chaînes de classes/couleurs et les styles inline. Les deux ajustements inline supplémentaires concernent les légendes et le contraste de texte des exemples de couleurs.
- Vérification `git diff --check` réussie.
- Contrôle Chromium sur les composants réels rendus avec des données fictives locales : espace de travail, accueil/connexion, tarifs, sidebar/table admin, module, exercice, inscription, fin de module, story persona, bibliothèque de couleurs et inspiration typographique. Captures en clair/sombre à 1440 px et 390 px. Pas de débordement horizontal détecté sur ces vues.
- Relevé final : 22 variantes de thème, 624 textes mesurés, aucun échec au seuil AA retenu (4,5:1 pour le texte courant, 3:1 pour les grands caractères). Ce relevé porte sur les vues statiques de test à 1440 px ; les captures mobiles complètent l'inspection de mise en page.
- Vérification des états CSS hover, focus et désactivé des CTA, du hover de navigation, du fond transparent du label Introduction et du focus de connexion dans les deux thèmes.
- Les captures sont des rendus statiques isolés, pas des parcours connectés de bout en bout. Elles utilisent More Sugar localement et des polices de remplacement pour les polices Google ; la configuration typographique réelle de l'application n'a pas été modifiée. Les relevés de contraste des vues sont des mesures calculées ; ils ne constituent pas une certification de tout contenu dynamique possible.
- `npm run build` : compilation et TypeScript réussis, puis blocage au pré-rendu de `/acceptation-cgu` et `/personnalite-ton` avec `Missing Supabase environment variables`. Aucune variable, aucun fichier `.env.local` ni aucun accès Supabase n'a été ajouté pour contourner ce blocage. L'accueil local renvoie aussi une erreur, ce qui empêche la validation des parcours réels.

Les captures et relevés locaux se trouvent dans `.runtime/check-*.png`, `.runtime/tyash-contrast-results.json` et `.runtime/tyash-states.json`. Les scripts de rendu isolé sont également dans `.runtime/` et ne font pas partie de l'application.

## Anciennes couleurs volontairement conservées

- Images, logos et illustrations Brand Studio dans `public/` : ressources existantes, conservées pour respecter les contenus. Les jaunes présents dans ces images ne sont pas des styles CSS.
- Exemples pédagogiques, nuanciers, dégradé du sélecteur de teinte, palettes/moodboards saisis par les utilisateurs : couleurs de contenu. Leur valeur n'a pas été recolorisée. Le texte de deux exemples verts clairs a été assombri sans changer les verts présentés.
- Vert, rouge et ambre fonctionnels des statuts, erreurs et avertissements ; couleurs de statut dans le PDF de communication.
- Tons crème, gris chauds et ombres neutres : éléments de la hiérarchie originale, conservés selon leur rôle.
- `lib/mailer.ts` conserve ses couleurs d'e-mails d'activation/réinitialisation : ces modèles liés à l'authentification sont restés hors de l'intervention sur l'interface et les exports.
- Les alias `--bs-orange` et `--bs-yellow` sont conservés pour compatibilité mais pointent vers la palette Ty Ash.

Aucune API, logique métier, authentification, donnée, configuration Supabase ou variable d'environnement n'a été modifiée. Le script automatique de commit/push actif a été arrêté avant la première modification et laissé arrêté. Aucun commit ni push effectué.

## Fichiers modifiés

- `app/acceptation-cgu/page.tsx`
- `app/admin/clients/page.tsx`
- `app/admin/legal/page.tsx`
- `app/admin/modules/page.tsx`
- `app/admin/page.tsx`
- `app/admin/privacy/page.tsx`
- `app/admin/releases/page.tsx`
- `app/admin/users/[id]/guide/page.tsx`
- `app/admin/users/[id]/page.tsx`
- `app/admin/versions/page.tsx`
- `app/auth/reset-password/page.tsx`
- `app/conditions-generales-utilisation/page.tsx`
- `app/globals.css`
- `app/mon-espace/module/[moduleId]/page.tsx`
- `app/mon-espace/page.tsx`
- `app/mon-espace/plan-action-communication/page.tsx`
- `app/page.tsx`
- `app/pricing/page.tsx`
- `app/recover-code/page.tsx`
- `app/register/page.tsx`
- `app/register/success/page.tsx`
- `app/ui/access-login-form.tsx`
- `app/ui/admin-answer-value.tsx`
- `app/ui/admin-deployment-button.tsx`
- `app/ui/admin-guide-download.tsx`
- `app/ui/admin-module-editor.tsx`
- `app/ui/admin-shell.tsx`
- `app/ui/admin-users-table.tsx`
- `app/ui/baseline-inspiration-section.tsx`
- `app/ui/billing-portal-button.tsx`
- `app/ui/brand-guide.tsx`
- `app/ui/brand-persona-admin-editor.tsx`
- `app/ui/brand-persona-exercise.tsx`
- `app/ui/checkout-button.tsx`
- `app/ui/color-library-section.tsx`
- `app/ui/color-palette-admin-editor.tsx`
- `app/ui/color-palette-exercise.tsx`
- `app/ui/communication-action-plan.tsx`
- `app/ui/company-name-form.tsx`
- `app/ui/content-preview-banner.tsx`
- `app/ui/database-error-state.tsx`
- `app/ui/editorial-calendar-exercise.tsx`
- `app/ui/exercise-preview.tsx`
- `app/ui/legal-acceptance-form.tsx`
- `app/ui/legal-document-page.tsx`
- `app/ui/legal-footer.tsx`
- `app/ui/logout-button.tsx`
- `app/ui/module-answer-form.tsx`
- `app/ui/module-completion-screen.tsx`
- `app/ui/module-learning-section.tsx`
- `app/ui/module-preview-trigger.tsx`
- `app/ui/module-share-summary.tsx`
- `app/ui/module-submodule-viewer.tsx`
- `app/ui/moodboard-admin-editor.tsx`
- `app/ui/moodboard-exercise.tsx`
- `app/ui/payment-success-popup.tsx`
- `app/ui/persona-story-card.tsx`
- `app/ui/preview-access-denied.tsx`
- `app/ui/privacy-request-form.tsx`
- `app/ui/project-name-form.tsx`
- `app/ui/recover-code-form.tsx`
- `app/ui/register-form.tsx`
- `app/ui/reset-answers-button.tsx`
- `app/ui/reset-password-form.tsx`
- `app/ui/rich-text-editor.tsx`
- `app/ui/scent-inspiration-section.tsx`
- `app/ui/share-story-card.tsx`
- `app/ui/smart-feedback-admin-editor.tsx`
- `app/ui/smart-feedback.tsx`
- `app/ui/spectrum-admin-editor.tsx`
- `app/ui/spectrum-exercise.tsx`
- `app/ui/summary-answer-table.tsx`
- `app/ui/typography-exercise.tsx`
- `app/ui/typography-inspiration-section.tsx`
- `app/ui/voice-note-player.tsx`
- `app/ui/workspace-logo-form.tsx`
- `lib/brand-guide-pdf-theme.ts`
- `lib/communication-action-pdf.tsx`
- `lib/get-module-share-data.ts`
- `lib/module-pdf-summary.tsx`
- `lib/persona-pdf.tsx`
- `tests/design-system-contrast.test.ts`
- `docs/tyash-design-system-audit.md`
