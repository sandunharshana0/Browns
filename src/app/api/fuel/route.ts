import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const transactions = await prisma.fuelTransaction.findMany({
      include: { vehicle: { select: { vehicleNo: true, vehicleType: true } } },
      orderBy: { date: "desc" },
      take: 100,
    });
    return apiSuccess(transactions);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const amount = body.literPrice * body.liters;

    const transaction = await prisma.fuelTransaction.create({
      data: {
        date: new Date(body.date),
        vehicleNo: body.vehicleNo,
        fuelCardNo: body.fuelCardNo,
        meterReading: body.meterReading,
        literPrice: body.literPrice,
        liters: body.liters,
        amount,
        target: body.target,
        targetMeter: body.targetMeter,
        runningStatus: body.runningStatus,
      },
    });
    return apiSuccess(transaction, 201);
  } catch (error) {
    return apiError(error);
  }
}
