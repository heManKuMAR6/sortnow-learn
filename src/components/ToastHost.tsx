"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { AiIcon } from "@/components/AiIcon";
import type { ToastInput } from "@/lib/toast";

type Item = ToastInput & { id: number };

export function ToastHost() {
  const [items, setItems] = useState<Item[]>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    let next = 1;
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastInput>).detail;
      const id = next++;
      setItems((list) => [...list.slice(-2), { ...detail, id }]);
      window.setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), 5200);
    };
    window.addEventListener("sn:toast", onToast);
    return () => window.removeEventListener("sn:toast", onToast);
  }, []);

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            className="toast"
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: -18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {item.badge ? (
              <motion.span
                className="toast-badge"
                initial={reduce ? false : { scale: 0.4, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 16, delay: 0.1 }}
              >
                {item.badge}
              </motion.span>
            ) : null}
            <span className="toast-copy">
              <strong>{item.title}</strong>
              {item.body ? <span>{item.body}</span> : null}
            </span>
            {item.icon ? <AiIcon name={item.icon} size={22} className="toast-icon" /> : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
