# Hero video

Drop the real "steak sizzling on grill" clip here as:

    public/videos/hero-steak.mp4

The Hero section (`src/components/Hero.jsx`) already references this exact
path. Until the file exists, the video element just shows its poster image
(`src/assets/grill-room.jpg`) instead — the layout, dark overlay, and the
slow Ken Burns zoom animation all work identically either way, so no other
code changes are needed once you add the file.

Recommended format: H.264 MP4, 1920x1080 or 1280x720, muted (audio is
stripped by the `muted` attribute anyway), 10-20s loop, kept under ~8-10MB
for reasonable load times since it autoplays on every device.
