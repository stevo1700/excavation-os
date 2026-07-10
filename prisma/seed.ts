// Seeds the database with the same demo data the UI ships with (lib/data.ts and
// lib/mock-reports.ts), mapped onto the (reconciled) Prisma schema. The live DB
// is already populated, so this is primarily a reference / local-bootstrap tool.
//
// Re-running is safe: the script clears the relevant tables first.

import { Prisma, PrismaClient } from "@prisma/client";
import { jobs, equipment, crew, activity } from "../lib/data";
import { dailyReports } from "../lib/mock-reports";
import { generateQrSvg, qrUrlForTag } from "../lib/qr";
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

// Local totals math, mirroring lib/finance.ts's computeTotals — duplicated
// rather than imported because lib/finance.ts pulls in "@/lib/types" (a path
// alias ts-node can't resolve here without extra config; this file otherwise
// only uses plain relative imports).
function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
function computeTotals(
  items: { quantity: number; unitPrice: number }[],
  taxRatePercent: number,
) {
  const subtotal = round(
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    2,
  );
  const taxRate = round(taxRatePercent / 100, 4);
  const taxAmount = round(subtotal * taxRate, 2);
  const total = round(subtotal + taxAmount, 2);
  return { subtotal, taxRate, taxAmount, total };
}

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

  // Clear existing rows in FK-safe order. Deleting Job cascades away any
  // Quote/Invoice/Payment/QuoteLineItem/InvoiceLineItem rows that reference
  // it, so those don't need explicit deletes here.
  await prisma.activityEvent.deleteMany();
  await prisma.note.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.crewMember.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.catalogItem.deleteMany();
  await prisma.telematicsConnection.deleteMany();

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

  // Equipment. Asset tags come straight from lib/data.ts (the single source
  // of truth, also used as the API's mock fallback); each machine's QR code
  // is generated here from its tag's canonical scan URL.
  const equipmentData = await Promise.all(
    equipment.map(async (machine) => {
      const { make, model } = makeAndModel(machine.name);
      const qrUrl = qrUrlForTag(machine.assetTag);
      const qrSvg = await generateQrSvg(qrUrl);
      return {
        id: machine.id,
        name: machine.name,
        type: machine.category,
        make,
        model,
        status: equipmentStatusMap[machine.status],
        jobId: machine.assignedJob,
        assetTag: machine.assetTag,
        qrUrl,
        qrSvg,
      };
    }),
  );
  await prisma.equipment.createMany({ data: equipmentData });
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

  // --- Catalog: customers, item library, quotes, invoice + payment -----------

  const customers = await Promise.all(
    [
      {
        id: "cust_hollis",
        name: "Hollis Development",
        contactName: "Dana Hollis",
        company: "Hollis Development LLC",
        email: "dana@hollisdevelopment.example",
        phone: "555-0142",
        stage: "Active",
      },
      {
        id: "cust_county",
        name: "County Public Works",
        contactName: "Marcus Webb",
        company: "County Public Works Dept.",
        email: "mwebb@county.example.gov",
        phone: "555-0188",
        stage: "Active",
      },
      {
        id: "cust_meridian",
        name: "Meridian Real Estate",
        contactName: "Priya Anand",
        company: "Meridian Real Estate Group",
        email: "priya@meridianre.example",
        phone: "555-0210",
        stage: "Lead",
      },
    ].map((data) => prisma.customer.create({ data })),
  );
  console.log(`  ✓ ${customers.length} customers`);

  const catalogItemsData = [
    {
      code: "EX-HOUR",
      name: "Excavator operating hour",
      unit: "hr",
      unitPrice: 185,
      category: "EQUIPMENT",
    },
    {
      code: "DZ-HOUR",
      name: "Dozer operating hour",
      unit: "hr",
      unitPrice: 165,
      category: "EQUIPMENT",
    },
    {
      code: "LD-HOUR",
      name: "Wheel loader operating hour",
      unit: "hr",
      unitPrice: 145,
      category: "EQUIPMENT",
    },
    {
      code: "TRUCK-HOUR",
      name: "Dump truck haul, hourly",
      unit: "hr",
      unitPrice: 120,
      category: "EQUIPMENT",
    },
    {
      code: "DEMO-DAY",
      name: "Demolition crew day rate",
      unit: "day",
      unitPrice: 1200,
      category: "LABOR",
    },
    {
      code: "LABOR-HOUR",
      name: "General laborer",
      unit: "hr",
      unitPrice: 65,
      category: "LABOR",
    },
    {
      code: "OP-HOUR",
      name: "Equipment operator",
      unit: "hr",
      unitPrice: 95,
      category: "LABOR",
    },
    {
      code: "FILL-TON",
      name: "Structural fill material",
      unit: "ton",
      unitPrice: 28,
      category: "MATERIAL",
    },
    {
      code: "GRAVEL-TON",
      name: "3/4in gravel",
      unit: "ton",
      unitPrice: 22,
      category: "MATERIAL",
    },
    {
      code: "SUB-SURVEY",
      name: "Land survey subcontract",
      unit: "each",
      unitPrice: 2200,
      category: "SUBCONTRACT",
    },
  ] as const;
  const catalogItems = await Promise.all(
    catalogItemsData.map((data) => prisma.catalogItem.create({ data })),
  );
  const catalogItemByCode = new Map(catalogItems.map((c) => [c.code, c]));
  console.log(`  ✓ ${catalogItems.length} catalog items`);

  // Quote 1: DRAFT, Cedar Heights septic excavation (JOB-1046).
  const exHour = catalogItemByCode.get("EX-HOUR")!;
  const laborHour = catalogItemByCode.get("LABOR-HOUR")!;
  const draftItems = [
    {
      catalogItem: exHour,
      description: exHour.name,
      quantity: 24,
      unitPrice: exHour.unitPrice.toNumber(),
    },
    {
      catalogItem: laborHour,
      description: laborHour.name,
      quantity: 40,
      unitPrice: laborHour.unitPrice.toNumber(),
    },
  ];
  const draftTotals = computeTotals(draftItems, 8.25);
  const draftQuote = await prisma.quote.create({
    data: {
      title: "Cedar Heights septic excavation",
      jobId: "JOB-1046",
      customerId: customers[1].id,
      quoteNumber: "QUO-2026-0001",
      status: "DRAFT",
      lineItems: draftItems.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: round(i.quantity * i.unitPrice, 2),
      })),
      subtotal: draftTotals.subtotal,
      taxRate: draftTotals.taxRate,
      taxAmount: draftTotals.taxAmount,
      total: draftTotals.total,
      validUntil: new Date("2026-08-01"),
      lineItemRows: {
        create: draftItems.map((i, index) => ({
          catalogItemId: i.catalogItem.id,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: round(i.quantity * i.unitPrice, 2),
          sortOrder: index,
        })),
      },
    },
  });

  // Quote 2: APPROVED, Riverside foundation dig (JOB-1042) — will be converted.
  const dzHour = catalogItemByCode.get("DZ-HOUR")!;
  const fillTon = catalogItemByCode.get("FILL-TON")!;
  const opHour = catalogItemByCode.get("OP-HOUR")!;
  const approvedItems = [
    {
      catalogItem: exHour,
      description: exHour.name,
      quantity: 60,
      unitPrice: exHour.unitPrice.toNumber(),
    },
    {
      catalogItem: dzHour,
      description: dzHour.name,
      quantity: 20,
      unitPrice: dzHour.unitPrice.toNumber(),
    },
    {
      catalogItem: fillTon,
      description: fillTon.name,
      quantity: 150,
      unitPrice: fillTon.unitPrice.toNumber(),
    },
    {
      catalogItem: opHour,
      description: opHour.name,
      quantity: 60,
      unitPrice: opHour.unitPrice.toNumber(),
    },
  ];
  const approvedTotals = computeTotals(approvedItems, 8.25);
  const approvedQuote = await prisma.quote.create({
    data: {
      title: "Phase 1 excavation",
      jobId: "JOB-1042",
      customerId: customers[0].id,
      quoteNumber: "QUO-2026-0002",
      status: "APPROVED",
      lineItems: approvedItems.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: round(i.quantity * i.unitPrice, 2),
      })),
      subtotal: approvedTotals.subtotal,
      taxRate: approvedTotals.taxRate,
      taxAmount: approvedTotals.taxAmount,
      total: approvedTotals.total,
      validUntil: new Date("2026-07-31"),
      lineItemRows: {
        create: approvedItems.map((i, index) => ({
          catalogItemId: i.catalogItem.id,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: round(i.quantity * i.unitPrice, 2),
          sortOrder: index,
        })),
      },
    },
  });
  console.log("  ✓ 2 quotes (1 draft, 1 approved)");

  // Invoice converted from the approved quote, with one partial payment.
  const invoice = await prisma.invoice.create({
    data: {
      jobId: approvedQuote.jobId,
      customerId: approvedQuote.customerId,
      quoteId: approvedQuote.id,
      invoiceNumber: "INV-2026-0001",
      status: "PARTIAL",
      lineItems: approvedQuote.lineItems as Prisma.InputJsonValue,
      subtotal: approvedQuote.subtotal,
      taxRate: approvedQuote.taxRate,
      taxAmount: approvedQuote.taxAmount,
      total: approvedQuote.total,
      amountPaid: round(approvedTotals.total * 0.4, 2),
      dueDate: new Date("2026-08-15"),
      lineItemRows: {
        create: approvedItems.map((i, index) => ({
          catalogItemId: i.catalogItem.id,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: round(i.quantity * i.unitPrice, 2),
          sortOrder: index,
        })),
      },
      payments: {
        create: [
          {
            amount: round(approvedTotals.total * 0.4, 2),
            method: "TRANSFER",
            reference: "WIRE-88213",
            notes: "Deposit on Phase 1 excavation.",
          },
        ],
      },
    },
  });
  console.log(
    "  ✓ 1 invoice (partial payment) converted from the approved quote",
  );

  void draftQuote;
  void invoice;

  // --- Telematics: one disconnected connection per OEM ------------------------

  await prisma.telematicsConnection.createMany({
    data: (["KOMATSU", "CASE", "BOBCAT"] as const).map((oem) => ({
      oem,
      status: "DISCONNECTED",
    })),
  });
  console.log("  ✓ 3 telematics connections (disconnected)");

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
