// Light presets per set/time of day. In the bridge short the sun was CAMERA-RELATIVE and frozen per shot; here each
// set has a fixed sun (story.ts SET_SUN), which suits interiors. `az`/`el` still describe the intended direction for
// the cast's screen-space light (light2D) and for the sky/sun disc, but world.ts drives the actual key from SET_SUN.
// lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
type C3 = [number, number, number];
export type Light = "day" | "golden" | "lab" | "labGolden" | "study" | "space" | "mars";
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string;
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
export const LIGHTS: Record<Light, LightPreset> = {
  day: {
    az: 75, el: 48,
    lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [1.0, 0.94, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.9, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 6, el: 7,
    lit: [1.5, 0.68, 0.24], shade: [0.15, 0.15, 0.3], lift: [0.04, 0.06, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    charTint: [1.0, 0.78, 0.56], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.8, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#6a4f8c", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#efb489", fogNear: 50, fogFar: 380, sunDisc: "#ffcf9e",
    sunCol: "#ffab5e", sunI: 5.5, sky: "#d8b0b8", ground: "#8a6a60", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
  },
  lab: {
    // north-window daylight: a cool, soft key from the window wall, warm brown bounce from the floorboards
    az: 12, el: 30,
    lit: [1.42, 1.36, 1.22], shade: [0.36, 0.34, 0.44], lift: [0.07, 0.065, 0.12], lambert: 0.42, sideK: 0.80, term: 0.2,
    charTint: [1.01, 0.95, 0.87], charShade: 0.89, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.9, 0.89, 0.97],
    blob: [0.32, 0.3, 0.36], actorShadow: false,
    top: "#6c8fb8", hor: "#d6d2c4", skyCurve: [0.02, 0.4, 0.6], fog: "#c9c4b6", fogNear: 10, fogFar: 90, sunDisc: "#000000",
    sunCol: "#fff1da", sunI: 2.5, sky: "#d5dded", ground: "#6d5743", hemiI: 0.75,
    bias: -0.0003, normalBias: 0.02,
  },
  labGolden: {
    // the last sun through the same window: the beam in the tube and the sky outside both turn to fire
    az: 2, el: 14,
    lit: [1.62, 1.0, 0.5], shade: [0.26, 0.21, 0.32], lift: [0.06, 0.06, 0.14], lambert: 0.4, sideK: 0.82, term: 0.12,
    charTint: [1.03, 0.84, 0.64], charShade: 0.9, charGrad: 0.09, bodyGrad: 0.24, sideTint: [0.87, 0.84, 0.96],
    blob: [0.55, 0.43, 0.5], actorShadow: true,
    top: "#6a5a86", hor: "#ffc47a", skyCurve: [0.06, 0.7, 1.0], fog: "#e2ad7c", fogNear: 20, fogFar: 140, sunDisc: "#ffcf9e",
    sunCol: "#ffb060", sunI: 3.8, sky: "#e0c0ae", ground: "#7a5a48", hemiI: 0.62,
    bias: -0.0005, normalBias: 0.025,
  },
  study: {
    // 1871 study, tall window camera-left, a lamp on the desk: warm key, deep warm shadows
    az: -55, el: 28,
    lit: [1.38, 1.3, 1.1], shade: [0.4, 0.31, 0.33], lift: [0.08, 0.06, 0.08], lambert: 0.42, sideK: 0.8, term: 0.22,
    charTint: [1.03, 0.95, 0.84], charShade: 0.9, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.94, 0.88, 0.88],
    blob: [0.34, 0.28, 0.3], actorShadow: false,
    top: "#6b6f86", hor: "#c9b9a0", skyCurve: [0.02, 0.4, 0.6], fog: "#bcae98", fogNear: 10, fogFar: 70, sunDisc: "#000000",
    sunCol: "#ffe6bc", sunI: 2.3, sky: "#d9d2c2", ground: "#5e4432", hemiI: 0.7,
    bias: -0.0003, normalBias: 0.02,
  },
  space: {
    // airless: a hard white sun, black sky, almost no fill; the only soft light is the sunlit ground bounce
    az: 40, el: 30,
    lit: [1.92, 1.86, 1.76], shade: [0.1, 0.105, 0.15], lift: [0.015, 0.018, 0.035], lambert: 0.5, sideK: 0.9, term: 0.22,
    charTint: [1.0, 0.98, 0.95], charShade: 0.82, charGrad: 0.12, bodyGrad: 0.3, sideTint: [0.9, 0.92, 0.98],
    blob: [0.16, 0.16, 0.2], actorShadow: true,
    top: "#000000", hor: "#02030a", skyCurve: [0.0, 0.0, 0.0], fog: "#05060c", fogNear: 120, fogFar: 900, sunDisc: "#fff6e2",
    sunCol: "#fff8ec", sunI: 4.4, sky: "#8ea6c8", ground: "#5a5a58", hemiI: 0.22,
    bias: -0.0006, normalBias: 0.03,
  },
  mars: {
    // butterscotch dust: bright rusty sky, weak blue in the shadows, long dusty light
    az: 35, el: 24,
    lit: [1.7, 1.14, 0.7], shade: [0.44, 0.28, 0.21], lift: [0.1, 0.055, 0.03], lambert: 0.42, sideK: 0.84, term: 0.24,
    charTint: [1.04, 0.86, 0.7], charShade: 0.88, charGrad: 0.09, bodyGrad: 0.24, sideTint: [0.92, 0.84, 0.84],
    blob: [0.5, 0.34, 0.24], actorShadow: true,
    top: "#a86840", hor: "#e8b27c", skyCurve: [0.06, 0.6, 1.0], fog: "#dca874", fogNear: 30, fogFar: 500, sunDisc: "#ffe0b0",
    sunCol: "#ffd3a2", sunI: 3.4, sky: "#e6c2a2", ground: "#7c4a30", hemiI: 0.6,
    bias: -0.0005, normalBias: 0.025,
  },
};

