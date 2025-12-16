# Style Profile Builder - Implementation Documentation

## Overview

The Style Profile Builder is the fifth and final GenAI feature in the AI Fashion Toolkit. It allows users to build a comprehensive personal style profile using **two different approaches**:

1. **Photo Analysis (Image-based)**: Upload 3-10 outfit photos for AI analysis
2. **Style Quiz (Questionnaire-based)**: Answer 8 visual questions about style preferences

Both approaches use Claude Sonnet 4.5 and return **identical StyleProfileResult** output.

---

## Features

### Dual-Mode Approach

**Why Two Modes?**
- **Privacy Concern**: Not everyone is comfortable sharing personal outfit photos
- **Convenience**: Questionnaire is faster and requires no image preparation
- **Accuracy vs Speed**: Image analysis is more accurate (based on actual wardrobe), while questionnaire is quicker and privacy-friendly

### Mode Selection Screen

When users select "Style Profile Builder" from the toolkit:

1. They see a **choice screen** with two side-by-side options:
   - **📸 Photo Analysis**
     - Upload 3-10 outfit photos
     - Most accurate results
     - Cost: $0.08-0.15
     - Time: 5-10 minutes
   - **📝 Style Quiz**
     - 8 visual questions
     - No photos needed
     - Cost: $0.02-0.04
     - Time: 3-5 minutes

2. Based on selection, the flow proceeds to either:
   - Image upload interface (existing)
   - Visual questionnaire (new)

---

## Image-Based Approach

### User Flow

1. User selects "Photo Analysis" mode
2. Uploads 3-10 outfit images via drag & drop
3. Clicks "Build Style Profile"
4. AI analyzes patterns across all images simultaneously
5. Results displayed with comprehensive style insights

### Technical Implementation

**Frontend**: [StyleProfilePanel.tsx](frontend/components/toolkit/StyleProfilePanel.tsx)
- Mode selection UI (lines 68-142)
- Image upload interface (lines 174-309)
- Reuses `ImageUploadZone` component

**Backend**: [styleProfile.tool.ts](backend/src/toolkit/tools/styleProfile.tool.ts)
- Analyzes 3-10 images using Claude Vision
- Identifies patterns: colors, styles, silhouettes, formality
- Returns comprehensive StyleProfileResult

**API Endpoint**: `POST /toolkit/build-style-profile`
- Validates 3-10 images
- Processes via Claude Vision with multi-image analysis
- Records usage: ~1000-5000 input tokens (depending on image count)

### Cost Breakdown (Image-based)
```
Claude Vision API:
- Input tokens: ~1000-5000 (varies with image count)
- Output tokens: ~800
- Cost: $0.08 - $0.15 per profile
```

---

## Questionnaire-Based Approach

### User Flow

1. User selects "Style Quiz" mode
2. Answers 8 visual questions with progress bar
3. Questions use emojis, color swatches, and icons for intuitive UX
4. Clicks "Generate My Style Profile" after final question
5. AI analyzes responses and generates identical StyleProfileResult
6. Results displayed using same component as image-based approach

### The 8 Questions

**Q1: Style Preference (Gender)**
- Options: Menswear 👔, Womenswear 👗, Gender-Neutral 👕, All Styles ✨
- Type: visual-select with emojis

**Q2: Color Palette**
- Options: Neutrals, Earth Tones, Pastels, Jewel Tones, Bold Colors, Monochrome
- Type: visual-select with actual color swatches
- Example: Neutrals shows chips for black, white, gray, beige, navy

**Q3: Everyday Style**
- Options: Classic 🎩, Trendy ✨, Minimalist ⚪, Bohemian 🌸, Edgy 🔥, Streetwear 👟, Athletic 🏃
- Type: icon-select with emojis and descriptions

**Q4: Formality Preference**
- Options: Very Casual 🩳, Casual 👕, Smart Casual 👔, Business Casual 👞, Formal 🤵
- Type: scale-select (horizontal slider-like buttons)

