# EmpireCut — Plan d'Implémentation

> Mini-clone professionnel de CapCut en React Native CLI + TypeScript + Supabase.

---

## Contexte & Analyse de la Base Existante

- **RN version** : 0.85.3 (New Architecture activée)
- **React** : 19.2.3
- **Node** : ≥ 22.11.0
- **Déjà présent** : `react-native-safe-area-context`, structure CLI standard
- **À faire** : tout le reste — dépendances, architecture, features

---

## User Review Required

> [!IMPORTANT]
> **Choix NativeWind vs Tamagui** : Je recommande **NativeWind v4** (Tailwind CSS pour RN). Raisons : meilleure compatibilité RN 0.85+, syntaxe familière, communauté active, bundle plus léger que Tamagui. Tamagui est plus puissant mais plus complexe à configurer sur RN CLI.
>
> **Confirmes-tu NativeWind v4 ?** Sinon, précise Tamagui.

> [!WARNING]
> **FFmpegKit** : La lib officielle `ffmpeg-kit-react-native` est actuellement **archivée / peu maintenue**. Deux alternatives :
> 1. `react-native-ffmpeg` (fork communautaire actif, recommandé)
> 2. Utiliser FFmpegKit via le fork `@arthenica/ffmpeg-kit` (toujours fonctionnel, dernière version 6.0)
>
> Je vais utiliser **`ffmpeg-kit-react-native`** version `^6.0.3` (encore fonctionnelle, la plus documentée). Si tu rencontres des problèmes de build, on basculera sur le fork communautaire.

> [!IMPORTANT]
> **Supabase credentials** : J'ai besoin de ta `SUPABASE_URL` et `SUPABASE_ANON_KEY` pour configurer le client. En attendant, je crée le fichier `.env.example` et utilise des placeholders.

---

## Open Questions

1. **Plateforme cible principale** : Android uniquement pour commencer, ou les deux simultanément ?
2. **Supabase Project** : Projet déjà créé sur Supabase ? Ou je documente le schéma SQL à créer ?
3. **Stockage vidéo** : Limite de taille par vidéo ? (impact sur compression FFmpeg)
4. **NativeWind ou Tamagui** ? (voir ci-dessus — je pars sur NativeWind v4 si pas de réponse)

---

## Architecture Technique

### Principe de séparation des responsabilités

```
UI Layer         → screens/ + components/
Business Logic   → hooks/ + editor/ + timeline/
Services         → services/ + supabase/ + ffmpeg/
State            → store/ (Zustand)
Types            → types/
Utils            → utils/ + constants/
Theme            → theme/ + animations/
```

### Structure complète `src/`

```
src/
├── assets/              # images, fonts, icons
├── components/
│   ├── common/          # Button, Input, Modal, LoadingOverlay
│   ├── video/           # VideoPlayer, VideoThumbnail
│   ├── timeline/        # TimelineBar, TrimHandle, Cursor
│   ├── editor/          # ToolBar, TextOverlay, MusicPicker
│   └── auth/            # LoginForm, RegisterForm
├── screens/
│   ├── SplashScreen.tsx
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── HomeScreen.tsx
│   ├── ImportScreen.tsx
│   ├── EditorScreen.tsx
│   ├── ExportScreen.tsx
│   ├── ProfileScreen.tsx
│   └── SettingsScreen.tsx
├── navigation/
│   ├── RootNavigator.tsx    # Stack principal (Auth vs App)
│   ├── AppNavigator.tsx     # Tab / Stack post-auth
│   └── types.ts             # NavigationParamList typé
├── services/
│   ├── video.service.ts     # import, picker, metadata
│   ├── storage.service.ts   # Supabase storage wrapper
│   ├── project.service.ts   # CRUD projets
│   └── export.service.ts    # orchestration export
├── supabase/
│   ├── client.ts            # init Supabase client
│   ├── auth.ts              # login, register, logout, session
│   └── database.ts          # queries typées
├── ffmpeg/
│   ├── ffmpeg.service.ts    # wrapper FFmpegKit
│   ├── commands.ts          # builders de commandes FFmpeg
│   └── types.ts             # FFmpegJob, FFmpegResult
├── editor/
│   ├── editor.engine.ts     # moteur principal éditeur
│   └── operations.ts        # trim, merge, textOverlay
├── timeline/
│   ├── timeline.engine.ts   # logique timeline
│   └── thumbnail.service.ts # génération thumbnails
├── store/
│   ├── auth.store.ts        # session utilisateur
│   ├── editor.store.ts      # état éditeur (clips, overlays)
│   ├── project.store.ts     # projets utilisateur
│   └── ui.store.ts          # état UI (loading, modals)
├── hooks/
│   ├── useAuth.ts
│   ├── useVideo.ts
│   ├── useTimeline.ts
│   ├── useFFmpeg.ts
│   └── useProject.ts
├── types/
│   ├── video.types.ts
│   ├── project.types.ts
│   ├── editor.types.ts
│   └── supabase.types.ts    # types générés Supabase
├── utils/
│   ├── time.utils.ts        # formatage durée
│   ├── file.utils.ts        # gestion fichiers
│   └── validation.utils.ts
├── constants/
│   ├── app.constants.ts
│   └── ffmpeg.constants.ts
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── index.ts
└── animations/
    ├── transitions.ts
    └── shared.ts
```

