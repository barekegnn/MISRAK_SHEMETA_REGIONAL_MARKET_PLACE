import { redirect } from "next/navigation";

/** Product-first listing removed — browse shops by city, then shop shelves. */
export default function ProductsPage() {
  redirect("/shops");
}
