// Joining audio chunks for the saved recording. MP3 frames concatenate fine;
// WAV does not — a second header in the middle of a file makes it unplayable.

export function concatAudio(parts, mime) {
  if (parts.length === 1) return parts[0];
  if (!mime?.includes('wav')) return Buffer.concat(parts);

  const header = Buffer.from(parts[0].subarray(0, 44));
  const bodies = parts.map((part) => part.subarray(44));
  const body = Buffer.concat(bodies);
  header.writeUInt32LE(36 + body.length, 4);
  header.writeUInt32LE(body.length, 40);
  return Buffer.concat([header, body]);
}
