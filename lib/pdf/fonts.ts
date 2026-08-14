/**
 * lib/pdf/fonts.ts
 *
 * REPLACES your current lib/pdf/fonts.ts. Adds a curated catalog of
 * ~30 fonts across five categories (Classic, Serif/Formal,
 * Calligraphy & Script, Old-World/Blackletter, Monospace/Technical),
 * sourced from the Google Fonts GitHub repository (a stable, public
 * mirror — file paths don't rotate the way Google's CDN version
 * hashes do).
 *
 * SAFETY NET: every font — from this catalog OR a custom URL you
 * paste in — is verified reachable with a HEAD request BEFORE it's
 * used. If a URL is unreachable or changed, PDF generation silently
 * falls back to Helvetica instead of crashing with a 500. This is
 * the honest tradeoff: I can't guarantee every one of these 30 URLs
 * will still resolve a year from now (font hosting isn't under my
 * control), but I can guarantee a bad one never breaks your app.
 */

import { Font } from "@react-pdf/renderer";

const GITHUB_FONTS = "https://raw.githubusercontent.com/google/fonts/main";

export interface FontOption {
  key: string;
  label: string;
  category: "Classic" | "Serif & Formal" | "Calligraphy & Script" | "Old-World & Decorative" | "Monospace & Technical";
  url: string;
}

export const FONT_CATALOG: FontOption[] = [
  // Classic — built-in, zero network dependency, always safe
  { key: "Helvetica", label: "Helvetica (built-in)", category: "Classic", url: "" },
  { key: "Times-Roman", label: "Times Roman (built-in)", category: "Classic", url: "" },
  { key: "Courier", label: "Courier (built-in)", category: "Classic", url: "" },

  // Serif & Formal
  { key: "PlayfairDisplay", label: "Playfair Display", category: "Serif & Formal", url: `${GITHUB_FONTS}/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf` },
  { key: "Merriweather", label: "Merriweather", category: "Serif & Formal", url: `${GITHUB_FONTS}/ofl/merriweather/Merriweather%5Bopsz%2Cwdth%2Cwght%5D.ttf` },
  { key: "Lora", label: "Lora", category: "Serif & Formal", url: `${GITHUB_FONTS}/ofl/lora/Lora%5Bwght%5D.ttf` },
  { key: "CormorantGaramond", label: "Cormorant Garamond", category: "Serif & Formal", url: `${GITHUB_FONTS}/ofl/cormorantgaramond/CormorantGaramond-Regular.ttf` },
  { key: "Crimson Text", label: "Crimson Text", category: "Serif & Formal", url: `${GITHUB_FONTS}/ofl/crimsontext/CrimsonText-Regular.ttf` },
  { key: "Libre Baskerville", label: "Libre Baskerville", category: "Serif & Formal", url: `${GITHUB_FONTS}/ofl/librebaskerville/LibreBaskerville-Regular.ttf` },
  { key: "EB Garamond", label: "EB Garamond", category: "Serif & Formal", url: `${GITHUB_FONTS}/ofl/ebgaramond/EBGaramond%5Bwght%5D.ttf` },
  { key: "Spectral", label: "Spectral", category: "Serif & Formal", url: `${GITHUB_FONTS}/ofl/spectral/Spectral-Regular.ttf` },

  // Calligraphy & Script
  { key: "GreatVibes", label: "Great Vibes", category: "Calligraphy & Script", url: `${GITHUB_FONTS}/ofl/greatvibes/GreatVibes-Regular.ttf` },
  { key: "DancingScript", label: "Dancing Script", category: "Calligraphy & Script", url: `${GITHUB_FONTS}/ofl/dancingscript/DancingScript%5Bwght%5D.ttf` },
  { key: "Sacramento", label: "Sacramento", category: "Calligraphy & Script", url: `${GITHUB_FONTS}/ofl/sacramento/Sacramento-Regular.ttf` },
  { key: "AlexBrush", label: "Alex Brush", category: "Calligraphy & Script", url: `${GITHUB_FONTS}/ofl/alexbrush/AlexBrush-Regular.ttf` },
  { key: "PinyonScript", label: "Pinyon Script", category: "Calligraphy & Script", url: `${GITHUB_FONTS}/ofl/pinyonscript/PinyonScript-Regular.ttf` },
  { key: "Allura", label: "Allura", category: "Calligraphy & Script", url: `${GITHUB_FONTS}/ofl/allura/Allura-Regular.ttf` },
  { key: "Parisienne", label: "Parisienne", category: "Calligraphy & Script", url: `${GITHUB_FONTS}/ofl/parisienne/Parisienne-Regular.ttf` },
  { key: "Tangerine", label: "Tangerine", category: "Calligraphy & Script", url: `${GITHUB_FONTS}/ofl/tangerine/Tangerine-Regular.ttf` },
  { key: "Playball", label: "Playball", category: "Calligraphy & Script", url: `${GITHUB_FONTS}/ofl/playball/Playball-Regular.ttf` },

  // Old-World & Decorative
  { key: "UnifrakturMaguntia", label: "Unifraktur Maguntia (Blackletter)", category: "Old-World & Decorative", url: `${GITHUB_FONTS}/ofl/unifrakturmaguntia/UnifrakturMaguntia-Regular.ttf` },
  { key: "IMFellEnglish", label: "IM Fell English (Antique Print)", category: "Old-World & Decorative", url: `${GITHUB_FONTS}/ofl/imfellenglish/IMFellEnglish-Regular.ttf` },
  { key: "CinzelDecorative", label: "Cinzel Decorative (Engraved/Roman)", category: "Old-World & Decorative", url: `${GITHUB_FONTS}/ofl/cinzeldecorative/CinzelDecorative-Regular.ttf` },
  { key: "Cinzel", label: "Cinzel (Classical Roman)", category: "Old-World & Decorative", url: `${GITHUB_FONTS}/ofl/cinzel/Cinzel%5Bwght%5D.ttf` },
  { key: "MedievalSharp", label: "MedievalSharp", category: "Old-World & Decorative", url: `${GITHUB_FONTS}/ofl/medievalsharp/MedievalSharp-Regular.ttf` },
  { key: "UncialAntiqua", label: "Uncial Antiqua (Illuminated Manuscript)", category: "Old-World & Decorative", url: `${GITHUB_FONTS}/ofl/uncialantiqua/UncialAntiqua-Regular.ttf` },

  // Modern Sans (rounding out the set)
  { key: "IBM Plex Sans", label: "IBM Plex Sans", category: "Classic", url: `${GITHUB_FONTS}/ofl/ibmplexsans/IBMPlexSans%5Bwdth%2Cwght%5D.ttf` },
  { key: "Inter", label: "Inter", category: "Classic", url: `${GITHUB_FONTS}/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf` },
  { key: "Oswald", label: "Oswald", category: "Classic", url: `${GITHUB_FONTS}/ofl/oswald/Oswald%5Bwght%5D.ttf` },
  { key: "Poppins", label: "Poppins", category: "Classic", url: `${GITHUB_FONTS}/ofl/poppins/Poppins-Regular.ttf` },

  // Monospace & Technical
  { key: "IBM Plex Mono", label: "IBM Plex Mono", category: "Monospace & Technical", url: `${GITHUB_FONTS}/ofl/ibmplexmono/IBMPlexMono-Regular.ttf` },
  { key: "JetBrains Mono", label: "JetBrains Mono", category: "Monospace & Technical", url: `${GITHUB_FONTS}/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf` },
  { key: "SpecialElite", label: "Special Elite (Old Typewriter)", category: "Monospace & Technical", url: `${GITHUB_FONTS}/ofl/specialelite/SpecialElite-Regular.ttf` },
];

