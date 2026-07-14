"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeamsPlanPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Daily Teams Plan & Field Progress</h1>
      <Card>
        <CardHeader>
          <CardTitle>Field Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Supervisors log daily plans and actual work completion. Mobile-responsive form with reason-for-non-completion dropdown.</p>
        </CardContent>
      </Card>
    </div>
  );
}
