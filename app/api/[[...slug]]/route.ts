import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { POST as adoptApply } from "@/app/api/adopt/apply/handler";
import { POST as donateConfirm } from "@/app/api/donate/confirm/handler";
import { POST as mediaIngest } from "@/app/api/media/ingest/handler";
import { POST as mediaSweep } from "@/app/api/media/sweep/handler";
import { POST as notifyDispatch } from "@/app/api/notify/dispatch/handler";
import { POST as qrGenerate } from "@/app/api/qr/generate/handler";
import { POST as qrPrintSheet } from "@/app/api/qr/print-sheet/handler";
import { POST as reports } from "@/app/api/reports/handler";
import { GET as search } from "@/app/api/search/handler";
import { POST as sheets } from "@/app/api/sheets/handler";
import { POST as syncEnqueue } from "@/app/api/sync/enqueue/handler";
import { POST as syncEnqueueAll } from "@/app/api/sync/enqueue-all/handler";
import { POST as syncHousekeeping } from "@/app/api/sync/housekeeping/handler";
import { POST as syncResolve } from "@/app/api/sync/resolve/handler";
import { POST as syncRun } from "@/app/api/sync/run/handler";
import { GET as syncStatus } from "@/app/api/sync/status/handler";
import { POST as syncWorker } from "@/app/api/sync/worker/handler";

/**
 * Single API dispatcher.
 *
 * Every `/api/*` route on the site funnels through this catch-all so the
 * whole project deploys as ONE serverless function instead of one per
 * endpoint (Vercel Hobby caps at 12 functions). Handler modules live next
 * to their old paths under `app/api/**\/handler.ts` — those files are no
 * longer registered as routes because they aren't named `route.ts`.
 *
 * Adding a new endpoint: create `app/api/foo/handler.ts` exporting a
 * `GET` or `POST`, then wire one line in the switch below.
 */

type Handler = (req: NextRequest) => Promise<Response> | Response;

const GET_ROUTES: Record<string, Handler> = {
  "search": search as unknown as Handler,
  "sync/status": syncStatus as unknown as Handler,
};

const POST_ROUTES: Record<string, Handler> = {
  "adopt/apply": adoptApply as unknown as Handler,
  "donate/confirm": donateConfirm as unknown as Handler,
  "media/ingest": mediaIngest as unknown as Handler,
  "media/sweep": mediaSweep as unknown as Handler,
  "notify/dispatch": notifyDispatch as unknown as Handler,
  "qr/generate": qrGenerate as unknown as Handler,
  "qr/print-sheet": qrPrintSheet as unknown as Handler,
  "reports": reports as unknown as Handler,
  "sheets": sheets as unknown as Handler,
  "sync/enqueue": syncEnqueue as unknown as Handler,
  "sync/enqueue-all": syncEnqueueAll as unknown as Handler,
  "sync/housekeeping": syncHousekeeping as unknown as Handler,
  "sync/resolve": syncResolve as unknown as Handler,
  "sync/run": syncRun as unknown as Handler,
  "sync/worker": syncWorker as unknown as Handler,
};

function pathOf(slug: string[] | undefined): string {
  return (slug ?? []).join("/");
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await ctx.params;
  const path = pathOf(slug);
  const handler = GET_ROUTES[path];
  if (!handler) {
    return NextResponse.json({ error: "not found", path }, { status: 404 });
  }
  return handler(req);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await ctx.params;
  const path = pathOf(slug);
  const handler = POST_ROUTES[path];
  if (!handler) {
    return NextResponse.json({ error: "not found", path }, { status: 404 });
  }
  return handler(req);
}
