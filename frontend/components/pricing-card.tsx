"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaHref?: string;
  isPopular?: boolean;
  isEnterprise?: boolean;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  ctaText,
  ctaHref = "#",
  isPopular = false,
  isEnterprise = false,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-card p-8 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]",
        isPopular
          ? "border-primary shadow-primary/20 ring-2 ring-primary/50"
          : "border-border hover:border-primary/50",
      )}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
            Popular
          </span>
        </div>
      )}

      {/* Plan Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-foreground">{price}</span>
          {period && (
            <span className="text-sm text-muted-foreground">/{period}</span>
          )}
        </div>
        {isEnterprise && (
          <p className="text-xs text-muted-foreground mt-1">
            Contact for pricing
          </p>
        )}
      </div>

      {/* CTA Button */}
      <a href={ctaHref} className="block mb-6">
        <Button
          className={cn(
            "w-full font-semibold transition-all duration-200",
            isPopular
              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl"
              : "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
          )}
          size="lg"
        >
          {ctaText}
        </Button>
      </a>

      {/* Features List */}
      <div className="space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              <div
                className={cn(
                  "rounded-full p-0.5",
                  isPopular ? "bg-primary/20" : "bg-accent",
                )}
              >
                <Check
                  className={cn(
                    "w-4 h-4",
                    isPopular ? "text-primary" : "text-muted-foreground",
                  )}
                />
              </div>
            </div>
            <span className="text-sm text-foreground leading-relaxed">
              {feature}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
