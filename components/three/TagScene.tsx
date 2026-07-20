"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Float, PresentationControls, ContactShadows, RoundedBox } from "@react-three/drei";
import QRCode from "qrcode";
import { SITE } from "@/lib/config";

/**
 * The PAWS collar tag in real 3D — drag to spin. Saffron enamel front with
 * the animal's name; scannable QR on the back. Text is painted onto canvas
 * textures (no font workers), so the scene never suspends.
 */

function makeFrontTexture(name: string): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;

  // enamel face
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#ef9350");
  grad.addColorStop(1, "#d76f24");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // gold inner border
  ctx.strokeStyle = "#f3dda6";
  ctx.lineWidth = 10;
  ctx.strokeRect(26, 26, size - 52, size - 52);

  // name
  ctx.fillStyle = "#fdfbf6";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fit = Math.min(96, (size * 0.78) / Math.max(1, name.length * 0.52));
  ctx.font = `700 ${fit}px Fraunces, Georgia, serif`;
  ctx.fillText(name, size / 2, size * 0.42);

  // brand
  ctx.font = "700 34px Manrope, sans-serif";
  ctx.fillStyle = "#f3dda6";
  const spaced = "K G P   P A W S";
  ctx.fillText(spaced, size / 2, size * 0.6);

  // paw
  const paw = (x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.fillStyle = "#fdfbf6";
  const cx = size / 2;
  const cy = size * 0.76;
  paw(cx - 34, cy - 18, 12);
  paw(cx + 34, cy - 18, 12);
  paw(cx - 62, cy + 6, 10);
  paw(cx + 62, cy + 6, 10);
  ctx.beginPath();
  ctx.ellipse(cx, cy + 14, 26, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Tag({ name, qrToken }: { name: string; qrToken: string }) {
  const [qrTexture, setQrTexture] = useState<THREE.Texture | null>(null);
  const frontTexture = useMemo(() => makeFrontTexture(name), [name]);

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

  const rimMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#e9b84c"),
        roughness: 0.3,
        metalness: 0.35,
        emissive: new THREE.Color("#8a6414"),
        emissiveIntensity: 0.3,
      }),
    []
  );
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#e8813a"),
        roughness: 0.35,
        metalness: 0.15,
        emissive: new THREE.Color("#7a3c12"),
        emissiveIntensity: 0.3,
      }),
    []
  );

  return (
    <group>
      {/* hanging ring */}
      <mesh position={[0, 1.62, 0]} material={rimMaterial}>
        <torusGeometry args={[0.28, 0.07, 20, 40]} />
      </mesh>
      {/* tag body */}
      <RoundedBox args={[2.5, 2.5, 0.18]} radius={0.3} smoothness={6} material={bodyMaterial} />
      {/* front face */}
      <mesh position={[0, 0, 0.096]}>
        <planeGeometry args={[2.28, 2.28]} />
        <meshBasicMaterial map={frontTexture} toneMapped={false} />
      </mesh>
      {/* QR back */}
      <mesh position={[0, 0, -0.096]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.05, 2.05]} />
        {qrTexture ? (
          <meshBasicMaterial map={qrTexture} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#fdfbf6" />
        )}
      </mesh>
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
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 5]} intensity={2.4} color="#fff4e0" />
      <directionalLight position={[-5, -2, -4]} intensity={0.9} color="#9db8ff" />
      <pointLight position={[0, 0, 4]} intensity={1.2} color="#ffe9c9" />
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
