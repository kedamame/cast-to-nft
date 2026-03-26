import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event } = body;

  switch (event) {
    case "miniapp_added":
      console.log("MiniApp added by user");
      break;
    case "miniapp_removed":
      console.log("MiniApp removed by user");
      break;
    case "notifications_enabled":
      console.log("Notifications enabled, token:", body.token);
      break;
    case "notifications_disabled":
      console.log("Notifications disabled");
      break;
  }

  return NextResponse.json({ success: true });
}