**Q5: Fit Preference**
- Options: Fitted, Slim, Regular/Relaxed, Oversized, Athletic
- Type: fit-visual with emojis and descriptions

**Q6: Pattern Preferences**
- Options: Solid Colors, Stripes, Floral, Geometric, Animal Print, Plaid/Checks, Polka Dots
- Type: multi-select (can choose multiple)

**Q7: Favorite Season**
- Options: Spring 🌸, Summer ☀️, Fall 🍂, Winter ❄️
- Type: season-select with seasonal color chips
- Example: Spring shows light pink, light green, yellow swatches

**Q8: Shopping Goal**
- Options: Refresh Wardrobe 🔄, Find My Style 🔍, Build Versatile Wardrobe 🎯, Special Occasions 🎉, Professional Upgrade 💼, Express Myself ✨
- Type: icon-select with emojis

### Technical Implementation

**Frontend**: [StyleProfileQuestionnaire.tsx](frontend/components/toolkit/StyleProfileQuestionnaire.tsx)
- 450+ lines of visual questionnaire UI
- Multi-step form with progress tracking
- 6 different question types (visual-select, icon-select, scale-select, fit-visual, multi-select, season-select)
- Framer Motion animations for smooth transitions
- State management for responses

**Backend**: [styleProfileQuestionnaire.tool.ts](backend/src/toolkit/tools/styleProfileQuestionnaire.tool.ts)
- Analyzes questionnaire responses using Claude
- Maps responses to StyleProfileResult structure:
  - `gender` + `everyday_style` → `style_personality`
  - `color_palette` → `signature_colors`
  - `formality` → `formality_preference`
  - `fit_preference` → `preferred_silhouettes`
  - `patterns` → `common_patterns`
  - `favorite_season` → detailed `seasonal_preferences`
  - `shopping_goal` → personalized `shopping_recommendations`
- Generates comprehensive analysis with 2500 max tokens

**API Endpoint**: `POST /toolkit/build-style-profile-questionnaire`
- Validates 8 required fields
- Processes via Claude text-based analysis
- Records usage: ~500-800 input tokens, ~800 output tokens

**API Client**: [toolkit.client.ts](frontend/lib/api/toolkit.client.ts)
```typescript
export interface QuestionnaireResponses {
  gender: string;
  color_palette: string;
  everyday_style: string;
  formality: string;
  fit_preference: string;
  patterns: string[];
  favorite_season: string;
  shopping_goal: string;
}

export async function buildStyleProfileFromQuestionnaire(
  responses: QuestionnaireResponses
): Promise<ToolkitResponse<StyleProfileResult>>
```

### Cost Breakdown (Questionnaire-based)
```
Claude API (text-only):
- Input tokens: ~500-800 (questionnaire prompt + responses)
- Output tokens: ~800
- Cost: $0.02 - $0.04 per profile
```

---

## Output Structure

Both approaches return **identical** `StyleProfileResult`:

```typescript
interface StyleProfileResult {
  // Core Identity
  signature_colors: string[];                    // ["navy blue", "white", "beige"]
  preferred_styles: string[];                    // ["minimalist", "smart casual"]
  style_personality: string;                     // "classic" | "trendy" | etc.
  formality_preference: string;                  // "casual" | "smart casual" | etc.

  // Details
  common_patterns: string[];                     // ["solid colors", "stripes"]
  preferred_silhouettes: string[];               // ["tailored", "slim fit"]

  // Seasonal Insights
  seasonal_preferences: {
    spring: string[];                            // ["Light jackets", "Chinos"]
    summer: string[];                            // ["Linen shirts", "Shorts"]
    fall: string[];                              // ["Sweaters", "Boots"]
    winter: string[];                            // ["Wool coats", "Layered looks"]
  };

  // Personalized Recommendations
  shopping_recommendations: {
    must_have_items: string[];                   // ["Quality leather belt", ...]
    colors_to_try: string[];                     // ["burgundy", "forest green"]
    styles_to_explore: string[];                 // ["Try bomber jacket", ...]
  };

  // Confidence Metrics
  style_consistency_score: number;               // 0-10
  confidence_level: number;                      // 0-10
  summary: string;                               // 2-3 sentence personalized summary
}
```

