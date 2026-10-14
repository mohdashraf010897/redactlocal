// Minimal MP4 (ISO BMFF) writer: one H.264 video track (no B-frames) and an optional AAC audio track.
// Layout: ftyp, moov, mdat ("fast start", so players can begin before the whole file loads).
//   buildMp4({ width, height, fps, avcC, samples: [{ data: Buffer, key: boolean }], color,
//              audio?: { sampleRate, channels, asc: Buffer, samples: Buffer[] } })  // 1024-sample AAC frames

const u8 = (...n) => Buffer.from(n);
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16BE(n); return b; };
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n >>> 0); return b; };
const u64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(n)); return b; };
const zeros = (n) => Buffer.alloc(n);

const box = (type, ...parts) => {
  const body = Buffer.concat(parts.flat());
  return Buffer.concat([u32(8 + body.length), Buffer.from(type, "latin1"), body]);
};
const full = (type, version, flags, ...parts) => box(type, u8(version, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255), ...parts);

// Identity transform matrix used by mvhd and tkhd.
const MATRIX = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000].map(u32);

// MPEG-4 descriptor: tag, 4-byte length, body (ISO/IEC 14496-1).
const desc = (tag, ...parts) => { const body = Buffer.concat(parts.flat()); return Buffer.concat([u8(tag, 0x80 | ((body.length >> 21) & 127), 0x80 | ((body.length >> 14) & 127), 0x80 | ((body.length >> 7) & 127), body.length & 127), body]); };

// WebCodecs colour-space names -> ISO/IEC 23091-2 codes for the colr box.
const PRIMARIES = { bt709: 1, bt470bg: 5, smpte170m: 6, bt2020: 9, smpte432: 12 };
const TRANSFER = { bt709: 1, smpte170m: 6, "iec61966-2-1": 13, linear: 8, pq: 16, hlg: 18 };
const MATRIXC = { rgb: 0, bt709: 1, bt470bg: 5, smpte170m: 6, "bt2020-ncl": 9 };

function audioTrak(a, movieScale, chunkOffset) {
  const n = a.samples.length;
  const duration = n * 1024;
  const sizes = a.samples.map((b) => b.length);
  const bitrate = Math.round((sizes.reduce((x, y) => x + y, 0) * 8 * a.sampleRate) / duration);
  const esds = full("esds", 0, 0, desc(0x03, u16(2), u8(0),
    desc(0x04, u8(0x40, 0x15), u8(0, 0, 0), u32(bitrate), u32(bitrate), desc(0x05, a.asc)), // AAC, audio stream
    desc(0x06, u8(0x02))));
  const mp4a = box("mp4a", zeros(6), u16(1), zeros(8), u16(a.channels), u16(16), zeros(4), u32(a.sampleRate * 65536), esds);
  return box("trak",
    full("tkhd", 0, 3, u32(0), u32(0), u32(2), zeros(4), u32(Math.round((duration / a.sampleRate) * movieScale)), zeros(8), u16(0), u16(1), u16(0x0100), zeros(2), MATRIX, u32(0), u32(0)),
    box("mdia",
      full("mdhd", 0, 0, u32(0), u32(0), u32(a.sampleRate), u32(duration), u16(0x55c4), u16(0)),
      full("hdlr", 0, 0, u32(0), Buffer.from("soun", "latin1"), zeros(12), Buffer.from("SoundHandler\0", "latin1")),
      box("minf",
        full("smhd", 0, 0, u16(0), u16(0)),
        box("dinf", full("dref", 0, 0, u32(1), full("url ", 0, 1))),
        box("stbl",
          full("stsd", 0, 0, u32(1), mp4a),
          full("stts", 0, 0, u32(1), u32(n), u32(1024)),
          full("stsc", 0, 0, u32(1), u32(1), u32(n), u32(1)),
          full("stsz", 0, 0, u32(0), u32(n), sizes.map(u32)),
          full("co64", 0, 0, u32(1), u64(chunkOffset)),
        ),
      ),
    ),
  );
}

