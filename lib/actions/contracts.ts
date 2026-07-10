"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logActionError } from "@/lib/log-error";

export interface ContractTemplateView {
  id: string;
  name: string;
  description: string | null;
  body: string;
  active: boolean;
  updatedAt: string;
}

export interface JobContractView {
  id: string;
  jobId: string;
  templateId: string | null;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  templateName: string | null;
}

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function getContractTemplates(
  activeOnly = false,
): Promise<ContractTemplateView[]> {
  try {
    const rows = await prisma.contractTemplate.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { name: "asc" },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      body: r.body,
      active: r.active,
      updatedAt: r.updatedAt.toISOString(),
    }));
  } catch (error) {
    logActionError("getContractTemplates", error);
    return [];
  }
}

export async function getContractTemplate(
  id: string,
): Promise<ContractTemplateView | null> {
  try {
    const r = await prisma.contractTemplate.findUnique({ where: { id } });
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      body: r.body,
      active: r.active,
      updatedAt: r.updatedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function createContractTemplate(
  formData: FormData,
): Promise<void> {
  const name = field(formData, "name");
  const body = field(formData, "body");
  if (!name || !body) throw new Error("Name and body are required.");

  const created = await prisma.contractTemplate.create({
    data: {
      name,
      description: field(formData, "description") || null,
      body,
      active: formData.getAll("active").includes("true"),
    },
  });
  revalidatePath("/dashboard/contracts");
  redirect(`/dashboard/contracts/${created.id}`);
}

export async function updateContractTemplate(
  id: string,
  formData: FormData,
): Promise<void> {
  const name = field(formData, "name");
  const body = field(formData, "body");
  if (!name || !body) throw new Error("Name and body are required.");

  await prisma.contractTemplate.update({
    where: { id },
    data: {
      name,
      description: field(formData, "description") || null,
      body,
      active: formData.getAll("active").includes("true"),
    },
  });
  revalidatePath("/dashboard/contracts");
  revalidatePath(`/dashboard/contracts/${id}`);
  redirect(`/dashboard/contracts/${id}`);
}

export async function deleteContractTemplate(id: string): Promise<void> {
  await prisma.contractTemplate.delete({ where: { id } });
  revalidatePath("/dashboard/contracts");
  redirect("/dashboard/contracts");
}

/** Merge {{placeholders}} with job fields. */
export async function fillContractTemplate(
  body: string,
  vars: Record<string, string>,
): Promise<string> {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const v = vars[key];
    return v != null && v !== "" ? v : `{{${key}}}`;
  });
}

export async function getJobContracts(
  jobId: string,
): Promise<JobContractView[]> {
  try {
    const rows = await prisma.jobContract.findMany({
      where: { jobId },
      include: { template: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => ({
      id: r.id,
      jobId: r.jobId,
      templateId: r.templateId,
      title: r.title,
      body: r.body,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      templateName: r.template?.name ?? null,
    }));
  } catch (error) {
    logActionError("getJobContracts", error);
    return [];
  }
}

/**
 * Apply a template to a job: merge placeholders and create a JobContract draft.
 */
export async function applyContractTemplate(
  jobId: string,
  templateId: string,
): Promise<string> {
  const [job, template] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId } }),
    prisma.contractTemplate.findUnique({ where: { id: templateId } }),
  ]);
  if (!job) throw new Error("Job not found.");
  if (!template || !template.active) throw new Error("Template not found.");

  const site =
    [job.address, job.city, job.state].filter(Boolean).join(", ") || "—";
  const filled = await fillContractTemplate(template.body, {
    job_name: job.name,
    client: job.client,
    site,
    value: String(job.contractValue ?? 0),
    date: new Date().toISOString().slice(0, 10),
    status: job.status,
  });

  const contract = await prisma.jobContract.create({
    data: {
      jobId,
      templateId: template.id,
      title: template.name,
      body: filled,
      status: "DRAFT",
    },
  });

  revalidatePath(`/dashboard/jobs/${jobId}`);
  revalidatePath("/dashboard/contracts");
  return contract.id;
}

export async function applyContractTemplateForm(
  jobId: string,
  formData: FormData,
): Promise<void> {
  const templateId = field(formData, "templateId");
  if (!templateId) return;
  await applyContractTemplate(jobId, templateId);
}

export async function updateJobContractStatus(
  contractId: string,
  status: string,
): Promise<void> {
  const row = await prisma.jobContract.update({
    where: { id: contractId },
    data: { status },
  });
  revalidatePath(`/dashboard/jobs/${row.jobId}`);
}

export async function updateJobContractStatusForm(
  contractId: string,
  formData: FormData,
): Promise<void> {
  const status = field(formData, "status") || "DRAFT";
  await updateJobContractStatus(contractId, status);
}

export async function deleteJobContract(contractId: string): Promise<void> {
  const row = await prisma.jobContract.delete({ where: { id: contractId } });
  revalidatePath(`/dashboard/jobs/${row.jobId}`);
}

export async function deleteJobContractForm(
  contractId: string,
  _formData?: FormData,
): Promise<void> {
  await deleteJobContract(contractId);
}
