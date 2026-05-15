import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { TickerForm } from "../../TickerForm";

export const dynamic = "force-dynamic";

export default async function EditTickerPage({ params }: { params: { id: string } }) {
  let message: Awaited<ReturnType<typeof api.ticker.get>>;

  try {
    message = await api.ticker.get(params.id);
  } catch {
    notFound();
  }

  return (
    <>
      <div className="page-header">
        <h1>Ticker-Nachricht bearbeiten</h1>
      </div>
      <TickerForm initial={message} />
    </>
  );
}
