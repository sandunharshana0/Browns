"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PettyCashPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Petty Cash & Expense Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Cash Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Track corporate funding drawdowns, approvals, auto-calculated balances, and cash return reconciliations.</p>
        </CardContent>
      </Card>
    </div>
  );
}
