# Vertex AI Gemini Model Access Setup

## Issue
Free Trial GCP accounts do not have automatic access to Gemini models. You need to explicitly enable them through the Vertex AI Model Garden.

## Solution Steps

### 1. Enable Gemini in Model Garden
Visit the Vertex AI Model Garden and enable Gemini 1.5 Flash:

**Direct Link:** https://console.cloud.google.com/vertex-ai/model-garden?project=nrf-search-demo

**Steps:**
1. Log in with: `romelkumar83@gmail.com`
2. Ensure project `nrf-search-demo` is selected (top dropdown)
3. Search for "Gemini 1.5 Flash" in the search bar
4. Click on the model card
5. Click "Enable" or "Get Started" button
6. Wait for activation (can take 2-5 minutes)

### 2. Check Quotas (If Needed)
If you see errors about quotas after enabling:

**Direct Link:** https://console.cloud.google.com/iam-admin/quotas?project=nrf-search-demo

**Steps:**
1. Filter by service: "Vertex AI API"
2. Search for "Gemini" or "Generate"
3. Look for any quotas showing "0" or "None"
4. Click "Edit Quota" and request:
   - Requests per minute: 5
   - Tokens per minute: 10000
5. Submit quota increase request

### 3. Verify Billing
If quota requests are blocked:

**Direct Link:** https://console.cloud.google.com/billing?project=nrf-search-demo

**Steps:**
1. Ensure Free Trial billing account is linked
2. Verify you have remaining free credits
3. If needed, upgrade from Free Trial to paid account:
   - Click "Upgrade" (you keep your $300 credits)
   - Add payment method for verification
   - No charges until credits are exhausted

## Common Issues

### "Model not found" Error
- **Cause:** Model not enabled in Model Garden
- **Fix:** Follow Step 1 above

### "Quota exceeded" or "Zero quota" Error
- **Cause:** Default quota is 0 for new accounts
- **Fix:** Follow Step 2 above

### Region Availability
- **US Central 1:** All Gemini models available ✅
- **Asia South 1 (Mumbai):** Gemini 1.5 Pro/Flash available ✅
- **Other regions:** Check Model Garden for availability

## Testing After Setup

After enabling, test with this command:
```bash
cd /Users/romelkumar/Desktop/NRF_SEARCH_POC
./test-gemini.sh
```

Expected response: JSON with model's "OK" response (not a 404 error)

## References
- [Vertex AI Model Garden](https://cloud.google.com/vertex-ai/docs/start/explore-models)
- [Gemini API Quickstart](https://cloud.google.com/vertex-ai/generative-ai/docs/start/quickstarts/quickstart-multimodal)
- [GCP Free Trial Details](https://cloud.google.com/free)

---

**Current Status:** ⏳ Waiting for you to enable Gemini in Model Garden
