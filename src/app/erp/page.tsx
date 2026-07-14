"use client";

import { useCallback, useEffect, useState } from "react";

const features = [
  {
    title: "Manufacturing Execution System",
    description: "Monitor and control production on the shop floor with real-time data to improve quality, efficiency, and traceability.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80",
  },
  {
    title: "Supply Chain Management",
    description: "Plan, execute, and monitor the flow of goods, services, and information across the supply chain to optimize efficiency, cost, and customer satisfaction.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80",
  },
  {
    title: "Procurement",
    description: "Streamline the strategic sourcing and purchasing of goods and services across the organization to reduce costs, improve supply chain efficiency, and reduce your carbon footprint.",
    image: "https://images.unsplash.com/photo-1566576912328-1097e6e2e0c0?w=600&q=80",
  },
  {
    title: "Finance",
    description: "Manage financial operations, including accounting, budgeting, and forecasting, to support informed strategic decisions.",
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80",
  },
];

const services = [
  {
    title: "IFS Success",
    description: "Maximize the value of your ERP investment with IFS Success, which provides tailored plans, proactive guidance, and measurable outcomes.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
  },
  {
    title: "IFS Cloud Services",
    description: "Ensure seamless implementation and ongoing support with IFS Cloud Services, offering expert management and maintenance to keep your ERP environment optimized.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
  },
  {
    title: "IFS Consulting Services",
    description: "Transform your business with IFS Consulting Services, which provides expert guidance and support to help you achieve your ERP goals and drive long-term success.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
  },
  {
    title: "IFS Support Services",
    description: "Get the support you need to keep your ERP system running smoothly with IFS Support Services, offering comprehensive assistance and proactive maintenance.",
    image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80",
  },
];

