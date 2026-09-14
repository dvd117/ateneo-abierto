export type MailerLiteInput = {
  email: string;
  name?: string;
  newsletterLocale: 'es' | 'en';
  groups: string[];
  participationInterest?: boolean;
  /** MailerLite's built-in `city` field: no dashboard setup needed. */
  city?: string;
  /** "What would you like to delegate?" Needs a custom field; see below. */
  delegate?: string;
};

const DEFAULT_TIMEOUT_MS = 5000;

/** The custom field the delegate answer goes to, once it exists in MailerLite. */
export const DELEGATE_TASK_FIELD = 'delegate_task';

/**
 * On: the `delegate_task` custom field was created in the MailerLite dashboard
 * (2026-09-14). Its key could not be read back from /api/fields, so if the
 * first live submit is refused, check the field list against
 * DELEGATE_TASK_FIELD before anything else.
 */
export const SEND_DELEGATE_TASK = true;

export function buildFields(
  input: MailerLiteInput,
  options: { sendDelegateTask?: boolean } = {}
): Record<string, string> {
  const sendDelegateTask = options.sendDelegateTask ?? SEND_DELEGATE_TASK;

  return {
    ...(input.name ? { name: input.name } : {}),
    preferred_language: input.newsletterLocale,
    ...(input.participationInterest ? { participation_interest: 'yes' } : {}),
    ...(input.city ? { city: input.city } : {}),
    ...(sendDelegateTask && input.delegate ? { [DELEGATE_TASK_FIELD]: input.delegate } : {}),
  };
}

export async function addSubscriber(
  input: MailerLiteInput,
  apiKey: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<void> {
  const fields = buildFields(input);

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
