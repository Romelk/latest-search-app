# NRF Search POC with Dual AI Agents

AI-powered retail search platform featuring two specialized AI assistants working side-by-side to provide comprehensive fashion guidance and product discovery.

## Dual Agent Architecture

### GOAL Chat Agent (Right Side - Teal/Purple Theme)
Helps users find coordinated outfits for specific occasions using Google Cloud Vertex AI (Gemini 1.5 Pro).
- Asks clarifying questions about style preferences, colors, budget
- Returns curated outfit "looks" with AI-generated explanations
- Perfect for: "I need outfits for my daughter's annual day..."

### Fashion Agent - Alex (Left Side - Orange/Pink Theme)
Autonomous fashion stylist powered by Claude Sonnet 4.5 with visual-first responses.
- Provides fashion trend insights and styling advice
- Generates outfit visualizations and color palettes
- Perfect for: "What are the current fashion trends?"

## Overview

This application demonstrates three distinct search modes:

1. **CLEAR Intent**: Direct, specific product searches (e.g., "blue formal shirt size 42")
2. **AMBIGUOUS Intent**: Broad queries refined through interactive chips (e.g., "shirt")
3. **GOAL Intent**: Rich, contextual searches with AI-powered outfit curation (e.g., "I need outfits for my daughter's annual day")

## Tech Stack

### Frontend
- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **TypeScript**
- **Google Cloud Vertex AI** (Gemini 1.5 Pro) for intent detection, clarification, and explanations
- **Google Cloud BigQuery** for product catalog and analytics

### Infrastructure
- **Cloud Run** for serverless deployment
- **Docker** for containerization

## Project Structure

```
NRF_SEARCH_POC/
├── frontend/                    # Next.js Frontend (Port 3000)
│   ├── app/
│   │   ├── page.tsx            # Landing page
│   │   └── search/page.tsx     # Main search interface with both agents
│   ├── components/
│   │   ├── ChatPanel.tsx       # GOAL chat interface (right side)
│   │   ├── FashionAgentPanel.tsx  # Fashion Agent interface (left side)
│   │   ├── SearchBar.tsx
│   │   ├── ProductCard.tsx
│   │   ├── Carousel.tsx
│   │   ├── CategoryTiles.tsx
│   │   ├── FiltersBar.tsx
│   │   ├── RefinementChips.tsx
│   │   └── LookCard.tsx
│   ├── lib/
│   │   ├── types/              # TypeScript interfaces
│   │   ├── api/                # API client functions
│   │   └── utils.ts
│   └── package.json
│
├── backend/                     # NRF Search Backend (Port 8080)
│   ├── src/
│   │   ├── index.ts            # Main server file
│   │   ├── config/             # Configuration
│   │   ├── routes/             # API routes
│   │   ├── services/           # Vertex AI, BigQuery services
│   │   ├── agents/             # Gemini agent prompts
│   │   └── types/              # TypeScript interfaces
│   ├── bigquery-schema.sql
│   └── package.json
│
├── fashion-agent-backend/       # Fashion Agent Backend (Port 8001)
│   ├── src/
│   │   ├── agent/              # Autonomous agentic loop with Claude
│   │   ├── tools/              # Fashion tools (trends, images, palettes)
│   │   ├── session/            # WebSocket session management
│   │   ├── config.ts           # Configuration
│   │   └── server.ts           # Express + WebSocket server
│   └── package.json
│
├── start-all.sh                 # Start all services (Recommended)
├── stop-all.sh                  # Stop all services
├── logs/                        # Service logs directory
└── README.md
```

## Features

### Landing Page
- Animated hero section with call-to-action
- Smooth transition to search interface
- Brand logo and tagline

### Search Home
- Global search bar (sticky header)
- "Deals of the day" carousel
- "Top selling products" carousel
- Category tiles (Fashion, Electronics, Furniture, Others)

### CLEAR Intent Flow
- Filters bar (Category, Color, Brand, Fit, Style, Price Range)
- Product grid with images, titles, brands, prices
- Sort options
- Responsive grid layout

