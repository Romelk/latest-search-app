# Architecture Documentation

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Browser                            │
│                     (React/Next.js Frontend)                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Cloud Run - Frontend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Landing Page │→ │ Search Page  │→ │ UI Components        │  │
│  └──────────────┘  └──────────────┘  │ - ProductCard        │  │
│                                       │ - Carousel           │  │
│                                       │ - ChatPanel          │  │
│                                       │ - FiltersBar         │  │
│                                       │ - LookCard           │  │
│                                       └──────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               │ REST API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Cloud Run - Backend                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Express.js API                         │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────┐  │   │
│  │  │ Search Intent  │  │ Search Results │  │ Clarify    │  │   │
│  │  │ /search-intent │  │ /search-results│  │ /clarify   │  │   │
│  │  └────────────────┘  └────────────────┘  └────────────┘  │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────┐  │   │
│  │  │ Compose        │  │ Explain        │  │ Analytics  │  │   │
│  │  │ /compose       │  │ /explain       │  │ /analytics │  │   │
│  │  └────────────────┘  └────────────────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────┬─────────────────────────────┬────────────────────────┘
            │                             │
            │                             │
            ▼                             ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   Vertex AI - Gemini     │   │       BigQuery           │
│                          │   │                          │
│  ┌────────────────────┐  │   │  ┌────────────────────┐  │
│  │  Intent Agent      │  │   │  │ Products Table     │  │
│  │  - CLEAR           │  │   │  │ - product_id       │  │
│  │  - AMBIGUOUS       │  │   │  │ - title, brand     │  │
│  │  - GOAL            │  │   │  │ - price, color     │  │
│  └────────────────────┘  │   │  │ - category, size   │  │
│  ┌────────────────────┐  │   │  │ - occasion_tags    │  │
│  │  Clarifier Agent   │  │   │  └────────────────────┘  │
│  │  - Questions       │  │   │  ┌────────────────────┐  │
│  │  - Options         │  │   │  │ Analytics Events   │  │
│  └────────────────────┘  │   │  │ - session_id       │  │
│  ┌────────────────────┐  │   │  │ - event_name       │  │
│  │  Explainer Agent   │  │   │  │ - metadata         │  │
│  │  - Look Reasons    │  │   │  └────────────────────┘  │
│  │  - Result Explain  │  │   │                          │
│  └────────────────────┘  │   └──────────────────────────┘
│                          │
└──────────────────────────┘
```

## Request Flow Diagrams

### 1. CLEAR Intent Flow

```
User Query: "blue formal shirt size 42"
           │
           ▼
    ┌──────────────┐
    │ Frontend     │
    │ Search Bar   │
    └──────┬───────┘
           │
           │ POST /search-intent
           │ { session_id, query }
           ▼
    ┌──────────────┐
    │ Backend      │
    │ Intent Route │
    └──────┬───────┘
           │
           │ Call Gemini
           │ with Intent Agent Prompt
           ▼
    ┌──────────────┐
    │ Vertex AI    │
    │ Gemini       │
    └──────┬───────┘
           │
           │ Returns: { mode: "CLEAR",
           │           entities: { color: "blue", ... } }
           ▼
    ┌──────────────┐
    │ Frontend     │
    │ Sets Intent  │
    └──────┬───────┘
           │
           │ POST /search-results
           │ { session_id, query, entities }
           ▼
    ┌──────────────┐
    │ Backend      │
    │ Search Route │
    └──────┬───────┘
           │
           │ Query with filters
           ▼
    ┌──────────────┐
    │ BigQuery     │
    │ Products     │
    └──────┬───────┘
           │
           │ Returns products
           ▼
    ┌──────────────┐
    │ Frontend     │
    │ Product Grid │
    │ + Filters    │
    └──────────────┘
```

### 2. AMBIGUOUS Intent Flow

```
User Query: "shirt"
           │
           ▼
    [Intent Detection: mode = "AMBIGUOUS"]
           │
           │ Returns chips:
           │ { style: ["Formal", "Casual"],
           │   color: ["Blue", "White"],
           │   price: ["Under 2000", "2000-4000"] }
           ▼
    ┌──────────────┐
    │ Frontend     │
    │ Shows Chips  │
    └──────┬───────┘
           │
           │ User selects: Style="Formal", Color="Blue"
           ▼
    ┌──────────────┐
    │ Frontend     │
    │ Maps to      │
    │ Filters      │
    └──────┬───────┘
           │
           │ POST /search-results
           │ { filters: { style: "formal", color: "blue" } }
           ▼
    ┌──────────────┐
    │ BigQuery     │
    │ Filtered     │
    │ Query        │
    └──────┬───────┘
           │
           │ Returns filtered products
           ▼
    ┌──────────────┐
    │ Frontend     │
    │ Product Grid │
    └──────────────┘
