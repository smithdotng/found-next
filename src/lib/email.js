// Ported from the Express app's utils/email.js (same templates and SMTP settings).
// utils/email.js
import nodemailer from 'nodemailer';
import { siteUrl } from './seo';

// Create transporter for Hostinger
const createTransporter = () => {
    console.log('📧 [Email] Creating transporter...');
    
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('⚠️ [Email] Email credentials not configured. Emails will not be sent.');
        console.log('   Please set EMAIL_USER and EMAIL_PASS in your .env file');
        return null;
    }
    
    console.log('📧 [Email] EMAIL_USER:', process.env.EMAIL_USER);
    console.log('📧 [Email] EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('📧 [Email] EMAIL_PORT:', process.env.EMAIL_PORT);
    
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
            port: parseInt(process.env.EMAIL_PORT) || 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false
            },
            debug: true,
            logger: true
        });
        
        console.log('✅ [Email] Email transporter created successfully');
        return transporter;
    } catch (error) {
        console.error('❌ [Email] Error creating email transporter:', error.message);
        return null;
    }
};

// Test email configuration
const testEmailConfig = async () => {
    console.log('\n🔧 [Email] Testing email configuration...');
    
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            console.log('❌ [Email] Email configuration is missing');
            return false;
        }
        
        await transporter.verify();
        console.log('✅ [Email] Email configuration is working correctly!');
        return true;
    } catch (error) {
        console.error('❌ [Email] Email configuration error:', error.message);
        return false;
    }
};

// ============= WELCOME EMAILS =============

// Send welcome email to realtor
const sendWelcomeEmailToRealtor = async (user) => {
    console.log(`\n📧 [Email] Sending welcome email to realtor: ${user.email}`);
    
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            console.log('❌ [Email] Cannot send email - transporter not available');
            return false;
        }
        
        const baseUrl = siteUrl();
        
        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: user.email,
            subject: 'Welcome to Found Projects! 🏠',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to Found Projects</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .header h1 { margin: 0; font-size: 28px; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .btn { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .btn:hover { background: #ff5252; }
                        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                        .feature-list { list-style: none; padding: 0; }
                        .feature-list li { padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
                        .feature-list li:last-child { border-bottom: none; }
                        .feature-list li i { color: #28a745; margin-right: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to Found.ng! 🏠</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${user.name}!</h2>
                            <p>Thank you for registering as a Realtor on Found. We're excited to have you on board!</p>
                            
                            <h3>What you can do now:</h3>
                            <ul class="feature-list">
                                <li><i>✓</i> List unlimited properties for free</li>
                                <li><i>✓</i> Reach thousands of potential buyers and tenants</li>
                                <li><i>✓</i> Get verified leads from serious prospects</li>
                                <li><i>✓</i> Access our network of professional agents</li>
                                <li><i>✓</i> Track property views and inquiries</li>
                            </ul>
                            
                            <div style="text-align: center;">
                                <a href="${baseUrl}/dashboard" class="btn">Go to Your Dashboard</a>
                            </div>
                            
                            <p><strong>Next Steps:</strong></p>
                            <ol>
                                <li>Complete your profile information</li>
                                <li>Add your first property listing</li>
                                <li>Start receiving inquiries from interested buyers</li>
                            </ol>
                            
                            <p>Best regards,<br>The Found Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Found Projects & Realty Limited. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Welcome email sent to realtor: ${user.email}`);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending welcome email to realtor:`, error.message);
        return false;
    }
};

// Send welcome email to agent
const sendWelcomeEmailToAgent = async (user) => {
    console.log(`\n📧 [Email] Sending welcome email to agent: ${user.email}`);
    
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            console.log('❌ [Email] Cannot send email - transporter not available');
            return false;
        }
        
        const baseUrl = siteUrl();
        
        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: user.email,
            subject: 'Welcome to Found Agent Network! 🚀',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to Found Properties Agent Network</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .btn { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .commission-box { background: #e8f5e9; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
                        .commission-box .percentage { font-size: 36px; font-weight: bold; color: #ff6b6b; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to the Agent Network! 🚀</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${user.name}!</h2>
                            <p>Congratulations on joining the Found Agent Network! Your application is currently under review and will be approved within 24-48 hours.</p>
                            
                            <div class="commission-box">
                                <h3>💰 Your Commission Structure</h3>
                                <p>Earn <span class="percentage">70%</span> on every successful transaction!</p>
                            </div>
                            
                            <div style="text-align: center;">
                                <a href="${baseUrl}/dashboard" class="btn">Track Application Status</a>
                            </div>
                            
                            <p>Best regards,<br>The Found Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Found Projects & Realty Limited. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Welcome email sent to agent: ${user.email}`);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending welcome email to agent:`, error.message);
        return false;
    }
};

// Send agent approval email
const sendAgentApprovalEmail = async (agent) => {
    console.log(`\n📧 [Email] Sending approval email to agent: ${agent.email}`);
    
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            console.log('❌ [Email] Cannot send email - transporter not available');
            return false;
        }
        
        const baseUrl = siteUrl();
        
        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: agent.email,
            subject: 'Congratulations! Your Agent Application has been Approved! 🎉',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Agent Application Approved!</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .btn { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Congratulations! 🎉</h1>
                        </div>
                        <div class="content">
                            <h2>Dear ${agent.name},</h2>
                            <p>Great news! Your agent application has been <strong>approved</strong>.</p>
                            
                            <div style="text-align: center;">
                                <a href="${baseUrl}/dashboard" class="btn">Go to Your Dashboard</a>
                            </div>
                            
                            <p>Your unique referral code is: <strong>${agent.agentProfile.uniqueLink}</strong></p>
                            
                            <p>Best regards,<br>The Found Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Found Projects & Realty Limited. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Approval email sent to agent: ${agent.email}`);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending approval email to agent:`, error.message);
        return false;
    }
};

