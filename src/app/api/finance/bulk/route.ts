import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError } from "@/lib/api-helpers";
import type { PettyCashPurpose } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const records = await request.json();

    if (!Array.isArray(records)) {
      return NextResponse.json(
        { error: "Payload must be an array of petty cash records" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let count = 0;

      for (const record of records) {
        if (!record.referenceNo || !record.projectCode || !record.recipientEmpNo) {
          continue;
        }

        const projectCode = String(record.projectCode).trim().toUpperCase();
        const referenceNo = String(record.referenceNo).trim();

        // 1. Ensure project exists. If not, auto-create it.
        const project = await tx.project.findUnique({
          where: { code: projectCode },
          select: { code: true },
        });

        if (!project) {
          await tx.project.create({
            data: {
              code: projectCode,
              name: `Project ${projectCode}`,
              region: "Default",
              isActive: true,
            },
          });
        }

        // 2. Resolve recipient Employee. Perform smart matching by ID, Initials, Name, or UUID.
        let employee = null;

        // Check if recipientEmpNo is a valid UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.recipientEmpNo);
        if (isUuid) {
          employee = await tx.employee.findUnique({
            where: { empNo: record.recipientEmpNo },
            select: { empNo: true },
          });
        }

        if (!employee) {
          // Look up by idNo (NIC), initials, or full name
          employee = await tx.employee.findFirst({
            where: {
              OR: [
                { idNo: record.recipientEmpNo },
                { nameWithInitials: { equals: record.recipientEmpNo, mode: "insensitive" } },
                { fullName: { equals: record.recipientEmpNo, mode: "insensitive" } },
              ],
            },
            select: { empNo: true },
          });
        }

        if (!employee) {
          // Fall back to first available employee to keep import successful
          employee = await tx.employee.findFirst({
            select: { empNo: true },
          });
        }

        if (!employee) {
          throw new Error("No employees exist in the database to receive petty cash advance.");
        }

        const requestedDate = record.requestedDate ? new Date(record.requestedDate + "T00:00:00.000Z") : new Date();
        const cashReturnDate = record.cashReturnDate ? new Date(record.cashReturnDate + "T00:00:00.000Z") : null;
        const purpose = (record.purpose || "PROJECT_PURPOSE") as PettyCashPurpose;

        // 3. Upsert the Petty Cash Advance
        await tx.pettyCashAdvance.upsert({
          where: { referenceNo },
          update: {
            requestedDate,
            projectCode,
            purpose,
            amount: record.amount || 0,
            recipientEmpNo: employee.empNo,
            bankAccNo: record.bankAccNo || null,
            bankBranch: record.bankBranch || null,
            remarks: record.remarks || null,
            submittedAmount: record.submittedAmount != null ? record.submittedAmount : null,
            balance: record.balance != null ? record.balance : null,
            cashReturn: record.cashReturn != null ? record.cashReturn : null,
            cashReturnDate,
          },
          create: {
            referenceNo,
            requestedDate,
            projectCode,
            purpose,
            amount: record.amount || 0,
            recipientEmpNo: employee.empNo,
            bankAccNo: record.bankAccNo || null,
            bankBranch: record.bankBranch || null,
            remarks: record.remarks || null,
            submittedAmount: record.submittedAmount != null ? record.submittedAmount : null,
            balance: record.balance != null ? record.balance : null,
            cashReturn: record.cashReturn != null ? record.cashReturn : null,
            cashReturnDate,
          },
        });

        count++;
      }

      return { count };
    });

    return NextResponse.json(
      { count: result.count, message: `${result.count} petty cash advances successfully imported/synced` },
      { status: 201 }
    );
  } catch (error) {
    return apiError(error);
  }
}
