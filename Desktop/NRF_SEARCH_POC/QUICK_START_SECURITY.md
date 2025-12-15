# Quick Start - Security Remediation

## Immediate Actions Required

### 1. Create New Google API Key (5 minutes)

Visit: https://makersuite.google.com/app/apikey

1. Click "Create API Key"
2. Select your project: "Default Gemini Project" or create a new one
3. Copy the new API key (starts with `AIzaSy...`)
4. **IMPORTANT**: Add API restrictions:
   - Click on the key → Edit
   - Under "API restrictions", select "Restrict key"
   - Select: "Generative Language API" and "Vertex AI API"
   - Save

### 2. Configure Environment File (2 minutes)

```bash
cd fashion-agent-python-backend
cp .env.example .env
```

Edit the `.env` file and add your keys:

```env
GEMINI_API_KEY=your_new_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
```

**Save the file!**

### 3. Restart Services (1 minute)

```bash
# From the project root
./stop-all.sh
./start-all.sh
```

Check the Python backend log to verify it loads the API key:
```bash
tail -f logs/python-backend.log
```

You should see: `🔑 Using API key: AIzaSy...` (first 20 characters)

### 4. Test the Application (2 minutes)

1. Open http://localhost:3000
2. Try generating an image using the Fashion Agent (Alex)
3. Verify image generation works

### 5. Commit Security Fixes (3 minutes)

```bash
# Review the changes
git diff --staged

# Commit the security fixes
git commit -m "Security: Remove hardcoded API keys and use environment variables

- Removed hardcoded Google API key from image_generator.py and video_generator.py
- Added .env.example template for secure configuration
- Updated .gitignore to prevent Python cache files from being committed
- Added load_dotenv() to Python backend
- Deleted all __pycache__ files containing exposed key

Fixes security alert from Google Cloud Platform"

# Push to GitHub
git push origin main
```

### 6. Clean Git History (IMPORTANT - 10 minutes)

The old API key is still in your Git history. You MUST do this:

#### Option A: Using BFG Repo-Cleaner (Easiest)

```bash
# Install BFG
brew install bfg

# Run BFG to remove the exposed key
cd /Users/romelkumar/Desktop/NRF_SEARCH_POC
bfg --replace-text <(echo "AIzaSyA_-M5tsP5T8_57wHCowK-f8i_twhFm86A==>***REMOVED***")

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (rewrites history - warn team members first!)
git push origin --force --all
git push origin --force --tags
```

#### Option B: Manual Review

If you're not comfortable with force pushing:
1. Review the GitHub repository security alerts
2. The key is already deleted from Google Console, so it's inactive
3. Monitor your Google Cloud billing for unusual activity

### 7. Verify Everything Works

- [ ] New API key created in Google Console
- [ ] API key added to `.env` file
- [ ] Services restarted successfully
- [ ] Application works (image generation tested)
- [ ] Security fixes committed to Git
- [ ] Git history cleaned (optional but recommended)

## Next Time: Prevention

To prevent this from happening again:

1. **Never hardcode secrets** - Always use environment variables
2. **Use pre-commit hooks** - Install git-secrets:
   ```bash
   brew install git-secrets
   git secrets --install
   git secrets --add 'AIzaSy[A-Za-z0-9_-]{33}'
   ```
3. **Review before committing** - Check `git diff` before committing
4. **Keep .env in .gitignore** - Already done!

## Need Help?

- See [SECURITY_REMEDIATION.md](SECURITY_REMEDIATION.md) for detailed instructions
- Google Cloud Console: https://console.cloud.google.com/
- BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/

---

**Total Time**: ~25 minutes
**Priority**: HIGH - Complete steps 1-3 immediately to restore functionality