// ============= INQUIRY NOTIFICATION EMAILS =============

// Send inquiry notification to realtor (property owner)
const sendInquiryNotificationToRealtor = async (inquiry, property, realtor) => {
    console.log(`\n📧 [Email] Sending inquiry notification to realtor: ${realtor.email}`);
    
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            console.log('❌ [Email] Cannot send email - transporter not available');
            return false;
        }
        
        const baseUrl = siteUrl();
        
        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: realtor.email,
            subject: `New Inquiry on Your Property: ${property.title}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>New Property Inquiry</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .inquiry-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ff6b6b; }
                        .btn { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📬 New Property Inquiry</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${realtor.name},</h2>
                            <p>You have received a new inquiry for your property: <strong>${property.title}</strong></p>
                            
                            <div class="inquiry-box">
                                <h3>📝 Inquiry Details:</h3>
                                <p><strong>Name:</strong> ${inquiry.name}</p>
                                
                                <p><strong>Message:</strong></p>
                                <p>${inquiry.message.replace(/\n/g, '<br>')}</p>
                            </div>
                            
                            <div style="text-align: center;">
                                <a href="${baseUrl}/dashboard/inquiries" class="btn">View All Inquiries</a>
                                <a href="${baseUrl}/properties/${property.slug}" class="btn" style="background: #28a745;">View Property</a>
                            </div>
                            
                            <p><strong>Next Steps:</strong></p>
                            <ol>
                                <li>Log in to your realtor dashboard</li>
                                <li>Review the inquiry details</li>
                                <li>Respond to the potential buyer/tenant</li>
                            </ol>
                            
                            <p>Best regards,<br>The Found Properties Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Found Projects & Realty Limited. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Inquiry notification sent to realtor: ${realtor.email}`);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending inquiry notification to realtor:`, error.message);
        return false;
    }
};

// Send inquiry notification to agent (if referred)
const sendInquiryNotificationToAgent = async (inquiry, property, agent) => {
    console.log(`\n📧 [Email] Sending inquiry notification to agent: ${agent.email}`);
    
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            console.log('❌ [Email] Cannot send email - transporter not available');
            return false;
        }
        
        const baseUrl = siteUrl();
        
        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: agent.email,
            subject: `Lead Generated: Someone inquired on property you promoted! 🎯`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Lead Generated</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .lead-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745; }
                        .btn { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎯 New Lead Generated!</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${agent.name},</h2>
                            <p>Someone just inquired about a property you promoted through your referral link!</p>
                            
                            <div class="lead-box">
                                <h3>📝 Lead Details:</h3>
                                <p><strong>Property:</strong> ${property.title}</p>
                                <p><strong>Inquirer Name:</strong> ${inquiry.name}</p>
                                
                                <p><strong>Message:</strong></p>
                                <p>${inquiry.message.replace(/\n/g, '<br>')}</p>
                            </div>
                            
                            <div style="text-align: center;">
                                <a href="${baseUrl}/dashboard/promotions" class="btn">View Your Promotions</a>
                            </div>
                            
                            <p><strong>What happens next?</strong></p>
                            <ul>
                                <li>The realtor (property owner) will respond to the inquiry</li>
                                <li>If a transaction occurs, you earn <strong>70% commission</strong></li>
                                <li>Track all your leads in your agent dashboard</li>
                            </ul>
                            
                            <p>Best regards,<br>The Found Properties Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Found Projects & Realty Limited. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Inquiry notification sent to agent: ${agent.email}`);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending inquiry notification to agent:`, error.message);
        return false;
    }
};

// Send admin notification for new inquiry
const sendAdminInquiryNotification = async (inquiry, property) => {
    console.log(`\n📧 [Email] Sending admin notification for new inquiry`);
    
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            console.log('❌ [Email] Cannot send email - transporter not available');
            return false;
        }
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@found.ng';
        const baseUrl = siteUrl();
        
        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: adminEmail,
            subject: `[Admin Alert] New Property Inquiry Received`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Admin Alert: New Inquiry</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .inquiry-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #667eea; }
                        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📬 Admin Alert: New Inquiry</h1>
                        </div>
                        <div class="content">
                            <h2>New Property Inquiry Received</h2>
                            
                            <div class="inquiry-box">
                                <h3>📝 Inquiry Details:</h3>
                                <p><strong>Property:</strong> ${property.title}</p>
                                <p><strong>Inquirer:</strong> ${inquiry.name}</p>
                                <p><strong>Email:</strong> ${inquiry.email}</p>
                                <p><strong>Phone:</strong> ${inquiry.phone || 'Not provided'}</p>
                                <p><strong>Message:</strong></p>
                                <p>${inquiry.message.replace(/\n/g, '<br>')}</p>
                            </div>
                            
                            <div style="text-align: center;">
                                <a href="${baseUrl}/dashboard/inquiries" class="btn">View Inquiry in Admin Panel</a>
                            </div>
                            
                            <p>Best regards,<br>Found Properties System</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Found Projects & Realty Limited. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Admin notification sent`);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending admin notification:`, error.message);
        return false;
    }
};

// ============= REPLY NOTIFICATION EMAILS =============

// Send reply notification to inquirer
const sendInquiryReplyEmail = async (inquiry, replyMessage, repliedBy) => {
    console.log(`\n📧 [Email] Sending reply notification to inquirer: ${inquiry.email}`);
    
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            console.log('❌ [Email] Cannot send email - transporter not available');
            return false;
        }
        
        const baseUrl = siteUrl();
        const propertyUrl = `${baseUrl}/properties/${inquiry.property?.slug}`;
        
        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: inquiry.email,
            subject: `Response to your inquiry about ${inquiry.propertyTitle}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Response to Your Inquiry</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .reply-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #28a745; }
                        .btn { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📨 Response to Your Inquiry</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${inquiry.name},</h2>
                            <p>Thank you for your inquiry about <strong>${inquiry.propertyTitle}</strong>. We have received a response from our team.</p>
                            
                            <div class="reply-box">
                                <h3>📝 Response:</h3>
                                <p>${replyMessage.replace(/\n/g, '<br>')}</p>
                                <hr>
                                <small>Replied by: ${repliedBy}</small>
                            </div>
                            
                            <div style="text-align: center;">
                                <a href="${propertyUrl}" class="btn">View Property Again</a>
                            </div>
                            
                            <p>If you have any further questions, feel free to reply to this email or contact us directly.</p>
                            
                            <p>Best regards,<br>The Found Properties Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Found Projects & Realty Limited. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Reply email sent to inquirer: ${inquiry.email}`);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending reply email:`, error.message);
        return false;
    }
};

