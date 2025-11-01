// app/hooks/useSlotSelection.js
"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import api from "@/api/axios";

export const useSlotSelection = (resourceId, noOfDays = 14) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [resource, setResource] = useState(null);
  const [error, setError] = useState("");
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [startSlot, setStartSlot] = useState(null);
  const [endSlot, setEndSlot] = useState(null);

  useEffect(() => {
    let alive = true;
    const fetchSchedule = async () => {
      if (!resourceId) return;
      setError("");
      try {
        const res = await api.get(`resources/${resourceId}/schedule`);
        if (!alive) return;
        setResource(res.data.resource);
        setScheduleData(res.data.schedule);
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Failed to load schedule");
      }
    };
    fetchSchedule();
    return () => {
      alive = false;
    };
  }, [resourceId]);

  const upcomingDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: noOfDays }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const key = date.toISOString().split("T")[0];
      const label = date.toLocaleDateString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
      return { key, label, date };
    });
  }, [noOfDays]);

  const timeSlots = useMemo(() => {
    if (!scheduleData) return [];
    const { startHour, endHour } = scheduleData.timeRange;
    return Array.from({ length: endHour - startHour }, (_, i) => {
      const h = startHour + i;
      return { h, label: `${String(h).padStart(2, "0")}:00` };
    });
  }, [scheduleData]);

  const parseSlotKey = useCallback((slotKey) => {
    const [dayKey, hourStr] = slotKey.split("_");
    return { dayKey, hour: parseInt(hourStr) };
  }, []);

  const compareSlots = useCallback(
    (s1, s2) => {
      const slot1 = parseSlotKey(s1);
      const slot2 = parseSlotKey(s2);
      if (slot1.dayKey !== slot2.dayKey)
        return slot1.dayKey.localeCompare(slot2.dayKey);
      return slot1.hour - slot2.hour;
    },
    [parseSlotKey]
  );

  const getSlotsBetween = useCallback(
    (start, end) => {
      if (!start || !end || !scheduleData) return new Set();
      const slots = new Set();
      let startSlotKey = start;
      let endSlotKey = end;
      if (compareSlots(start, end) > 0) {
        startSlotKey = end;
        endSlotKey = start;
      }
      upcomingDays.forEach((day) => {
        timeSlots.forEach((time) => {
          const slotKey = `${day.key}_${time.h}`;
          const isAfterStart = compareSlots(slotKey, startSlotKey) >= 0;
          const isBeforeEnd = compareSlots(slotKey, endSlotKey) <= 0;
          if (isAfterStart && isBeforeEnd) {
            const isUnavailable = scheduleData.unavailableSlots?.[slotKey];
            const bookingInfo = scheduleData.bookedSlots?.[slotKey];
            if (!isUnavailable && !bookingInfo) {
              slots.add(slotKey);
            }
          }
        });
      });
      return slots;
    },
    [upcomingDays, timeSlots, scheduleData, compareSlots]
  );

  // new helpers
  const maxHours = resource?.maxBookingDuration ?? null;

  const hasBlockedBetween = useCallback(
    (a, b) => {
      if (!scheduleData) return false;
      let startKey = a,
        endKey = b;
      if (compareSlots(a, b) > 0) [startKey, endKey] = [b, a];
      for (const day of upcomingDays) {
        for (const time of timeSlots) {
          const key = `${day.key}_${time.h}`;
          if (
            compareSlots(key, startKey) > 0 &&
            compareSlots(key, endKey) < 0
          ) {
            if (
              scheduleData.unavailableSlots?.[key] ||
              scheduleData.bookedSlots?.[key]
            ) {
              return true;
            }
          }
        }
      }
      return false;
    },
    [scheduleData, upcomingDays, timeSlots, compareSlots]
  );

  const hoursBetweenInclusive = useCallback(
    (a, b) => {
      if (!a || !b) return 0;
      let s = a,
        e = b;
      if (compareSlots(a, b) > 0) [s, e] = [b, a];
      const [sd, sh] = s.split("_");
      const [ed, eh] = e.split("_");
      const startDate = new Date(`${sd}T${String(sh).padStart(2, "0")}:00:00`);
      const endDate = new Date(`${ed}T${String(eh).padStart(2, "0")}:00:00`);
      return Math.max(1, Math.round((endDate - startDate) / 36e5) + 1);
    },
    [compareSlots]
  );

  const handleSlotClick = useCallback(
    (slotKey, isAvailable) => {
      if (!isAvailable) return;

      if (!startSlot) {
        setStartSlot(slotKey);
        setEndSlot(null);
        setSelectedSlots(new Set([slotKey]));
        return;
      }

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

      const nextStart =
        compareSlots(slotKey, startSlot) < 0 ? slotKey : startSlot;
      const nextEnd = compareSlots(slotKey, startSlot) < 0 ? endSlot : slotKey;

      if (hasBlockedBetween(nextStart, nextEnd)) return;
      if (maxHours && hoursBetweenInclusive(nextStart, nextEnd) > maxHours)
        return;

      if (compareSlots(slotKey, startSlot) >= 0) {
        const range = getSlotsBetween(startSlot, slotKey);
        setEndSlot(slotKey);
        setSelectedSlots(range);
      } else {
        setStartSlot(slotKey);
        setEndSlot(null);
        setSelectedSlots(new Set([slotKey]));
      }
    },
    [
      startSlot,
      endSlot,
      maxHours,
      hasBlockedBetween,
      hoursBetweenInclusive,
      getSlotsBetween,
      compareSlots,
    ]
  );

  const clearSelection = useCallback(() => {
    setSelectedSlots(new Set());
    setStartSlot(null);
    setEndSlot(null);
  }, []);

  const getActualStartEnd = useCallback(() => {
    if (!startSlot) return { actualStart: null, actualEnd: null };
    if (!endSlot) return { actualStart: startSlot, actualEnd: null };
    return compareSlots(startSlot, endSlot) <= 0
      ? { actualStart: startSlot, actualEnd: endSlot }
      : { actualStart: endSlot, actualEnd: startSlot };
  }, [startSlot, endSlot, compareSlots]);

  const calculateDuration = useCallback(() => {
    const { actualStart, actualEnd } = getActualStartEnd();
    if (!actualStart) return null;
    if (!actualEnd) return { hours: 1, formatted: "1h" };
    const start = parseSlotKey(actualStart);
    const end = parseSlotKey(actualEnd);
    const startIdx = upcomingDays.findIndex((d) => d.key === start.dayKey);
    const endIdx = upcomingDays.findIndex((d) => d.key === end.dayKey);
    const diffDays = endIdx - startIdx;
    const totalHours = diffDays * 24 + (end.hour + 1 - start.hour);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return {
      hours: totalHours,
      formatted: `${days ? `${days}d ` : ""}${hours ? `${hours}h` : ""}`.trim(),
    };
  }, [getActualStartEnd, parseSlotKey, upcomingDays]);

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
  };
};
