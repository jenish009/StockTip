const nodemailer = require("nodemailer");



const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAI_PORT,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

async function sendEmail(toEmail, body, subject) {
    try {
        const mailOptions = {
            from: '<stoketip@gmail.com>',
            to: toEmail,
            subject: subject,
            html: body
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error(error.message)
    }
}

module.exports = { sendEmail }