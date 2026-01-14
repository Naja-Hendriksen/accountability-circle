import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Privacy = () => {
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
              <h1 className="text-3xl md:text-4xl font-display font-light mb-2">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground mb-8">
                Last updated: January 2026
              </p>
              <div className="w-16 h-px bg-primary/30 mb-8" />

              <div className="prose prose-neutral max-w-none space-y-8">
                {/* Introduction */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    1. Introduction
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    This Privacy Policy explains how we collect, use, store, and protect your personal data when you use the Women's Accountability Circle website and services. We are committed to protecting your privacy and handling your data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
                  </p>
                </section>

                {/* Data Controller */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    2. Data Controller
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    The data controller responsible for your personal data is:
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border">
                    <p className="text-foreground/80">
                      Women's Accountability Circle<br />
                      United Kingdom<br />
                      <br />
                      For any data protection enquiries, please contact us at:{" "}
                      <a href="mailto:najahendriksen@gmail.com" className="text-primary hover:underline">
                        najahendriksen@gmail.com
                      </a>
                    </p>
                  </div>
                </section>

                {/* Data We Collect */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    3. Data We Collect
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    We collect and process the following categories of personal data:
                  </p>
                  
                  <h3 className="text-lg font-medium text-foreground mt-6 mb-3">
                    3.1 Application Form Data
                  </h3>
                  <ul className="list-disc list-inside text-foreground/80 space-y-2 ml-4">
                    <li>Your name and email address</li>
                    <li>Country of residence (for time-zone purposes)</li>
                    <li>Availability and commitment level responses</li>
                    <li>Information about your growth goals and digital projects</li>
                    <li>Your responses to application questions</li>
                  </ul>

                  <h3 className="text-lg font-medium text-foreground mt-6 mb-3">
                    3.2 Account and Authentication Data
                  </h3>
                  <ul className="list-disc list-inside text-foreground/80 space-y-2 ml-4">
                    <li>Email address used for sign-up and login</li>
                    <li>Password (stored securely in encrypted form)</li>
                    <li>Profile information you choose to add (name, profile photo)</li>
                  </ul>

                  <h3 className="text-lg font-medium text-foreground mt-6 mb-3">
                    3.3 Member Dashboard Data
                  </h3>
                  <ul className="list-disc list-inside text-foreground/80 space-y-2 ml-4">
                    <li>Growth goals and monthly milestones you set</li>
                    <li>Weekly mini-moves (tasks) and progress updates</li>
                    <li>Wins, obstacles, and self-care notes you record</li>
                  </ul>
                </section>

                {/* Purposes and Legal Basis */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    4. Purposes and Legal Basis
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    We process your personal data for the following purposes and legal bases:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Processing Applications</h4>
                      <p className="text-foreground/80 text-sm">
                        <strong>Purpose:</strong> To review your application and determine suitability for the Accountability Circle.<br />
                        <strong>Legal Basis:</strong> Consent (Article 6(1)(a) UK GDPR) – You provide explicit consent when submitting the application form.
                      </p>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Managing Your Account</h4>
                      <p className="text-foreground/80 text-sm">
                        <strong>Purpose:</strong> To create and manage your member account, enable login, and provide access to the dashboard.<br />
                        <strong>Legal Basis:</strong> Contract (Article 6(1)(b) UK GDPR) – Processing is necessary to provide the services you have signed up for.
                      </p>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Facilitating Group Activities</h4>
                      <p className="text-foreground/80 text-sm">
                        <strong>Purpose:</strong> To share relevant progress information with other group members in the shared group view (limited to current and previous week only).<br />
                        <strong>Legal Basis:</strong> Consent (Article 6(1)(a) UK GDPR) – You consent to sharing when joining the group.
                      </p>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                      <h4 className="font-medium text-foreground mb-2">Communication</h4>
                      <p className="text-foreground/80 text-sm">
                        <strong>Purpose:</strong> To send you essential communications about your membership, including meeting reminders and group updates.<br />
                        <strong>Legal Basis:</strong> Legitimate Interest (Article 6(1)(f) UK GDPR) – It is in our mutual interest to keep you informed about group activities.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Data Retention */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    5. Data Retention
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    We retain your personal data only for as long as necessary to fulfil the purposes for which it was collected:
                  </p>
                  <ul className="list-disc list-inside text-foreground/80 space-y-2 ml-4">
                    <li>
                      <strong>Application data:</strong> If your application is unsuccessful, we will delete your data within 30 days of notifying you, unless you request earlier deletion.
                    </li>
                    <li>
                      <strong>Member account data:</strong> We retain your account data for the duration of your membership and for up to 30 days after the group ends or you leave, to allow for any final communications.
                    </li>
                    <li>
                      <strong>Dashboard data:</strong> Your goals, tasks, and progress notes are retained during your membership and deleted when your account is closed.
                    </li>
                  </ul>
                  <p className="text-foreground/80 leading-relaxed mt-4">
                    You may request deletion of your data at any time by contacting us (see "Your Rights" below).
                  </p>
                </section>

                {/* Data Sharing */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    6. Data Sharing
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    We do not sell, trade, or rent your personal data to third parties. Your data may be shared only in the following limited circumstances:
                  </p>
                  <ul className="list-disc list-inside text-foreground/80 space-y-2 ml-4">
                    <li>
                      <strong>With other group members:</strong> Limited information (name, profile photo, current week's goals and progress) is visible to other members in the shared group view.
                    </li>
                    <li>
                      <strong>Service providers:</strong> We use trusted third-party services to host our website and store data securely. These providers are contractually bound to protect your data.
                    </li>
                    <li>
                      <strong>Legal requirements:</strong> We may disclose your data if required by law, court order, or government regulation.
                    </li>
                  </ul>
                </section>

                {/* Data Security */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    7. Data Security
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, secure authentication systems, and regular security reviews. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                  </p>
                </section>

                {/* Your Rights */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    8. Your Rights
                  </h2>
                  <p className="text-foreground/80 leading-relaxed mb-4">
                    Under the UK GDPR, you have the following rights regarding your personal data:
                  </p>
                  <ul className="list-disc list-inside text-foreground/80 space-y-2 ml-4">
                    <li>
                      <strong>Right of Access:</strong> You can request a copy of the personal data we hold about you.
                    </li>
                    <li>
                      <strong>Right to Rectification:</strong> You can request correction of inaccurate or incomplete data.
                    </li>
                    <li>
                      <strong>Right to Erasure:</strong> You can request deletion of your personal data ("right to be forgotten").
                    </li>
                    <li>
                      <strong>Right to Restrict Processing:</strong> You can request that we limit how we use your data.
                    </li>
                    <li>
                      <strong>Right to Data Portability:</strong> You can request a copy of your data in a machine-readable format.
                    </li>
                    <li>
                      <strong>Right to Object:</strong> You can object to processing based on legitimate interests.
                    </li>
                    <li>
                      <strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you can withdraw it at any time.
                    </li>
                  </ul>
                  <p className="text-foreground/80 leading-relaxed mt-4">
                    To exercise any of these rights, please contact us at{" "}
                    <a href="mailto:najahendriksen@gmail.com" className="text-primary hover:underline">
                      najahendriksen@gmail.com
                    </a>
                    . We will respond to your request within one month.
                  </p>
                </section>

                {/* Complaints */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    9. Complaints
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    If you are not satisfied with how we handle your personal data, you have the right to lodge a complaint with the Information Commissioner's Office (ICO), the UK supervisory authority for data protection:
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border mt-4">
                    <p className="text-foreground/80">
                      Information Commissioner's Office<br />
                      Wycliffe House, Water Lane<br />
                      Wilmslow, Cheshire SK9 5AF<br />
                      <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        https://ico.org.uk
                      </a>
                    </p>
                  </div>
                </section>

                {/* Changes to Policy */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    10. Changes to This Policy
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any significant changes by posting a notice on our website or by email. We encourage you to review this policy periodically.
                  </p>
                </section>

                {/* Contact */}
                <section>
                  <h2 className="text-xl font-display font-medium text-foreground mb-4">
                    11. Contact Us
                  </h2>
                  <p className="text-foreground/80 leading-relaxed">
                    If you have any questions about this Privacy Policy or how we handle your personal data, please contact us at{" "}
                    <a href="mailto:najahendriksen@gmail.com" className="text-primary hover:underline">
                      najahendriksen@gmail.com
                    </a>
                    .
                  </p>
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

export default Privacy;
