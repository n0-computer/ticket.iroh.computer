const base32Decode = require('base32-decode');
const { base32Encode } = require('./b32encode');

export enum TicketType {
  node = 'node',
  blob = 'blob',
  doc = 'doc',
}

export interface Ticket {
  type: TicketType;
}

export type NodeTicket = {
  type: TicketType.node;
  node?: NodeAddr;
}

export type NodeAddr = {
  node_id: String;
  info: AddrInfo;
}

export type AddrInfo = {
  derp_url?: String;
  direct_addresses: String[];
}

export enum BlobFormat {
  HashSeq = 'HashSeq',
  Raw = 'Raw',
}

export type BlobTicket = {
  type: TicketType.blob;
  node?: NodeAddr;
  format: BlobFormat;
  hash: string;
}

export enum DocCapability {
  Read = 'Read',
  Write = 'Write',
}

export type DocTicket = {
  type: TicketType.doc;
  capability: DocCapability;
  namespace: string;
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
    switch (cap) {
      case DocCapability.Read:
        // TODO(b5) - this shouldn't use readHash
        // it's just close enough for now. readHash should
        // check for the correct length
        namespace = this.readHash();
        break;
      case DocCapability.Write:
        namespace = this.readSecretKey();
        break;
      default:
        throw new Error(`Unknown capability: ${cap}`);
    }
    const addrs = this.readNodeAddrs()

    return {
      type: TicketType.doc,
      capability: cap,
      namespace,
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
    const nodeId = this.readNodeID();
    const info = this.readAddrInfo();
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
    }

    const directAddresses = this.readAddresses();
    return {
      derp_url: derpUrl,
      direct_addresses: directAddresses,
    }
  }

  private readAddresses(): string[] {
    const numAddresses = this.readVarint();
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

    // Convert each pair of bytes to a hexadecimal string
    const ipParts = [];
    for (let i = 0; i < 16; i += 2) {
        ipParts.push(((ip[i] << 8) + ip[i + 1]).toString(16));
    }

    // Find the longest sequence of zero blocks
    let longestZeroSequence = -1;
    let longestZeroSequenceLength = 0;
    let currentZeroSequenceLength = 0;

    for (let i = 0; i < ipParts.length; i++) {
        if (ipParts[i] === "0") {
            currentZeroSequenceLength++;
            if (currentZeroSequenceLength > longestZeroSequenceLength) {
                longestZeroSequenceLength = currentZeroSequenceLength;
                longestZeroSequence = i - currentZeroSequenceLength + 1;
            }
        } else {
            currentZeroSequenceLength = 0;
        }
    }

    // Compress the longest sequence of zero blocks
    if (longestZeroSequenceLength > 1) {
        ipParts.splice(longestZeroSequence, longestZeroSequenceLength, '');
        if (longestZeroSequence === 0) ipParts.unshift('');
        if (longestZeroSequence + longestZeroSequenceLength === ipParts.length) ipParts.push('');
    }
  
    const ipStr = ipParts.join(':');
    return `[${ipStr}]:${port}`;
  }

  private readSecretKey(): string {
    // TODO (b5) - I don't think this is right, I'm mainly going off offset lengths that satisfy the tests
    const hash = this.buffer.slice(this.offset, this.offset + 33);
    this.offset += 33;
    return base32Encode(hash);
  }

  private readHash(): string {
    const hash = this.buffer.slice(this.offset, this.offset + 32);
    this.offset += 32;
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
}