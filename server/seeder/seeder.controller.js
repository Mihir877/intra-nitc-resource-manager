// controllers/seeder.controller.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/user.model.js";
import { Resource } from "../models/resource.model.js";
import { Request } from "../models/request.model.js";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root for seeder assets: .../server/seeder (this file's dir)
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

// Shared availability template for resources
const defaultAvailability = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
].map((day) => ({
  day,
  startTime: "09:00",
  endTime: "17:00",
}));

/**
 * USERS
 * POST /api/v1/seeder/users
 * Body: { count?: number }
 * Behavior: Only reads from seeder/users.json, inserts up to count unique emails
 */
export const seedUsersFromJson = async (req, res) => {
  try {
    const { count = 10 } = req.body || {};
    const fileAbs = path.join(seedDir, "users.json");
    console.log("fileAbs: ", fileAbs);
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
    const emails = toUse
      .map((u) => (u.email || "").toLowerCase())
      .filter(Boolean);
    const existing = await User.find({ email: { $in: emails } }).select(
      "email"
    );
    const existingSet = new Set(existing.map((u) => u.email.toLowerCase()));

    const toInsert = await Promise.all(
      toUse
        .filter((u) => u.email && !existingSet.has(u.email.toLowerCase()))
        .map(async (u) => {
          const hashed = await bcrypt.hash(
            u.password || `P@ssw0rd_${Math.random().toString(36).slice(2)}`,
            10
          );
          return {
            username: u.username || u.email.split("@")[0],
            email: u.email,
            password: hashed,
            role: u.role || "student",
            isEmailVerified: Boolean(u.isEmailVerified) || false,
            avatar: u.avatar,
          };
        })
    );

    if (toInsert.length === 0) {
      return ok(res, {
        message: "No new users to insert",
        insertedCount: 0,
        skippedCount: toUse.length,
      });
    }

    const inserted = await User.insertMany(toInsert, { ordered: false });
    return created(res, {
      message: "Users seeded via json",
      insertedCount: inserted.length,
      skippedCount: toUse.length - inserted.length,
    });
  } catch (err) {
    console.error("Seed users error:", err);
    return fail(res, 500, err.message || "Internal Server Error");
  }
};

/**
 * RESOURCES
 * POST /api/v1/seeder
 * Body: { count?: number, requiresApprovalRatio?: number }
 * Behavior: Only reads from seeder.json. If requiresApproval missing, assign randomly by ratio.
 */
export const seedResourcesJson = async (req, res) => {
  try {
    const { count = 30, requiresApprovalRatio = 0.7 } = req?.body || {};
    const admins = await User.find({ role: "admin" }).select("_id");
    if (admins.length === 0) {
      return fail(res, 400, "No admin users available to own resources");
    }

    const existingNames = await Resource.find().select("name -_id");
    const usedNames = new Set(existingNames.map((r) => r.name));

    // JSON mode only
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
      let name = r.name;
      if (!name) continue;
      if (usedNames.has(name)) continue; // skip duplicate name from JSON
      usedNames.add(name);

      const owner = r.createdBy || admins[getRandomInt(admins.length)]._id;
      const requiresApproval =
        typeof r.requiresApproval === "boolean"
          ? r.requiresApproval
          : Math.random() < ratio;

      items.push({
        name,
        type: r.type || "other",
        category: r.category || "IT",
        department: r.department || "CSE",
        description: r.description || "",
        location: r.location || "",
        status: r.status || "available",
        availability:
          Array.isArray(r.availability) && r.availability.length
            ? r.availability
            : defaultAvailability,
        maxBookingDuration: Number.isFinite(r.maxBookingDuration)
          ? r.maxBookingDuration
          : 8,
        requiresApproval,
        usageRules: typeof r.usageRules === "string" ? r.usageRules : "",
        createdBy: owner,
        isActive: r.isActive ?? true,
        images: Array.isArray(r.images) ? r.images : [],
        capacity: Number.isFinite(r.capacity) ? r.capacity : 1,
      });
    }

    if (items.length === 0) {
      return ok(res, { message: "No resources to insert", insertedCount: 0 });
    }

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

// Helper: random start-end generation within next 2 weeks, 1-8 hours, avoid overlaps
async function generateValidSlot(resource, maxTries = 20) {
  for (let i = 0; i < maxTries; i++) {
    const now = new Date();
    const startDayOffset = getRandomInt(14); // 0-13 days ahead
    const startHour = 8 + getRandomInt(9); // 8..16
    const durationHrs = Math.min(
      resource.maxBookingDuration || 8,
      1 + getRandomInt(8)
    ); // 1..8
    const startTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + startDayOffset,
      startHour,
      0,
      0,
      0
    );
    const endTime = new Date(
      startTime.getTime() + durationHrs * 60 * 60 * 1000
    );

    // Overlap query: any existing pending/approved that intersects [startTime, endTime)
    // Patterns similar to general mongoose queries doc examples. [web:22]
    const conflict = await Request.findOne({
      resourceId: resource._id,
      status: { $in: ["pending", "approved"] },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
      ],
    }).lean();

    if (!conflict) return { startTime, endTime };
  }
  return null;
}

