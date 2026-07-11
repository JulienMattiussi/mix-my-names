# mix-my-names

Générateur de monogrammes typographiques. On saisit **deux noms** (et
optionnellement deux prénoms) ; les **lettres communes** aux deux noms
fusionnent en un seul tracé partagé, et le reste de chaque nom se répartit
au-dessus et en dessous. L'ensemble s'inscrit dans un rectangle. Les prénoms,
eux, se gravent en petit le long d'un trait de la lettre appropriée.

Application **100% front-end**, sans backend. Interface en **français**.
Déployée sur **https://mix-my-names.vercel.app**.

---

## Stack technique

| Outil | Usage |
|---|---|
| React 19 + TypeScript | UI |
| Vite | Build / dev server (port **1313**) |
| Tailwind CSS v4 | Styles (via `@tailwindcss/vite`, pas de config JS) |
| Vitest + Testing Library | Tests unitaires et composants |
| Prettier | Formatage |
| ESLint (typescript-eslint) | Linting |
| Knip | Détection des fichiers / exports / dépendances inutilisés |

---

## Arborescence

```
src/
├── lib/                      # Logique pure, zéro React (entièrement testée)
│   ├── fusion.ts             # findFusion : quelles lettres fusionner entre deux mots
│   ├── layout.ts             # buildLayout : place les glyphes à partir des ancres (+ crénage)
│   ├── prenom.ts             # matchPrenom : où et comment accrocher un prénom
│   ├── text.ts               # normalizeWord : majuscules, sans accents, A-Z
│   └── glyphs/               # Une fonte à traits, dessinée à la main
│       ├── A.ts .. Z.ts      # Un fichier de tracé par lettre (polylignes normalisées)
│       ├── types.ts          # GlyphPaths
│       └── index.ts          # GLYPHS (map) + lowestTrait (trait d'inscription)
├── App.tsx                   # UI, rendu SVG, modes de couleur, inscriptions
├── main.tsx                  # Point d'entrée
└── index.css                 # Import Tailwind + reset minimal
public/
├── favicon.svg               # Favicon
└── og.png                    # Image Open Graph (1200x630)
tests/
├── setup.ts                  # Setup Testing Library (jest-dom)
├── unit/                     # Vitest - logique pure (fusion, layout, prenom, text)
└── component/                # Vitest + Testing Library (App)
```

---

## Le concept, en détail

### 1. Fusion (`src/lib/fusion.ts`)

`findFusion(word1, word2)` renvoie les lettres à fusionner (les **ancres**),
sous deux contraintes :

1. Les ancres forment une **sous-séquence commune ordonnée** des deux mots.
2. **Parité des trous** : pour chaque zone entre deux ancres consécutives et aux
   deux extrémités, le nombre de lettres restantes dans le mot du haut et dans
   celui du bas doit être **soit tous les deux nuls, soit tous les deux
   non-nuls**. Sinon on aurait une encoche dans le rectangle.

L'algo maximise le nombre d'ancres (DP type LCS contraint), avec en départage la
minimisation de la somme des carrés des longueurs de trous (répartition la plus
équilibrée). Exemples : `MASCHTALER / MARTIN` fusionne `M, A, T` ;
`MUNIER / MANIUR` fusionne `M, N, I, R` (le U mal placé est écarté) ;
`TRAIN / NATRI` (anagramme quasi inversé) ne peut fusionner qu'une seule lettre.

### 2. Mise en page (`src/lib/layout.ts`)

`buildLayout(topWord, bottomWord, anchors)` produit les placements. Les ancres
sont des glyphes pleine hauteur (traversant les deux lignes) ; entre elles,
chaque mot remplit son segment. Le rectangle est exact par construction (mot du
haut calé en haut, mot du bas calé en bas). Règle de crénage : quand une ancre
`T` est adjacente à un `A` dans le mot du haut, le bloc suivant est rapproché
(comble l'espace optique).

### 3. Prénoms (`src/lib/prenom.ts`)

`matchPrenom(word, prenom, common)` cherche le plus long **préfixe ou suffixe**
du prénom qui apparaît, contigu, dans les **lettres non communes** du mot. Le
reste du prénom est gravé le long du **trait le plus bas** de la lettre de
jonction (`lowestTrait`, dans `glyphs/index.ts`), quelle que soit son
orientation (horizontal, vertical, diagonal). Exemple : `ALEXANDRA` sur
`MASCHTALER` retient `ALE` et grave `XANDRA` sur la barre du `E`.

---

## Contraintes techniques

- **100% front-end** : aucun appel serveur, pas de backend.
- **Pas de SSR** : Vite SPA. Ne pas introduire Next.js ou Remix.
- **Alias `@/`** pointe vers `src/`. Toujours l'utiliser pour les imports
  internes, jamais de chemins relatifs `../../`.
- **Tailwind v4** : `@import 'tailwindcss'` dans le CSS, pas de
  `tailwind.config.js`.
- **TypeScript strict** : `noUnusedLocals`, `noUnusedParameters`,
  `noUncheckedIndexedAccess` activés. Ne pas les désactiver.
- **Caractères** : les glyphes couvrent A-Z majuscules uniquement. Les entrées
  sont normalisées (majuscules, accents retirés, non-lettres supprimées).

---

## Règles de développement

### Structure
- `src/lib/` : logique pure, zéro import React (les glyphes y sont de la donnée).
- `src/App.tsx` : tout le React (rendu SVG, état, UI).
- **Taille des fichiers** : viser < ~300 lignes ; au-delà, découper.

### Qualité du code
- **Factoriser, ne pas dupliquer** : extraire les helpers réutilisables.
- **Pas de code mort** : tout export doit être utilisé ou testé. `make knip`
  doit rester vert.
- **Commentaires utiles seulement** : expliquer le pourquoi / le non-évident ;
  ne jamais paraphraser le code.

### Tests
- **Logique pure entièrement testée** (`src/lib/`).
- **Tests de composants** sur les interactions clés via Testing Library.

### Accessibilité
- Tout cliquable est un bouton/lien avec libellé accessible ; champs avec label
  ou `aria-label` ; focus clavier visible ; ne jamais coder l'information par la
  seule couleur.

### Qualité (avant de considérer une tâche terminée)
- `make check` doit passer (build + lint + typecheck + knip + tests).

---

## Commandes (Makefile)

| Commande | Effet |
|---|---|
| `make install` | Installe les dépendances |
| `make start` | Serveur de dev (http://localhost:1313) |
| `make build` | Build de production |
| `make lint` | ESLint |
| `make knip` | Détecte fichiers / exports / dépendances inutilisés |
| `make format` | Formate avec Prettier |
| `make typecheck` | Vérifie les types |
| `make test` | Tests unitaires et composants |
| `make fix` | Format + lint |
| `make check` | build + lint + typecheck + knip + tests |

---

## Conventions globales du dépôt

- **Code en anglais** : commentaires, identifiants, noms de variables et de
  fonctions. Seules les valeurs affichées à l'utilisateur sont en français.
- **Commits** : pas de trailer `Co-Authored-By`. Auteur = le compte git de
  YavaDeus uniquement. Vaut aussi pour les descriptions de pull request.
- **Typographie** : ne jamais introduire de tiret long (em-dash ou en-dash) dans
  le code, les chaînes, les commentaires ou la doc. Utiliser un tiret ASCII `-`,
  deux-points, parenthèses, ou reformuler.
