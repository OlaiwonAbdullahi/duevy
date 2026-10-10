---
name: guild-design
description: Use this skill when you need to design interfaces for Guild, a platform focused on providing real work opportunities and verified income proof for workers, emphasizing clarity and simplicity in its professional and trustworthy aesthetic.
---
```yaml
brand: Guild
mood: Professional, trustworthy, and organic, designed to empower workers with clarity and simplicity.
scheme: light
colors:
  primary: "#0b6e4f"
  primary-bright: "#0f996d"
  primary-deep: "#08583f"
  on-primary: "#ffffff"
  ink: "#1b2520"
  ink-soft: "#7a847f"
  on-ink: "#ffffff"
  canvas: "#fbfaf7"
  paper: "#f4f2ec"
  cloud: "#e6f2ec"
  hairline: "#e6f2ec"
  hairline-strong: "#7a847f"
  link: "#1b2520"
  link-pressed: "#0b6e4f"
  accent-gold: "#e8a33d"
typography:
  display-xl: { fontFamily: "Manrope", fontSize: 92px, fontWeight: 600, lineHeight: 1.1 }
  display-lg: { fontFamily: "Manrope", fontSize: 48px, fontWeight: 600, lineHeight: 1.2 }
  display-md: { fontFamily: "Manrope", fontSize: 44px, fontWeight: 600, lineHeight: 1.2 }
  display-sm: { fontFamily: "Manrope", fontSize: 36px, fontWeight: 600, lineHeight: 1.3 }
  body-lg: { fontFamily: "Manrope", fontSize: 20px, fontWeight: 400, lineHeight: 1.5 }
  body-md: { fontFamily: "Manrope", fontSize: 16px, fontWeight: 400, lineHeight: 1.6 }
  body-emphasis: { fontFamily: "Manrope", fontSize: 16px, fontWeight: 600, lineHeight: 1.6 }
  caption-md: { fontFamily: "Manrope", fontSize: 14px, fontWeight: 400, lineHeight: 1.5 }
  caption-sm: { fontFamily: "Manrope", fontSize: 13px, fontWeight: 500, lineHeight: 1.4 }
  button-md: { fontFamily: "Manrope", fontSize: 16px, fontWeight: 600, lineHeight: 1 }
  link-md: { fontFamily: "Manrope", fontSize: 15px, fontWeight: 500, lineHeight: 1 }
rounded:
  none: 0px
  sm: 10px
  md: 16px
  lg: 24px
  xl: 32px
  pill: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  xxxl: 64px
  section: 96px
shadows:
  none: "none"
  soft-lift: "none"
  card: "none"
  modal: "none"
motion:
  duration-fast: 150ms
  duration-base: 300ms
  duration-slow: 500ms
  ease-standard: cubic-bezier(0.4, 0, 0.2, 1)
  ease-emphasized: cubic-bezier(0.22, 1, 0.36, 1)
  transition-default: "background-color {motion.duration-base} {motion.ease-standard}, color {motion.duration-base} {motion.ease-standard}"
  transition-transform: "transform {motion.duration-slow} {motion.ease-emphasized}"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "16px 28px"
    height: 52px
    border: "none"
    shadow: "{shadows.none}"
    cursor: pointer
  button-primary-hover:
    backgroundColor: "{colors.primary-bright}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "16px 28px"
    height: 52px
    border: "none"
    shadow: "{shadows.none}"
    cursor: pointer
  button-secondary-hover:
    backgroundColor: "{colors.hairline}"
  card:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.hairline}"
    shadow: "{shadows.none}"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    border: "1px solid {colors.hairline}"
    cursor: text
  input-focus:
    borderColor: "{colors.primary}"
    boxShadow: "0 0 0 2px rgba(11, 110, 79, 0.2)"
  nav-link:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.link-md}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    cursor: pointer
  nav-link-hover:
    backgroundColor: "{colors.cloud}"
    textColor: "{colors.ink}"
  badge:
    backgroundColor: "{colors.cloud}"
    textColor: "{colors.primary}"
    typography: "{typography.caption-sm}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
```

