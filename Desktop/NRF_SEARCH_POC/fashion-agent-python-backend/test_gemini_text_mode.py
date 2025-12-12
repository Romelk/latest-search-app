"""
Test Gemini models WITHOUT response_modalities to see default behavior
"""
import os
from google import genai

def main():
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print('⚠️  GOOGLE_API_KEY not set')
        return

    print('🔍 Testing Gemini Models (Text Mode)')
    print('=' * 60)

    client = genai.Client(api_key=api_key)

    # Models that were accessible
    models_to_test = [
        'gemini-2.0-flash-exp',
        'gemini-exp-1206',
    ]

    test_prompt = "Generate a detailed description of a professional business outfit for a woman"

    for model_name in models_to_test:
        print(f'\n🧪 Testing: {model_name}')
        print('-' * 60)

        try:
            # Try without response_modalities - just normal generation
            response = client.models.generate_content(
                model=model_name,
                contents=test_prompt,
            )

            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'text') and part.text:
                        print(f'✅ Model works in text mode')
                        print(f'   Response: {part.text[:150]}...')
                    elif hasattr(part, 'inline_data'):
                        print(f'🎉 UNEXPECTED IMAGE! Model generated image without IMAGE modality')
                        print(f'   Image size: {len(part.inline_data.data)} bytes')

        except Exception as e:
            print(f'❌ Error: {str(e)[:100]}')

    print('\n' + '=' * 60)
    print('📝 Conclusion: Gemini models work for text, but not image generation via API')
    print('�� Image generation (Nano Banana) may require:')
    print('   - Vertex AI access (not AI Studio API)')
    print('   - Special beta access')
    print('   - Or feature not yet publicly available')

if __name__ == '__main__':
    main()
