import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Invoices live on jobs. Company feed is under Documents. */
export default function InvoicesIndexRedirect() {
  redirect("/dashboard/documents");
}
