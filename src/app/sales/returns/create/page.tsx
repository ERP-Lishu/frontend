import { Suspense } from "react";
import { CreateReturnPage } from "@/components/sales/CreateReturnPage";

export default function Page() {
  return (
    <Suspense>
      <CreateReturnPage type="sales" />
    </Suspense>
  );
}