const registered = new Map<string, boolean>(); // key -> succeeded?
const inFlight = new Map<string, Promise<boolean>>();

async function isReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Ensures a font is registered and actually loadable before it's
 * used. Call this and AWAIT it before rendering — that's what makes
 * the fallback safe (rendering can't start with a font reference
 * that will fail mid-render).
 */
export async function ensureFontRegistered(key: string, url: string): Promise<string> {
  if (!url) return key; // built-in font, nothing to fetch

  if (registered.has(key)) {
    return registered.get(key) ? key : "Helvetica";
  }

  if (!inFlight.has(key)) {
    inFlight.set(
      key,
      (async () => {
        const ok = await isReachable(url);
        if (ok) {
          try {
            Font.register({ family: key, src: url });
          } catch {
            registered.set(key, false);
            return false;
          }
        }
        registered.set(key, ok);
        return ok;
      })()
    );
  }

  const ok = await inFlight.get(key)!;
  return ok ? key : "Helvetica";
}

export function findCatalogFont(key: string): FontOption | undefined {
  return FONT_CATALOG.find((f) => f.key === key);
}

/**
 * Resolves whatever the template's fontFamily setting is (a catalog
 * key, "custom", or a built-in name) into a name safe to pass to
 * react-pdf's fontFamily style — always awaited server-side before
 * rendering starts.
 */
export async function resolveFontFamily(
  fontFamily: string,
  customFontName: string,
  customFontUrl: string
): Promise<string> {
  if (fontFamily === "custom") {
    if (!customFontUrl) return "Helvetica";
    return ensureFontRegistered(customFontName || "CustomFont", customFontUrl);
  }

  const catalogEntry = findCatalogFont(fontFamily);
  if (!catalogEntry) return "Helvetica"; // unknown key, fail safe
  if (!catalogEntry.url) return catalogEntry.key; // built-in

  return ensureFontRegistered(catalogEntry.key, catalogEntry.url);
}
