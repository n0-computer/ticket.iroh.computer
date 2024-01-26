const base32Decode = require('base32-decode');
const { base32Encode } = require('./b32encode');

enum TicketType {
  node = 'node',
  blob = 'blob',
  doc = 'doc',
}

interface Ticket {
  type: TicketType;
}

type NodeTicket = {
  type: TicketType.node;
  node?: NodeAddr;
}

type NodeAddr = {
  node_id: String;
  info: AddrInfo;
}

type AddrInfo = {
  derp_url?: String;
  direct_addresses: String[];
}

enum BlobFormat {
  HashSeq = 'HashSeq',
  Raw = 'Raw',
}

type BlobTicket = {
  type: TicketType.blob;
  node?: NodeAddr;
  format: BlobFormat;
  hash: string;
}

enum DocCapability {
  Read = 'Read',
  Write = 'Write',
}

type DocTicket = {
  type: TicketType.doc;
  capability: DocCapability;
  namespace: string;
  secret?: string;
  nodes: NodeAddr[];
}

export function parse(encodedData: string): Ticket {
  const decoder = new PostcardDecoder(encodedData)
  return decoder.decode()
}

class PostcardDecoder {
  private type: TicketType;
  private buffer: Uint8Array;
  private offset: number = 0;
  private textDecoder: TextDecoder;

  constructor(encodedData: string) {
    if (encodedData.startsWith(TicketType.node)) {
      encodedData = encodedData.slice(TicketType.node.length)
      this.type = TicketType.node
    } else if (encodedData.startsWith(TicketType.blob)) {
      encodedData = encodedData.slice(TicketType.blob.length)
      this.type = TicketType.blob
    } else if (encodedData.startsWith(TicketType.doc)) {
      encodedData = encodedData.slice(TicketType.doc.length)
      this.type = TicketType.doc
    } else {
      throw "unknown ticket type"
    }

    this.textDecoder = new TextDecoder('utf-8');
    const decoded = base32Decode(encodedData.toUpperCase(), 'RFC4648', { loose: true });
    this.buffer = new Uint8Array(decoded);
    console.log(this.buffer)
  }

  private readNodeTicket(): NodeTicket {
    const variant: number = this.readU8();
    if (variant !== 0) {
        throw new Error('Expected variant 0');
    }

    const addr = this.readNodeAddr();

    return {
      type: TicketType.node,
      node: addr,
    }
  }

  private readBlobTicket(): BlobTicket {
    let variant: number = this.readU8();
    if (variant !== 0) {
        throw new Error('Expected variant 0');
    }

    const addr = this.readNodeAddr();
    const format = this.readBlobFormat();
    const hash = this.readHash();

    return {
      type: TicketType.blob,
      node: addr,
      format,
      hash,
    }
  }

  private readDocumentTicket(): DocTicket {
    let variant: number = this.readU8();
    if (variant !== 0) {
        throw new Error('Expected variant 0');
    }

    const cap = this.readCapability();
    let namespace = '';
    let secret = undefined;
    switch (cap) {
      case DocCapability.Read:
        // TODO(b5) - this shouldn't use readHash
        // it's just close enough for now. readHash should
        // check for the correct length
        namespace = this.readHash();
        break;
      case DocCapability.Write:
        // TODO(b5) - this shouldn't use readHash
        // it's just close enough for now. readHash should
        // check for the correct length
        secret = this.readHash();
        namespace = this.readHash();
        break;
      default:
        throw new Error(`Unknown capability: ${cap}`);
    }
    const addrs = this.readNodeAddrs()

    return {
      type: TicketType.doc,
      capability: cap,
      namespace,
      secret,
      nodes: addrs,
    }
  }

  private readCapability(): DocCapability {
    const int = this.readVarint();
    switch (int) {
      case 0:
        return DocCapability.Write
      case 1:
        return DocCapability.Read
      default:
        throw new Error(`Unknown capability: ${int}`);
    }
  }

