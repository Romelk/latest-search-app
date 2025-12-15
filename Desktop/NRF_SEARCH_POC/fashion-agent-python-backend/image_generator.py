"""
Nano Banana Image Generation for Fashion Outfits
Uses Google's Gemini 2.5 Flash Image and Imagen 3 with Claude fallback
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
    # Get API key from environment variables only (secure method)
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if not api_key:
        raise ImageGeneratorError(
            "GEMINI_API_KEY or GOOGLE_API_KEY environment variable is not set. "
            "Get your API key from: https://makersuite.google.com/app/apikey"
        )

    print(f"🔑 Using API key: {api_key[:20]}...")  # Debug: Show first 20 chars
    return api_key


def generate_multi_angle_images(
    prompt: str,
    aspect_ratio: str = "9:16",
    style: str = "photorealistic"
) -> Optional[dict]:
    """
    Generate 4-angle fashion showcase: Front, Left, Rear, Right views.

    Args:
        prompt: Base outfit description
        aspect_ratio: Image aspect ratio (default "9:16")
        style: Style preset (default "photorealistic")

    Returns:
        Dictionary containing:
        - status: "success" or "fallback"
        - images: List of 4 base64 images [front, left, rear, right]
        - angles: List of angle names
        - parameters: Generation parameters
    """
    print(f"🎨 Generating 4-angle fashion showcase...")

    angles = [
        ("front", "Front view, facing camera directly, centered pose"),
        ("left", "Left side profile view, 90 degrees to the left, showing full side silhouette"),
        ("rear", "Rear view, back facing camera, showing outfit from behind"),
        ("right", "Right side profile view, 90 degrees to the right, showing full side silhouette")
    ]

    results = {
        "status": "success",
        "images": [],
        "angles": [],
        "parameters": {
            "aspect_ratio": aspect_ratio,
            "style": style,
            "angles_count": 4
        }
    }

    for angle_name, angle_description in angles:
        print(f"  📸 Generating {angle_name} view...")

        # Append angle-specific description to base prompt
        angle_prompt = f"{prompt}. {angle_description}. Same person, same outfit, professional studio photography."

        # Generate single image
        single_result = generate_image_with_nanoBanana(
            prompt=angle_prompt,
            aspect_ratio=aspect_ratio,
            style=style
        )

        if single_result['status'] == 'success':
            results['images'].append(single_result['image_data'])
            results['angles'].append(angle_name)
            print(f"  ✅ {angle_name.capitalize()} view generated")
        else:
            # If any angle fails, return fallback for all
            print(f"  ❌ {angle_name.capitalize()} view failed, using fallback")
            return {
                "status": "fallback",
                "message": f"Image generation failed at {angle_name} view",
                "enhanced_prompt": single_result.get('enhanced_prompt', angle_prompt),
                "parameters": results['parameters']
            }

    print(f"✅ All 4 angles generated successfully!")
    return results


def generate_multi_angle_from_image(
    reference_image_base64: str,
    prompt: str,
    aspect_ratio: str = "9:16",
    style: str = "photorealistic"
) -> dict:
    """
    Generate 4-angle views using a reference image for consistency.

    Uses Gemini's multimodal capabilities to generate new angles
    while maintaining visual consistency with the reference image.

    Args:
        reference_image_base64: Base64 encoded reference image
        prompt: Additional styling instructions
        aspect_ratio: Image aspect ratio (default: "9:16")
        style: Style preset (default: "photorealistic")

    Returns:
        Dictionary containing:
        - status: "success" or "error"
        - images: List of 4 base64 images [front, left, back, right]
        - angles: List of angle names
    """
    print(f"🎨 Generating 4-angle views from reference image...")

    angles = [
        ("front", "Show the exact same person and outfit from the front view, facing camera directly"),
        ("left", "Show the exact same person and outfit from the left side profile, 90 degrees left"),
        ("back", "Show the exact same person and outfit from the back view, back facing camera"),
        ("right", "Show the exact same person and outfit from the right side profile, 90 degrees right")
    ]

    results = {
        "status": "success",
        "images": [],
        "angles": [],
        "parameters": {
            "aspect_ratio": aspect_ratio,
            "style": style
        }
    }

    try:
        api_key = get_gemini_api_key()
        client = genai.Client(api_key=api_key)

        # Decode base64 image
        image_bytes = base64.b64decode(reference_image_base64)

        for angle_name, angle_instruction in angles:
            print(f"  📸 Generating {angle_name} view...")

            # Create multimodal prompt with image + text
            enhanced_prompt = f"""{angle_instruction}.

Maintain the exact same:
- Person (same face, body type, skin tone)
- Outfit (same dress/clothing items, colors, patterns)
- Accessories (same clutch, jewelry, shoes)
- Styling (same hair, makeup)

Additional context: {prompt}

