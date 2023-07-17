const nodemailer = require('nodemailer');

const sendEmail = (options) => new Promise((resolve, reject) => {

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });

    const mailOption = {
        from: process.env.EMAIL,
        ...options
    };

    transporter.sendMail(mailOption, (error, info) => {
        console.log(error, info);

        if(error) {
            console.log(error);
            return reject({ message: "An error has occured" });
        };

        return resolve({ message: "Email sent successfully" }); 
    });
});

module.exports = sendEmail;