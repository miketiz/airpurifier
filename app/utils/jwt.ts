import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function sign(payload: any): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60; // หมดอายุใน 1 ชั่วโมง

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(JWT_SECRET);
}

export async function verify(token: string): Promise<any> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
}