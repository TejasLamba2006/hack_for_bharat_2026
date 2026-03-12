"use client";

import { PricingCard } from "@/components/pricing-card";
import { PricingTable } from "@/components/pricing-table";
import { FileText, Upload, MessageCircle, Settings } from "lucide-react";
import Link from "next/link";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For students and personal use",
    features: [
      "Upload up to 10 documents",
      "Basic semantic search",
      "Standard citations",
      "Community support",
    ],
    ctaText: "Get Started",
    ctaHref: "/",
  },
  {
    name: "Starter",
    price: "$5",
    period: "month",
    description: "For individuals",
    features: [
      "Upload up to 100 documents",
      "Faster indexing",
      "Citation-based answers",
      "Multi-format support",
      "Email support",
    ],
    ctaText: "Get Starter",
    ctaHref: "/",
  },
  {
    name: "Pro",
    price: "$15",
    period: "month",
    description: "For researchers and teams",
    features: [
      "Unlimited documents",
      "Real-time indexing",
      "Advanced semantic retrieval",
      "Priority processing",
      "API access",
      "Team collaboration",
      "Priority support",
    ],
    ctaText: "Get Pro",
    ctaHref: "/",
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations",
    features: [
      "Private deployment",
      "Role-based access control",
      "Dedicated infrastructure",
      "Custom integrations",
      "99.9% SLA",
      "Dedicated account manager",
      "24/7 Priority support",
    ],
    ctaText: "Contact Sales",
    ctaHref: "/admin",
    isEnterprise: true,
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-sidebar text-sidebar-foreground sticky top-0 z-40 backdrop-blur-sm bg-sidebar/95">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sidebar-accent rounded-lg">
              <FileText className="w-5 h-5 text-sidebar-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">DocSearch</h1>
              <p className="text-xs text-sidebar-foreground/70">
                Document Q&A with Smart Citations
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
            Choose the right plan for{" "}
            <span className="text-primary">your needs</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Start with our free tier and scale as you grow. All plans include
            our powerful AI-driven document search and citation engine.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingPlans.map((plan, index) => (
              <PricingCard key={index} {...plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <PricingTable />
        </div>
      </section>

      {/* FAQ / Trust Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-accent/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Frequently asked questions
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-muted-foreground">
                Yes, you can change your plan at any time. Upgrades take effect
                immediately, and downgrades at the end of your billing cycle.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground">
                We accept all major credit cards, PayPal, and wire transfers for
                Enterprise plans.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                Is there a free trial for paid plans?
              </h3>
              <p className="text-muted-foreground">
                Yes, all paid plans come with a 14-day free trial. No credit
                card required to start.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                What happens to my data if I cancel?
              </h3>
              <p className="text-muted-foreground">
                You'll have 30 days to export your data before it's permanently
                deleted. We never sell or share your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/30 p-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of researchers, students, and teams using DocSearch
              to unlock insights from their documents.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start for free
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-200"
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 DocSearch. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
