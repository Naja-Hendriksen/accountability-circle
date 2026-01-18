import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  location: string;
  availability: string;
  commitmentLevel: number;
  growthGoal: string;
  digitalProduct: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const applicationData: ApplicationData = await req.json();
    
    console.log("Received new application notification request:", {
      name: `${applicationData.firstName} ${applicationData.lastName}`,
      email: applicationData.email,
    });

    const facilitatorEmail = Deno.env.get("FACILITATOR_EMAIL");
    if (!facilitatorEmail) {
      console.error("FACILITATOR_EMAIL not configured");
      return new Response(
        JSON.stringify({ error: "Facilitator email not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const fullName = `${applicationData.firstName} ${applicationData.lastName}`;
    const firstName = applicationData.firstName;
    
    // Build the admin notification email
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px;">
          New Application Received
        </h1>
        
        <p style="font-size: 16px; color: #555;">
          A new application has been submitted to the Accountability Circle.
        </p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Applicant Details</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 140px;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; color: #333;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; color: #333;">${applicationData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
              <td style="padding: 8px 0; color: #333;">${applicationData.location}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Availability:</strong></td>
              <td style="padding: 8px 0; color: #333;">${applicationData.availability}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Commitment:</strong></td>
              <td style="padding: 8px 0; color: #333;">${applicationData.commitmentLevel}/10</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Growth Goal (3-6 months)</h3>
          <p style="color: #555; white-space: pre-wrap;">${applicationData.growthGoal}</p>
        </div>
        
        <div style="background-color: #f5f0ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Digital Product</h3>
          <p style="color: #555; white-space: pre-wrap;">${applicationData.digitalProduct}</p>
        </div>
        
        <p style="font-size: 14px; color: #888; margin-top: 30px; text-align: center;">
          Review this application in your <a href="https://accountabilitycircle.lovable.app/admin/applications" style="color: #007bff;">admin dashboard</a>.
        </p>
      </div>
    `;

    // Build the applicant confirmation email
    const applicantEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #333; margin-bottom: 24px;">
          Thank You for Applying, ${firstName}!
        </h1>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          We've received your application to join the Accountability Circle. Thank you for taking the time to share your goals and journey with us.
        </p>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #007bff;">
          <h3 style="color: #333; margin-top: 0; margin-bottom: 12px;">What happens next?</h3>
          <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 0;">
            Your application is now pending review. You'll hear back from us within <strong>3-5 working days</strong> via email.
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          In the meantime, if you have any questions, feel free to reach out.
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #555; margin-top: 32px;">
          Warm regards,<br/>
          <strong>The Accountability Circle Team</strong>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          This is an automated confirmation email. Please do not reply directly to this message.
        </p>
      </div>
    `;

    // Send both emails in parallel
    const [adminResult, applicantResult] = await Promise.allSettled([
      resend.emails.send({
        from: "Accountability Circle <onboarding@resend.dev>",
        to: [facilitatorEmail],
        subject: `New Application: ${fullName}`,
        html: adminEmailHtml,
      }),
      resend.emails.send({
        from: "Accountability Circle <onboarding@resend.dev>",
        to: [applicationData.email],
        subject: "We've Received Your Application!",
        html: applicantEmailHtml,
      }),
    ]);

    console.log("Admin notification result:", adminResult);
    console.log("Applicant confirmation result:", applicantResult);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-new-application function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