## Visual Theme & Atmosphere
The Guild design system projects an aura of professionalism, trustworthiness, and organic simplicity. It is meticulously crafted to empower everyday workers by presenting information with utmost clarity and ease of use. The atmosphere is calm and focused, achieved through a minimal color palette inspired by nature, generous use of whitespace, and soft, approachable geometry. There is a tangible sense of quality and reliability, ensuring users feel secure and confident. The entire system is flat, rejecting drop shadows and gradients in favor of a clean, modern aesthetic where hierarchy is defined by typography, color, and space alone.

Key Characteristics:
*   **Organic & Trustworthy Palette**: The core palette combines a deep, forest-like `{colors.primary}` green with warm, earthy off-whites like `{colors.canvas}` and `{colors.paper}`, creating a natural and dependable feel.
*   **Unified Typography**: The exclusive use of the Manrope typeface for all text roles, from `{typography.display-xl}` headlines to `{typography.caption-sm}` labels, ensures a consistent and cohesive voice.
*   **Generous Whitespace**: A commitment to ample spacing, governed by the `{spacing}` scale, allows content to breathe, reduces cognitive load, and directs user focus effectively.
*   **Completely Flat Aesthetic**: The system strictly adheres to a flat design philosophy. All elevation and emphasis are conveyed through color and scale, with all shadow tokens set to `{shadows.none}`.
*   **Soft, Rounded Geometry**: Pervasive use of high-radius rounded corners, particularly `{rounded.pill}` for buttons and `{rounded.lg}` for containers, gives the interface a friendly and modern appearance.
*   **Clear Visual Hierarchy**: A well-defined typography scale and disciplined use of color create an unambiguous hierarchy, guiding users through content flows intuitively.
*   **High-Contrast Readability**: The primary text color `{colors.ink}` on the `{colors.canvas}` background provides excellent contrast, ensuring text is legible and accessible for all users.

## Color Usage Rules
The Guild color palette is intentionally minimal to maintain focus and brand consistency. An AI agent should almost exclusively compose interfaces using the following core tokens: `{colors.canvas}`, `{colors.paper}`, `{colors.cloud}`, `{colors.ink}`, `{colors.ink-soft}`, and the primary action color, `{colors.primary}`.

*   **`{colors.primary}`**: This deep green is the brand's signature action color. It must be used for primary calls-to-action (CTAs), such as "Get started" buttons, and for the most important highlighted headlines. To preserve its impact, use `{colors.primary}` for at most one or two key interactive elements per viewport. Do not use it for body copy or decorative elements.
*   **`{colors.ink}` & `{colors.ink-soft}`**: `{colors.ink}` is the default color for all primary text content, including headings and paragraphs, ensuring high readability. `{colors.ink-soft}` is reserved for secondary information like metadata, inactive navigation items, and helper text that should not compete with primary content.
*   **`{colors.canvas}`**: This is the default background color for all pages. Its warm, off-white tone creates an inviting and clean foundation for all other elements.
*   **`{colors.paper}`**: Use `{colors.paper}` for secondary surfaces that need to sit above the `{colors.canvas}` background without demanding significant attention. This includes secondary buttons and some subtle cards or navigation elements.
*   **`{colors.cloud}`**: This light, muted green is the primary tool for creating visual rhythm. Use it for the background of alternating page sections. It can also be used for hover states on light elements or for the background of informational `{components.badge}` elements.
*   **`{colors.accent-gold}`**: This color must be used with extreme scarcity. Its role is for small, non-interactive, celebratory moments or icons, such as the checkmarks in a feature list. It should never be used for text or interactive controls.
*   **`{colors.hairline}`**: The only color to be used for borders and dividers. It is intentionally subtle to define component boundaries without creating harsh visual separation.
*   **Rule**: Never introduce a new color that is not already a token. The existing palette is sufficient. If a new color seems necessary, re-evaluate the design to use an existing token. Reuse is a core principle.
*   **Rule**: This is a flat design system. Emphasis and hierarchy must be achieved through typography (weight and size), strategic use of `{colors.primary}`, and layout. Never use box-shadows to imply elevation. All components must use `{shadows.none}`.

