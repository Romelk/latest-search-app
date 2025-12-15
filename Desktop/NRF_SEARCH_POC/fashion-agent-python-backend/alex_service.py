"""
Alex Fashion Stylist - FastAPI Service
Main API server for personalized fashion styling recommendations
"""
import json
import os
from typing import Optional
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import AlexStyleRequest, AlexStyleResponse
from db import init_db, get_recent_trends, get_trend_count
from llm_client import call_claude_json, ClaudeClientError
from prompts import build_stylist_prompt, get_stylist_system_prompt
from image_generator import generate_image_with_nanoBanana, generate_multi_angle_images, generate_multi_angle_from_image, generate_multiple_variations, ImageGeneratorError
from video_generator import generate_video_with_veo3, VideoGeneratorError
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()


# ============================================================================
# Application Lifespan and Initialization
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup: Initialize database
    print("Starting Alex Fashion Stylist API...")
    init_db()
    trend_count = get_trend_count()
    print(f"Database initialized. Total trends: {trend_count}")

    if trend_count == 0:
        print("\nWARNING: No trends in database!")
        print("Run 'python update_trends.py --demo' to populate with sample trends.\n")

    yield

    # Shutdown
    print("Shutting down Alex Fashion Stylist API...")


# ============================================================================
# FastAPI App Configuration
# ============================================================================

