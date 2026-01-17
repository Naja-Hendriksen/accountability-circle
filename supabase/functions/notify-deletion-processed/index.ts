import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeletionProcessedRequest {
  memberName: string;
  memberEmail: string;
  action: "completed" | "cancelled";
}

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

    const { memberName, memberEmail, action }: DeletionProcessedRequest = await req.json();
    const firstName = memberName.split(" ")[0];

    console.log(`Admin ${userId} notifying ${memberEmail} about ${action} deletion request`);

    let emailSubject: string;
    let emailHtml: string;

    if (action === "completed") {
      emailSubject = "Your Account Has Been Deleted - Accountability Circle";
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #9b7a5c 0%, #7d6b59 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #faf8f5; padding: 24px; border: 1px solid #e5e0da; border-top: none; border-radius: 0 0 8px 8px; }
            .footer { margin-top: 24px; font-size: 12px; color: #888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 20px;">Account Deletion Confirmed</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              
              <p>Your account deletion request has been processed. Your account and all associated data have been permanently removed from the Accountability Circle platform.</p>
              
              <p>This includes:</p>
              <ul>
                <li>Your profile information</li>
                <li>Weekly entries and mini-moves</li>
                <li>Group memberships</li>
              </ul>
              
              <p>Thank you for being part of the Accountability Circle. We wish you all the best on your journey!</p>
              
              <p>If you ever want to return, you're always welcome to apply again.</p>
              
              <p style="margin-top: 24px;">Warm regards,<br>The Accountability Circle Team</p>
              
              <div class="footer">
                <p>This is a confirmation of your account deletion request.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      emailSubject = "Your Deletion Request Was Cancelled - Accountability Circle";
      emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #9b7a5c 0%, #7d6b59 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #faf8f5; padding: 24px; border: 1px solid #e5e0da; border-top: none; border-radius: 0 0 8px 8px; }
            .footer { margin-top: 24px; font-size: 12px; color: #888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 20px;">Deletion Request Cancelled</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              
              <p>Your account deletion request has been cancelled. Your account remains active and all your data is still intact.</p>
              
              <p>You can continue using the Accountability Circle as normal. If you have any questions or concerns, please reach out to your facilitator.</p>
              
              <p>We're glad to have you continue with us!</p>
              
              <p style="margin-top: 24px;">Warm regards,<br>The Accountability Circle Team</p>
              
              <div class="footer">
                <p>If you did not expect this email, please contact your facilitator.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    try {
      const emailResponse = await resend.emails.send({
        from: "Accountability Circle <onboarding@resend.dev>",
        to: [memberEmail],
        subject: emailSubject,
        html: emailHtml,
      });

      console.log("Member notification sent successfully:", emailResponse);
    } catch (sendError: any) {
      console.error("Error sending member notification:", sendError);
      return new Response(
        JSON.stringify({ success: false, error: sendError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-deletion-processed function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);