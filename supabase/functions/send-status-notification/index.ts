import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
  applicationId?: string;
}

// Generate HMAC-SHA256 signature for email tracking
async function generateHmacSignature(emailHistoryId: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(emailHistoryId);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Fallback templates if database templates are not available
const getFallbackEmailContent = (name: string, status: string) => {
  const firstName = name.split(" ")[0];

  switch (status) {
    case "approved":
      return {
        subject: "Welcome to the Accountability Circle! 🎉",
        html: `<h1>Congratulations, ${firstName}!</h1><p>Your application has been approved!</p>`,
      };
    case "rejected":
      return {
        subject: "Update on Your Accountability Circle Application",
        html: `<h1>Hi ${firstName},</h1><p>Thank you for your interest. We've decided not to move forward at this time.</p>`,
      };
    case "pending":
      return {
        subject: "Your Application Is Under Review",
        html: `<h1>Hi ${firstName}!</h1><p>Your application is under review. We'll be in touch soon.</p>`,
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
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role for fetching templates
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create Supabase client with user's auth context for admin check
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify JWT and get user claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Invalid JWT:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;

    // Verify user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminError || !adminData) {
      console.error("User is not an admin:", userId);
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, name, status, applicationId }: StatusNotificationRequest = await req.json();
    const firstName = name.split(" ")[0];

    console.log(`Admin ${userId} sending ${status} notification to ${email} for ${name}`);

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

    // Fetch template from database
    let emailContent: { subject: string; html: string } | null = null;
    
    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("subject, html_content")
      .eq("template_key", status)
      .maybeSingle();

    if (templateError) {
      console.error("Error fetching template:", templateError);
    }

    if (template) {
      // Replace {{name}} placeholder with actual first name
      emailContent = {
        subject: template.subject.replace(/\{\{name\}\}/g, firstName),
        html: template.html_content.replace(/\{\{name\}\}/g, firstName),
      };
      console.log("Using database template for status:", status);
    } else {
      // Fallback to hardcoded templates
      emailContent = getFallbackEmailContent(name, status);
      console.log("Using fallback template for status:", status);
    }
    
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

    // First, create the email history record to get the ID for tracking
    const { data: historyData, error: historyInsertError } = await supabaseAdmin
      .from("email_history")
      .insert({
        application_id: applicationId || null,
        recipient_email: email,
        recipient_name: name,
        template_key: status,
        subject: emailContent.subject,
        status: "pending",
        sent_by: userId,
      })
      .select("id")
      .single();

    if (historyInsertError) {
      console.error("Error creating email history:", historyInsertError);
    }

    const emailHistoryId = historyData?.id;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const trackingSecret = Deno.env.get("EMAIL_TRACKING_SECRET");

    // Inject tracking pixel for open tracking
    let trackedHtml = emailContent.html;
    if (emailHistoryId && trackingSecret) {
      // Generate HMAC signature for this email
      const signature = await generateHmacSignature(emailHistoryId, trackingSecret);
      
      const trackingPixelUrl = `${supabaseUrl}/functions/v1/email-tracking/open/${emailHistoryId}?sig=${signature}`;
      trackedHtml = trackedHtml + `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
      
      // Wrap links for click tracking (signature is the same for all links in this email)
      const clickTrackingBase = `${supabaseUrl}/functions/v1/email-tracking/click/${emailHistoryId}?sig=${signature}&url=`;
      trackedHtml = trackedHtml.replace(
        /href="(https?:\/\/[^"]+)"/g,
        (match, url) => `href="${clickTrackingBase}${encodeURIComponent(url)}"`
      );
      
      console.log("Added signed tracking to email:", emailHistoryId);
    } else if (emailHistoryId) {
      // Fallback: add unsigned tracking (will not be recorded by updated tracking function)
      console.warn("EMAIL_TRACKING_SECRET not configured, tracking will not work");
      const trackingPixelUrl = `${supabaseUrl}/functions/v1/email-tracking/open/${emailHistoryId}`;
      trackedHtml = trackedHtml + `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />`;
    }

    let emailError: string | null = null;
    let emailStatus = "sent";

    try {
      const emailResponse = await resend.emails.send({
        from: "Accountability Circle <team@accountabilitycircle.co.uk>",
        to: [email],
        subject: emailContent.subject,
        html: trackedHtml,
      });

      console.log("Email sent successfully:", emailResponse);
    } catch (sendError: any) {
      console.error("Error sending email:", sendError);
      emailError = sendError.message || "Unknown error";
      emailStatus = "failed";
    }

    // Update email history with final status
    if (emailHistoryId) {
      const { error: historyError } = await supabaseAdmin
        .from("email_history")
        .update({
          status: emailStatus,
          error_message: emailError,
        })
        .eq("id", emailHistoryId);

      if (historyError) {
        console.error("Error updating email history:", historyError);
      }
    }

    if (emailError) {
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailError }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-status-notification function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