```

### 3. GOAL Intent Flow

```
User Query: "I am attending my daughter's annual day..."
           │
           ▼
    [Intent Detection: mode = "GOAL"]
           │
           │ Returns entities:
           │ { occasion: "annual day",
           │   participants: "me and my wife",
           │   age_group: "forties" }
           ▼
    ┌──────────────┐
    │ Frontend     │
    │ Opens Chat   │
    └──────┬───────┘
           │
           │ POST /clarify-goal
           │ { session_id, query, entities }
           ▼
    ┌──────────────┐
    │ Vertex AI    │
    │ Clarifier    │
    └──────┬───────┘
           │
           │ Returns question + options
           ▼
    ┌──────────────┐
    │ Frontend     │
    │ Chat Shows   │
    │ Options      │
    └──────┬───────┘
           │
           │ User selects: "Blue and beige"
           │
           │ POST /compose-outfits
           │ { choice: { palette: "Blue and beige" } }
           ▼
    ┌──────────────┐
    │ Backend      │
    │ Outfit       │
    │ Composer     │
    └──────┬───────┘
           │
           ├─► BigQuery: Search man's top (blue shirt)
           ├─► BigQuery: Search man's bottom (navy trousers)
           ├─► BigQuery: Search woman's outfit (beige kurti)
           │
           │ Build Look 1: { name, items[], total_price }
           │
           │ POST to Gemini Explainer
           │ Get reason for Look 1
           │
           │ Build Look 2 (similar process)
           │
           │ Returns: { looks: [Look1, Look2] }
           ▼
    ┌──────────────┐
    │ Frontend     │
    │ Look Cards   │
    │ with Reasons │
    └──────────────┘
```

## Data Models

### Product (BigQuery Schema)

```typescript
{
  product_id: string;        // Primary key
  title: string;             // Product name
  brand: string;             // Brand name
  price: number;             // Price in currency
  image_url: string;         // Product image URL
  category: string;          // shirt, trousers, kurti, etc.
  color: string;             // blue, white, etc.
  size: string;              // 42, M, L, UK 9, etc.
  fit: string;               // regular, slim, comfort
  occasion_tags: string[];   // formal, casual, wedding, etc.
  style: string;             // formal, casual, ethnic
  description: string;       // Full description
  created_at: timestamp;     // Creation time
  updated_at: timestamp;     // Last update
}
```

### Intent Response

```typescript
{
  mode: "CLEAR" | "AMBIGUOUS" | "GOAL";
  entities: {
    occasion?: string;
    participants?: string;
    age_group?: string;
    body_type?: string;
    style?: string;
    palette?: string;
    budget?: string;
    category?: string;
    color?: string;
    size?: string;
    brand?: string;
    fit?: string;
  };
  chips?: {
    style?: string[];
    color?: string[];
    price?: string[];
    // ... other attributes
  };
}
```

### Look Structure

```typescript
{
  name: string;              // "Smart Evening", "Easy Day Out"
  total_price: number;       // Sum of all items
  items: [
    {
      for: string;           // "man", "woman", "child"
      product_id: string;
      title: string;
      price: number;
      image_url: string;
      brand: string;
      category: string;
    }
  ];
  reason: string;            // AI-generated explanation
}
```

## Agent Prompts Strategy

### Intent Agent
- **Input**: User query string
- **Output**: Intent mode + entities + optional chips
- **Strategy**: Pattern matching on query structure and vocabulary
  - Short + specific attributes → CLEAR
  - Single generic term → AMBIGUOUS
  - Long + contextual narrative → GOAL

### Clarifier Agent
- **Input**: Query + entities
- **Output**: One question + 3-5 options
- **Strategy**: Identify missing high-impact attributes
  - Priority: palette > style > formality > budget
  - Options are specific, actionable, and mutually exclusive

### Explainer Agent
- **Input**: Query + look summary
- **Output**: 1-2 sentence reasoning
- **Strategy**: Connect look to user's stated needs
  - Reference occasion, palette, or style
  - Highlight benefits (comfort, polish, versatility)
  - Warm, conversational tone

## Security Considerations

1. **API Keys**: All GCP credentials via Application Default Credentials
2. **CORS**: Configured to allow only frontend origin
3. **Input Validation**: Query length limits, entity sanitization
4. **Rate Limiting**: Cloud Run automatic scaling with concurrency limits
5. **Error Handling**: Never expose internal errors to frontend

## Performance Optimizations

1. **BigQuery**: Indexed on category, color, price for fast filtering
2. **Vertex AI**: Use temperature=0.2 for consistent, focused responses
3. **Frontend**: Image lazy loading, carousel virtualization
4. **Cloud Run**: Auto-scaling (0-10 instances), cold start optimization
5. **Caching**: Future: Redis for product catalog, CDN for images

## Monitoring & Observability

1. **Cloud Run Logs**: All API requests, errors, latencies
2. **BigQuery**: Analytics events table for user behavior
3. **Vertex AI Usage**: Token counts, API call latencies
4. **Custom Metrics**: Intent mode distribution, outfit composition success rate

## Scalability

- **Current**: Supports ~1000 concurrent users
- **Bottlenecks**: Vertex AI rate limits, BigQuery concurrent queries
- **Future Improvements**:
  - Add Redis cache for frequent queries
  - Implement result pagination
  - Use Vertex AI Search for semantic product search
  - Add CDN for frontend assets

## Cost Breakdown

| Service | Usage Pattern | Est. Monthly Cost |
|---------|--------------|-------------------|
| Cloud Run (Frontend) | 10K requests | ~$5 |
| Cloud Run (Backend) | 10K requests | ~$5 |
| Vertex AI Gemini | 30K API calls | ~$10-20 |
| BigQuery | 100GB scanned | ~$5 |
| **Total** | | **~$25-35** |

Scales with usage. Production with 100K users/month: ~$200-500/month.

---

Last Updated: December 2025
