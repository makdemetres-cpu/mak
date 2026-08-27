/* ==========================================================================
   Ermis' Villas — the villa
   --------------------------------------------------------------------------
   Everything the camera flies through, built in code. No model files, no
   texture downloads: the entire hero is ~40KB of geometry instructions.

   Plan (metres, +Z is toward the viewer / the approach):

        -X  kitchen · dining · wine wall · stair        +X  great room
                          ┌──────────────────────────┐
             z = -7       │  fireplace   art   stair │   rear glass → sea
                          │                          │
             z =  0       │   island      ▲entry     │   double height
                          │                          │
             z = +7       └────────┬─────────┬───────┘   front glass
                                   │  DOOR   │
                          ~~~~~~~~ pool ~~~~~~~~~~~~
                                   approach

   Upper floor sits over the -X half only, so the great room is double height
   and the stair climbs into an open landing that overlooks it. That void is
   what makes the last beat of the camera move land.

   Repeated elements (slats, balusters, treads, bottles, trees, mullions) are
   InstancedMesh — one draw call each instead of hundreds.
   ========================================================================== */

import {
  BoxGeometry, CylinderGeometry, DoubleSide, Group, IcosahedronGeometry,
  InstancedMesh, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D,
  PlaneGeometry, SphereGeometry
} from '../vendor/three.slim.js?v=260827c';

/* --------------------------------------------------------------------------
   Materials — defined once, shared everywhere.
   -------------------------------------------------------------------------- */
export function makeMaterials() {
  const M = (o) => new MeshStandardMaterial(o);
  return {
    plaster:  M({ color: 0xE9E3D6, roughness: 0.95, metalness: 0.0 }),
    plasterI: M({ color: 0xF2EDE2, roughness: 0.92, metalness: 0.0 }),
    concrete: M({ color: 0xBDB6A8, roughness: 0.9,  metalness: 0.0 }),
    steel:    M({ color: 0x23261F, roughness: 0.42, metalness: 0.75 }),
    // Timbers are deliberately desaturated. Straight out of a colour picker,
    // "warm wood" renders as traffic-cone orange under a golden-hour sun.
    timber:   M({ color: 0x7C5B3C, roughness: 0.66, metalness: 0.0 }),
    timberDk: M({ color: 0x4E3B29, roughness: 0.72, metalness: 0.0 }),
    soffit:   M({ color: 0x8A6B49, roughness: 0.62, metalness: 0.0 }),
    stone:    M({ color: 0xD5CFC1, roughness: 0.72, metalness: 0.0 }),
    stoneDk:  M({ color: 0x6E6A60, roughness: 0.8,  metalness: 0.0 }),
    floor:    M({ color: 0xDCD4C4, roughness: 0.5,  metalness: 0.0 }),
    brass:    M({ color: 0xB08D57, roughness: 0.26, metalness: 1.0 }),
    fabric:   M({ color: 0xCEC6B2, roughness: 0.96, metalness: 0.0 }),
    fabricDk: M({ color: 0x7C7768, roughness: 0.96, metalness: 0.0 }),
    rug:      M({ color: 0x9A8F79, roughness: 1.0,  metalness: 0.0 }),
    // Greek planting, not jungle: near-black cypress, dusty silver-green olive.
    cypress:  M({ color: 0x2F4433, roughness: 1.0,  metalness: 0.0 }),
    olive:    M({ color: 0x707C5A, roughness: 1.0,  metalness: 0.0 }),
    leaf:     M({ color: 0x4A6042, roughness: 1.0,  metalness: 0.0 }),
    leafLt:   M({ color: 0x6E7B54, roughness: 1.0,  metalness: 0.0 }),
    trunk:    M({ color: 0x554636, roughness: 0.95, metalness: 0.0 }),
    grass:    M({ color: 0x5C6B47, roughness: 1.0,  metalness: 0.0 }),
    gravel:   M({ color: 0xBCB29A, roughness: 0.98, metalness: 0.0 }),

    // Still water at golden hour is almost a mirror. Low roughness plus the
    // sky environment map does the whole job — no ripple shader, no animation,
    // nothing to keep re-rendering.
    water:    M({ color: 0x14343C, roughness: 0.045, metalness: 0.62,
                  envMapIntensity: 1.5 }),
    // The sea is rougher than the pool — at distance a mirror finish reads as
    // glass, not water.
    sea:      M({ color: 0x24505C, roughness: 0.16, metalness: 0.5,
                  envMapIntensity: 1.25 }),

    // Cheap glass: a lightly tinted standard material with reflections turned
    // up. MeshPhysicalMaterial's real transmission looks better and costs a
    // full extra scene render per frame — not worth it on a phone.
    // Opacity is kept low because these panes stack: standing inside, you can
    // be looking through four of them at once, and each one multiplies the
    // haze. What looks right on a single pane looks like fog through four.
    glass:    M({ color: 0xA8BEC2, roughness: 0.06, metalness: 0.22,
                  transparent: true, opacity: 0.15, envMapIntensity: 2.0,
                  side: DoubleSide, depthWrite: false }),
    glassDk:  M({ color: 0x5E7176, roughness: 0.08, metalness: 0.3,
                  transparent: true, opacity: 0.28, envMapIntensity: 1.7,
                  side: DoubleSide, depthWrite: false }),

    // Emissive-only materials stand in for interior light fittings. They read
    // as light sources without adding a single real light to the scene.
    glow:     new MeshBasicMaterial({ color: 0xFFE7BE }),
    glowWarm: new MeshBasicMaterial({ color: 0xFFCE8A }),
    ember:    new MeshBasicMaterial({ color: 0xE8792E }),
    wineGlow: M({ color: 0x3A1420, roughness: 0.25, metalness: 0.1,
                  emissive: 0x7A2A1E, emissiveIntensity: 0.55 })
  };
}

