"""
Test script to check available Gemini models and test image generation
"""
import os
from google import genai
from google.genai import types

def main():
    # Get API key
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print('⚠️  GOOGLE_API_KEY environment variable not set')
        print('Please set it with: export GOOGLE_API_KEY="your-key"')
        return

    print('🔍 Testing Gemini Models for Image Generation')
    print('=' * 60)

    # Initialize client
    client = genai.Client(api_key=api_key)

    # Models to test
    models_to_test = [
        'gemini-2.0-flash-thinking-exp-01-21',
        'gemini-exp-1206',
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash-thinking-exp',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
    ]

    # Simple test prompt
    test_prompt = "A simple red apple on a white background"

    # Configuration with IMAGE response modality
    config = types.GenerateContentConfig(
        response_modalities=["IMAGE"],
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

    successful_models = []

    for model_name in models_to_test:
        print(f'\n🧪 Testing: {model_name}')
        print('-' * 60)

        try:
            response = client.models.generate_content(
                model=model_name,
                contents=test_prompt,
                config=config
            )

            # Check response structure
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'inline_data') and part.inline_data:
                        print(f'✅ SUCCESS! Model {model_name} generated an image')
                        print(f'   Image size: {len(part.inline_data.data)} bytes')
                        successful_models.append(model_name)
                        break
                    elif hasattr(part, 'text') and part.text:
                        print(f'⚠️  Model returned text instead of image')
                        print(f'   Text preview: {part.text[:100]}...')
                else:
                    print(f'⚠️  Model returned response but no image or text found')
            else:
                print(f'⚠️  Model returned empty candidates')

        except Exception as e:
            error_msg = str(e)
            if 'does not support the requested response modalities' in error_msg:
                print(f'❌ Model does not support IMAGE modality')
            elif '404' in error_msg:
                print(f'❌ Model not found')
            elif '400' in error_msg:
                print(f'❌ Invalid request: {error_msg[:100]}')
            else:
                print(f'❌ Error: {error_msg[:100]}')

    print('\n' + '=' * 60)
    print('📊 SUMMARY')
    print('=' * 60)
    if successful_models:
        print(f'✅ {len(successful_models)} model(s) successfully generated images:')
        for model in successful_models:
            print(f'   - {model}')
    else:
        print('❌ No models successfully generated images')
        print('\nℹ️  This may mean:')
        print('   1. Image generation is not yet available in public Gemini API')
        print('   2. Need to use Vertex AI instead of AI Studio API')
        print('   3. Need to wait for Google to enable this feature')
        print('\n💡 Recommendation: Use the Claude fallback for now')

if __name__ == '__main__':
    main()
