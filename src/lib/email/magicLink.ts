import { Resend } from "resend";

interface SendMagicLinkEmailParams {
  email: string;
  magicLinkUrl: string;
  from?: string;
}

export async function sendMagicLinkEmail({
  email,
  magicLinkUrl,
  from = "notifications@dancechives.com",
}: SendMagicLinkEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error(
      "RESEND_API_KEY is not set. Magic link emails cannot be sent."
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: "Your magic login link for Dance Chives",
      html: `
        <p>Hi,</p>
        <p>Click the button below to sign in to Dance Chives. This link will expire in a few minutes and can only be used once.</p>
        <p>
          <a href="${magicLinkUrl}" style="
            display:inline-block;
            padding:10px 18px;
            background-color:#16a34a;
            color:#ffffff;
            text-decoration:none;
            border-radius:9999px;
            font-weight:600;
          ">
            Sign in
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p><a href="${magicLinkUrl}">${magicLinkUrl}</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
      text: `Sign in to Dance Chives with this link (valid for a short time and single-use): ${magicLinkUrl}`,
    });

    if (error) {
      console.error("Failed to send magic link email via Resend:", error);
      return;
    }

    console.log("Magic link email sent successfully:", data);
  } catch (error) {
    console.error("Error sending magic link email via Resend:", error);
  }
}
