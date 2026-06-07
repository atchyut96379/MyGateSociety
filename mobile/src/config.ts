export const SOCIETY_NAME = "Marvel Rocks Society";

/** Production API — override with EXPO_PUBLIC_API_URL for local dev. */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://api.marvelrocks.in";
