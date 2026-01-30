import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const to = formData.get('to');
    const subject = formData.get('subject');
    const body = formData.get('body');
    const pdfFile = formData.get('pdf'); // This is a Blob/File
    const fileName = formData.get('fileName') || 'bond_package.pdf';
    
    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Recipient and subject are required' },
        { status: 400 }
      );
    }
    
    const transporter = createTransporter();
    
    // Build email options
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to,
      subject: subject,
      text: body || 'Please find the attached bond package.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">📋 Bond Package Ready</h2>
          <p>${body || 'Please find the attached bond package.'}</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            This email was sent automatically from the Bond Processor system.
          </p>
        </div>
      `,
      attachments: []
    };
    
    // Add PDF attachment if provided
    if (pdfFile && pdfFile.size > 0) {
      const buffer = Buffer.from(await pdfFile.arrayBuffer());
      mailOptions.attachments.push({
        filename: fileName,
        content: buffer,
        contentType: 'application/pdf'
      });
    }
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent:', info.messageId);
    
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      to: to
    });
    
  } catch (error) {
    console.error('❌ Email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
