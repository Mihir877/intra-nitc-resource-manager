// controllers/seeder.controller.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { Resource } from "../models/resource.model.js";
import { Request } from "../models/request.model.js";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Kolkata");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root for seeder assets
const seedDir = __dirname;

// HTTP helpers
const ok = (res, payload = {}) =>
  res.status(200).json({ success: true, statusCode: 200, ...payload });
const created = (res, payload = {}) =>
  res.status(201).json({ success: true, statusCode: 201, ...payload });
const fail = (res, code, message) =>
  res.status(code).json({ success: false, message });

// utils
const getRandomInt = (max) => Math.floor(Math.random() * max);

async function loadJsonArray(filePathAbs) {
  const raw = await fs.readFile(filePathAbs, "utf-8");
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) throw new Error("JSON is not an array");
  return arr;
}

async function fileExists(absPath) {
  try {
    await fs.access(absPath);
    return true;
  } catch {
    return false;
  }
}

// Default availability (Mon–Fri 09:00–17:00)
const defaultAvailability = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
].map((day) => ({ day, startTime: "09:00", endTime: "17:00" }));

// Helpers
function parseDurationToHours(val) {
  if (typeof val === "number" && Number.isFinite(val)) return Math.max(1, val);
  if (typeof val !== "string") return 8;
  const s = val.trim().toLowerCase();
  const m = s.match(/^(\d+)\s*([hd])$/);
  if (!m) return 8;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n) || n <= 0) return 8;
  return m[2] === "d" ? n * 24 : n;
}

function sanitizeString(v, fallback = "") {
  return typeof v === "string" ? v.trim() || fallback : fallback;
}

/* =======================
   USERS SEEDER
======================= */
const VALID_DEPARTMENTS = new Set(["CSE", "ARCH", "ECE", "ME"]);
const VALID_ROLES = new Set(["admin", "student"]);

export const seedUsersFromJson = async (req, res) => {
  try {
    const { count = 10 } = req.body || {};
    const fileAbs = path.join(seedDir, "users.json");
    if (!(await fileExists(fileAbs))) {
      return fail(res, 400, "users.json not found in seeder");
    }

    const input = await loadJsonArray(fileAbs);
    if (!Array.isArray(input) || input.length === 0) {
      return fail(res, 400, "No users to seed");
    }

    const toUse = Number.isFinite(count)
      ? input.slice(0, Math.max(0, count))
      : input;

    const normalized = toUse
      .map((u) => ({
        username:
          (u.username && String(u.username).trim()) ||
          (u.email ? String(u.email).split("@")[0] : "").trim(),
        email: u.email ? String(u.email).toLowerCase().trim() : "",
        password: u.password ? String(u.password) : "",
        role:
          u.role && VALID_ROLES.has(String(u.role))
            ? String(u.role)
            : "student",
        department:
          u.department && VALID_DEPARTMENTS.has(String(u.department))
            ? String(u.department)
            : undefined,
        isEmailVerified: Boolean(u.isEmailVerified) || false,
        avatar: u.avatar || undefined,
      }))
      .filter((u) => u.email);

    const invalidDept = normalized.filter((u) => !u.department);
    const validRows = normalized.filter((u) => u.department);

    const emails = validRows.map((u) => u.email);
    const existing = await User.find({ email: { $in: emails } }).select(
      "_id email"
    );
    const existingSet = new Set(existing.map((e) => e.email.toLowerCase()));

    const toInsert = [];
    for (const u of validRows) {
      if (existingSet.has(u.email)) continue;
      const hashed = await bcrypt.hash(
        u.password || `P@ssw0rd_${Math.random().toString(36).slice(2)}`,
        10
      );
      toInsert.push({
        username: u.username || u.email.split("@")[0],
        email: u.email,
        password: hashed,
        role: u.role,
        department: u.department,
        isEmailVerified: u.isEmailVerified,
        avatar: u.avatar,
      });
    }

    let insertedCount = 0;
    if (toInsert.length > 0) {
      const inserted = await User.insertMany(toInsert, { ordered: false });
      insertedCount = inserted.length;
    }

    return created(res, {
      message: "Users seeded via json",
      insertedCount,
      skippedCount: toUse.length - insertedCount,
      invalidDepartmentCount: invalidDept.length,
    });
  } catch (err) {
    console.error("Seed users error:", err);
    return fail(res, 500, err.message || "Internal Server Error");
  }
};

