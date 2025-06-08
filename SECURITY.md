# 🔒 Security Guide - Family Command Center

This document outlines security best practices for the Family Command Center project.

## 🚨 **CRITICAL: What NOT to Commit to Public Repository**

### ❌ **Never Commit These Files:**
- `src/` - Backend source code
- `deploy.sh` - Deployment scripts
- `cloudformation-template.yaml` - Infrastructure code
- `.env` files - Environment variables
- AWS credentials or keys
- `config.json` with sensitive data
- Database connection strings
- API keys or secrets

### ✅ **Safe to Commit:**
- `index.html` - Frontend code
- `config.js` - Client-side configuration (no secrets)
- `README.md` - Public documentation
- Static assets (images, CSS, etc.)
- `.gitignore` - This protects you!

## 🏗️ **Recommended Repository Structure**

### Option 1: Separate Repositories (Recommended)
```
📁 familycommandcenter.github.io (PUBLIC)
├── index.html
├── config.js
├── README.md
├── .gitignore
└── assets/ (if any)

📁 family-command-center-api (PRIVATE)
├── src/
├── deploy.sh
├── cloudformation-template.yaml
├── package.json
└── README-Backend.md
```

### Option 2: Single Repository with Proper .gitignore (Current)
```
📁 familycommandcenter.github.io (PUBLIC)
├── index.html          ✅ Public
├── config.js           ✅ Public  
├── README.md           ✅ Public
├── .gitignore          ✅ Public
├── src/                ❌ Ignored by .gitignore
├── deploy.sh           ❌ Ignored by .gitignore
└── cloudformation-*    ❌ Ignored by .gitignore
```

## 🛡️ **Security Best Practices**

### 1. **AWS Credentials Management**
```bash
# ✅ Good: Use AWS CLI profiles
aws configure --profile family-center
export AWS_PROFILE=family-center

# ❌ Bad: Never hardcode credentials
AWS_ACCESS_KEY_ID=AKIA... # DON'T DO THIS
```

### 2. **Environment Variables**
```bash
# ✅ Good: Use environment variables for deployment
export DYNAMODB_TABLE_NAME=FamilyCommandCenter-dev
export AWS_REGION=us-east-1

# ❌ Bad: Hardcoded in source files
const tableName = "FamilyCommandCenter-dev"; // DON'T DO THIS
```

### 3. **API Configuration**
```javascript
// ✅ Good: Public frontend configuration
const CONFIG = {
  API: {
    BASE_URL: 'https://abc123.execute-api.us-east-1.amazonaws.com/dev'
  }
};

// ❌ Bad: Exposing internal details
const CONFIG = {
  AWS_ACCESS_KEY: 'AKIA...', // NEVER DO THIS
  SECRET_KEY: 'abc123...'     // NEVER DO THIS
};
```

## 🚀 **Secure Deployment Process**

### Step 1: Setup Private Environment
```bash
# Create a separate directory for backend deployment
mkdir ~/family-command-center-private
cd ~/family-command-center-private

# Copy backend files here (not in public repo)
cp -r /path/to/src ./
cp /path/to/deploy.sh ./
cp /path/to/cloudformation-template.yaml ./
```

### Step 2: Deploy Backend Privately
```bash
# Set up AWS credentials (never commit these!)
aws configure

# Deploy from private location
./deploy.sh dev
```

### Step 3: Update Public Frontend
```bash
# Update config.js with the API URL from deployment
# This is safe to commit since it's just a public endpoint
```

## 🔍 **Monitoring & Auditing**

### Regular Security Checks
```bash
# Check what's being tracked by git
git ls-files

# Scan for potential secrets (use tools like git-secrets)
git secrets --scan

# Review commits before pushing
git log --oneline -5
```

### GitHub Repository Settings
1. **Enable branch protection** on main branch
2. **Require review** for pull requests
3. **Enable security alerts** for dependencies
4. **Scan for secrets** in GitHub Security tab

## 🆘 **If You Accidentally Commit Secrets**

### Immediate Actions:
1. **Rotate credentials** immediately
2. **Remove from history** using git filter-branch or BFG
3. **Force push** to overwrite history
4. **Update all team members**

```bash
# Remove file from entire git history
git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch path/to/secret/file' \
--prune-empty --tag-name-filter cat -- --all

# Force push to remote
git push origin --force --all
```

## 📋 **Security Checklist**

Before each deployment:

- [ ] `.gitignore` is properly configured
- [ ] No AWS credentials in code
- [ ] No hardcoded secrets or URLs
- [ ] Backend code is not public
- [ ] Environment variables are used
- [ ] API endpoints are public-safe
- [ ] Dependencies are up to date
- [ ] Repository secrets are properly configured

## 🔐 **Additional Security Measures**

### For Production Use:
1. **API Authentication**: Add AWS Cognito or API keys
2. **Rate Limiting**: Implement in API Gateway
3. **HTTPS Only**: Ensure all traffic is encrypted
4. **Input Validation**: Sanitize all user inputs
5. **CORS Restrictions**: Limit to your domain only
6. **Monitoring**: Set up CloudWatch alerts

### Family-Specific Considerations:
- Data is **family-internal only** (no external sharing)
- **No sensitive personal information** stored
- **Simple authentication** sufficient (or none needed)
- Focus on **convenience over complexity**

## 📞 **Security Incident Response**

If you suspect a security issue:

1. **Immediately** rotate any exposed credentials
2. **Review** CloudWatch logs for unusual activity
3. **Update** API keys and redeploy
4. **Monitor** for unusual charges in AWS billing
5. **Document** what happened and how to prevent it

---

🛡️ **Remember**: Security is about **layers of protection**, not perfection. Following these guidelines will keep your Family Command Center safe and secure! 