import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, r, g, b, a = 255) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); 
  ihdrData.writeUInt8(6, 9); 
  ihdrData.writeUInt8(0, 10); 
  ihdrData.writeUInt8(0, 11); 
  ihdrData.writeUInt8(0, 12); 

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    
    
    let crc = 0 ^ (-1);
    for (let i = 4; i < 8 + len; i++) {
      let byte = buf[i];
      crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
    }
    crc = (crc ^ (-1)) >>> 0;
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  
  const rowBytes = width * 4;
  const rawData = Buffer.alloc(height * (rowBytes + 1));
  for (let y = 0; y < height; y++) {
    rawData[y * (rowBytes + 1)] = 0; 
    for (let x = 0; x < width; x++) {
      const idx = y * (rowBytes + 1) + 1 + x * 4;
      
      const grad = Math.min(255, Math.floor((y / height) * 40));
      rawData[idx] = Math.min(255, r + grad);
      rawData[idx + 1] = Math.min(255, g + grad);
      rawData[idx + 2] = Math.min(255, b + grad);
      rawData[idx + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pngBuffer = createPNG(512, 512, 14, 28, 66, 255);
fs.writeFileSync('./public/logo.png', pngBuffer);
fs.copyFileSync('./public/favicon.svg', './public/logo.svg');
console.log('Created public/logo.png and public/logo.svg');
