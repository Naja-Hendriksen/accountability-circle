import { Link } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Guidelines = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <Card className="border-primary/20">
            <CardContent className="p-8 md:p-12">
              <p className="text-primary font-medium tracking-widest uppercase mb-2 text-sm">
                Women's Accountability Circle
              </p>
              <h1 className="text-3xl md:text-4xl font-display font-light mb-2">
                Group Guidelines & Commitment Agreement
              </h1>
              <div className="w-16 h-px bg-primary/30 my-8" />

              <div className="space-y-10">
                {/* Purpose */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    Purpose of the Group
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    This is a supportive, high-commitment weekly online circle for women actively building (or launching their first) digital products or assets (e.g., courses, eBooks, templates, memberships, apps, content sites etc.). We meet to:
                  </p>
                  <ul className="space-y-3 ml-4">
                    {[
                      'Set and share small, actionable "mini moves" each week toward our bigger growth goals.',
                      "Provide honest, constructive feedback and celebration.",
                      "Hold each other accountable in a kind, non-judgmental space.",
                      "Build momentum through shared journeys and mutual inspiration."
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-foreground/80 leading-relaxed mt-4 italic">
                    The group thrives when every member shows up fully, contributes value (not just takes it), and respects the container we create together.
                  </p>
                </section>

                {/* Core Commitments */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    Core Commitments <span className="text-primary">(Non-Negotiable)</span>
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-6">
                    By joining, you agree to:
                  </p>

                  {/* 1. Attendance */}
                  <div className="bg-muted/30 p-6 rounded-lg border border-border mb-4">
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      1. Attendance
                    </h3>
                    <ul className="space-y-2 text-foreground/80">
                      <li>• Attend at least <strong>80% of weekly Zoom meetings</strong> (e.g., miss no more than 1 in 5).</li>
                      <li>• If you know you'll miss, notify the group in advance by emailing the facilitator.</li>
                      <li>• Consistent absence (below 80%) may result in a gentle check-in and, if unresolved, removal to protect group energy.</li>
                    </ul>
                  </div>

                  {/* 2. Weekly Participation */}
                  <div className="bg-muted/30 p-6 rounded-lg border border-border mb-4">
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      2. Weekly Participation
                    </h3>
                    <p className="text-foreground/80 mb-3">Come prepared each week with:</p>
                    <ul className="space-y-2 text-foreground/80 ml-4">
                      <li>• Your <strong>Mini Moves</strong> from the previous week (what you achieved or learned).</li>
                      <li>• Your <strong>new Mini Moves</strong> for the coming week.</li>
                      <li>• A brief update on your digital product/asset progress.</li>
                      <li>• Willingness to listen actively and offer constructive input to at least 1–2 other members.</li>
                    </ul>
                  </div>

                  {/* 3. Giving & Receiving Value */}
                  <div className="bg-muted/30 p-6 rounded-lg border border-border mb-4">
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      3. Giving & Receiving Value
                    </h3>
                    <p className="text-foreground/80">
                      This is a <strong>reciprocal space</strong>. Share generously (ideas, resources, encouragement, clarifying questions), celebrate wins and provide kind, specific feedback. We aim for <em>curiosity over quick advice</em> unless asked. No one is here just to "soak up" — everyone contributes.
                    </p>
                  </div>

                  {/* 4. Confidentiality */}
                  <div className="bg-muted/30 p-6 rounded-lg border border-border mb-4">
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      4. Confidentiality
                    </h3>
                    <p className="text-foreground/80">
                      <strong>What is shared in the group stays in the group.</strong> No screenshots, recordings (unless all agree for a specific reason), or sharing outside without explicit permission. This builds safety for vulnerability.
                    </p>
                  </div>

                  {/* 5. Respect & Communication */}
                  <div className="bg-muted/30 p-6 rounded-lg border border-border mb-4">
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      5. Respect & Communication
                    </h3>
                    <ul className="space-y-2 text-foreground/80">
                      <li>• Be punctual, cameras on when possible (for connection), mute when not speaking, no multitasking/side chats.</li>
                      <li>• Use kind, direct language.</li>
                      <li>• If conflict arises, address it privately first or bring to the facilitator for mediation.</li>
                      <li>• No solicitation, spam, or off-topic promotion.</li>
                    </ul>
                  </div>

                  {/* 6. Resilience & Ownership */}
                  <div className="bg-muted/30 p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-medium text-foreground mb-3">
                      6. Resilience & Ownership
                    </h3>
                    <p className="text-foreground/80">
                      Life happens, but we commit to <strong>communicating setbacks openly</strong> rather than ghosting. If you're stuck, ask for support — we're here to help each other through plateaus.
                    </p>
                  </div>
                </section>

                {/* Group Structure & Logistics */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    Group Structure & Logistics
                  </h2>
                  <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                    <ul className="space-y-3 text-foreground/80">
                      <li><strong>Meetings:</strong> Weekly on Zoom, Mondays 10am GMT / London time.</li>
                      <li><strong>Duration:</strong> 60 minutes.</li>
                      <li><strong>Group size:</strong> 6 women max for depth and airtime.</li>
                    </ul>
                  </div>
                </section>

                {/* Term & Commitment Level */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    Term & Commitment Level
                  </h2>
                  <div className="space-y-4 text-foreground/80">
                    <div className="bg-muted/30 p-6 rounded-lg border border-border">
                      <h3 className="font-medium text-foreground mb-2">Initial Commitment Period</h3>
                      <p>
                        The group runs in <strong>3-month cycles</strong> (e.g., Feb–Apr, May–Jul, etc.) to allow focused progress and natural renewal.
                      </p>
                    </div>
                    
                    <div className="bg-muted/30 p-6 rounded-lg border border-border">
                      <h3 className="font-medium text-foreground mb-2">Paid Membership</h3>
                      <p className="mb-3">
                        This is a paid group at <strong>£25/week</strong>, £100/month or £300 for the 3-month cycle, due upfront or weekly/monthly. Payment confirms your spot and signals serious commitment.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Once you commit and pay for or subscribe to a cycle, the fee is non-refundable and non-transferable (no prorated refunds for missed meetings or early exit), except in extreme circumstances at the facilitator's discretion. This ensures everyone invests fully and reduces drop-off that harms group cohesion.
                      </p>
                    </div>

                    <div className="bg-muted/30 p-6 rounded-lg border border-border">
                      <h3 className="font-medium text-foreground mb-2">Renewal</h3>
                      <p>
                        At the end of each 3-month cycle, members can choose to renew or step out gracefully, with no pressure. New members may join at cycle starts if space allows.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Consequences */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    Consequences for Breaking Agreements
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    If commitments aren't met repeatedly (e.g., frequent no-shows without notice, lack of contribution), the facilitator will have a private conversation. If patterns continue, the member may be asked to step out to preserve the group's integrity and energy.
                  </p>
                </section>

                {/* Agreement */}
                <section className="border-t border-border pt-8">
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    Agreement
                  </h2>
                  <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                    <p className="text-foreground leading-relaxed italic">
                      "I have read, understand, and fully agree to these Group Guidelines. I commit to showing up as described and contributing to a powerful, supportive space for all members."
                    </p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>

          {/* Footer link back */}
          <div className="text-center mt-8">
            <Link 
              to="/apply" 
              className="text-primary hover:underline"
            >
              Return to Application Form
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Guidelines;
