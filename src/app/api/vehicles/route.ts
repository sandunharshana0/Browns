import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        driver: { select: { nameWithInitials: true, contactNo: true } },
      },
      orderBy: { vehicleNo: "asc" },
    });
    return apiSuccess(vehicles);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const vehicle = await prisma.vehicle.create({ data: body });
    return apiSuccess(vehicle, 201);
  } catch (error) {
    return apiError(error);
  }
}
