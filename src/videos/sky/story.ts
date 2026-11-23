// Timeline of "The Sky Is a Thief": 18 shots timed to the generated voice
// (~/Projects/sky-short/voice/words.json). Camera grammar copied from the bridge short: smootherstep glides,
// creeping push-ins on every hold, hard cuts on reframes, 7-frame flip kicks on impacts, no handheld float.
export const FPS = 30;
export const TOTAL = 2088; // 69.6 s
export const FLASH_AT = 150; // 4-frame white flash after the hook
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- shots ----------------
export type SetName = "lab" | "sky" | "road" | "noon" | "sunset" | "study" | "moon" | "mars" | "final";
export type Light = "day" | "golden" | "lab" | "labGolden" | "study" | "space" | "mars";
export type ShotDef = { id: number; a: number; b: number; set: SetName; light: Light };
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 150, set: "lab", light: "lab" },        // hook: the sunset in a glass tube
  { id: 2, a: 150, b: 320, set: "lab", light: "lab" },      // London 1869, dusting the air
  { id: 3, a: 320, b: 410, set: "lab", light: "lab" },      // smoke fills the tube, the beam fires
  { id: 4, a: 410, b: 528, set: "lab", light: "lab" },      // side blue, end orange
  { id: 5, a: 528, b: 640, set: "lab", light: "lab" },      // the real sky outside the window
  { id: 6, a: 640, b: 720, set: "lab", light: "lab" },      // one problem: no smoke up there
  { id: 7, a: 720, b: 840, set: "lab", light: "lab" },      // luckily / unluckily
  { id: 8, a: 840, b: 922, set: "sky", light: "day" },      // smoke particles vs air molecules
  { id: 9, a: 922, b: 1071, set: "sky", light: "day" },     // tiny obstacle, short waves scatter
  { id: 10, a: 1071, b: 1138, set: "sky", light: "day" },   // six blue arcs, one red beam
  { id: 11, a: 1138, b: 1332, set: "road", light: "day" },  // speed bumps: bicycle / truck
  { id: 12, a: 1332, b: 1450, set: "noon", light: "day" },  // noon, blue from every direction
  { id: 13, a: 1450, b: 1602, set: "sunset", light: "golden" }, // the long red path
  { id: 14, a: 1602, b: 1850, set: "study", light: "study" },   // young Rayleigh does the maths
  { id: 15, a: 1850, b: 1906, set: "moon", light: "space" },    // the Moon: black sky
  { id: 16, a: 1906, b: 1959, set: "mars", light: "mars" },     // Mars: butterscotch sky
  { id: 17, a: 1959, b: 2033, set: "lab", light: "labGolden" }, // the air steals the blue
  { id: 18, a: 2033, b: TOTAL, set: "final", light: "golden" }, // the sunset is the receipt
];
/** crossfades at place/time changes; everything else is a hard cut */
export const XFADE: Record<number, number> = { 8: 6, 11: 8, 12: 6, 13: 8, 14: 8, 15: 6, 16: 6, 17: 8, 18: 10 };

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
/** layers to draw at frame f: base shot, plus the next shot fading in during a crossfade */
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
/** reference camera ease: symmetric smootherstep (attack = release) */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
/** push-in factor since f0: the subject grows ~rate per frame */
const pushK = (f: number, f0: number, rate: number) => Math.exp(-rate * Math.max(0, f - f0));
/** dolly push: camera slides toward the look point by factor k */
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const D = (pos: V3, look: V3, f: number, f0: number, rate: number, rest: Partial<Cam> = {}) => dolly(pos, look, pushK(f, f0, rate), rest);
/** zoom push (camera stays put): tan(fov/2) shrinks by k */
const Z = (pos: V3, look: V3, fov: number, f: number, f0: number, rate: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * pushK(f, f0, rate)), ...rest });

