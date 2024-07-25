import React from 'react';
import { parse, Ticket, NodeTicket, BlobTicket, DocTicket, TicketType, NodeAddr, AddrInfo } from '@/ticket/ticket';

type Props = {
  ticketString: string 
}

export default function TicketInfo({ ticketString }: Props) {
  if (ticketString.trim() === "") return null;

  let parsed: Ticket | undefined = undefined;
  let error = undefined;
  try {
    parsed = parse(ticketString);
  } catch (e) {
    error = e;
  }

  switch (parsed?.type) {
    case TicketType.node:
      return <NodeTicket ticket={parsed as NodeTicket} />
    case TicketType.blob:
      return <BlobTicket ticket={parsed as BlobTicket} />
    case TicketType.doc:
      return <DocTicket ticket={parsed as DocTicket} />
    default:
      return <Error />
  }

}

function Error() {
  return (
    <div className="text-red-500">
      <p>Invalid ticket</p>
    </div>
  )
}

function NodeTicket({ ticket }: { ticket: NodeTicket }) {
  return (
    <div className='mt-5'>
      <h3 className='text-xl'>Node Ticket</h3>
      {ticket.node && (<NodeInfo node={ticket.node} />)}
      {!ticket.node && (<p>This ticket contains no node info.</p>)}
    </div>
  )
}

function BlobTicket({ ticket }: { ticket: BlobTicket }) {
  return (
    <div className='mt-5'>
      <h3 className='text-xl'>Blob Ticket</h3>
      <div className='mt-2'>
        <p className='text-sm text-zinc-500'>Hash</p>
        <p className='text-sm'>{ticket.hash}</p>
      </div>

      <div className='mt-2'>
        <p className='text-sm text-zinc-500'>Format</p>
        <p className='text-sm'>{ticket.format}</p>
      </div>

      {ticket.node && (<NodeInfo node={ticket.node} />)}
      {!ticket.node && (<p>This ticket contains no node info.</p>)}
    </div>
  )
}

function DocTicket({ ticket }: { ticket: DocTicket }) {
  return (
    <div className='mt-5'>
      <h3 className='text-xl'>Document Ticket</h3>
      <div className='mt-2'>
        <p className='text-sm text-zinc-500'>Document ID</p>
        <p className='text-sm'>{ticket.namespace}</p>
      </div>

      <div className='mt-2'>
        <p className='text-sm text-zinc-500'>Capability</p>
        <p className='text-sm'>{ticket.capability}</p>
      </div>

      <div className='mt-5'>
        <h3 className='text-lg'>{ticket.nodes.length} Node{(ticket.nodes.length !== 1) && 's'}:</h3>
        {ticket.nodes.map((node, i) => (<NodeInfo key={i} node={node} />))}
      </div>
    </div>
  )
}

function NodeInfo({ node }: { node: NodeAddr }) {
  return (
    <div className='mt-5'>
      <h4 className='text-sm text-zinc-500 text-bold'>Node Info</h4>
      <div className='mt-2'>
        <p className='text-sm text-zinc-500'>Node ID</p>
        <p className='text-sm'>{node.node_id}</p>
      </div>
      <AddrInfo info={node.info} />
    </div>
  )
}

function AddrInfo({ info } : { info: AddrInfo }) {
  return (
    <div className='mt-5'>
      <div className='mt-2'>
        <p className='text-sm text-zinc-500'>RELAY URL</p>
        <p className='text-sm'>{info.derp_url}</p>
      </div>
      <div className='mt-2'>
        <p className='text-sm text-zinc-500'>Direct Addresses</p>
        <ul className='text-sm'>
          {info.direct_addresses.map((addr, i) => (
            <li key={i}>{addr}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
