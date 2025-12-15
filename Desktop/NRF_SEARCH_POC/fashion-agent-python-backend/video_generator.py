"""
Veo 3.1 Video Generation for Fashion Outfits
Uses Google's Veo 3.1 model for Image-to-Video animation
"""
import os
import base64
import time
from typing import Optional
from google import genai
from google.genai import types


class VideoGeneratorError(Exception):
    """Custom exception for video generation errors"""
    pass


def get_gemini_api_key() -> str:
    """
    Get Google API key from environment variable.

    Returns:
        API key string

    Raises:
        VideoGeneratorError: If API key is not set
    """
    # Get API key from environment variables only (secure method)
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if not api_key:
        raise VideoGeneratorError(
            "GEMINI_API_KEY or GOOGLE_API_KEY environment variable is not set. "
            "Get your API key from: https://makersuite.google.com/app/apikey"
        )

    print(f"🔑 Using API key for video: {api_key[:20]}...")  # Debug: Show first 20 chars
    return api_key


def generate_video_with_veo3(
    image_base64: str,
    prompt: str,
    duration: int = 6,
    aspect_ratio: str = "9:16"
) -> Optional[dict]:
    """
    Generate video using Google Veo 3.1 (Image-to-Video).

    Animates a static fashion image using Veo 3.1 to create a 360-degree showcase.

    Args:
        image_base64: Base64 encoded image to animate
        prompt: Video animation instructions (camera movement, model behavior)
        duration: Video duration in seconds (default 6)
        aspect_ratio: Desired aspect ratio (e.g., "9:16", "16:9", "1:1")

    Returns:
        Dictionary containing:
        - status: "success" or "fallback"
        - video_data: Base64 encoded video (on success)
        - enhanced_prompt: Enhanced prompt text (on fallback)
        - parameters: Generation parameters
        - metadata: Additional metadata
    """
    print(f"🎬 Generating video with Veo 3.1 (Image-to-Video)...")
    print(f"Animation prompt: {prompt[:100]}...")

    try:
        # Get API key and initialize client
        api_key = get_gemini_api_key()
        client = genai.Client(api_key=api_key)

        # Decode base64 image to bytes
        image_bytes = base64.b64decode(image_base64)

        # Enhance prompt with video-specific animation instructions
        enhanced_prompt = f"""Cinematic fashion video animation. {prompt}

CAMERA & MOVEMENT:
- Smooth 360-degree rotation around the model
- Starting position: Front view, centered
- Movement: Slow clockwise rotation, completing full circle
- Camera movement: Professional cinematic push-in and orbit
- Maintain sharp focus on outfit details throughout

MODEL BEHAVIOR:
- Subject stands confidently in professional pose
- Gentle, natural movements: slight weight shift, fabric sway
- Model may turn slowly in sync with camera
- Hands at sides or on hips
- Maintain elegant, professional demeanor

LIGHTING & QUALITY:
- Professional studio lighting with soft shadows
- Lighting shifts naturally as camera moves
- Highlight fabric textures, drape, and fit
- Show how outfit looks from all angles
- High-resolution, smooth transitions

MOOD:
- Professional, elegant, fashion-forward
- Suitable for e-commerce or fashion magazine
- Natural fabric movement and flow
"""

        # Veo models to try (in order of preference)
        # PRICING: Veo 3 Standard = $0.40/sec, Veo 3 Fast = $0.15/sec (62.5% cheaper!)
        veo_models_to_try = [
            'veo-3.1-fast-generate-preview',  # Veo 3.1 Fast ($0.15/sec) - Best value!
            'veo-3.0-fast-generate-001',  # Veo 3.0 Fast ($0.15/sec)
            'veo-3.1-generate-preview',  # Veo 3.1 Standard ($0.40/sec) - Fallback if fast unavailable
            'veo-3.0-generate-001',  # Veo 3.0 Standard ($0.40/sec)
        ]

        for model_id in veo_models_to_try:
            try:
                print(f"  📹 Trying Veo model: {model_id}")

                # Call Veo 3.1 with Image-to-Video
                # CORRECTED: image parameter must be TOP-LEVEL, not inside config
                # CORRECTED: aspect_ratio uses colon format "9:16", NOT hyphen "9-16"
                # CORRECTED: mime_type must be explicitly specified for Veo API validation
                operation = client.models.generate_videos(
                    model=model_id,
                    prompt=enhanced_prompt,
                    image=types.Image(
                        image_bytes=image_bytes,
                        mime_type='image/png'  # Required: Veo API requires explicit MIME type
                    ),
                    config=types.GenerateVideosConfig(
                        aspect_ratio=aspect_ratio,  # Use standard colon format: "9:16"
                        duration_seconds=duration,
                        person_generation="allow_adult"  # CRITICAL: Bypass safety blocks for realistic humans
                        # fps parameter removed - not supported by Veo 3 API
                    )
                )

                print(f"  ⏳ Video generation started... (This may take 30-60 seconds)")

                # Poll for completion (Video generation is asynchronous)
                # CRITICAL FIX: Manual polling loop - operation.result is a PROPERTY, not a function
                while not operation.done:
                    time.sleep(10)  # Wait 10 seconds between checks
                    print("     ... still processing")
                    # Refresh the operation status
                    operation = client.operations.get(operation)

                # Check if video was generated
                # Note: operation.result is a PROPERTY, not a function call
                if operation.result and operation.result.generated_videos:
                    video_bytes = operation.result.generated_videos[0].video.video_bytes
                    video_base64 = base64.b64encode(video_bytes).decode()

                    print(f"✅ Video generated successfully with {model_id}!")
                    return {
                        "status": "success",
                        "video_data": video_base64,
                        "video_url": None,
                        "parameters": {
                            "duration": duration,
                            "aspect_ratio": aspect_ratio,
                            "model": model_id
                        },
                        "metadata": {
                            "generation_time": "30-60 seconds",
                            "prompt_used": enhanced_prompt,
                            "note": f"Animated with {model_id}"
                        }
                    }
                else:
                    print(f"  ⚠️  {model_id} finished but returned no video data")

            except Exception as model_error:
                error_msg = str(model_error)
                print(f"  ❌ {model_id} failed: {error_msg[:150]}")

                # Check for specific errors
                if "404" in error_msg or "not found" in error_msg.lower():
                    print(f"     Model {model_id} not available")
                elif "403" in error_msg or "permission" in error_msg.lower():
                    print(f"     Model {model_id} requires additional permissions")
                elif "429" in error_msg or "quota" in error_msg.lower():
                    print(f"     Model {model_id} quota exhausted")

                continue

        # If we get here, all Veo models failed
        raise VideoGeneratorError("All Veo models failed or not available yet")

    except VideoGeneratorError as e:
        # Log the error and use fallback
        print(f"⚠️  Video generation error: {e}")
        print("🔄 Falling back to enhanced prompt generation...")

    except Exception as e:
        # Unexpected error - use fallback
        print(f"⚠️  Unexpected error with Veo: {e}")
        print("🔄 Falling back to enhanced prompt generation...")

    # FALLBACK: Use Claude to enhance the video prompt
    try:
        from anthropic import Anthropic

        claude_api_key = os.getenv("CLAUDE_API_KEY")
        if not claude_api_key:
            # If Claude API key also not available, return basic fallback
            basic_prompt = f"""360-degree fashion video: {prompt}

Duration: {duration} seconds
Aspect ratio: {aspect_ratio}
Camera: Smooth 360-degree rotation around model
Lighting: Professional studio lighting
Model: Standing pose, slow rotation to show all angles
Focus: Sharp on outfit details, fabric drape and movement
Background: Clean, minimal, professional
Quality: High resolution, smooth transitions
Style: Fashion editorial, e-commerce presentation"""

            return {
                "status": "fallback",
                "message": "Video generation requires CLAUDE_API_KEY for prompt enhancement. Veo 3 is not yet publicly available.",
                "enhanced_prompt": basic_prompt,
                "parameters": {
                    "duration": duration,
                    "aspect_ratio": aspect_ratio
                }
            }

        # Use Claude to create an enhanced video prompt
        client = Anthropic(api_key=claude_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": f"""Generate a detailed, visual description for an AI VIDEO generator
                    to create a 360-degree fashion showcase video based on this outfit:

                    {prompt}

                    The video should be {duration} seconds long in {aspect_ratio} aspect ratio.

                    Make it specific, visual, and suitable for video generation.
                    Include details about:
                    - Camera movement (360-degree rotation)
                    - Model pose and movement
                    - Lighting setup and how it changes during rotation
                    - Specific angles to emphasize (front, sides, back)
                    - Fabric movement and drape
                    - Background and setting
                    - Fashion video style
                    - Transitions and pacing

                    Output only the enhanced video prompt, nothing else."""
                }
            ]
        )

        claude_enhanced_prompt = response.content[0].text

        print("✅ Using Claude-enhanced video prompt as fallback")
        return {
            "status": "fallback",
            "message": "Veo 3 video generation is not yet publicly available. Use this Claude-enhanced prompt with external video generators like Runway ML, Pika Labs, or when Veo 3 becomes available.",
            "enhanced_prompt": claude_enhanced_prompt,
            "parameters": {
                "duration": duration,
                "aspect_ratio": aspect_ratio
            }
        }

    except Exception as fallback_error:
        # Ultimate fallback - return basic enhanced prompt
        print(f"⚠️  Fallback also failed: {fallback_error}")
        basic_prompt = f"""360-degree fashion video: {prompt}

Duration: {duration} seconds
Aspect ratio: {aspect_ratio}
Camera: Smooth 360-degree rotation around model
Lighting: Professional studio lighting
Model: Standing pose, slow rotation to show all angles
Focus: Sharp on outfit details, fabric drape and movement
Background: Clean, minimal, professional
Quality: High resolution, smooth transitions
Style: Fashion editorial, e-commerce presentation"""

        return {
            "status": "fallback",
            "message": "Video generation services are currently unavailable. Please use the prompt below with external video generators.",
            "enhanced_prompt": basic_prompt,
            "parameters": {
                "duration": duration,
                "aspect_ratio": aspect_ratio
            }
        }


if __name__ == "__main__":
    """Test the video generator (requires a base64 image)"""
    print("\n⚠️  Note: Veo 3.1 requires an input image for Image-to-Video animation.")
    print("To test, first generate an image with image_generator.py, then use this module.\n")
    print("Example usage:")
    print("""
    from image_generator import generate_image_with_nanoBanana
    from video_generator import generate_video_with_veo3

    # Step 1: Generate image
    image_result = generate_image_with_nanoBanana(
        prompt="Indian businesswoman in navy blazer...",
        aspect_ratio="9:16"
    )

    # Step 2: Animate image (if image generation succeeded)
    if image_result['status'] == 'success':
        video_result = generate_video_with_veo3(
            image_base64=image_result['image_data'],
            prompt="Model smiles gently and adjusts her blazer. Camera slowly rotates 360 degrees.",
            duration=6,
            aspect_ratio="9:16"
        )
        print(f"Video status: {video_result['status']}")
    """)
