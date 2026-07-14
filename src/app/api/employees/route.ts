import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { nameWithInitials: "asc" },
    });
    return apiSuccess(employees);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const employee = await prisma.employee.create({ data: body });
    return apiSuccess(employee, 201);
  } catch (error) {
    return apiError(error);
  }
}
