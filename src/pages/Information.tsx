import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, LayoutDashboard, Users, Clock, Calendar, ClipboardCheck } from "lucide-react";

export default function Information() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Information
          </h1>
          <p className="text-muted-foreground mt-1">
            Everything you need to know about the Accountability Circle
          </p>
        </div>

        {/* Zoom Call Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Weekly Accountability Call */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Weekly Accountability Call</CardTitle>
                  <CardDescription>Join us every week to check in and stay on track</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Every Monday</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>10:00 AM (UK Time)</span>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p><span className="font-medium">Meeting ID:</span> 891 9614 3956</p>
                <p><span className="font-medium">Passcode:</span> 478939</p>
              </div>
              
              <Button 
                asChild 
                size="lg" 
                className="w-full"
              >
                <a 
                  href="https://us06web.zoom.us/j/89196143956?pwd=bsuVc9l15ExlF0lESkK7y1H6vXarts.1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Zoom Call
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Before You Join */}
          <Card className="border-primary/20 bg-gradient-to-br from-accent/5 to-primary/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <ClipboardCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Before You Join</CardTitle>
                  <CardDescription>Prepare to make the most of our time together</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-muted-foreground space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">1.</span>
                  <span>Review and update your mini-moves from last week — mark what you completed and reflect on any blockers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">2.</span>
                  <span>Set your new mini-moves for this week — 3-5 focused actions that move you towards your monthly milestone.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-medium">3.</span>
                  <span>Note any wins to celebrate and obstacles where you'd like group support.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* How My Dashboard Works */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <LayoutDashboard className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle>How "My Dashboard" Works</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              Your personal dashboard is your command center for tracking progress towards your goals. Here's what you can do:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <span className="font-medium text-foreground">Growth Goal</span> — Set your 3-6 month overarching goal. This is the big picture vision you're working towards.
              </li>
              <li>
                <span className="font-medium text-foreground">Monthly Milestones</span> — Break down your growth goal into monthly focus areas to stay on track.
              </li>
              <li>
                <span className="font-medium text-foreground">Weekly Mini-Moves</span> — Add 3-5 small, actionable tasks each week that move you closer to your monthly milestone. You can mark them as complete and edit both this week's and last week's tasks.
              </li>
              <li>
                <span className="font-medium text-foreground">Wins & Reflections</span> — Celebrate your wins, big or small! Record what went well each week.
              </li>
              <li>
                <span className="font-medium text-foreground">Obstacles</span> — Note any challenges you faced. Sharing these helps you get support from the group.
              </li>
              <li>
                <span className="font-medium text-foreground">Self-Care</span> — Remember, self-care is strategic! Record how you're taking care of yourself.
              </li>
              <li>
                <span className="font-medium text-foreground">Historical Mini-Moves</span> — View all your past weeks' mini-moves in a read-only format to track your journey.
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* How Group View Works */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Users className="h-5 w-5 text-foreground" />
              </div>
              <CardTitle>How "Group View" Works</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              The Group View is your window into your accountability partners' progress. It's designed to foster connection and mutual support:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <span className="font-medium text-foreground">Member Progress</span> — See each member's growth goal, monthly focus, and their current and previous week's mini-moves and completion rates.
              </li>
              <li>
                <span className="font-medium text-foreground">Wins & Obstacles</span> — Read about what's going well for others and what challenges they're facing. Use this to offer encouragement and support.
              </li>
              <li>
                <span className="font-medium text-foreground">Search & Filter</span> — Quickly find a specific member using the search bar to review their updates before calls.
              </li>
              <li>
                <span className="font-medium text-foreground">Ask The Group</span> — Post questions to get feedback, advice, or support from your accountability circle. You can also reply to others' questions and react with likes.
              </li>
            </ul>
            <p className="mt-4 text-sm bg-muted/50 p-3 rounded-lg">
              <span className="font-medium text-foreground">Tip:</span> Before each Monday call, review the Group View to see everyone's progress. This helps you come prepared to offer meaningful support and celebration.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}