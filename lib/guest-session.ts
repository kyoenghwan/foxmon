import { EncryptJWT, jwtDecrypt } from 'jose';

export interface GuestIdentity {
  name: string;
  birthDate: string;
  phoneNumber: string;
  gender: string;
  nationality: 'KOREAN' | 'FOREIGNER';
  ci?: string;
  verifiedMethod: string;
}

async function encryptionKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('인증 서버 설정이 필요합니다.');
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`foxmon-guest-v1:${secret}`)));
}

export async function createGuestToken(identity: GuestIdentity) {
  return new EncryptJWT({ ...identity, version: 1 })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setSubject(crypto.randomUUID()).setIssuedAt().setExpirationTime('1d')
    .setIssuer('foxmon').setAudience('foxmon-guest')
    .encrypt(await encryptionKey());
}

export async function verifyGuestToken(token?: string): Promise<(GuestIdentity & { sub: string }) | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtDecrypt(token, await encryptionKey(), {
      issuer: 'foxmon', audience: 'foxmon-guest', keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'],
      requiredClaims: ['exp', 'iat', 'sub'],
    });
    if (payload.version !== 1 || typeof payload.sub !== 'string' ||
        !['name', 'birthDate', 'phoneNumber', 'gender', 'verifiedMethod'].every(key => typeof payload[key] === 'string' && !!payload[key]) ||
        !['KOREAN', 'FOREIGNER'].includes(String(payload.nationality))) return null;
    return payload as unknown as GuestIdentity & { sub: string };
  } catch {
    return null;
  }
}
