import React from 'react';

const STATIC_EMBERS = Array.from({ length: 40 }).map((_, i) => {
  const edge = Math.random();
  let startLeft = '';
  let startBottom = '';
  if (edge < 0.3) {
    startLeft = (Math.random() * 15 - 5) + 'vw';
    startBottom = (Math.random() * 80) + 'vh';
  } else if (edge > 0.7) {
    startLeft = (Math.random() * 15 + 90) + 'vw';
    startBottom = (Math.random() * 80) + 'vh';
  } else {
    startLeft = (Math.random() * 100) + 'vw';
    startBottom = (Math.random() * 10 - 5) + 'vh';
  }

  const duration = (Math.random() * 3 + 3) + 's';
  const delay = (Math.random() * 5) + 's';
  const size = (Math.random() * 3 + 1) + 'px';
  const xDrift = (Math.random() * 10 - 5) + 'vw';
  const opacity = Math.random() * 0.5 + 0.5;

  return (
    <div key={i} className="absolute rounded-full bg-[#ffcc44] shadow-[0_0_12px_#ff9900] pointer-events-none cinema-ember z-20"
      style={{
        left: startLeft,
        bottom: startBottom,
        width: size,
        height: size,
        '--dur': duration,
        '--del': delay,
        '--ember-x': xDrift,
        '--max-op': opacity
      } as any}
    />
  );
});

const FlameLayer = ({ left, right, top, bottom, w, h, color, blur, dur, del, maxOp, xDrift, endScale }: any) => (
  <div 
    className="absolute rounded-[100%] mix-blend-screen pointer-events-none cinema-rise z-10"
    style={{
      left, right, top, bottom,
      width: w, height: h,
      background: `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)`,
      filter: `blur(${blur})`,
      '--dur': dur,
      '--del': del,
      '--max-op': maxOp,
      '--x-drift': xDrift,
      '--end-scale': endScale,
    } as any}
  />
);

