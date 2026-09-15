import Link from "next/link";
import { Zap } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="TaskFlow — início">
      <span className="brand-mark"><Zap size={18} aria-hidden="true" /></span>
      TaskFlow
    </Link>
  );
}
