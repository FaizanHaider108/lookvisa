import nodemailer from "nodemailer";
import path from "path";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Required for Zoho
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Add this for debugging
transporter.verify(function(error, success) {
  if (error) {
    console.log("Server connection failed:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

export const sendEmail = async ({ fromEmail, to, subject, html, attachments }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${fromEmail}" <${fromEmail}>`,
      to,
      subject,
      html,
      attachments,
    });


    return info;
  } catch (error) {
    console.error("Error while sending email:", error);
    throw new Error("Email delivery failed.");
  }
};

export const sendActionEmail = async (email, action, token, visaSponsorData) => {
  const baseUrl = process.env.APP_BASE_URL;
  const actionUrls = {
    verify: `${baseUrl}/verify-email?token=${token}`,
    reset: `${baseUrl}/reset-password?token=${token}`,
    listingCreated: `${baseUrl}/manage-listing`,
  };

  const actionDetails = {
    verify: {
      subject: "Lookvisa: Please Verify Your Email Address",
      html: `
      <div style="font-family: Arial, sans-serif; margin: 0 auto; padding: 20px; max-width: 600px; background-color: #022150">
       
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 20px; text-align: center; color: #ffffff;">
              
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Welcome to <span style="color: #60a5fa;">Lookvisa</span></h1>
              <p>Thanks for signing up!</p>
              <hr>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; width: 100%; ">
              <p style="color: white; font-weight: 600;">Before you continue please verify your email</p>

              <p style="margin: 10; color: white; text-size-adjust: 10px;">Click the link below to verify your email address:</p>
                <a href="${actionUrls.verify}" style="margin: 16px 0; color: #ffffff; 
               font-weight: 600; background-color: #3b82f6; padding: 10px 20px;margin-top: 20px; border-radius: 5px;">Verify Email</a>
                <p style="font-size: 16px; line-height: 1.6; color: white; margin-top: 50px;">Best regards, <br /> Lookvisa Team</p>
                <p style=" margin-top: 50px; color: white;">If you did not create an account using this address, please ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; text-align: center; color: #ffffff;">
              <p>If you have any questions, feel free to contact us at <a href="mailto:info@lookvisa.com" style="color: #3b82f6; text-decoration: none;">info@lookvisa.com</a></p>

             
              
            </td>
          </tr>
          <tr>
            <td style="background-color: #1e293b; padding: 10px 20px; text-align: center; color: #fff; font-size: 12px;">
              &copy; 2024 Lookvisa, All Rights Reserved
            </td>
          </tr>
        </table>
      </div>

      `,
      attachments: [
        {
          filename: "Lookvisa.png",
          path: path.resolve("./app/Lookvisa.png"),
          cid: "logo",
        },
      ],
    },


    reset: {
      subject: "LookVisa: Reset your password",
      html: `
         <div style="font-family: Arial, sans-serif; margin: 0 auto; padding: 20px; max-width: 600px; background-color: #022150">
       
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 20px; text-align: center; color: #ffffff;">
           
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;"> <span style="color: #60a5fa;">Lookvisa</span></h1>
              <p>Password Reset</p>
              <hr>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; width: 100%; text-align: center; ">
              <p style="color: white; font-weight: 600;">If you've lost your password or wish to reset it</p>

              <p style="margin: 10; color: white; text-size-adjust: 10px;">use the link below to get started</p>
              <a href="${actionUrls.reset}" style=" padding: 10px; color: white; background-color: #3b82f6; text-decoration: none;">Reset Password</a>
               
                <p style=" margin-top: 50px; color: white; line-height: 40px; text-align: 15px;">If you did not request a  password reset. You can safely ignore this email. Only a person with your email can reset this password</p>
            </td>
          </tr>
         
        </table>
      </div>
      `,
      attachments: [
        {
          filename: "Lookvisa.png",
          path: path.resolve("./app/Lookvisa.png"),
          cid: "logo",
        },
      ],
    },


    listingCreated: {
      subject: "Lookvisa: Your Listing Has Been Created Successfully",
      html: `
        <div style="font-family: Arial, sans-serif; margin: 0 auto; padding: 20px; max-width: 600px; background-color: #022150">
          <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="padding: 20px; text-align: center; color: #ffffff;">
               
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Your Listing Has Been Created</h1>
                <p>Congratulations! Your new listing is live on Lookvisa.</p>
                <hr>
              </td>
            </tr>
            <tr>
             
            </tr>
            <tr>
              <td style="padding: 20px 30px; text-align: center; color: #ffffff;">
                <p>If you have any questions, feel free to contact us at <a href="mailto:info@lookvisa.com" style="color: #3b82f6; text-decoration: none;">info@lookvisa.com</a></p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #1e293b; padding: 10px 20px; text-align: center; color: #fff; font-size: 12px;">
                &copy; 2024 Lookvisa, All Rights Reserved
              </td>
            </tr>
          </table>
        </div>
      `,
      attachments: [
        {
          filename: "Lookvisa.png",
          path: path.resolve("./app/Lookvisa.png"),
          cid: "logo",
        },
      ],
    },




    contactedByVisaSponsor: {
      subject: "Lookvisa: Hi, I am interested in your investor profile",
      html: `
      <div style={{ fontFamily: 'Arial, sans-serif', margin: '0 auto', padding: '20px', maxWidth: '600px', backgroundColor: '#022150' }}>
            <table width="100%" border="0" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                <tbody>
                    <tr>
                        <td style={{ padding: '20px', textAlign: 'center', color: '#ffffff' }}>
                
                              <h1 style="margin: 0; font-size: 24px; font-weight: bold;"><span style="color: #60a5fa;">Lookvisa</span></h1>
                            <p>Your profile was viewed by a visa sponsor</p>
                            <hr />
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '40px 30px', width: '100%' }}>
                            <p style={{ color: 'white', fontWeight: '600' }}>Hi, I am interested in your investor profile</p>
                            <p style={{ color: 'white', fontWeight: '600' }}><b>First Name:<b>  ${token.firstName}</p>
                            <p style={{ color: 'white', fontWeight: '600' }}><b>Last Name:<b> ${token.lastName}</p>
                            <p style={{ color: 'white', fontWeight: '600' }}><b>Phone Number:<b> ${token.phoneNumber}</p>
                            <p style={{ color: 'white', fontWeight: '600' }}><b>Message:<b>: ${token.additionalNotes}</p>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <p>DO NOT REPLY TO THIS EMAIL. You can contact the sponsor directly through <a href="mailto:${token.sponsorEmail}">${token.sponsorEmail}</a></p>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '20px 30px', textAlign: 'center', color: '#ffffff' }}>
                            <p>If you have any questions, feel free to contact us at <a href="mailto:info@lookvisa.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>info@lookvisa.com</a></p>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ backgroundColor: '#1e293b', padding: '10px 20px', textAlign: 'center', color: '#fff', fontSize: '12px' }}>
                            &copy; 2024 Lookvisa, All Rights Reserved
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
      `,
      attachments: [
        {
          filename: "Lookvisa.png",
          path: path.resolve("./app/Lookvisa.png"),
          cid: "logo",
        },
      ],
    },
  };

  const { subject, html } = actionDetails[action];

  return await sendEmail({
    fromEmail: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
  });
};
