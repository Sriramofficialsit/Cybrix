// Backdrop for the Topic 1.1 story: a 1930s rubber-hose cartoon world
// wired for networking. A smiling globe with an orbiting satellite, a
// broadcast tower, a CRT computer with a face, a Wi-Fi router, telegraph
// wire and an ethernet cable carrying packets, and winged-envelope packets
// flying past, all under a projector's grain, flicker and vignette. The
// book covers the middle, so the cast lives along the sides. Purely
// decorative; styles and motion live in vintage.css under .vw.

const INK = "#2a1d12";
const CREAM = "#fbf3dc";

// Puffy cartoon cloud: overlapping bumps on a flat base, inked
function Cloud({ x, y, s, cls }: { x: number; y: number; s: number; cls: string }) {
  return (
    <g className={`vw-cloud ${cls}`}>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <path
          d="M-70,20 C-95,20 -95,-10 -68,-8 C-70,-38 -30,-46 -18,-22 C-8,-52 42,-50 44,-16 C70,-30 96,-4 74,20 Z"
          fill={CREAM}
          stroke={INK}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <path d="M-50,8 C-40,14 -28,14 -20,8" fill="none" stroke={INK} strokeWidth={2.5} strokeLinecap="round" opacity={0.5} />
      </g>
    </g>
  );
}

// Classic pie-cut eye: black oval with a wedge of white out of it
function PieEye({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="vw-blink">
        <ellipse rx={9} ry={14} fill={INK} />
        <path d="M0,-4 L7,-13 L-2,-13 Z" fill="#fff6dd" />
      </g>
    </g>
  );
}

// Cartoon grin with a tongue, and rosy cheeks either side
function Grin({ w, y, cheeks }: { w: number; y: number; cheeks: number }) {
  return (
    <g>
      <ellipse cx={-cheeks} cy={y} rx={w * 0.38} ry={w * 0.24} fill="#e0743f" opacity={0.55} />
      <ellipse cx={cheeks} cy={y} rx={w * 0.38} ry={w * 0.24} fill="#e0743f" opacity={0.55} />
      <path d={`M${-w},${y - 2} C${-w * 0.66},${y + w} ${w * 0.66},${y + w} ${w},${y - 2} C${w * 0.55},${y + w * 0.3} ${-w * 0.55},${y + w * 0.3} ${-w},${y - 2} Z`} fill={INK} />
      <path d={`M${-w * 0.45},${y + w * 0.55} C${-w * 0.2},${y + w * 0.78} ${w * 0.2},${y + w * 0.78} ${w * 0.45},${y + w * 0.55} C${w * 0.2},${y + w * 0.42} ${-w * 0.2},${y + w * 0.42} ${-w * 0.45},${y + w * 0.55} Z`} fill="#c9492e" />
    </g>
  );
}

// A packet: a sealed envelope
function Envelope({ s = 1 }: { s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      <rect x={-17} y={-11} width={34} height={22} rx={3} fill={CREAM} stroke={INK} strokeWidth={3} />
      <path d="M-17,-10 L0,3 L17,-10" fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <circle cx={0} cy={3} r={3.5} fill="#b8452b" />
    </g>
  );
}

// An envelope with flapping wings, for the sky
function FlyingPacket({ cls }: { cls: string }) {
  return (
    <g className={`vw-fly ${cls}`}>
      <g className="vw-wing l">
        <path d="M-8,-8 C-30,-34 -52,-22 -44,-8 C-36,-14 -26,-12 -8,-2 Z" fill={CREAM} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </g>
      <g className="vw-wing r">
        <path d="M8,-8 C30,-34 52,-22 44,-8 C36,-14 26,-12 8,-2 Z" fill={CREAM} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </g>
      <Envelope />
    </g>
  );
}

