# Hero video

The steak-sizzling clip lives here as `hero-steak.mp4`, referenced directly by
the Hero section (`src/components/Hero.jsx`). If it's ever missing, the
`<video>` element just falls back to its poster image
(`src/assets/grill-room.jpg`) — the layout, dark overlay, and Ken Burns zoom
animation all work identically either way, so no other code changes are
needed to replace the clip in the future.
