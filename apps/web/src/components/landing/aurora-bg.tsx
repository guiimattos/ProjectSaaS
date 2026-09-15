"use client";

import Aurora from "@/components/reactbits/Aurora/Aurora";

export default function AuroraBg() {
  return (
    <div className="hero-bg" aria-hidden="true">
      <Aurora colorStops={["#2563eb", "#7c3aed", "#ea580c"]} amplitude={1} blend={0.5} speed={0.5} />
    </div>
  );
}
