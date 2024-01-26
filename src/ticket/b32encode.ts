const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(input: Uint8Array) {
    const buffer = Buffer.from(input);
    let output = '';
    let bufferIndex = 0;
    let currentByte;
    let nextByte;
    let digit;

    while (bufferIndex < buffer.length) {
        // Current byte
        currentByte = buffer[bufferIndex];

        // Next byte
        nextByte = bufferIndex + 1 < buffer.length ? buffer[bufferIndex + 1] : 0;

        // Process 5 bits at a time
        digit = (currentByte >> 3) & 31;  // first 5 bits of current byte
        output += BASE32_ALPHABET[digit];

        digit = ((currentByte << 2) | (nextByte >> 6)) & 31; // last 3 bits of current byte and first 2 bits of next byte
        output += BASE32_ALPHABET[digit];

        if (bufferIndex + 1 < buffer.length) {
            currentByte = buffer[++bufferIndex];
            digit = (currentByte >> 1) & 31;  // first 4 bits of next byte
            output += BASE32_ALPHABET[digit];

            nextByte = bufferIndex + 1 < buffer.length ? buffer[bufferIndex + 1] : 0;

            digit = ((currentByte << 4) | (nextByte >> 4)) & 31;  // last 4 bits of current byte and first 1 bit of next byte
            output += BASE32_ALPHABET[digit];

            if (bufferIndex + 1 < buffer.length) {
                currentByte = buffer[++bufferIndex];
                digit = ((currentByte << 1) | (nextByte >> 7)) & 31;  // last 7 bits of next byte
                output += BASE32_ALPHABET[digit];

                digit = (currentByte >> 4) & 31;  // first 3 bits of next byte
                output += BASE32_ALPHABET[digit];

                nextByte = bufferIndex + 1 < buffer.length ? buffer[bufferIndex + 1] : 0;

                digit = ((currentByte << 3) | (nextByte >> 5)) & 31;  // last 5 bits of current byte and first 3 bits of next byte
                output += BASE32_ALPHABET[digit];

                digit = nextByte & 31;  // last 5 bits of next byte
                output += BASE32_ALPHABET[digit];

                bufferIndex++;
            }
        }

        bufferIndex++;
    }

    return output.toLowerCase();
}

module.exports = { base32Encode };