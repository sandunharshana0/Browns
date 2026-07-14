"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UtilityBillsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Utility Bills Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Fixed Infrastructure Costs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Electricity and water bill tracking per project code, linked to responsible engineers and petty cash module.</p>
        </CardContent>
      </Card>
    </div>
  );
}