Style: {style}, professional fashion photography
Lighting: Professional studio lighting
Quality: High resolution fashion editorial
"""

            # Try Gemini 2.5 Flash with multimodal input
            try:
                from google.genai.types import Part, Content

                response = client.models.generate_content(
                    model='gemini-2.5-flash-image',
                    contents=[
                        Content(
                            parts=[
                                Part.from_bytes(
                                    data=image_bytes,
                                    mime_type="image/png"
                                ),
                                Part.from_text(text=enhanced_prompt)
                            ]
                        )
                    ],
                    config=types.GenerateContentConfig(
                        response_modalities=["TEXT", "IMAGE"],
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
                )

                # Extract generated image
                if response.candidates:
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            angle_image_bytes = part.inline_data.data
                            angle_img_base64 = base64.b64encode(angle_image_bytes).decode()
                            results['images'].append(angle_img_base64)
                            results['angles'].append(angle_name)
                            print(f"  ✅ {angle_name.capitalize()} view generated")
                            break
                    else:
                        raise ImageGeneratorError(f"No image generated for {angle_name}")
                else:
                    raise ImageGeneratorError(f"No candidates in response for {angle_name}")

            except Exception as e:
                print(f"  ❌ {angle_name} failed: {str(e)}")
                raise ImageGeneratorError(f"Failed to generate {angle_name} view: {str(e)}")

        if len(results['images']) == 4:
            print(f"✅ All 4 angle views generated successfully from reference image!")
            return results
        else:
            raise ImageGeneratorError(f"Only generated {len(results['images'])}/4 angles")

    except Exception as e:
        print(f"❌ Image-to-image generation failed: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "parameters": results['parameters']
        }


def generate_image_with_nanoBanana(
    prompt: str,
    aspect_ratio: str = "9:16",
    style: str = "photorealistic"
) -> Optional[dict]:
    """
    Generate image using Google Gemini 2.5 Flash Image (Nano Banana capability).

    Attempts multiple strategies in order:
    1. Gemini 2.5 Flash Image with TEXT+IMAGE modalities
    2. Imagen 3 standalone model
    3. Claude-enhanced prompt fallback

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
    print(f"Generating image with Gemini 2.5 Flash Image (Nano Banana)...")
    print(f"Prompt: {prompt[:100]}...")

    try:
        # Get API key and initialize client
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

        # Strategy 1: Try Gemini 2.5 Flash Image with TEXT+IMAGE modalities
        print("📸 Trying Gemini 2.5 Flash Image (primary method)...")

        generate_config = types.GenerateContentConfig(
            # CRITICAL: Must include both TEXT and IMAGE for Gemini 2.5 Flash Image
            response_modalities=["TEXT", "IMAGE"],
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

        # Try Gemini 2.5 Flash Image models
        gemini_models_to_try = [
            'gemini-2.5-flash-image',
            'gemini-2.0-flash-preview-image-generation',
            'gemini-2.0-flash-thinking-exp-01-21',
        ]

        gemini_success = False
        for model_id in gemini_models_to_try:
            try:
                print(f"  Trying Gemini model: {model_id}")
                response = client.models.generate_content(
                    model=model_id,
                    contents=enhanced_prompt,
                    config=generate_config
                )

                # Check for image in response
                if response.candidates:
                    for part in response.candidates[0].content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            image_bytes = part.inline_data.data
                            img_base64 = base64.b64encode(image_bytes).decode()

                            print(f"✅ Image generated successfully with {model_id}!")
                            return {
                                "status": "success",
                                "image_data": img_base64,
                                "image_url": None,
                                "parameters": {
                                    "aspect_ratio": aspect_ratio,
                                    "style": style,
                                    "model": model_id
                                },
                                "metadata": {
                                    "generation_time": "instant",
                                    "prompt_used": enhanced_prompt,
                                    "note": f"Generated with {model_id} (Nano Banana)"
                                }
                            }

                print(f"  ⚠️  {model_id} returned text only (no image)")

            except Exception as model_error:
                print(f"  ❌ {model_id} failed: {str(model_error)[:100]}")
                continue

        # Strategy 2: Try standalone Imagen 3 model
        print("🔄 Trying standalone Imagen 3 model...")
        try:
            imagen_resp = client.models.generate_images(
                model='imagen-3.0-generate-001',
                prompt=enhanced_prompt,
                config=types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio=aspect_ratio,
                    include_rai_reason=True
                )
            )

            if imagen_resp.generated_images:
                img_bytes = imagen_resp.generated_images[0].image.image_bytes
                img_base64 = base64.b64encode(img_bytes).decode()

                print("✅ Image generated successfully with Imagen 3!")
                return {
                    "status": "success",
                    "image_data": img_base64,
                    "image_url": None,
                    "parameters": {
                        "aspect_ratio": aspect_ratio,
                        "style": style,
                        "model": "imagen-3.0-generate-001"
                    },
                    "metadata": {
                        "generation_time": "instant",
                        "prompt_used": enhanced_prompt,
                        "note": "Generated with Imagen 3"
                    }
                }
        except Exception as imagen_error:
            print(f"❌ Imagen 3 fallback failed: {str(imagen_error)[:100]}")

        # If we get here, all Google models failed
        raise ImageGeneratorError("All Google image generation models failed")

    except ImageGeneratorError as e:
        # Log the error and use fallback
        print(f"⚠️  Image generation error: {e}")
        print("🔄 Falling back to Claude-enhanced prompt generation...")

    except Exception as e:
        # Unexpected error - use fallback
        print(f"⚠️  Unexpected error with Google image generation: {e}")
        print("🔄 Falling back to Claude-enhanced prompt generation...")

    # Strategy 3: FALLBACK - Use Claude to enhance the prompt
    try:
        from anthropic import Anthropic

        claude_api_key = os.getenv("CLAUDE_API_KEY")
        if not claude_api_key:
            # If Claude API key also not available, return basic fallback
            basic_prompt = f"""Fashion photography: {prompt}

Style: {style}, high-quality professional fashion editorial
Aspect ratio: {aspect_ratio}
Professional studio lighting, sharp focus, high resolution
Editorial quality, suitable for fashion magazine
Model in neutral pose showcasing the complete outfit
Clean background, emphasis on clothing details and fit"""

            return {
                "status": "fallback",
                "message": "Image generation requires CLAUDE_API_KEY for prompt enhancement. Google image generation is unavailable.",
                "enhanced_prompt": basic_prompt,
                "parameters": {
                    "aspect_ratio": aspect_ratio,
                    "style": style
                }
            }

        # Use Claude to create an enhanced prompt
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
            "message": "Google image generation is currently unavailable. Use this Claude-enhanced prompt with external image generators like Midjourney, DALL-E, or Stable Diffusion.",
            "enhanced_prompt": claude_enhanced_prompt,
            "parameters": {
                "aspect_ratio": aspect_ratio,
                "style": style
            }
        }

    except Exception as fallback_error:
        # Ultimate fallback - return basic enhanced prompt
        print(f"⚠️  Fallback also failed: {fallback_error}")
        basic_prompt = f"""Fashion photography: {prompt}

Style: {style}, high-quality professional fashion editorial
Aspect ratio: {aspect_ratio}
Professional studio lighting, sharp focus, high resolution
Editorial quality, suitable for fashion magazine
Model in neutral pose showcasing the complete outfit
Clean background, emphasis on clothing details and fit"""

        return {
            "status": "fallback",
            "message": "Image generation services are currently unavailable. Please use the prompt below with external image generators.",
            "enhanced_prompt": basic_prompt,
            "parameters": {
                "aspect_ratio": aspect_ratio,
                "style": style
            }
        }


