import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface StatusNotificationRequest {
  email: string;
  name: string;
  status: "approved" | "rejected" | "pending" | "removed";
}

const getEmailContent = (name: string, status: string) => {
  const firstName = name.split(" ")[0];

  switch (status) {
    case "approved":
      return {
        subject: "Welcome to the Accountability Circle! 🎉",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #2d5016; margin-bottom: 24px;">Congratulations, ${firstName}!</h1>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              We're thrilled to let you know that your application to join the Accountability Circle has been <strong style="color: #2d5016;">approved</strong>!
            </p>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              You're now part of a supportive community of ambitious women building their digital products together. We can't wait to see what you'll accomplish.
            </p>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              <strong>Next steps:</strong><br/>
              You'll receive a separate email shortly with details about joining our weekly Monday 10am GMT calls and accessing your member dashboard.
            </p>
            <p style="color: #444; font-size: 16px; line-height: 1.6; margin-top: 32px;">
              Warmly,<br/>
              <strong>The Accountability Circle Team</strong>
            </p>
          </div>
        `,
      };

    case "rejected":
      return {
        subject: "Update on Your Accountability Circle Application",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #6b4423; margin-bottom: 24px;">Thank You, ${firstName}</h1>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              Thank you for your interest in joining the Accountability Circle. After careful consideration, we've decided not to move forward with your application at this time.
            </p>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              This doesn't reflect on your potential or abilities—sometimes the timing or fit just isn't right for the current cohort. We encourage you to apply again in the future when new spaces open up.
            </p>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              We wish you all the best on your journey building your digital product!
            </p>
            <p style="color: #444; font-size: 16px; line-height: 1.6; margin-top: 32px;">
              Warmly,<br/>
              <strong>The Accountability Circle Team</strong>
            </p>
          </div>
        `,
      };

    case "pending":
      return {
        subject: "Your Accountability Circle Application Is Under Review",
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #6b4423; margin-bottom: 24px;">Hi ${firstName}!</h1>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              Your application for the Accountability Circle has been moved back to pending review.
            </p>
            <p style="color: #444; font-size: 16px; line-height: 1.6;">
              We'll be in touch soon with an update. Thank you for your patience!
            </p>
            <p style="color: #444; font-size: 16px; line-height: 1.6; margin-top: 32px;">
              Warmly,<br/>
              <strong>The Accountability Circle Team</strong>
            </p>
          </div>
        `,
      };

    default:
      return null;
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, status }: StatusNotificationRequest = await req.json();

    console.log(`Sending ${status} notification to ${email} for ${name}`);

    // Don't send emails for "removed" status
    if (status === "removed") {
      console.log("Skipping email for 'removed' status");
      return new Response(
        JSON.stringify({ message: "No email sent for removed status" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailContent = getEmailContent(name, status);
    
    if (!emailContent) {
      console.log("No email content for status:", status);
      return new Response(
        JSON.stringify({ message: "No email template for this status" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "Accountability Circle <onboarding@resend.dev>",
      to: [email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-status-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
