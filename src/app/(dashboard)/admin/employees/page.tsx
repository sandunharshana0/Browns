"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmployeePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Staff Employee Master</h1>
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Employee management module — coming soon with full CRUD, CSV import, and search.</p>
        </CardContent>
      </Card>
    </div>
  );
}