/**
 * REQUESTS
 * POST /api/v1/seeder/requests
 * Body: { count?: number }
 * Behavior: Randomly selects users and resources, generates random valid time slots; status is randomized if resource requires approval else auto-approved.
 */
export const seedRequestsRandom = async (req, res) => {
  try {
    const { count = 120 } = req.body || {};

    const users = await User.find({
      role: { $in: ["student", "faculty"] },
    }).select("_id");
    if (users.length === 0) {
      return fail(res, 400, "No student/faculty users available");
    }
    const resources = await Resource.find({
      isActive: true,
      status: { $ne: "disabled" },
    }).select("_id name requiresApproval maxBookingDuration");
    if (resources.length === 0) {
      return fail(res, 400, "No active resources available");
    }

    const createdIds = [];
    const iterations = Number(count) || 0;

    for (let i = 0; i < iterations; i++) {
      const user = users[getRandomInt(users.length)];
      const resource = resources[getRandomInt(resources.length)];

      const slot = await generateValidSlot(resource);
      if (!slot) continue;

      // If resource requires approval, randomly set pending or auto-approve; if not, auto-approve.
      const requiresApproval = !!resource.requiresApproval;
      let status = "approved";
      if (requiresApproval) {
        status = Math.random() < 0.5 ? "pending" : "approved"; // randomize request status
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
        remarks: undefined,
      });

      createdIds.push(doc._id);
    }

    return created(res, {
      message: "Requests seeded randomly",
      insertedCount: createdIds.length,
      requestIds: createdIds,
    });
  } catch (err) {
    console.error("Seed requests error:", err);
    return fail(res, 500, err.message || "Internal Server Error");
  }
};

/**
 * DECISIONS
 * POST /api/v1/seeder/decisions
 * Body: { approveRatio?: number }
 * Behavior: Randomly approves/rejects all pending using ratio, remarks filled for rejections.
 */
export const seedDecisionsRandom = async (req, res) => {
  try {
    const { approveRatio = 0.7 } = req.body || {};
    const ratio = Math.min(1, Math.max(0, approveRatio));

    const pending = await Request.find({ status: "pending" }).populate(
      "resourceId",
      "name"
    );
    if (pending.length === 0) {
      return ok(res, {
        message: "No pending requests to decide",
        decidedCount: 0,
      });
    }

    let decidedCount = 0;
    for (const r of pending) {
      const approve = Math.random() < ratio; // randomize decision
      r.status = approve ? "approved" : "rejected";
      r.approvedBy = req.user?.id || null;
      r.approvedAt = new Date();
      if (!approve) {
        r.remarks = `Rejected: ${
          r.resourceId?.name || "resource"
        } not available`;
      }
      await r.save();
      decidedCount++;
    }

    return ok(res, {
      message: "Random decisions applied",
      decidedCount,
      approveRatio: ratio,
    });
  } catch (err) {
    console.error("Seed decisions error:", err);
    return fail(res, 500, err.message || "Internal Server Error");
  }
};
