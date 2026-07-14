import { NextResponse } from "next/server";

export function apiError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}
