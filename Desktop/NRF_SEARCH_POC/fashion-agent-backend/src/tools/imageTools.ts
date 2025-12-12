/**
 * Image Generation Tools
 * Makes HTTP calls to Python backend for Gemini image generation
 */

import { config } from '../config';
import { ToolRegistry } from './ToolRegistry';
import {
  PythonErrorResponse,
  ImageGenerationResponse,
  OutfitVariationsResponse,
  MultiAngleResponse,
  VideoGenerationResponse
} from '../types/pythonBackend';

/**
 * Generate a single outfit image using Nano Banana (Gemini)
 */
async function generateOutfitImage(input: {
  prompt: string;
  aspect_ratio?: string;
  style?: string;
}): Promise<any> {
  const { prompt, aspect_ratio = '9:16', style = 'photorealistic' } = input;

  console.log(`🎨 Calling Python backend to generate image...`);

  const response = await fetch(`${config.pythonBackendUrl}/alex/generate-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio,
      style
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Unknown error" })) as PythonErrorResponse;
    throw new Error(`Image generation failed: ${errorData.detail}`);
  }

  const data = await response.json() as ImageGenerationResponse;

  if (!data.success) {
    throw new Error('Image generation returned unsuccessful status');
  }

  return {
    success: true,
    image_base64: data.data.image_data,
    prompt_used: data.data.metadata?.prompt_used || prompt,
    model: 'Gemini Nano Banana'
  };
}

/**
 * Generate 3 outfit variations from same prompt
 */
async function generateOutfitVariations(input: {
  prompt: string;
  count?: number;
  aspect_ratio?: string;
  style?: string;
}): Promise<any> {
  const { prompt, aspect_ratio = '9:16', style = 'photorealistic' } = input;

  console.log(`🎨 Calling Python backend to generate outfit variations...`);

  const response = await fetch(`${config.pythonBackendUrl}/alex/generate-outfit-variations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio,
      style
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' })) as PythonErrorResponse;
    throw new Error(`Outfit variations generation failed: ${errorData.detail}`);
  }

  const data = await response.json() as OutfitVariationsResponse;

  if (!data.success) {
    throw new Error('Outfit variations returned unsuccessful status');
  }

  return {
    success: true,
    variations: data.data.variations,
    count: data.data.variations.length,
    model: 'Gemini Nano Banana'
  };
}

/**
 * Generate 4-angle multi-view from reference image
 */
async function generateMultiAngleView(input: {
  image_base64: string;
  prompt: string;
  aspect_ratio?: string;
  style?: string;
}): Promise<any> {
  const { image_base64, prompt, aspect_ratio = '9:16', style = 'photorealistic' } = input;

  console.log(`🎨 Calling Python backend to generate multi-angle views...`);

  const response = await fetch(`${config.pythonBackendUrl}/alex/generate-multi-angle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image_base64,
      prompt,
      aspect_ratio,
      style
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' })) as PythonErrorResponse;
    throw new Error(`Multi-angle generation failed: ${errorData.detail}`);
  }

  const data = await response.json() as MultiAngleResponse;

  if (!data.success) {
    throw new Error('Multi-angle generation returned unsuccessful status');
  }

  return {
    success: true,
    angles: data.data.images.map((img: string, idx: number) => ({
      name: ['Front', 'Left', 'Back', 'Right'][idx],
      image_base64: img
    })),
    model: 'Gemini 2.5 Flash (multimodal)'
  };
}

/**
 * Generate video from image using Veo 3
 */
async function generateOutfitVideo(input: {
  image_base64: string;
  prompt: string;
  duration?: number;
  aspect_ratio?: string;
}): Promise<any> {
  const { image_base64, prompt, duration = 6, aspect_ratio = '9:16' } = input;

  console.log(`🎥 Calling Python backend to generate video...`);

  const response = await fetch(`${config.pythonBackendUrl}/alex/generate-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      image_base64,
      prompt,
      duration,
      aspect_ratio
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' })) as PythonErrorResponse;
    throw new Error(`Video generation failed: ${errorData.detail}`);
  }

  const data = await response.json() as VideoGenerationResponse;

  if (!data.success) {
    throw new Error('Video generation returned unsuccessful status');
  }

  return {
    success: true,
    video_base64: data.data.video_data,
    duration: data.data.metadata?.duration || duration,
    model: 'Veo 3.1'
  };
}

/**
 * Register all image generation tools
 */
export function registerImageTools(registry: ToolRegistry): void {
  registry.register(
    'generate_outfit_image',
    'Generate a photorealistic image of an outfit based on a detailed description. Use this when the user asks to visualize an outfit or see what it would look like.',
    {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed description of the outfit, including person characteristics (age, gender, body type, skin tone), clothing items, colors, patterns, setting, lighting, and styling details. Be very specific and descriptive.'
        },
        aspect_ratio: {
          type: 'string',
          description: 'Image aspect ratio',
          enum: ['9:16', '16:9', '1:1']
        },
        style: {
          type: 'string',
          description: 'Visual style of the image',
          enum: ['photorealistic', 'artistic', 'fashion']
        }
      },
      required: ['prompt']
    },
    generateOutfitImage
  );

  registry.register(
    'generate_outfit_variations',
    'Generate 3 different variations of an outfit style. Use this when the user wants to see multiple options or variations of a styling concept.',
    {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Base outfit description to create variations from'
        },
        aspect_ratio: {
          type: 'string',
          description: 'Image aspect ratio',
          enum: ['9:16', '16:9', '1:1']
        },
        style: {
          type: 'string',
          description: 'Visual style',
          enum: ['photorealistic', 'artistic', 'fashion']
        }
      },
      required: ['prompt']
    },
    generateOutfitVariations
  );

  registry.register(
    'generate_multi_angle_view',
    'Generate 4 different angle views (Front, Left, Back, Right) of an existing outfit image. Use this when the user wants to see an outfit from multiple angles or get a 360° view.',
    {
      type: 'object',
      properties: {
        image_base64: {
          type: 'string',
          description: 'Base64 encoded image data (from a previous generation)'
        },
        prompt: {
          type: 'string',
          description: 'Description of the outfit to maintain consistency across angles'
        },
        aspect_ratio: {
          type: 'string',
          description: 'Image aspect ratio',
          enum: ['9:16', '16:9', '1:1']
        },
        style: {
          type: 'string',
          description: 'Visual style',
          enum: ['photorealistic', 'artistic', 'fashion']
        }
      },
      required: ['image_base64', 'prompt']
    },
    generateMultiAngleView
  );

  registry.register(
    'generate_outfit_video',
    'Generate an animated video of an outfit (e.g., 360° rotation, model walking). Use this when the user wants to see the outfit in motion or from a dynamic perspective.',
    {
      type: 'object',
      properties: {
        image_base64: {
          type: 'string',
          description: 'Base64 encoded image to animate'
        },
        prompt: {
          type: 'string',
          description: 'Animation prompt (e.g., "Slowly rotate 360 degrees", "Model walks down runway")'
        },
        duration: {
          type: 'number',
          description: 'Video duration in seconds (4-8)',
          enum: [4, 5, 6, 7, 8]
        },
        aspect_ratio: {
          type: 'string',
          description: 'Video aspect ratio',
          enum: ['9:16', '16:9', '1:1']
        }
      },
      required: ['image_base64', 'prompt']
    },
    generateOutfitVideo
  );

  console.log('✅ Image generation tools registered');
}
