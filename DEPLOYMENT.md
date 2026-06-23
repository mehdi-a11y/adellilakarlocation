# Déploiement Contabo + mise à jour automatique

Ce guide installe **Adel Immobilier** sur votre VPS Contabo avec votre nom de domaine, et configure le **déploiement automatique** à chaque push sur GitHub.

## Architecture

```
Vous (Cursor) → git push → GitHub → GitHub Actions → SSH → VPS Contabo
                                                              ├── Nginx (443/80)
                                                              ├── PM2 → Next.js
                                                              └── Supabase (cloud)
```

---

## Prérequis

- VPS Contabo (Ubuntu 22.04 ou 24.04 recommandé)
- Nom de domaine acheté
- Compte [GitHub](https://github.com) (gratuit)
- Projet Supabase déjà configuré

---

## Étape 1 — DNS (chez votre registrar)

Créez un enregistrement **A** :

| Type | Nom | Valeur |
|------|-----|--------|
| A | `@` | IP publique de votre VPS Contabo |
| A | `www` | même IP |

> L’IP se trouve dans le panel Contabo → votre VPS → IP Address.

La propagation DNS peut prendre **15 min à 48 h**.

---

## Étape 2 — Pousser le code sur GitHub

Dans le dossier du projet (PowerShell) :

```powershell
cd "c:\Users\naceu\Documents\adel immobilier"
git init
git add .
git commit -m "Initial commit — Adel Immobilier"
git branch -M main
git remote add origin https://github.com/mehdi-a11y/adellilakarlocation
git push -u origin main
```

Remplacez `VOTRE_USER` par votre identifiant GitHub.

---

## Étape 3 — Configurer le VPS Contabo (une seule fois)

Connectez-vous en SSH :

```bash
ssh root@IP_DE_VOTRE_VPS
```

Installez Node, Nginx, PM2 et clonez le repo :

```bash
export REPO_URL="https://github.com/VOTRE_USER/adel-immobilier.git"
export DOMAIN="votre-domaine.com"
bash -c "$(curl -fsSL https://raw.githubusercontent.com/VOTRE_USER/adel-immobilier/main/deploy/server-setup.sh)"
```

Ou copiez `deploy/server-setup.sh` sur le serveur et exécutez-le.

---

## Étape 4 — Variables d’environnement sur le serveur

```bash
nano /var/www/adel-immobilier/.env.production
```

Contenu (copiez depuis `.env.production.example`) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789012345
```

> **Meta Pixel :** récupérez l’ID dans [Meta Events Manager](https://business.facebook.com/events_manager) → votre pixel → Paramètres. Sans cette variable, le pixel n’est pas chargé.

> **Important :** pas de `/rest/v1/` dans l’URL Supabase.

Premier déploiement manuel :

```bash
cd /var/www/adel-immobilier
bash deploy/deploy.sh
pm2 startup
pm2 save
```

---

## Étape 5 — HTTPS (SSL gratuit)

Quand le DNS pointe bien vers le VPS :

```bash
cd /var/www/adel-immobilier
git pull origin main
CERTBOT_EMAIL=votre@email.com bash deploy/setup-ssl.sh
```

Ou manuellement :

```bash
certbot --nginx -d adellilakarlocation.site -d www.adellilakarlocation.site
```

> **Safari « connexion non privée »** : le site est en HTTP mais Safari tente HTTPS. Sans certificat Let's Encrypt pour votre domaine, le port 443 peut servir un autre site du VPS avec un mauvais certificat. Exécutez la commande ci-dessus une fois.

---

## Étape 6 — Supabase (obligatoire pour la prod)

Dans **Supabase → Authentication → URL Configuration** :

| Champ | Valeur |
|-------|--------|
| Site URL | `https://votre-domaine.com` |
| Redirect URLs | `https://votre-domaine.com/auth/callback` |

---

## Étape 7 — Déploiement automatique (GitHub Actions)

### 7.1 Clé SSH pour GitHub

Sur votre PC :

```powershell
ssh-keygen -t ed25519 -C "github-deploy" -f "$env:USERPROFILE\.ssh\adel_deploy"
```

Copiez la clé **publique** sur le VPS :

```bash
# Sur le VPS
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Collez le contenu de adel_deploy.pub
```

### 7.2 Secrets GitHub

Repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | IP du VPS Contabo |
| `VPS_USER` | `root` (ou votre utilisateur SSH) |
| `VPS_SSH_KEY` | contenu du fichier `adel_deploy` (clé **privée**) |
| `VPS_PORT` | `22` (optionnel) |

### 7.3 Fonctionnement

À **chaque `git push` sur `main`**, GitHub Actions :

1. Se connecte au VPS en SSH
2. Exécute `deploy/deploy.sh`
3. Rebuild et redémarre l’application

**Workflow local après modification :**

```powershell
git add .
git commit -m "Description du changement"
git push
```

→ Le site est mis à jour en **2–5 minutes** automatiquement.

Suivez l’avancement : GitHub → onglet **Actions**.

---

## Vérifications

- [ ] `https://votre-domaine.com` s’affiche
- [ ] `/biens` liste les propriétés
- [ ] `/login` fonctionne (admin)
- [ ] Upload d’images admin OK
- [ ] Demande de réservation publique OK

---

## Commandes utiles sur le VPS

```bash
pm2 status                    # État de l'app
pm2 logs adel-immobilier      # Logs en direct
bash /var/www/adel-immobilier/deploy/deploy.sh   # Redéploiement manuel
systemctl status nginx        # État Nginx
```

---

## Dépannage

**Site inaccessible**
- Vérifiez DNS : `ping votre-domaine.com`
- Pare-feu Contabo : ports 80 et 443 ouverts
- `pm2 status` → l’app doit être `online`

**Build échoue**
- Vérifiez `.env.production` sur le serveur
- `pm2 logs adel-immobilier`

**Login admin ne marche pas**
- Vérifiez les Redirect URLs dans Supabase
- `role = admin` dans la table `profiles`

**GitHub Actions échoue**
- Vérifiez les secrets `VPS_*`
- Test SSH manuel : `ssh -i adel_deploy root@IP_VPS`

---

## Coûts

| Service | Coût |
|---------|------|
| Contabo VPS | déjà payé |
| Supabase | gratuit (tier free) |
| GitHub | gratuit |
| SSL Let's Encrypt | gratuit |
| Domaine | selon registrar |
