const PINATA_API_URL = "https://api.pinata.cloud";

function getKeys() {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_API_KEY;
  if (!apiKey || !secretKey) throw new Error("Pinata API keys are not set");
  return { apiKey, secretKey };
}

export async function uploadBuffer(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const { apiKey, secretKey } = getKeys();
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(buffer)], { type: "image/png" });
  formData.append("file", blob, filename);
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name: filename })
  );

  const res = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: {
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return `ipfs://${data.IpfsHash}`;
}

export async function uploadJson(
  json: Record<string, unknown>,
  name: string
): Promise<string> {
  const { apiKey, secretKey } = getKeys();

  const res = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: JSON.stringify({
      pinataContent: json,
      pinataMetadata: { name },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata JSON upload failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return `ipfs://${data.IpfsHash}`;
}
