import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReplyNotificationRequest {
  questionId: string;
  answerId: string;
  replierName: string;
}

const handler = async (req: Request): Promise<Response> => {
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

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create Supabase client with user's auth context
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Invalid JWT:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const replierId = claimsData.claims.sub;
    const { questionId, answerId, replierName }: ReplyNotificationRequest = await req.json();

    console.log(`Processing reply notification for question ${questionId}, answer ${answerId}`);

    // Get the question and question author's details
    const { data: question, error: questionError } = await supabaseAdmin
      .from("group_questions")
      .select("user_id, content")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      console.error("Error fetching question:", questionError);
      return new Response(
        JSON.stringify({ error: "Question not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Don't notify if the replier is the question author
    if (question.user_id === replierId) {
      console.log("Replier is question author, skipping notification");
      return new Response(
        JSON.stringify({ message: "No notification needed - replying to own question" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the question author's email from auth.users via profile
    const { data: authorProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("name, user_id")
      .eq("user_id", question.user_id)
      .single();

    if (profileError || !authorProfile) {
      console.error("Error fetching author profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Author profile not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user email from auth
    const { data: { user: authorUser }, error: userError } = await supabaseAdmin.auth.admin.getUserById(question.user_id);

    if (userError || !authorUser?.email) {
      console.error("Error fetching author email:", userError);
      return new Response(
        JSON.stringify({ error: "Author email not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the answer content
    const { data: answer, error: answerError } = await supabaseAdmin
      .from("group_answers")
      .select("content")
      .eq("id", answerId)
      .single();

    if (answerError || !answer) {
      console.error("Error fetching answer:", answerError);
      return new Response(
        JSON.stringify({ error: "Answer not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const authorFirstName = (authorProfile.name || "there").split(" ")[0];
    const questionPreview = question.content.length > 100 
      ? question.content.substring(0, 100) + "..." 
      : question.content;
    const answerPreview = answer.content.length > 200 
      ? answer.content.substring(0, 200) + "..." 
      : answer.content;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4a5d4a 0%, #6b7b6b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Reply to Your Question</h1>
        </div>
        
        <div style="background: #faf8f5; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi ${authorFirstName},</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;"><strong>${replierName}</strong> replied to your question in the Accountability Circle:</p>
          
          <div style="background: white; border-left: 4px solid #c9a66b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="font-size: 14px; color: #666; margin: 0 0 10px 0; font-weight: 600;">Your question:</p>
            <p style="font-size: 14px; color: #333; margin: 0; font-style: italic;">"${questionPreview}"</p>
          </div>
          
          <div style="background: white; border-left: 4px solid #4a5d4a; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="font-size: 14px; color: #666; margin: 0 0 10px 0; font-weight: 600;">${replierName}'s reply:</p>
            <p style="font-size: 14px; color: #333; margin: 0;">"${answerPreview}"</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://accountabilitycircle.lovable.app/group" style="display: inline-block; background: #4a5d4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View in Group</a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
            Keep the conversation going! Your group is here to support you. 💚
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>Accountability Circle</p>
        </div>
      </body>
      </html>
    `;

    try {
      const emailResponse = await resend.emails.send({
        from: "Accountability Circle <team@accountabilitycircle.co.uk>",
        to: [authorUser.email],
        subject: `${replierName} replied to your question`,
        html: emailHtml,
      });

      console.log("Reply notification email sent:", emailResponse);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (sendError: any) {
      console.error("Error sending email:", sendError);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: sendError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error: any) {
    console.error("Error in notify-question-reply function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process notification" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
