export type SubscribeInput = {
  email: string;
  name?: string;
  newsletterLocale: 'es' | 'en';
  participate?: boolean;
};

export type SubscribeResult =
  | { ok: true }
  | { ok: false; reason: 'invalid-email' | 'provider-error' };

export type SubscribeProvider = (input: SubscribeInput) => Promise<void>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return emailPattern.test(email.trim());
}

export function createSubscribeHandler(provider: SubscribeProvider) {
  return async function subscribe(input: SubscribeInput): Promise<SubscribeResult> {
    const email = input.email.trim();

    if (!isValidEmail(email)) {
      return { ok: false, reason: 'invalid-email' };
    }

    try {
      await provider({ ...input, email });
      return { ok: true };
    } catch {
      return { ok: false, reason: 'provider-error' };
    }
  };
}

export const mailerliteProvider: SubscribeProvider = async ({ email, name, newsletterLocale, participate }) => {
  const res = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name: name ?? '', newsletterLocale, participate: participate ?? false, website: '' }),
  });

  if (!res.ok) {
    throw new Error(`subscribe-failed: ${res.status}`);
  }

  const data = await res.json() as { ok: boolean };
  if (!data.ok) {
    throw new Error('subscribe-failed');
  }
};
