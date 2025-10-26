// controllers/seeder.controller.js
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { faker } from "@faker-js/faker";
import { User } from "../models/user.model.js";
import { Resource } from "../models/resource.model.js";
import { Request } from "../models/request.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// root: .../server/seed
const seedDir = __dirname;

const ok = (res, payload = {}) =>
  res.status(200).json({ success: true, statusCode: 200, ...payload });

const created = (res, payload = {}) =>
  res.status(201).json({ success: true, statusCode: 201, ...payload });

const fail = (res, code, message) =>
  res.status(code).json({ success: false, message });

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
/**
 * POST /api/v1/seeder/users
 * Body: { count?: number, filePath?: string }  // filePath relative to project root (optional)
 * Behavior:
 * - Loads users from JSON file (default: seeds/users.json)
 * - Skips duplicates by email
 * - Truncates to 'count' if provided
 * - Allows roles included in JSON; defaults enforced by model
 */

// POST /api/v1/seeder/users  Body: { fileName?: string, count?: number }
export const seedUsersFromJson = async (req, res) => {
  try {
    const { count = 10 } = req.body || {};
    const filePath = path.join(seedDir, "users.json");

    const raw = await fs.readFile(filePath, "utf-8");
    let users = JSON.parse(raw);
    if (!Array.isArray(users) || users.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No users in JSON" });
    }
    if (Number.isFinite(count)) {
      users = users.slice(0, Math.max(0, count));
    }

    const emails = users
      .map((u) => (u.email || "").toLowerCase())
      .filter(Boolean);
    const existing = await User.find({ email: { $in: emails } }).select(
      "email"
    );
    const existingSet = new Set(existing.map((u) => u.email.toLowerCase()));

    const toInsert = users
      .filter((u) => u.email && !existingSet.has(u.email.toLowerCase()))
      .map((u) => ({
        username: u.username || u.email.split("@")[0],
        email: u.email,
        password: u.password || faker.internet.password({ length: 12 }),
        role: u.role || "student",
        isEmailVerified: false,
        avatar: u.avatar,
      }));

    if (toInsert.length === 0) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "No new users to insert",
        insertedCount: 0,
        skippedCount: users.length,
      });
    }

    const inserted = await User.insertMany(toInsert, { ordered: false });
    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: `Users seeded from ${fileName}`,
      insertedCount: inserted.length,
      skippedCount: users.length - inserted.length,
    });
  } catch (err) {
    console.error("Seed users error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

/**
 * POST /api/v1/seeder/resources
 * Body: { count?: number, requiresApprovalRatio?: number (0..1) }
 * - Creates 'count' resources with faker
 * - Assigns createdBy to random admins
 * - Avoids duplicate names
 * - Sets isActive/status appropriately
 */

export const seedResourcesFaker = async (req, res) => {
  try {
    const { count = 30, requiresApprovalRatio = 0.7 } = req?.body;

    const admins = await User.find({ role: "admin" }).select("_id");
    if (admins.length === 0) {
      return fail(res, 400, "No admin users available to own resources");
    }

    const existingNames = await Resource.find().select("name -_id");
    const usedNames = new Set(existingNames.map((r) => r.name));

    const availabilityTemplate = [
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

    const items = [];
    for (let i = 0; i < Number(count) || 0; i++) {
      let base = faker.commerce.productName();
      let suffix = faker.number.int({ min: 1, max: 99999 });
      let name = `${base} ${suffix}`;
      while (usedNames.has(name)) {
        suffix = faker.number.int({ min: 1, max: 99999 });
        name = `${base} ${suffix}`;
      }
      usedNames.add(name);

      const owner =
        admins[faker.number.int({ min: 0, max: admins.length - 1 })];
      const requiresApproval =
        Math.random() < Math.min(1, Math.max(0, requiresApprovalRatio));

      items.push({
        name,
        type: faker.helpers.arrayElement([
          "instrument",
          "server",
          "lab_equipment",
          "other",
        ]),
        category: faker.helpers.arrayElement([
          "IT",
          "Mechanical",
          "Electrical",
          "Civil",
        ]),
        department: faker.helpers.arrayElement([
          "CSE",
          "EEE",
          "ME",
          "CE",
          "ECE",
        ]),
        description: faker.lorem.sentence(),
        location: `${faker.location.buildingNumber()} ${faker.location.street()}}`,
        status: "available",
        availability: availabilityTemplate,
        maxBookingDuration: getRandomInt(15),
        requiresApproval,
        usageRules: faker.lorem.sentence(), // string, not array
        createdBy: owner._id,
        isActive: true,
        images: [],
        capacity: faker.number.int({ min: 1, max: 50 }),
      });
    }

    if (items.length === 0) {
      return ok(res, { message: "No resources to insert", insertedCount: 0 });
    }

    const inserted = await Resource.insertMany(items, { ordered: false });
    return created(res, {
      message: "Resources seeded successfully",
      insertedCount: inserted.length,
    });
  } catch (err) {
    console.error("Seed resources error:", err);
    return fail(res, 500, err.message || "Internal Server Error");
  }
};

/**
 * Helper: generate a valid, non-overlapping time slot
 * - maxBookingDuration respected
 * - tries multiple times to avoid conflicts
 */
async function generateValidSlot(resource, maxTries = 15) {
  const now = new Date();
  for (let i = 0; i < maxTries; i++) {
    // random day within next 14 days
    const startDayOffset = faker.number.int({ min: 0, max: 14 });
    const startHour = faker.number.int({ min: 8, max: 16 });
    const durationHrs = Math.min(
      resource.maxBookingDuration,
      faker.number.int({ min: 1, max: 15 })
    );

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

    // Ensure active and no conflict with pending/approved
    const conflict = await Request.findOne({
      resourceId: resource._id,
      status: { $in: ["pending", "approved"] },
      $or: [
        {
          startTime: { $lt: endTime, $gte: startTime },
        },
        {
          endTime: { $gt: startTime, $lte: endTime },
        },
        {
          startTime: { $lte: startTime },
          endTime: { $gte: endTime },
        },
      ],
    }).lean();

    if (!conflict) {
      return { startTime, endTime };
    }
  }
  return null;
}

/**
 * POST /api/v1/seeder/requests
 * Body: { count?: number, respectApproval?: boolean }
 * - Randomly selects users (non-admin) and active resources
 * - Generates conflict-free time slots, respecting requiresApproval
 * - If resource.requiresApproval=false, auto-approve like createRequest controller
 */
export const seedRequestsRandom = async (req, res) => {
  try {
    const { count = 120, respectApproval = true } = req.body || {};
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

    const createdDocs = [];
    for (let i = 0; i < Number(count) || 0; i++) {
      const user = users[getRandomInt(users.length - 1)];
      const resource = resources[getRandomInt(resources.length - 1)];

      const slot = await generateValidSlot(resource);
      if (!slot) continue;

      const requiresApproval = respectApproval || resource.requiresApproval;

      const doc = await Request.create({
        userId: user._id,
        resourceId: resource._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        purpose: faker.lorem.sentence(),
        status: requiresApproval ? "pending" : "approved",
        approvedBy: requiresApproval ? null : req.user.id,
        approvedAt: requiresApproval ? null : new Date(),
      });

      createdDocs.push(doc._id);
    }

    return created(res, {
      message: "Requests seeded successfully",
      insertedCount: createdDocs.length,
      requestIds: createdDocs,
    });
  } catch (err) {
    console.error("Seed requests error:", err);
    return fail(res, 500, err.message || "Internal Server Error");
  }
};

/**
 * POST /api/v1/seeder/decisions
 * Body: { approveRatio?: number (0..1), remarkTemplate?: string }
 * - Randomly approve/reject pending requests
 * - When rejecting, remarks are mandatory (use template + faker)
 * - Sends notifications similar to decisionRequest controller
 */
export const seedDecisionsRandom = async (req, res) => {
  try {
    const { approveRatio = 0.7, remarkTemplate } = req.body || {};
    const ratio = Math.min(1, Math.max(0, approveRatio));

    const pending = await Request.find({ status: "pending" })
      .populate("userId", "email username")
      .populate("resourceId", "name");

    if (pending.length === 0) {
      return ok(res, {
        message: "No pending requests to decide",
        decidedCount: 0,
      });
    }
    // Replace the transactional block in seedDecisionsRandom with this non-transactional loop
    let decidedCount = 0;

    for (const r of pending) {
      const approve = Math.random() < ratio;
      r.status = approve ? "approved" : "rejected";
      r.approvedBy = req.user.id;
      r.approvedAt = new Date();
      if (!approve) {
        const reason =
          remarkTemplate?.replace(/\{\{resource\}\}/g, r.resourceId.name) ||
          `Not available: ${faker.lorem.sentence()}`;
        r.remarks = reason;
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
