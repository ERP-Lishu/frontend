import { Suspense } from "react";
import { CreatePurchaseBillPage } from "@/components/purchase/CreatePurchaseBillPage";

export default function Page() {
  return (
    <Suspense>
      <CreatePurchaseBillPage />
    </Suspense>
  );
}
