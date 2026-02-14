# 🚀 Guide de Déploiement sur Vercel

## Pourquoi Vercel ?

- ✅ **Gratuit** pour les projets personnels
- ✅ **Optimisé** pour Next.js (c'est la même équipe)
- ✅ **URL publique** en 3 minutes
- ✅ **HTTPS** automatique
- ✅ **Déploiement continu** depuis GitHub

---

## 📝 Étapes de déploiement (5 minutes)

### 1️⃣ Créer un compte Vercel

**Aller sur :** https://vercel.com/signup

- Cliquer sur **"Continue with GitHub"**
- Autoriser Vercel à accéder à vos repos GitHub
- Gratuit, pas de carte bancaire nécessaire

### 2️⃣ Importer le projet

Une fois connecté :

1. Cliquer sur **"Add New..."** → **"Project"**
2. Dans la liste, chercher **`Transkript`**
3. Cliquer sur **"Import"** à côté du repo

### 3️⃣ Configurer le projet

Sur la page de configuration :

#### **Select Branch**
- Choisir : `claude/creative-analytics-dashboard-KY3jN`

#### **Framework Preset**
- Next.js (détecté automatiquement ✅)

#### **Root Directory**
- Laisser `./` (par défaut)

#### **Build and Output Settings**
- Laisser les valeurs par défaut
- Build Command : `npm run build`
- Output Directory : `.next`

#### **Environment Variables** (IMPORTANT 🔑)
Cliquer sur "Add" et ajouter ces 2 variables :

| Name | Value |
|------|-------|
| `NEXTAUTH_SECRET` | `votre-secret-aleatoire-ici-changez-moi` |
| `NEXTAUTH_URL` | Laisser vide pour l'instant (on le remplira après) |

> 💡 **Astuce :** Pour générer un secret aléatoire :
> ```bash
> openssl rand -base64 32
> ```

### 4️⃣ Déployer !

1. Cliquer sur **"Deploy"**
2. ⏳ Attendre 2-3 minutes pendant le build
3. ✅ Quand c'est terminé, vous verrez : **"Congratulations! 🎉"**

### 5️⃣ Configurer l'URL finale

1. Vercel vous donne une URL type : `creative-analytics-abc123.vercel.app`
2. Copier cette URL
3. Retourner dans **"Settings"** → **"Environment Variables"**
4. Modifier `NEXTAUTH_URL` et mettre : `https://votre-url.vercel.app`
5. **Redéployer** : aller dans "Deployments" → Cliquer sur les 3 points → "Redeploy"

---

## ✅ Accéder à votre app

Votre app est maintenant live ! 🎉

**URL :** https://[votre-nom-projet].vercel.app

### Premiers pas :

1. **Ouvrir l'URL** dans votre navigateur
2. Vous arrivez sur la page de connexion
3. Cliquer n'importe où pour passer (auth pas encore configurée)
4. **Aller sur `/settings`**
5. Cliquer sur **"Générer données de démo"**
6. ✨ Explorez l'app avec 10 créatives fictives !

### Pages à tester :

- 📊 **Dashboard** : Vue d'ensemble avec KPIs
- 🏆 **Leaderboard** : Classement des créatives (toggle Cards/Table)
- 🔍 **Creative** : Cliquez sur une créative pour voir les détails
- 📈 **Trends** : Analyse des tendances
- 🚨 **Fatigue** : Détection de fatigue créative
- ⚙️ **Settings** : Configuration

---

## ⚠️ Note importante : Base de données

Actuellement, l'app utilise **SQLite** qui ne fonctionne pas sur Vercel (serverless).

**Pour le moment :**
- L'app affichera des données vides ou des erreurs
- La génération de démo fonctionne mais ne persiste pas

**Solution (à implémenter) :**
1. Migrer vers **Vercel Postgres** (gratuit jusqu'à 256 MB)
2. Ou utiliser **Turso** (SQLite serverless)
3. Ou générer des données statiques côté client

### Option rapide : Vercel Postgres

```bash
# Dans Vercel Dashboard
1. Aller dans "Storage"
2. Créer une base "Postgres"
3. Copier les variables DATABASE_URL, etc.
4. Adapter Drizzle pour PostgreSQL
```

---

## 🔄 Déploiement automatique

Chaque fois que vous pushez sur la branche `claude/creative-analytics-dashboard-KY3jN` :
- Vercel rebuild automatiquement
- Nouvelle version deployée en ~2 minutes
- URL reste la même

---

## 🎨 Personnaliser le domaine (optionnel)

Dans Vercel Dashboard :
1. Aller dans **"Settings"** → **"Domains"**
2. Ajouter votre propre domaine (ex: `analytics.votresite.com`)
3. Suivre les instructions DNS

---

## 🆘 Problèmes courants

### Build Failed
**Cause :** Erreur de compilation TypeScript
**Solution :** Vérifier les logs dans Vercel, corriger l'erreur, push, redéployer

### "Database connection error"
**Cause :** SQLite ne fonctionne pas sur Vercel
**Solution :** Voir section "Base de données" ci-dessus

### Page blanche
**Cause :** Variables d'environnement manquantes
**Solution :** Vérifier que NEXTAUTH_SECRET et NEXTAUTH_URL sont bien configurées

### "Failed to load resource"
**Cause :** Assets manquants ou chemins incorrects
**Solution :** Vérifier que les images utilisent des URLs absolues

---

## 📊 Métriques Vercel

Dans le Dashboard Vercel :
- **Analytics** : Nombre de visiteurs, pages vues
- **Speed Insights** : Performance de l'app
- **Logs** : Erreurs serveur en temps réel

---

## 🎯 Prochaines étapes

1. ✅ **App déployée** → Partager l'URL !
2. 🔐 **Connecter Meta API** :
   - Créer une app Facebook Developer
   - Ajouter FACEBOOK_CLIENT_ID et SECRET dans Vercel
   - Configurer OAuth redirect : `https://votre-app.vercel.app/api/auth/callback/facebook`

3. 💾 **Migrer vers Postgres** :
   - Activer Vercel Postgres
   - Adapter le schema Drizzle
   - Redéployer

---

**App créée avec Claude Code** 🤖
Session : https://claude.ai/code/session_01K1rBtagEQN6KybyF1LjkUr

**Repository GitHub :**
https://github.com/jonathan-enca/Transkript/tree/claude/creative-analytics-dashboard-KY3jN
