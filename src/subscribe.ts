export type SubscribeInput = {
  email: string;
  name?: string;
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

export const placeholderSubscribeProvider: SubscribeProvider = async () => {
  await new Promise((resolve) => window.setTimeout(resolve, 300));
};
