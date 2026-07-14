"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FuelPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Daily Fuel Logs & Transactions</h1>
      <Card>
        <CardHeader>
          <CardTitle>Fuel Transaction Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Real-time fuel transaction logging at pump stations with odometer cross-verification against daily running logs.</p>
        </CardContent>
      </Card>
    </div>
  );
}
