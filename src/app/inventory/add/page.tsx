import { Suspense } from "react";
import { AddItemPage } from "@/components/inventory/AddItemPage";

export default function Page() {
  return (
    <Suspense>
      <AddItemPage />
    </Suspense>
  );
}
