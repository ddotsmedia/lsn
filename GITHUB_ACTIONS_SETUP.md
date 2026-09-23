# GitHub Actions SSH Deployment Setup

## Step 1: SSH into VPS and Run Setup

```bash
ssh root@194.164.151.202

# Create deploy user if not exists
if ! id deploy &>/dev/null; then
    sudo useradd -m -s /bin/bash deploy
    sudo usermod -aG docker deploy
fi

# Prepare SSH directory
sudo mkdir -p /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh

# Create /opt/lsn
sudo mkdir -p /opt/lsn
sudo chown deploy:deploy /opt/lsn

# Copy deploy.sh to VPS
# (You'll do this after copying from repo)

# Exit VPS
exit
```

## Step 2: Generate SSH Key (Local Machine)

```bash
cd $HOME/.ssh
ssh-keygen -t ed25519 -f github_deploy_key -N "" -C "github-actions@lsn"
# This creates: github_deploy_key (private) and github_deploy_key.pub (public)
```

## Step 3: Add Public Key to VPS

```bash
cat ~/.ssh/github_deploy_key.pub | ssh root@194.164.151.202 "cat >> /home/deploy/.ssh/authorized_keys && chmod 600 /home/deploy/.ssh/authorized_keys"
```

## Step 4: Copy deploy.sh to VPS

```bash
scp ./deploy.sh root@194.164.151.202:/opt/lsn/deploy.sh
ssh root@194.164.151.202 "chmod +x /opt/lsn/deploy.sh && chown deploy:deploy /opt/lsn/deploy.sh"
```

## Step 5: Add GitHub Secrets

Go to: https://github.com/ddotsmedia/lsn/settings/secrets/actions

Add these 5 secrets:
- **DEPLOY_KEY**: Content of `~/.ssh/github_deploy_key` (private key)
- **DEPLOY_HOST**: `194.164.151.202`
- **DEPLOY_USER**: `deploy`
- **DEPLOY_PORT**: `22`
- **DEPLOY_KEY_PASSPHRASE**: (leave empty)

## Step 6: Push Changes to GitHub

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions SSH deployment"
git push origin main
```

GitHub Actions will now auto-deploy on every push to main!
