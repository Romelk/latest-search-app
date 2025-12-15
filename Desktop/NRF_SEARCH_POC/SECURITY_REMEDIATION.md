# Security Remediation Guide - API Key Exposure

## Incident Summary

A Google API key was accidentally committed to the GitHub repository and was detected by Google Cloud's security scanning. The key has been deleted from the Google Console.

**Exposed Key**: `AIzaSyA_-M5tsP5T8_57wHCowK-f8i_twhFm86A` (DELETED)
**Project**: Default Gemini Project (gen-lang-client-0389686855)
**Location**: GitHub repository in Python cache files (`__pycache__`)

## Actions Taken

### 1. Code Cleanup ✅
- Removed hardcoded API key from [image_generator.py](fashion-agent-python-backend/image_generator.py)
- Removed hardcoded API key from [video_generator.py](fashion-agent-python-backend/video_generator.py)
- Deleted all `__pycache__` directories containing compiled bytecode with the key
- Updated code to use environment variables exclusively

### 2. Security Improvements ✅
- Enhanced [.gitignore](.gitignore) to prevent Python cache files from being committed
- Added `.env.example` template for secure configuration
- Added `load_dotenv()` to Python backend to load environment variables
- Both Python files now only read from environment variables

### 3. Remaining Actions ⚠️

You need to complete these steps:

#### A. Create New Google API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey) or [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new API key for the Gemini API
3. **IMPORTANT**: Add restrictions to the key:
   - API restrictions: Only allow "Generative Language API" and "Vertex AI API"
   - Application restrictions: Consider adding HTTP referrer or IP restrictions
4. Copy the new API key

#### B. Configure Environment Variables

Create a `.env` file in the `fashion-agent-python-backend` directory:

```bash
cd fashion-agent-python-backend
cp .env.example .env
```

Edit `.env` and add your new API key:

```env
GEMINI_API_KEY=your_new_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
```

**IMPORTANT**: Never commit the `.env` file to git!

#### C. Clean Git History

The exposed key still exists in your Git history. You need to remove it:

**Option 1: Using BFG Repo-Cleaner (Recommended)**

```bash
# Install BFG (if not already installed)
brew install bfg  # macOS
# OR download from: https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy of your repo
cd ~/Desktop
git clone https://github.com/Romelk/latest-search-app.git repo-backup
cd latest-search-app

# Run BFG to remove the exposed key from history
bfg --replace-text <(echo "AIzaSyA_-M5tsP5T8_57wHCowK-f8i_twhFm86A==>***REMOVED***")

# Clean up and force push
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push to GitHub (WARNING: This rewrites history!)
git push origin --force --all
git push origin --force --tags
```

**Option 2: Using git filter-repo (Alternative)**

```bash
# Install git-filter-repo
brew install git-filter-repo  # macOS

# Remove the key from all commits
git filter-repo --replace-text <(echo "AIzaSyA_-M5tsP5T8_57wHCowK-f8i_twhFm86A==>***REMOVED***")

# Force push to GitHub
git push origin --force --all
```

**Option 3: GitHub Secret Scanning Alert**

GitHub may have also detected this. Check:
1. Go to your repository on GitHub
2. Navigate to Settings → Security → Secret scanning alerts
3. Resolve any alerts related to this key

#### D. Verify Changes

After creating the new key and setting up environment variables:

```bash
# Restart all services
./stop-all.sh
./start-all.sh

# Check that the Python backend starts without errors
tail -f logs/python-backend.log
```

You should see the API key being loaded (first 20 characters will be shown).

## Prevention Measures

### For Future Development

1. **Never hardcode secrets** - Always use environment variables
2. **Use .env files** - Keep secrets in `.env` (already in `.gitignore`)
3. **Review before commit** - Check for sensitive data before committing
4. **Use git hooks** - Consider using pre-commit hooks to scan for secrets
5. **Enable secret scanning** - GitHub's secret scanning is already enabled

### Recommended Tools

- [git-secrets](https://github.com/awslabs/git-secrets) - Prevents committing secrets
- [pre-commit](https://pre-commit.com/) - Git hook framework
- [detect-secrets](https://github.com/Yelp/detect-secrets) - Secret detection

### Install git-secrets (Optional but Recommended)

```bash
# macOS
brew install git-secrets

# Configure for this repo
cd /Users/romelkumar/Desktop/NRF_SEARCH_POC
git secrets --install
git secrets --register-aws
git secrets --add 'AIzaSy[A-Za-z0-9_-]{33}'  # Google API key pattern
```

## Security Checklist

- [x] Deleted compromised API key from Google Console
- [x] Removed hardcoded keys from source code
- [x] Updated `.gitignore` to prevent cache files
- [x] Created `.env.example` template
- [x] Updated code to use environment variables
- [ ] Created new Google API key with restrictions
- [ ] Configured `.env` file with new key
- [ ] Cleaned Git history to remove exposed key
- [ ] Force pushed cleaned history to GitHub
- [ ] Verified application works with new key
- [ ] Notified team members (if applicable)

## Additional Recommendations

1. **Enable 2FA** on your Google Cloud account
2. **Review billing** for any unusual Gemini API usage during the exposure period
3. **Monitor API usage** in Google Cloud Console for the next few days
4. **Consider using Secret Manager** for production deployments
5. **Review other repositories** for similar issues

## Support

If you need help with any of these steps:
- Google Cloud Console: https://console.cloud.google.com/
- GitHub Security: https://docs.github.com/en/code-security
- BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/

---

**Created**: 2025-12-15
**Incident**: Google API Key Exposure
**Status**: Partially Remediated - User action required
