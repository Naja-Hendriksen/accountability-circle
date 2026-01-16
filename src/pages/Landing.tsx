import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Users, Target, Heart, Calendar, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import najaPhoto from "@/assets/naja-facilitator.jpg";
const Landing = () => {
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-6 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-primary font-medium tracking-widest uppercase mb-4">
              Women's Digital Creators
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-light text-foreground mb-6 leading-tight">
              Accountability Circle
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light mb-8">
              Inspiring and supportive weekly check-ins for women building digital assets and growing their business.
            </p>
            <div className="w-24 h-px bg-primary/30 mx-auto mb-12" />
            <div className="max-w-3xl mx-auto space-y-6 text-lg text-foreground/80 leading-relaxed">
              <p>
                Are you starting 2026 by building your first digital product or asset to grow your business, 
                but feel stuck or discouraged working alone? Welcome to the Accountability Circle, a supportive 
                space where women lift each other up, celebrate wins and keep moving forward together.
              </p>
              <p>
                Each week we meet to share progress, celebrate wins, and set focused goals for the week ahead. 
                Here, growth is collective; your journey inspires others, and their progress fuels yours.
              </p>
              <p className="text-primary font-medium">
                If you want to start the year in community with other ambitious women, and be part of this 
                task-oriented and goal driven Accountability Circle, apply below. Spaces are limited to 6 
                committed women, to keep the space big enough for mutual support, but small enough so 
                everyone gets a chance to share.
              </p>
            </div>
            <div className="mt-12">
              <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
                <Link to="/apply">Apply to Join the Circle</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Circle Is For */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-light text-center mb-16">
              Who This Circle Is For
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* For */}
              <Card className="border-primary/20 bg-card/50">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-display font-medium text-primary">Perfect for...</h3>
                  </div>
                  <ul className="space-y-4">
                    {["Women who have their own business or developing their first business", "Women who want to add a digital product or assets as part of growing their business", "Women who are motivated and willing to put consistent effort into reaching their goals", "Women excited by community and peer support", "Women who want accountability without pressure", "Women who are energised by showing up for one another each week", "Women who want to make the most of 2026 and are ready to show up for themselves, their business and each other"].map((item, index) => <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{item}</span>
                      </li>)}
                  </ul>
                </CardContent>
              </Card>

              {/* Not For */}
              <Card className="border-accent/20 bg-card/50">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <X className="w-5 h-5 text-accent" />
                    </div>
                    <h3 className="text-xl font-display font-medium text-accent">Not the right fit for...</h3>
                  </div>
                  <ul className="space-y-4">
                    {["Complete beginners without a defined idea or business to work on", "Women looking for step-by-step tutorials, full course or 1:1 tech setup or mentoring", "Women who are flaky or can't or don't show up for themselves or others on a consistent basis"].map((item, index) => <li key={index} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-foreground/80">{item}</span>
                      </li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Your Facilitator */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-light text-center mb-12">
              Meet Your Facilitator
            </h2>
            
            <Card className="border-primary/20 bg-card/50">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  <div className="shrink-0">
                    <img src={najaPhoto} alt="Naja Hendriksen" className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover border-4 border-primary/20 shadow-lg" />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-lg text-foreground/80 leading-relaxed">Hi, I'm Naja! I'm a mum of two, building my own fully digital business while juggling life and family. I've been creating online courses, video lessons, digital downloads, newsletters, websites and other digital assets, so I know what it's like to try to figure it all out on the go.</p>
                    <p className="text-lg text-foreground/80 leading-relaxed mt-4">I am looking for a small, curated group of women who are ready to support each other, stay accountable and grow their businesses together. I'll of course share what I've learned along the way, but mostly I am here to facilitate and join in our mutually supportive Accountability Circle.</p>
                    <p className="text-lg text-primary font-medium mt-4">I just know we can do more when we share the journey.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-display font-light text-center mb-6">
              What to Expect
            </h2>
            <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
              A structured yet supportive weekly rhythm designed to keep you moving forward.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[{
              icon: Calendar,
              title: "Weekly Zoom Calls",
              description: "Join our live weekly session to connect, share and plan together"
            }, {
              icon: Target,
              title: "Goal Setting",
              description: "Set focused weekly mini-moves that align with your bigger vision"
            }, {
              icon: Users,
              title: "Peer Support",
              description: "Share your wins, challenges and receive encouragement from the group"
            }, {
              icon: Heart,
              title: "Accountability",
              description: "Gentle, consistent accountability that keeps you on track"
            }].map((item, index) => <Card key={index} className="border-primary/10 bg-gradient-to-b from-card to-muted/20">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display font-medium mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>)}
            </div>

            <Card className="mt-12 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="p-8">
                <h3 className="text-xl font-display font-medium mb-4 text-center">Your Weekly Rhythm</h3>
                <div className="space-y-3 text-foreground/80 max-w-2xl mx-auto">
                  <p>
                    <strong className="text-foreground">Before the call:</strong> Update your dashboard with your mini-moves for the week
                  </p>
                  <p>
                    <strong className="text-foreground">During the call:</strong> Each member shares their progress, celebrates wins, and discusses any obstacles
                  </p>
                  <p>
                    <strong className="text-foreground">After the call:</strong> Stay motivated knowing your circle is cheering you on
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-light mb-6">
              Investment
            </h2>
            <p className="text-muted-foreground mb-12">
              A small commitment that keeps you accountable and invested in your growth.
            </p>

            <Card className="border-primary/30 bg-card shadow-lg">
              <CardContent className="p-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-primary font-medium tracking-wide uppercase text-sm">Membership</span>
                </div>
                <div className="mb-6">
                  <span className="text-5xl font-display font-light">£25</span>
                  <span className="text-muted-foreground text-lg"> / week</span>
                </div>
                <div className="w-16 h-px bg-primary/30 mx-auto mb-6" />
                <p className="text-foreground/80 mb-2">
                  Minimum commitment of <strong>12 weeks</strong> (3 months)
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  Paid as a subscription • Cancel anytime after your commitment
                </p>
                <ul className="text-left space-y-3 mb-8 max-w-sm mx-auto">
                  {["Weekly live group Zoom calls", "Private member dashboard", "Shared accountability view", "Small group of 6 women maximum", "Supportive community"].map((item, index) => <li key={index} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-foreground/80 text-sm">{item}</span>
                    </li>)}
                </ul>
                <Button size="lg" className="w-full text-lg py-6 h-auto" asChild>
                  <Link to="/apply">Apply to Join</Link>
                </Button>
              </CardContent>
            </Card>

            <p className="mt-8 text-sm text-muted-foreground">
              Applications are reviewed personally. You'll hear back within 48 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display font-light mb-6">
              Ready to Make 2026 Your Year?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join a circle of ambitious, supportive women who are committed to growing together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6 h-auto" asChild>
                <Link to="/apply">Apply to Join the Circle</Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto" asChild>
                <Link to="/auth">Already a Member? Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/50">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Women's Digital Creators Accountability Circle. All rights reserved.
          </p>
        </div>
      </footer>
    </div>;
};
export default Landing;