/* =======================
   RESOURCES SEEDER
======================= */
export const seedResourcesJson = async (req, res) => {
  try {
    const { count = 30, requiresApprovalRatio = 0.7 } = req?.body || {};
    const admins = await User.find({ role: "admin" }).select("_id");
    if (admins.length === 0) {
      return fail(res, 400, "No admin users available to own resources");
    }

    const existingNames = await Resource.find().select("name -_id");
    const usedNames = new Set(existingNames.map((r) => r.name));

    const fileAbs = path.join(seedDir, "resources.json");
    if (!(await fileExists(fileAbs))) {
      return fail(res, 400, "resources.json not found in seeder");
    }
    const rawItems = await loadJsonArray(fileAbs);
    const toUse = Number.isFinite(count)
      ? rawItems.slice(0, Math.max(0, count))
      : rawItems;

    const ratio = Math.min(1, Math.max(0, requiresApprovalRatio));
    const items = [];

    for (const r of toUse) {
      const name = sanitizeString(r.name);
      if (!name) continue;
      if (usedNames.has(name)) continue;
      usedNames.add(name);

      const owner = r.createdBy || admins[getRandomInt(admins.length)]._id;
      const requiresApproval =
        typeof r.requiresApproval === "boolean"
          ? r.requiresApproval
          : Math.random() < ratio;

      items.push({
        name,
        type: sanitizeString(r.type, "other"),
        department: sanitizeString(r.department, "CSE"),
        description: sanitizeString(r.description, ""),
        location: sanitizeString(r.location, ""),
        status: sanitizeString(r.status, "available") || "available",
        availability:
          Array.isArray(r.availability) && r.availability.length
            ? r.availability
            : defaultAvailability,
        maxBookingDuration: parseDurationToHours(r.maxBookingDuration),
        requiresApproval,
        usageRules: Array.isArray(r.usageRules)
          ? r.usageRules
          : sanitizeString(r.usageRules, "")
          ? [sanitizeString(r.usageRules, "")]
          : [],
        createdBy: owner,
        isActive: r.isActive ?? true,
        images: Array.isArray(r.images) ? r.images : [],
        capacity:
          Number.isFinite(r.capacity) && r.capacity > 0
            ? Math.floor(r.capacity)
            : 1,
      });
    }

    if (items.length === 0)
      return ok(res, { message: "No resources to insert", insertedCount: 0 });

    const inserted = await Resource.insertMany(items, { ordered: false });
    return created(res, {
      message: "Resources seeded via json",
      insertedCount: inserted.length,
    });
  } catch (err) {
    console.error("Seed resources error:", err);
    return fail(res, 500, err.message || "Internal Server Error");
  }
};

