---
name: plud-design
description: Use this skill when designing interfaces for Plud, an AI workspace for knowledge management. The design system features a calm, intellectual, and focused atmosphere with a light color scheme. Key colors include primary '#2c746e', ink '#030c0a', and canvas '#faf9f5'. Typography is based on 'DM Sans' with prominent display styles like 'display-xl' and accessible body text options.
---
```yaml
brand: plud
mood: A calm, intellectual, and focused atmosphere for deep work and knowledge retention.
scheme: light
colors:
  primary: "#2c746e"
  primary-bright: "#378881"
  primary-deep: "#235d58"
  on-primary: "#ffffff"
  ink: "#030c0a"
  ink-soft: "#374151"
  on-ink: "#ffffff"
  canvas: "#faf9f5"
  paper: "#ffffff"
  cloud: "#f9fafb"
  hairline: "#e5e7eb"
  hairline-strong: "#d1d5db"
  link: "#111827"
  link-pressed: "#000000"
  success: "#059669"
  warning: "#d97706"
  error: "#d92d20"
  accent-lavender: "#f5f3ff"
  accent-mint: "#f0fdfa"
  accent-sky: "#eff6ff"
  accent-rose: "#fef2f2"
  accent-leaf: "#ecfdf5"
  accent-sun: "#fffbeb"
typography:
  display-xl: { fontFamily: "DM Sans", fontSize: 72px, fontWeight: 700, lineHeight: 1.1 }
  display-lg: { fontFamily: "DM Sans", fontSize: 48px, fontWeight: 700, lineHeight: 1.2 }
  display-md: { fontFamily: "DM Sans", fontSize: 36px, fontWeight: 700, lineHeight: 1.2 }
  display-sm: { fontFamily: "DM Sans", fontSize: 20px, fontWeight: 600, lineHeight: 1.3 }
  body-lg: { fontFamily: "DM Sans", fontSize: 20px, fontWeight: 400, lineHeight: 1.5 }
  body-md: { fontFamily: "DM Sans", fontSize: 16px, fontWeight: 400, lineHeight: 1.6 }
  body-emphasis: { fontFamily: "DM Sans", fontSize: 16px, fontWeight: 600, lineHeight: 1.6 }
  caption-md: { fontFamily: "DM Sans", fontSize: 14px, fontWeight: 400, lineHeight: 1.4 }
  caption-sm: { fontFamily: "DM Sans", fontSize: 12px, fontWeight: 400, lineHeight: 1.3 }
  button-md: { fontFamily: "DM Sans", fontSize: 12px, fontWeight: 600, lineHeight: 1.33 }
  link-md: { fontFamily: "DM Sans", fontSize: 14px, fontWeight: 400, lineHeight: 1.42 }
rounded:
  none: 0px
  xs: 6px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 40px
  pill: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 80px
shadows:
  none: "none"
  soft-lift: "none"
  card: "none"
  modal: "none"
motion:
  duration-fast: 150ms
  duration-base: 250ms
  duration-slow: 300ms
  ease-standard: "cubic-bezier(0.4, 0, 0.2, 1)"
  ease-emphasized: "cubic-bezier(0, 0, 0.2, 1)"
  transition-fast: "all {motion.duration-fast} {motion.ease-standard}"
  transition-default: "all {motion.duration-base} {motion.ease-standard}"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    height: "24px"
    border: "none"
    shadow: "{shadows.none}"
    cursor: pointer
  button-primary-hover:
    backgroundColor: "{colors.primary-bright}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    height: "24px"
    border: "1px solid {colors.primary}"
    shadow: "{shadows.none}"
    cursor: pointer
  button-outline-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  link:
    textColor: "{colors.link}"
    typography: "{typography.link-md}"
    textDecoration: "underline"
    cursor: pointer
  link-hover:
    textColor: "{colors.primary}"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.hairline}"
    padding: "{spacing.lg}"
    shadow: "{shadows.none}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    border: "1px solid {colors.hairline}"
    padding: "{spacing.sm} {spacing.md}"
    cursor: text
  input-focus:
    border: "1px solid {colors.primary}"
    shadow: "{shadows.none}"
  navigation-item:
    textColor: "{colors.ink-soft}"
    typography: "{typography.caption-md}"
    cursor: pointer
  navigation-item-hover:
    textColor: "{colors.primary}"
  badge:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.primary}"
    typography: "{typography.caption-sm}"
    rounded: "{rounded.pill}"
    border: "1px solid {colors.hairline}"
    padding: "2px {spacing.xs}"
  tab:
    textColor: "{colors.ink-soft}"
    typography: "{typography.body-md}"
    borderBottom: "2px solid transparent"
    padding: "{spacing.xs} {spacing.md}"
    cursor: pointer
  tab-active:
    textColor: "{colors.primary}"
    borderBottom: "2px solid {colors.primary}"
```