// ============= PASSWORD RESET EMAIL =============

// Send password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
    console.log(`\n📧 [Email] Sending password reset email to: ${user.email}`);
    
    try {
        const transporter = createTransporter();
        
        if (!transporter) {
            console.log('❌ [Email] Cannot send email - transporter not available');
            return false;
        }
        
        const baseUrl = siteUrl();
        const resetLink = `${baseUrl}/reset-password/${resetToken}`;
        
        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: user.email,
            subject: 'Password Reset Request - Found Properties',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Password Reset</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .btn { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <p>Hello ${user.name},</p>
                            <p>We received a request to reset your password. Click the button below to create a new password:</p>
                            
                            <div style="text-align: center;">
                                <a href="${resetLink}" class="btn">Reset Password</a>
                            </div>
                            
                            <p>This link will expire in 1 hour.</p>
                            <p>If you didn't request this, please ignore this email.</p>
                            
                            <p>Best regards,<br>The Found Properties Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Found Projects & Realty Limited. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Password reset email sent to: ${user.email}`);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending password reset email:`, error.message);
        return false;
    }
};

// ============= ADMIN ACCOUNT/PROPERTY NOTIFICATIONS =============

// Notify admin when a new account (realtor or agent) is created
const sendAdminNewAccountNotification = async (user) => {
    console.log(`\n📧 [Email] Sending admin notification for new account: ${user.email}`);

    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log('❌ [Email] Cannot send email - transporter not available');
            return false;
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@found.ng';
        const baseUrl = siteUrl();
        const accountType = user.userType === 'agent' ? 'Agent' : 'Realtor';

        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: adminEmail,
            subject: `[Admin Alert] New ${accountType} Account Created`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Admin Alert: New Account</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .info-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #667eea; }
                        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>👤 New ${accountType} Registered</h1>
                        </div>
                        <div class="content">
                            <h2>A new ${accountType.toLowerCase()} account has just been created</h2>

                            <div class="info-box">
                                <h3>📝 Account Details:</h3>
                                <p><strong>Name:</strong> ${user.name}</p>
                                <p><strong>Email:</strong> ${user.email}</p>
                                <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
                                <p><strong>Account Type:</strong> ${accountType}</p>
                                <p><strong>Registered:</strong> ${new Date(user.createdAt || Date.now()).toLocaleString()}</p>
                            </div>

                            <div style="text-align: center;">
                                <a href="${baseUrl}/dashboard/users?type=${user.userType || 'all'}&q=${encodeURIComponent(user.email || '')}" class="btn">View in Admin Panel</a>
                            </div>

                            <p>Best regards,<br>Found Properties System</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Found Projects & Realty Limited. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Admin new-account notification sent`);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending admin new-account notification:`, error.message);
        return false;
    }
};

