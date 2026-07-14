import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "init", message: "Dashboard connected" });

      const i1 = setInterval(() => {
        send({
          type: "kpi",
          employees: { total: 245, active: 198, new: Math.floor(Math.random() * 5) },
          fleet: { total: 62, active: 54, maintenance: 3 },
          attendance: { today: 178, onTime: 156, late: 22 },
          fuel: { todayLitres: (Math.random() * 500 + 200).toFixed(1), monthTotal: 12450 },
        });
      }, 4000);

      const i2 = setInterval(() => {
        send({
          type: "chart",
          dailyRunning: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - i * 86400000).toLocaleDateString("en-US", { weekday: "short" }),
            km: Math.floor(Math.random() * 100 + 50),
            fuel: Math.floor(Math.random() * 20 + 10),
          })),
        });
      }, 7000);

      const i3 = setInterval(() => {
        send({
          type: "alert",
          severity: Math.random() > 0.7 ? "warning" : "info",
          message: Math.random() > 0.7 ? "Vehicle BX-4562 due for service" : "All systems nominal",
          timestamp: new Date().toLocaleTimeString(),
        });
      }, 10000);

      req.signal.addEventListener("abort", () => {
        clearInterval(i1);
        clearInterval(i2);
        clearInterval(i3);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