## Visual Theme & Atmosphere
The plud design system projects a calm, intellectual, and minimalist atmosphere. It is designed to feel like a modern, digital workspace for focused learning and knowledge management, avoiding distraction and promoting clarity. The visual language is clean and airy, using generous whitespace and a muted, organic color palette to create a serene user experience. This encourages deep engagement with content rather than fleeting interaction. The overall aesthetic is professional yet approachable, blending the rigor of academic tools with the simplicity of modern consumer software.

Key Characteristics:
*   **Minimalist & Flat:** The interface is strictly flat, using `{shadows.none}` exclusively. Emphasis is achieved through color, typographic scale, and fine `{colors.hairline}` borders, not through shadows or gradients. This creates a clean, uncluttered, and contemporary feel.
*   **Organic Palette:** The core palette is warm and natural, built around a creamy `{colors.canvas}` background, deep teal `{colors.primary}` for accents, and near-black `{colors.ink}` for text. This avoids the harshness of pure black and white.
*   **Unified Typography:** A single, highly-legible sans-serif font, **DM Sans**, is used for all text roles, from `{typography.display-xl}` headlines to `{typography.button-md}` labels. This creates a cohesive and harmonious typographic system.
*   **Generous Whitespace:** The layout breathes, using large `{spacing.section}` gaps between content blocks and ample internal padding within components. This prevents cognitive overload and improves readability.
*   **Soft Corners & Pills:** Interactive elements like buttons are fully rounded into `{rounded.pill}` shapes. Containers like cards use a soft `{rounded.lg}` radius, creating a friendly and modern appearance that avoids sharp, severe edges.
*   **Subtle Structure:** Page structure is defined by alternating background colors like `{colors.canvas}` and `{colors.cloud}`, and content is grouped within `{components.card}` containers that have a delicate `1px solid {colors.hairline}` border.
*   **Purposeful Color Accents:** Beyond the primary teal, a family of soft pastel accents (`{colors.accent-mint}`, `{colors.accent-lavender}`, etc.) is used sparingly for categorical labeling, adding a touch of visual interest without overwhelming the user.

## Color Usage Rules
The plud color system is intentionally constrained to foster consistency and a tranquil user experience. An agent should rely almost exclusively on the core palette: `{colors.primary}`, `{colors.ink}`, `{colors.ink-soft}`, `{colors.canvas}`, `{colors.paper}`, `{colors.cloud}`, and `{colors.hairline}`. These tokens cover nearly all UI needs, from text and backgrounds to borders and interactive states.

*   **Primary Action Color:** `{colors.primary}` is the brand's signature deep teal. It must be used sparingly to draw attention to the most important actions on a page, such as the main "Get Started" call-to-action. A viewport should contain at most two `{components.button-primary}` instances. It is also used for hover states on links and other interactive elements to provide clear feedback.
*   **Surface Colors:** The base background for all pages is `{colors.canvas}`, a warm, creamy off-white. For distinct content sections that need to be visually separated, use `{colors.cloud}`, a very light, neutral gray. For components that need to appear elevated or layered on top of the canvas, such as cards and modals, use `{colors.paper}` (pure white). Never use `{colors.paper}` as the main page background.
*   **Text Colors:** The primary text color for all headings and dense body copy is `{colors.ink}`, a soft, near-black. For secondary information, sub-headings, or less important labels, use the lighter `{colors.ink-soft}`. Text on a `{colors.primary}` surface must always be `{colors.on-primary}`.
*   **Borders and Dividers:** All borders and dividers should use `{colors.hairline}`. This subtle gray provides structure without creating harsh visual separation. For an emphasized border, such as on a focused input, `{colors.hairline-strong}` can be used, but `{colors.primary}` is preferred for interactive focus states.
*   **Accent Palette:** The `{colors.accent-*}` family (e.g., `{colors.accent-lavender}`, `{colors.accent-mint}`) is reserved exclusively for categorical tagging and small, decorative background flourishes on feature lists. They should never be used for primary text, buttons, or large background surfaces.
*   **No New Colors:** Never introduce a color that is not already defined as a token. The existing palette is sufficient. Reuse is paramount to maintaining brand consistency. If a new color seems necessary, re-evaluate the design to see if an existing token can serve the purpose.
*   **Emphasis Through Contrast, Not Shadow:** As this is a flat design system (`{usesShadows: false}`), emphasis and depth must be created using other means. Use the contrast between `{colors.primary}` and `{colors.canvas}`, the scale difference between `{typography.display-lg}` and `{typography.body-md}`, or the containment of a `{components.card}` to draw attention and structure the page. Shadows are forbidden.

