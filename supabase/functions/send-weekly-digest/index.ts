import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting weekly digest processing...");

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all queued questions grouped by group_id
    const { data: queuedItems, error: queueError } = await supabaseAdmin
      .from("digest_queue")
      .select("*")
      .order("created_at", { ascending: false });

    if (queueError) {
      console.error("Error fetching digest queue:", queueError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch digest queue" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!queuedItems || queuedItems.length === 0) {
      console.log("No items in digest queue");
      return new Response(
        JSON.stringify({ message: "No digest items to process" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${queuedItems.length} questions in digest queue`);

    // Group questions by group_id
    const questionsByGroup = new Map<string, typeof queuedItems>();
    for (const item of queuedItems) {
      const existing = questionsByGroup.get(item.group_id) || [];
      existing.push(item);
      questionsByGroup.set(item.group_id, existing);
    }

    let totalEmailsSent = 0;
    let totalEmailsFailed = 0;

    // Process each group
    for (const [groupId, questions] of questionsByGroup) {
      console.log(`Processing group ${groupId} with ${questions.length} questions`);

      // Get all members with digest preference for this group
      const { data: groupMembers, error: membersError } = await supabaseAdmin
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      if (membersError || !groupMembers) {
        console.error(`Error fetching members for group ${groupId}:`, membersError);
        continue;
      }

      const memberUserIds = groupMembers.map(m => m.user_id);
      
      // Get profiles with digest preference
      const { data: digestProfiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("user_id, name, notification_preference")
        .in("user_id", memberUserIds)
        .eq("notification_preference", "digest");

      if (profilesError || !digestProfiles || digestProfiles.length === 0) {
        console.log(`No digest subscribers for group ${groupId}`);
        continue;
      }

      // Build questions HTML for this group
      const questionsHtml = questions.map(q => `
        <div style="background: white; border-left: 4px solid #c9a66b; padding: 15px 20px; margin: 15px 0; border-radius: 0 8px 8px 0;">
          <p style="font-size: 12px; color: #666; margin: 0 0 8px 0; font-weight: 600;">${q.author_name} asked:</p>
          <p style="font-size: 14px; color: #333; margin: 0; font-style: italic;">"${q.question_content.length > 150 ? q.question_content.substring(0, 150) + '...' : q.question_content}"</p>
        </div>
      `).join('');

      // Send email to each digest subscriber
      for (const profile of digestProfiles) {
        // Exclude question authors from their own questions
        const questionsExcludingSelf = questions; // All questions since we don't track author_id in queue
        if (questionsExcludingSelf.length === 0) continue;

        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
        if (userError || !user?.email) {
          console.error(`Error fetching email for user ${profile.user_id}:`, userError);
          continue;
        }

        const firstName = (profile.name || "there").split(" ")[0];

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4a5d4a 0%, #6b7b6b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Your Weekly Digest</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">New questions from your Accountability Circle</p>
            </div>
            
            <div style="background: #faf8f5; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">Here's what's been happening in your group this week:</p>
              
              <div style="margin: 20px 0;">
                <h2 style="font-size: 14px; color: #4a5d4a; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${questions.length} New Question${questions.length > 1 ? 's' : ''}
                </h2>
                ${questionsHtml}
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://accountabilitycircle.lovable.app/group" style="display: inline-block; background: #4a5d4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View All & Reply</a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px; text-align: center;">
                Your group is waiting to hear from you! 💚
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>Accountability Circle</p>
              <p style="font-size: 11px;">You're receiving this because you chose weekly digest notifications.</p>
            </div>
          </body>
          </html>
        `;

        try {
          await resend.emails.send({
            from: "Accountability Circle <team@accountabilitycircle.co.uk>",
            to: [user.email],
            subject: `Your Weekly Digest: ${questions.length} new question${questions.length > 1 ? 's' : ''} in your group`,
            html: emailHtml,
          });
          totalEmailsSent++;
          console.log(`Digest sent to ${user.email}`);
        } catch (sendError: any) {
          totalEmailsFailed++;
          console.error(`Failed to send digest to ${user.email}:`, sendError);
        }
      }
    }

    // Clear the digest queue after processing
    const { error: deleteError } = await supabaseAdmin
      .from("digest_queue")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (deleteError) {
      console.error("Error clearing digest queue:", deleteError);
    } else {
      console.log("Digest queue cleared");
    }

    console.log(`Weekly digest complete: ${totalEmailsSent} sent, ${totalEmailsFailed} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: totalEmailsSent, 
        failed: totalEmailsFailed,
        questionsProcessed: queuedItems.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-weekly-digest function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process weekly digest" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
