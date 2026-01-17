import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 
  0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 
  0x01, 0x00, 0x3b
]);

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/");
  const action = pathParts[pathParts.length - 2]; // "open" or "click"
  const emailHistoryId = pathParts[pathParts.length - 1];

  if (!emailHistoryId) {
    return new Response("Missing email ID", { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (action === "open") {
      // Track email open
      const { data: existing } = await supabaseAdmin
        .from("email_history")
        .select("opened_at, open_count")
        .eq("id", emailHistoryId)
        .maybeSingle();

      if (existing) {
        const updateData: Record<string, unknown> = {
          open_count: (existing.open_count || 0) + 1,
        };
        
        // Only set opened_at on first open
        if (!existing.opened_at) {
          updateData.opened_at = new Date().toISOString();
        }

        await supabaseAdmin
          .from("email_history")
          .update(updateData)
          .eq("id", emailHistoryId);
      }

      // Return tracking pixel
      return new Response(TRACKING_PIXEL, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    } else if (action === "click") {
      // Track link click
      const redirectUrl = url.searchParams.get("url");
      
      if (!redirectUrl) {
        return new Response("Missing redirect URL", { status: 400 });
      }

      // Log the click
      await supabaseAdmin
        .from("email_clicks")
        .insert({
          email_history_id: emailHistoryId,
          url: redirectUrl,
        });

      // Update click count
      const { data: existing } = await supabaseAdmin
        .from("email_history")
        .select("click_count")
        .eq("id", emailHistoryId)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("email_history")
          .update({ click_count: (existing.click_count || 0) + 1 })
          .eq("id", emailHistoryId);
      }

      // Redirect to the original URL
      return new Response(null, {
        status: 302,
        headers: {
          "Location": redirectUrl,
        },
      });
    }

    return new Response("Invalid action", { status: 400 });
  } catch (error) {
    console.error("Error in email-tracking function:", error);
    
    // For open tracking, still return the pixel even if logging fails
    if (action === "open") {
      return new Response(TRACKING_PIXEL, {
        headers: { "Content-Type": "image/gif" },
      });
    }
    
    return new Response("Internal error", { status: 500 });
  }
};

serve(handler);
