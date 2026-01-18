-- Insert the application received confirmation email template
INSERT INTO public.email_templates (template_key, subject, html_content, description)
VALUES (
  'application_received',
  'We''ve Received Your Application!',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h1 style="color: #333; margin-bottom: 24px;">
    Thank You for Applying, {{name}}!
  </h1>
  
  <p style="font-size: 16px; line-height: 1.6; color: #555;">
    We''ve received your application to join the Accountability Circle. Thank you for taking the time to share your goals and journey with us.
  </p>
  
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #007bff;">
    <h3 style="color: #333; margin-top: 0; margin-bottom: 12px;">What happens next?</h3>
    <p style="font-size: 15px; line-height: 1.6; color: #555; margin: 0;">
      Your application is now pending review. You''ll hear back from us within <strong>3-5 working days</strong> via email.
    </p>
  </div>
  
  <p style="font-size: 16px; line-height: 1.6; color: #555;">
    In the meantime, if you have any questions, feel free to reach out.
  </p>
  
  <p style="font-size: 16px; line-height: 1.6; color: #555; margin-top: 32px;">
    Warm regards,<br/>
    <strong>The Accountability Circle Team</strong>
  </p>
  
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
  
  <p style="font-size: 12px; color: #999; text-align: center;">
    This is an automated confirmation email. Please do not reply directly to this message.
  </p>
</div>',
  'Confirmation email sent to applicants after they submit their application'
);