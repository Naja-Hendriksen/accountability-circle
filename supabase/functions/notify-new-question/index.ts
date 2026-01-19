import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewQuestionRequest {
  questionId: string;
  groupId: string;
  authorName: string;
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

    const authorId = claimsData.claims.sub;
    const { questionId, groupId, authorName }: NewQuestionRequest = await req.json();

    console.log(`Processing new question notification for question ${questionId} in group ${groupId}`);

    // Get the question content
    const { data: question, error: questionError } = await supabaseAdmin
      .from("group_questions")
      .select("content")
      .eq("id", questionId)
      .single();

    if (questionError || !question) {
      console.error("Error fetching question:", questionError);
      return new Response(
        JSON.stringify({ error: "Question not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all group members except the author
    const { data: groupMembers, error: membersError } = await supabaseAdmin
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId)
      .neq("user_id", authorId);

    if (membersError) {
      console.error("Error fetching group members:", membersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch group members" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!groupMembers || groupMembers.length === 0) {
      console.log("No other group members to notify");
      return new Response(
        JSON.stringify({ message: "No members to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get profiles for all group members to check notification preferences
    const memberUserIds = groupMembers.map(m => m.user_id);
    const { data: memberProfiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, notification_preference")
      .in("user_id", memberUserIds);

    if (profilesError) {
      console.error("Error fetching member profiles:", profilesError);
    }

    // Separate members by notification preference
    const profilesMap = new Map((memberProfiles || []).map(p => [p.user_id, p]));
    
    const instantMembers = groupMembers.filter(m => {
      const profile = profilesMap.get(m.user_id);
      return profile?.notification_preference === 'instant' || !profile?.notification_preference;
    });

    const digestMembers = groupMembers.filter(m => {
      const profile = profilesMap.get(m.user_id);
      return profile?.notification_preference === 'digest';
    });

    // Queue question for digest members
    if (digestMembers.length > 0) {
      const { error: queueError } = await supabaseAdmin
        .from("digest_queue")
        .upsert({
          group_id: groupId,
          question_id: questionId,
          author_name: authorName,
          question_content: question.content
        }, { onConflict: 'question_id' });

      if (queueError) {
        console.error("Error queuing for digest:", queueError);
      } else {
        console.log(`Question queued for ${digestMembers.length} digest subscribers`);
      }
    }

    if (instantMembers.length === 0) {
      console.log("No members with instant notifications enabled");
      return new Response(
        JSON.stringify({ message: "No instant notification members, question queued for digest" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get emails for members with instant notifications
    const memberEmails: { email: string; firstName: string }[] = [];
    for (const member of instantMembers) {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(member.user_id);
      if (!userError && user?.email) {
        const profile = profilesMap.get(member.user_id);
        const firstName = (profile?.name || "there").split(" ")[0];
        memberEmails.push({ email: user.email, firstName });
      }
    }

    if (memberEmails.length === 0) {
      console.log("No valid emails found for group members");
      return new Response(
        JSON.stringify({ message: "No valid emails to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const questionPreview = question.content.length > 200 
      ? question.content.substring(0, 200) + "..." 
      : question.content;

    // Send emails to all group members
    let successCount = 0;
    let failCount = 0;

    for (const { email, firstName } of memberEmails) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4a5d4a 0%, #6b7b6b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Question in Your Group</h1>
          </div>
          
          <div style="background: #faf8f5; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;"><strong>${authorName}</strong> posted a new question in your Accountability Circle:</p>
            
            <div style="background: white; border-left: 4px solid #c9a66b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="font-size: 14px; color: #333; margin: 0; font-style: italic;">"${questionPreview}"</p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              Take a moment to share your thoughts and support your fellow circle member!
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://accountabilitycircle.lovable.app/group" style="display: inline-block; background: #4a5d4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View & Reply</a>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
              Your support makes a difference! 💚
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>Accountability Circle</p>
          </div>
        </body>
        </html>
      `;

      try {
        await resend.emails.send({
          from: "Accountability Circle <team@accountabilitycircle.co.uk>",
          to: [email],
          subject: `${authorName} asked a question in your group`,
          html: emailHtml,
        });
        successCount++;
        console.log(`Email sent to ${email}`);
      } catch (sendError: any) {
        failCount++;
        console.error(`Failed to send email to ${email}:`, sendError);
      }
    }

    console.log(`Notification complete: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ success: true, sent: successCount, failed: failCount }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-new-question function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process notification" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
