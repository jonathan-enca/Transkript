# Creative Analytics Dashboard

Une application web d'analyse de performance créative pour Meta Ads, inspirée de Motion App. Analysez vos créatives, identifiez les winners et comprenez pourquoi elles performent.

## Features

- 📊 **Dashboard Overview** - KPIs globaux et métriques clés
- 🏆 **Creative Leaderboard** - Classement de vos créatives avec vue cards/table
- 🔍 **Deep Dive Analysis** - Analyse détaillée par créative avec scores et diagnostics
- 📈 **Trends & Patterns** - Identification des tendances de performance
- 🚨 **Fatigue Detection** - Détection automatique de fatigue créative
- 💯 **Scoring System** - Scores sur 100 pour Hook, Watch, Click et Convert
- 🎯 **Benchmarking** - Calcul automatique de benchmarks basés sur percentiles

## Stack Technique

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Database**: SQLite + Drizzle ORM
- **Auth**: NextAuth.js avec Facebook OAuth
- **Charts**: Recharts
- **Icons**: Lucide React

## Installation

### Prérequis

- Node.js 18+
- npm ou pnpm

### Setup

1. Cloner le repo et installer les dépendances:

\`\`\`bash
npm install
\`\`\`

2. Créer un fichier \`.env.local\` à la racine:

\`\`\`env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Facebook OAuth (optionnel pour demo)
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Database
DATABASE_URL=file:./creative-analytics.db
\`\`\`

3. Générer et appliquer les migrations de base de données:

\`\`\`bash
npm run db:generate
npm run db:migrate
\`\`\`

4. (Optionnel) Générer des données de démo pour tester l'app:

\`\`\`bash
# Via l'interface après avoir lancé l'app
# Aller dans Settings > Demo Mode > Générer données de démo
\`\`\`

5. Lancer le serveur de développement:

\`\`\`bash
npm run dev
\`\`\`

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## Mode Démo

Pour tester l'application sans connexion Meta API:

1. Lancez l'app avec \`npm run dev\`
2. Allez sur http://localhost:3000/settings
3. Cliquez sur "Générer données de démo"
4. Explorez le Dashboard, Leaderboard et les pages de détail

Cela créera 10 créatives fictives avec 30 jours de métriques.

## Configuration Meta API (Production)

### 1. Créer une app Facebook

1. Aller sur [Facebook Developers](https://developers.facebook.com/)
2. Créer une nouvelle app de type "Business"
3. Ajouter le produit "Marketing API"

### 2. Configurer OAuth

1. Dans l'app Facebook, aller dans Settings > Basic
2. Noter l'App ID et l'App Secret
3. Ajouter une URL de redirection OAuth: \`http://localhost:3000/api/auth/callback/facebook\`

### 3. Permissions requises

Lors de la connexion Facebook, demander ces permissions:
- \`ads_read\`
- \`ads_management\`
- \`read_insights\`
- \`business_management\`

### 4. Variables d'environnement

Ajouter dans \`.env.local\`:

\`\`\`env
FACEBOOK_CLIENT_ID=your-app-id
FACEBOOK_CLIENT_SECRET=your-app-secret
\`\`\`

## Structure du projet

\`\`\`
.
├── app/
│   ├── (dashboard)/         # Pages protégées
│   │   ├── dashboard/       # Vue d'ensemble
│   │   ├── leaderboard/     # Classement créatives
│   │   ├── creative/[id]/   # Deep dive
│   │   ├── trends/          # Tendances
│   │   ├── fatigue/         # Détection fatigue
│   │   └── settings/        # Configuration
│   ├── api/
│   │   ├── auth/            # NextAuth routes
│   │   └── seed-demo/       # Route pour demo data
│   └── auth/signin/         # Page de connexion
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Sidebar, Navbar
│   ├── leaderboard/         # Leaderboard components
│   └── creative/            # Creative detail components
├── lib/
│   ├── db/                  # Drizzle ORM setup
│   │   ├── schema.ts        # Database schema
│   │   └── index.ts         # DB client
│   ├── metrics/             # Calculs de métriques
│   │   ├── calculated.ts    # Hook Rate, ROAS, etc.
│   │   ├── benchmarks.ts    # Calcul percentiles
│   │   └── scoring.ts       # Système de scoring
│   ├── meta/                # Meta API integration
│   │   └── types.ts         # TypeScript types
│   ├── demo/                # Demo data generation
│   │   └── seed.ts
│   ├── auth.ts              # NextAuth config
│   └── utils.ts             # Utilities
└── README.md
\`\`\`

## Métriques Calculées

L'app calcule automatiquement ces métriques à partir des données Meta:

| Métrique | Formule | Rôle |
|----------|---------|------|
| **Hook Rate** | 3s views / Impressions × 100 | Capacité à capter l'attention |
| **Hold Rate** | 15s views / 3s views × 100 | Capacité à retenir |
| **Click Rate** | Outbound clicks / Impressions × 100 | Capacité à générer du clic |
| **Conversion Rate** | Purchases / Outbound clicks × 100 | Capacité à convertir |
| **CPA** | Spend / Purchases | Coût par acquisition |
| **ROAS** | Purchase value / Spend | Retour sur investissement |
| **Fatigue Score** | Basé sur CTR decline + CPM increase | Détection de fatigue |

## Scoring System

Chaque créative reçoit 4 scores de 0 à 100:

- 🎯 **Hook Score** - Performance du hook vs benchmark du compte
- 👀 **Watch Score** - Rétention vs benchmark
- 👆 **Click Score** - CTR vs benchmark
- 💰 **Convert Score** - ROAS vs benchmark

Les scores sont calculés via percentiles (P10, P25, P50, P75, P90) sur les créatives ayant dépensé >50€.

## Diagnostic Automatique

Selon la combinaison des scores, l'app génère automatiquement:

- Un diagnostic de la performance
- Des recommandations concrètes d'optimisation
- Un statut: Winner 🏆 / Good / Average / Poor

Exemples:

- Hook ↓ + Watch/Click ↑ → "Hook trop faible, tester de nouveaux openings"
- Hook ↑ + Watch ↓ → "Le hook attire mais le contenu ne retient pas"
- Tous ↑ sauf Convert → "Problème probable sur la landing page"

## Database Schema

### Table: \`ads\`
Stocke les métadonnées de chaque créative (nom, format, thumbnail, campaign, etc.)

### Table: \`daily_metrics\`
Métriques quotidiennes par ad (spend, impressions, clicks, purchases, video metrics, etc.)

### Table: \`benchmarks\`
Percentiles pour chaque métrique clé (hookRate, holdRate, clickRate, roas)

### Table: \`accounts\`
Comptes Meta connectés avec tokens et préférences

## Scripts disponibles

\`\`\`bash
npm run dev          # Dev server avec Turbopack
npm run build        # Build production
npm run start        # Start production server
npm run lint         # ESLint
npm run db:generate  # Générer migrations Drizzle
npm run db:migrate   # Appliquer migrations
npm run db:studio    # Ouvrir Drizzle Studio
\`\`\`

## Roadmap

Phase 1 (MVP) - ✅ Complété:
- [x] Auth Facebook
- [x] Schema DB et sync
- [x] Leaderboard avec cards/table
- [x] Creative Deep Dive
- [x] Métriques calculées
- [x] Mode démo

Phase 2 - En cours:
- [ ] Scoring system avec benchmarks
- [ ] Diagnostics automatiques
- [ ] Funnel vidéo détaillé
- [ ] Fatigue detection avancée

Phase 3 - À venir:
- [ ] Creative Comparison
- [ ] Trends avec graphiques Recharts
- [ ] Export PDF/CSV
- [ ] Dark mode toggle
- [ ] Sync automatique quotidien

## Support

Pour toute question ou bug, ouvrir une issue sur GitHub.

## License

MIT