/* =======================
   DEMO DATA SEEDER
======================= */
export const seedDemoData = async (req, res) => {
  try {
    // 1. Fetch users & resources
    const users = await User.find({ role: { $in: ["student", "faculty"] } });
    const admins = await User.find({ role: "admin" });
    const resources = await Resource.find({
      isActive: true,
      status: { $ne: "disabled" },
    });

    if (users.length === 0 || resources.length === 0) {
      return fail(res, 400, "No eligible users or active resources found");
    }

    // 2. Clear existing requests
    await Request.deleteMany({});

    // Group students/faculty by department (normalize to uppercase)
    const usersByDept = {};
    for (const u of users) {
      const dept = (u.department || "Other").toUpperCase();
      if (!usersByDept[dept]) usersByDept[dept] = [];
      usersByDept[dept].push(u);
    }

    // Group admins by department
    const adminsByDept = {};
    for (const a of admins) {
      const dept = (a.department || "Other").toUpperCase();
      if (!adminsByDept[dept]) adminsByDept[dept] = [];
      adminsByDept[dept].push(a);
    }

    const requests = [];

    // Realistic purpose generator
    const getPurpose = (resource) => {
      const csePurposes = [
        "Deep Learning Model Training",
        "CUDA Assignment",
        "Research Experiment",
        "Lab Session",
        "Final Year Project",
        "Natural Language Processing Lab",
        "Compiler Design Assignment",
        "Big Data Preprocessing"
      ];
      const ecePurposes = [
        "Hardware Testing",
        "PCB Design & Fabrication",
        "VLSI Simulation",
        "Embedded Systems Lab",
        "Digital Signal Processing Project",
        "Microcontroller Programming"
      ];
      const mePurposes = [
        "3D Printing Prototype",
        "CAD Modeling Workstation Lab",
        "Fluid Dynamics Analysis",
        "Finite Element Analysis",
        "CNC Machining Lab"
      ];
      const archPurposes = [
        "Architectural Model Plotting",
        "3D Rendering Lab",
        "Landscape Design Workshop",
        "Thesis Drafting Session"
      ];
      const generalPurposes = [
        "Seminar Presentation",
        "Faculty Workshop",
        "Thesis Defense Dry Run",
        "Guest Lecture Setup",
        "Academic Club Activity"
      ];

      const dept = (resource.department || "").toUpperCase();
      let list = generalPurposes;
      if (dept === "CSE") list = csePurposes;
      else if (dept === "ECE") list = ecePurposes;
      else if (dept === "ME") list = mePurposes;
      else if (dept === "ARCH") list = archPurposes;

      if (Math.random() < 0.2) {
        list = generalPurposes;
      }
      return list[getRandomInt(list.length)];
    };

    const rejectionRemarks = [
      "Resource is reserved for scheduled academic classes during this slot.",
      "Departmental event scheduled at the same location.",
      "Required pre-requisite safety training not completed by user.",
      "Prioritized booking for senior research scholars and faculty.",
      "System undergoing routine maintenance and software updates.",
      "Incomplete request details: project description insufficient."
    ];

    const getRejectionRemark = () => rejectionRemarks[getRandomInt(rejectionRemarks.length)];

    // Target: Generate 5 requests per resource
    const targetBookingsPerResource = 5;
    const now = dayjs().tz("Asia/Kolkata");
    const demoUser = users.find(u => u.email.toLowerCase() === "demo@user.com");

    for (const resource of resources) {
      // Find admin for resource's department
      const deptUpper = (resource.department || "").toUpperCase();
      const deptAdmins = adminsByDept[deptUpper] || [];
      const admin = deptAdmins.length > 0 
        ? deptAdmins[getRandomInt(deptAdmins.length)] 
        : (admins.length > 0 ? admins[getRandomInt(admins.length)] : null);

      // Find user from the resource's department
      const deptUsers = usersByDept[deptUpper] || [];
      const resourceUsers = deptUsers.length > 0 ? deptUsers : users;

      // Keep track of this resource's generated slots to check for overlaps
      const generatedSlots = [];

      let attempts = 0;
      let bookingsCreated = 0;

      while (bookingsCreated < targetBookingsPerResource && attempts < 40) {
        attempts++;

        // Pick a random day offset in [-5, 10]
        const offset = -5 + getRandomInt(16); // -5 to 10
        const date = now.add(offset, "day");
        const dayName = date.format("dddd"); // "Monday", "Tuesday", etc.

        // Get availability slots for this day of week
        const availSlots = (resource.availability || []).filter(
          (a) => a.day.toLowerCase() === dayName.toLowerCase()
        );

        if (availSlots.length === 0) continue;

        // Choose one random availability slot
        const slot = availSlots[getRandomInt(availSlots.length)];
        const { startTime, endTime } = slot;
        if (!startTime || !endTime) continue;

        const [startHr, startMin] = startTime.split(":").map(Number);
        const [endHr, endMin] = endTime.split(":").map(Number);

        const availStart = dayjs.tz(
          `${date.format("YYYY-MM-DD")} ${startTime}`,
          "YYYY-MM-DD HH:mm",
          "Asia/Kolkata"
        );
        const availEnd = dayjs.tz(
          `${date.format("YYYY-MM-DD")} ${endTime}`,
          "YYYY-MM-DD HH:mm",
          "Asia/Kolkata"
        );

        // Decide a duration that is more than 60% of maxBookingDuration
        const maxDuration = Math.max(1, resource.maxBookingDuration || 2);
        const minDuration = 0.6 * maxDuration;
        const possibleDurations = [];
        for (let h = 0.5; h <= maxDuration; h += 0.5) {
          if (h >= minDuration) {
            possibleDurations.push(h);
          }
        }
        if (possibleDurations.length === 0) {
          possibleDurations.push(maxDuration);
        }
        const durationHrs = possibleDurations[getRandomInt(possibleDurations.length)];

        // Booking start time must be between availStart and availEnd - durationHrs
        const maxOffsetMinutes = availEnd.diff(availStart, "minute") - (durationHrs * 60);
        if (maxOffsetMinutes <= 0) continue;

        // Align starting offset to 30 minutes
        const possibleOffsets = [];
        for (let offsetMins = 0; offsetMins <= maxOffsetMinutes; offsetMins += 30) {
          possibleOffsets.push(offsetMins);
        }
        if (possibleOffsets.length === 0) continue;
        const offsetMinutes = possibleOffsets[getRandomInt(possibleOffsets.length)];

        const bookingStart = availStart.add(offsetMinutes, "minute");
        const bookingEnd = bookingStart.add(durationHrs, "hour");

        // Convert to UTC dates for Mongoose saving
        const startUtc = bookingStart.utc().toDate();
        const endUtc = bookingEnd.utc().toDate();

        // Check for overlap against previously generated slots for this resource
        const hasOverlap = generatedSlots.some(
          (s) => startUtc < s.end && endUtc > s.start
        );
        if (hasOverlap) continue;

        // No overlap! Generate request
        let user;
        if (demoUser && Math.random() < 0.65) {
          user = demoUser;
        } else {
          user = resourceUsers[getRandomInt(resourceUsers.length)];
        }

        const isPast = bookingEnd.isBefore(now);

        let status = "approved";
        let approvedBy = null;
        let approvedAt = null;
        let remarks = undefined;

        if (isPast) {
          // Past bookings are either approved or rejected (no pending)
          const approved = Math.random() < 0.85;
          if (approved) {
            status = "approved";
            approvedBy = admin ? admin._id : null;
            approvedAt = bookingStart.subtract(getRandomInt(60) + 10, "minute").utc().toDate();
          } else {
            status = "rejected";
            approvedBy = admin ? admin._id : null;
            approvedAt = bookingStart.subtract(getRandomInt(60) + 10, "minute").utc().toDate();
            remarks = getRejectionRemark();
          }
        } else {
          // Present/Future bookings
          if (!resource.requiresApproval) {
            status = "approved";
            approvedBy = null;
            approvedAt = null;
          } else {
            // requires approval: 30% approved, 60% pending, 10% rejected
            const rand = Math.random();
            if (rand < 0.3) {
              status = "approved";
              approvedBy = admin ? admin._id : null;
              approvedAt = bookingStart.subtract(getRandomInt(120) + 30, "minute").utc().toDate();
            } else if (rand < 0.9) {
              status = "pending";
              approvedBy = null;
              approvedAt = null;
            } else {
              status = "rejected";
              approvedBy = admin ? admin._id : null;
              approvedAt = bookingStart.subtract(getRandomInt(120) + 30, "minute").utc().toDate();
              remarks = getRejectionRemark();
            }
          }
        }

        generatedSlots.push({ start: startUtc, end: endUtc });
        requests.push({
          userId: user._id,
          resourceId: resource._id,
          startTime: startUtc,
          endTime: endUtc,
          purpose: getPurpose(resource),
          status,
          approvedBy,
          approvedAt,
          remarks,
        });

        bookingsCreated++;
      }
    }

    let insertedCount = 0;
    if (requests.length > 0) {
      const inserted = await Request.insertMany(requests, { ordered: false });
      insertedCount = inserted.length;
    }

    return created(res, {
      message: "Realistic demo data seeded successfully",
      insertedCount,
    });
  } catch (err) {
    console.error("Seed demo data error:", err);
    return fail(res, 500, err.message || "Internal Server Error");
  }
};
