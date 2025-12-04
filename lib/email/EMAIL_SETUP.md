# Email Notifications Setup Guide

## Overview

The application sends automatic email notifications for work review workflow:
- **Work Approved**: Email sent to teacher when work is published
- **Work Rejected**: Email sent to teacher with admin feedback
- **Work Submitted**: Email sent to admin(s) when teacher submits for review (optional)

Currently, email notifications are **logged to console** but not actually sent. You need to configure an email service to enable actual sending.

## Configuration Options

### Option 1: Supabase Custom Email Templates (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to: **Authentication** → **Email Templates**

2. **Create Custom Templates**
   
   You need to create 3 custom email templates:

   **Template 1: Work Approved**
   ```
   Subject: ✅ Your work "{{.WorkTitle}}" has been approved
   
   Hello {{.TeacherName}},
   
   Great news! Your work "{{.WorkTitle}}" (Class: {{.ClassName}}) has been approved and is now published!
   
   View your published work:
   {{.WorkUrl}}
   
   Thank you for your contribution.
   
   QuadriParlanti Team
   ```

   **Template 2: Work Rejected**
   ```
   Subject: 🔄 Your work "{{.WorkTitle}}" needs revision
   
   Hello {{.TeacherName}},
   
   Your work "{{.WorkTitle}}" requires some changes before publication.
   
   Administrator feedback:
   {{.Feedback}}
   
   You can edit your work here:
   {{.EditUrl}}
   
   QuadriParlanti Team
   ```

   **Template 3: Work Submitted (for Admins)**
   ```
   Subject: 📝 New work submitted for review: "{{.WorkTitle}}"
   
   Hello Admin,
   
   Teacher {{.TeacherName}} has submitted a new work for review:
   
   Title: {{.WorkTitle}}
   Class: {{.ClassName}}
   School Year: {{.SchoolYear}}
   
   Review the work here:
   {{.ReviewUrl}}
   
   QuadriParlanti System
   ```

3. **Update Code**
   
   After creating templates, update `lib/email/send-work-notification.ts` to use Supabase's email API instead of console.log:

   ```typescript
   // Replace console.log with actual API call
   await supabase.auth.admin.sendEmail({
     to: work.users.email,
     template: 'work-approved', // Your template name
     data: {
       teacherName: work.users.name,
       workTitle: work.title_it,
       className: work.class_name,
       workUrl,
     },
   });
   ```

### Option 2: Third-Party Email Service

Alternatively, use services like:
- **Resend** (recommended for Next.js)
- **SendGrid**
- **AWS SES**
- **Mailgun**

Example using Resend:

1. **Install Resend**
   ```bash
   npm install resend
   ```

2. **Update send-work-notification.ts**
   ```typescript
   import { Resend } from 'resend';
   
   const resend = new Resend(process.env.RESEND_API_KEY);
   
   export async function sendWorkApprovedEmail(workId: string) {
     // ... fetch work data ...
     
     await resend.emails.send({
       from: 'noreply@yourdomain.com',
       to: work.users.email,
       subject: \`✅ Your work "\${work.title_it}" has been approved\`,
       html: \`
         <h2>Work Approved!</h2>
         <p>Hello \${work.users.name},</p>
         <p>Your work "\${work.title_it}" has been published.</p>
         <a href="\${workUrl}">View your work</a>
       \`,
     });
   }
   ```

3. **Add API Key to .env.local**
   ```env
   RESEND_API_KEY=your_api_key_here
   ```

### Option 3: Custom SMTP

Configure custom SMTP in Supabase:

1. Go to: **Project Settings** → **Auth** → **SMTP Settings**
2. Enable custom SMTP
3. Configure your SMTP server details
4. Update email templates as needed

## Environment Variables

Add to `.env.local`:

```env
# Site URL for email links
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Email Service (if using third-party)
RESEND_API_KEY=your_api_key
# or
SENDGRID_API_KEY=your_api_key
```

## Testing Email Notifications

1. **Create a test work** as a teacher
2. **Submit for review**
3. **Approve/Reject** as admin
4. **Check console** for logged email details
5. **Check teacher's email** once configured

## Email Templates Best Practices

- **Subject lines**: Clear, action-oriented (max 50 chars)
- **Content**: Professional, concise, include action links
- **Personalization**: Use teacher/admin names
- **Branding**: Include school name, logo
- **Mobile-friendly**: Keep content simple, links tappable
- **Localization**: Consider IT/EN versions if app is multilingual

## Troubleshooting

### Emails not sending
- Check console for error messages
- Verify API keys are correct
- Check Supabase logs (Dashboard → Logs)
- Ensure email service is configured
- Check spam folder

### Wrong recipient
- Verify user.email in database
- Check work.created_by relationship
- Ensure admin users have role='admin'

### Template not rendering
- Check variable names match exactly
- Ensure template is published/active
- Test with simple template first

## Current Status

✅ **Logging**: Email details are logged to console  
⏳ **Actual Sending**: Requires configuration (follow this guide)  
✅ **Integration**: Hooks are in place in review actions  

## Next Steps

1. Choose an email service (Option 1, 2, or 3 above)
2. Configure templates or API keys
3. Update `send-work-notification.ts` to remove console.log
4. Test with real users
5. Monitor email delivery rates

---

For more help:
- [Supabase Auth Emails](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)
