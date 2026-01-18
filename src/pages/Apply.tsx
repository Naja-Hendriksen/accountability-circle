import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SimpleCaptcha from "@/components/SimpleCaptcha";

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

const Apply = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");
  const [commitmentLevel, setCommitmentLevel] = useState([7]);
  const [commitmentExplanation, setCommitmentExplanation] = useState("");
  const [growthGoal, setGrowthGoal] = useState("");
  const [digitalProduct, setDigitalProduct] = useState("");
  const [excitement, setExcitement] = useState("");
  const [agreeGuidelines, setAgreeGuidelines] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  
  const handleCaptchaChange = useCallback((isValid: boolean) => {
    setCaptchaValid(isValid);
  }, []);

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!firstName.trim()) {
      toast({ title: "Please enter your first name", variant: "destructive" });
      return;
    }
    if (!lastName.trim()) {
      toast({ title: "Please enter your last name", variant: "destructive" });
      return;
    }
    if (!email.trim()) {
      toast({ title: "Please enter your email address", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    if (!location) {
      toast({ title: "Please select your location", variant: "destructive" });
      return;
    }
    if (!availability) {
      toast({ title: "Please select your availability", variant: "destructive" });
      return;
    }
    if (!commitmentExplanation.trim()) {
      toast({ title: "Please explain your commitment rating", variant: "destructive" });
      return;
    }
    if (!growthGoal.trim()) {
      toast({ title: "Please describe your growth goal", variant: "destructive" });
      return;
    }
    if (countWords(growthGoal) > 150) {
      toast({ title: "Growth goal exceeds 150 words", variant: "destructive" });
      return;
    }
    if (!digitalProduct.trim()) {
      toast({ title: "Please describe your digital product", variant: "destructive" });
      return;
    }
    if (countWords(digitalProduct) > 200) {
      toast({ title: "Digital product description exceeds 200 words", variant: "destructive" });
      return;
    }
    if (!excitement.trim()) {
      toast({ title: "Please share what excites you about joining", variant: "destructive" });
      return;
    }
    if (countWords(excitement) > 100) {
      toast({ title: "Excitement response exceeds 100 words", variant: "destructive" });
      return;
    }
    if (!agreeGuidelines) {
      toast({ title: "Please indicate whether you agree to the group guidelines", variant: "destructive" });
      return;
    }
    if (!consentGiven) {
      toast({ title: "Please provide consent to proceed", variant: "destructive" });
      return;
    }
    if (!captchaValid) {
      toast({ title: "Please solve the math problem correctly", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from("applications").insert({
        first_name: firstName,
        last_name: lastName,
        email,
        location,
        availability,
        commitment_level: commitmentLevel[0],
        commitment_explanation: commitmentExplanation,
        growth_goal: growthGoal,
        digital_product: digitalProduct,
        excitement,
        agreed_to_guidelines: agreeGuidelines === "yes",
        gdpr_consent: consentGiven,
      });

      if (error) throw error;

      // Notify admin about new application (fire and forget - don't block user)
      supabase.functions.invoke("notify-new-application", {
        body: {
          firstName,
          lastName,
          email,
          location,
          availability,
          commitmentLevel: commitmentLevel[0],
          growthGoal,
          digitalProduct,
        },
      }).catch((notifyError) => {
        console.error("Failed to send admin notification:", notifyError);
      });

      // Navigate to thank you page
      navigate("/application-submitted");
    } catch (error) {
      console.error("Error submitting application:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl md:text-4xl font-display font-light mb-4">
                Application for Women's Accountability Circle
              </CardTitle>
              <div className="w-16 h-px bg-primary/30 mx-auto mb-6" />
              <div className="text-left space-y-4 text-foreground/80">
                <p>
                  Thank you for your interest in our weekly online accountability circle! We meet every Monday at 10am (UK/GMT time) on Zoom to connect, share our Mini Goals and progress toward building digital products/assets.
                </p>
                <p>
                  We're looking for committed women who can attend consistently, contribute value to others and are actively working on their own digital projects. Please answer honestly – this will help us ensure a great fit for everyone.
                </p>
                <p className="text-sm text-muted-foreground italic">
                  To keep things simple and protect everyone's privacy, please avoid sharing any financial, health, family or other sensitive personal information in your answers. We're only collecting basic details about your project and availability.
                </p>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* First Name */}
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-base font-medium">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-base font-medium">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-medium">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>

                {/* Question 1: Location */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    1. What is your current location? <span className="text-muted-foreground font-normal">(For time-zone purposes)</span>
                  </Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Question 2: Availability */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    2. Are you available to attend a 1-hour Zoom meeting every week at 10am GMT?
                  </Label>
                  <RadioGroup value={availability} onValueChange={setAvailability} className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="yes-consistently" id="avail-1" />
                      <Label htmlFor="avail-1" className="font-normal cursor-pointer">Yes, consistently</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="yes-mostly" id="avail-2" />
                      <Label htmlFor="avail-2" className="font-normal cursor-pointer">Yes, most weeks but may miss occasionally</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="no" id="avail-3" />
                      <Label htmlFor="avail-3" className="font-normal cursor-pointer">No, my schedule varies too much</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Question 3: Commitment Level */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    3. On a scale of 1-10, how committed are you to showing up weekly and actively participating?
                  </Label>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>1 (Not very committed)</span>
                      <span>10 (Fully committed)</span>
                    </div>
                    <Slider
                      value={commitmentLevel}
                      onValueChange={setCommitmentLevel}
                      min={1}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-center">
                      <span className="text-2xl font-display text-primary">{commitmentLevel[0]}</span>
                      <span className="text-muted-foreground"> / 10</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Briefly explain your rating:</Label>
                    <Textarea
                      value={commitmentExplanation}
                      onChange={(e) => setCommitmentExplanation(e.target.value)}
                      placeholder="Why did you choose this rating?"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                {/* Question 4: Growth Goal */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    4. What is your overall growth goal for the next 3-6 months, and how does building this digital product/asset fit into it?
                  </Label>
                  <Textarea
                    value={growthGoal}
                    onChange={(e) => setGrowthGoal(e.target.value)}
                    placeholder="Share your goals..."
                    className="min-h-[120px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    {countWords(growthGoal)} / 150 words
                  </p>
                </div>

                {/* Question 5: Digital Product */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    5. Describe the digital product or asset you're currently building (or planning to build as your first one). What stage are you at?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    E.g., idea, testing, prototyping, launching
                  </p>
                  <Textarea
                    value={digitalProduct}
                    onChange={(e) => setDigitalProduct(e.target.value)}
                    placeholder="Describe your project..."
                    className="min-h-[140px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    {countWords(digitalProduct)} / 200 words
                  </p>
                </div>

                {/* Question 6: Excitement */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    6. What excites you most about joining a group of women sharing their journeys in building digital products?
                  </Label>
                  <Textarea
                    value={excitement}
                    onChange={(e) => setExcitement(e.target.value)}
                    placeholder="Share what excites you..."
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    {countWords(excitement)} / 100 words
                  </p>
                </div>

                {/* Question 7: Group Guidelines */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    7. Do you agree to our group guidelines?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    E.g., Attend at least 80% of meetings, share weekly updates, provide constructive feedback to others and respect confidentiality.{" "}
                    <Link to="/guidelines" className="text-primary hover:underline">
                      View full Group Guidelines here
                    </Link>
                  </p>
                  <RadioGroup value={agreeGuidelines} onValueChange={setAgreeGuidelines} className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="yes" id="guidelines-yes" />
                      <Label htmlFor="guidelines-yes" className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="no" id="guidelines-no" />
                      <Label htmlFor="guidelines-no" className="font-normal cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Question 8: GDPR Consent */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <Label className="text-base font-medium">
                    8. Consent to Data Collection
                  </Label>
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="consent" 
                      checked={consentGiven}
                      onCheckedChange={(checked) => setConsentGiven(checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor="consent" className="font-normal text-sm leading-relaxed cursor-pointer">
                      I consent to the collection and processing of my name, email address, and questionnaire responses for the purpose of managing the Accountability Circle group. I understand that my data will be handled in accordance with the{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      {" "}and that I can withdraw my consent or request deletion of my data at any time by contacting the group facilitator.
                    </Label>
                  </div>
                </div>

                {/* CAPTCHA Verification */}
                <SimpleCaptcha onValidChange={handleCaptchaChange} />

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit" 
                    size="lg" 
                    className="w-full text-lg py-6 h-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Apply;
