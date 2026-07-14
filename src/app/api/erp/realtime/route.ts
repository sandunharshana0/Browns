import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      sendEvent({ type: "connected", message: "Real-time ERP feed connected" });

      const intervals: ReturnType<typeof setInterval>[] = [];

      const simInterval = setInterval(() => {
        sendEvent({
          type: "summary",
          activeUsers: Math.floor(Math.random() * 50) + 10,
          todayTransactions: Math.floor(Math.random() * 100) + 20,
          pendingApprovals: Math.floor(Math.random() * 15),
          systemUptime: "99.97%",
          lastUpdated: new Date().toLocaleTimeString(),
        });
      }, 5000);

      const metricInterval = setInterval(() => {
        sendEvent({
          type: "metrics",
          cpu: (Math.random() * 30 + 20).toFixed(1),
          memory: (Math.random() * 20 + 60).toFixed(1),
          requests: Math.floor(Math.random() * 500 + 1000),
        });
      }, 8000);

      intervals.push(simInterval, metricInterval);

      req.signal.addEventListener("abort", () => {
        intervals.forEach(clearInterval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
