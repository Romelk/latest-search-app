"""
Nano Banana Image Generation for Fashion Outfits
Uses Google's Gemini 2.0 Flash Experimental model with built-in image generation
"""
import os
import base64
from typing import Optional
from google import genai
from google.genai import types


class ImageGeneratorError(Exception):
    """Custom exception for image generation errors"""
    pass


def get_gemini_api_key() -> str:
    """
    Get Google API key from environment variable.

    Returns:
        API key string

    Raises:
        ImageGeneratorError: If API key is not set
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ImageGeneratorError(
            "GOOGLE_API_KEY environment variable is not set. "
            "Get your API key from: https://makersuite.google.com/app/apikey"
        )
    return api_key


def generate_image_with_nanoBanana(
    prompt: str,
    aspect_ratio: str = "9:16",
    style: str = "photorealistic"
) -> Optional[dict]:
    """
    Generate image using Google Gemini 2.0 Flash (Nano Banana capability).

    Args:
        prompt: Detailed fashion outfit description
        aspect_ratio: Desired aspect ratio (e.g., "9:16", "16:9", "1:1")
        style: Style of image (e.g., "photorealistic", "artistic", "fashion")

    Returns:
        Dictionary containing:
        - status: "success" or "fallback"
        - image_data: Base64 encoded image (on success)
        - enhanced_prompt: Enhanced prompt text (on fallback)
        - parameters: Generation parameters
        - metadata: Additional metadata
    """
    print(f"Generating image with Gemini 2.0 Flash (Nano Banana)...")
    print(f"Prompt: {prompt[:100]}...")

    try:
        # Get API key and initialize new Gemini client
        api_key = get_gemini_api_key()
        client = genai.Client(api_key=api_key)

        # Enhance prompt with fashion-specific context
        enhanced_prompt = f"""Generate a high-quality fashion photograph with these specifications:

{prompt}

Style: {style}, professional fashion editorial
Aspect ratio: {aspect_ratio}
Lighting: Professional studio lighting with soft shadows
Focus: Sharp focus on clothing details and fit
Quality: High resolution, suitable for fashion magazine
Composition: Full body shot, model in neutral pose showcasing the complete outfit
Background: Clean, minimal background that doesn't distract from the outfit
Mood: Professional, elegant, fashion-forward
"""

        # Configure generation with IMAGE response modality (critical for image output)
        generate_config = types.GenerateContentConfig(
            response_modalities=["IMAGE"],  # Force image generation, not text description
            safety_settings=[
                types.SafetySetting(
                    category="HARM_CATEGORY_HARASSMENT",
                    threshold="BLOCK_NONE"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_HATE_SPEECH",
                    threshold="BLOCK_NONE"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold="BLOCK_NONE"
                ),
                types.SafetySetting(
                    category="HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold="BLOCK_NONE"
                ),
            ]
        )

        # Try different Gemini models that support image generation
        # Models to try in order: gemini-2.0-flash-exp-image-01, gemini-exp-1206, gemini-2.0-flash-thinking-exp
        models_to_try = [
            'gemini-2.0-flash-thinking-exp-01-21',
            'gemini-exp-1206',
            'gemini-2.0-flash-exp',
        ]

        last_error = None
        for model_name in models_to_try:
            try:
                print(f"Trying model: {model_name}")
                response = client.models.generate_content(
                    model=model_name,
                    contents=enhanced_prompt,
                    config=generate_config
                )
                # If we get here, the model worked
                break
            except Exception as model_error:
                print(f"Model {model_name} failed: {model_error}")
                last_error = model_error
                continue
        else:
            # All models failed
            raise ImageGeneratorError(f"All Gemini models failed. Last error: {last_error}")

        # Check if response contains candidates and parts
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                # Check for inline image data
                if part.inline_data:
                    # Extract image bytes
                    image_bytes = part.inline_data.data

                    # Convert to base64
                    img_base64 = base64.b64encode(image_bytes).decode()

                    print("✅ Image generated successfully with Gemini 2.0 Flash!")
                    return {
                        "status": "success",
                        "image_data": img_base64,
                        "image_url": None,
                        "parameters": {
                            "aspect_ratio": aspect_ratio,
                            "style": style,
                            "model": "gemini-2.0-flash-exp"
                        },
                        "metadata": {
                            "generation_time": "instant",
                            "prompt_used": enhanced_prompt,
                            "note": "Generated with Gemini 2.0 Flash (Nano Banana)"
                        }
                    }

        # If no image data found in response
        print("⚠️  Gemini returned response but no image data found")
        raise ImageGeneratorError("Model returned response but no image data found")

    except ImageGeneratorError as e:
        # Log the error and use fallback
        print(f"Image generation error: {e}")
        print("Falling back to Claude-enhanced prompt generation...")

    except Exception as e:
        # Unexpected error - use fallback
        print(f"Unexpected error with Gemini 2.0: {e}")
        print("Falling back to Claude-enhanced prompt generation...")

    # FALLBACK: Use Claude to enhance the prompt
    try:
        from anthropic import Anthropic

        claude_api_key = os.getenv("CLAUDE_API_KEY")
        if not claude_api_key:
            # If Claude API key also not available, return basic fallback
            enhanced_prompt = f"""Fashion photography: {prompt}

