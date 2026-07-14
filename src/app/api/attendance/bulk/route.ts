import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { bulkAttendanceSchema } from "@/lib/validations";
import { apiError, apiSuccess } from "@/lib/api-helpers";
import type { AttendanceBulkResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = bulkAttendanceSchema.safeParse(body);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => {
        const pathStr = issue.path.length > 0 ? issue.path.join(".") : "root";
        return `[${pathStr}] ${issue.message}`;
      });
      return NextResponse.json(
        { error: "Validation failed", details },
        { status: 400 }
      );
    }

    const { date, projectCode, region, client, records } = parsed.data;
    const dateObj = new Date(date + "T00:00:00.000Z");

    const project = await prisma.project.findUnique({
      where: { code: projectCode },
      select: { code: true },
    });

    if (!project) {
      return apiError(new Error(`Project code "${projectCode}" not found`), 404);
    }

    const result: AttendanceBulkResponse = await prisma.$transaction(async (tx) => {
      const created: AttendanceBulkResponse["records"] = [];

      for (const record of records) {
        const employee = await tx.employee.findUnique({
          where: { empNo: record.employeeNo },
          select: { empNo: true, status: true },
        });

        if (!employee) {
          throw new Error(`Employee ${record.employeeNo} not found`);
        }

        if (employee.status !== "ACTIVE") {
          throw new Error(`Employee ${record.employeeNo} is inactive`);
        }

        const attendance = await tx.attendance.upsert({
          where: {
            date_employeeNo: { date: dateObj, employeeNo: record.employeeNo },
          },
          update: {
            status: record.status,
            teamLeaderName: record.teamLeaderName ?? null,
            projectCode,
            region,
            client: client ?? null,
          },
          create: {
            date: dateObj,
            projectCode,
            region,
            client: client ?? null,
            employeeNo: record.employeeNo,
            teamLeaderName: record.teamLeaderName ?? null,
            status: record.status,
          },
          select: { employeeNo: true, status: true },
        });

        created.push(attendance);
      }

      return { count: created.length, records: created };
    });

    return NextResponse.json(
      { data: result, message: `${result.count} attendance records processed` },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return apiError(new Error("Invalid JSON payload"), 400);
    }
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const projectCode = searchParams.get("projectCode");
    const employeeNo = searchParams.get("employeeNo");
    const region = searchParams.get("region");

    const where: Record<string, unknown> = {};
    if (date) where.date = new Date(date + "T00:00:00.000Z");
    if (projectCode) where.projectCode = projectCode;
    if (employeeNo) where.employeeNo = employeeNo;
    if (region) where.region = region;

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            nameWithInitials: true,
            fullName: true,
            teamName: true,
            projectPosition: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { employeeNo: "asc" }],
    });

    return apiSuccess(records);
  } catch (error) {
    return apiError(error);
  }
}
