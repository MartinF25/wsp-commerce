import { TickerForm } from "../TickerForm";

export const dynamic = "force-dynamic";

export default function NewTickerPage() {
  return (
    <>
      <div className="page-header">
        <h1>Neue Ticker-Nachricht</h1>
      </div>
      <TickerForm />
    </>
  );
}
