import { redirect } from "next/navigation";
export default async function OrderPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const { payment } = await searchParams;
  redirect(payment === "cancelled" ? "/register?payment=cancelled" : "/register");
}
