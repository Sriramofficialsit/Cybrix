"use client";
import { useEffect, useRef, useState } from "react";

const W = 1440;
const H = 880;

/** Live, non-interactive view of the real /dashboard inside a browser frame, scaled to fit. */
export function ProductFrame() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.72);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="pf">
      <div className="pf-bar"><i /><i /><i /><span>app.cyberthulir.com/dashboard</span></div>
      <div className="pf-view" ref={ref} style={{ height: H * scale }}>
        <iframe
          src="/dashboard"
          title="CyberThulir learner dashboard preview"
          tabIndex={-1}
          loading="lazy"
          style={{ width: W, height: H, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
