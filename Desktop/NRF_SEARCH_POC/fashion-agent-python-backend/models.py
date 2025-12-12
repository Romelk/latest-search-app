"""
Pydantic models for Alex Fashion Stylist API
Defines request/response schemas and data structures
"""
from pydantic import BaseModel, Field
from typing import List, Literal, Optional


# ============================================================================
# Request Models (User Input)
# ============================================================================

class UserProfile(BaseModel):
    """User profile information for personalized styling"""
    age: int = Field(..., ge=13, le=100, description="User's age")
    gender_expression: Literal["male", "female", "androgynous", "other"]
    body_type: str = Field(..., description="Body type description (e.g., 'average', 'athletic', 'curvy')")
    skin_tone: Literal["fair", "light", "wheatish", "medium", "tan", "deep", "dark"]
    height_cm: int = Field(..., ge=100, le=250, description="Height in centimeters")
    location_climate: Literal["warm", "hot", "temperate", "cold", "humid", "dry", "mixed"]
    style_preferences: List[str] = Field(
        default_factory=list,
        description="List of style preferences (e.g., 'minimal', 'streetwear', 'classic')"
    )
    colour_blocklist: List[str] = Field(
        default_factory=list,
        description="Colours to avoid"
    )
    comfort_constraints: List[str] = Field(
        default_factory=list,
        description="Comfort requirements (e.g., 'no heels', 'no tight fits')"
    )
    budget_level: Literal["low", "medium", "high"]


class OccasionContext(BaseModel):
    """Context information about the styling occasion"""
    occasion_type: Literal[
        "office", "date", "wedding_guest", "festival",
        "vacation", "party", "casual_outing"
    ]
    formality: Literal["casual", "smart_casual", "semi_formal", "formal"]
    time_of_day: Literal["day", "evening", "night"]
    cultural_notes: str = Field(
        default="",
        description="Cultural context or specific requirements"
    )
    location_city: str = Field(..., description="City/location of the event")
    region: str = Field(..., description="Region (e.g., 'India', 'Europe', 'US', 'Global')")


class AlexStyleRequest(BaseModel):
    """Complete styling request combining user profile and occasion context"""
    user_profile: UserProfile
    context: OccasionContext


# ============================================================================
# Response Models (Style Guide Output)
# ============================================================================

class KeyPiece(BaseModel):
    """A single key garment piece in the outfit"""
    item_type: str = Field(..., description="Type of garment (e.g., 'trousers', 'shirt', 'dress')")
    description: str = Field(..., description="Detailed description of the item")
    fit: str = Field(..., description="Fit description (e.g., 'relaxed', 'slim', 'boxy')")
    price_band: Literal["low", "medium", "high"]


class ColourPalette(BaseModel):
    """Colour palette for the outfit"""
    primary: List[str] = Field(..., description="Primary colours")
    accent: List[str] = Field(default_factory=list, description="Accent colours")


class StyleGuide(BaseModel):
    """Complete styling guide with outfit details"""
    title: str = Field(..., description="Title of the look")
    one_line_summary: str = Field(..., description="Brief summary of the style")
    key_pieces: List[KeyPiece] = Field(..., description="List of key garment pieces")
    colour_palette: ColourPalette = Field(..., description="Colour scheme")
    fabrics_textures: List[str] = Field(..., description="Recommended fabrics and textures")
    footwear: str = Field(..., description="Footwear recommendation")
    accessories: List[str] = Field(default_factory=list, description="Accessory suggestions")
    grooming_hair: str = Field(..., description="Hair and grooming guidance")
    dos: List[str] = Field(..., description="Styling dos")
    donts: List[str] = Field(..., description="Styling don'ts")
    trend_references: List[str] = Field(
        default_factory=list,
        description="Fashion trends referenced in this look"
    )


class MediaPrompts(BaseModel):
    """Prompts for image and video generation"""
    image_prompt: str = Field(..., description="Prompt for generating outfit image (Nano Banana)")
    video_prompt: str = Field(..., description="Prompt for generating 360 video (Veo 3)")


class AlexStyleResponse(BaseModel):
    """Complete API response with style guide and media prompts"""
    style_guide: StyleGuide
    media_prompts: MediaPrompts


# ============================================================================
# Trend Models (Database)
# ============================================================================

class Trend(BaseModel):
    """Fashion trend extracted from articles and stored in database"""
    name: str
    season: str = "All season"
    garment_types: List[str] = Field(default_factory=list)
    gender_focus: Literal["all", "men", "women"] = "all"
    style_tags: List[str] = Field(default_factory=list)
    colour_palette: List[str] = Field(default_factory=list)
    fit_notes: str = ""
    contexts: List[str] = Field(default_factory=list)
    formality: Literal["casual", "smart_casual", "semi_formal", "formal"] = "casual"
    climate_suitability: List[str] = Field(default_factory=list)
    region: str = "global"
    key_items: List[str] = Field(default_factory=list)
    avoid_for_body_types: List[str] = Field(default_factory=list)
    source_title: str
    source_url: str
    published_at: str
    confidence: Literal["high", "medium", "low"] = "medium"


# ============================================================================
# Example Data for Testing
# ============================================================================

def get_example_request() -> AlexStyleRequest:
    """Returns an example styling request for testing"""
    return AlexStyleRequest(
        user_profile=UserProfile(
            age=29,
            gender_expression="female",
            body_type="average",
            skin_tone="wheatish",
            height_cm=165,
            location_climate="warm",
            style_preferences=["minimal", "classic"],
            colour_blocklist=["neon green"],
            comfort_constraints=["no heels", "no tight fits"],
            budget_level="medium"
        ),
        context=OccasionContext(
            occasion_type="office",
            formality="smart_casual",
            time_of_day="day",
            cultural_notes="Indian tech office",
            location_city="Bengaluru",
            region="India"
        )
    )


if __name__ == "__main__":
    # Test model serialization
    example = get_example_request()
    print("Example Request JSON:")
    print(example.model_dump_json(indent=2))