### Example Output

```json
{
  "signature_colors": ["navy blue", "white", "beige", "charcoal gray"],
  "preferred_styles": ["minimalist", "smart casual", "classic"],
  "style_personality": "classic",
  "formality_preference": "smart casual",
  "common_patterns": ["solid colors", "subtle stripes"],
  "preferred_silhouettes": ["tailored", "slim fit", "straight cut"],
  "seasonal_preferences": {
    "spring": ["Light trench coats", "Crisp white shirts", "Chinos in beige"],
    "summer": ["Linen shirts", "Tailored shorts", "Loafers"],
    "fall": ["Cashmere sweaters", "Dark wash jeans", "Chelsea boots"],
    "winter": ["Wool overcoats", "Turtlenecks", "Layered looks"]
  },
  "shopping_recommendations": {
    "must_have_items": [
      "Quality leather belt in brown",
      "Versatile navy blazer",
      "White oxford shirt",
      "Dark wash straight-leg jeans"
    ],
    "colors_to_try": ["burgundy", "forest green", "camel"],
    "styles_to_explore": [
      "Try adding a casual bomber jacket",
      "Experiment with textured knits"
    ]
  },
  "style_consistency_score": 8,
  "confidence_level": 8,
  "summary": "You have a refined classic minimalist style with a preference for neutral colors and tailored silhouettes. Your smart casual aesthetic is both timeless and versatile, perfect for creating a cohesive wardrobe. The structured pieces you favor will serve as excellent foundations for building a polished, sophisticated look."
}
```

---

## Results Display

**Component**: [StyleProfileResults.tsx](frontend/components/toolkit/StyleProfileResults.tsx)

Both approaches show results using the **same results component**:

### Display Sections

1. **Header**
   - Gradient banner (indigo → purple)
   - Confidence level badge (color-coded: green 8+, yellow 6-7, orange <6)

2. **Style Summary**
   - Personalized 2-3 sentence overview
   - Italic quote-style formatting

3. **Style Identity Cards** (3 cards)
   - **Personality**: Classic, Trendy, Minimalist, etc.
   - **Formality**: Casual, Smart Casual, Business Casual, Formal
   - **Consistency Score**: 0-10 with color coding

4. **Signature Colors**
   - Animated color chips (Framer Motion)
   - Gradient background (indigo/purple)
   - Capitalized color names

5. **Preferred Styles**
   - Style category badges
   - Border styling with animation

6. **Common Patterns & Silhouettes** (2-column grid)
   - Bulleted lists
   - Color-coded bullets (indigo for patterns, purple for silhouettes)

7. **Seasonal Preferences** (4 cards)
   - **Spring**: Green background 🌸
   - **Summer**: Yellow background ☀️
   - **Fall**: Orange background 🍂
   - **Winter**: Blue background ❄️
   - Each season shows relevant clothing items

8. **Shopping Recommendations**
   - **Must-Have Items**: Purple-themed section
   - **Colors to Try**: Pink-themed color chips
   - **Styles to Explore**: Indigo-themed bulleted list

9. **Disclaimer**
   - Gray footer with usage note

---

## Cost Tracking

Both approaches are fully integrated with the session-based cost tracking system:

### BigQuery Recording

```typescript
await costTracker.recordUsage({
  session_id: sessionId,
  tool_name: 'style_profile' | 'style_profile_questionnaire',
  input_tokens: usage.input_tokens,
  output_tokens: usage.output_tokens,
  cost_usd: totalCost,
  image_count: images.length | 0,  // 0 for questionnaire
});
```

### Session Usage Response

