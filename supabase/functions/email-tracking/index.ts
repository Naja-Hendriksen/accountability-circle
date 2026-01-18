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

// HMAC-SHA256 signature verification using Web Crypto API
async function verifyHmacSignature(
  emailHistoryId: string, 
  providedSignature: string, 
  secret: string
): Promise<boolean> {
  try {
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
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
    // Constant-time comparison to prevent timing attacks
    if (expectedSignature.length !== providedSignature.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < expectedSignature.length; i++) {
      result |= expectedSignature.charCodeAt(i) ^ providedSignature.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    console.error("HMAC verification error:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/");
  const action = pathParts[pathParts.length - 2]; // "open" or "click"
  const emailHistoryId = pathParts[pathParts.length - 1];
  const providedSignature = url.searchParams.get("sig");

  if (!emailHistoryId) {
    return new Response("Missing email ID", { status: 400 });
  }

  // Verify HMAC signature to prevent tracking data pollution
  const trackingSecret = Deno.env.get("EMAIL_TRACKING_SECRET");
  if (!trackingSecret) {
    console.error("EMAIL_TRACKING_SECRET not configured");
    // Still return pixel to not break emails, but don't record
    if (action === "open") {
      return new Response(TRACKING_PIXEL, {
        headers: { "Content-Type": "image/gif" },
      });
    }
    return new Response("Server configuration error", { status: 500 });
  }

  if (!providedSignature) {
    console.warn("Missing signature for email tracking request:", emailHistoryId);
    // Return pixel but don't record - prevents breaking old emails
    if (action === "open") {
      return new Response(TRACKING_PIXEL, {
        headers: { "Content-Type": "image/gif" },
      });
    }
    return new Response("Missing signature", { status: 403 });
  }

  const isValidSignature = await verifyHmacSignature(emailHistoryId, providedSignature, trackingSecret);
  if (!isValidSignature) {
    console.warn("Invalid signature for email tracking request:", emailHistoryId);
    // Return pixel but don't record
    if (action === "open") {
      return new Response(TRACKING_PIXEL, {
        headers: { "Content-Type": "image/gif" },
      });
    }
    return new Response("Invalid signature", { status: 403 });
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

      // Validate redirect URL to prevent open redirect attacks
      const allowedDomains = [
        "id-preview--01c31deb-9b7d-4cf9-9561-907610f4aa1c.lovable.app",
        "lovable.app",
        "accountabilitycircle.com", // Add your custom domain when applicable
      ];
      
      let isValidRedirect = false;
      try {
        const parsedUrl = new URL(redirectUrl);
        // Check if the hostname ends with any allowed domain
        isValidRedirect = allowedDomains.some(domain => 
          parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
        );
      } catch {
        // Invalid URL format
        console.error("Invalid redirect URL format:", redirectUrl);
        return new Response("Invalid redirect URL", { status: 400 });
      }

      if (!isValidRedirect) {
        console.warn("Blocked redirect to untrusted domain:", redirectUrl);
        return new Response("Redirect to untrusted domain not allowed", { status: 403 });
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

      // Redirect to the validated URL
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
