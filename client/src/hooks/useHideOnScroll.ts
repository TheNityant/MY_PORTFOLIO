import { useEffect, useState } from "react";

export function useHideOnScroll(threshold = 50) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let previous = window.scrollY;

    const onScroll = () => {
      const current = window.scrollY;
      if (current < threshold) {
        setVisible(true);
      } else if (current > previous) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      previous = current;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return visible;
}