Every API call returns:
```json
{
  "success": true,
  "tool_name": "style_profile" | "style_profile_questionnaire",
  "result": { /* StyleProfileResult */ },
  "usage": {
    "input_tokens": 1200,
    "output_tokens": 800,
    "cost_usd": 0.028
  },
  "session_usage": {
    "total_cost": 0.45,
    "remaining_budget": 99.55,
    "usage_percentage": 0.45,
    "warning_level": "none"
  }
}
```

---

## File Structure

### Backend Files

```
backend/src/
├── toolkit/tools/
│   ├── styleProfile.tool.ts                    # Image-based analysis
│   └── styleProfileQuestionnaire.tool.ts       # Questionnaire-based analysis (NEW)
├── routes/
│   └── toolkit.routes.ts                       # Both endpoints
└── types/
    └── toolkit.ts                              # StyleProfileResult type
```

### Frontend Files

```
frontend/
├── components/toolkit/
│   ├── StyleProfilePanel.tsx                   # Mode selection + image upload
│   ├── StyleProfileQuestionnaire.tsx           # 8-question quiz (NEW)
│   └── StyleProfileResults.tsx                 # Results display (shared)
├── lib/
│   ├── api/toolkit.client.ts                   # API functions
│   └── types/toolkit.ts                        # Type definitions
└── components/
    └── FashionToolkitPanel.tsx                 # Toolkit integration
```

---

## API Endpoints

### 1. Image-Based Style Profile

**Endpoint**: `POST /toolkit/build-style-profile`

**Request**:
```json
{
  "session_id": "user-session-123",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",  // 3-10 base64 images
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ]
}
```

**Response**: See "Output Structure" section above

**Validation**:
- Minimum 3 images required
- Maximum 10 images allowed
- Valid base64 data URLs

### 2. Questionnaire-Based Style Profile

**Endpoint**: `POST /toolkit/build-style-profile-questionnaire`

**Request**:
```json
{
  "session_id": "user-session-123",
  "responses": {
    "gender": "menswear",
    "color_palette": "neutrals",
    "everyday_style": "minimalist",
    "formality": "smart_casual",
    "fit_preference": "slim",
    "patterns": ["solid", "stripes"],
    "favorite_season": "fall",
    "shopping_goal": "versatility"
  }
}
```

**Response**: Same as image-based (identical `StyleProfileResult`)

**Validation**:
- All 8 fields required
- `patterns` must be an array
- Other fields must be strings

---

## Key Implementation Details

### Mode Selection Logic

```typescript
type ProfileMode = 'image' | 'questionnaire' | null;
const [mode, setMode] = useState<ProfileMode>(null);

// Mode selection screen
if (!mode) {
  return <ModeSelectionScreen />;
}

// Questionnaire mode
if (mode === 'questionnaire') {
  return <StyleProfileQuestionnaire />;
}

// Image mode (default)
return <ImageUploadInterface />;
```

### Questionnaire State Management

```typescript
const [currentStep, setCurrentStep] = useState(0);
const [responses, setResponses] = useState<Record<string, any>>({});

const handleAnswer = (value: any) => {
  setResponses({ ...responses, [currentQuestion.id]: value });
};

const handleNext = () => {
  if (currentStep < QUESTIONS.length - 1) {
    setCurrentStep(currentStep + 1);
  } else {
    handleGenerateProfile();  // Call API on last question
  }
};
```

### Backend Analysis Strategy

**Image-Based**:
1. Claude Vision analyzes all images simultaneously
2. Identifies patterns across multiple outfits
3. Infers style based on actual wardrobe

**Questionnaire-Based**:
1. Claude analyzes structured responses
2. Maps answers to style attributes using predefined logic
3. Generates recommendations based on stated preferences

Both use identical prompt structure to ensure consistent output format.

---

## Testing Checklist

