"use client";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db/schema";
import { partyBalance } from "@/db/ledger";
import { fmtINR } from "@/lib/inr";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui/primitives";
import { Plus, Users } from "lucide-react";

function PartyRow({ id, name, gstin }: { id: number; name: string; gstin?: string }) {
  const bal = useLiveQuery(() => partyBalance(id), [id]);
  return (
    <Link href={`/parties/view?id=${id}`}>
      <Card className="flex items-center justify-between hover:bg-slate-50">
        <div className="flex items-center gap-3">
          <Users className="text-slate-500" size={20} />
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-slate-500">{gstin || "—"}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${(bal ?? 0) > 0 ? "text-red-700" : (bal ?? 0) < 0 ? "text-green-700" : ""}`}>
            {bal !== undefined ? fmtINR(Math.abs(bal)) : "…"}
          </p>
          <p className="text-xs text-slate-500">
            {bal === undefined ? "" : bal > 0 ? "To receive" : bal < 0 ? "Advance" : "Settled"}
          </p>
        </div>
      </Card>
    </Link>
  );
}

export default function PartiesPage() {
  const parties = useLiveQuery(() => db.parties.orderBy("name").toArray(), []);
  return (
    <div>
      <PageHeader
        title="Parties"
        action={
          <Link href="/parties/new">
            <Button size="sm"><Plus size={16} /> Add</Button>
          </Link>
        }
      />
      {parties && parties.length === 0 && (
        <EmptyState
          message="No parties yet."
          action={<Link href="/parties/new"><Button>Add your first party</Button></Link>}
        />
      )}
      <div className="space-y-2">
        {parties?.map((p) => <PartyRow key={p.id} id={p.id!} name={p.name} gstin={p.gstin} />)}
      </div>
    </div>
  );
}
