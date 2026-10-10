/* Brand-styled overrides for shadcn form primitives (Guild green, taller
 * fields), shared by every dashboard form. Buttons don't live here — use
 * <Button variant="brand" size="pill…"> from components/ui/button instead. */

export const BRAND_INPUT =
  "h-11 rounded-2xl border-cloud bg-canvas px-4 text-sm text-ink shadow-none placeholder:text-ink-soft focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/15";

/** For an Input nested inside a bordered container (prefix/suffix layouts). */
export const BARE_INPUT =
  "h-11 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:ring-0 text-ink placeholder:text-ink-soft";
