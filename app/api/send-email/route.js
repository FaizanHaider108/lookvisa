import { sendActionEmail } from "@/utils/email";
import jwt from "jsonwebtoken";
import User from "@/models/user";
import dotenv from "dotenv";

dotenv.config();

export const POST = async (req) => {
  try {
    const { email, action } = await req.json();

    if (!["verify", "reset"].includes(action)) {
      return new Response(JSON.stringify({ message: "Invalid action type." }), {
        status: 400,
      });
    }

    const secretKey = process.env.JWT_SECRET;
    const expiresIn = action === "verify" ? "1h" : "15m";
    const token = jwt.sign({ email, action }, secretKey, { expiresIn });

    await sendActionEmail(email, action, token);

    if (action === "verify") {
      const user = await User.findOne({ email });
      if (!user) {
        return new Response(
          JSON.stringify({ message: "User not found." }),
          { status: 404 }
        );
      }
      user.authToken = token;
      user.authTokenExpiry = Date.now() + 3600 * 1000;
      await user.save();
    }

    if (action === "reset") {
        const user = await User.findOne({ email });
        if (!user) {
          return new Response(
            JSON.stringify({ message: "User not found." }),
            { status: 404 }
          );
        }
        user.authToken = token;
        user.authTokenExpiry = Date.now() + 900 * 1000;
        await user.save();
      }

    return new Response(
      JSON.stringify({ message: `Email sent successfully for ${action}.` }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to send email:", error);
    return new Response(JSON.stringify({ message: "Email sending failed." }), {
      status: 500,
    });
  }
};