app = FastAPI(
    title="Alex Fashion Stylist API",
    description="AI-powered personalized fashion styling recommendations using Claude",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration - Allow frontend at localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "Alex Fashion Stylist API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "styling": "POST /alex/style",
            "image_generation": "POST /alex/generate-image",
            "outfit_variations": "POST /alex/generate-outfit-variations",
            "multi_angle_images": "POST /alex/generate-multi-angle",
            "video_generation": "POST /alex/generate-video",
            "health": "GET /health",
            "stats": "GET /stats"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    trend_count = get_trend_count()
    return {
        "status": "healthy",
        "database": "connected",
        "trends_available": trend_count
    }


@app.get("/stats")
async def get_stats():
    """Get database statistics"""
    trend_count = get_trend_count()
    return {
        "total_trends": trend_count,
        "database_ready": trend_count > 0
    }


@app.get("/api/trends")
async def get_trends_api(
    region: str = "Global",
    occasion_type: str = None,
    limit: int = 10
):
    """
    Get fashion trends for agent tool use.

    Query params:
        region: Geographic region (default: "Global")
        occasion_type: Filter by occasion (optional)
        limit: Max number of trends (default: 10)
    """
    try:
        # Query trends with filters
        contexts = [occasion_type] if occasion_type else None
        trends = get_recent_trends(
            limit=limit,
            region=region if region != "Global" else None,
            contexts=contexts
        )

        # Format trends for agent consumption
        formatted_trends = [
            {
                "name": t["name"],
                "season": t.get("season", ""),
                "style_tags": t.get("style_tags", []),
                "colour_palette": t.get("colour_palette", []),
                "key_items": t.get("key_items", []),
                "contexts": t.get("contexts", []),
                "formality": t.get("formality", ""),
                "region": t.get("region", "Global"),
                "fit_notes": t.get("fit_notes", "")
            }
            for t in trends
        ]

        return {
            "success": True,
            "trends": formatted_trends,
            "count": len(formatted_trends),
            "region": region,
            "filters": {
                "region": region,
                "occasion_type": occasion_type,
                "limit": limit
            }
        }
    except Exception as e:
        print(f"Error fetching trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch trends: {str(e)}"
        )


class ImageGenerationRequest(BaseModel):
    """Request model for image generation"""
    prompt: str
    aspect_ratio: str = "9:16"
    style: str = "photorealistic"


class MultiAngleRequest(BaseModel):
    """Request model for multi-angle generation with reference image"""
    prompt: str
    image_base64: str
    aspect_ratio: str = "9:16"
    style: str = "photorealistic"


@app.post("/alex/generate-image")
async def generate_outfit_image_endpoint(request: ImageGenerationRequest):
    """
    Generate outfit image using Nano Banana.

    Takes an image prompt and generates a visual representation
    of the described outfit.

    Args:
        request: ImageGenerationRequest with prompt and parameters

    Returns:
        Dictionary with image generation result

    Raises:
        HTTPException: If image generation fails
    """
    try:
        print(f"Generating image with prompt: {request.prompt[:100]}...")

        result = generate_image_with_nanoBanana(
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            style=request.style
        )

        return {
            "success": True,
            "data": result
        }

    except ImageGeneratorError as e:
        print(f"Image generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image generation failed: {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected error in image generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


class VideoGenerationRequest(BaseModel):
    """Request model for video generation"""
    image_base64: str
    prompt: str
    duration: int = 6
    aspect_ratio: str = "9:16"


@app.post("/alex/generate-multi-angle")
async def generate_multi_angle_images_endpoint(request: MultiAngleRequest):
    """
    Generate 4-angle fashion showcase using reference image for consistency.

    Takes a reference image and generates 4 views (Front, Left, Back, Right)
    of the SAME outfit from different angles.

    Args:
        request: MultiAngleRequest with prompt, reference image, and parameters

    Returns:
        Dictionary with 4 images and angle names

    Raises:
        HTTPException: If image generation fails
    """
    try:
        print(f"Generating 4-angle showcase from reference image...")

        result = generate_multi_angle_from_image(
            reference_image_base64=request.image_base64,
            prompt=request.prompt,
            aspect_ratio=request.aspect_ratio,
            style=request.style
        )

        return {
            "success": True,
            "data": result
        }

    except ImageGeneratorError as e:
        print(f"Multi-angle generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Multi-angle generation failed: {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected error in multi-angle generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@app.post("/alex/generate-outfit-variations")
async def generate_outfit_variations_endpoint(request: ImageGenerationRequest):
    """
    Generate 3 outfit variations from the same style prompt.

    Takes an outfit description and generates 3 diverse variations with
    different styling approaches while maintaining the core aesthetic.

    Args:
        request: ImageGenerationRequest with prompt and parameters

    Returns:
        Dictionary with 3 outfit variation images

    Raises:
        HTTPException: If image generation fails
    """
    try:
        print(f"Generating 3 outfit variations with prompt: {request.prompt[:100]}...")

        result = generate_multiple_variations(
            prompt=request.prompt,
            count=3,
            aspect_ratio=request.aspect_ratio,
            style=request.style
        )

        return {
            "success": True,
            "data": result
        }

    except ImageGeneratorError as e:
        print(f"Outfit variations generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Outfit variations generation failed: {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected error in outfit variations generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@app.post("/alex/generate-video")
async def generate_outfit_video_endpoint(request: VideoGenerationRequest):
    """
    Generate outfit video using Veo 3.1 (Image-to-Video).

    Takes a base64 encoded image and animation prompt to create
    a 360-degree video showcase of the outfit.

    Args:
        request: VideoGenerationRequest with image_base64, prompt, and parameters

    Returns:
        Dictionary with video generation result

    Raises:
        HTTPException: If video generation fails
    """
    try:
        print(f"Generating video with Veo 3.1...")
        print(f"Animation prompt: {request.prompt[:100]}...")

        result = generate_video_with_veo3(
            image_base64=request.image_base64,
            prompt=request.prompt,
            duration=request.duration,
            aspect_ratio=request.aspect_ratio
        )

        return {
            "success": True,
            "data": result
        }

    except VideoGeneratorError as e:
        print(f"Video generation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video generation failed: {str(e)}"
        )
    except Exception as e:
        print(f"Unexpected error in video generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@app.post("/alex/style", response_model=AlexStyleResponse)
async def generate_style(request: AlexStyleRequest):
    """
    Generate personalized fashion styling recommendations.

    Takes user profile and occasion context, returns a complete style guide
    with outfit recommendations and media generation prompts.

    Args:
        request: AlexStyleRequest with user_profile and context

    Returns:
        AlexStyleResponse with style_guide and media_prompts

    Raises:
        HTTPException: If styling generation fails
    """
    try:
        # Extract request data
        user_profile = request.user_profile.model_dump()
        context = request.context.model_dump()

        # Get relevant trends from database
        region = context.get("region", "Global")
        occasion_type = context.get("occasion_type")

        # Query trends with filters
        trends = get_recent_trends(
            limit=40,
            region=region,
            contexts=[occasion_type] if occasion_type else None
        )

        # Check if we have trends
        if not trends:
            print(f"Warning: No trends found for region={region}, using global trends")
            trends = get_recent_trends(limit=40, region="global")

        print(f"Using {len(trends)} trends for styling recommendation")

        # Build stylist prompt
        system_prompt = get_stylist_system_prompt()
        user_prompt = build_stylist_prompt(user_profile, context, trends)

        # Call Claude for styling recommendations
        print("Calling Claude for styling recommendation...")
        response_text = call_claude_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=4000
        )

        # Parse JSON response
        try:
            response_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"Error: Failed to parse JSON from Claude: {e}")
            print(f"Response preview: {response_text[:500]}...")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid JSON response from styling engine"
            )

        # Validate response structure
        if "style_guide" not in response_data or "media_prompts" not in response_data:
            print(f"Error: Response missing required fields")
            print(f"Response keys: {response_data.keys()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Incomplete response from styling engine"
            )

        # Validate with Pydantic model
        try:
            validated_response = AlexStyleResponse(**response_data)
            return validated_response
        except Exception as e:
            print(f"Error: Response validation failed: {e}")
            print(f"Response data: {json.dumps(response_data, indent=2)[:500]}...")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Response validation error: {str(e)}"
            )

    except ClaudeClientError as e:
        print(f"Claude API error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Styling engine error: {str(e)}"
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": f"Endpoint {request.url.path} not found",
            "available_endpoints": ["/", "/health", "/stats", "/alex/style"]
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Custom 500 handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again."
        }
    )


# ============================================================================
# Development Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    print("\n" + "="*70)
    print("Starting Alex Fashion Stylist API Server")
    print("="*70)
    print("\nEndpoints:")
    print("  - http://localhost:8000/")
    print("  - http://localhost:8000/health")
    print("  - http://localhost:8000/stats")
    print("  - http://localhost:8000/alex/style (POST)")
    print("\nDocs:")
    print("  - http://localhost:8000/docs (Swagger UI)")
    print("  - http://localhost:8000/redoc (ReDoc)")
    print("\n" + "="*70 + "\n")

    uvicorn.run(
        "alex_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
