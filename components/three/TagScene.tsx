"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Float, PresentationControls, ContactShadows, RoundedBox, Text } from "@react-three/drei";
import QRCode from "qrcode";
import { SITE } from "@/lib/config";

/**
 * The PAWS collar tag in real 3D — drag to spin. Saffron enamel front with
 * the animal's name; scannable QR on the back. Loaded lazily (client-only)
 * with the CSS flip-tag as fallback, so WebGL is never a requirement.
 */
function Tag({ name, qrToken }: { name: string; qrToken: string }) {
  const [qrTexture, setQrTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(`${SITE.url}/p/${qrToken}`, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 512,
      color: { dark: "#14402f", light: "#fdfbf6" },
    }).then((url) => {
      if (cancelled) return;
      new THREE.TextureLoader().load(url, (tex) => {
        tex.anisotropy = 4;
        tex.colorSpace = THREE.SRGBColorSpace;
        if (!cancelled) setQrTexture(tex);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [qrToken]);

  const enamel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#e8813a"),
        roughness: 0.25,
        metalness: 0.55,
      }),
    []
  );
  const rim = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#e9b84c"),
        roughness: 0.2,
        metalness: 0.85,
      }),
    []
  );

  return (
    <group>
      {/* hanging ring */}
      <mesh position={[0, 1.62, 0]} material={rim}>
        <torusGeometry args={[0.28, 0.07, 20, 40]} />
      </mesh>
      {/* tag body */}
      <RoundedBox args={[2.5, 2.5, 0.16]} radius={0.34} smoothness={6} material={enamel} />
      {/* gold rim inlay */}
      <RoundedBox args={[2.24, 2.24, 0.18]} radius={0.3} smoothness={6} material={rim} position={[0, 0, 0]} scale={[1, 1, 0.92]} />
      {/* front face */}
      <RoundedBox args={[2.1, 2.1, 0.2]} radius={0.28} smoothness={6} material={enamel} />
      <Text
        position={[0, 0.28, 0.13]}
        fontSize={0.42}
        color="#fdfbf6"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.02}
      >
        {name}
      </Text>
      <Text
        position={[0, -0.34, 0.13]}
        fontSize={0.16}
        color="#f3dda6"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.24}
      >
        KGP PAWS
      </Text>
      {/* paw mark */}
      <group position={[0, -0.78, 0.13]}>
        {[[-0.14, 0.08], [0.14, 0.08], [-0.26, -0.02], [0.26, -0.02]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 0]}>
            <circleGeometry args={[0.05, 16]} />
            <meshBasicMaterial color="#fdfbf6" />
          </mesh>
        ))}
        <mesh position={[0, -0.08, 0]}>
          <circleGeometry args={[0.11, 24]} />
          <meshBasicMaterial color="#fdfbf6" />
        </mesh>
      </group>
      {/* QR back */}
      {qrTexture && (
        <mesh position={[0, 0, -0.115]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.8, 1.8]} />
          <meshBasicMaterial map={qrTexture} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

export default function TagScene({ name, qrToken }: { name: string; qrToken: string }) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 6.4], fov: 34 }}
      style={{ touchAction: "pan-y" }}
      gl={{ antialias: true, alpha: true }}
      aria-label={`3D collar tag for ${name} — drag to rotate and see the QR code`}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} color="#fff4e0" />
      <directionalLight position={[-5, -2, -4]} intensity={0.5} color="#9db8ff" />
      <PresentationControls
        global
        cursor
        speed={1.4}
        polar={[-0.4, 0.4]}
        azimuth={[-Infinity, Infinity]}
      >
        <Float rotationIntensity={0.35} floatIntensity={0.9} speed={2.2}>
          <Tag name={name} qrToken={qrToken} />
        </Float>
      </PresentationControls>
      <ContactShadows position={[0, -2.2, 0]} opacity={0.3} blur={2.6} scale={7} />
    </Canvas>
  );
}
