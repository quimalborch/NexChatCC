import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    if (request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) 
    {
        return new Response("Unauthorized", {status: 401,});  
    }

    return NextResponse.json({ ok: true });
}