const benefits = [
  {
    title: "Industry-Specific Capabilities",
    description: "IFS Cloud ERP delivers industry-specific capabilities tailored to the unique needs of asset-intensive and mission-critical sectors with built-in best practices.",
    icon: (
      <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    title: "Manufacturing Scheduling Optimization",
    description: "IFS Cloud ERP includes advanced manufacturing scheduling optimization, enabling production teams to create accurate, resource-aware plans.",
    icon: (
      <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    title: "Real-Time Data and Analytics",
    description: "IFS Cloud ERP delivers real-time data and analytics that empower industrial enterprises to make strategic decisions with confidence.",
    icon: (
      <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const trustedItems = [
  { title: "IFS Named Gartner Customers' Choice for Cloud ERP", source: "Gartner", image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&q=80" },
  { title: "Forrester Total Economic Impact Study: IFS Cloud", source: "Forrester", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80" },
  { title: "IFS named a Leader in two IDC MarketScape 2024-2025", source: "IDC", image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80" },
];

const insights = [
  { title: "5 ways your Manufacturing ERP might be setting you on a road to nowhere", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80" },
  { title: "The Shift to Composable Business Applications and Industrial AI", image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80" },
  { title: "Leading with AI: A Guide to Future Industry Success", image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80" },
  { title: "The CIO's Guide to Legacy ERP Modernization", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80" },
];

const faqs = [
  { q: "What is ERP for Manufacturing?", a: "Manufacturing ERP is enterprise software tailored to production environments, integrating functions like production planning and scheduling, inventory and procurement, quality, maintenance and compliance." },
  { q: "What is an ERP System?", a: "An ERP (Enterprise Resource Planning) system is software that integrates core business functions—finance, HR, supply chain, manufacturing—into a single platform. It improves efficiency, data accuracy, and decision-making." },
  { q: "What is ERP Software for Automotive?", a: "Automotive ERP software integrates production, inventory, quality, and compliance processes for vehicle manufacturers and suppliers. It supports lean manufacturing and traceability." },
  { q: "What is ERP for the Chemical Industry?", a: "ERP for the chemical industry manages compliance, batch production, quality control, and hazardous materials. It supports safety, traceability, and operational efficiency." },
];

function SectionHeading({ label, subtitle }: { label: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10 md:mb-16">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e3a5f]">{label}</h2>
      {subtitle && <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-sm sm:text-base">{subtitle}</p>}
    </div>
  );
}

export default function ERPPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [realtime, setRealtime] = useState({
    activeUsers: 0,
    todayTransactions: 0,
    pendingApprovals: 0,
    systemUptime: "99.97%",
    lastUpdated: new Date().toLocaleTimeString(),
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      eventSource = new EventSource("/api/erp/realtime");

      eventSource.onopen = () => setConnected(true);

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "summary") {
            setRealtime({
              activeUsers: data.activeUsers ?? 0,
              todayTransactions: data.todayTransactions ?? 0,
              pendingApprovals: data.pendingApprovals ?? 0,
              systemUptime: data.systemUptime ?? "99.97%",
              lastUpdated: data.lastUpdated ?? new Date().toLocaleTimeString(),
            });
          }
        } catch { }
      };

      eventSource.onerror = () => {
        setConnected(false);
        eventSource?.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  const exportToExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(features.map((f, i) => ({ "#": i + 1, Feature: f.title, Description: f.description }))), "Features");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(services.map((s, i) => ({ "#": i + 1, Service: s.title, Description: s.description }))), "Services");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(benefits.map((b, i) => ({ "#": i + 1, Benefit: b.title, Description: b.description }))), "Benefits");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(insights.map((ins, i) => ({ "#": i + 1, Title: ins.title }))), "Insights");
    XLSX.writeFile(wb, "Browns_ERP_Solution.xlsx");
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ========== HERO ========== */}
      <section className="relative bg-gradient-to-br from-[#0a1628] via-[#0f1f3d] to-[#1a2d5a] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 right-10 sm:top-20 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 sm:bottom-20 sm:left-20 w-48 h-48 sm:w-80 sm:h-80 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="order-2 md:order-1">
              <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mb-4 md:mb-6 flex-wrap">
                <a href="/" className="hover:text-white transition-colors">Home</a>
                <span>/</span>
                <a href="/products" className="hover:text-white transition-colors">Products</a>
                <span>/</span>
                <span className="text-white">ERP</span>
              </nav>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 md:mb-6">
                Enterprise Resource Planning for Industrial Operations
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 md:mb-8 leading-relaxed">
                Strengthen operational control, increase agility, and future-proof growth with Browns Cloud ERP.
                Purpose-built for industrial enterprises with embedded AI to empower confident, data-backed decisions.
              </p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                <button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base">
                  Book a demo
                </button>
                <button className="border-2 border-white/30 hover:border-white text-white px-6 md:px-8 py-2.5 md:py-3 rounded-lg font-semibold transition-colors text-sm md:text-base">
                  Contact Us
                </button>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
                alt="ERP Hero"
                className="rounded-xl shadow-2xl w-full h-auto object-cover max-h-[300px] sm:max-h-[400px] md:max-h-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========== LIVE SUMMARY BAR ========== */}
      <section className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 md:gap-6 overflow-x-auto text-xs sm:text-sm pb-1 sm:pb-0 scrollbar-hide">
              <span className="flex items-center gap-1.5 shrink-0">
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"} `} />
                <span className="text-gray-500 text-xs">{connected ? "Live" : "Reconnecting..."}</span>
              </span>
              <span className="hidden sm:flex items-center gap-1.5 shrink-0 text-gray-700 font-medium">
                <span className="text-blue-600 font-bold">{realtime.activeUsers}</span> Active Users
              </span>
              <span className="hidden xs:flex items-center gap-1.5 shrink-0 text-gray-700 font-medium">
                <span className="text-blue-600 font-bold">{realtime.todayTransactions}</span> Transactions
              </span>
              <span className="flex items-center gap-1.5 shrink-0 text-gray-700 font-medium">
                <span className="text-blue-600 font-bold">{realtime.pendingApprovals}</span> Pending
              </span>
              <span className="items-center gap-1.5 shrink-0 text-gray-700 font-medium hidden lg:flex">
                <span className="text-green-600 font-bold">{realtime.systemUptime}</span> Uptime
              </span>
            </div>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 sm:gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shrink-0"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">Export to Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========== WHY CHOOSE ========== */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Why Choose Browns Enterprise Resource Planning (ERP)" />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white p-5 sm:p-6 md:p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="mb-3 md:mb-4">{b.icon}</div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#1e3a5f] mb-2 md:mb-4">{b.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="ERP Features That Drive Results" subtitle="Comprehensive features designed to streamline your industrial operations" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((f, i) => (
              <div key={i} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                <div className="relative h-36 sm:h-40 md:h-48 overflow-hidden">
                  <img src={f.image} alt={f.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[#1e3a5f] mb-2 md:mb-3">{f.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-3">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SERVICES ========== */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Services to Maximize ERP Success" subtitle="Comprehensive services to ensure your ERP implementation delivers maximum value" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {services.map((s, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="relative h-28 sm:h-32 md:h-40 overflow-hidden">
                  <img src={s.image} alt={s.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-[#1e3a5f] mb-1 md:mb-2">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TRUSTED BY ========== */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Trusted by Industry Leaders" />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {trustedItems.map((item, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="h-32 sm:h-36 md:h-48 overflow-hidden">
                  <img src={item.image} alt={item.source} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 sm:p-5 md:p-6">
                  <p className="text-xs sm:text-sm text-[#3b82f6] font-semibold mb-1 md:mb-2">{item.source}</p>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-[#1e3a5f]">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== KNOWLEDGE HUB ========== */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="What's Shaping the Future of ERP" subtitle="Stay informed with the latest insights, trends, and thought leadership" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {insights.map((ins, i) => (
              <div key={i} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                <div className="h-28 sm:h-32 md:h-40 overflow-hidden">
                  <img src={ins.image} alt={ins.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3 sm:p-4 md:p-5">
                  <h3 className="text-xs sm:text-sm font-semibold text-[#1e3a5f] leading-relaxed">{ins.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading label="Frequently Asked Questions" />
          <div className="space-y-3 md:space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-gray-50 transition-colors gap-3"
                >
                  <span className="text-sm sm:text-base font-semibold text-[#1e3a5f]">{faq.q}</span>
                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-4 md:px-5 pb-4 md:pb-5 text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-[#0a1628] text-gray-400 py-10 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8 mb-8 md:mb-12">
            <div className="col-span-2 sm:col-span-3 md:col-span-1">
              <h3 className="text-white text-lg font-bold mb-3 md:mb-4">Browns ERP</h3>
              <p className="text-xs sm:text-sm">Industrial AI that matters.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2 md:mb-4 text-sm">Industries</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs sm:text-sm">
                <li>Aerospace & Defence</li>
                <li>Energy & Resources</li>
                <li>Construction</li>
                <li>Manufacturing</li>
                <li>Transportation</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2 md:mb-4 text-sm">Products</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs sm:text-sm">
                <li>Cloud ERP</li>
                <li>Asset Management</li>
                <li>Field Service</li>
                <li>Supply Chain</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2 md:mb-4 text-sm">Company</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs sm:text-sm">
                <li>About</li>
                <li>Careers</li>
                <li>News</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-2 md:mb-4 text-sm">Legal</h4>
              <ul className="space-y-1.5 md:space-y-2 text-xs sm:text-sm">
                <li>Privacy</li>
                <li>Terms</li>
                <li>Cookies</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 md:pt-8 text-xs sm:text-sm text-gray-500 text-center">
            &copy; 2026 Browns Engineering. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