## Typography Hierarchy
All typography within the Guild design system is set in the **Manrope** font family. This unified approach, using Manrope for both `fontRoles.heading` and `fontRoles.body`, creates a cohesive, modern, and exceptionally readable typographic landscape. Hierarchy is established through a clear and rhythmic scale of sizes and weights, not through changes in typeface.

| Role           | Token                    | Use                                                        |
|----------------|--------------------------|------------------------------------------------------------|
| Display XL     | `{typography.display-xl}`| The primary, page-level headline, used exclusively in the hero section. |
| Display LG     | `{typography.display-lg}`| Major section headings (H2) that introduce a core concept. |
| Display MD     | `{typography.display-md}`| Sub-section headings (H3) or prominent callouts.           |
| Display SM     | `{typography.display-sm}`| Smaller section headings (H4) or large introductory labels.  |
| Body LG        | `{typography.body-lg}`   | Lead paragraphs directly following a major headline.         |
| Body MD        | `{typography.body-md}`   | The default style for all standard body copy and paragraphs. |
| Body Emphasis  | `{typography.body-emphasis}`| For bolding key words or phrases within `{typography.body-md}` text. |
| Caption MD     | `{typography.caption-md}`| Metadata, subtitles on cards, or small helper text.        |
| Caption SM     | `{typography.caption-sm}`| UI element labels, informational badges, and fine print.   |
| Button MD      | `{typography.button-md}` | The standard text style for all primary and secondary buttons. |
| Link MD        | `{typography.link-md}`   | The standard text style for all navigation links.          |

**Typography Principles:**

1.  **Consistency is Key**: Adhere strictly to the defined typographic roles. Do not manually override font sizes, weights, or line heights. The consistency of using Manrope everywhere is a core brand attribute.
2.  **Optimize for Readability**: Headings use tighter line heights (e.g., 1.1-1.3) for visual impact, while body copy (`{typography.body-md}`) uses a more generous `{lineHeight: 1.6}` to ensure comfortable long-form reading.
3.  **Use Sentence Case**: All headings, subheadings, and button labels should use sentence case for a more approachable and modern tone. Title case is forbidden.
4.  **Hierarchy Through Scale**: Rely on the significant size differences between typographic roles to build hierarchy. Avoid using color as the primary means of differentiating heading levels.
5.  **Natural Letter Spacing**: Do not adjust letter spacing. The default tracking of Manrope is optimized for readability across all sizes and should be maintained.

## Component Patterns
Guild's UI is constructed from a small set of reusable components. Each is designed to be simple, clear, and consistent with the overall brand aesthetic.

*   **`button-primary`**: This is the most important interactive element, reserved for the primary call-to-action on any given screen. Its `{colors.primary}` background makes it stand out. On hover, the background color animates to `{colors.primary-bright}` over `{motion.duration-base}`. The button must always use `cursor: pointer`. An internal icon, if present, should animate horizontally using `{motion.transition-transform}`.

*   **`button-secondary`**: Used for secondary actions that are important but should not compete with the primary CTA. It uses a subdued `{colors.paper}` background. The hover state provides clear feedback by changing the background to `{colors.hairline}` with a `{motion.transition-default}`. This component must also use `cursor: pointer`.

*   **`card`**: The standard container for grouping related content. A `{components.card}` is defined by its `{rounded.lg}` radius and a subtle `1px` border of `{colors.hairline}`. It is always flat, with its `shadow` property set to `{shadows.none}`. This creates a clean, organized structure for complex information.

*   **`input`**: The base component for all text entry fields. It maintains a clean look with a `{colors.canvas}` background and `{colors.hairline}` border. The focus state is critical for usability and is indicated by changing the border color to `{colors.primary}` and adding the subtle outer glow defined in `{components.input-focus}`. All text inputs must use `cursor: text`.