// Lollipop tree that sways from its base
function Tree({ x, y, s, cls }: { x: number; y: number; s: number; cls: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className={`vw-sway ${cls}`}>
        <path d="M-6,0 C-4,-40 -10,-70 -2,-110 L6,-110 C2,-70 8,-40 8,0 Z" fill="#7a5233" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <path
          d="M0,-100 C-60,-100 -72,-150 -46,-170 C-60,-210 -10,-230 4,-200 C30,-232 76,-200 56,-168 C84,-146 60,-100 0,-100 Z"
          fill="#8f9c58"
          stroke={INK}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
}

// Telegraph pole with a crossbar and two glass insulators
function Pole({ x, y, h }: { x: number; y: number; h: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M-5,0 L-4,${-h} L4,${-h} L5,0 Z`} fill="#6b4a2c" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={-30} y={-h + 10} width={60} height={8} rx={2} fill="#6b4a2c" stroke={INK} strokeWidth={3} />
      <circle cx={-24} cy={-h + 8} r={5} fill="#9fd0c4" stroke={INK} strokeWidth={2.5} />
      <circle cx={24} cy={-h + 8} r={5} fill="#9fd0c4" stroke={INK} strokeWidth={2.5} />
    </g>
  );
}

// Lattice broadcast tower, beacon on top, rings pulsing out from the tip
function Tower({ x, y, h }: { x: number; y: number; h: number }) {
  const half = (t: number) => 42 - 36 * t;
  const braces = Array.from({ length: 7 }, (_, i) => {
    const t0 = i / 7;
    const t1 = (i + 1) / 7;
    return `M${-half(t0)},${-h * t0} L${half(t1)},${-h * t1} M${half(t0)},${-h * t0} L${-half(t1)},${-h * t1}`;
  }).join(" ");
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={0} cy={-h - 18} r={40} className={`vw-ring r${i}`} fill="none" stroke="#b8452b" strokeWidth={4} />
      ))}
      <path d={`M-42,0 L-6,${-h} L6,${-h} L42,0`} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={braces} fill="none" stroke={INK} strokeWidth={2.5} />
      <path d={`M0,${-h} L0,${-h - 14}`} stroke={INK} strokeWidth={4} />
      <circle cx={0} cy={-h - 18} r={8} fill="#e0473a" stroke={INK} strokeWidth={3} className="vw-beacon" />
      <rect x={-50} y={-6} width={100} height={12} rx={3} fill="#6b4a2c" stroke={INK} strokeWidth={3} />
    </g>
  );
}

// Old CRT terminal with a happy face on the screen
function Computer({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="vw-hop">
        <path d="M-26,0 L-18,-22 L18,-22 L26,0 Z" fill="#d8c398" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <rect x={-70} y={-4} width={140} height={20} rx={5} fill="#e9d9b2" stroke={INK} strokeWidth={4} />
        <path d="M-58,4 h116 M-58,10 h116" stroke={INK} strokeWidth={2} strokeDasharray="7 5" opacity={0.6} />
        <rect x={-82} y={-160} width={164} height={140} rx={22} fill="#e9d9b2" stroke={INK} strokeWidth={5} />
        <rect x={-82} y={-160} width={164} height={140} rx={22} fill="url(#vw-dots)" />
        <rect x={-64} y={-144} width={128} height={98} rx={20} fill="#1f3b3a" stroke={INK} strokeWidth={4} />
        <rect x={-58} y={-138} width={116} height={86} rx={16} fill="#9fd0c4" className="vw-screen" />
        <PieEye x={-22} y={-104} s={0.85} />
        <PieEye x={22} y={-104} s={0.85} />
        <Grin w={22} y={-80} cheeks={40} />
        <circle cx={58} cy={-32} r={6} fill="#6b4a2c" stroke={INK} strokeWidth={2.5} />
        <circle cx={40} cy={-32} r={4} fill="#5fbf6a" stroke={INK} strokeWidth={2} className="vw-led a" />
      </g>
    </g>
  );
}

// Wi-Fi router: two antennas, blinking LEDs, signal arcs above
function Router({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${-22 - i * 16},${-78 - i * 14} Q0,${-104 - i * 26} ${22 + i * 16},${-78 - i * 14}`}
          className={`vw-wave w${i}`}
          fill="none"
          stroke="#b8452b"
          strokeWidth={5}
          strokeLinecap="round"
        />
      ))}
      <path d="M-40,-30 L-50,-80" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <path d="M40,-30 L50,-80" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <rect x={-64} y={-34} width={128} height={38} rx={10} fill="#5b3a24" stroke={INK} strokeWidth={4} />
      {[-40, -22, -4, 14].map((cx, i) => (
        <circle key={cx} cx={cx} cy={-15} r={5} fill={i === 0 ? "#f2b33d" : "#5fbf6a"} stroke={INK} strokeWidth={2} className={`vw-led ${"abcd"[i]}`} />
      ))}
      <rect x={30} y={-22} width={22} height={14} rx={2} fill={INK} stroke="#d6ae5c" strokeWidth={1.5} />
      <path d="M-56,4 L-50,12 M56,4 L50,12" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

