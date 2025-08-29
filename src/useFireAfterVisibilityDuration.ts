import { useEffect, useRef } from "react";

import { PackageConfig } from "./log";

function getTimeDifferenceSince(lastTimestamp: undefined | number) {
  if (lastTimestamp === undefined) {
    const now = new Date();
    return {
      difference: 0,
      fromDate: now,
      tillDate: now
    };
  } else {
    const fromDate = new Date(lastTimestamp);
    const tillDate = new Date();
    const difference = tillDate.getTime() - fromDate.getTime();
    return {
      difference,
      fromDate,
      tillDate
    };
  }
}

export function useFireAfterVisibilityDuration(
  isVisible: boolean,
  fire: () => void,
  time: number,
  condition: boolean = true
) {
  const duration = useRef<number>(0);
  const lastTimestamp = useRef<number | undefined>(undefined);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (condition) {
      const { difference, tillDate } = getTimeDifferenceSince(
        lastTimestamp.current
      );
      duration.current += difference;
      const time_remaining = time - duration.current;

      if (isVisible) {
        lastTimestamp.current = tillDate.getTime();
        if (time_remaining >= 0) {
          timeout = setTimeout(fire, time_remaining);
        }
      } else {
        lastTimestamp.current = undefined;
      }

      if (PackageConfig.logging) {
        console.log(
          "useEffect useFireAfterVisibilityDuration active:",
          condition,
          "visible: ",
          isVisible,
          time,
          time - duration.current,
          "remaining: ",
          time_remaining
        );
      }
    } else {
      duration.current = 0;
      lastTimestamp.current = undefined;
    }

    return () => clearTimeout(timeout);
  }, [condition, isVisible, time, fire]);

  return {
    duration
  };
}