---

## Dépendances à Installer

### Navigation
```
@react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
react-native-screens react-native-safe-area-context
```

### State & UI
```
zustand
react-native-reanimated
react-native-gesture-handler
nativewind (+ tailwindcss)
```

### Vidéo & Media
```
react-native-video
react-native-image-picker
@react-native-camera-roll/camera-roll
ffmpeg-kit-react-native
```

### Supabase
```
@supabase/supabase-js
react-native-url-polyfill
@react-native-async-storage/async-storage
```

### Utils
```
react-native-fs (filesystem)
react-native-device-info
react-native-linear-gradient
react-native-vector-icons
```

---

## Schéma Supabase (PostgreSQL)

```sql
-- Profiles (extension de auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  duration FLOAT,
  status TEXT DEFAULT 'draft', -- draft | exported | archived
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video clips d'un projet
CREATE TABLE clips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  duration FLOAT,
  start_trim FLOAT DEFAULT 0,
  end_trim FLOAT,
  position INTEGER DEFAULT 0, -- ordre dans timeline
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;

-- Utilisateur voit uniquement ses données
CREATE POLICY "user_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "user_own_projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_clips" ON clips FOR ALL USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
```

---

## Roadmap d'Exécution — 7 Phases

### ✅ PHASE 1 — Foundation (ce que je vais faire maintenant)
- Installation de toutes les dépendances
- Configuration TypeScript, Babel, Metro
- Architecture dossiers `src/`
- Système de thème (couleurs, typo, spacing)
- Navigation (Root → Auth → App)
- Store Zustand (auth, editor, ui)
- Configuration Supabase client
- `App.tsx` rewire propre

**Fichiers créés : ~25 fichiers**

### PHASE 2 — Auth
- Écrans Login / Register
- Supabase Auth (email + password)
- Gestion session persistante
- Profil utilisateur
- Splash screen avec guard auth

### PHASE 3 — Import & Player Vidéo
- Import depuis galerie (react-native-image-picker)
- Player vidéo custom (react-native-video)
- Controls custom (play/pause, seek, durée)
- Timeline basique avec thumbnails

### PHASE 4 — FFmpeg & Édition
- Intégration FFmpegKit
- Trim vidéo
- Export MP4
- Barre de progression export

### PHASE 5 — Overlays
- Ajout de texte sur vidéo
- Ajout musique de fond
- Gestion layers simples

### PHASE 6 — Cloud
- Upload vidéo → Supabase Storage
- Sauvegarde projet
- Liste des projets sur Home
- Miniatures

### PHASE 7 — Optimisation
- Mémoire & cache
- Compression adaptive
- Lazy loading thumbnails
- Performance profiling

---

## Verification Plan

### Après Phase 1
- `npx react-native run-android` sans erreurs
- Navigation entre écrans mockés
- Store Zustand fonctionnel (Redux DevTools / Flipper)

### Après Phase 2
- Login / Logout via Supabase Auth
- Session persistée après reboot app

### Après Phase 4
- Trim vidéo exporté en MP4 via FFmpeg
- Fichier MP4 lisible dans la galerie Android

---

## Notes Techniques Importantes

### Pourquoi Zustand et pas Redux ?
Redux + RTK est puissant mais trop verbeux pour un MVP mobile. Zustand offre une API minimale, compatible avec le re-render sélectif, et s'intègre parfaitement avec Reanimated.

### Pourquoi react-native-video et pas Expo AV ?
On est en **React Native CLI**, pas Expo. `react-native-video` est la référence, compatible avec FFmpegKit pour extraire des frames.

### Pourquoi NativeWind ?
Tailwind CSS connu de tous, génère des StyleSheet natifs (pas de styles inline), supporte les dark mode tokens, et pèse moins que Tamagui sur un bundle RN.

### FFmpeg — Stratégie de commandes
Toutes les commandes FFmpeg passent par `ffmpeg.service.ts` qui :
1. Log la commande complète en dev
2. Gère les callbacks progress
3. Nettoie les fichiers temporaires
4. Retourne un `FFmpegResult` typé

