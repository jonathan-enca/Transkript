# 🚀 Guide de Démarrage Rapide

## Option 1 : Lancement Local (MAINTENANT)

```bash
# Déjà fait ✅
npm install
node scripts/quick-seed.js  # Données de démo créées

# Lancer le serveur
npm run dev
```

Puis ouvrir : **http://localhost:3000**

## Option 2 : Déploiement sur Vercel (Production)

### Prérequis
- Compte GitHub
- Compte Vercel (gratuit)

### Étapes

1. **Push le code sur GitHub** (déjà fait ✅)
   - Branch: `claude/creative-analytics-dashboard-KY3jN`

2. **Aller sur Vercel** : https://vercel.com

3. **Importer le projet** :
   - Cliquer sur "New Project"
   - Importer depuis GitHub : `jonathan-enca/Transkript`
   - Sélectionner la branch `claude/creative-analytics-dashboard-KY3jN`

4. **Configurer les variables d'environnement** (optionnel pour démo) :
   ```
   NEXTAUTH_SECRET=votre-secret-aleatoire
   NEXTAUTH_URL=https://votre-app.vercel.app
   ```

5. **Déployer** :
   - Cliquer sur "Deploy"
   - Attendre 2-3 minutes
   - Votre app sera live sur : `https://votre-app.vercel.app`

## 📊 Utilisation après déploiement

1. Aller sur `/settings`
2. Cliquer sur "Générer données de démo"
3. Explorer :
   - Dashboard : KPIs globaux
   - Leaderboard : Toutes les créatives
   - Cliquer sur une créative pour le Deep Dive

## 🔑 Pour connecter Meta Ads (production)

1. Créer une app Facebook Developer
2. Obtenir Client ID et Secret
3. Ajouter dans Vercel :
   ```
   FACEBOOK_CLIENT_ID=...
   FACEBOOK_CLIENT_SECRET=...
   ```

---

**App créée avec Claude Code** 🤖
https://claude.ai/code/session_01K1rBtagEQN6KybyF1LjkUr
