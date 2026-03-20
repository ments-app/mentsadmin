import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: process.env.AWS_REGION ?? 'ap-south-1' });

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1100; // ~10/sec to stay within SES limits

export async function sendInviteEmail(to: string, facilitatorName: string) {
  const from = process.env.SES_FROM_EMAIL;
  if (!from) throw new Error('SES_FROM_EMAIL env variable not set');

  await ses.send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: {
          Data: `You've been invited to Ments by ${facilitatorName}`,
        },
        Body: {
          Html: {
            Data: `<p>${facilitatorName} has added you to their exclusive student access list on Ments.</p>
<p>You'll get access to job postings, gigs, and opportunities shared specifically with you.</p>
<p><a href="https://ments.in/signup?ref=facilitator">Create your free account →</a></p>
<p>— The Ments Team</p>`,
          },
        },
      },
    })
  );
}

/**
 * Send an HTML email to multiple recipients in batches.
 * Each recipient gets an individual email.
 * Optional CC addresses are included on every email.
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  htmlBody: string,
  ccAddresses?: string[]
): Promise<{ sent: number; failed: number }> {
  const from = process.env.SES_FROM_EMAIL;
  if (!from) throw new Error('SES_FROM_EMAIL env variable not set');

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((to) =>
        ses.send(
          new SendEmailCommand({
            Source: from,
            Destination: {
              ToAddresses: [to],
              ...(ccAddresses && ccAddresses.length > 0 ? { CcAddresses: ccAddresses } : {}),
            },
            Message: {
              Subject: { Data: subject },
              Body: { Html: { Data: htmlBody } },
            },
          })
        )
      )
    );

    for (const r of results) {
      if (r.status === 'fulfilled') sent++;
      else failed++;
    }

    // Rate-limit pause between batches
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return { sent, failed };
}
