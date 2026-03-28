import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const logoUrl = 'https://raw.githubusercontent.com/alex409235982/openos-assets/refs/heads/main/OPENOS%20Logo.png';

export async function sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset?token=${resetToken}`;

    const msg = {
        to: email,
        from: process.env.EMAIL_FROM,
        subject: 'Reset your OPENOS password',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @media only screen and (max-width: 600px) {
                    .container { padding: 16px !important; }
                    .button { width: 100% !important; }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #0b0f14 0%, #1a1f2c 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 24px;">
                <!-- Main Card -->
                <div style="background: rgba(17, 24, 38, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(31, 111, 235, 0.2); border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);">
                    
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 32px;">
                        <img src="${logoUrl}" alt="OPENOS" style="height: 40px; width: auto;">
                    </div>

                    <!-- Header -->
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0 0 8px 0; text-align: center; letter-spacing: -0.02em;">
                        Reset Your Password
                    </h1>
                    <p style="color: #aeb9ca; font-size: 16px; margin: 0 0 32px 0; text-align: center;">
                        We received a request to reset your password
                    </p>

                    <!-- Content -->
                    <div style="background: rgba(31, 111, 235, 0.05); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
                        <p style="color: #cdd6e5; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                            Click the button below to reset your password. This link will expire in <strong style="color: #1f6feb;">1 hour</strong>.
                        </p>
                        
                        <!-- Reset Button -->
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${resetUrl}" style="display: inline-block; background: #1f6feb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 8px 16px rgba(31, 111, 235, 0.3);">
                                Reset Password
                            </a>
                        </div>

                        <p style="color: #aeb9ca; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <span style="color: #1f6feb; word-break: break-all;">${resetUrl}</span>
                        </p>
                    </div>

                    <!-- Security Note -->
                    <div style="background: rgba(255, 139, 139, 0.05); border-radius: 12px; padding: 16px; margin-bottom: 32px;">
                        <p style="color: #ff8b8b; font-size: 14px; margin: 0; text-align: center;">
                            ⚠️ If you didn't request this password reset, you can safely ignore this email.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="border-top: 1px solid rgba(42, 58, 85, 0.5); padding-top: 24px; text-align: center;">
                        <p style="color: #6b7b93; font-size: 14px; margin: 0 0 8px 0;">
                            © ${new Date().getFullYear()} OPENOS. All rights reserved.
                        </p>
                        <p style="color: #6b7b93; font-size: 12px; margin: 0;">
                            Try before you install. Explore Linux distributions safely from your browser
                        </p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `
    };

    try {
        await sgMail.send(msg);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error('SendGrid error:', error);
        throw new Error('Failed to send email');
    }
}

