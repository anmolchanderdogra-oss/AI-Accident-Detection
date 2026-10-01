# UI/UX Design Brief
## AI-Based Accident Detection and Emergency Alert System

### 1. Design Direction
Use the supplied **Flip7 Design System** as the visual foundation, adapted from a game interface into a serious-but-friendly road-safety dashboard.

The interface should feel:
- Modern
- High contrast
- Fast to understand
- Mobile responsive
- Visually consistent
- Alert-focused without becoming frightening

### 2. Color Tokens
```css
--primary-teal: #2BA8A2;
--primary-light: #3CC4BD;
--primary-dark: #1E8C86;
--primary-bg: #E8F6F5;

--accent-gold: #FFD23F;
--accent-light: #FFE47A;
--accent-dark: #E6B800;

--coral: #EF6C4A;
--coral-light: #FF8A6A;
--coral-dark: #D45233;

--cream: #FFF8E7;
--sky-blue: #5DADE2;

--surface-base: #EFF8F7;
--surface-card: #FFFFFF;

--success: #27AE60;
--error: #E74C3C;
```

### 3. Typography
- Headings: system font stack, 800 weight.
- Body: `-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`
- Web equivalent sizes:
  - Display: 48px+
  - H1: 32px
  - H2: 24px
  - H3: 20px
  - Body: 16px
  - Small: 14px
  - XS: 12px

### 4. Spacing
Use an 8px base grid:
- 8px
- 16px
- 24px
- 32px
- 48px

### 5. Radius
- Small: 8px
- Medium: 16px
- Large: 24px
- XL: 32px
- Pills: 999px

### 6. Shadows
Prefer soft colored glows:
```css
--shadow-sm: 0 2px 8px rgba(0,0,0,.08);
--shadow-md: 0 4px 16px rgba(0,0,0,.12);
--shadow-lg: 0 8px 32px rgba(0,0,0,.16);
--shadow-card: 0 4px 20px rgba(43,168,162,.10);
--shadow-coral-glow: 0 4px 20px rgba(239,108,74,.35);
--shadow-teal-glow: 0 4px 20px rgba(43,168,162,.30);
--shadow-accent-glow: 0 4px 20px rgba(255,210,63,.40);
```

### 7. Dashboard Layout
```text
+--------------------------------------------------+
| AI ACCIDENT GUARD        System: ONLINE          |
+--------------------------------------------------+
| Detection      | Confidence   | Incidents       |
| READY          | 0%           | 24              |
+--------------------------------------------------+
|                                                  |
|              LIVE VIDEO / PREVIEW                |
|                                                  |
+--------------------------------------------------+
| [Start Camera] [Upload Video] [Emergency Test]  |
+--------------------------------------------------+
| Recent Incidents                                 |
| #102  Probable accident  91%  12:42  [View]     |
| #101  Reviewed           84%  11:18  [View]     |
+--------------------------------------------------+
```

### 8. Accident State
Use coral for the active accident state:
- Coral left border.
- Coral glow.
- Large warning icon container.
- Confidence value.
- Timestamp.
- Evidence preview.
- Location status.
- Alert status.

Suggested copy:
**“PROBABLE ACCIDENT DETECTED”**

### 9. Buttons
Primary:
- Gold pill button.
- Minimum 44px touch height on web.
- Hover: lighter gold.
- Active: scale 0.95.

Counter-style:
- Teal/coral rounded square.

Emergency:
- Coral button with coral glow.

Information:
- Sky-blue accent.

### 10. Cards
Every incident/scoring-style card should have:
- White background.
- 24px radius.
- Soft teal card shadow.
- 6px colored left accent.
- Teal = normal.
- Gold = highlighted.
- Coral = active accident/warning.
- Green = resolved/success.

### 11. Status Badges
- ONLINE → success green
- READY → teal
- PROCESSING → sky blue
- PROBABLE ACCIDENT → coral
- ALERT SENT → success green
- ALERT FAILED → error red
- LOCATION UNAVAILABLE → gold

### 12. Mobile UX
- Single-column layout.
- Sticky primary action.
- Large camera preview.
- Large accident alert.
- Minimum 44px touch targets.
- Avoid dense tables on small screens.
- Use cards instead of wide grids.

### 13. Accessibility
- Do not rely on color alone.
- Include text labels/icons for every state.
- Maintain readable contrast.
- Keyboard navigation.
- Visible focus states.
- Alt text for evidence images.
