import apiClient from "./client";

export interface MaterialAlert {
  id: string;
  name: string;
  currentStock: number;
  status: "Out of Stock" | "Low Stock";
}

export interface DashboardSummary {
  toReceive: number;
  toGive: number;
  currentMonthSales: number;
  currentMonthPurchase: number;
  currentMonthExpense: number;
  totalBalance: number;
  materialAlerts: MaterialAlert[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await apiClient.get<DashboardSummary>("/dashboard/summary");
  return res.data;
}