/* --------------------------------------------------------------------------
   Small builders
   -------------------------------------------------------------------------- */
const UNIT = new BoxGeometry(1, 1, 1);

function box(parent, mat, w, h, d, x, y, z, opts = {}) {
  const m = new Mesh(UNIT, mat);
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.rz) m.rotation.z = opts.rz;
  m.castShadow = opts.cast !== false;
  m.receiveShadow = opts.receive !== false;
  parent.add(m);
  return m;
}

/* One InstancedMesh, positioned by a callback. */
function instances(parent, geo, mat, count, place, opts = {}) {
  if (count <= 0) return null;
  const mesh = new InstancedMesh(geo, mat, count);
  mesh.castShadow = opts.cast !== false;
  mesh.receiveShadow = opts.receive !== false;
  const dummy = new Object3D();
  for (let i = 0; i < count; i++) {
    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    place(dummy, i);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
  return mesh;
}

/* Deterministic pseudo-random, so the composition is identical on every
   device and every reload — no lucky or unlucky tree placement. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* --------------------------------------------------------------------------
   Dimensions
   -------------------------------------------------------------------------- */
export const DIM = {
  halfX: 11, halfZ: 7,
  gFloor: 0, gCeil: 3.6,
  uFloor: 3.9, uCeil: 7.1,
  roofY: 7.35, eave: 2.6,
  doorW: 2.3, doorH: 3.05,
  splitX: -0.4              // upper floor / double-height boundary
};

/* The stair, and the void it climbs through. It sits hard against the back
   left of the plan rather than in the middle of it: the camera's route from
   the kitchen across to the great room and up to the landing has to pass
   through this quarter of the house, and a stair in the centre means flying
   through its treads. Every number the slab, the guard and the camera path
   need is here, so they can't drift apart. */
const STAIR = {
  spineX: -2.75, spineZ0: -5.2, spineZ1: -0.4,
  treadX: -1.85, treadTop: -0.6, rise: 0.235, going: 0.30, steps: 16,
  voidX0: -2.9, voidZ0: -5.4, voidZ1: -0.2
};

/* ==========================================================================
   THE BUILD
   ========================================================================== */
export function buildVilla(scene, mats, settings) {
  const root = new Group();
  scene.add(root);

  const doorPivot = buildShell(root, mats, settings);
  buildInterior(root, mats);
  buildGrounds(root, mats, settings);

  return { root, doorPivot };
}

/* --------------------------------------------------------------------------
   Shell: slabs, roof, glazing, timber screens, the door
   -------------------------------------------------------------------------- */
function buildShell(root, m, settings) {
  const { halfX, halfZ, gCeil, uFloor, uCeil, roofY, eave, splitX } = DIM;

  /* ---- Plinth and ground slab ---- */
  box(root, m.stoneDk, halfX * 2 + 5.5, 0.5, halfZ * 2 + 5.0, 0, -0.26, 0, { cast: false });
  box(root, m.floor,   halfX * 2,       0.4, halfZ * 2,       0, -0.2,  0, { cast: false });

  /* ---- Upper floor slab, over the -X half only ----
     Built as three pieces so the stair has a real void to climb through. A
     solid slab here means the camera passes straight through 300mm of concrete
     on the way to the landing, which looks exactly as wrong as it is. */
  const upperW = splitX + halfX;
  const upperCx = (-halfX + splitX) / 2;
  const slabY = (gCeil + uFloor) / 2, slabT = uFloor - gCeil;
  const voidX0 = STAIR.voidX0, voidZ0 = STAIR.voidZ0, voidZ1 = STAIR.voidZ1;
  box(root, m.plaster, voidX0 + halfX, slabT, halfZ * 2, (-halfX + voidX0) / 2, slabY, 0);
  box(root, m.plaster, splitX - voidX0, slabT, halfZ - voidZ1,
      (voidX0 + splitX) / 2, slabY, (voidZ1 + halfZ) / 2);
  box(root, m.plaster, splitX - voidX0, slabT, voidZ0 + halfZ,
      (voidX0 + splitX) / 2, slabY, (-halfZ + voidZ0) / 2);

  /* ---- Solid walls ----
     Every wall is a thin box rather than a plane, so it reads correctly from
     inside and out and the door reveal has real thickness. */
  const wall = 0.26;
  // Rear (-Z): solid at the -X end (kitchen), glazed over the great room.
  box(root, m.plaster, upperW, gCeil, wall, upperCx, gCeil / 2, -halfZ);
  // Side (-X): solid full height.
  box(root, m.plaster, wall, uCeil, halfZ * 2, -halfX, uCeil / 2, 0);
  // Front (+Z) at the -X end: a solid return at each end with the dining room
  // glazed between them, so the kitchen and table read from the approach
  // rather than presenting a blank wall to the best view on the site.
  box(root, m.plaster, 2.4, gCeil, wall, -halfX + 1.2, gCeil / 2, halfZ);
  box(root, m.plaster, 0.8, gCeil, wall, splitX - 0.4, gCeil / 2, halfZ);
  glazedWall(root, m, settings, {
    x0: -halfX + 2.4, x1: splitX - 0.8, y0: 0.05, y1: gCeil - 0.1, z: halfZ, axis: 'x'
  });
  // Upper volume: rear wall of the suite, and glazing behind the louvres.
  box(root, m.plaster, upperW, uCeil - uFloor, wall, upperCx, (uFloor + uCeil) / 2, -halfZ);
  const suiteGlass = new Mesh(
    new PlaneGeometry(upperW - 0.8, uCeil - uFloor - 0.3), m.glass);
  suiteGlass.position.set(upperCx, (uFloor + uCeil) / 2, halfZ);
  root.add(suiteGlass);
  // Roof-level parapet band tying the two volumes together.
  box(root, m.plaster, halfX * 2, 0.34, wall, 0, uCeil + 0.17, -halfZ);

  /* ---- The entrance bay ----
     A 3m-wide timber-lined portal between the solid kitchen wall and the start
     of the great-room glazing. The bay has to be wider than the door leaf plus
     both returns, or the glazing and the swinging door end up occupying the
     same cubic metre — which renders exactly as badly as it sounds. */
  const dW = DIM.doorW, dH = DIM.doorH;
  const bayX0 = splitX, bayX1 = splitX + 3.0;
  const frameZ = halfZ - 0.28;
  const frameD = 0.55;
  // Head, and a return down each side.
  box(root, m.timberDk, bayX1 - bayX0, gCeil - dH - 0.05, frameD,
      (bayX0 + bayX1) / 2, dH + 0.05 + (gCeil - dH - 0.05) / 2, frameZ);
  box(root, m.timberDk, 0.3, dH + 0.05, frameD, bayX0 + 0.15, (dH + 0.05) / 2, frameZ);
  box(root, m.timberDk, 0.3, dH + 0.05, frameD, bayX1 - 0.15, (dH + 0.05) / 2, frameZ);
  // A stone threshold slab under the opening.
  box(root, m.stone, bayX1 - bayX0, 0.12, 1.3, (bayX0 + bayX1) / 2, 0.02, halfZ + 0.3,
      { cast: false });

  /* ---- The door ----
     Pivoted at its hinge edge so rotating the group swings it open properly.
     index.js drives doorPivot.rotation.y straight from scroll progress; a
     positive angle swings the leaf inward, away from the visitor. */
  const doorPivot = new Group();
  doorPivot.position.set(bayX0 + 0.3, 0, halfZ - 0.55);
  root.add(doorPivot);

  const leaf = new Mesh(UNIT, m.timber);
  leaf.scale.set(dW, dH, 0.09);
  leaf.position.set(dW / 2, dH / 2, 0);
  // Deliberately casts no shadow: the shadow map is baked once, so a moving
  // caster would leave a hard shadow of a closed door across an open one.
  leaf.castShadow = false; leaf.receiveShadow = true;
  doorPivot.add(leaf);

  // A slim brass pull, vertical, near the opening edge.
  const pull = new Mesh(new CylinderGeometry(0.028, 0.028, 1.5, 8), m.brass);
  pull.position.set(dW - 0.22, dH * 0.52, 0.1);
  doorPivot.add(pull);

  /* ---- Glazing ----
     Curtain-wall runs: the double-height front of the great room, the rear
     wall facing the sea, and the whole +X flank. The front is split in two so
     the entrance bay stays open at ground level and glazed above it.  */
  glazedWall(root, m, settings, {
    x0: bayX1, x1: halfX, y0: 0.05, y1: gCeil, z: halfZ, axis: 'x'
  });
  glazedWall(root, m, settings, {
    x0: splitX, x1: halfX, y0: gCeil, y1: uCeil, z: halfZ, axis: 'x'
  });
  glazedWall(root, m, settings, {
    x0: splitX, x1: halfX, y0: 0.05, y1: uCeil, z: -halfZ, axis: 'x'
  });
  glazedWall(root, m, settings, {
    x0: -halfZ, x1: halfZ, y0: 0.05, y1: uCeil, z: halfX, axis: 'z'
  });

  /* ---- Timber brise-soleil over the suite ----
     The louvred screen from the reference photo: vertical slats standing off
     the upper front facade. */
  const slatStep = settings.slatStep;
  const runFrom = -halfX + 0.6, runTo = splitX - 0.4;
  const slatCount = Math.max(2, Math.floor((runTo - runFrom) / slatStep));
  const slatGeo = new BoxGeometry(0.09, uCeil - uFloor - 0.1, 0.24);
  instances(root, slatGeo, m.timber, slatCount, (d, i) => {
    d.position.set(runFrom + i * slatStep, (uFloor + uCeil) / 2 + 0.05, halfZ + 0.22);
  });
  // The frame the slats sit in.
  box(root, m.steel, upperW + 0.2, 0.16, 0.34, upperCx, uFloor + 0.1, halfZ + 0.22);
  box(root, m.steel, upperW + 0.2, 0.16, 0.34, upperCx, uCeil - 0.02, halfZ + 0.22);

  /* ---- Roofs ----
     The deep flat overhang is the single most recognisable thing about the
     reference building, so it gets a warm-lit soffit and a crisp steel fascia. */
  // Main roof over the whole footprint.
  roofSlab(root, m, halfX + eave, halfZ + eave, roofY, 0, 0);
  // Mid-level canopy projecting over the entrance and terrace.
  roofSlab(root, m, halfX + 1.2, 1.9, gCeil + 0.35, 0, halfZ + 1.5, 0.34);

  /* ---- Columns carrying the overhangs ---- */
  const colGeo = new BoxGeometry(0.22, 1, 0.22);
  const colPos = [
    [halfX + eave - 0.7, halfZ + eave - 0.7], [-halfX - eave + 0.7, halfZ + eave - 0.7],
    [halfX + eave - 0.7, -halfZ - eave + 0.7], [-halfX - eave + 0.7, -halfZ - eave + 0.7],
    [0, halfZ + eave - 0.7]
  ];
  instances(root, colGeo, m.steel, colPos.length, (d, i) => {
    d.position.set(colPos[i][0], roofY / 2, colPos[i][1]);
    d.scale.set(1, roofY, 1);
  });

  return doorPivot;
}

/* A roof slab: structure, warm soffit underneath, steel fascia edge. */
function roofSlab(root, m, hx, hz, y, cx, cz, thick = 0.42) {
  box(root, m.plaster, hx * 2, thick, hz * 2, cx, y + thick / 2, cz, { receive: false });
  box(root, m.soffit,  hx * 2 - 0.12, 0.07, hz * 2 - 0.12, cx, y - 0.035, cz, { cast: false });
  const f = 0.16;
  box(root, m.steel, hx * 2 + 0.06, thick + 0.2, f, cx, y + thick / 2 - 0.02, cz + hz, { receive: false });
  box(root, m.steel, hx * 2 + 0.06, thick + 0.2, f, cx, y + thick / 2 - 0.02, cz - hz, { receive: false });
  box(root, m.steel, f, thick + 0.2, hz * 2 + 0.06, cx + hx, y + thick / 2 - 0.02, cz, { receive: false });
  box(root, m.steel, f, thick + 0.2, hz * 2 + 0.06, cx - hx, y + thick / 2 - 0.02, cz, { receive: false });
}

/* A run of glass with instanced mullions. `axis` is the direction it spans. */
function glazedWall(root, m, settings, o) {
  const span = o.x1 - o.x0;
  const h = o.y1 - o.y0;
  const cy = (o.y0 + o.y1) / 2;
  const cs = (o.x0 + o.x1) / 2;
  const alongX = o.axis === 'x';

  const pane = new Mesh(
    alongX ? new PlaneGeometry(span, h) : new PlaneGeometry(span, h),
    m.glass
  );
  if (alongX) pane.position.set(cs, cy, o.z);
  else { pane.position.set(o.z, cy, cs); pane.rotation.y = Math.PI / 2; }
  root.add(pane);

  // Mullions every ~2.4m, plus head and sill rails.
  const step = 2.4;
  const n = Math.max(2, Math.round(span / step) + 1);
  const gap = span / (n - 1);
  const mg = new BoxGeometry(0.1, h, 0.14);
  instances(root, mg, m.steel, n, (d, i) => {
    const s = o.x0 + i * gap;
    if (alongX) d.position.set(s, cy, o.z);
    else { d.position.set(o.z, cy, s); d.rotation.y = Math.PI / 2; }
  }, { receive: false });

  const rail = new BoxGeometry(span, 0.12, 0.16);
  instances(root, rail, m.steel, 2, (d, i) => {
    const y = i === 0 ? o.y0 : o.y1;
    if (alongX) d.position.set(cs, y, o.z);
    else { d.position.set(o.z, y, cs); d.rotation.y = Math.PI / 2; }
  }, { receive: false });
}

/* --------------------------------------------------------------------------
   Interior — the five things worth flying past
   -------------------------------------------------------------------------- */
function buildInterior(root, m) {
  const { halfX, halfZ, gCeil, uFloor, uCeil, splitX } = DIM;

  /* ===== 1. The great room ===== */
  // Rug, sofa run, low stone table.
  box(root, m.rug, 7.2, 0.03, 5.0, 6.0, 0.03, 1.2, { cast: false });
  box(root, m.fabricDk, 4.6, 0.42, 1.15, 5.2, 0.30, -0.9);          // sofa seat
  box(root, m.fabricDk, 4.6, 0.66, 0.28, 5.2, 0.68, -1.36);         // sofa back
  box(root, m.fabricDk, 0.28, 0.52, 1.15, 3.04, 0.42, -0.9);        // arms
  box(root, m.fabricDk, 0.28, 0.52, 1.15, 7.36, 0.42, -0.9);
  box(root, m.fabric,   1.1, 0.16, 0.5, 4.2, 0.58, -1.1);           // cushions
  box(root, m.fabric,   1.1, 0.16, 0.5, 6.2, 0.58, -1.1);
  box(root, m.fabricDk, 1.5, 0.55, 1.4, 8.7, 0.32, 2.4, { ry: -0.5 }); // armchair
  box(root, m.fabricDk, 1.5, 0.55, 1.4, 3.0, 0.32, 3.1, { ry: 0.42 });
  box(root, m.stone,    2.4, 0.12, 0.95, 5.4, 0.42, 1.3);           // table top
  box(root, m.stoneDk,  0.5, 0.42, 0.5, 5.4, 0.21, 1.3);            // table base

  // Long stone fireplace on the rear wall, with a floating hearth and embers.
  box(root, m.stoneDk, 5.4, uCeil - 0.2, 0.34, 7.0, (uCeil - 0.2) / 2, -halfZ + 0.36);
  box(root, m.stone,   4.0, 0.22, 0.8, 7.0, 0.62, -halfZ + 0.72);
  // A slot fire, recessed into the front face of the breast. Wide and shallow —
  // anything taller stops reading as a flame and starts reading as an orange
  // rectangle. (It sat 200mm inside the stonework until this was checked.)
  box(root, m.stoneDk, 2.7, 0.42, 0.1, 7.0, 1.24, -halfZ + 0.50, { cast: false });
  box(root, m.ember,   2.5, 0.24, 0.08, 7.0, 1.24, -halfZ + 0.56, { cast: false });

  // A large canvas on the solid rear wall behind the kitchen. (It hung on the
  // great room's rear wall until that wall became glass — a painting floating
  // in mid-air over a sea view is a very particular look, and not this one.)
  box(root, m.plasterI, 2.4, 1.75, 0.07, -2.0, 2.05, -halfZ + 0.2);
  box(root, m.stoneDk,  2.5, 0.06, 0.1, -2.0, 1.15, -halfZ + 0.22, { cast: false });

  // Sculptural chandelier: brass rods dropping into the double-height void,
  // each tipped with a small emissive sphere.
  const chand = new Group();
  chand.position.set(5.6, 0, 0.6);
  root.add(chand);
  const r = rng(7);
  const RODS = 14;
  const rodGeo = new CylinderGeometry(0.012, 0.012, 1, 5);
  const bulbGeo = new SphereGeometry(0.075, 8, 6);
  const drops = [];
  for (let i = 0; i < RODS; i++) {
    drops.push({
      x: (r() - 0.5) * 1.7,
      z: (r() - 0.5) * 1.7,
      len: 0.9 + r() * 2.3
    });
  }
  instances(chand, rodGeo, m.brass, RODS, (d, i) => {
    const p = drops[i];
    d.position.set(p.x, uCeil - 0.25 - p.len / 2, p.z);
    d.scale.set(1, p.len, 1);
  }, { receive: false });
  instances(chand, bulbGeo, m.glow, RODS, (d, i) => {
    const p = drops[i];
    d.position.set(p.x, uCeil - 0.25 - p.len, p.z);
  }, { cast: false, receive: false });
  box(chand, m.brass, 2.1, 0.05, 2.1, 0, uCeil - 0.22, 0, { receive: false });

  /* ===== 2. The floating stair ===== */
  // Treads cantilever from a spine wall; no stringer, no risers.
  const S = STAIR;
  box(root, m.plasterI, 0.3, uFloor + 0.1, S.spineZ1 - S.spineZ0,
      S.spineX, (uFloor + 0.1) / 2, (S.spineZ0 + S.spineZ1) / 2);
  const treadGeo = new BoxGeometry(1.5, 0.1, 0.62);
  instances(root, treadGeo, m.timber, S.steps, (d, i) => {
    d.position.set(S.treadX, 0.34 + i * S.rise, S.treadTop - i * S.going);
  });
  // A guard across the near edge of the stairwell.
  const wellEdge = new Mesh(new PlaneGeometry(splitX - S.voidX0, 1.05), m.glassDk);
  wellEdge.position.set((S.voidX0 + splitX) / 2, uFloor + 0.53, S.voidZ1);
  root.add(wellEdge);

  // Glass balustrade along the landing edge, overlooking the great room.
  const balus = new Mesh(new PlaneGeometry(halfZ * 2 - 1.2, 1.05), m.glassDk);
  balus.position.set(splitX + 0.1, uFloor + 0.53, -0.4);
  balus.rotation.y = Math.PI / 2;
  root.add(balus);
  box(root, m.brass, 0.06, 0.06, halfZ * 2 - 1.2, splitX + 0.1, uFloor + 1.06, -0.4, { receive: false });

  /* ===== 3. The backlit wine wall ===== */
  const wineX = -halfX + 0.35;
  box(root, m.stoneDk, 0.3, 2.8, 4.4, wineX, 1.6, 1.0);
  box(root, m.wineGlow, 0.06, 2.6, 4.2, wineX + 0.17, 1.6, 1.0, { cast: false });
  const bottleGeo = new CylinderGeometry(0.042, 0.042, 0.3, 6);
  const rows = 7, cols = 13;
  instances(root, bottleGeo, m.steel, rows * cols, (d, i) => {
    const rw = Math.floor(i / cols), cl = i % cols;
    d.position.set(wineX + 0.34, 0.55 + rw * 0.35, -1.0 + cl * 0.32);
    d.rotation.z = Math.PI / 2;
  }, { receive: false });

  /* ===== 4. Kitchen and dining ===== */
  box(root, m.stone,   4.6, 0.14, 1.5, -6.4, 0.92, -3.4);            // island top
  box(root, m.timberDk, 4.3, 0.9, 1.25, -6.4, 0.45, -3.4);           // island body
  box(root, m.plasterI, 5.2, 2.3, 0.5, -6.4, 1.15, -halfZ + 0.5);    // tall units
  // Three brass pendants over the island.
  const pend = new CylinderGeometry(0.16, 0.1, 0.3, 10);
  instances(root, pend, m.brass, 3, (d, i) => d.position.set(-8.0 + i * 1.6, 2.15, -3.4), { receive: false });
  instances(root, new CylinderGeometry(0.008, 0.008, 1.2, 4), m.brass, 3,
    (d, i) => d.position.set(-8.0 + i * 1.6, 2.9, -3.4), { cast: false, receive: false });
  instances(root, new SphereGeometry(0.09, 8, 6), m.glowWarm, 3,
    (d, i) => d.position.set(-8.0 + i * 1.6, 2.0, -3.4), { cast: false, receive: false });

  // Dining table and stools.
  box(root, m.timber,  3.4, 0.09, 1.2, -6.2, 0.76, 3.4);
  box(root, m.stoneDk, 0.4, 0.72, 0.9, -7.6, 0.38, 3.4);
  box(root, m.stoneDk, 0.4, 0.72, 0.9, -4.8, 0.38, 3.4);
  const stool = new CylinderGeometry(0.2, 0.17, 0.68, 10);
  instances(root, stool, m.fabricDk, 6, (d, i) => {
    const side = i < 3 ? 1 : -1;
    d.position.set(-7.2 + (i % 3) * 1.5, 0.34, 3.4 + side * 1.1);
  });

  /* ===== 5. The suite above ===== */
  // Stops short of the stairwell void rather than flying over it.
  box(root, m.floor,    7.7, 0.05, 12.0, -6.65, uFloor + 0.03, 0, { cast: false });
  // Glass guarding the long open side of the stairwell.
  const wellGuard = new Mesh(
    new PlaneGeometry(STAIR.voidZ1 - STAIR.voidZ0, 1.05), m.glassDk);
  wellGuard.position.set(STAIR.voidX0, uFloor + 0.53,
                         (STAIR.voidZ0 + STAIR.voidZ1) / 2);
  wellGuard.rotation.y = Math.PI / 2;
  root.add(wellGuard);
  box(root, m.fabric,   2.3, 0.55, 2.05, -7.2, uFloor + 0.3, -2.4);   // bed
  box(root, m.timberDk, 2.5, 1.0, 0.16, -7.2, uFloor + 0.5, -3.5);    // headboard
  box(root, m.fabricDk, 2.3, 0.1, 0.7, -7.2, uFloor + 0.6, -1.7);     // throw
  box(root, m.timber,   1.4, 0.06, 0.5, -4.6, uFloor + 0.5, -2.4);    // bench
  // A reading light and a low planter to break the silhouette.
  instances(root, new SphereGeometry(0.1, 8, 6), m.glowWarm, 2,
    (d, i) => d.position.set(-8.9 + i * 3.4, uFloor + 0.85, -3.3), { cast: false, receive: false });

  /* ===== Indoor tree =====
     Off the entry axis. Dead centre it is the only thing you see on the way
     through the door, and a tree is not the point of the room. */
  const potX = 5.4, potZ = 5.3;
  box(root, m.stoneDk, 0.8, 0.6, 0.8, potX, 0.3, potZ);
  const trunk = new Mesh(new CylinderGeometry(0.07, 0.1, 2.6, 6), m.trunk);
  trunk.position.set(potX, 1.9, potZ);
  trunk.castShadow = true;
  root.add(trunk);
  const canopy = new Mesh(new IcosahedronGeometry(1.05, 1), m.leafLt);
  canopy.position.set(potX, 3.35, potZ);
  canopy.scale.set(1, 0.75, 1);
  canopy.castShadow = true;
  root.add(canopy);

  /* Ceiling over the great room. The -X half needs none: the underside of the
     upper slab already is its ceiling, and a second plane there would only
     re-close the stairwell void we just opened. */
  box(root, m.plasterI, halfX - splitX - 0.9, 0.08, halfZ * 2 - 0.4,
      (splitX + halfX) / 2 + 0.4, uCeil - 0.04, 0, { cast: false });
}

/* --------------------------------------------------------------------------
   Grounds: pool, terrace, drive, planting
   -------------------------------------------------------------------------- */
/* Terrace and pool geometry, kept here so the camera path and the planting
   exclusion zones can both refer to one set of numbers. The pool sits off the
   entrance axis, to the left — a pool centred on the front door would mean the
   approach flies straight over the water and there would be nowhere to arrive
   by car. Off-axis also gives the glide-in something to travel past. */
const DECK = { x0: -23, x1: 16, z0: 7.6, z1: 29, y: -0.25 };
const POOL = { x0: -19, x1: -4, z0: 10, z1: 23, water: -0.42, floor: -1.7 };
const DRIVE = { cx: 8.0, w: 6.0, z0: 29, z1: 100 };

function buildGrounds(root, m, settings) {
  const { halfZ } = DIM;

  /* ---- The headland and the sea ----
     The site is a plateau that stops behind the house. Ending the ground
     rather than running it to the horizon is what puts the sea in the rear
     glazing — and gives the last beat of the camera move, up on the landing,
     something worth turning towards. */
  const ground = new Mesh(new PlaneGeometry(300, 228), m.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.52, 56);
  ground.receiveShadow = true;
  root.add(ground);

  // The cliff face at the back edge of the plateau.
  box(root, m.stoneDk, 300, 3.0, 1.2, 0, -2.0, -58, { cast: false });

  const sea = new Mesh(new PlaneGeometry(900, 700), m.sea);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -3.1, -408);
  root.add(sea);

  /* ---- Terrace, built as four slabs around the pool opening ----
     A single slab with the pool laid on top is what buries the water: the
     coping ends up above the surface and you see stone where the pool should
     be. Leaving a real hole is both correct and cheaper than any trickery. */
  const deckSlab = (x0, x1, z0, z1) => box(
    root, m.stone, x1 - x0, 0.3, z1 - z0,
    (x0 + x1) / 2, DECK.y - 0.15, (z0 + z1) / 2, { cast: false }
  );
  deckSlab(DECK.x0, POOL.x0, DECK.z0, DECK.z1);   // left of the pool
  deckSlab(POOL.x1, DECK.x1, DECK.z0, 11.5);      // terrace strip along the house
  deckSlab(POOL.x0, POOL.x1, DECK.z0, POOL.z0);   // between pool and house
  deckSlab(POOL.x0, POOL.x1, POOL.z1, DECK.z1);   // far end

  // The arrival court is gravel, not stone. Beyond looking right — cars stand
  // on gravel — it breaks up what is otherwise an acre of pale slab filling
  // the bottom third of every approach frame.
  box(root, m.gravel, DECK.x1 - POOL.x1, 0.3, DECK.z1 - 11.5,
      (POOL.x1 + DECK.x1) / 2, DECK.y - 0.15, (11.5 + DECK.z1) / 2, { cast: false });

  /* ---- The pool ---- */
  const pw = POOL.x1 - POOL.x0, pd = POOL.z1 - POOL.z0;
  const pcx = (POOL.x0 + POOL.x1) / 2, pcz = (POOL.z0 + POOL.z1) / 2;
  // Shell walls and floor, set below the deck so the water sits in a recess.
  box(root, m.stoneDk, pw + 0.6, 1.6, 0.3, pcx, DECK.y - 0.8, POOL.z0 - 0.15, { cast: false });
  box(root, m.stoneDk, pw + 0.6, 1.6, 0.3, pcx, DECK.y - 0.8, POOL.z1 + 0.15, { cast: false });
  box(root, m.stoneDk, 0.3, 1.6, pd + 0.6, POOL.x0 - 0.15, DECK.y - 0.8, pcz, { cast: false });
  box(root, m.stoneDk, 0.3, 1.6, pd + 0.6, POOL.x1 + 0.15, DECK.y - 0.8, pcz, { cast: false });
  box(root, m.stoneDk, pw, 0.2, pd, pcx, POOL.floor, pcz, { cast: false });

  const water = new Mesh(new PlaneGeometry(pw, pd), m.water);
  water.rotation.x = -Math.PI / 2;
  water.position.set(pcx, POOL.water, pcz);
  root.add(water);

  // Sun loungers along the far side, and a pair of parasol poles.
  for (let i = 0; i < 3; i++) {
    const z = POOL.z0 + 2.4 + i * 4.0;
    box(root, m.fabric, 0.85, 0.16, 2.2, POOL.x0 - 1.9, DECK.y + 0.08, z);
    box(root, m.timberDk, 0.9, 0.4, 0.12, POOL.x0 - 1.9, DECK.y + 0.28, z - 1.05, { rx: -0.35 });
  }

  /* ---- Gravel arrival court and drive ---- */
  box(root, m.gravel, DRIVE.w, 0.16, DRIVE.z1 - DRIVE.z0,
      DRIVE.cx, -0.44, (DRIVE.z0 + DRIVE.z1) / 2, { cast: false });

  // Three shallow steps up from the court to the entrance terrace.
  for (let i = 0; i < 3; i++) {
    box(root, m.stone, 9.0, 0.16, 0.7, 4.0, DECK.y - 0.08 - i * 0.16, DECK.z1 + 0.35 + i * 0.7,
        { cast: false });
  }

  /* ---- Planting ----
     Columnar cypress and broad, dusty olive: the two trees that say "Greece"
     at a glance. Smooth-shaded spheres and cones rather than faceted
     icosahedra — the facets read as low-poly game asset, which is exactly the
     tell we are trying to avoid. */
  const r = rng(20240815);
  const trunkGeo = new CylinderGeometry(0.13, 0.24, 1, 6);
  const oliveGeo = new SphereGeometry(1, 9, 7);
  const cypressGeo = new CylinderGeometry(0.06, 1, 1, 9);

  const blocked = (x, z) => (
    (x > DECK.x0 - 4 && x < DECK.x1 + 4 && z > -14 && z < DECK.z1 + 5) ||   // house + terrace
    (Math.abs(x - DRIVE.cx) < DRIVE.w / 2 + 2.5 && z > DRIVE.z0 - 3)        // the drive
  );

  const olives = [], cypresses = [];
  let guard = 0;
  while (olives.length + cypresses.length < settings.trees && guard++ < 6000) {
    const a = r() * Math.PI * 2;
    const rad = 22 + r() * 52;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad * 0.95 + 12;
    if (blocked(x, z)) continue;
    const spot = { x, z, h: 4.0 + r() * 5.0, w: 1.7 + r() * 1.6, tint: r() };
    (r() < 0.3 ? cypresses : olives).push(spot);
  }

  instances(root, trunkGeo, m.trunk, olives.length, (d, i) => {
    const s = olives[i];
    d.position.set(s.x, -0.5 + s.h * 0.28, s.z);
    d.scale.set(1, s.h * 0.56, 1);
  }, { receive: false });

  instances(root, oliveGeo, m.olive, olives.length, (d, i) => {
    const s = olives[i];
    d.position.set(s.x, -0.5 + s.h * 0.72, s.z);
    // Olives are wider than they are tall, and never symmetrical.
    d.scale.set(s.w * 1.25, s.w * 0.78, s.w * (0.95 + s.tint * 0.4));
    d.rotation.set(s.tint * 0.25, s.tint * 6.2, s.tint * 0.18);
  });

  instances(root, cypressGeo, m.cypress, cypresses.length, (d, i) => {
    const s = cypresses[i];
    const h = s.h * 1.5;
    d.position.set(s.x, -0.5 + h / 2, s.z);
    d.scale.set(s.w * 0.62, h, s.w * 0.62);
  });

  /* The allée: paired cypresses marching up both sides of the drive. This is
     the one piece of planting that is placed rather than scattered — it frames
     the opening shot, gives the approach a rhythm to travel through, and is
     the reason the first frame reads as an estate and not a house in a field. */
  const ALLEE = 7;
  instances(root, cypressGeo, m.cypress, ALLEE * 2, (d, i) => {
    const side = i < ALLEE ? -1 : 1;
    const n = i % ALLEE;
    const h = 7.6 - n * 0.3;                      // shortening with distance
    d.position.set(DRIVE.cx + side * (DRIVE.w / 2 + 4.6), -0.5 + h / 2,
                   DRIVE.z0 + 13 + n * 10.5);
    d.scale.set(1.15, h, 1.15);
  });

  /* Low clipped shrubs edging the drive and the terrace. */
  const shrubGeo = new SphereGeometry(1, 8, 6);
  const shrubs = [];
  for (let i = 0; i < settings.shrubs; i++) {
    if (i % 2 === 0) {
      const side = i % 4 === 0 ? -1 : 1;
      shrubs.push({
        x: DRIVE.cx + side * (DRIVE.w / 2 + 1.3 + r() * 0.6),
        z: DRIVE.z0 + 2 + r() * 46,
        s: 0.5 + r() * 0.45
      });
    } else {
      const a = r() * Math.PI;
      shrubs.push({ x: DECK.x0 - 2.5 - r() * 8, z: 4 + Math.sin(a) * 22, s: 0.6 + r() * 0.8 });
    }
  }
  instances(root, shrubGeo, m.leaf, shrubs.length, (d, i) => {
    const s = shrubs[i];
    d.position.set(s.x, -0.5 + s.s * 0.5, s.z);
    d.scale.set(s.s * 1.35, s.s * 0.85, s.s * 1.35);
    d.rotation.y = i * 0.7;
  });

  // A low dry-stone wall retaining the far side of the terrace.
  box(root, m.stoneDk, DECK.x1 - DECK.x0, 0.55, 0.5,
      (DECK.x0 + DECK.x1) / 2, -0.32, DECK.z1 + 0.25, { cast: false });
}
