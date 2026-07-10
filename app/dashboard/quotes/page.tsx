import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Quotes live on jobs. Company feed is under Documents. */
export default function QuotesIndexRedirect() {
  redirect("/dashboard/documents");
}
