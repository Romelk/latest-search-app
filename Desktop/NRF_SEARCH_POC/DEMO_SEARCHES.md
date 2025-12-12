# Demo Search Queries for NRF Search POC

## Intent Type: CLEAR (Precise, Specific Searches)

### 1. "men blue tshirt"
**Why it works:** Gender-specific, color, category all present in data
**Expected:** Returns men's blue t-shirts from various brands
**Demo talking point:** "Notice how it filters by gender using 'men' prefix and finds blue t-shirts"

### 2. "women red dress"
**Why it works:** Gender, color, and category well-represented in Myntra data
**Expected:** Returns women's red dresses
**Demo talking point:** "Smart gender filtering ensures only women's items appear"

### 3. "nike shoes"
**Why it works:** Brand search - Nike is in the dataset
**Expected:** Returns Nike footwear products
**Demo talking point:** "Brand-specific search with intelligent matching"

### 4. "white formal shirt"
**Why it works:** Color + style + category combination
**Expected:** Returns white formal/dress shirts
**Demo talking point:** "Combines color and occasion appropriately - won't show casual tees"

### 5. "black jeans"
**Why it works:** Simple color + category search
**Expected:** Returns black denim jeans
**Demo talking point:** "Straightforward search with accurate color matching"

---

## Intent Type: AMBIGUOUS (Broad, Needs Refinement)

### 1. "shirt"
**Why it works:** Single category term triggers refinement chips
**Expected:** Shows refinement chips for style (formal/casual), color, price, fit
**Demo talking point:** "Too broad - system offers refinement options instead of overwhelming with all shirts"

### 2. "dress"
**Why it works:** Generic category without context
**Expected:** Refinement chips appear for style, color, occasion, price
**Demo talking point:** "AI recognizes ambiguity and helps narrow down preferences"

### 3. "shoes"
**Why it works:** Broad category with many subcategories
**Expected:** Chips for type (sports/casual/formal), color, brand, price
**Demo talking point:** "Guided discovery - helps user find exactly what they want"

### 4. "jacket"
**Why it works:** Could be formal, casual, winter, sports - needs context
**Expected:** Refinement for style, weather (winter/light), occasion
**Demo talking point:** "System understands one word isn't enough context"

### 5. "tshirt"
**Why it works:** Very common item with lots of variety
**Expected:** Chips for gender, color, style (graphic/plain), price
**Demo talking point:** "Instead of 5000 t-shirts, let's help you find THE t-shirt"

---

## Intent Type: GOAL (Conversational, Context-Rich)

### 1. "I need an outfit for my job interview next week"
**Why it works:** Clear occasion (interview), implies professional attire needed
**Expected:**
- AI asks: "Who are you shopping for?" → "Myself"
- AI asks: "Gender?" → "Male/Female"
- AI presents: Professional outfit options (formal shirts, trousers, blazer)
**Demo talking point:** "Natural language → Curated complete looks, not just random products"

### 2. "I'm attending a wedding in December, need something warm and formal"
**Why it works:** Occasion + season + style requirements
**Expected:**
- AI asks about gender if not clear
- Suggests: Formal wear with warm layering (blazer + shirt, or dress with jacket)
**Demo talking point:** "Context-aware - understands December = cold, wedding = formal"

### 3. "Looking for casual weekend wear for my teenage son"
**Why it works:** Specifies age group, occasion, relationship
**Expected:**
- AI confirms: "Shopping for teenage boy, casual style"
- Suggests: Casual tshirts, jeans, comfortable fits
**Demo talking point:** "Understands family shopping and age-appropriate styles"

### 4. "I have a team dinner at a nice restaurant tomorrow"
**Why it works:** Social occasion with implied dress code
**Expected:**
- AI asks gender
- Suggests: Smart casual options (not too formal, not too casual)
- Male: Shirt + chinos/dark jeans
- Female: Dress or top + skirt/trousers
**Demo talking point:** "AI knows 'nice restaurant' ≠ formal wedding but ≠ gym either"

