export interface WebVitalMetric {
  name: "CLS" | "FID" | "FCP" | "LCP" | "TTFB" | "INP";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
}

// Google's Core Web Vitals thresholds
// [good, needs-improvement] — above needs-improvement is poor
const THRESHOLDS: Record<WebVitalMetric["name"], [number, number]> = {
  CLS: [0.1, 0.25],
  FID: [100, 300],
  FCP: [1800, 3000],
  LCP: [2500, 4000],
  TTFB: [800, 1800],
  INP: [200, 500],
};

function rate(
  name: WebVitalMetric["name"],
  value: number,
): WebVitalMetric["rating"] {
  const [good, poor] = THRESHOLDS[name];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

function createMetric(
  name: WebVitalMetric["name"],
  value: number,
  delta: number,
): WebVitalMetric {
  return { name, value, rating: rate(name, value), delta };
}

function observePaint(
  name: "FCP",
  paintName: string,
  onReport: (metric: WebVitalMetric) => void,
): void {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === paintName) {
        observer.disconnect();
        onReport(createMetric(name, entry.startTime, entry.startTime));
      }
    }
  });

  try {
    observer.observe({ type: "paint", buffered: true });
  } catch {
    // PerformanceObserver not supported for this type
  }
}

function observeLCP(onReport: (metric: WebVitalMetric) => void): void {
  let lastEntry: PerformanceEntry | null = null;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    lastEntry = entries[entries.length - 1] ?? null;
  });

  try {
    observer.observe({ type: "largest-contentful-paint", buffered: true });
  } catch {
    return;
  }

  // LCP is finalized on page hide (user navigates away or tabs out)
  const reportFinal = () => {
    if (lastEntry) {
      observer.disconnect();
      onReport(
        createMetric("LCP", lastEntry.startTime, lastEntry.startTime),
      );
      lastEntry = null;
    }
  };

  addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") reportFinal();
  });
  addEventListener("pagehide", reportFinal);
}

function observeCLS(onReport: (metric: WebVitalMetric) => void): void {
  let clsValue = 0;
  let sessionValue = 0;
  let sessionEntries: PerformanceEntry[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as PerformanceEntry & {
        hadRecentInput: boolean;
        value: number;
      };

      if (layoutShift.hadRecentInput) continue;

      const firstEntry = sessionEntries[0];
      if (
        sessionEntries.length > 0 &&
        firstEntry &&
        entry.startTime - firstEntry.startTime < 5000 &&
        entry.startTime -
          (sessionEntries[sessionEntries.length - 1]?.startTime ?? 0) <
          1000
      ) {
        sessionValue += layoutShift.value;
        sessionEntries.push(entry);
      } else {
        sessionValue = layoutShift.value;
        sessionEntries = [entry];
      }

      if (sessionValue > clsValue) {
        clsValue = sessionValue;
      }
    }
  });

  try {
    observer.observe({ type: "layout-shift", buffered: true });
  } catch {
    return;
  }

  const reportFinal = () => {
    observer.disconnect();
    onReport(createMetric("CLS", clsValue, clsValue));
  };

  addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") reportFinal();
  });
  addEventListener("pagehide", reportFinal);
}

function observeTTFB(onReport: (metric: WebVitalMetric) => void): void {
  const observer = new PerformanceObserver((list) => {
    const nav = list.getEntries()[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      observer.disconnect();
      const ttfb = nav.responseStart - nav.requestStart;
      onReport(createMetric("TTFB", ttfb, ttfb));
    }
  });

  try {
    observer.observe({ type: "navigation", buffered: true });
  } catch {
    // fallback for browsers without buffered navigation
  }
}

function observeINP(onReport: (metric: WebVitalMetric) => void): void {
  let maxDuration = 0;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const eventEntry = entry as PerformanceEntry & {
        duration: number;
        interactionId?: number;
      };
      if (
        eventEntry.interactionId &&
        eventEntry.duration > maxDuration
      ) {
        maxDuration = eventEntry.duration;
      }
    }
  });

  try {
    observer.observe({ type: "event", buffered: true });
  } catch {
    return;
  }

  const reportFinal = () => {
    if (maxDuration > 0) {
      observer.disconnect();
      onReport(createMetric("INP", maxDuration, maxDuration));
    }
  };

  addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") reportFinal();
  });
  addEventListener("pagehide", reportFinal);
}

export function reportWebVitals(
  onReport: (metric: WebVitalMetric) => void,
): void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
    return;
  }

  const callback =
    process.env.NODE_ENV === "development"
      ? (metric: WebVitalMetric) => {
          // eslint-disable-next-line no-console
          console.log(
            `[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
          );
          onReport(metric);
        }
      : onReport;

  observePaint("FCP", "first-contentful-paint", callback);
  observeLCP(callback);
  observeCLS(callback);
  observeTTFB(callback);
  observeINP(callback);
}