## Typography Hierarchy
All text within the plud interface uses the **DM Sans** font family. This unified approach ensures consistency and a clean, modern aesthetic across all headings, body copy, and UI elements. The hierarchy is established through a clear scale of sizes and weights, allowing users to navigate the content intuitively.

| Role            | Token                  | Use                                                                 |
|-----------------|------------------------|---------------------------------------------------------------------|
| Display XL      | `{typography.display-xl}` | The main page hero headline. Use only once per page.                |
| Display LG      | `{typography.display-lg}` | Major section titles.                                               |
| Display MD      | `{typography.display-md}` | Sub-section titles or significant callouts.                         |
| Display SM      | `{typography.display-sm}` | Card titles, feature headlines.                                     |
| Body LG         | `{typography.body-lg}`   | Introductory paragraphs or sub-headlines directly below a hero.     |
| Body MD         | `{typography.body-md}`   | The default style for all standard body copy and component text.    |
| Body Emphasis   | `{typography.body-emphasis}` | For bolding text within a `{typography.body-md}` paragraph for emphasis. |
| Caption MD      | `{typography.caption-md}`| Secondary text, navigation links, and descriptive labels.         |
| Caption SM      | `{typography.caption-sm}`| Tertiary information, small UI labels, and helper text.             |
| Button MD       | `{typography.button-md}` | The standard text style for all buttons.                            |
| Link MD         | `{typography.link-md}`   | The standard text style for all standalone or inline links.         |

**Typography Principles:**

1.  **Strict Hierarchy:** Always respect the defined typographic scale. Do not skip levels (e.g., jumping from a `{typography.display-lg}` to `{typography.body-md}` without an intermediary heading). This ensures a logical and scannable content flow.
2.  **Readability is Paramount:** Body copy should be set in `{typography.body-md}` with its generous `{lineHeight: 1.6}`. Line lengths should be kept between 60-80 characters to ensure comfortable reading.
3.  **Weight Over Style:** Use `{fontWeight}` variations for emphasis. Avoid using italics, as they are not part of this design system's core style. All-caps text should be used extremely sparingly, if at all, and is not a defined token.
4.  **Consistency is Key:** Use DM Sans for everything. Do not introduce other fonts. The consistency of the single font family is a cornerstone of the brand's clean and focused identity.
5.  **Color Defines Role:** Use `{colors.ink}` for primary text content and `{colors.ink-soft}` for secondary or supporting text. This color difference reinforces the typographic hierarchy.

## Component Patterns
Components are the reusable building blocks of the plud interface. They are designed to be simple, consistent, and strictly adhere to the defined tokens. All interactive components feature clear visual feedback and use a consistent `cursor: pointer`.

**`button-primary`**
This is the primary call-to-action component. It uses a solid `{colors.primary}` background to attract maximum attention. It should be reserved for the most important action on a screen, like "Get Started" or "Submit". On hover, its background color lightens to `{colors.primary-bright}` over `{motion.duration-fast}`. The `cursor` must be set to `pointer`.

**`button-outline`**
This is the secondary action button. It's used for actions that are important but less critical than the primary one, such as "View Plans" or "Free PDF Tools". It features a transparent background and a `1px solid {colors.primary}` border. On hover, it inverts its style, filling with `{colors.primary}` and changing text to `{colors.on-primary}`, providing strong feedback. This transition uses `{motion.transition-fast}`. The `cursor` must be set to `pointer`.

**`link`**
Used for inline navigation within text or for tertiary actions. It is styled with `{colors.link}` and a permanent `textDecoration: underline`. The underline ensures accessibility and clear affordance. On hover, the text color changes to `{colors.primary}` over `{motion.duration-fast}`. The `cursor` must be set to `pointer`.