// Poles: [x, ground y, height]. The wire hangs from each right insulator to the next pole's left one.
const POLES: [number, number, number][] = [
  [205, 650, 190],
  [480, 615, 180],
  [800, 605, 175],
  [1120, 615, 180],
  [1395, 650, 190],
];
const WIRE = POLES.slice(1)
  .map(([x, y, h], i) => {
    const [px, py, ph] = POLES[i];
    const a = { x: px + 24, y: py - ph + 8 };
    const b = { x: x - 24, y: y - h + 8 };
    return `${i ? "L" : "M"}${a.x},${a.y} Q${(a.x + b.x) / 2},${Math.max(a.y, b.y) + 46} ${b.x},${b.y}`;
  })
  .join(" ");

// The ethernet run across the front, router (left) to computer (right)
const CABLE = "M196,800 C260,900 330,820 470,850 C640,885 760,820 920,848 C1080,876 1220,826 1340,846 C1400,856 1440,820 1468,792";

export function VintageWorld() {
  return (
    <div className="vw" aria-hidden="true">
      <div className="vw-sky" />
      <div className="vw-burst" />

      <svg className="vw-art" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">
        <defs>
          <pattern id="vw-dots" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill={INK} opacity="0.16" />
          </pattern>
          {/* a hand-inked wobble, on the static hills only */}
          <filter id="vw-wobble">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="4" />
          </filter>
          <clipPath id="vw-globe-clip">
            <circle r={78} />
          </clipPath>
        </defs>

        {/* the internet itself: a smiling globe with a satellite in orbit */}
        <g transform="translate(1470 300)">
          <g className="vw-bob">
            <ellipse rx={128} ry={36} transform="rotate(-18)" fill="none" stroke={INK} strokeWidth={2.5} strokeDasharray="6 8" opacity={0.55} />
            <circle r={80} fill="#7fb0a8" stroke={INK} strokeWidth={5} />
            <g clipPath="url(#vw-globe-clip)">
              <path d="M-80,-30 C-50,-60 -20,-40 -30,-10 C-40,20 -70,10 -80,30 Z M10,-78 C40,-70 60,-40 40,-30 C20,-20 0,-40 10,-78 Z M20,30 C50,10 90,30 70,70 C50,90 20,70 20,30 Z" fill="#cdb46c" stroke={INK} strokeWidth={3} />
              <ellipse rx={80} ry={26} fill="none" stroke={INK} strokeWidth={2} opacity={0.35} />
              <ellipse rx={30} ry={80} fill="none" stroke={INK} strokeWidth={2} opacity={0.35} />
              <circle r={80} fill="url(#vw-dots)" />
            </g>
            <PieEye x={-24} y={-14} />
            <PieEye x={24} y={-14} />
            <Grin w={30} y={16} cheeks={46} />
            <path id="vw-orbit" d="M-128,0 A128,36 0 1,0 128,0 A128,36 0 1,0 -128,0" transform="rotate(-18)" fill="none" />
            <g>
              <animateMotion dur="9s" repeatCount="indefinite" rotate="auto">
                <mpath href="#vw-orbit" />
              </animateMotion>
              <rect x={-30} y={-7} width={18} height={14} fill="#6fa3c8" stroke={INK} strokeWidth={2.5} />
              <rect x={12} y={-7} width={18} height={14} fill="#6fa3c8" stroke={INK} strokeWidth={2.5} />
              <path d="M-12,0 L12,0" stroke={INK} strokeWidth={3} />
              <circle r={9} fill="#d8c398" stroke={INK} strokeWidth={3} />
            </g>
          </g>
        </g>

        <Cloud x={190} y={250} s={0.95} cls="d1" />
        <Cloud x={760} y={175} s={0.8} cls="d2" />
        <Cloud x={1250} y={190} s={0.75} cls="d3" />

        {/* packets on the wing */}
        <FlyingPacket cls="f1" />
        <FlyingPacket cls="f2" />

        {/* far hills */}
        <path d="M0,560 C160,470 320,470 470,540 C620,610 760,470 930,480 C1100,490 1200,560 1330,520 C1450,485 1540,470 1600,500 L1600,900 L0,900 Z" fill="#c4c08a" stroke={INK} strokeWidth={4} filter="url(#vw-wobble)" />
        <path d="M0,560 C160,470 320,470 470,540 C620,610 760,470 930,480 C1100,490 1200,560 1330,520 C1450,485 1540,470 1600,500 L1600,900 L0,900 Z" fill="url(#vw-dots)" />

        <Tower x={95} y={600} h={300} />
        <Tree x={300} y={590} s={0.55} cls="s2" />
        <Tree x={1300} y={585} s={0.5} cls="s1" />

        {/* telegraph line, packets riding the wire */}
        {POLES.map(([x, y, h]) => (
          <Pole key={x} x={x} y={y} h={h} />
        ))}
        <path id="vw-wire" d={WIRE} fill="none" stroke={INK} strokeWidth={2.5} />
        {[0, 3.5].map((begin) => (
          <g key={begin} className="vw-mover">
            <animateMotion dur="7s" begin={`${-begin}s`} repeatCount="indefinite">
              <mpath href="#vw-wire" />
            </animateMotion>
            <g transform="translate(0 -14)">
              <Envelope s={0.7} />
            </g>
          </g>
        ))}

        {/* mid hills */}
        <path d="M0,660 C140,600 280,610 400,650 C540,700 640,630 800,640 C960,650 1060,700 1220,660 C1360,625 1480,610 1600,640 L1600,900 L0,900 Z" fill="#a3a96a" stroke={INK} strokeWidth={4} filter="url(#vw-wobble)" />
        <path d="M0,660 C140,600 280,610 400,650 C540,700 640,630 800,640 C960,650 1060,700 1220,660 C1360,625 1480,610 1600,640 L1600,900 L0,900 Z" fill="url(#vw-dots)" />

        {/* foreground meadow */}
        <path d="M0,790 C200,760 380,780 560,800 C760,822 900,770 1100,780 C1300,790 1440,770 1600,790 L1600,900 L0,900 Z" fill="#8a9550" stroke={INK} strokeWidth={4} filter="url(#vw-wobble)" />
        <path d="M0,790 C200,760 380,780 560,800 C760,822 900,770 1100,780 C1300,790 1440,770 1600,790 L1600,900 L0,900 Z" fill="url(#vw-dots)" />

        {/* the ethernet run, a packet travelling it */}
        <path d={CABLE} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
        <path id="vw-cable" d={CABLE} fill="none" stroke="#4f86b0" strokeWidth={7} strokeLinecap="round" />
        <path d={CABLE} fill="none" stroke="#a9cbe3" strokeWidth={2} strokeLinecap="round" strokeDasharray="2 14" opacity={0.8} />
        <g className="vw-mover">
          <animateMotion dur="6s" repeatCount="indefinite">
            <mpath href="#vw-cable" />
          </animateMotion>
          <circle r={8} fill="#fff1a8" stroke="#e0743f" strokeWidth={3} />
        </g>

        <Router x={150} y={792} s={0.95} />
        <Computer x={1480} y={800} s={0.9} />

        {/* grass tufts */}
        <path
          d="M300,880 l6,-18 l4,14 l6,-20 l4,22 M640,886 l5,-16 l4,12 l5,-18 l4,20 M980,880 l6,-18 l4,14 l6,-20 l4,22 M1290,886 l5,-16 l4,12 l5,-18 l4,20"
          fill="none"
          stroke={INK}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="vw-grain" />
      <div className="vw-scratch" />
      <div className="vw-vignette" />
    </div>
  );
}