### Image-Based Flow
- [ ] Upload 3 images → Should accept and enable button
- [ ] Upload 2 images → Should show error "Need 1 more"
- [ ] Upload 11 images → Should show error "Maximum 10 allowed"
- [ ] Valid 5-image upload → Profile generates successfully
- [ ] Results show all 10 sections correctly
- [ ] Cost tracking updates correctly (~$0.08-0.15)
- [ ] "Build Another Profile" resets to mode selection

### Questionnaire Flow
- [ ] Select "Style Quiz" → Shows question 1
- [ ] Progress bar updates with each step (12.5%, 25%, etc.)
- [ ] Can go back/forward between questions
- [ ] Multi-select question allows multiple selections
- [ ] Color palette shows actual color swatches
- [ ] Season selection shows seasonal colors
- [ ] Last question shows "Generate Profile" instead of "Next"
- [ ] Profile generates successfully
- [ ] Results identical structure to image-based
- [ ] Cost tracking updates correctly (~$0.02-0.04)
- [ ] "Build Another Profile" resets to mode selection

### Error Handling
- [ ] Budget exceeded → Shows error before processing
- [ ] Invalid questionnaire response → Shows validation error
- [ ] Network timeout → Shows user-friendly error
- [ ] Claude API error → Logs error and shows generic message

---

## Future Enhancements

### Possible Improvements

1. **Save Style Profiles**
   - Allow users to save multiple profiles
   - Compare profiles over time
   - Track style evolution

2. **Hybrid Approach**
   - Combine questionnaire + photos for maximum accuracy
   - Use questionnaire to filter/weight image analysis

3. **Product Recommendations**
   - Link shopping recommendations to actual catalog products
   - "Shop Your Style" button → Visual Search with style filters

4. **Style Profile Sharing**
   - Export as PDF/image
   - Share with personal stylist
   - Use as shopping assistant reference

5. **AI Styling Suggestions**
   - "Outfit of the Day" based on profile
   - Mix & match existing wardrobe items
   - Seasonal capsule wardrobe builder

6. **Profile Refinement**
   - "Update My Profile" with additional questions
   - Upload new outfit photos to refine analysis
   - Adjust preferences over time

---

## Comparison: Image vs Questionnaire

| Aspect | Image-Based | Questionnaire-Based |
|--------|-------------|---------------------|
| **Accuracy** | Higher (actual wardrobe) | Good (stated preferences) |
| **Privacy** | Requires personal photos | No photos needed |
| **Time** | 5-10 minutes | 3-5 minutes |
| **Cost** | $0.08-0.15 | $0.02-0.04 |
| **User Effort** | Find & upload photos | Answer 8 questions |
| **Best For** | Users with outfit photos | Privacy-conscious users |
| **Analysis Type** | Pattern recognition | Preference mapping |
| **Confidence Level** | 7-10 | 6-8 |

---

## Success Metrics

✅ **Completed Features**:
- Dual-mode approach (image + questionnaire)
- Mode selection UI with clear benefits
- 8-question visual questionnaire
- Both approaches return identical output
- Shared results display component
- Cost tracking for both methods
- Error handling and validation
- Progress tracking in questionnaire
- Framer Motion animations
- Responsive design

✅ **User Experience**:
- Users can choose based on privacy/accuracy preference
- Visual hints make questionnaire quick and intuitive
- Consistent results regardless of approach
- Clear cost/time estimates upfront

✅ **Technical Quality**:
- Type-safe implementations
- Reusable components
- Efficient API calls
- Proper error handling
- Session-based cost tracking

---

## Conclusion

The Style Profile Builder successfully implements a **privacy-first, user-centric approach** to personal style analysis. By offering two distinct methods with identical outputs, we accommodate different user preferences while maintaining consistent quality.

The questionnaire-based approach addresses the critical privacy concern raised during development, while the image-based approach provides superior accuracy for users comfortable sharing photos. Both leverage Claude Sonnet 4.5's powerful analysis capabilities to deliver comprehensive, actionable style insights.

**Status**: ✅ **Feature Complete and Production-Ready**
