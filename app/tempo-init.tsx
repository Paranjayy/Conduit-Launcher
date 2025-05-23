"use client";
// Import the dev tools and initialize them
import { useEffect } from "react";

export function TempoInit() {
  useEffect(() => {
    const init = async () => {
      if (process.env.NEXT_PUBLIC_TEMPO) {
        try {
          const { TempoDevtools } = await import("tempo-devtools");
          TempoDevtools.init();
          console.log("Tempo devtools initialized");
        } catch (error) {
          console.warn("Tempo devtools not available:", error);
        }
      }
    };

    init();
  }, []);

  return null;
}