// ---- shot 1: hook, diagonal close-up of the glass tube (orange end near, blue side receding) ----
const S1a = (f: number) => D([2.30, 2.05, -3.55], [-0.55, 1.64, -5.55], f, 0, 0.0010, { fov: 46, roll: -0.03 });
const S1b = (f: number) => D([1.74, 1.93, -4.10], [-0.40, 1.62, -5.60], f, 70, 0.0015, { fov: 40, roll: -0.005 });
const S1c = (f: number) => D([1.52, 1.86, -4.44], [-0.15, 1.62, -5.60], f, 112, 0.0022, { fov: 36, roll: 0.035 });
// ---- shot 2: wide lab, Tyndall beating the dust out of the air ----
const S2a = (f: number) => D([3.75, 2.35, 2.35], [-1.80, 1.50, -4.90], f, 150, 0.0010, { fov: 49, roll: 0.02 });
const S2b = (f: number) => D([2.95, 2.15, 1.05], [-1.90, 1.50, -4.90], f, 238, 0.0014, { fov: 45, roll: -0.01 });
// ---- shot 3: smoke close-up, then hard cut to the wide side view as the beam fires (f376) ----
const S3a = (f: number) => D([-1.35, 1.80, -2.90], [-1.50, 1.62, -5.55], f, 320, 0.0020, { fov: 36, roll: 0.03 });
const S3b = (f: number) => D([0.35, 1.82, -2.35], [-0.75, 1.62, -5.55], f, 376, 0.0014, { fov: 47, roll: -0.02 });
// ---- shot 4: the blue side, a glide down the tube, then the orange end fills the frame ----
const S4a = (f: number) => D([0.35, 1.82, -2.35], [-0.75, 1.62, -5.55], f, 410, 0.0011, { fov: 47, roll: -0.02 });
const S4b = (f: number) => D([1.85, 1.74, -4.45], [0.60, 1.62, -5.55], f, 470, 0.0014, { fov: 35, roll: 0.03 });
const S4c = (f: number) => D([1.35, 1.66, -5.00], [0.72, 1.62, -5.55], f, 500, 0.0012, { fov: 27, roll: 0.05 });
// ---- shot 5: over the bench to the real blue sky ----
const S5a = (f: number) => D([2.20, 1.95, -2.20], [-2.00, 1.72, -4.40], f, 528, 0.0010, { fov: 50, roll: -0.03 });
const S5b = (f: number) => D([1.00, 1.90, -2.90], [-2.10, 1.72, -4.25], f, 575, 0.0015, { fov: 43, roll: 0.015 });
const S5c = (f: number) => D([0.20, 1.85, -3.20], [-2.20, 1.72, -4.20], f, 612, 0.0014, { fov: 37, roll: 0.0 });
// ---- shot 6: the contradiction, tube right, window left, face centre ----
const S6a = (f: number) => D([1.25, 1.83, -1.95], [-0.45, 1.60, -4.20], f, 640, 0.0016, { fov: 44, roll: 0.035 });
const S6b = (f: number) => D([0.95, 1.80, -2.30], [-0.45, 1.60, -4.20], f, 685, 0.0018, { fov: 40, roll: 0.01 });
// ---- shot 7: deadpan double line, tight; a cut closer on "Unluckily" ----
const S7a = (f: number) => D([0.25, 1.80, -2.55], [-0.45, 1.62, -4.20], f, 720, 0.0010, { fov: 32, roll: -0.025 });
const S7b = (f: number) => D([0.05, 1.79, -2.35], [-0.45, 1.62, -4.20], f, 780, 0.0014, { fov: 29, roll: 0.045 });
// ---- shot 8: the floating physics stage, smoke boulder vs molecules ----
const S8a = (f: number) => D([0.35, 1.95, 6.40], [-0.75, 1.60, 0.0], f, 840, 0.0012, { fov: 44, roll: -0.02 });
const S8b = (f: number) => D([0.05, 1.80, 5.30], [-0.75, 1.58, 0.0], f, 885, 0.0016, { fov: 40, roll: 0.03 });
// ---- shot 9: macro molecule, pull back as the short waves scatter ----
const S9a = (f: number) => D([0.15, 1.78, 1.35], [0.0, 1.58, 0.0], f, 922, 0.0006, { fov: 42, roll: 0.0 });
const S9b = (f: number) => D([0.10, 1.72, 2.05], [0.0, 1.60, 0.0], f, 985, 0.0008, { fov: 46, roll: -0.02 });
const S9c = (f: number) => D([0.0, 1.68, 3.30], [0.0, 1.60, 0.0], f, 1005, 0.0008, { fov: 48, roll: 0.03 });
// ---- shot 10: six arcs vs one beam; a low cut on "six" ----
const S10a = (f: number) => D([0.0, 1.70, 3.50], [0.0, 1.55, 0.0], f, 1071, 0.0010, { fov: 50, roll: 0.02 });
const S10b = (f: number) => D([-0.85, 1.45, 3.25], [0.0, 1.58, 0.0], f, 1099, 0.0012, { fov: 46, roll: -0.05 });
// ---- shot 11: floating speed-bump road, bicycle and truck ----
export const BUMPS = [-6.0, -4.3, -2.6, -0.9, 0.8, 2.5, 4.2, 5.9, 7.6];
export const bikeX = (f: number) => -8.5 + (f - 1138) * (17.0 / 194);
export const truckX = (f: number) => -6.0 + (f - 1212) * 0.09;
const bumpProfile = (x: number) => {
  let h = 0;
  for (const b of BUMPS) {
    const u = Math.abs(x - b) / 0.44;
    if (u < 1) h = Math.max(h, 0.5 * (1 + Math.cos(Math.PI * u)));
  }
  return h;
};
/** extra hop after each bump (frames since the wheel passed its centre) */
export const bikeLift = (f: number) => {
  const x = bikeX(f);
  let lift = 0.15 * bumpProfile(x);
  for (const b of BUMPS) {
    const age = f - (1138 + (b + 8.5) / (17.0 / 194));
    if (age >= 0 && age < 15) lift += 0.10 * Math.sin((Math.PI * age) / 15) * (1 - age / 15);
  }
  return lift;
};
export const bikeSquash = (f: number) => 1 - 0.12 * bumpProfile(bikeX(f));
const S11 = (fov: number, roll: number, f0: number, rate: number) => (f: number) => {
  const cx = bikeX(f) - 1.5;
  return D([cx, 2.15, 10.5], [cx, 0.80, 0.0], f, f0, rate, { fov, roll });
};
const S11a = S11(44, 0.0, 1138, 0.0004);
const S11b = S11(46, 0.025, 1212, 0.0005);
const S11c = S11(50, -0.03, 1265, 0.0006);
const S11d = S11(47, 0.035, 1314, 0.0007);
// ---- shot 12: noon, blue rain from every direction ----
const S12a = (f: number) => D([0.30, 1.55, 7.20], [0.0, 1.90, 0.0], f, 1332, 0.0011, { fov: 44, roll: -0.03 });
const S12b = (f: number) => D([0.10, 1.60, 5.80], [0.0, 2.00, 0.0], f, 1385, 0.0015, { fov: 40, roll: 0.035 });
// ---- shot 13: sunset, the long path, cut to the kid's eye on "red comes through" ----
const S13a = (f: number) => D([0.40, 2.45, 14.0], [-0.20, 1.85, -2.0], f, 1450, 0.0006, { fov: 50, roll: 0.0 });
const S13b = (f: number) => D([0.20, 2.30, 11.5], [-0.40, 1.80, -1.0], f, 1510, 0.0008, { fov: 46, roll: -0.015 });
const S13c = (f: number) => D([-0.10, 2.10, 7.00], [-1.00, 1.75, 0.0], f, 1575, 0.0010, { fov: 40, roll: 0.03 });
const S13d = (f: number) => D([-0.55, 1.78, 2.35], [-1.20, 1.70, 0.0], f, 1590, 0.0014, { fov: 31, roll: 0.05 });
// ---- shot 14: Rayleigh's study (wide, medium, desk insert, blackboard) ----
const S14a = (f: number) => D([2.70, 1.95, 2.60], [-0.30, 1.25, -2.30], f, 1602, 0.0009, { fov: 46, roll: 0.02 });
const S14b = (f: number) => D([1.80, 1.80, 0.90], [-0.20, 1.40, -2.40], f, 1641, 0.0013, { fov: 40, roll: -0.03 });
const S14c = (f: number) => D([0.75, 1.65, -0.75], [-0.50, 0.85, -2.80], f, 1716, 0.0012, { fov: 42, roll: 0.035 });
const S14d = (f: number) => D([-1.20, 1.85, -0.60], [-3.00, 1.70, -3.90], f, 1785, 0.0014, { fov: 44, roll: -0.04 });
// ---- shots 15-16: Moon and Mars postcards ----
const S15a = (f: number) => D([0.40, 1.55, 6.20], [0.0, 1.15, 0.0], f, 1850, 0.0016, { fov: 42, roll: 0.02 });
const S16a = (f: number) => D([0.30, 1.60, 6.00], [0.0, 1.00, 0.0], f, 1906, 0.0016, { fov: 44, roll: -0.02 });
// ---- shot 17: the theft in the lab window ----
const S17a = (f: number) => D([1.70, 1.95, -1.60], [-1.40, 1.70, -4.80], f, 1959, 0.0009, { fov: 46, roll: 0.03 });
const S17b = (f: number) => D([0.90, 2.10, -2.60], [-0.20, 2.20, -6.00], f, 1995, 0.0011, { fov: 44, roll: -0.02 });
const S17c = (f: number) => D([0.50, 2.30, -4.00], [0.40, 2.40, -6.00], f, 2025, 0.0015, { fov: 40, roll: 0.0 });
// ---- shot 18: the receipt, a sunset with a blue ribbon peeling away ----
const S18a = (f: number) => D([0.40, 1.90, 8.50], [0.20, 1.70, 0.0], f, 2033, 0.0009, { fov: 46, roll: 0.02 });
const S18b = (f: number) => D([0.20, 1.85, 7.20], [0.25, 1.72, 0.0], f, 2070, 0.0012, { fov: 42, roll: -0.02 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1a }, { f: 70, dur: 38, s: S1b }, { f: 112, dur: 30, s: S1c }],
  2: [{ f: 150, s: S2a }, { f: 238, dur: 45, s: S2b }],
  3: [{ f: 320, s: S3a }, { f: 376, cut: true, s: S3b }],
  4: [{ f: 410, s: S4a }, { f: 455, dur: 24, s: S4b }, { f: 490, dur: 16, s: S4c }],
  5: [{ f: 528, s: S5a }, { f: 575, dur: 26, s: S5b }, { f: 612, dur: 20, s: S5c }],
  6: [{ f: 640, s: S6a }, { f: 685, dur: 25, s: S6b }],
  7: [{ f: 720, s: S7a }, { f: 780, cut: true, s: S7b }],
  8: [{ f: 840, s: S8a }, { f: 885, dur: 30, s: S8b }],
  9: [{ f: 922, s: S9a }, { f: 985, dur: 26, s: S9b }, { f: 1005, dur: 26, s: S9c }],
  10: [{ f: 1071, s: S10a }, { f: 1099, dur: 20, s: S10b }],
  11: [{ f: 1138, s: S11a }, { f: 1212, dur: 24, s: S11b }, { f: 1265, dur: 22, s: S11c }, { f: 1314, dur: 18, s: S11d }],
  12: [{ f: 1332, s: S12a }, { f: 1385, dur: 26, s: S12b }],
  13: [{ f: 1450, s: S13a }, { f: 1510, dur: 35, s: S13b }, { f: 1575, dur: 25, s: S13c }, { f: 1590, cut: true, s: S13d }],
  14: [{ f: 1602, s: S14a }, { f: 1641, dur: 24, s: S14b }, { f: 1716, cut: true, s: S14c }, { f: 1785, cut: true, s: S14d }],
  15: [{ f: 1850, s: S15a }],
  16: [{ f: 1906, s: S16a }],
  17: [{ f: 1959, s: S17a }, { f: 1995, dur: 26, s: S17b }, { f: 2025, dur: 10, s: S17c }],
  18: [{ f: 2033, s: S18a }, { f: 2070, dur: 20, s: S18b }],
};

