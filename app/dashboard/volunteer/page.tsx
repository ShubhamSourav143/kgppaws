import type { Metadata } from "next";
import { VolunteerDashboard } from "@/components/dashboard/VolunteerDashboard";

export const metadata: Metadata = {
  title: "Volunteer dashboard",
  robots: { index: false },
};

export default function VolunteerDashboardPage() {
  return <VolunteerDashboard />;
}