**`card`**
The primary container for grouping related content, such as features or testimonials. A card is defined by its `{colors.paper}` background, `{rounded.lg}` corners, and a subtle `1px solid {colors.hairline}` border. It must always be flat, using `{shadows.none}`. Padding is generous, set to `{spacing.lg}`.

**`input`**
A standard text input field. It has a `{colors.paper}` background and a `{colors.hairline}` border. When focused, the border color must change to `{colors.primary}` to provide clear visual feedback to the user. The `cursor` inside the input field must be `text`.

**`navigation-item`**
Represents a link in the main site navigation. It uses `{typography.caption-md}` and a `{colors.ink-soft}` color by default. On hover, the text color changes to `{colors.primary}`. The transition should be animated over `{motion.duration-fast}`. The `cursor` must be set to `pointer`.

**`badge`**
A small, pill-shaped label used for categorization or status indication, like the "AI Workspace" tag. It is not interactive. It uses a `{colors.paper}` background, a `{colors.hairline}` border, and `{colors.primary}` text color.

**`tab`**
Used to switch between different views within the same context. An inactive tab has `{colors.ink-soft}` text. The active tab is indicated with `{colors.primary}` text and a `2px solid {colors.primary}` border on the bottom. On hover, an inactive tab's text color changes to `{colors.ink}`. All tabs must use `cursor: pointer`.

## Layout & Spacing
The layout of plud is clean, ordered, and relies on a consistent spacing system to create a sense of rhythm and clarity. Generous whitespace is a fundamental principle, used to reduce cognitive load and improve focus.

**Spacing Rhythm:**
The entire system is built on a 4px base unit. All spacing and sizing values are multiples of this unit, defined in the `{spacing}` token scale. The default spacing for padding within components is `{spacing.md}` (16px). Margins between elements should use tokens from the scale, such as `{spacing.sm}` for tightly grouped items or `{spacing.lg}` for more separation. Adhering to this scale is mandatory for maintaining visual consistency.

**Grid System:**
The layout is a single-column, center-aligned grid with a maximum content width of approximately 1280px. All page content resides within this container, which is centered on the `{colors.canvas}` background. This creates a focused reading experience on larger screens. For multi-column layouts, like the feature grid, use simple flexbox or CSS grid properties with `{spacing.lg}` or `{spacing.xl}` as the gap value.

**Section Stacking:**
Major thematic sections of a page are separated by significant vertical space, defined by `{spacing.section}` (80px). This clear separation helps users parse the page structure at a glance. To further enhance this separation, alternating background colors are used. The default is `{colors.canvas}`, with key sections using `{colors.cloud}` to create distinct visual bands. This pattern helps to break up long pages and group related content effectively. Every page should feel like a series of well-defined, digestible chapters.

## Do's and Don'ts

**Do's:**
1.  **Do** compose all UIs from the core color palette: `{colors.canvas}`, `{colors.paper}`, `{colors.ink}`, `{colors.ink-soft}`, and `{colors.primary}`.
2.  **Do** use the **DM Sans** font for all text, adhering strictly to the roles defined in `{typography}`. Headings use the heading font, body copy uses the body font.
3.  **Do** reserve `{colors.primary}` for primary CTAs and key interactive feedback like hover states.
4.  **Do** use `{rounded.pill}` for all primary and secondary buttons to maintain a consistent, soft aesthetic for actions.
5.  **Do** set `cursor: pointer` on every single clickable element, including buttons, links, tabs, and navigation items.
6.  **Do** build structure with `{spacing.section}` between content blocks and use `{components.card}` with a `{colors.hairline}` border to group information.
7.  **Do** use `{colors.cloud}` as an alternating background color for major page sections to create visual rhythm.
8.  **Do** ensure all interactive components have a defined hover state that provides clear visual feedback, animated over `{motion.duration-fast}`.

**Don'ts:**
1.  **Don't** ever add a box-shadow unless it maps to a real `{shadows.*}` token. Since all tokens are `"none"`, this system is always flat.
2.  **Don't** introduce any new colors. The provided palette is complete and restrictive by design.
3.  **Don't** use any font other than DM Sans. Consistency in typography is non-negotiable.
4.  **Don't** ever leave the browser-default arrow cursor on a button, link, or tab. Every clickable element must set its own cursor property.
5.  **Don't** use `{colors.primary}` for large background areas or for body text. It is an accent color only.
6.  **Don't** mix corner radii on components. Buttons are pills (`{rounded.pill}`), cards are soft rectangles (`{rounded.lg}`).
7.  **Don't** use arbitrary values for margins or padding. All spacing must come from the `{spacing}` scale.
8.  **Don't** create "ghost" buttons (text-only buttons). Actions should be represented by either `{components.button-primary}`, `{components.button-outline}`, or `{components.link}`.

