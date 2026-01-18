import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Clock } from "lucide-react";
import logo from "@/assets/accountability-circle-logo.png";

const ApplicationSubmitted = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="flex justify-center">
            <img src={logo} alt="Accountability Circle" className="h-16 w-auto" />
          </div>
          
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Thank You for Applying!
            </h1>
            <p className="text-muted-foreground">
              Your application has been successfully submitted.
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">What happens next?</p>
              <p className="text-sm text-muted-foreground">
                Your application is now pending review. You'll hear back from us within <strong>3-5 working days</strong> via email.
              </p>
            </div>
          </div>
          
          <div className="pt-2">
            <Button asChild variant="outline">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationSubmitted;
