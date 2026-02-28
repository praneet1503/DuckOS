const PBKDF2_ITERATIONS = 150_000;
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_KEY_BYTES = 32;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(value: string) {
  const binary = window.atob(value);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

async function derive(password: string, salt: ArrayBuffer, iterations: number) {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Secure hashing is not available in this environment.");
  }

  const encoder = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  return window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    key,
    PBKDF2_KEY_BYTES * 8,
  );
}

export async function hashPassword(password: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.getRandomValues) {
    throw new Error("Secure hashing is not available in this environment.");
  }

  const saltArray = new Uint8Array(PBKDF2_SALT_BYTES);
  window.crypto.getRandomValues(saltArray);

  const derived = await derive(password, saltArray.buffer, PBKDF2_ITERATIONS);

  const saltB64 = arrayBufferToBase64(saltArray.buffer);
  const hashB64 = arrayBufferToBase64(derived);

  return `${saltB64}$${PBKDF2_ITERATIONS}$${hashB64}`;
}

export async function deriveHash(
  password: string,
  saltB64: string,
  iterations: number,
) {
  const saltBuffer = base64ToArrayBuffer(saltB64);
  const derived = await derive(password, saltBuffer, iterations);
  return arrayBufferToBase64(derived);
}

export async function hashPasswordLegacy(password: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("Secure hashing is not available in this environment.");
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export { PBKDF2_ITERATIONS };
