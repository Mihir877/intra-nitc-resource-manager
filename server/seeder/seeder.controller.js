// controllers/seeder.controller.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { Resource } from "../models/resource.model.js";
import { Request } from "../models/request.model.js";

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
   HELPER: SLOT GENERATION
======================= */
function timeStringToDate(baseDate, timeStr) {
  const [hStr, mStr] = String(timeStr || "00:00").split(":");
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    h,
    m,
    0,
    0
  );
}

function weekdayName(date) {
  const names = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return names[date.getDay()];
}

function roundToStepMinutes(date, step = 15) {
  const total = date.getHours() * 60 + date.getMinutes();
  const rounded = Math.floor(total / step) * step;
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    h,
    m,
    0,
    0
  );
}

// Helper: convert "HH:mm" to number hour
function parseHour(timeStr) {
  if (!timeStr) return 0;
  const [hStr] = timeStr.split(":");
  return parseInt(hStr, 10) || 0;
}

/**
 * Updated generateValidSlot
 * Ensures start/end times are complete hours within availability
 * and within resource.maxBookingDuration limit.
 */
async function generateValidSlot(resource, maxTries = 30) {
  try {
    const availArr =
      Array.isArray(resource.availability) && resource.availability.length
        ? resource.availability
        : defaultAvailability;

    const maxHours =
      typeof resource.maxBookingDuration === "number" &&
      resource.maxBookingDuration > 0
        ? Math.floor(resource.maxBookingDuration)
        : 8;

    const now = new Date();

    for (let attempt = 0; attempt < maxTries; attempt++) {
      const avail = availArr[getRandomInt(availArr.length)];
      if (!avail?.day || !avail.startTime || !avail.endTime) continue;

      // Find a day within the next 14 days matching availability
      const offsets = [];
      for (let o = 0; o < 14; o++) {
        const d = new Date(now);
        d.setDate(now.getDate() + o);
        if (weekdayName(d).toLowerCase() === String(avail.day).toLowerCase()) {
          offsets.push(o);
        }
      }

      const offset =
        offsets.length > 0
          ? offsets[getRandomInt(offsets.length)]
          : getRandomInt(14);
      const chosenDay = new Date(now);
      chosenDay.setDate(now.getDate() + offset);

      const startHour = parseHour(avail.startTime);
      const endHour = parseHour(avail.endTime);
      if (endHour <= startHour) continue;

      const windowLength = endHour - startHour;
      if (windowLength <= 0) continue;

      const durationHours = Math.min(maxHours, windowLength);
      if (durationHours <= 0) continue;

      // Choose random start hour aligned to full-hour boundary
      const possibleStartRange = windowLength - durationHours;
      const randomOffset = getRandomInt(possibleStartRange + 1);
      const startH = startHour + randomOffset;
      const endH = startH + durationHours;

      const start = new Date(
        chosenDay.getFullYear(),
        chosenDay.getMonth(),
        chosenDay.getDate(),
        startH,
        0,
        0,
        0
      );
      const end = new Date(
        chosenDay.getFullYear(),
        chosenDay.getMonth(),
        chosenDay.getDate(),
        endH,
        0,
        0,
        0
      );

      // Sanity check
      if (!(end > start)) continue;

      // Ensure no overlaps
      const conflict = await Request.findOne({
        resourceId: resource._id,
        status: { $in: ["pending", "approved"] },
        $or: [
          { startTime: { $lt: end, $gte: start } },
          { endTime: { $gt: start, $lte: end } },
          { startTime: { $lte: start }, endTime: { $gte: end } },
        ],
      }).lean();

      if (!conflict) {
        return { startTime: start, endTime: end };
      }
    }

    return null;
  } catch (err) {
    console.error("Slot generation error:", err);
    return null;
  }
}

/* =======================
   REQUESTS SEEDER
======================= */
export const seedRequestsRandom = async (req, res) => {
  try {
    const { count = 120 } = req.body || {};

    const users = await User.find({
      role: { $in: ["student", "faculty"] },
    }).select("_id");
    if (users.length === 0)
      return fail(res, 400, "No student/faculty users available");

    const resources = await Resource.find({
      isActive: true,
      status: { $ne: "disabled" },
    }).select("_id name requiresApproval maxBookingDuration availability");
    if (resources.length === 0)
      return fail(res, 400, "No active resources available");

    const createdIds = [];
    for (let i = 0; i < Number(count) || 0; i++) {
      const user = users[getRandomInt(users.length)];
      const resource = resources[getRandomInt(resources.length)];

      const slot = await generateValidSlot(resource);
      if (!slot) continue;

      const requiresApproval = !!resource.requiresApproval;
      let status = "approved";
      if (requiresApproval) {
        status = Math.random() < 0.5 ? "pending" : "approved";
      }

      const doc = await Request.create({
        userId: user._id,
        resourceId: resource._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        purpose: "Auto-seeded request",
        status,
        approvedBy: status === "approved" ? req.user?.id || null : null,
        approvedAt: status === "approved" ? new Date() : null,
      });

      createdIds.push(doc._id);
    }

    return created(res, {
      message:
        "Requests seeded randomly within availability and duration limits",
      insertedCount: createdIds.length,
      requestIds: createdIds,
    });
  } catch (err) {
    console.error("Seed requests error:", err);
    return fail(res, 500, err.message || "Internal Server Error");
  }
};

/* =======================
   DECISIONS SEEDER
======================= */
export const seedDecisionsRandom = async (req, res) => {
  try {
    const { approveRatio = 0.7, count = 10 } = req.body || {};
    const ratio = Math.min(1, Math.max(0, approveRatio));
    const limit = Math.max(1, Number(count) || 1);

    const pending = await Request.find({ status: "pending" }).populate(
      "resourceId",
      "name"
    );

    if (pending.length === 0)
      return ok(res, {
        message: "No pending requests to decide",
        decidedCount: 0,
      });

    const shuffled = pending.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(limit, pending.length));

    let decidedCount = 0;
    for (const r of selected) {
      const approve = Math.random() < ratio;
      r.status = approve ? "approved" : "rejected";
      r.approvedBy = req.user?.id || null;
      r.approvedAt = new Date();
      if (!approve)
        r.remarks = `Rejected: ${
          r.resourceId?.name || "resource"
        } not available`;
      await r.save();
      decidedCount++;
    }

    return ok(res, {
      message: "Random decisions applied",
      decidedCount,
      totalPending: pending.length,
      processed: selected.length,
      approveRatio: ratio,
    });
  } catch (err) {
    console.error("Seed decisions error:", err);
    return fail(res, 500, err.message || "Internal Server Error");
  }
};