export function buildMp4({ width, height, fps, avcC, samples, color, audio }) {
  if (!samples.length) throw new Error("no samples to write");
  const timescale = fps * 1000, delta = 1000, movieScale = 1000;
  const duration = samples.length * delta;
  const movieDuration = Math.round((samples.length / fps) * movieScale);
  const sizes = samples.map((s) => s.data.length);
  const videoBytes = sizes.reduce((a, b) => a + b, 0);
  const audioBytes = audio ? audio.samples.reduce((a, b) => a + b.length, 0) : 0;
  const mdatSize = 8 + videoBytes + audioBytes;
  if (mdatSize > 0xffffffff) throw new Error("video too large for this writer (over 4 GB)");
  const keys = samples.flatMap((s, i) => (s.key ? [i + 1] : []));

  const colr = color && color.primaries && color.transfer && color.matrix
    ? box("colr", Buffer.from("nclx", "latin1"), u16(PRIMARIES[color.primaries] ?? 2), u16(TRANSFER[color.transfer] ?? 2), u16(MATRIXC[color.matrix] ?? 2), u8(color.fullRange ? 0x80 : 0))
    : Buffer.alloc(0);

  const avc1 = box("avc1",
    zeros(6), u16(1), // reserved, data_reference_index
    zeros(16), // pre_defined + reserved
    u16(width), u16(height),
    u32(0x00480000), u32(0x00480000), // 72 dpi
    zeros(4), u16(1), // reserved, frame_count
    zeros(32), // compressor name
    u16(0x0018), u16(0xffff), // depth, pre_defined = -1
    box("avcC", Buffer.from(avcC)),
    colr,
    box("pasp", u32(1), u32(1)),
  );

  const stbl = (chunkOffset) => box("stbl",
    full("stsd", 0, 0, u32(1), avc1),
    full("stts", 0, 0, u32(1), u32(samples.length), u32(delta)),
    full("stss", 0, 0, u32(keys.length), keys.map(u32)),
    full("stsc", 0, 0, u32(1), u32(1), u32(samples.length), u32(1)),
    full("stsz", 0, 0, u32(0), u32(samples.length), sizes.map(u32)),
    full("co64", 0, 0, u32(1), u64(chunkOffset)),
  );

  const moov = (chunkOffset) => box("moov",
    full("mvhd", 0, 0, u32(0), u32(0), u32(movieScale), u32(Math.max(movieDuration, audio ? Math.round((audio.samples.length * 1024 / audio.sampleRate) * movieScale) : 0)), u32(0x00010000), u16(0x0100), zeros(10), MATRIX, zeros(24), u32(audio ? 3 : 2)),
    box("trak",
      full("tkhd", 0, 3, u32(0), u32(0), u32(1), zeros(4), u32(movieDuration), zeros(8), u16(0), u16(0), u16(0), zeros(2), MATRIX, u32(width << 16), u32(height << 16)),
      box("mdia",
        full("mdhd", 0, 0, u32(0), u32(0), u32(timescale), u32(duration), u16(0x55c4), u16(0)),
        full("hdlr", 0, 0, u32(0), Buffer.from("vide", "latin1"), zeros(12), Buffer.from("VideoHandler\0", "latin1")),
        box("minf",
          full("vmhd", 0, 1, zeros(8)),
          box("dinf", full("dref", 0, 0, u32(1), full("url ", 0, 1))),
          stbl(chunkOffset),
        ),
      ),
    ),
    audio ? audioTrak(audio, movieScale, chunkOffset + videoBytes) : Buffer.alloc(0),
  );

  const ftyp = box("ftyp", Buffer.from("isom", "latin1"), u32(0x200), Buffer.from("isomiso2avc1mp41", "latin1"));
  const moovLen = moov(0).length; // offset value does not change the size
  const header = Buffer.concat([ftyp, moov(ftyp.length + moovLen + 8), u32(mdatSize), Buffer.from("mdat", "latin1")]);
  return Buffer.concat([header, ...samples.map((s) => s.data), ...(audio ? audio.samples : [])]);
}
