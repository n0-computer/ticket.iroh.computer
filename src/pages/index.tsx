"use client"
import React, { useState } from "react";
import { parse } from '@/ticket/ticket';


export default function Home() {
  const [ticket, setTicket] = useState("");

  let parsed = undefined;
  try {
    parsed = parse(ticket);
  } catch (e) {
    console.error(e);
  }

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24`}
    >
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1>Iroh Ticket Inspector</h1>
        <textarea placeholder="paste an iroh ticket" value={ticket} onChange={(e) => { setTicket(e.target.value) }}>
        </textarea>
        {parsed && (
          <p>{JSON.stringify(parsed)}</p>
        )}
      </div>
    </main>
  );
}
