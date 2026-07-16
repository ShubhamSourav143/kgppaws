import type { Metadata } from "next";
import { UserDashboard } from "@/components/dashboard/UserDashboard";

export const metadata: Metadata = {
  title: "My dashboard",
  robots: { index: false },
};

export default function DashboardPage() {
  return <UserDashboard />;
}
