import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-helpers";
import type { VehicleDashboardResponse, VehicleDashboardRow } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleNo = searchParams.get("vehicleNo");
    const monthRaw = searchParams.get("month");
    const yearRaw = searchParams.get("year");

    if (!vehicleNo) {
      return apiError(new Error("vehicleNo query parameter is required"), 400);
    }

    const now = new Date();
    const month = monthRaw !== null ? parseInt(monthRaw, 10) : now.getMonth();
    const year = yearRaw !== null ? parseInt(yearRaw, 10) : now.getFullYear();

    if (isNaN(month) || month < 0 || month > 11) {
      return apiError(new Error("month must be 0-11"), 400);
    }
    if (isNaN(year) || year < 2000 || year > 2100) {
      return apiError(new Error("year out of range"), 400);
    }

    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    const daysInMonth = endDate.getUTCDate();

    const [runningLogs, fuelTransactions, vehicle] = await Promise.all([
      prisma.dailyRunningLog.findMany({
        where: { vehicleNo, date: { gte: startDate, lte: endDate } },
        orderBy: { date: "asc" },
      }),
      prisma.fuelTransaction.findMany({
        where: { vehicleNo, date: { gte: startDate, lte: endDate } },
        orderBy: { date: "asc" },
      }),
      prisma.vehicle.findUnique({
        where: { vehicleNo },
        select: { vehicleNo: true, vehicleType: true },
      }),
    ]);

    const dailyData: VehicleDashboardRow[] = Array.from(
      { length: daysInMonth },
      (_, i) => {
        const day = i + 1;
        const dayLogs = runningLogs.filter(
          (log) => log.date.getUTCDate() === day
        );
        const dayFuel = fuelTransactions.filter(
          (txn) => txn.date.getUTCDate() === day
        );

        const totalKm =
          dayLogs.length > 0
            ? dayLogs.reduce((s, l) => s + Number(l.totalKm), 0)
            : null;

        const onMeter =
          dayLogs.length > 0 ? Number(dayLogs[0].onMeterReading) : null;

        const endMeter =
          dayLogs.length > 0
            ? Number(dayLogs[dayLogs.length - 1].endMeterReading)
            : null;

        const fuelSpent =
          dayFuel.length > 0
            ? dayFuel.reduce((s, t) => s + Number(t.amount), 0)
            : null;

        const fuelLiters =
          dayFuel.length > 0
            ? dayFuel.reduce((s, t) => s + Number(t.liters), 0)
            : null;

        return { day, onMeter, endMeter, totalKm, fuelSpent, fuelLiters };
      }
    );

    const response: VehicleDashboardResponse = {
      vehicleNo: vehicle?.vehicleNo ?? vehicleNo,
      vehicleType: vehicle?.vehicleType ?? null,
      month,
      year,
      dailyData,
    };

    return apiSuccess(response);
  } catch (error) {
    return apiError(error);
  }
}
