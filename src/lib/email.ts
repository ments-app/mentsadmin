import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: process.env.AWS_REGION ?? 'ap-south-1' });

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
