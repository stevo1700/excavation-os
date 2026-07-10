import { redirect } from "next/navigation";

/** Legacy path — catalog lives at /dashboard/catalog now. */
export default function CatalogItemsRedirect() {
  redirect("/dashboard/catalog");
}
