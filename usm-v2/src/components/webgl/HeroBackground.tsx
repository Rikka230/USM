import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";

const PINK = new THREE.Color("#d80056");
const LIGHT = new THREE.Color("#ff7ab0");
const WHITE = new THREE.Color("#ffffff");

function Particles({ count, reduced, pointer }: {
  count: number;
  reduced: boolean;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Distribution dans une sphère, plus dense au centre.
      const r = Math.pow(Math.random(), 0.6) * 7;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      positions[i * 3 + 2] = r * Math.cos(phi);
      const t = Math.random();
      const c = t < 0.7 ? PINK.clone().lerp(LIGHT, Math.random()) : WHITE;
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    if (reduced) {
      g.rotation.set(0, 0, 0);
      return;
    }
    const t = state.clock.elapsedTime;
    // Mouvement lent et discret (direction sobre)
    g.rotation.y = t * 0.016 + pointer.current.x * 0.12;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pointer.current.y * 0.08, 0.04);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.024}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.38}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function HeroBackground() {
  const [reduced, setReduced] = useState(false);
  const [count, setCount] = useState(0);
  const [ok, setOk] = useState(true);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    try {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduced(mq.matches);
      const mobile = window.innerWidth < 768;
      setCount(mobile ? 450 : 1100);
      // Détection WebGL minimale
      const c = document.createElement("canvas");
      if (!c.getContext("webgl") && !c.getContext("experimental-webgl")) setOk(false);
    } catch {
      setOk(false);
    }
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  if (!ok || count === 0) return null;

  return (
    <Canvas
      className="hero-webgl-canvas"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 9], fov: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop={reduced ? "demand" : "always"}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <Particles count={count} reduced={reduced} pointer={pointer} />
    </Canvas>
  );
}
