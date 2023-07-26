const nodemailer = require("nodemailer");



const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: 'kavathiyajenish008@gmail.com',
        pass: 'csujwhuvciswpfxz',
    },
});

// Function to send the email
async function sendEmail(toEmail, body) {
    try {
        // Set up email data
        const mailOptions = {
            from: 'tip@gmail.com',
            to: toEmail,
            subject: "Test Email", // Email subject
            html: body
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

module.exports = { sendEmail }