export const CinematicFireAmbient = () => {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#020000]">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .cinema-rise { animation: cinema-rise-anim var(--dur, 4s) ease-in infinite var(--del, 0s); }
          .cinema-ember { animation: cinema-ember-anim var(--dur, 3s) linear infinite var(--del, 0s); }
          .cinema-pulse { animation: cinema-pulse-anim var(--dur, 2s) ease-in-out infinite alternate var(--del, 0s); }
        }
        @keyframes cinema-rise-anim {
          0% { transform: translate3d(0, 10%, 0) scale(1) rotate(0deg); opacity: 0; }
          20% { opacity: var(--max-op, 0.8); }
          80% { opacity: var(--max-op, 0.6); }
          100% { transform: translate3d(var(--x-drift, 0), -100%, 0) scale(var(--end-scale, 1.2)) rotate(10deg); opacity: 0; }
        }
        @keyframes cinema-ember-anim {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: var(--max-op, 1); }
          100% { transform: translate3d(var(--ember-x, 20px), -100vh, 0) scale(0); opacity: 0; }
        }
        @keyframes cinema-pulse-anim {
          0% { transform: scale(1); opacity: var(--min-op, 0.4); }
          100% { transform: scale(1.05); opacity: var(--max-op, 0.8); }
        }
      `}</style>
      
      {/* Central Mask - keeps center dark and clear */}
      <div className="absolute inset-0 z-30 bg-[radial-gradient(ellipse_at_center,rgba(2,0,0,0.85)_0%,rgba(2,0,0,0.4)_50%,transparent_100%)]" />

      {/* BASE AMBIENT GLOW (Bottom, Left, Right, Top) */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#3a0000] to-transparent opacity-60 cinema-pulse" style={{'--dur': '4s', '--max-op': '0.8', '--min-op': '0.5'} as any} />
      <div className="absolute top-0 left-0 bottom-0 w-1/4 bg-gradient-to-r from-[#2a0000] to-transparent opacity-50 cinema-pulse" style={{'--dur': '5s', '--del': '1s', '--max-op': '0.7', '--min-op': '0.4'} as any} />
      <div className="absolute top-0 right-0 bottom-0 w-1/4 bg-gradient-to-l from-[#2a0000] to-transparent opacity-50 cinema-pulse" style={{'--dur': '4.5s', '--del': '0.5s', '--max-op': '0.7', '--min-op': '0.4'} as any} />
      <div className="absolute top-0 left-0 right-0 h-1/6 bg-gradient-to-b from-[#1a0000] to-transparent opacity-40 cinema-pulse" style={{'--dur': '6s', '--max-op': '0.5', '--min-op': '0.2'} as any} />

      {/* FLAME BLOBS - carefully placed to hug the perimeter */}
      
      {/* Bottom Ring */}
      <FlameLayer left="-10vw" bottom="-10vh" w="50vw" h="50vh" color="#ff2a00" blur="60px" dur="5s" del="0s" maxOp="0.7" xDrift="5vw" endScale="1.2" />
      <FlameLayer right="-10vw" bottom="-10vh" w="50vw" h="50vh" color="#ff3300" blur="60px" dur="5.5s" del="1s" maxOp="0.7" xDrift="-5vw" endScale="1.2" />
      <FlameLayer left="25vw" bottom="-15vh" w="50vw" h="30vh" color="#cc1100" blur="50px" dur="4s" del="0.5s" maxOp="0.6" xDrift="0" endScale="1.1" />
      
      {/* Bottom Hot Cores */}
      <FlameLayer left="-5vw" bottom="-5vh" w="30vw" h="30vh" color="#ffaa00" blur="40px" dur="3.5s" del="0.2s" maxOp="0.8" xDrift="2vw" endScale="1.3" />
      <FlameLayer right="-5vw" bottom="-5vh" w="30vw" h="30vh" color="#ff9900" blur="40px" dur="3.8s" del="0.8s" maxOp="0.8" xDrift="-2vw" endScale="1.3" />
      <FlameLayer left="35vw" bottom="-10vh" w="30vw" h="20vh" color="#ff8800" blur="35px" dur="3s" del="1.5s" maxOp="0.7" xDrift="1vw" endScale="1.2" />
      <FlameLayer left="-2vw" bottom="-2vh" w="15vw" h="15vh" color="#ffeedd" blur="20px" dur="2.5s" del="0.1s" maxOp="0.9" xDrift="1vw" endScale="1.4" />
      <FlameLayer right="-2vw" bottom="-2vh" w="15vw" h="15vh" color="#ffeedd" blur="20px" dur="2.8s" del="0.6s" maxOp="0.9" xDrift="-1vw" endScale="1.4" />

      {/* Mid/Side Walls */}
      <FlameLayer left="-15vw" top="10vh" w="35vw" h="60vh" color="#dd2200" blur="60px" dur="6s" del="0.3s" maxOp="0.6" xDrift="2vw" endScale="1.1" />
      <FlameLayer right="-15vw" top="10vh" w="35vw" h="60vh" color="#ee2200" blur="60px" dur="6.5s" del="0.7s" maxOp="0.6" xDrift="-2vw" endScale="1.1" />
      
      {/* Side Hot Cores */}
      <FlameLayer left="-10vw" top="30vh" w="20vw" h="40vh" color="#ff5500" blur="40px" dur="4s" del="1.3s" maxOp="0.7" xDrift="1vw" endScale="1.2" />
      <FlameLayer right="-10vw" top="30vh" w="20vw" h="40vh" color="#ff4400" blur="40px" dur="4.2s" del="1.8s" maxOp="0.7" xDrift="-1vw" endScale="1.2" />

      {/* Top Walls (Very subtle, dark red) */}
      <FlameLayer left="0vw" top="-15vh" w="50vw" h="30vh" color="#660000" blur="60px" dur="7s" del="0s" maxOp="0.4" xDrift="2vw" endScale="1.05" />
      <FlameLayer right="0vw" top="-15vh" w="50vw" h="30vh" color="#770000" blur="60px" dur="7.5s" del="1s" maxOp="0.4" xDrift="-2vw" endScale="1.05" />

      {/* EMBERS */}
      {STATIC_EMBERS}
    </div>
  );
};
