import { redirect } from "next/navigation";

/** Quotes/invoices live on jobs. Company feed is under Documents. */
export default function RedirectPage() {
  redirect("/dashboard/documents");
}
