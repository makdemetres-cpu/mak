/* ==========================================================================
   Ermis' Villas — camera choreography
   --------------------------------------------------------------------------
   The whole hero is a function of one number: t, the scroll progress through
   the hero stage, 0 → 1. Feed it forwards and the camera flies in; feed it
   backwards and the move runs in reverse, frame for frame. There is no
   timeline, no playhead and no autoplay anywhere in this file — which is
   precisely why stopping the scroll stops the picture dead.

   The move, in beats:

     0.00  far down the gravel approach, the roofline just clearing the trees
     0.29  gliding out over the still pool
     0.46  under the entrance canopy, door dead ahead
     0.53  through the threshold
     0.66  turning left — the dining table, then the island and its pendants
     0.79  the backlit wine wall
     0.86  swinging right into the double-height great room
     0.92  the fireplace, the chandelier hanging in the void
     1.00  up the floating stair, out over the balustrade, back to the water

   Positions are interpolated with a centripetal Catmull-Rom spline so the
   camera never kinks at a keyframe, and the look-at target is interpolated on
   its own separate spline so the camera can turn independently of where it is
   travelling. That separation is what makes it feel operated rather than
   dragged along a rail.
   ========================================================================== */

/* [ t, posX, posY, posZ, lookX, lookY, lookZ, fov ]

   The focal length is part of the choreography. Outside we sit at a long-ish
   38°, which keeps the building's proportions honest and stops the cypresses
   bending outward at the edges of frame. Crossing the threshold it opens up
   past 60° — every interior ever photographed well was shot wide, because a
   long lens indoors gives you a close-up of a wall and no sense of the room. */
const KEYS = [
  [0.00,  9.20, 5.20, 86.0,   1.00, 4.20, 12.0, 38],
  [0.11,  8.20, 4.60, 72.0,   0.50, 3.90, 10.0, 38],
  [0.22,  6.20, 4.00, 58.0,  -0.50, 3.60,  9.0, 39],
  [0.32,  3.60, 3.30, 44.0,   0.00, 3.10,  8.0, 41],
  [0.40,  1.80, 2.70, 32.0,   0.60, 2.70,  6.5, 44],
  [0.47,  0.95, 2.15, 22.0,   0.80, 2.30,  5.5, 48],
  [0.53,  0.85, 1.85, 14.5,   0.85, 2.00,  4.0, 52],
  [0.58,  0.88, 1.72,  9.6,   0.88, 1.88,  3.0, 56],
  [0.63,  0.90, 1.70,  5.2,   0.10, 1.85,  1.2, 60],
  [0.68,  0.60, 1.75,  3.0,  -6.00, 1.50, -1.0, 61],
  [0.75, -2.20, 1.80,  2.6,  -8.50, 1.35, -2.5, 62],
  [0.81, -3.00, 1.85,  0.8, -10.40, 1.70,  1.6, 58],
  [0.88, -0.60, 1.90,  3.4,   7.00, 2.20, -1.0, 60],
  [0.93,  3.20, 2.20,  3.4,   7.20, 1.80, -4.0, 60],
  // The last two shots clear the landing balustrade rather than looking
  // through it: crossing x = -0.3 below 5.0 puts a brass handrail straight
  // across the middle of the final frame.
  [0.965,-1.00, 4.20, -0.6,   5.00, 2.60, -3.0, 60],
  [1.00,  0.60, 5.20,  0.6,   9.50, 2.60, -3.0, 62]
];

/* The door swings open just before the camera reaches it, so you are never
   waiting on it — it is already welcoming you in by the time you cross. */
const DOOR_START = 0.48;
const DOOR_END   = 0.60;
const DOOR_MAX   = 1.62;    // radians; positive swings the leaf inward

export const CHAPTERS = [
  { id: 'brand',     from: 0.00, to: 0.12 },
  { id: 'booking',   from: 0.12, to: 0.32 },
  { id: 'estates',   from: 0.32, to: 0.50 },
  { id: 'arrival',   from: 0.50, to: 0.66 },
  { id: 'chef',      from: 0.66, to: 0.82 },
  { id: 'experience',from: 0.82, to: 0.93 },
  { id: 'concierge', from: 0.93, to: 1.01 }
];

/* -------------------------------------------------------------------------- */

export function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

/* Ken Perlin's smootherstep: zero first *and* second derivative at both ends,
   so segment joins have no visible tick. */
function smoother(x) { return x * x * x * (x * (x * 6 - 15) + 10); }

function catmull(p0, p1, p2, p3, u) {
  const u2 = u * u, u3 = u2 * u;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * u +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * u3
  );
}

function at(i, col) {
  const k = KEYS[Math.max(0, Math.min(KEYS.length - 1, i))];
  return k[col];
}

/* Writes the camera position and look-at target for progress `t` into the two
   Vector3s handed in, and returns the field of view for that moment.
   Allocates nothing — this runs on every animated frame. */
export function evaluate(t, outPos, outLook) {
  t = clamp01(t);

  // Locate the segment. Fifteen keys, so a linear scan is cheaper than the
  // branch-heavy binary search it would replace.
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++;

  const t0 = KEYS[i][0], t1 = KEYS[i + 1][0];
  const u = smoother(clamp01((t - t0) / (t1 - t0)));

  outPos.set(
    catmull(at(i - 1, 1), at(i, 1), at(i + 1, 1), at(i + 2, 1), u),
    catmull(at(i - 1, 2), at(i, 2), at(i + 1, 2), at(i + 2, 2), u),
    catmull(at(i - 1, 3), at(i, 3), at(i + 1, 3), at(i + 2, 3), u)
  );
  outLook.set(
    catmull(at(i - 1, 4), at(i, 4), at(i + 1, 4), at(i + 2, 4), u),
    catmull(at(i - 1, 5), at(i, 5), at(i + 1, 5), at(i + 2, 5), u),
    catmull(at(i - 1, 6), at(i, 6), at(i + 1, 6), at(i + 2, 6), u)
  );

  // Focal length interpolates linearly. A spline here can overshoot past a
  // keyframe, and an overshooting lens reads as a lurch.
  return at(i, 7) + (at(i + 1, 7) - at(i, 7)) * u;
}

export function doorAngle(t) {
  const u = clamp01((t - DOOR_START) / (DOOR_END - DOOR_START));
  return smoother(u) * DOOR_MAX;
}

/* Which chapter is on screen, and how far through it we are. */
export function chapterAt(t) {
  for (let i = 0; i < CHAPTERS.length; i++) {
    const c = CHAPTERS[i];
    if (t >= c.from && t < c.to) {
      return { index: i, local: (t - c.from) / (c.to - c.from) };
    }
  }
  return { index: t < 0.5 ? 0 : CHAPTERS.length - 1, local: t < 0.5 ? 0 : 1 };
}
