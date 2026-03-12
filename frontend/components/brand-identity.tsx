import Image from "next/image";
import Link from "next/link";

type BrandIdentityProps = {
  subtitle?: string;
  className?: string;
};

export function BrandIdentity({
  subtitle = "Document Q&A with Smart Citations",
  className = "",
}: Readonly<BrandIdentityProps>) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-3 min-w-0 ${className}`.trim()}
      aria-label="DocSearch Home"
    >
      <Image
        src="/branding/logo.png"
        alt="DocSearch logo"
        width={52}
        height={52}
        className="h-11 w-11 shrink-0"
        priority
      />
      <div className="min-w-0">
        <Image
          src="/branding/logo-wordmark-transparent.png"
          alt="DocSearch wordmark"
          width={500}
          height={156}
          className="h-7 w-auto max-w-42.5 sm:max-w-52.5"
          priority
        />
        <p className="text-xs text-sidebar-foreground/70 truncate">
          {subtitle}
        </p>
      </div>
    </Link>
  );
}
