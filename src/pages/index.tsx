"use client"
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import TicketInfo from "@/components/TicketInfo";


export default function Home() {
  const initialStr = useSearchParams().get("ticket") || "";
  const [ticket, setTicket] = useState<string>(initialStr);
  useEffect(() => {
    if (initialStr) {
      setTicket(initialStr);
    }
  }, [initialStr]);

  return (
    <main
      className='flex min-h-screen flex-col items-center justify-between p-24'
    >
      <div className="max-w-5xl w-full font-mono text-sm">
        <div>
          <h1>Iroh Ticket Inspector</h1>
        </div>
        <div className="mt-5 rounded-md shadow-sm ring-1 ring-inset ring-zinc-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 dark:bg-zinc-800">
          <textarea
            className="block h-32 w-full flex-1 resize-none border-0 bg-transparent py-1.5 pl-2 font-space-mono text-zinc-900 placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-200 sm:text-sm sm:leading-6"
            placeholder="paste an iroh ticket"
            value={ticket} onChange={(e) => { setTicket(e.target.value) }}>
          </textarea>
        </div>
        <TicketInfo ticketString={ticket} />
      </div>
    </main>
  );
}