### 5. "Need gym clothes for my morning workout routine"
**Why it works:** Clear activity type and purpose
**Expected:**
- AI asks gender
- Suggests athletic/sports wear combinations
- Items: Track pants, sports tshirts, athletic shoes
**Demo talking point:** "Activity-based recommendations - won't suggest formal wear for gym!"

---

## Special Demo Scenarios

### Scenario: Smart Size Handling
**Search:** "white formal shirt size medium"
**What happens:**
1. System searches for white formal shirts (finds them!)
2. Ignores size filter (most products don't have size data)
3. AI fulfillment message: "Found white formal shirts! Note: Size information varies by product - check individual listings"
**Demo talking point:** "Honest communication - finds what exists, explains what's missing"

### Scenario: Gender Mismatch Prevention
**Search:** "I need an outfit for an interview" → Select "Male"
**What happens:**
1. AI searches for "men shirt", "men trousers", "men blazer"
2. Validation layer filters out any women's items that slip through
3. Final result: 100% appropriate for male interview
**Demo talking point:** "Prevents embarrassing mistakes - no women's clothes for male users"

### Scenario: Inappropriate Item Filtering
**Search:** "formal dress for team dinner"
**What happens:**
1. BigQuery returns dresses + some hygiene products (keyword match on 'formal')
2. AI validation: Rejects panty liners, sanitary pads, non-clothing
3. Shows only actual dresses
**Demo talking point:** "AI common sense - would never show hygiene products for clothing search"

---

## Tips for Effective Demo

### Start with CLEAR searches
- Shows immediate value - fast, accurate results
- "Look how quickly it finds exactly what you asked for"

### Move to AMBIGUOUS
- Shows intelligence - "It knows when to ask for help"
- Interactive refinement feels engaging

### Finish with GOAL
- The wow factor - "This is shopping assistant, not search box"
- Shows multi-turn conversation and outfit composition

### Key Talking Points

1. **Gender-Aware Search**:
   - "Notice 'men' in search finds men's products - embedded in titles, not separate field"

2. **Smart Filtering**:
   - "System knows our data doesn't have size for most items - doesn't fail the search"

3. **AI Validation**:
   - "Post-search intelligence filters nonsense - panty liners never show up for 'dress'"

4. **Honest Communication**:
   - "If we don't have what you asked for, we tell you - then show closest alternatives"

5. **Context Understanding**:
   - "Interview → formal, Weekend → casual, Gym → athletic - AI knows the dress code"

---

## Data Enhancement Recommendations (Post-Demo)

If you want to enhance the demo further, update these fields:

```sql
-- Add sizes to shirts/tshirts
UPDATE products SET size = 'M' WHERE category IN ('shirt', 'tshirts') AND RAND() < 0.3
UPDATE products SET size = 'L' WHERE category IN ('shirt', 'tshirts') AND size IS NULL AND RAND() < 0.4

-- Add fits
UPDATE products SET fit = 'slim' WHERE category IN ('shirt', 'jeans') AND RAND() < 0.3
UPDATE products SET fit = 'regular' WHERE category IN ('shirt', 'jeans') AND fit IS NULL

-- Add styles
UPDATE products SET style = 'formal' WHERE category IN ('shirt', 'trousers') AND RAND() < 0.4
UPDATE products SET style = 'casual' WHERE category IN ('tshirts', 'jeans') AND RAND() < 0.6
```

---

## Quick Demo Script

**30-Second Version:**
1. "blue formal shirt" → Instant results
2. "I need outfit for interview" → Choose Male → See curated looks
3. Done!

**2-Minute Version:**
1. CLEAR: "men blue tshirt" → Fast results
2. AMBIGUOUS: "dress" → See refinement chips
3. GOAL: "interview outfit" → Conversation → Curated looks
4. Show product detail modal with ratings/pricing

**5-Minute Full Demo:**
- All three intent types
- Show gender filtering working
- Demonstrate AI validation (search something that might return junk)
- Show fulfillment messaging
- Product details with Myntra integration
- End with outfit composition showing complete looks