## Responsive Behavior
The plud design system is fluid and responsive, ensuring an optimal experience across all device sizes. The layout adapts gracefully from large desktops to small mobile screens by following a clear set of rules.

| Breakpoint      | Viewport Width    | Strategy                                                                                                           |
|-----------------|-------------------|--------------------------------------------------------------------------------------------------------------------|
| Mobile          | <480px            | Single-column layout. Grids collapse entirely. Typography scales down. Navigation is in a hamburger menu.          |
| Mobile-Large    | 480px – 767px     | Primarily single-column. Some simple two-column grids may appear. Spacing is slightly increased.                   |
| Tablet          | 768px – 1023px    | Two- or three-column grids are common. Hero content may be side-by-side. Main navigation may become visible.       |
| Desktop         | 1024px – 1279px   | The primary desktop experience. Full three-column grids are used. Content is constrained to a max-width container. |
| Desktop-Large   | ≥1280px           | Layout remains the same as Desktop, with increased whitespace (margins) on the sides of the max-width container.   |

**Touch Targets:**
All interactive elements must have a minimum touch target size of 44x44px to ensure usability on mobile devices. While a `{components.button-primary}` has a visual height of `24px`, its clickable area must be expanded with padding or a larger container to meet this requirement.

**Component Collapsing Strategy:**
*   **Navigation:** The main header navigation collapses into a hamburger menu icon on Tablet and smaller breakpoints. The menu itself opens as a full-screen overlay or a slide-out panel.
*   **Hero Section:** The `{typography.display-xl}` headline will scale down significantly on smaller screens. Any side-by-side imagery or content will stack vertically on mobile.
*   **Grids:** Multi-column feature and pricing grids will collapse. A three-column desktop grid becomes a two-column grid on tablet, and a single-column stack on mobile.
*   **Footer:** The multi-column footer layout will stack into a single column on mobile, with link groups appearing sequentially.
*   **Images:** All images should be fluid, scaling to 100% of their parent container's width while maintaining their aspect ratio.

## Iteration Guide
When building or iterating on UI for plud, follow these steps to ensure consistency with the design system.

1.  **Establish the Foundation:** Begin with the page structure. Use `{colors.canvas}` as the base background. Separate major content areas with `{spacing.section}` vertical margins and consider using `{colors.cloud}` for alternating section backgrounds.
2.  **Define the Hierarchy:** Implement the typographic structure using the `{typography}` tokens. Start with a single `{typography.display-xl}` for the hero, followed by `{typography.display-lg}` for section headers. All body copy must be `{typography.body-md}` in `{colors.ink}`. All text must use the **DM Sans** font.
3.  **Group Content in Cards:** Place related content inside `{components.card}` components. Ensure each card has a `{colors.paper}` background, a `1px solid {colors.hairline}` border, and `{rounded.lg}` corners.
4.  **Place Key Actions:** Identify the primary user goal for the page and use a single `{components.button-primary}` for it. Use `{components.button-outline}` or `{components.link}` for all secondary and tertiary actions.
5.  **Apply Color with Purpose:** Use the core color palette strictly. `{colors.primary}` is for interactive elements and their states. `{colors.ink}` and `{colors.ink-soft}` are for text. Do not introduce new colors.
6.  **Use Accents Sparingly:** If categorical differentiation is needed, apply the `{colors.accent-*}` palette to small, decorative elements or badges, never to text or primary UI controls.
7.  **Enforce Spacing Rhythm:** Check that all margins and paddings use a token from the `{spacing}` scale. Consistent spacing is crucial for the clean, organized feel of the brand.
8.  **Maintain Flatness:** Double-check that no shadows have been applied to any element. All components must use `{shadows.none}`. Depth is created through layout, color, and borders, not elevation.
9.  **Verify Interactivity:** Ensure every clickable element has `cursor: pointer` set. Test all hover and focus states to confirm they provide clear visual feedback and use `{motion.transition-fast}` for smooth animation.
10. **Review Across Breakpoints:** Test the final design at all defined responsive breakpoints. Confirm that layouts collapse gracefully, touch targets are adequate, and the experience remains clear and usable on mobile devices.
