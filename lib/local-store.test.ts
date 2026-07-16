// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  getDemoSession,
  getLocalApplications,
  getLocalDonations,
  getLocalReports,
  getSavedAnimals,
  nextApplicationId,
  nextReportId,
  saveLocalApplication,
  saveLocalDonation,
  saveLocalReport,
  signInDemo,
  signOutDemo,
  toggleSavedAnimal,
} from "@/lib/local-store";
import type { AdoptionApplication, RescueReport } from "@/types";

beforeEach(() => {
  window.localStorage.clear();
});

function makeReport(id: string): RescueReport {
  return {
    id,
    createdAt: new Date().toISOString(),
    animalType: "dog",
    problem: "injured",
    severity: "urgent",
    zoneId: "tech-market",
    locationNote: "",
    description: "Test report",
    status: "reported",
    updates: [],
    demo: true,
  };
}

function makeApplication(id: string): AdoptionApplication {
  return {
    id,
    animalSlug: "simba",
    createdAt: new Date().toISOString(),
    applicant: { name: "Test Applicant", email: "test@example.com", phone: "", affiliation: "" },
    living: { housing: "hostel", ownOrRent: "n/a", householdAgrees: true, hasOutdoorSpace: false },
    experience: { hadPetsBefore: false, currentPets: "", hoursAloneDaily: "" },
    motivation: "Because",
    status: "submitted",
    demo: true,
  };
}

describe("saved animals", () => {
  it("starts empty", () => {
    expect(getSavedAnimals()).toEqual([]);
  });

  it("toggling an unsaved slug saves it and returns true", () => {
    const nowSaved = toggleSavedAnimal("simba");
    expect(nowSaved).toBe(true);
    expect(getSavedAnimals()).toEqual(["simba"]);
  });

  it("toggling an already-saved slug removes it and returns false", () => {
    toggleSavedAnimal("simba");
    const nowSaved = toggleSavedAnimal("simba");
    expect(nowSaved).toBe(false);
    expect(getSavedAnimals()).toEqual([]);
  });

  it("supports multiple saved animals independently", () => {
    toggleSavedAnimal("simba");
    toggleSavedAnimal("muesli");
    expect(getSavedAnimals().sort()).toEqual(["muesli", "simba"]);
    toggleSavedAnimal("simba");
    expect(getSavedAnimals()).toEqual(["muesli"]);
  });
});

describe("rescue reports", () => {
  it("nextReportId continues from the seed data's last code (00126)", () => {
    expect(nextReportId()).toBe("PAWS-RESCUE-2026-00127");
  });

  it("nextReportId increments after a report is saved", () => {
    saveLocalReport(makeReport(nextReportId()));
    expect(nextReportId()).toBe("PAWS-RESCUE-2026-00128");
  });

  it("saveLocalReport persists and getLocalReports reads it back", () => {
    const report = makeReport("PAWS-RESCUE-2026-00127");
    saveLocalReport(report);
    expect(getLocalReports()).toHaveLength(1);
    expect(getLocalReports()[0].id).toBe("PAWS-RESCUE-2026-00127");
  });

  it("stores newest report first", () => {
    saveLocalReport(makeReport("PAWS-RESCUE-2026-00127"));
    saveLocalReport(makeReport("PAWS-RESCUE-2026-00128"));
    expect(getLocalReports().map((r) => r.id)).toEqual([
      "PAWS-RESCUE-2026-00128",
      "PAWS-RESCUE-2026-00127",
    ]);
  });
});

describe("adoption applications", () => {
  it("nextApplicationId starts from the seed data's last code (0041)", () => {
    expect(nextApplicationId()).toBe("APP-2026-0042");
  });

  it("saveLocalApplication persists and getLocalApplications reads it back", () => {
    saveLocalApplication(makeApplication(nextApplicationId()));
    expect(getLocalApplications()).toHaveLength(1);
    expect(getLocalApplications()[0].animalSlug).toBe("simba");
  });
});

describe("demo donations", () => {
  it("starts empty and never marks a donation as anything but pending_verification", () => {
    expect(getLocalDonations()).toEqual([]);
    saveLocalDonation({
      id: "d1",
      campaignSlug: "simbas-recovery-fund",
      campaignTitle: "Simba's Recovery Fund",
      amount: 500,
      createdAt: new Date().toISOString(),
      status: "pending_verification",
    });
    expect(getLocalDonations()[0].status).toBe("pending_verification");
  });
});

describe("demo session", () => {
  it("has no session initially", () => {
    expect(getDemoSession()).toBeNull();
  });

  it("signInDemo sets a role-appropriate session that persists", () => {
    const user = signInDemo("admin");
    expect(user.role).toBe("admin");
    expect(user.demo).toBe(true);
    expect(getDemoSession()?.role).toBe("admin");
  });

  it("signOutDemo clears the session", () => {
    signInDemo("volunteer");
    signOutDemo();
    expect(getDemoSession()).toBeNull();
  });

  it("gives each role a distinct, identifiable demo identity", () => {
    expect(signInDemo("user").email).toContain("user@demo.kgppaws.org");
    expect(signInDemo("volunteer").email).toContain("volunteer@demo.kgppaws.org");
    expect(signInDemo("admin").email).toContain("admin@demo.kgppaws.org");
  });
});
