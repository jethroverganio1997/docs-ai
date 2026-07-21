import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

const secrets = new SecretsManagerClient({});
const SECRET_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedSecret = {
  expiresAt: number;
  value: Promise<string>;
};

const cache = new Map<string, CachedSecret>();

async function readSecret(secretId: string) {
  const response = await secrets.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    }),
  );

  if (typeof response.SecretString === "string" && response.SecretString) {
    return response.SecretString;
  }

  if (response.SecretBinary) {
    return new TextDecoder().decode(response.SecretBinary);
  }

  throw new Error(`Secret '${secretId}' is empty.`);
}

export async function getSecretString(secretId: string) {
  const cached = cache.get(secretId);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = readSecret(secretId);
  cache.set(secretId, {
    value,
    expiresAt: Date.now() + SECRET_CACHE_TTL_MS,
  });

  try {
    return await value;
  } catch (error) {
    if (cache.get(secretId)?.value === value) {
      cache.delete(secretId);
    }

    throw error;
  }
}
