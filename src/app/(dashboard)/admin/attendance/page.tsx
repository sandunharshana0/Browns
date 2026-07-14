"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Staff Attendance</h1>
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Attendance management module — bulk daily logging via tabular calendar grid. API ready at <code className="rounded bg-muted px-1">/api/attendance/bulk</code>.</p>
        </CardContent>
      </Card>
    </div>
  );
}
