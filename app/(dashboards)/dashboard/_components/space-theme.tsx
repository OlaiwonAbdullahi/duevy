"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * The colour themes a rep can pick for their space. The actual palette values
 * live in globals.css as `html[data-space-theme="..."]` overrides of the brand
 * tokens (--p-primary and friends), so every bg-brand / text-brand / bg-cloud
 * class across the dashboard re-colours automatically — in light and dark.
 *
 * `swatch` is only for picker dots and previews (it's the theme's light-mode
 * primary); components should keep using the brand classes, never this hex.
 */
export const SPACE_THEMES = [
  { id: "emerald", label: "Emerald", swatch: "#0b6e4f" },
  { id: "ocean", label: "Ocean", swatch: "#0a5c8c" },
  { id: "royal", label: "Royal", swatch: "#5b2d9e" },
  { id: "crimson", label: "Crimson", swatch: "#b01e4e" },
  { id: "tangerine", label: "Tangerine", swatch: "#b45309" },
] as const;

export type SpaceThemeId = (typeof SPACE_THEMES)[number]["id"];

export const SPACE_THEME_STORAGE_KEY = "duevy-space-theme";

export function isSpaceThemeId(value: unknown): value is SpaceThemeId {
  return SPACE_THEMES.some((t) => t.id === value);
}

type SpaceThemeContextValue = {
  themeId: SpaceThemeId;
  setThemeId: (id: SpaceThemeId) => void;
};

const SpaceThemeContext = createContext<SpaceThemeContextValue | null>(null);

/**
 * Holds the space's colour theme for the whole dashboard.
 *
 * Persisted to localStorage for now (the pre-paint script in the dashboard
 * layout reads the same key so a hard reload doesn't flash green). Once the
 * API lands this becomes a property of the space, saved by the rep and read
 * by every member — students then see the rep's colour on the space too.
 */
export function SpaceThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<SpaceThemeId>(() => {
    if (typeof window === "undefined") return "emerald";
    try {
      const stored = localStorage.getItem(SPACE_THEME_STORAGE_KEY);
      return isSpaceThemeId(stored) ? stored : "emerald";
    } catch {
      return "emerald";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (themeId === "emerald") root.removeAttribute("data-space-theme");
    else root.setAttribute("data-space-theme", themeId);
    try {
      localStorage.setItem(SPACE_THEME_STORAGE_KEY, themeId);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies.
    }
  }, [themeId]);

  // Leaving the dashboard returns the rest of the site to Duevy green.
  useEffect(
    () => () => document.documentElement.removeAttribute("data-space-theme"),
    [],
  );

  return (
    <SpaceThemeContext.Provider value={{ themeId, setThemeId }}>
      {children}
    </SpaceThemeContext.Provider>
  );
}

export function useSpaceTheme() {
  const ctx = useContext(SpaceThemeContext);
  if (!ctx)
    throw new Error("useSpaceTheme must be used inside a <SpaceThemeProvider>");
  return ctx;
}
