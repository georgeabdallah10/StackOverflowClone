function hashEmail(email: string): Promise<string> {
  const cleanedEmail = email.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(cleanedEmail);
  return window.crypto.subtle.digest("SHA-256", data).then((hashBuffer) => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  });
}


export default hashEmail;