/** world-only look per light (sky stops by elevation, cloud palette, ground bounce, saturation). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };
  bounce: C3;
  sat: number;
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<Light, WorldLook> = {
  day: {
    sky: { c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 3, 8, 16, 40] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0], sat: 1.08,
  },
  golden: {
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], e: [0, 4, 10, 20, 40] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0], sat: 1.1,
  },
  lab: {
    sky: { c: ["#e2dccd", "#cfd6dc", "#a9c0dc", "#8aa8cc", "#6f8fb8"], e: [0, 3, 8, 16, 40] },
    cloud: { lit: "#f4f1e8", mid: "#d8dbe4", shade: "#b8c0d4" },
    bounce: [0.02, 0.015, 0.0], sat: 1.0,
  },
  labGolden: {
    sky: { c: ["#ffce8e", "#f2af79", "#d9907a", "#a97c8a", "#75647e"], e: [0, 4, 10, 20, 40] },
    cloud: { lit: "#ffd8b0", mid: "#eaa08c", shade: "#a98cbc" },
    bounce: [0.05, 0.02, 0.0], sat: 1.06,
  },
  study: {
    sky: { c: ["#d9c9ac", "#c8c2b4", "#9fb4cc", "#7f9bc0", "#6886aa"], e: [0, 3, 8, 16, 40] },
    cloud: { lit: "#f0eadc", mid: "#d8d4cc", shade: "#b6b6c2" },
    bounce: [0.03, 0.015, 0.0], sat: 1.0,
  },
  space: {
    sky: { c: ["#02030a", "#02030a", "#010208", "#000004", "#000000"], e: [0, 2, 5, 10, 25] },
    cloud: { lit: "#000000", mid: "#000000", shade: "#000000" },
    bounce: [0.0, 0.0, 0.0], sat: 1.02,
  },
  mars: {
    sky: { c: ["#e8b27c", "#daa068", "#c28254", "#a86840", "#8a5234"], e: [0, 4, 10, 20, 40] },
    cloud: { lit: "#f0c8a0", mid: "#d8a078", shade: "#a87050" },
    bounce: [0.04, 0.02, 0.0], sat: 1.06,
  },
};