  private readBlobFormat(): BlobFormat {
    const int = this.readVarint();
    switch (int) {
      case 0:
        return BlobFormat.Raw
      case 1:
        return BlobFormat.HashSeq
      default:
        throw new Error(`Unknown blob format: ${int}`);
    }
  }

  private readNodeAddrs(): NodeAddr[] {
    const numAddrs = this.readVarint();
    console.log('found nodes:', numAddrs);
    if (numAddrs > 0) {
      const addrs: NodeAddr[] = [];
      for (let i = 0; i < numAddrs; i++) {
        const addr = this.readNodeAddr();
        addrs.push(addr);
      }
      return addrs;
    }

    return []
  }

  private readNodeAddr(): NodeAddr {
    // const nodeIdLen = this.readVarint();
    const nodeId = this.readNodeID();
    console.log('nodeID:', nodeId);
    const info = this.readAddrInfo();
    console.log('info:', info);
    return {
      node_id: `${nodeId}`,
      info: info,
    }
  }
  
  private readNodeID(): string {
    const key = this.buffer.slice(this.offset, this.offset + 32);
    this.offset += 32;
    return base32Encode(key);
  }
  
  private readAddrInfo(): AddrInfo {
    const derpUrlExists = this.readOption();
    let derpUrl = undefined;
    if (derpUrlExists) {
      derpUrl = this.readString();
      console.log('derpUrl exists!:', derpUrl);
    }

    const directAddresses = this.readAddresses();
    console.log('directAddresses:', directAddresses);
    return {
      derp_url: derpUrl,
      direct_addresses: directAddresses,
    }
  }

  private readAddresses(): string[] {
    const numAddresses = this.readVarint();
    console.log('numAddresses:', numAddresses);
    if (numAddresses > 0) {
      const addresses: string[] = [];
      for (let i = 0; i < numAddresses; i++) {
        const addr = this.readSocketAddr();
        addresses.push(addr);
      }
      return addresses;
    }

    return []
  }

  private readSocketAddr(): string {
    const ipVersion = this.readVarint();
    switch (ipVersion) {
      case 0:
        return this.readIpv4();
      case 1:
        return this.readIpv6();
      default:
        throw new Error(`Unknown IP version: ${ipVersion}`);
    }
  }

  private readIpv4(): string {
    const ip = this.buffer.slice(this.offset, this.offset + 4);
    this.offset += 4;
    const port = this.readVarint();
    return `${ip.join('.')}:${port}`;
  }

  private readIpv6(): string {
    const ip = this.buffer.slice(this.offset, this.offset + 16);
    this.offset += 16;
    const port = this.readVarint();
    return `[${ip.join(':')}]:${port}`;
  }

  private readHash(): string {
    const hash = this.buffer.slice(this.offset, this.offset + 32);
    this.offset += 32;
    // return base32Encode(hash, 'RFC4648', { padding: false }).toLowerCase();
    return base32Encode(hash);
  }

  private readOption(): boolean {
    return this.readU8() === 1;
  }
  
  private readString(): string {
    let length = this.readVarint();
    const str = this.textDecoder.decode(this.buffer.slice(this.offset, this.offset + length));
    this.offset += length;
    return str
  }

  private readU32(): number {
    return this.readVarint();
  }

  private readU8(): number  {
    return this.buffer[this.offset++]
  }

  // Read a varint from the buffer
  private readVarint(): number {
      let num = 0;
      let shift = 0;

      while (true) {
          const byte = this.buffer[this.offset++];
          num |= (byte & 0x7F) << shift; // Mask the MSB and shift the remaining bits
          if ((byte & 0x80) === 0) break; // If MSB is 0, this is the last byte
          shift += 7;
      }

      return num;
  }

  // Main method to decode the entire data
  public decode(): any {
      // Implement the logic to read the serialized data
      // according to the structure it was serialized in.
      // This is a placeholder function.
      switch (this.type) {
        case TicketType.node:
          return this.readNodeTicket()
        case TicketType.blob:
          return this.readBlobTicket()
        case TicketType.doc:
          return this.readDocumentTicket()
      }
  }
}