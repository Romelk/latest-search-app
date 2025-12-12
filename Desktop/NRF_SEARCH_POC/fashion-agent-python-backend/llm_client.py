"""
Claude LLM client wrapper for Alex Fashion Stylist
Handles API calls to Anthropic's Claude API
"""
import os
from typing import Optional
from anthropic import Anthropic, APIError


# Default model for Claude API calls
# Using Claude Sonnet 4 - the latest and most capable model
DEFAULT_MODEL = "claude-sonnet-4-20250514"


class ClaudeClientError(Exception):
    """Custom exception for Claude client errors"""
    pass


def get_api_key() -> str:
    """
    Get Claude API key from environment variable.

    Returns:
        API key string

    Raises:
        ClaudeClientError: If API key is not set
    """
    # Get API key from environment variable
    api_key = os.getenv("CLAUDE_API_KEY")

    if not api_key:
        raise ClaudeClientError(
            "CLAUDE_API_KEY environment variable is not set. "
            "Please set it with: export CLAUDE_API_KEY='your-api-key'"
        )
    return api_key


def call_claude(
    system_prompt: str,
    user_prompt: str,
    model: str = DEFAULT_MODEL,
    max_tokens: int = 4000,
    temperature: float = 1.0
) -> str:
    """
    Call Claude API with system and user prompts.

    Args:
        system_prompt: System-level instructions for Claude
        user_prompt: User message/prompt for the specific task
        model: Claude model to use (default: claude-3-5-sonnet-20241022)
        max_tokens: Maximum tokens in response (default: 4000)
        temperature: Sampling temperature 0-1 (default: 1.0)

    Returns:
        Response text content from Claude

    Raises:
        ClaudeClientError: If API call fails or returns invalid response
    """
    try:
        # Get API key
        api_key = get_api_key()

        # Initialize Anthropic client
        client = Anthropic(api_key=api_key)

        # Make API call
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": user_prompt
                }
            ]
        )

        # Extract text content from response
        if not response.content or len(response.content) == 0:
            raise ClaudeClientError("Empty response from Claude API")

        # Get the text from the first content block
        text_content = response.content[0].text

        return text_content

    except APIError as e:
        raise ClaudeClientError(f"Claude API error: {e}")
    except Exception as e:
        raise ClaudeClientError(f"Unexpected error calling Claude: {e}")


def call_claude_json(
    system_prompt: str,
    user_prompt: str,
    model: str = DEFAULT_MODEL,
    max_tokens: int = 4000
) -> str:
    """
    Call Claude API specifically for JSON output.
    Uses temperature=0 for more deterministic, structured output.

    Args:
        system_prompt: System-level instructions (should specify JSON output)
        user_prompt: User message/prompt
        model: Claude model to use
        max_tokens: Maximum tokens in response

    Returns:
        Response text content (should be valid JSON)

    Raises:
        ClaudeClientError: If API call fails
    """
    return call_claude(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        model=model,
        max_tokens=max_tokens,
        temperature=0.0  # Low temperature for structured output
    )


if __name__ == "__main__":
    """Test the Claude client"""
    try:
        # Test with a simple prompt
        system = "You are a helpful assistant that responds in JSON format."
        user = 'Return a JSON object with a single key "status" set to "ok".'

        print("Testing Claude API connection...")
        response = call_claude_json(system, user, max_tokens=100)
        print(f"Success! Response: {response}")

    except ClaudeClientError as e:
        print(f"Error: {e}")
