import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const records = await request.json();

    if (!Array.isArray(records)) {
      return NextResponse.json(
        { error: "Payload must be an array of daily running log records" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let count = 0;

      for (const record of records) {
        if (!record.vehicleNo || !record.date) {
          continue;
        }

        const dateObj = new Date(record.date + "T00:00:00.000Z");
        const vehicleNo = String(record.vehicleNo).trim().toUpperCase();

        // 1. Ensure vehicle exists in fleet registry. If not, auto-create it with default status/type.
        const vehicle = await tx.vehicle.findUnique({
          where: { vehicleNo },
          select: { vehicleNo: true },
        });

        if (!vehicle) {
          await tx.vehicle.create({
            data: {
              vehicleNo,
              vehicleType: "VAN",
              region: "Default",
              vehicleStatus: "ACTIVE",
            },
          });
        }

        // 2. Auto calculate totalKm if missing or zero
        const onMeter = Number(record.onMeterReading || 0);
        const endMeter = Number(record.endMeterReading || 0);
        let totalKm = Number(record.totalKm);
        if (!totalKm || totalKm <= 0) {
          totalKm = Math.max(0, endMeter - onMeter);
        }

        // 3. Upsert the daily running log
        await tx.dailyRunningLog.upsert({
          where: {
            date_vehicleNo: { date: dateObj, vehicleNo },
          },
          update: {
            onMeterReading: onMeter,
            endMeterReading: endMeter,
            totalKm: totalKm,
            reason: record.reason || null,
            fuelMeter: record.fuelMeter ? Number(record.fuelMeter) : null,
          },
          create: {
            date: dateObj,
            vehicleNo,
            onMeterReading: onMeter,
            endMeterReading: endMeter,
            totalKm: totalKm,
            reason: record.reason || null,
            fuelMeter: record.fuelMeter ? Number(record.fuelMeter) : null,
          },
        });

        count++;
      }

      return { count };
    });

    return NextResponse.json(
      { count: result.count, message: `${result.count} running logs successfully imported/synced` },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