### AMBIGUOUS Intent Flow
- "Help me narrow this down" section
- Interactive refinement chips grouped by attributes
- Dynamic product filtering based on chip selections
- Smooth transition to filtered results

### GOAL Intent Flow
- Interactive chat panel (side or bottom drawer)
- AI-powered clarifying questions with 3-5 options
- Curated outfit looks with:
  - Look name and total price
  - Items grouped by recipient (e.g., "For him", "For her")
  - AI-generated reasoning for each look
  - Product thumbnails and details
- Filters bar for further refinement

### Optional Features
- "Explain my results" button showing AI-generated explanations
- Analytics event tracking
- Session management

## Prerequisites

- **Node.js** 22.x or later
- **npm** 10.x or later
- **Google Cloud SDK** (gcloud CLI)
- **Google Cloud Project** with:
  - Vertex AI API enabled
  - BigQuery API enabled
  - Cloud Run API enabled
  - Billing enabled

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Romelk/latest-search-app.git
cd latest-search-app
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Google Cloud project details
# GCP_PROJECT_ID=your-project-id
# REGION=us-central1
# VERTEX_MODEL_NAME=gemini-1.5-pro
# BIGQUERY_DATASET=fashion_catalog
# BIGQUERY_TABLE=products

# Set up BigQuery (run this in BigQuery console or via bq CLI)
# See bigquery-schema.sql for schema and sample data

# Start development server
npm run dev
```

The backend will start on `http://localhost:8080`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8080

# Start development server
npm run dev
```

The frontend will start on `http://localhost:3000`.

### 4. Set Up BigQuery

1. Create a dataset named `fashion_catalog` in your Google Cloud project
2. Run the SQL commands from `backend/bigquery-schema.sql` in BigQuery console to:
   - Create the `products` table
   - Insert sample product data
   - Create the `analytics_events` table

## Deployment to Google Cloud Run

### 1. Set Up Google Cloud

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable bigquery.googleapis.com
```

### 2. Deploy Backend

```bash
# From project root
./deploy-backend.sh YOUR_PROJECT_ID us-central1
```

This will:
- Build the backend Docker image
- Deploy to Cloud Run
- Output the backend service URL

### 3. Deploy Frontend

```bash
# From project root
./deploy-frontend.sh YOUR_PROJECT_ID us-central1 <BACKEND_URL>
```

Replace `<BACKEND_URL>` with the URL from the backend deployment.

This will:
- Build the frontend Docker image with the backend URL
- Deploy to Cloud Run
- Output the frontend service URL

### 4. Access Your Application

Open the frontend URL in your browser. The application is now live!

## Demo Flows

### CLEAR Flow Demo

**Query**: "blue formal shirt size 42"

1. Enter query in search bar
2. Intent detected as CLEAR
3. Filters bar and product grid appear
4. Products matching criteria are displayed
5. Use filters to refine results

### AMBIGUOUS Flow Demo

**Query**: "shirt"

1. Enter query in search bar
2. Intent detected as AMBIGUOUS
3. "Help me narrow this down" section appears with chips:
   - Style: Formal, Casual, Smart Casual
   - Color: Blue, White, Black, Grey
   - Price: Under 2000, 2000 to 4000, Above 4000
4. Select chips (e.g., Style: Formal, Color: Blue)
5. Results update based on selections

### GOAL Flow Demo

**Query**: "I am attending my daughter's annual day. She is ten. I want something smart and coordinated for me and my wife, we are in our forties and not very slim."

1. Enter query in search bar
2. Intent detected as GOAL
3. Chat panel opens with greeting
4. AI asks clarifying question: "Which palette feels right for you?"
   - Options: Olive and ivory, Blue and beige, Soft grey tones, etc.
5. Select an option (e.g., "Blue and beige")
6. 2-3 curated looks appear below search bar
7. Each look shows:
   - Items for you (him)
   - Items for your partner (her)
   - Total price
   - AI reasoning

## Configuration

### Environment Variables

**Backend** (`.env`):
```
GCP_PROJECT_ID=your-gcp-project-id
REGION=us-central1
VERTEX_MODEL_NAME=gemini-1.5-pro
BIGQUERY_DATASET=fashion_catalog
BIGQUERY_TABLE=products
VERTEX_SEARCH_INDEX=
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## API Endpoints