def generate_multiple_variations(
    prompt: str,
    count: int = 3,
    aspect_ratio: str = "9:16",
    style: str = "photorealistic"
) -> dict:
    """
    Generate multiple outfit variations from the same base prompt.

    This creates diverse styling options by adding variation-specific
    modifiers to the base prompt, ensuring each image is unique while
    maintaining the core style guide.

    Args:
        prompt: Base outfit description
        count: Number of variations to generate (default: 3)
        aspect_ratio: Image aspect ratio (default: "9:16")
        style: Style preset (default: "photorealistic")

    Returns:
        Dictionary containing:
        - status: "success" if all variations generated, "partial" if some failed
        - variations: List of image data dictionaries
        - count: Number of successful generations
        - parameters: Generation parameters
    """
    print(f"🎨 Generating {count} outfit variations...")

    # Variation modifiers to ensure diversity
    variation_modifiers = [
        "Styling variation 1: Classic interpretation with traditional accessories",
        "Styling variation 2: Modern twist with contemporary accessories and bold styling choices",
        "Styling variation 3: Fashion-forward approach with unique accessories and creative details"
    ]

    results = {
        "status": "success",
        "variations": [],
        "count": 0,
        "parameters": {
            "aspect_ratio": aspect_ratio,
            "style": style,
            "requested_count": count
        }
    }

    for i in range(count):
        modifier = variation_modifiers[i] if i < len(variation_modifiers) else f"Styling variation {i+1}"
        variation_prompt = f"{prompt}. {modifier}"

        print(f"  📸 Generating variation {i+1}/{count}...")

        single_result = generate_image_with_nanoBanana(
            prompt=variation_prompt,
            aspect_ratio=aspect_ratio,
            style=style
        )

        if single_result['status'] == 'success':
            results['variations'].append(single_result)
            results['count'] += 1
            print(f"  ✅ Variation {i+1} generated successfully")
        else:
            # On failure, still include the fallback result
            results['variations'].append(single_result)
            results['status'] = 'partial'
            print(f"  ⚠️  Variation {i+1} failed, added fallback")

    if results['count'] == 0:
        results['status'] = 'error'
        print(f"❌ All {count} variations failed to generate")
    else:
        print(f"✅ Generated {results['count']}/{count} variations successfully")

    return results


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

        print("Testing Nano Banana (Gemini 2.5 Flash Image) image generator...")
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

    except Exception as e:
        print(f"❌ Error: {e}")
