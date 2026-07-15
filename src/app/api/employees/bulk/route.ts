import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-helpers";
import type { EmployeeCategory, ProjectPosition, EmployeeStatus } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const records = await request.json();

    if (!Array.isArray(records)) {
      return NextResponse.json(
        { error: "Payload must be an array of employee records" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let count = 0;

      for (const record of records) {
        // Double check required fields
        if (!record.idNo || !record.fullName || !record.nameWithInitials) {
          continue;
        }

        // Validate projectCode if provided
        let validatedProjectCode: string | null = null;
        if (record.projectCode) {
          const project = await tx.project.findUnique({
            where: { code: record.projectCode },
            select: { code: true },
          });
          if (project) {
            validatedProjectCode = project.code;
          }
        }

        // Clean values
        const category = record.category as EmployeeCategory;
        const projectPosition = record.projectPosition as ProjectPosition;
        const status = (record.status || "ACTIVE") as EmployeeStatus;
        const appointmentDate = record.appointmentDate ? new Date(record.appointmentDate) : null;

        await tx.employee.upsert({
          where: { idNo: record.idNo },
          update: {
            category,
            teamName: record.teamName || null,
            region: record.region || "Default",
            nameWithInitials: record.nameWithInitials,
            fullName: record.fullName,
            projectPosition,
            address: record.address || null,
            designation: record.designation || null,
            contactNo: record.contactNo || null,
            status,
            projectCode: validatedProjectCode,
            appointmentDate,
            emergencyName: record.emergencyName || null,
            emergencyPhone: record.emergencyPhone || null,
          },
          create: {
            empNo: record.empNo || undefined,
            category,
            teamName: record.teamName || null,
            region: record.region || "Default",
            nameWithInitials: record.nameWithInitials,
            fullName: record.fullName,
            projectPosition,
            address: record.address || null,
            designation: record.designation || null,
            idNo: record.idNo,
            contactNo: record.contactNo || null,
            status,
            projectCode: validatedProjectCode,
            appointmentDate,
            emergencyName: record.emergencyName || null,
            emergencyPhone: record.emergencyPhone || null,
          },
        });

        count++;
      }

      return { count };
    });

    return NextResponse.json(
      { count: result.count, message: `${result.count} employees successfully imported/synced` },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
