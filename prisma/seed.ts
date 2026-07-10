// Seeds the database with the same demo data the UI ships with (lib/data.ts and
// lib/mock-reports.ts), mapped onto the Prisma schema. Running `prisma db seed`
// gives a real database whose contents match exactly what the dashboard shows.
//
// Re-running is safe: the script clears the relevant tables first.

import {
  PrismaClient,
  UserRole,
  JobStatus,
  EquipmentStatus,
  CrewStatus,
} from "@prisma/client";
import { jobs, equipment, crew, activity } from "../lib/data";
import { dailyReports } from "../lib/mock-reports";
import type {
  CrewRole,
  CrewStatus as MockCrewStatus,
  EquipmentStatus as MockEquipmentStatus,
  JobStatus as MockJobStatus,
} from "../lib/types";

const prisma = new PrismaClient();

// --- enum mappings: UI string unions -> Prisma enums --------------------------

const jobStatusMap: Record<MockJobStatus, JobStatus> = {
  scheduled: JobStatus.SCHEDULED,
  in_progress: JobStatus.IN_PROGRESS,
  on_hold: JobStatus.ON_HOLD,
  completed: JobStatus.COMPLETED,
};

const equipmentStatusMap: Record<MockEquipmentStatus, EquipmentStatus> = {
  available: EquipmentStatus.AVAILABLE,
  in_use: EquipmentStatus.IN_USE,
  maintenance: EquipmentStatus.MAINTENANCE,
};

const crewStatusMap: Record<MockCrewStatus, CrewStatus> = {
  on_site: CrewStatus.ON_SITE,
  available: CrewStatus.AVAILABLE,
  off: CrewStatus.OFF,
};

const crewRoleToUserRole: Record<CrewRole, UserRole> = {
  foreman: UserRole.FOREMAN,
  operator: UserRole.OPERATOR,
  laborer: UserRole.LABOURER,
  surveyor: UserRole.OPERATOR,
  mechanic: UserRole.OPERATOR,
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

// Estimated monthly engine hours, derived from current status (the mock data
// only tracks lifetime hours, so this is a reasonable stand-in).
function monthlyHours(status: MockEquipmentStatus): number {
  switch (status) {
    case "in_use":
      return 160;
    case "maintenance":
      return 20;
    default:
      return 55;
  }
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

  // Map a person's display name to their User id, so jobs/notes/reports can be
  // linked by the names used throughout the mock data.
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
        role: UserRole.ADMIN,
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
      site: job.site,
      status: jobStatusMap[job.status],
      startDate: new Date(job.startDate),
      estCompletion: new Date(job.dueDate),
      value: job.value,
      description: job.description,
      color: job.color,
      foremanId: userIdByName.get(job.foreman) ?? null,
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
        category: machine.category,
        make,
        model,
        status: equipmentStatusMap[machine.status],
        hoursLogged: monthlyHours(machine.status),
        jobId: machine.assignedJob,
      };
    }),
  });
  console.log(`  ✓ ${equipment.length} equipment`);

  // Crew members (linked to their User account).
  await prisma.crewMember.createMany({
    data: crew.map((member) => ({
      id: member.id,
      userId: userIdForCrew(member.id),
      name: member.name,
      role: member.role,
      phone: member.phone,
      status: crewStatusMap[member.status],
      jobId: member.assignedJob,
    })),
  });
  console.log(`  ✓ ${crew.length} crew members`);

  // Daily reports.
  await prisma.dailyReport.createMany({
    data: dailyReports.map((report) => ({
      id: report.id,
      jobId: report.jobId,
      submittedById: userIdByName.get(report.submittedBy) ?? "usr_admin",
      date: new Date(report.date),
      weather: report.weather,
      summary: report.summary,
      hoursWorked: report.hoursWorked,
    })),
  });
  console.log(`  ✓ ${dailyReports.length} daily reports`);

  // Notes (flattened from each job's notes).
  const notes = jobs.flatMap((job) =>
    job.notes.map((note) => ({
      id: note.id,
      jobId: job.id,
      authorId: userIdByName.get(note.author) ?? "usr_admin",
      body: note.body,
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
