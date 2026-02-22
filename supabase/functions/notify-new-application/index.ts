import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Fallback template if database template is not available
const getFallbackApplicantEmail = (firstName: string) => ({
  subject: "We've Received Your Application!",
  html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
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
  </div>`,
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { application_id } = await req.json();

    if (!application_id || typeof application_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing application_id" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate UUID format to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(application_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid application_id format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const facilitatorEmail = Deno.env.get("FACILITATOR_EMAIL");
    if (!facilitatorEmail) {
      console.error("FACILITATOR_EMAIL not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the application from the database - this is the source of truth
    const { data: app, error: appError } = await supabaseAdmin
      .from("applications")
      .select("first_name, last_name, email, location, availability, commitment_level, growth_goal, digital_product, status, created_at")
      .eq("id", application_id)
      .maybeSingle();

    if (appError || !app) {
      console.error("Application not found or error:", appError);
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Only send notification for pending applications (prevents replay attacks)
    if (app.status !== "pending") {
      console.warn("Notification requested for non-pending application:", application_id);
      return new Response(
        JSON.stringify({ error: "Application already processed" }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Only send for recently created applications (within last 5 minutes)
    const createdAt = new Date(app.created_at);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    if (diffMs > 5 * 60 * 1000) {
      console.warn("Notification requested for old application:", application_id);
      return new Response(
        JSON.stringify({ error: "Application notification window expired" }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const fullName = `${app.first_name} ${app.last_name}`;
    const firstName = app.first_name;

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
              <td style="padding: 8px 0; color: #333;">${app.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
              <td style="padding: 8px 0; color: #333;">${app.location}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Availability:</strong></td>
              <td style="padding: 8px 0; color: #333;">${app.availability}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;"><strong>Commitment:</strong></td>
              <td style="padding: 8px 0; color: #333;">${app.commitment_level}/10</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Growth Goal (3-6 months)</h3>
          <p style="color: #555; white-space: pre-wrap;">${app.growth_goal}</p>
        </div>
        
        <div style="background-color: #f5f0ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Digital Product</h3>
          <p style="color: #555; white-space: pre-wrap;">${app.digital_product}</p>
        </div>
        
        <p style="font-size: 14px; color: #888; margin-top: 30px; text-align: center;">
          Review this application in your <a href="https://accountabilitycircle.lovable.app/admin/applications" style="color: #007bff;">admin dashboard</a>.
        </p>
      </div>
    `;

    // Fetch applicant confirmation template from database
    let applicantEmailContent = getFallbackApplicantEmail(firstName);
    
    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("subject, html_content")
      .eq("template_key", "application_received")
      .maybeSingle();

    if (templateError) {
      console.error("Error fetching template:", templateError);
    }

    if (template) {
      applicantEmailContent = {
        subject: template.subject.replace(/\{\{name\}\}/g, firstName),
        html: template.html_content.replace(/\{\{name\}\}/g, firstName),
      };
      console.log("Using database template for application_received");
    } else {
      console.log("Using fallback template for application_received");
    }

    const [adminResult, applicantResult] = await Promise.allSettled([
      resend.emails.send({
        from: "Accountability Circle <team@accountabilitycircle.co.uk>",
        to: [facilitatorEmail],
        subject: `New Application: ${fullName}`,
        html: adminEmailHtml,
      }),
      resend.emails.send({
        from: "Accountability Circle <team@accountabilitycircle.co.uk>",
        to: [app.email],
        subject: applicantEmailContent.subject,
        html: applicantEmailContent.html,
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
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
