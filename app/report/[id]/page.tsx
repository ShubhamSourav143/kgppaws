import type { Metadata } from "next";
import { ReportTracker } from "@/components/report/ReportTracker";

export const metadata: Metadata = {
  title: "Track a report",
  robots: { index: false },
};

export default async function ReportTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container-page max-w-2xl py-10 sm:py-14">
      <ReportTracker reportId={decodeURIComponent(id)} />
    </div>
  );
}
