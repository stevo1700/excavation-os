// Seeds the database with the same demo data the UI ships with (lib/data.ts and
// lib/mock-reports.ts), mapped onto the (reconciled) Prisma schema. The live DB
// is already populated, so this is primarily a reference / local-bootstrap tool.
//
// Re-running is safe: the script clears the relevant tables first.

import { PrismaClient } from "@prisma/client";
import { jobs, equipment, crew, activity } from "../lib/data";
import { dailyReports } from "../lib/mock-reports";
import type {
  CrewRole,
  CrewStatus as MockCrewStatus,
  EquipmentStatus as MockEquipmentStatus,
  JobStatus as MockJobStatus,
} from "../lib/types";

const prisma = new PrismaClient();

// --- mappings: UI string unions -> DB text values -----------------------------

const jobStatusMap: Record<MockJobStatus, string> = {
  scheduled: "PENDING",
  in_progress: "ACTIVE",
  on_hold: "ON_HOLD",
  completed: "COMPLETE",
};

const equipmentStatusMap: Record<MockEquipmentStatus, string> = {
  available: "AVAILABLE",
  in_use: "IN_USE",
  maintenance: "MAINTENANCE",
};

const crewRoleToUserRole: Record<CrewRole, string> = {
  foreman: "FOREMAN",
  operator: "OPERATOR",
  laborer: "LABOURER",
  surveyor: "OPERATOR",
  mechanic: "OPERATOR",
};

// --- helpers ------------------------------------------------------------------

function userIdForCrew(crewId: string): string {
  return `usr_${crewId}`;
}

function emailForName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${slug}@excavationos.test`;
}

function isActive(status: MockCrewStatus): boolean {
  return status !== "off";
}

// Split a machine name like "CAT 320 Excavator" into make + model.
function makeAndModel(name: string): { make: string; model: string } {
  const parts = name.split(" ");
  return { make: parts[0] ?? name, model: parts[1] ?? "" };
}

async function main() {
  console.log("Seeding database…");

  // Clear existing rows in FK-safe order.
  await prisma.activityEvent.deleteMany();
  await prisma.note.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.crewMember.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  // Map a person's display name to their User id and name.
  const userIdByName = new Map<string, string>();
  for (const member of crew) {
    userIdByName.set(member.name, userIdForCrew(member.id));
  }

  // Users: one per crew member, plus an admin account.
  await prisma.user.createMany({
    data: [
      {
        id: "usr_admin",
        clerkId: "seed_admin",
        name: "Site Admin",
        email: "admin@excavationos.test",
        role: "ADMIN",
      },
      ...crew.map((member) => ({
        id: userIdForCrew(member.id),
        clerkId: `seed_${member.id}`,
        name: member.name,
        email: emailForName(member.name),
        role: crewRoleToUserRole[member.role],
      })),
    ],
  });
  console.log(`  ✓ ${crew.length + 1} users`);

  // Jobs.
  await prisma.job.createMany({
    data: jobs.map((job) => ({
      id: job.id,
      name: job.name,
      client: job.client,
      address: job.site,
      status: jobStatusMap[job.status],
      startDate: new Date(job.startDate),
      endDate: new Date(job.dueDate),
      contractValue: job.value,
      description: job.description,
    })),
  });
  console.log(`  ✓ ${jobs.length} jobs`);

  // Equipment.
  await prisma.equipment.createMany({
    data: equipment.map((machine) => {
      const { make, model } = makeAndModel(machine.name);
      return {
        id: machine.id,
        name: machine.name,
        type: machine.category,
        make,
        model,
        status: equipmentStatusMap[machine.status],
        jobId: machine.assignedJob,
      };
    }),
  });
  console.log(`  ✓ ${equipment.length} equipment`);

  // Crew members.
  await prisma.crewMember.createMany({
    data: crew.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      phone: member.phone,
      certifications: member.certifications,
      active: isActive(member.status),
      jobId: member.assignedJob,
    })),
  });
  console.log(`  ✓ ${crew.length} crew members`);

  // Daily reports.
  await prisma.dailyReport.createMany({
    data: dailyReports.map((report) => ({
      id: report.id,
      jobId: report.jobId,
      authorId: userIdByName.get(report.submittedBy) ?? "usr_admin",
      date: new Date(report.date),
      weather: report.weather,
      workPerformed: report.summary,
      hoursWorked: report.hoursWorked,
      crewCount: report.crewCount,
    })),
  });
  console.log(`  ✓ ${dailyReports.length} daily reports`);

  // Notes (flattened from each job's notes).
  const notes = jobs.flatMap((job) =>
    job.notes.map((note) => ({
      id: note.id,
      jobId: job.id,
      authorId: userIdByName.get(note.author) ?? "usr_admin",
      authorName: note.author,
      content: note.body,
      createdAt: new Date(note.date),
    })),
  );
  await prisma.note.createMany({ data: notes });
  console.log(`  ✓ ${notes.length} notes`);

  // Activity events.
  await prisma.activityEvent.createMany({
    data: activity.map((item) => ({
      id: item.id,
      type: item.kind,
      description: `${item.title} — ${item.detail}`,
      jobId: item.jobId,
      createdAt: new Date(item.timestamp),
    })),
  });
  console.log(`  ✓ ${activity.length} activity events`);

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
