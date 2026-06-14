import { ExpenseProvider } from "@/context/ExpenseContext";

export default function ExpenseLayout({ children }: { children: React.ReactNode }) {
  return <ExpenseProvider>{children}</ExpenseProvider>;
}
