// app/hooks/useSlotSelection.js
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import api from "@/api/axios";
import {
  slotKeyToUtcIso,
  addOneHourSlotKey,
  utcToIst,
  utcIsoToIstLabel,
} from "@/utils/timezone";

export const useSlotSelection = (resourceId, noOfDays = 14) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [resource, setResource] = useState(null);
  const [error, setError] = useState("");
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [startSlot, setStartSlot] = useState(null);
  const [endSlot, setEndSlot] = useState(null);
  const abortRef = useRef(null);

  const fetchSchedule = useCallback(async () => {
    if (!resourceId) return;
    setError("");
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await api.get(`resources/${resourceId}/schedule`, {
        signal: controller.signal,
      });

      setResource(res.data.resource);

      // Backend schedule keys are exact UTC (03:30 / 04:30 / etc.)
      const isoSchedule = res.data.schedule || {};

      // Convert UTC → IST friendly keys for slot selection
      const localSchedule = {};
      for (const isoUtc in isoSchedule) {
        const ist = utcToIst(isoUtc);
        const slotKey = `${ist.format("YYYY-MM-DD")}_${ist.format("HH:mm")}`;
        localSchedule[slotKey] = isoSchedule[isoUtc];
      }

      setScheduleData({ schedule: localSchedule });
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err.message || "Failed to load schedule");
      }
    }
  }, [resourceId]);

  useEffect(() => {
    fetchSchedule();
    return () => abortRef.current?.abort?.();
  }, [fetchSchedule]);

  // Build days list
  const upcomingDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: noOfDays }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
      return { key, label, date: d };
    });
  }, [noOfDays]);

  // Extract all unique IST times from schedule keys
  const timeSlots = useMemo(() => {
    if (!scheduleData) return [];
    const allTimes = new Set();

    Object.keys(scheduleData.schedule).forEach((slotKey) => {
      const [, time] = slotKey.split("_");
      allTimes.add(time);
    });

    const sorted = [...allTimes].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    return sorted.map((t) => ({ time: t, label: t }));
  }, [scheduleData]);

  const compareSlots = useCallback((a, b) => {
    const [d1, t1] = a.split("_");
    const [d2, t2] = b.split("_");
    if (d1 !== d2) return d1.localeCompare(d2);
    return t1.localeCompare(t2);
  }, []);

  const getSlotsBetween = useCallback(
    (s, e) => {
      if (!s || !e || !scheduleData) return new Set();
      let start = s,
        end = e;

      if (compareSlots(start, end) > 0) [start, end] = [end, start];

      const result = new Set();

      upcomingDays.forEach((day) => {
        timeSlots.forEach(({ time }) => {
          const slotKey = `${day.key}_${time}`;
          const cmpStart = compareSlots(slotKey, start);
          const cmpEnd = compareSlots(slotKey, end);

          if (cmpStart >= 0 && cmpEnd <= 0) {
            const entry = scheduleData.schedule[slotKey];
            if (entry?.isRequestable) result.add(slotKey);
          }
        });
      });

      return result;
    },
    [scheduleData, compareSlots, upcomingDays, timeSlots]
  );

  const maxHours = resource?.maxBookingDuration ?? null;

  const hoursBetweenInclusive = useCallback((s, e) => {
    const [sd, st] = s.split("_");
    const [ed, et] = e.split("_");

    const start = new Date(`${sd}T${st}:00+05:30`);
    const end = new Date(`${ed}T${et}:00+05:30`);

    const diffH = Math.round((end - start) / 36e5) + 1;
    return diffH;
  }, []);

  const hasBlockedBetween = useCallback(
    (s, e) => {
      let start = s,
        end = e;
      if (compareSlots(start, end) > 0) [start, end] = [end, start];

      for (const d of upcomingDays) {
        for (const { time } of timeSlots) {
          const slotKey = `${d.key}_${time}`;
          if (
            compareSlots(slotKey, start) > 0 &&
            compareSlots(slotKey, end) < 0
          ) {
            const entry = scheduleData.schedule[slotKey];
            if (!entry?.isRequestable) return true;
          }
        }
      }
      return false;
    },
    [scheduleData, compareSlots, upcomingDays, timeSlots]
  );

  const handleSlotClick = useCallback(
    (slotKey, isRequestable) => {
      if (!isRequestable) return;

      if (!startSlot) {
        setStartSlot(slotKey);
        setSelectedSlots(new Set([slotKey]));
        return;
      }

      // If user hasn't chosen end slot yet
      if (!endSlot) {
        if (slotKey === startSlot) return;

        if (hasBlockedBetween(startSlot, slotKey)) return;
        if (maxHours && hoursBetweenInclusive(startSlot, slotKey) > maxHours)
          return;

        setEndSlot(slotKey);
        const range = getSlotsBetween(startSlot, slotKey);
        setSelectedSlots(range);
        return;
      }

      // Reset or adjust range
      if (compareSlots(slotKey, startSlot) < 0) {
        setStartSlot(slotKey);
        setEndSlot(null);
        setSelectedSlots(new Set([slotKey]));
      } else {
        if (hasBlockedBetween(startSlot, slotKey)) return;
        if (maxHours && hoursBetweenInclusive(startSlot, slotKey) > maxHours)
          return;

        setEndSlot(slotKey);
        const range = getSlotsBetween(startSlot, slotKey);
        setSelectedSlots(range);
      }
    },
    [
      startSlot,
      endSlot,
      hasBlockedBetween,
      hoursBetweenInclusive,
      maxHours,
      getSlotsBetween,
      compareSlots,
    ]
  );

  const clearSelection = () => {
    setSelectedSlots(new Set());
    setStartSlot(null);
    setEndSlot(null);
  };

  const getActualStartEnd = () => {
    if (!startSlot) return { actualStart: null, actualEnd: null };
    if (!endSlot) return { actualStart: startSlot, actualEnd: null };
    return compareSlots(startSlot, endSlot) <= 0
      ? { actualStart: startSlot, actualEnd: endSlot }
      : { actualStart: endSlot, actualEnd: startSlot };
  };

  const calculateDuration = () => {
    const { actualStart, actualEnd } = getActualStartEnd();
    if (!actualStart) return null;
    if (!actualEnd) return { hours: 1, formatted: "1h" };

    const h = hoursBetweenInclusive(actualStart, actualEnd);
    return { hours: h, formatted: `${h}h` };
  };

  return {
    error,
    scheduleData,
    resource,
    upcomingDays,
    timeSlots,
    selectedSlots,
    startSlot,
    endSlot,
    handleSlotClick,
    clearSelection,
    getActualStartEnd,
    calculateDuration,

    // Submitting wants UTC, so use this:
    slotKeyToUtcIso,

    refetchSchedule: fetchSchedule,
  };
};