*   **`nav-link`**: Specifically for site navigation elements. These links are styled as small, pill-shaped buttons with a `{colors.paper}` background to differentiate them from standard content. On hover, the background smoothly transitions to `{colors.cloud}` and the text color to `{colors.ink}` over `{motion.duration-base}`. A `cursor: pointer` is required.

*   **`badge`**: Small, non-interactive, pill-shaped labels used to tag or categorize items. With a `{colors.cloud}` background and `{colors.primary}` text, they draw a subtle connection to the brand's core palette while providing quick, scannable information. They use `{typography.caption-sm}` to keep their footprint minimal.

## Layout & Spacing
The layout of Guild is clean, open, and ordered, guided by a strict spacing system and a philosophy of "less is more." All dimensions, margins, and paddings are derived from a base unit of 4px, ensuring a consistent visual rhythm throughout the interface.

The core of the layout strategy is the use of generous whitespace to separate elements and guide the user's eye. The `{spacing}` scale is the single source of truth for all spatial values. For instance, `{spacing.md}` (16px) might be used for padding inside a component, while `{spacing.lg}` (24px) is used for the gap between items in a grid. Large-scale vertical rhythm between major content sections is managed by `{spacing.section}` (96px), creating clear separation and a calm reading pace.

Most page layouts are centered with a maximum content width of around 1280px. This prevents uncomfortably long lines of text on wider screens and maintains a focused content area. For presenting lists of features or testimonials, a simple 2 or 3-column grid is standard on desktop, with gaps between columns set to `{spacing.xl}`.

A key layout pattern is the use of alternating section bands. A section with a `{colors.canvas}` background will be followed by a section with a `{colors.cloud}` background. This creates a pleasant visual cadence down the page, helping users to parse content into distinct thematic chunks. Each band should feel like a complete thought, with ample internal padding (`{spacing.section}` top and bottom).

## Do's and Don'ts
**Do's**

1.  Do compose all surfaces from `{colors.canvas}`, `{colors.paper}`, and `{colors.cloud}`. Do not introduce new background hues.
2.  Do use `Manrope` for all text, assigning `{typography.display-*}` roles to headings and `{typography.body-*}` roles to body copy.
3.  Do use `{colors.primary}` sparingly, reserving it for the single most important call-to-action on a page to maximize its impact.
4.  Do ensure every single interactive element, without exception, uses `cursor: pointer`. Text inputs must use `cursor: text`.
5.  Do use `{rounded.pill}` for all buttons, tags, and navigation links to maintain the brand's soft, approachable aesthetic.
6.  Do separate major page sections by alternating `{colors.canvas}` and `{colors.cloud}` backgrounds to create a clear visual rhythm.
7.  Do rely exclusively on the `{spacing}` scale for all margins, paddings, and layout gaps to maintain a consistent and harmonious rhythm.
8.  Do achieve all visual emphasis through font weight, typographic scale, and the strategic use of `{colors.primary}`, never through shadows.

**Don'ts**

1.  Don't add a box-shadow to any element. This system is strictly flat, and all shadow tokens must resolve to `{shadows.none}`.
2.  Don't leave the browser-default arrow cursor on a button, link, or tab. Every clickable element must set `cursor: pointer`.
3.  Don't use any font other than Manrope. The brand's typographic identity depends on its consistent use.
4.  Don't use `{colors.primary}` or `{colors.accent-gold}` for paragraphs of body text. These are accent colors, not text colors.
5.  Don't use sharp `0px` corners on containers like cards or content sections; adhere to the `{rounded}` scale, preferring `{rounded.lg}` or higher.
6.  Don't invent new spacing values like `18px` or `30px`. If a value is not in the `{spacing}` scale, choose the next closest value from the scale.
7.  Don't overuse large headlines. A page should have only one `{typography.display-xl}` element, and a limited number of `{typography.display-lg}` elements.
8.  Don't underline links. Indicate interactivity through hover state changes in color, following the patterns in `{components.nav-link}`.

