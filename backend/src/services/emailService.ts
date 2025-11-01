import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  throw new Error("EMAIL_USER and EMAIL_PASS must be set in .env");
}

// create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

transporter.verify((error, success)=>{
    if(error){
        console.error("Gmail services connection failed")
    }else{
        console.log("Gmail configured properly and ready to send email")
    }
})


export const sendOtpToEmail = async (email: string, otp: string): Promise<void> => {
  try {
    const mailOptions = {
      from: `"Varta" <${EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
      html: `<p>Hello ${email} !</p><br>
      <p><b>Welcome Onboard to Varta</b></p><br>
      <p>Your OTP is <b>${otp}</b>. It will expire in 5 minutes.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send OTP email");
  }
};
