"use client";

import { Check, X } from "lucide-react";

interface FeatureRow {
  feature: string;
  free: boolean | string;
  starter: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

const features: FeatureRow[] = [
  {
    feature: "Documents limit",
    free: "10",
    starter: "100",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Multi-format support",
    free: true,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Citation-based answers",
    free: true,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Real-time indexing",
    free: false,
    starter: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: "API Access",
    free: false,
    starter: false,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Team access",
    free: false,
    starter: false,
    pro: true,
    enterprise: true,
  },
  {
    feature: "Private deployment",
    free: false,
    starter: false,
    pro: false,
    enterprise: true,
  },
  {
    feature: "Priority support",
    free: false,
    starter: false,
    pro: false,
    enterprise: true,
  },
  {
    feature: "Dedicated infrastructure",
    free: false,
    starter: false,
    pro: false,
    enterprise: true,
  },
];

function renderCell(value: boolean | string) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-foreground">{value}</span>;
  }

  return value ? (
    <div className="flex justify-center">
      <div className="rounded-full bg-primary/20 p-1">
        <Check className="w-4 h-4 text-primary" />
      </div>
    </div>
  ) : (
    <div className="flex justify-center">
      <X className="w-4 h-4 text-muted-foreground/40" />
    </div>
  );
}

export function PricingTable() {
  return (
    <div className="w-full">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          Compare plans
        </h2>
        <p className="text-muted-foreground">
          Everything you need to choose the right plan.
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-left">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Feature
                </span>
              </th>
              <th className="px-6 py-4 text-center">
                <span className="text-sm font-semibold text-foreground">
                  Free
                </span>
              </th>
              <th className="px-6 py-4 text-center">
                <span className="text-sm font-semibold text-foreground">
                  Starter
                </span>
              </th>
              <th className="px-6 py-4 text-center">
                <div className="inline-flex flex-col items-center gap-1">
                  <span className="text-sm font-semibold text-foreground">
                    Pro
                  </span>
                  <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                    Popular
                  </span>
                </div>
              </th>
              <th className="px-6 py-4 text-center">
                <span className="text-sm font-semibold text-foreground">
                  Enterprise
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((row, index) => (
              <tr
                key={index}
                className="border-b border-border/50 hover:bg-accent/30 transition-colors"
              >
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground font-medium">
                    {row.feature}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {renderCell(row.free)}
                </td>
                <td className="px-6 py-4 text-center">
                  {renderCell(row.starter)}
                </td>
                <td className="px-6 py-4 text-center bg-primary/5">
                  {renderCell(row.pro)}
                </td>
                <td className="px-6 py-4 text-center">
                  {renderCell(row.enterprise)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-6">
        {["free", "starter", "pro", "enterprise"].map((plan) => (
          <div
            key={plan}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground capitalize">
                {plan}
              </h3>
              {plan === "pro" && (
                <span className="inline-flex items-center rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                  Popular
                </span>
              )}
            </div>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-sm text-muted-foreground">
                    {feature.feature}
                  </span>
                  <div>
                    {renderCell(
                      feature[plan as keyof Omit<FeatureRow, "feature">],
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
