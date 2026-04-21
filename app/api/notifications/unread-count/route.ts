import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth";
import { getUnreadNotificationsCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unreadCount = await getUnreadNotificationsCount(profile.id);

  return NextResponse.json(
    { unreadCount },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
      }
    }
  );
}
