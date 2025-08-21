export default async function deriveKeyWithSalt(
  password: string,
  saltHex?: string
): Promise<{ key: string; salt: string }> {
  const encoder = new TextEncoder();

  let saltBytes: Uint8Array;
  if (saltHex) {
    // Convert hex string to Uint8Array
    saltBytes = new Uint8Array(
      saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
  } else {
    // Generate new random salt (16 bytes)
    saltBytes = crypto.getRandomValues(new Uint8Array(16));
    saltHex = Array.from(saltBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  const passwordKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100000,
      hash: "SHA-512",
    },
    passwordKey,
    512
  );

  const keyHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { key: keyHex, salt: saltHex };
}
