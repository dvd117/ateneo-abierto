export type MailerLiteInput = {
  email: string;
  name?: string;
  newsletterLocale: 'es' | 'en';
  groups: string[];
  participationInterest?: boolean;
};

const DEFAULT_TIMEOUT_MS = 5000;

export async function addSubscriber(
  input: MailerLiteInput,
  apiKey: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<void> {
  const fields = {
    ...(input.name ? { name: input.name } : {}),
    preferred_language: input.newsletterLocale,
    ...(input.participationInterest ? { participation_interest: 'yes' } : {}),
  };

  let res: Response;
  try {
    res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        fields,
        groups: input.groups,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new Error('mailerlite-timeout');
    }
    throw err;
  }

  if (res.status === 200 || res.status === 201) {
    return;
  }

  if (res.status === 422) {
    throw new Error('invalid-email');
  }

  throw new Error(`mailerlite-error: ${res.status}`);
}
