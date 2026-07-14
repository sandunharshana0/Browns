import { z } from "zod/v4"

export const bulkAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  projectCode: z.string().min(1, "Project code is required"),
  region: z.string().min(1, "Region is required"),
  client: z.enum(["DIALOG", "MOBITEL", "SLT"]).optional(),
  records: z
    .array(
      z.object({
        employeeNo: z.string().uuid("Invalid employee UUID"),
        teamLeaderName: z.string().optional(),
        status: z.enum(["PRESENT", "LEAVE", "DAY_OFF"]),
      })
    )
    .min(1, "At least one attendance record is required"),
})

export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>

export const runningLogSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    vehicleNo: z.string().min(1, "Vehicle number is required"),
    onMeterReading: z.number().positive("On-meter must be positive"),
    endMeterReading: z.number().positive("End-meter must be positive"),
    reason: z.string().optional(),
    fuelMeter: z.number().positive().optional(),
  })
  .refine((d) => d.endMeterReading > d.onMeterReading, {
    message: "End meter must exceed on-meter reading",
    path: ["endMeterReading"],
  })

export type RunningLogInput = z.infer<typeof runningLogSchema>

export const fuelTransactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  vehicleNo: z.string().min(1, "Vehicle number is required"),
  fuelCardNo: z.string().optional(),
  meterReading: z.number().positive("Meter reading must be positive"),
  literPrice: z.number().positive("Liter price must be positive"),
  liters: z.number().positive("Liters must be positive"),
  target: z.string().optional(),
  targetMeter: z.number().positive().optional(),
  runningStatus: z.string().optional(),
})

export type FuelTransactionInput = z.infer<typeof fuelTransactionSchema>
