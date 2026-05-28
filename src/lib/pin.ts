// PBKDF2 PIN hashing using WebCrypto.

const enc = new TextEncoder();

async function pbkdf2(pin: string, salt: Uint8Array): Promise<string> {
  const keyMat = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 100_000, hash: "SHA-256" },
    keyMat,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPin(pin: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(pin, salt);
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { hash, salt: saltHex };
}

export async function verifyPin(pin: string, hash: string, saltHex: string): Promise<boolean> {
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g)!.map((h) => parseInt(h, 16))
  );
  const check = await pbkdf2(pin, salt);
  return check === hash;
}
