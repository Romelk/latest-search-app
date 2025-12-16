# SVG Icons Directory

This directory contains all SVG icons used in the New Search conversational interface.

## Icon Files Status

✅ **All icons successfully converted from EPS to PNG format!**

The following PNG files are now in use:

### 1. Coco Logo
**Filename**: `coco-logo.png`
**Usage**: Main Coco AI assistant avatar (robot character)
**Where it appears**:
- Chat header (48x48px)
- Chat message avatars (36x36px)

### 2. Toolkit Icons
These icons appear in the bottom toolbar of the chat panel:

**Filename**: `analyze-style.png`
**Tool**: Analyze My Style
**Replaces**: 📸 emoji
**Routes to**: `/toolkit?tool=analyze-style`

**Filename**: `match-checker.png`
**Tool**: Outfit Compatibility Checker ("Do These Match?")
**Replaces**: 🤝 emoji
**Routes to**: `/toolkit?tool=match-checker`

**Filename**: `visual-search.png`
**Tool**: Visual Search ("Find Similar Items")
**Replaces**: 🔍 emoji
**Routes to**: `/toolkit?tool=visual-search`

**Filename**: `try-on.png`
**Tool**: Enhanced Try-On Visualization
**Replaces**: 👕 emoji
**Routes to**: `/toolkit?tool=try-on`

**Filename**: `style-profile.png`
**Tool**: Personal Style Profile Builder
**Replaces**: 👤 emoji
**Routes to**: `/toolkit?tool=style-profile`

## File Requirements

- **Format**: SVG (preferred) or PNG (fallback)
  - If you have .eps files, place them here and I'll convert them to SVG
  - PNG files should be high resolution (at least 512x512px for good quality)
- **Naming**: kebab-case (lowercase with hyphens)
- **Size**: Optimized for web (prefer under 10KB for SVG, under 50KB for PNG)
- **Colors**: Use purple/pink theme colors (#8B5CF6, #C084FC) or ensure icons work with CSS color properties

## Usage in Code

Icons are referenced using the following pattern:

```tsx
// Coco Logo
<img src="/icons/coco-logo.png" alt="Coco" className="w-12 h-12" />

// Toolkit Icons
<img src="/icons/analyze-style.png" alt="Analyze Style" className="w-5 h-5" />
```

## Testing

After placing the SVG files, verify they display correctly by:
1. Starting the development server: `npm run dev`
2. Navigating to `/new-search`
3. Performing a search to see the chat panel
4. Checking that all icons render properly

## Notes

- SVG files should be clean and optimized (remove unnecessary metadata)
- Ensure transparent backgrounds for better integration
- Icons should be visually distinct and recognizable at small sizes
- Maintain consistent visual style across all icons
