import { useState, useMemo, useCallback } from "react";
import api from "@/api/axios";

export const useSlotSelection = (resourceId, noOfDays = 14) => {
  const [scheduleData, setScheduleData] = useState(null);
  const [error, setError] = useState("");
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [startSlot, setStartSlot] = useState(null);
  const [endSlot, setEndSlot] = useState(null);

  // Fetch schedule on mount
  useMemo(() => {
    const fetchSchedule = async () => {
      if (!resourceId) return;
      setError("");
      try {
        const res = await api.get(`resources/${resourceId}/schedule`);
        setScheduleData(res.data.schedule);
      } catch (err) {
        setError(err.message || "Failed to load schedule");
      }
    };
    fetchSchedule();
  }, [resourceId]);

  // Generate upcoming days
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

  // Generate time slots
  const timeSlots = useMemo(() => {
    if (!scheduleData) return [];
    const { startHour, endHour } = scheduleData.timeRange;
    return Array.from({ length: endHour - startHour }, (_, i) => {
      const h = startHour + i;
      return { h, label: `${String(h).padStart(2, "0")}:00` };
    });
  }, [scheduleData]);

  // Parse a slot key into day & hour
  const parseSlotKey = useCallback((slotKey) => {
    const [dayKey, hourStr] = slotKey.split("_");
    return { dayKey, hour: parseInt(hourStr) };
  }, []);

  // Compare two slot keys
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

  // Get slots between start and end
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

  // Handle slot click
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
        setEndSlot(slotKey);
        const range = getSlotsBetween(startSlot, slotKey);
        setSelectedSlots(range);
        return;
      }

      const comparison = compareSlots(slotKey, startSlot);
      if (comparison >= 0) {
        const range = getSlotsBetween(startSlot, slotKey);
        setEndSlot(slotKey);
        setSelectedSlots(range);
      } else {
        setStartSlot(slotKey);
        setEndSlot(null);
        setSelectedSlots(new Set([slotKey]));
      }
    },
    [startSlot, endSlot, compareSlots, getSlotsBetween]
  );

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedSlots(new Set());
    setStartSlot(null);
    setEndSlot(null);
  }, []);

  // Get start and end slot in chronological order
  const getActualStartEnd = useCallback(() => {
    if (!startSlot) return { actualStart: null, actualEnd: null };
    if (!endSlot) return { actualStart: startSlot, actualEnd: null };
    return compareSlots(startSlot, endSlot) <= 0
      ? { actualStart: startSlot, actualEnd: endSlot }
      : { actualStart: endSlot, actualEnd: startSlot };
  }, [startSlot, endSlot, compareSlots]);

  // Calculate total duration
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
      totalHours,
      formatted: `${days ? `${days}d ` : ""}${hours ? `${hours}h` : ""}`.trim(),
    };
  }, [getActualStartEnd, parseSlotKey, upcomingDays]);

  return {
    error,
    scheduleData,
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