// impact kicks: image offset flips sign every frame, decays over 7 f, roll +-0.23 deg per unit
const KICKS: [number, number][] = [
  [378, 0.9], [510, 0.5], [645, 0.5], [780, 0.7],
  [1017, 0.7], [1099, 0.45], [1123, 0.35],
  [1166, 0.45], [1185, 0.55], [1204, 0.45], [1224, 0.55], [1243, 0.45], [1262, 0.5], [1281, 0.35], [1301, 0.35], [1320, 0.3],
  [1546, 0.55], [1806, 0.45], [1896, 0.45], [1934, 0.45], [2054, 0.55],
];
export const kickAt = (f: number) => {
  let a = 0;
  for (const [f0, g] of KICKS) {
    const n = Math.floor(f - f0 + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, f: number): Cam => {
  const c = run(CAMS[id], f), a = kickAt(f);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens: depth of field ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
const EYE_T = (): V3 => [-0.45, 1.66, -4.00];
const TUBE = (): V3 => [-0.80, 1.62, -5.55];
export const DOF: Dof[] = [
  { f: 0, cInf: 14, focus: () => [-0.5, 1.62, -5.55] },     // hook tube
  { f: 70, dur: 38, cInf: 12, focus: () => [-0.2, 1.62, -5.55] },
  { f: 150, cInf: 5, focus: () => [-2.4, 1.5, -3.8] },       // wide lab, Tyndall
  { f: 238, dur: 45, cInf: 8, focus: () => [-2.4, 1.55, -3.8] },
  { f: 320, cInf: 13, focus: () => [-1.5, 1.62, -5.55] },    // smoke close-up
  { f: 376, cInf: 8, focus: TUBE },
  { f: 410, cInf: 10, focus: TUBE },
  { f: 455, dur: 24, cInf: 13, focus: () => [0.6, 1.62, -5.55] },
  { f: 490, dur: 16, cInf: 16, focus: () => [0.72, 1.62, -5.55] },
  { f: 528, cInf: 10, focus: () => [-2.0, 1.72, -4.2] },     // window / Tyndall
  { f: 575, dur: 26, cInf: 12, focus: () => [-2.1, 1.72, -4.2] },
  { f: 640, cInf: 12, focus: EYE_T },                        // contradiction
  { f: 720, cInf: 15, focus: EYE_T },                        // deadpan
  { f: 780, cInf: 16, focus: EYE_T },
  { f: 840, cInf: 5, focus: () => [-1.6, 1.55, -0.4] },      // sky stage
  { f: 885, dur: 30, cInf: 6, focus: () => [-1.4, 1.55, -0.4] },
  { f: 922, cInf: 18, focus: () => [0, 1.59, 0] },           // macro molecule
  { f: 985, dur: 26, cInf: 14, focus: () => [0, 1.59, 0] },
  { f: 1005, dur: 26, cInf: 10, focus: () => [0, 1.59, 0] },
  { f: 1071, cInf: 9, focus: () => [0, 1.58, 0] },           // six arcs
  { f: 1138, cInf: 0 },                                      // road
  { f: 1332, cInf: 5, focus: () => [0, 1.45, 0] },           // noon kid
  { f: 1385, dur: 26, cInf: 7, focus: () => [0, 1.55, 0] },
  { f: 1450, cInf: 5, focus: () => [-1.2, 1.6, 0] },         // sunset wide
  { f: 1590, cInf: 14, focus: () => [-1.2, 1.7, 0] },        // eye CU
  { f: 1602, cInf: 8, focus: () => [0, 1.45, -2.2] },        // study
  { f: 1641, dur: 24, cInf: 12, focus: () => [0, 1.5, -2.2] },
  { f: 1716, cInf: 12, focus: () => [-0.4, 0.9, -2.8] },     // desk insert
  { f: 1785, cInf: 7, focus: () => [-3.2, 1.7, -3.6] },      // blackboard
  { f: 1850, cInf: 0 },                                      // Moon
  { f: 1906, cInf: 0 },                                      // Mars
  { f: 1959, cInf: 11, focus: () => [-1.4, 1.7, -4.1] },     // lab sunset
  { f: 1995, dur: 26, cInf: 6, focus: () => [0.2, 2.2, -6.0] },
  { f: 2025, dur: 10, cInf: 0 },
  { f: 2033, cInf: 0 },                                      // receipt
];
export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

// ---------------- sun per set (world units; the shadow-casting key) ----------------
export const SET_SUN: Record<SetName, { pos: V3; target: V3 }> = {
  lab: { pos: [4.0, 7.0, 3.0], target: [0.0, 0.8, -4.1] },
  sky: { pos: [4.0, 8.0, 6.0], target: [0.0, 1.5, 0.0] },
  road: { pos: [6.0, 10.0, 8.0], target: [0.0, 0.0, 0.0] },
  noon: { pos: [4.0, 12.0, 5.0], target: [0.0, 1.0, 0.0] },
  sunset: { pos: [5.5, 1.8, -14.0], target: [-1.2, 1.5, 0.0] },
  study: { pos: [6.0, 6.0, 3.0], target: [0.0, 0.8, -2.2] },
  moon: { pos: [8.0, 6.0, 4.0], target: [0.0, 0.0, 0.0] },
  mars: { pos: [7.0, 8.0, 5.0], target: [0.0, 0.0, 0.0] },
  final: { pos: [6.0, 2.2, -14.0], target: [0.0, 1.5, 0.0] },
};

// ---------------- shared set geometry ----------------
export const LAB = {
  x0: -5.0, x1: 5.0, z0: -6.0, z1: 6.0, h: 4.2,
  win: { x0: -2.4, x1: 2.4, y0: 1.5, y1: 3.6 },
  bench: { x0: -3.8, x1: 1.4, z0: -5.95, z1: -5.05, top: 1.02 },
  tube: { xa: -2.5, xb: 0.7, y: 1.62, z: -5.55, r: 0.20 },
  tyndall: [-0.45, 0, -4.0] as V3,
};
export const STUDY = {
  x0: -4.2, x1: 4.2, z0: -4.2, z1: 4.2, h: 3.6,
  win: { z0: -2.6, z1: 0.6, y0: 1.5, y1: 3.2 },
  desk: { x0: -1.6, x1: 1.6, z0: -3.2, z1: -2.25, top: 0.80 },
  rayleigh: [0, 0, -2.05] as V3,
  board: { x: -4.12, z0: -3.9, z1: -1.7, y0: 1.0, y1: 3.1 },
};
export const SUNSET = { sun: [5.5, 1.6, -14.0] as V3, kid: [-1.2, 0, 0] as V3, eye: [-1.2, 1.72, 0] as V3 };
