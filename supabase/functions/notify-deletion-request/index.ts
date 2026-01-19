import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeletionNotificationRequest {
  memberName: string;
  memberEmail: string;
  reason?: string;
}

// Get facilitator email from environment variable, with fallback
const FACILITATOR_EMAIL = Deno.env.get("FACILITATOR_EMAIL") || "najahendriksen@gmail.com";

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

    // Create Supabase client with user's auth context
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
    console.log(`User ${userId} submitted deletion request`);

    const { memberName, memberEmail, reason }: DeletionNotificationRequest = await req.json();

    // Build email content
    const emailSubject = `🚨 Account Deletion Request: ${memberName}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9b7a5c 0%, #7d6b59 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #faf8f5; padding: 24px; border: 1px solid #e5e0da; border-top: none; border-radius: 0 0 8px 8px; }
          .info-row { margin-bottom: 12px; }
          .label { font-weight: 600; color: #666; }
          .value { color: #333; }
          .reason-box { background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e0da; margin-top: 16px; }
          .cta { display: inline-block; background: #9b7a5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { margin-top: 24px; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 20px;">Account Deletion Request</h1>
          </div>
          <div class="content">
            <p>A member has requested to delete their account from the Accountability Circle.</p>
            
            <div class="info-row">
              <span class="label">Member Name:</span>
              <span class="value">${memberName}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value"><a href="mailto:${memberEmail}">${memberEmail}</a></span>
            </div>
            
            ${reason ? `
            <div class="reason-box">
              <div class="label" style="margin-bottom: 8px;">Reason for leaving:</div>
              <div class="value">${reason}</div>
            </div>
            ` : ''}
            
            <p style="margin-top: 20px;">Please review this request in the admin dashboard and process accordingly.</p>
            
            <div class="footer">
              <p>This is an automated notification from the Accountability Circle platform.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const emailResponse = await resend.emails.send({
        from: "Accountability Circle <team@accountabilitycircle.co.uk>",
        to: [FACILITATOR_EMAIL],
        subject: emailSubject,
        html: emailHtml,
      });

      console.log("Admin notification sent successfully:", emailResponse);
    } catch (sendError: any) {
      console.error("Error sending admin notification:", sendError);
      // Don't fail the request if email fails - the deletion request was still created
      return new Response(
        JSON.stringify({ success: true, emailSent: false, error: sendError.message }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailSent: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-deletion-request function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);