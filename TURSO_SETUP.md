# 🚀 Configuration Turso pour Vercel

Ce guide vous aide à configurer **Turso** (SQLite serverless) pour votre application déployée sur Vercel.

---

## Pourquoi Turso ?

- ✅ **SQLite serverless** compatible avec Vercel
- ✅ **Gratuit** jusqu'à 9 GB de stockage
- ✅ **Très rapide** et fiable
- ✅ Compatible avec notre code Drizzle ORM existant

---

## 📝 Étape 1 : Installer Turso CLI

### Sur macOS/Linux :
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

### Sur Windows :
```powershell
powershell -c "irm https://get.tur.so/install.ps1 | iex"
```

**Vérifiez l'installation :**
```bash
turso --version
```

---

## 🔐 Étape 2 : Créer un compte Turso

```bash
turso auth signup
```

Cela va ouvrir votre navigateur. **Connectez-vous avec GitHub** (c'est le plus simple).

Une fois connecté, revenez dans le terminal.

**Vérifiez que vous êtes connecté :**
```bash
turso auth whoami
```

---

## 🗄️ Étape 3 : Créer votre base de données

```bash
turso db create creative-analytics
```

**Vous devriez voir :**
```
Created database creative-analytics in [region]
URL: libsql://creative-analytics-[username].turso.io
```

**Copiez cette URL !** Vous en aurez besoin.

---

## 🔑 Étape 4 : Créer un token d'authentification

```bash
turso db tokens create creative-analytics
```

**Vous allez recevoir un token** (quelque chose comme `eyJhbGciOiJFZERTQSIsInR5c...`).

⚠️ **IMPORTANT** : Copiez ce token immédiatement ! Il ne sera pas réaffiché.

---

## 📊 Étape 5 : Migrer le schéma de la base de données

### 5.1 Connectez-vous à la base Turso

```bash
turso db shell creative-analytics
```

### 5.2 Créez les tables

Copiez-collez **ligne par ligne** (ou tout d'un coup) :

```sql
CREATE TABLE IF NOT EXISTS ads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  adset_id TEXT NOT NULL,
  creative_id TEXT,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS creatives (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  thumbnail_url TEXT,
  video_url TEXT,
  image_url TEXT,
  body TEXT,
  title TEXT,
  link_description TEXT,
  call_to_action TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_metrics (
  id TEXT PRIMARY KEY,
  ad_id TEXT NOT NULL,
  creative_id TEXT,
  date TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend REAL DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  video_views INTEGER DEFAULT 0,
  video_3s_views INTEGER DEFAULT 0,
  video_watches_25 INTEGER DEFAULT 0,
  video_watches_50 INTEGER DEFAULT 0,
  video_watches_75 INTEGER DEFAULT 0,
  video_watches_100 INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (ad_id) REFERENCES ads(id),
  FOREIGN KEY (creative_id) REFERENCES creatives(id)
);

CREATE INDEX idx_daily_metrics_ad_date ON daily_metrics(ad_id, date);
CREATE INDEX idx_daily_metrics_creative_date ON daily_metrics(creative_id, date);
CREATE INDEX idx_ads_account ON ads(account_id);
CREATE INDEX idx_creatives_account ON creatives(account_id);
```

**Tapez `.exit` pour quitter le shell Turso.**

---

## ☁️ Étape 6 : Configurer les variables d'environnement dans Vercel

### 6.1 Allez dans les Settings de Vercel

👉 https://vercel.com/jonathan-enca/transkript/settings/environment-variables

### 6.2 Ajoutez ces variables

#### **1. NEXTAUTH_URL**
```
Name: NEXTAUTH_URL
Value: https://transkript.vercel.app
Environment: Production, Preview, Development
```

#### **2. NEXTAUTH_SECRET**

Générez d'abord un secret sécurisé :
```bash
openssl rand -base64 32
```

Puis ajoutez-le :
```
Name: NEXTAUTH_SECRET
Value: [Le résultat de la commande openssl]
Environment: Production, Preview, Development
```

#### **3. TURSO_DATABASE_URL**
```
Name: TURSO_DATABASE_URL
Value: libsql://creative-analytics-[username].turso.io
Environment: Production, Preview, Development
```

#### **4. TURSO_AUTH_TOKEN**
```
Name: TURSO_AUTH_TOKEN
Value: [Le token créé à l'étape 4]
Environment: Production, Preview, Development
```

⚠️ **N'oubliez pas** : Vous devez aussi avoir configuré avant :
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`

---

## 🚀 Étape 7 : Redéployer sur Vercel

Une fois toutes les variables configurées :

1. **Allez dans Deployments** :
   👉 https://vercel.com/jonathan-enca/transkript/deployments

2. **Cliquez sur "..."** du dernier déploiement

3. **Cliquez sur "Redeploy"**

4. **Attendez 2-3 minutes** ⏳

---

## ✅ Étape 8 : Tester

1. Allez sur **https://transkript.vercel.app**
2. Cliquez sur **"Se connecter avec Facebook"**
3. Acceptez les permissions
4. Vous devriez voir le **dashboard** sans erreur 500 ! 🎉

---

## 🆘 Problèmes courants

### Erreur : "LibsqlError: UNAUTHORIZED"
➡️ Vérifiez que `TURSO_AUTH_TOKEN` est correct dans Vercel.

### Erreur : "table not found"
➡️ Retournez à l'étape 5 et recréez les tables.

### Le dashboard est vide
➡️ C'est normal ! Vous n'avez pas encore de données. Connectez-vous à Meta Ads pour synchroniser vos données.

---

## 📚 Ressources

- **Turso Documentation** : https://docs.turso.tech
- **Drizzle + Turso** : https://orm.drizzle.team/docs/get-started-sqlite#turso
- **Turso Dashboard** : https://turso.tech/app

---

## 🎉 Félicitations !

Votre application utilise maintenant **Turso** et est 100% compatible avec Vercel ! 🚀
