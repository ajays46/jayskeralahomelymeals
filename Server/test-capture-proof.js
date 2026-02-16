/**
 * Quick test for POST /api/delivery-executives/capture-proof
 * Run from Server folder: node test-capture-proof.js
 * Requires server to be running (e.g. npm run dev) and default port 5000.
 */

const payload = {
  session: 'breakfast',
  stop: {
    Stop_No: 2,
    Delivery_Name: 'Test Customer',
    Location: '123 Main St, City 683565',
    Packages: '3',
    delivery_note: 'Ring the bell twice',
  },
  options: {
    preDeliveryUploaded: false,
    marked: true,
    photoUploaded: true,
    locationUpdated: false,
  },
};

const baseUrl = process.env.API_URL || 'http://localhost:5000';

async function test() {
  console.log('POST', baseUrl + '/api/delivery-executives/capture-proof');
  const res = await fetch(baseUrl + '/api/delivery-executives/capture-proof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const contentType = res.headers.get('content-type') || '';
  const isPng = contentType.includes('image/png');

  if (!res.ok) {
    const text = await res.text();
    console.error('Error', res.status, text);
    process.exit(1);
  }

  if (!isPng) {
    console.error('Expected image/png, got', contentType);
    process.exit(1);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const fs = await import('fs');
  const outPath = 'capture-proof-test.png';
  fs.writeFileSync(outPath, buf);
  console.log('OK – saved', buf.length, 'bytes to', outPath);
}

test().catch((e) => {
  console.error(e);
  process.exit(1);
});
