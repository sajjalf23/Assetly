import supabase from "../config/supabaseClient.js";
import transporter from "../config/nodemailer.js";

export const subscribeNewsletter = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email required"
        });
    }

    try {

        // 1. Check if already subscribed
        const { data: existingUser, error: checkError } = await supabase
            .from("newsletter_subscribers")
            .select("email")
            .eq("email", email)
            .maybeSingle();

        if (checkError) {
            throw checkError;
        }

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already subscribed"
            });
        }

console.log("SMTP USER:", process.env.SMTP_USER);
console.log(
  "SMTP PASSWORD: ",
  process.env.SMTP_PASS
);
console.log("SMTP HOST: ", process.env.SMTP_HOST);
console.log("SMTP PORT: ", process.env.SMTP_PORT);
        // 2. SEND EMAIL FIRST
        try {

            await transporter.sendMail({
                from: `"Assetly Newsletter" <newsletter.assetly@gmail.com>`,
                to: email,
                subject: "Welcome to Assetly 🚀",

                html: `
                    <h2>Welcome to Assetly!</h2>

                    <p>
                        Thank you for subscribing to our newsletter.
                    </p>

                    <p>
                        We'll keep you updated with:
                    </p>

                    <ul>
                        <li>Market News</li>
                        <li>New Features</li>
                        <li>Portfolio Updates</li>
                    </ul>

                    <br>

                    <p>
                        Thanks,<br>
                        Assetly Team
                    </p>
                `
            });

        } catch (emailError) {

            console.log("EMAIL ERROR:", emailError);

            return res.status(500).json({
                success: false,
                message: "Could not send confirmation email"
            });
        }


        // 3. ONLY AFTER EMAIL SUCCESS → INSERT INTO DB
        const { error: insertError } = await supabase
            .from("newsletter_subscribers")
            .insert([{ email }]);

        if (insertError) {
            throw insertError;
        }


        // 4. SUCCESS
        return res.status(200).json({
            success: true,
            message: "Subscribed successfully"
        });

    } catch (err) {

        console.log("NEWSLETTER ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};