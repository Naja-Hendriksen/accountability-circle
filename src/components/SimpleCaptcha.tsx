import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface SimpleCaptchaProps {
  onValidChange: (isValid: boolean) => void;
}

const SimpleCaptcha = ({ onValidChange }: SimpleCaptchaProps) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");

  const generateNewChallenge = useCallback(() => {
    const newNum1 = Math.floor(Math.random() * 10) + 1;
    const newNum2 = Math.floor(Math.random() * 10) + 1;
    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer("");
    onValidChange(false);
  }, [onValidChange]);

  useEffect(() => {
    generateNewChallenge();
  }, []);

  useEffect(() => {
    const correctAnswer = num1 + num2;
    const parsedAnswer = parseInt(userAnswer, 10);
    onValidChange(!isNaN(parsedAnswer) && parsedAnswer === correctAnswer);
  }, [userAnswer, num1, num2, onValidChange]);

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
      <Label className="text-base font-medium">
        Spam Protection <span className="text-destructive">*</span>
      </Label>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-lg font-medium bg-background px-4 py-2 rounded-md border border-input">
          <span>{num1}</span>
          <span>+</span>
          <span>{num2}</span>
          <span>=</span>
        </div>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="?"
          className="w-20 text-center text-lg"
          aria-label="Enter the sum of the two numbers"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={generateNewChallenge}
          title="Get a new challenge"
          className="shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Please solve this simple math problem to verify you're human.
      </p>
    </div>
  );
};

export default SimpleCaptcha;
