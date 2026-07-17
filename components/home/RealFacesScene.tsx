"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Image as DreiImage } from "@react-three/drei";
import * as THREE from "three";

interface ScenePhoto {
  url: string;
  caption: string;
}

/**
 * Gently floating photo tiles in 3D, textured with real uploaded photos.
 * Mounted only when prefers-reduced-motion is off (see RealFaces.tsx) and
 * only ever given real (non-demo) photo URLs — there is nothing fictional
 * for this scene to render.
 */
function Tiles({ photos }: { photos: ScenePhoto[] }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  const layout = useMemo(
    () =>
      photos.map((p, i) => {
        const angle = (i / photos.length) * Math.PI * 2;
        const radius = 2.6;
        return {
          ...p,
          position: [
            Math.cos(angle) * radius,
            Math.sin(i * 1.7) * 0.6,
            Math.sin(angle) * radius,
          ] as [number, number, number],
          rotationY: -angle + Math.PI / 2,
          floatOffset: i * 0.8,
        };
      }),
    [photos]
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    group.current.rotation.y = t * 0.05 + pointer.x * 0.25;
    group.current.rotation.x = pointer.y * 0.08;
    group.current.children.forEach((child, i) => {
      child.position.y = layout[i].position[1] + Math.sin(t * 0.6 + layout[i].floatOffset) * 0.15;
    });
  });

  return (
    <group ref={group}>
      {layout.map((tile, i) => (
        <DreiImage
          key={tile.url + i}
          url={tile.url}
          position={tile.position}
          rotation={[0, tile.rotationY, 0]}
          scale={[1.5, 1.9]}
          radius={0.12}
          transparent
        />
      ))}
    </group>
  );
}

export default function RealFacesScene({ photos }: { photos: ScenePhoto[] }) {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 6.2], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.1} />
      <Tiles photos={photos} />
    </Canvas>
  );
}