## Responsive Behavior
The Guild design system is fluid and responsive, ensuring a seamless experience across all device sizes. The following table outlines the primary breakpoints.

| Breakpoint      | Viewport Width      | Key Characteristics                                         |
|-----------------|---------------------|-------------------------------------------------------------|
| Mobile          | <480px              | Single-column layout, reduced font sizes, collapsed navigation. |
| Mobile-Large    | 480px – 767px       | Single-column, slightly larger margins, collapsed navigation. |
| Tablet          | 768px – 1023px      | Two-column grids appear, full navigation may be visible.      |
| Desktop         | 1024px – 1279px     | Full-width layout within a max-width container, multi-column grids. |
| Desktop-Large   | ≥1280px             | Increased whitespace and margins around the max-width container. |

A primary consideration on touch devices is target size. All interactive elements, including buttons and links, must have a minimum touch target area of 44x44px to be easily tappable.

**Breakpoint-specific behavior:**
*   **Navigation**: On viewports below `1024px` (Tablet and smaller), the primary navigation defined by `{components.nav-link}` collapses into a hamburger menu icon. The full links are revealed in a modal or drawer upon interaction.
*   **Hero Section**: The `{typography.display-xl}` hero headline scales down dramatically on smaller screens to prevent awkward text wrapping and preserve visual balance.
*   **Grids**: Any multi-column grid layout (e.g., for features or testimonials) must stack into a single vertical column on viewports below `768px` (Mobile). The vertical gap between stacked items should be `{spacing.lg}`.
*   **Images**: All images are fluid (`width: 100%`, `height: auto`) and will scale to fit their container while maintaining aspect ratio. For background images, ensure the most important content is centered to avoid being cropped on narrower screens.

## Iteration Guide
When building or iterating on UI in the Guild style, follow these steps to ensure consistency and adherence to the design system.

1.  **Establish Structure**: Begin by laying out the page's vertical rhythm using alternating section bands with `{colors.canvas}` and `{colors.cloud}` backgrounds. Apply `{spacing.section}` of vertical padding to each.
2.  **Set Typography**: Define the page's information hierarchy using only the roles from the `{typography}` scale. Start with the main `{typography.display-xl}` or `{typography.display-lg}` heading and work downwards. All text must be Manrope.
3.  **Place Core Content**: Populate the sections with primary content, using `{typography.body-md}` set in `{colors.ink}` for maximum readability. Use `{typography.body-emphasis}` to highlight key terms.
4.  **Identify the Primary Action**: Determine the single most important action a user can take on the page and implement it using a `{components.button-primary}`. This should be the most visually dominant interactive element.
5.  **Add Secondary Actions**: For all other interactive elements, such as "Learn More" links or secondary navigation, use the less prominent `{components.button-secondary}` or `{components.nav-link}` styles.
6.  **Organize with Cards**: Group related pieces of information into `{components.card}` elements. Ensure each card uses `{rounded.lg}` and a `{colors.hairline}` border, and contains consistent internal padding using `{spacing.lg}`.
7.  **Apply Consistent Spacing**: Use the `{spacing}` scale for all margins, paddings, and layout gaps. Manually setting pixel values is forbidden. For example, use `{spacing.md}` between a heading and its subsequent paragraph.
8.  **Verify Interactive States**: Check that every clickable element uses `cursor: pointer`. Implement hover and focus states for all interactive components, using transitions like `{motion.transition-default}`.
9.  **Test Responsiveness**: Review the design at every breakpoint defined in the system. Ensure layouts reflow logically, typography scales correctly, and touch targets are at least 44x44px on mobile.
10. **Final Review**: Perform a final quality check. Confirm that no shadows have been used (`{shadows.none}`), the color palette is limited to the defined tokens, and the overall feel aligns with Guild's clean, trustworthy, and organic aesthetic.