// Notify admin when a new property is listed
const sendAdminNewPropertyNotification = async (property, owner) => {
    console.log(`\n📧 [Email] Sending admin notification for new property: ${property.title}`);

    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log('❌ [Email] Cannot send email - transporter not available');
            return false;
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@found.ng';
        const baseUrl = siteUrl();
        const loc = property.location || {};
        const locationText = [loc.city, loc.state].filter(Boolean).join(', ') || 'Not specified';

        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: adminEmail,
            subject: `[Admin Alert] New Property Listed: ${property.title}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Admin Alert: New Property</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .info-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #ff6b6b; }
                        .btn { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🏠 New Property Listed</h1>
                        </div>
                        <div class="content">
                            <h2>A new property has just been listed</h2>

                            <div class="info-box">
                                <h3>📝 Property Details:</h3>
                                <p><strong>Title:</strong> ${property.title}</p>
                                <p><strong>Type:</strong> ${property.propertyType || 'N/A'} (${property.transactionType || 'N/A'})</p>
                                <p><strong>Price:</strong> ₦${property.price ? Number(property.price).toLocaleString() : 'N/A'}</p>
                                <p><strong>Location:</strong> ${locationText}</p>
                                <p><strong>Status:</strong> ${property.status || 'N/A'}</p>
                                <p><strong>Listed By:</strong> ${owner ? owner.name : 'Unknown'} ${owner && owner.email ? '(' + owner.email + ')' : ''}</p>
                            </div>

                            <div style="text-align: center;">
                                <a href="${baseUrl}/dashboard/approvals" class="btn">Review in Admin Panel</a>
                            </div>

                            <p>Best regards,<br>Found Properties System</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Found Projects & Realty Limited. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Admin new-property notification sent`);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending admin new-property notification:`, error.message);
        return false;
    }
};

// ============= ADMIN -> AGENT DIRECT MESSAGE =============

// Send a direct message from an admin to an agent
const sendAdminMessageToAgent = async (agent, subject, message) => {
    console.log(`\n📧 [Email] Sending admin direct message to agent: ${agent.email}`);

    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log('❌ [Email] Cannot send email - transporter not available');
            return false;
        }

        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: agent.email,
            subject: subject,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${subject}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .message-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #667eea; }
                        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Found Projects & Realty</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${agent.name},</h2>
                            <div class="message-box">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                            <p>Best regards,<br>The Found Properties Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Found Projects & Realty Limited. All rights reserved.</p>
                            <p>You are receiving this message because you are a registered agent on Found.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Admin message sent to agent: ${agent.email}`);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending admin message to agent:`, error.message);
        return false;
    }
};

// Send a direct message from an admin to a realtor
const sendAdminMessageToRealtor = async (realtor, subject, message) => {
    console.log(`\n📧 [Email] Sending admin direct message to realtor: ${realtor.email}`);

    try {
        const transporter = createTransporter();

        if (!transporter) {
            console.log('❌ [Email] Cannot send email - transporter not available');
            return false;
        }

        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: realtor.email,
            subject: subject,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${subject}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .message-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #667eea; }
                        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Found Projects & Realty</h1>
                        </div>
                        <div class="content">
                            <h2>Hello ${realtor.name},</h2>
                            <div class="message-box">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                            <p>Best regards,<br>The Found Properties Team</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Found Projects & Realty Limited. All rights reserved.</p>
                            <p>You are receiving this message because you are a registered realtor on Found.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ [Email] Admin message sent to realtor: ${realtor.email}`);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending admin message to realtor:`, error.message);
        return false;
    }
};

// ============= NEWSLETTER CAMPAIGNS =============

// Wrap campaign content in the branded, hero-bg styled template
const buildNewsletterHtml = (subject, contentHtml, unsubscribeUrl) => {
    const baseUrl = siteUrl();
    const heroUrl = `${baseUrl}/assets/images/hero-bg.jpg`;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
        </head>
        <body style="margin:0; padding:0; background:#eef0f4; font-family:Arial, Helvetica, sans-serif; color:#333; line-height:1.7;">
            <div style="max-width:640px; margin:0 auto; background:#ffffff;">
                <!-- Hero header (hero-bg.jpg) -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e; background-image:url('${heroUrl}'); background-size:cover; background-position:center;">
                    <tr>
                        <td style="background:rgba(26,26,46,0.62); padding:55px 40px; text-align:center;">
                            <h1 style="margin:0; color:#ffffff; font-size:26px; letter-spacing:0.5px;">Found Projects &amp; Realty</h1>
                            <p style="margin:8px 0 0; color:#f0c674; font-size:14px; text-transform:uppercase; letter-spacing:2px;">Nigeria's Premier Property Marketplace</p>
                        </td>
                    </tr>
                </table>

                <!-- Body content -->
                <div style="padding:35px 40px; font-size:15px; color:#333;">
                    ${contentHtml}
                </div>

                <!-- Footer -->
                <div style="background:#1a1a2e; padding:28px 40px; text-align:center; color:#c8c8d4; font-size:12px; line-height:1.6;">
                    <p style="margin:0 0 6px;"><strong style="color:#fff;">Found Projects &amp; Realty Limited</strong></p>
                    <p style="margin:0 0 6px;">📞 +234 806 300 6890 &nbsp;|&nbsp; 📧 hello@found.ng</p>
                    <p style="margin:0 0 12px;"><a href="${baseUrl}" style="color:#f0c674; text-decoration:none;">found.ng</a> &nbsp;|&nbsp; @founddotng</p>
                    <p style="margin:0; color:#8a8a9a;">© 2026 Found Projects &amp; Realty Limited. You are receiving this email because you are registered on our platform.
                    ${unsubscribeUrl ? ` &nbsp;|&nbsp; <a href="${unsubscribeUrl}" style="color:#8a8a9a; text-decoration:underline;">Unsubscribe</a>` : ''}</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

// Send a single newsletter email to a recipient
const sendNewsletterEmail = async (recipient, subject, contentHtml) => {
    try {
        const transporter = createTransporter();
        if (!transporter) {
            console.log('❌ [Email] Cannot send newsletter - transporter not available');
            return false;
        }

        const baseUrl = siteUrl();
        const unsubscribeUrl = recipient._id ? `${baseUrl}/unsubscribe/${recipient._id}` : '';

        const mailOptions = {
            from: `"Found Projects" <${process.env.EMAIL_FROM || 'noreply@found.ng'}>`,
            to: recipient.email,
            subject: subject,
            html: buildNewsletterHtml(subject, contentHtml, unsubscribeUrl)
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error(`❌ [Email] Error sending newsletter to ${recipient.email}:`, error.message);
        return false;
    }
};

// ============= TEST FUNCTION =============

// Test email setup
const testEmailSetup = async () => {
    console.log('\n🔧 [Email] Testing email configuration...');
    console.log(`📧 [Email] EMAIL_HOST: ${process.env.EMAIL_HOST || 'not set'}`);
    console.log(`📧 [Email] EMAIL_PORT: ${process.env.EMAIL_PORT || 'not set'}`);
    console.log(`📧 [Email] EMAIL_USER: ${process.env.EMAIL_USER ? 'set' : 'not set'}`);
    console.log(`📧 [Email] EMAIL_PASS: ${process.env.EMAIL_PASS ? 'set' : 'not set'}`);
    console.log(`📧 [Email] EMAIL_FROM: ${process.env.EMAIL_FROM || 'not set'}`);
    console.log(`📧 [Email] ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'not set'}`);
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('\n❌ [Email] Email credentials missing!');
        return false;
    }
    
    return await testEmailConfig();
};

// ============= EXPORTS =============

const emailService = {
    // Welcome emails
    sendWelcomeEmailToRealtor,
    sendWelcomeEmailToAgent,
    sendAgentApprovalEmail,
    
    // Inquiry notifications
    sendInquiryNotificationToRealtor,
    sendInquiryNotificationToAgent,
    sendAdminInquiryNotification,

    // Admin account/property notifications
    sendAdminNewAccountNotification,
    sendAdminNewPropertyNotification,

    // Admin -> agent/realtor direct message
    sendAdminMessageToAgent,
    sendAdminMessageToRealtor,

    // Newsletter campaigns
    sendNewsletterEmail,
    buildNewsletterHtml,
    
    // Reply notifications
    sendInquiryReplyEmail,
    
    // Password reset
    sendPasswordResetEmail,
    
    // Testing
    testEmailConfig,
    testEmailSetup,
};

export default emailService;
