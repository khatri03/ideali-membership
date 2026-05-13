import { useEffect, useState } from "react";

export function useNavVisibility() {
  const [isNavVisible, setIsNavVisible] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 1024,
  );

  useEffect(() => {
    let timeoutId: number | undefined;
    const sync = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setIsNavVisible(window.innerWidth >= 1024), 100);
    };
    window.addEventListener("resize", sync);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return { isNavVisible, setIsNavVisible };
}
