import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { SITE } from "@/lib/config";

/**
 * POST /api/qr/print-sheet
 *
 * Admin-authenticated. Given a list of animal ids, returns an A4 SVG print
 * sheet (2×4 grid) with QR + Public ID + name + crop marks. SVG is used
 * instead of PDF to avoid the react-pdf dependency at this stage — every
 * browser prints SVG-in-HTML cleanly at exact millimetre sizes.
 *
 * The caller sends the response through /admin/animals as a downloadable
 * file; volunteers print at 100% scale for outdoor-tag-ready QR codes.
 */

const BodySchema = z.object({
  animalIds: z.array(z.string().uuid()).min(1).max(24),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase not configured" }, { status: 503 });
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);
  const roles = new Set((roleData ?? []).map((r) => r.role));
  if (!roles.has("admin") && !roles.has("super_admin")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch (e) {
    return NextResponse.json(
      { error: "invalid body", details: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    );
  }

  const service = createServiceSupabase();
  if (!service) return NextResponse.json({ error: "service role not configured" }, { status: 503 });
  const { data: animals } = await service
    .from("animals")
    .select("id, public_id, name")
    .in("id", body.animalIds);
  if (!animals || animals.length === 0) {
    return NextResponse.json({ error: "no animals resolved" }, { status: 404 });
  }

  const qrDataUrls = await Promise.all(
    animals.map(async (a) => ({
      publicId: a.public_id as string,
      name: a.name as string,
      dataUrl: await QRCode.toDataURL(`${SITE.url}/dog/${a.public_id}`, {
        errorCorrectionLevel: "H",
        margin: 1,
        scale: 8,
      }),
    }))
  );

  const html = renderPrintSheetHtml(qrDataUrls);
  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-disposition": `inline; filename=\"kgp-paws-qr-sheet.html\"`,
    },
  });
}

function renderPrintSheetHtml(tags: { publicId: string; name: string; dataUrl: string }[]): string {
  // 2 columns × 4 rows per page — 8 tags per page.
  const pages: (typeof tags)[] = [];
  for (let i = 0; i < tags.length; i += 8) pages.push(tags.slice(i, i + 8));

  const pageMarkup = pages
    .map(
      (page) => `
    <section class="sheet">
      <div class="grid">
        ${page
          .map(
            (t) => `
          <div class="tag">
            <img alt="QR for ${t.publicId}" src="${t.dataUrl}" />
            <div class="meta">
              <p class="name">${escapeHtml(t.name)}</p>
              <p class="pid">${escapeHtml(t.publicId)}</p>
              <p class="brand">kgppaws.org</p>
            </div>
          </div>`
          )
          .join("")}
      </div>
    </section>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>KGP PAWS — QR print sheet</title>
<style>
  :root { --forest: #173F35; --terracotta: #C96745; --cream: #F7F1E7; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, "Segoe UI", Manrope, sans-serif; background: #eee; color: #202421; }
  .sheet {
    background: white;
    width: 210mm; height: 297mm;
    margin: 12mm auto; padding: 15mm;
    display: flex; align-items: center; justify-content: center;
    page-break-after: always;
  }
  .grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(4, 1fr); gap: 8mm; width: 100%; height: 100%; }
  .tag {
    border: 1px dashed rgba(0,0,0,0.15);
    border-radius: 6mm;
    display: flex; align-items: center; padding: 6mm; gap: 6mm;
  }
  .tag img { width: 45mm; height: 45mm; }
  .meta { flex: 1; }
  .name { font-family: "Fraunces", Georgia, serif; font-size: 15pt; color: var(--forest); font-weight: 600; }
  .pid  { font-size: 10pt; color: #666; margin-top: 2mm; letter-spacing: 0.05em; }
  .brand { font-size: 8pt; color: var(--terracotta); margin-top: 4mm; letter-spacing: 0.1em; text-transform: uppercase; }
  @media print {
    body { background: white; }
    .sheet { margin: 0; box-shadow: none; }
    @page { size: A4; margin: 0; }
  }
  .print-cta {
    position: fixed; top: 12px; right: 12px; z-index: 10;
    padding: 8px 16px; background: var(--forest); color: white;
    border: 0; border-radius: 999px; font-weight: 600; cursor: pointer;
  }
  @media print { .print-cta { display: none; } }
</style>
</head>
<body>
<button class="print-cta" onclick="window.print()">Print sheet</button>
${pageMarkup}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]!);
}