Style: {style}, high-quality professional fashion editorial
Aspect ratio: {aspect_ratio}
Professional studio lighting, sharp focus, high resolution
Editorial quality, suitable for fashion magazine
Model in neutral pose showcasing the complete outfit
Clean background, emphasis on clothing details and fit"""

            return {
                "status": "fallback",
                "message": "Image generation requires CLAUDE_API_KEY for prompt enhancement. The Gemini service may be temporarily unavailable.",
                "enhanced_prompt": enhanced_prompt,
                "parameters": {
                    "aspect_ratio": aspect_ratio,
                    "style": style
                }
            }

        client = Anthropic(api_key=claude_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": f"""Generate a detailed, visual description for an AI image generator
                    based on this fashion outfit description:

                    {prompt}

                    Make it specific, visual, and suitable for image generation.
                    Include details about:
                    - Exact clothing items and colors
                    - Fabric textures and materials
                    - Lighting setup (studio, natural, dramatic)
                    - Camera angle and composition
                    - Model pose and expression
                    - Background and setting
                    - Fashion photography style

                    Output only the enhanced prompt, nothing else."""
                }
            ]
        )

        claude_enhanced_prompt = response.content[0].text

        print("✅ Using Claude-enhanced prompt as fallback")
        return {
            "status": "fallback",
            "message": "Gemini image generation is currently unavailable. Use this Claude-enhanced prompt with external image generators like Midjourney, DALL-E, or Stable Diffusion.",
            "enhanced_prompt": claude_enhanced_prompt,
            "parameters": {
                "aspect_ratio": aspect_ratio,
                "style": style
            }
        }
    except Exception as fallback_error:
        # Ultimate fallback
        print(f"Fallback also failed: {fallback_error}")
        enhanced_prompt = f"""Fashion photography: {prompt}

Style: {style}, high-quality professional fashion editorial
Aspect ratio: {aspect_ratio}
Professional studio lighting, sharp focus, high resolution
Editorial quality, suitable for fashion magazine
Model in neutral pose showcasing the complete outfit
Clean background, emphasis on clothing details and fit"""

        return {
            "status": "fallback",
            "message": "Image generation services are currently unavailable. Please use the prompt below with external image generators.",
            "enhanced_prompt": enhanced_prompt,
            "parameters": {
                "aspect_ratio": aspect_ratio,
                "style": style
            }
        }


if __name__ == "__main__":
    """Test the image generator"""
    try:
        test_prompt = """
        A sophisticated business casual outfit featuring:
        - Navy blue blazer with structured shoulders
        - Crisp white button-down shirt
        - Beige chinos with a tailored fit
        - Brown leather oxford shoes
        - Minimal accessories: silver watch and leather belt
        Full body shot, professional studio lighting, fashion photography style
        """

        print("Testing Nano Banana (Gemini 2.0 Flash) image generator...")
        print("=" * 60)
        result = generate_image_with_nanoBanana(
            prompt=test_prompt,
            aspect_ratio="9:16",
            style="photorealistic"
        )

        print("\n" + "=" * 60)
        print(f"Status: {result['status']}")
        if result['status'] == 'success':
            print(f"✅ Image generated successfully!")
            print(f"Image data length: {len(result['image_data'])} characters")
            print(f"Model used: {result['parameters']['model']}")
        else:
            print(f"⚠️  Fallback mode: {result['message']}")
            print(f"\nEnhanced prompt preview:")
            print(result['enhanced_prompt'][:300] + "...")

    except ImageGeneratorError as e:
        print(f"❌ Error: {e}")