export async function sendWelcomeEmail(email, name) {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;

    const msg = {
        to: email,
        from: process.env.EMAIL_FROM,
        subject: 'Welcome to OPENOS!',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @media only screen and (max-width: 600px) {
                    .container { padding: 16px !important; }
                    .button { width: 100% !important; }
                    .features { flex-direction: column !important; }
                }
            </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: linear-gradient(135deg, #0b0f14 0%, #1a1f2c 100%);">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 24px;">
                <!-- Main Card -->
                <div style="background: rgba(17, 24, 38, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(31, 111, 235, 0.2); border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);">
                    
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 32px;">
                        <img src="${logoUrl}" alt="OPENOS" style="height: 40px; width: auto;">
                    </div>

                    <!-- Welcome Header -->
                    <h1 style="color: #ffffff; font-size: 32px; font-weight: 600; margin: 0 0 8px 0; text-align: center; letter-spacing: -0.02em;">
                        Welcome, ${name}! 👋
                    </h1>
                    <p style="color: #aeb9ca; font-size: 18px; margin: 0 0 32px 0; text-align: center;">
                        Your Linux testing journey begins here
                    </p>

                    <!-- Welcome Message -->
                    <div style="background: linear-gradient(135deg, rgba(31, 111, 235, 0.1) 0%, rgba(0, 200, 160, 0.1) 100%); border-radius: 16px; padding: 32px; margin-bottom: 32px;">
                        <p style="color: #cdd6e5; font-size: 16px; line-height: 1.8; margin: 0 0 24px 0;">
                            Thanks for joining OPENOS! You can now explore Linux distributions safely from your browser. No installation, no system changes, and no risk to your personal device.
                        </p>
                        
                        <!-- Action Buttons -->
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${loginUrl}" style="display: inline-block; background: #1f6feb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 0 8px 8px 0; box-shadow: 0 8px 16px rgba(31, 111, 235, 0.3);">
                                Login to Your Account
                            </a>
                            <a href="${dashboardUrl}" style="display: inline-block; background: #22324a; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 8px 0 0 0;">
                                Go to Dashboard
                            </a>
                        </div>
                    </div>

                    <!-- Features Grid -->
                    <div style="margin-bottom: 32px;">
                        <h2 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">
                            What you can do with OPENOS
                        </h2>
                        
                        <div style="display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;">
                            <!-- Feature 1 -->
                            <div style="flex: 1; min-width: 150px; background: rgba(31, 111, 235, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
                                <div style="font-size: 32px; margin-bottom: 8px;">🖥️</div>
                                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">Test Distributions</h3>
                                <p style="color: #aeb9ca; font-size: 13px; margin: 0;">Linux Mint, Ubuntu, Arch & more</p>
                            </div>
                            
                            <!-- Feature 2 -->
                            <div style="flex: 1; min-width: 150px; background: rgba(31, 111, 235, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
                                <div style="font-size: 32px; margin-bottom: 8px;">🔒</div>
                                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">Safe Environment</h3>
                                <p style="color: #aeb9ca; font-size: 13px; margin: 0;">No system changes, zero risk</p>
                            </div>
                            
                            <!-- Feature 3 -->
                            <div style="flex: 1; min-width: 150px; background: rgba(31, 111, 235, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
                                <div style="font-size: 32px; margin-bottom: 8px;">⚡</div>
                                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">Learn by Doing</h3>
                                <p style="color: #aeb9ca; font-size: 13px; margin: 0;">Explore before installing</p>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Tips -->
                    <div style="background: rgba(255, 255, 255, 0.02); border-radius: 12px; padding: 20px; margin-bottom: 32px;">
                        <h3 style="color: #1f6feb; font-size: 16px; font-weight: 600; margin: 0 0 12px 0; text-align: center;">
                            💡 Quick Tips
                        </h3>
                        <ul style="color: #cdd6e5; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                            <li>Start with Linux Mint if you're new to Linux</li>
                            <li>Save your favorite distributions for quick access</li>
                            <li>Upgrade to Premium for extended session times</li>
                        </ul>
                    </div>

                    <!-- Footer -->
                    <div style="border-top: 1px solid rgba(42, 58, 85, 0.5); padding-top: 24px; text-align: center;">
                        <p style="color: #6b7b93; font-size: 14px; margin: 0 0 8px 0;">
                            © ${new Date().getFullYear()} OPENOS. All rights reserved.
                        </p>
                        <p style="color: #6b7b93; font-size: 12px; margin: 0;">
                            Made with ❤️ for the open-source community
                        </p>
                        <div style="margin-top: 16px;">
                            <a href="${process.env.FRONTEND_URL}/privacy" style="color: #1f6feb; font-size: 12px; text-decoration: none; margin: 0 8px;">Privacy</a>
                            <a href="${process.env.FRONTEND_URL}/terms" style="color: #1f6feb; font-size: 12px; text-decoration: none; margin: 0 8px;">Terms</a>
                            <a href="${process.env.FRONTEND_URL}/about" style="color: #1f6feb; font-size: 12px; text-decoration: none; margin: 0 8px;">About</a>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `
    };

    try {
        await sgMail.send(msg);
        console.log(`Welcome email sent to ${email}`);
    } catch (error) {
        console.error('SendGrid error:', error);
    }
}