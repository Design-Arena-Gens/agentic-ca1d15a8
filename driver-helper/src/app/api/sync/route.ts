import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

interface IncomingSyncItem {
  id?: number;
  entity: string;
  operation: string;
  payload: Record<string, unknown>;
}

async function forwardToWebhook(items: IncomingSyncItem[]) {
  const url = process.env.CLOUD_SYNC_WEBHOOK_URL;
  if (!url) return null;

  const headers = new Headers({ "Content-Type": "application/json" });
  if (process.env.CLOUD_SYNC_WEBHOOK_TOKEN) {
    headers.set(
      "Authorization",
      `Bearer ${process.env.CLOUD_SYNC_WEBHOOK_TOKEN}`,
    );
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ source: "driver-helper", items }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Webhook sync failed");
  }

  return items.map((item) => item.id).filter(Boolean) as number[];
}

async function persistToSupabase(items: IncomingSyncItem[]) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const tableName = process.env.SUPABASE_SYNC_TABLE ?? "driver_helper_sync";

  const insertPayload = items.map((item) => ({
    entity: item.entity,
    operation: item.operation,
    payload: item.payload,
    queue_id: item.id ?? null,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from(tableName).insert(insertPayload);
  if (error) {
    throw new Error(error.message);
  }

  return items.map((item) => item.id).filter(Boolean) as number[];
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const items: IncomingSyncItem[] = Array.isArray(body?.items) ? body.items : [];

  if (!items.length) {
    return NextResponse.json({ syncedIds: [] });
  }

  try {
    let syncedIds =
      (await forwardToWebhook(items)) ?? (await persistToSupabase(items));

    if (!syncedIds) {
      // Fallback: respond success to allow queue clearance if no backend configured.
      syncedIds = items.map((item) => item.id).filter(Boolean) as number[];
    }

    return NextResponse.json({ syncedIds });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sync service unavailable";
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
