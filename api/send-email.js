import { Resend } from 'resend';

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get form data
        const { name, email, subject, message } = req.body;

        // Validate inputs
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                received: { name: !!name, email: !!email, subject: !!subject, message: !!message }
            });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address'
            });
        }

        // Check if environment variables are set
        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not set');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error: Missing API key'
            });
        }

        if (!process.env.RECIPIENT_EMAIL) {
            console.error('RECIPIENT_EMAIL is not set');
            return res.status(500).json({
                success: false,
                error: 'Server configuration error: Missing recipient email'
            });
        }

        // Initialize Resend with API key
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Send email notification
        const emailData = await resend.emails.send({
            from: 'Deep Vault Collective <onboarding@resend.dev>',
            to: [process.env.RECIPIENT_EMAIL],
            subject: `📬 [${subject}] Message from ${name}`,
            replyTo: email, // Lets you hit "Reply" to respond directly
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0a0412 0%, #12081d 100%); color: #ffffff;">
                    <h2 style="color: #00d9ff; border-bottom: 2px solid #4EBBD2; padding-bottom: 12px; letter-spacing: 2px;">
                        ✦ NEW CONTACT FORM SUBMISSION
                    </h2>
                    
                    <div style="background-color: rgba(0, 217, 255, 0.05); padding: 24px; margin: 24px 0; border: 1px solid rgba(0, 217, 255, 0.2);">
                        <p style="margin: 8px 0;"><strong style="color: #4EBBD2;">From:</strong> ${name}</p>
                        <p style="margin: 8px 0;"><strong style="color: #4EBBD2;">Email:</strong> <a href="mailto:${email}" style="color: #00d9ff; text-decoration: none;">${email}</a></p>
                        <p style="margin: 8px 0;"><strong style="color: #4EBBD2;">Subject:</strong> <span style="color: #ffffff;">${subject}</span></p>
                        <p style="margin: 8px 0;"><strong style="color: #4EBBD2;">Sent:</strong> ${new Date().toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles',
                dateStyle: 'full',
                timeStyle: 'long'
            })}</p>
                    </div>
                    
                    <div style="background-color: rgba(255, 255, 255, 0.03); padding: 24px; margin: 24px 0; border-left: 3px solid #00d9ff;">
                        <p style="color: #4EBBD2; margin-bottom: 12px;"><strong>MESSAGE:</strong></p>
                        <p style="color: #e0e0e0; line-height: 1.8; white-space: pre-wrap; font-size: 15px;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                    </div>
                    
                    <div style="margin-top: 30px; padding: 18px; background-color: rgba(0, 217, 255, 0.08); border: 1px solid rgba(0, 217, 255, 0.3);">
                        <p style="color: #00d9ff; font-size: 13px; margin: 0;">
                            💡 <strong>Quick Reply:</strong> Just hit "Reply" to respond directly to ${name}
                        </p>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <p style="color: rgba(255, 255, 255, 0.4); font-size: 11px; margin: 0; letter-spacing: 1px;">
                            SENT FROM DEEP VAULT COLLECTIVE WEBSITE
                        </p>
                    </div>
                </div>
            `
        });

        console.log('✅ Email sent successfully:', emailData);

        // Success response
        return res.status(200).json({
            success: true,
            messageId: emailData.id,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('❌ Email sending error:', error);

        // Provide specific error messages
        let errorMessage = 'Failed to send email';
        if (error.message.includes('API key')) {
            errorMessage = 'Email service configuration error';
        } else if (error.message.includes('rate limit')) {
            errorMessage = 'Too many requests. Please try again later.';
        }

        return res.status(500).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}