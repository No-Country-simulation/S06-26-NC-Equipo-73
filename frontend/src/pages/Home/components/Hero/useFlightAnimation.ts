import { useState, useEffect, useCallback } from "react";
import {
  predefinedRoutes,
  generateBezierPath,
  type FlightRoute,
} from "./Hero/flightRoutes";

export type BezierPoints = {
  x0: number; y0: number;
  cx1: number; cy1: number;
  cx2: number; cy2: number;
  x1: number; y1: number;
};

export type PlaneState = {
  id: number;
  route: FlightRoute;
  path: string;
  bp: BezierPoints;
  progress: number;
  duration: number;
  waiting: boolean;
  waitEndTime: number;
  startTime: number;
  now: number;
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickRandomRoute(): FlightRoute {
  return predefinedRoutes[
    Math.floor(Math.random() * predefinedRoutes.length)
  ];
}

function pathToBezierPoints(path: string): BezierPoints {
  const parts = path.replace(/[MC]/g, "").trim().split(/,\s*|\s+/);
  const nums = parts.map(Number);
  return {
    x0: nums[0], y0: nums[1],
    cx1: nums[2], cy1: nums[3],
    cx2: nums[4], cy2: nums[5],
    x1: nums[6], y1: nums[7],
  };
}

function getPointOnCubicBezier(
  bp: BezierPoints,
  t: number
): { x: number; y: number } {
  const { x0, y0, cx1, cy1, cx2, cy2, x1, y1 } = bp;
  const mt = 1 - t;
  const x =
    mt * mt * mt * x0 +
    3 * mt * mt * t * cx1 +
    3 * mt * t * t * cx2 +
    t * t * t * x1;
  const y =
    mt * mt * mt * y0 +
    3 * mt * mt * t * cy1 +
    3 * mt * t * t * cy2 +
    t * t * t * y1;
  return { x, y };
}

function getTangentOnCubicBezier(
  bp: BezierPoints,
  t: number
): { angle: number } {
  const { x0, y0, cx1, cy1, cx2, cy2, x1, y1 } = bp;
  const mt = 1 - t;
  const dx =
    3 * mt * mt * (cx1 - x0) +
    6 * mt * t * (cx2 - cx1) +
    3 * t * t * (x1 - cx2);
  const dy =
    3 * mt * mt * (cy1 - y0) +
    6 * mt * t * (cy2 - cy1) +
    3 * t * t * (y1 - cy2);
  return { angle: Math.atan2(dy, dx) * (180 / Math.PI) };
}

export function useFlightAnimation(numPlanes: number = 4) {
  const [planes, setPlanes] = useState<PlaneState[]>(() => {
    const now = Date.now();
    return Array.from({ length: numPlanes }, (_, i) => {
      const route = pickRandomRoute();
      const path = generateBezierPath(
        route.from,
        route.to,
        randomBetween(0.12, 0.28)
      );
      return {
        id: i,
        route,
        path,
        bp: pathToBezierPoints(path),
        progress: Math.random(),
        duration: randomBetween(6000, 14000),
        waiting: false,
        waitEndTime: 0,
        startTime: now - Math.random() * 10000,
        now,
      };
    });
  });

  const tick = useCallback(() => {
    const now = Date.now();

    setPlanes((current) =>
      current.map((plane) => {
        if (plane.waiting) {
          if (now >= plane.waitEndTime) {
            const newRoute = pickRandomRoute();
            const newPath = generateBezierPath(
              newRoute.from,
              newRoute.to,
              randomBetween(0.12, 0.28)
            );
            return {
              ...plane,
              route: newRoute,
              path: newPath,
              bp: pathToBezierPoints(newPath),
              progress: 0,
              waiting: false,
              duration: randomBetween(6000, 14000),
              startTime: now,
              now,
            };
          }
          return { ...plane, now };
        }

        const elapsed = now - plane.startTime;
        const rawProgress = elapsed / plane.duration;
        const progress = Math.min(rawProgress, 1);

        if (progress >= 1) {
          return {
            ...plane,
            progress: 1,
            waiting: true,
            waitEndTime: now + randomBetween(300, 1200),
            now,
          };
        }

        return { ...plane, progress, now };
      })
    );
  }, []);

  useEffect(() => {
    let rafId: number;
    function loop() {
      tick();
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [tick]);

  const planePositions = planes.map((plane) => {
    const pos = getPointOnCubicBezier(plane.bp, plane.progress);
    const tangent = getTangentOnCubicBezier(plane.bp, plane.progress);
    return { ...plane, ...pos, angle: tangent.angle };
  });

  return { planePositions };
}