### Backend API

- `POST /search-intent` - Detect user intent (CLEAR/AMBIGUOUS/GOAL)
- `POST /search-results` - Search products with filters
- `POST /clarify-goal` - Get clarifying questions for GOAL intent
- `POST /compose-outfits` - Generate curated outfit looks
- `POST /explain-results` - Get AI explanation for search results
- `GET /content/deals` - Get deals of the day products
- `GET /content/top-selling` - Get top selling products
- `GET /content/categories` - Get product categories
- `POST /analytics/event` - Log analytics events
- `GET /health` - Health check endpoint

## Architecture

### Intent Detection Flow

1. User enters query
2. Frontend calls `/search-intent` with query
3. Backend calls Vertex AI Gemini with Intent Agent prompt
4. Gemini analyzes query and returns:
   - Intent mode (CLEAR/AMBIGUOUS/GOAL)
   - Extracted entities
   - Optional refinement chips (for AMBIGUOUS)
5. Frontend renders appropriate UI based on intent

### Product Search Flow

1. Frontend calls `/search-results` with query, entities, and filters
2. Backend constructs BigQuery SQL query
3. BigQuery returns matching products
4. Backend returns products to frontend
5. Frontend displays in product grid or look cards

### Goal-Based Outfit Curation

1. Backend calls `/clarify-goal` for clarifying questions
2. User selects option from chat
3. Frontend calls `/compose-outfits` with user choice
4. Backend:
   - Searches BigQuery for items matching entities and choice
   - Groups items into 2-3 complete looks
   - Calls Gemini Explainer Agent for reasoning
5. Frontend displays look cards with AI explanations

## Customization

### Adding New Categories

Edit `backend/src/routes/search.routes.ts` in the `/content/categories` endpoint.

### Modifying Agent Prompts

Edit `backend/src/agents/prompts.ts` to customize:
- Intent detection logic
- Clarifying questions
- Outfit curation reasoning
- Results explanations

### Styling

- Colors: Edit `frontend/app/globals.css` and Tailwind classes
- Fonts: Update `frontend/app/layout.tsx`
- Brand logo: Replace in `frontend/app/page.tsx` and `frontend/app/search/page.tsx`

## Troubleshooting

### Backend Issues

**Error: "GCP_PROJECT_ID not configured"**
- Ensure `.env` file has correct `GCP_PROJECT_ID`

**Error: Vertex AI API not enabled**
```bash
gcloud services enable aiplatform.googleapis.com
```

**Error: BigQuery table not found**
- Run the SQL from `bigquery-schema.sql` in BigQuery console

### Frontend Issues

**Error: Network request failed**
- Check backend is running
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

**Error: Images not loading**
- Check `next.config.ts` has correct image domains

### Deployment Issues

**Cloud Run deployment fails**
- Ensure billing is enabled
- Check APIs are enabled
- Verify IAM permissions

## Cost Considerations

- **Cloud Run**: Pay per request, minimal cost for low traffic
- **Vertex AI**: Charges per API call and token usage
- **BigQuery**: Storage and query costs (sample data is minimal)

For development: Estimate ~$5-20/month with moderate usage
For production: Costs scale with traffic and API usage

## License

This project is provided as-is for demonstration purposes.

## Support

For issues or questions:
- Check the [GitHub repository](https://github.com/Romelk/latest-search-app)
- Review Google Cloud documentation for Vertex AI and BigQuery

---

Built with ❤️ using Google Cloud Vertex AI, Next.js, and Node.js

Powered by Claude Code
