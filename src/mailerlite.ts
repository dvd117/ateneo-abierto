export type MailerLiteInput = {
  email: string;
  name?: string;
};

export async function addSubscriber(input: MailerLiteInput, apiKey: string): Promise<void> {
  const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email: input.email,
      fields: input.name ? { name: input.name } : undefined,
    }),
  });

  if (res.status === 200 || res.status === 201) {
    return;
  }

  if (res.status === 422) {
    throw new Error('invalid-email');
  }

  throw new Error(`mailerlite-error: ${res.status}`);
}
