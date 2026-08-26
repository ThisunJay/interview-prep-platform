import { NextResponse } from "next/server";
import { getCategoriesForUser } from "@/lib/categories";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await getCategoriesForUser(session.userId);
  return NextResponse.json({ categories });
}
