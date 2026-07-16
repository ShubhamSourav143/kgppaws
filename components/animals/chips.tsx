import { Chip, type ChipTone } from "@/components/ui/Chip";
import { HEALTH_STATUS_LABELS } from "@/lib/utils";
import type { Animal } from "@/types";

const HEALTH_TONES: Record<Animal["healthStatus"], ChipTone> = {
  healthy: "mist",
  under_treatment: "clay",
  recovering: "sand",
  monitoring: "outline",
};

export function HealthChip({ status }: { status: Animal["healthStatus"] }) {
  return <Chip tone={HEALTH_TONES[status]}>{HEALTH_STATUS_LABELS[status]}</Chip>;
}

export function AdoptionChip({ status }: { status: Animal["adoption"] }) {
  switch (status) {
    case "available":
      return <Chip tone="terracotta">Available for Adoption</Chip>;
    case "foster_needed":
      return <Chip tone="clay">Needs Foster</Chip>;
    case "adopted":
      return <Chip tone="forest">Adopted</Chip>;
    default:
      return <Chip tone="outline">Community Paw</Chip>;
  }
}

export function CareChips({ animal }: { animal: Animal }) {
  return (
    <>
      {animal.vaccinated && <Chip tone="mist">Vaccinated</Chip>}
      {animal.sterilized && <Chip tone="mist">Sterilized</Chip>}
      {animal.specialCare && <Chip tone="sand">Special Care</Chip>}
    </>
  );
}
