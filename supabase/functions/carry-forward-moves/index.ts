import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Calculate week starts
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon...
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const currentWeekStart = new Date(now);
    currentWeekStart.setUTCDate(now.getUTCDate() - diffToMonday);
    currentWeekStart.setUTCHours(0, 0, 0, 0);
    const currentWeekStr = currentWeekStart.toISOString().split("T")[0];

    const prevWeekStart = new Date(currentWeekStart);
    prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);
    const prevWeekStr = prevWeekStart.toISOString().split("T")[0];

    console.log(`Carrying forward moves from ${prevWeekStr} to ${currentWeekStr}`);

    // Get all previous week entries
    const { data: prevEntries, error: prevError } = await supabase
      .from("weekly_entries")
      .select("id, user_id")
      .eq("week_start", prevWeekStr);

    if (prevError) throw prevError;
    if (!prevEntries?.length) {
      return new Response(
        JSON.stringify({ message: "No previous week entries found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing current week entries
    const userIds = prevEntries.map((e) => e.user_id);
    const { data: currentEntries, error: currentError } = await supabase
      .from("weekly_entries")
      .select("id, user_id")
      .eq("week_start", currentWeekStr)
      .in("user_id", userIds);

    if (currentError) throw currentError;

    const existingUserIds = new Set((currentEntries || []).map((e) => e.user_id));

    // Find users who need a new entry
    const usersNeedingEntry = prevEntries.filter(
      (e) => !existingUserIds.has(e.user_id)
    );

    let createdEntries = 0;
    let carriedMoves = 0;

    for (const prevEntry of usersNeedingEntry) {
      // Create current week entry
      const { data: newEntry, error: insertError } = await supabase
        .from("weekly_entries")
        .insert({ user_id: prevEntry.user_id, week_start: currentWeekStr })
        .select("id")
        .single();

      if (insertError) {
        console.error(`Failed to create entry for user ${prevEntry.user_id}:`, insertError);
        continue;
      }

      createdEntries++;

      // Get incomplete moves from previous week
      const { data: incompleteMoves, error: movesError } = await supabase
        .from("mini_moves")
        .select("title, notes, sort_order")
        .eq("weekly_entry_id", prevEntry.id)
        .eq("completed", false);

      if (movesError) {
        console.error(`Failed to fetch moves for entry ${prevEntry.id}:`, movesError);
        continue;
      }

      if (incompleteMoves?.length) {
        const { error: carryError } = await supabase.from("mini_moves").insert(
          incompleteMoves.map((m, i) => ({
            weekly_entry_id: newEntry.id,
            user_id: prevEntry.user_id,
            title: m.title,
            notes: m.notes || "",
            carried_forward: true,
            sort_order: i,
          }))
        );

        if (carryError) {
          console.error(`Failed to carry moves for user ${prevEntry.user_id}:`, carryError);
        } else {
          carriedMoves += incompleteMoves.length;
        }
      }
    }

    const result = {
      message: "Carry-forward complete",
      createdEntries,
      carriedMoves,
      skippedUsers: existingUserIds.size,
    };

    console.log(result);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Carry-forward error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
