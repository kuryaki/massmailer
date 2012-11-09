var nodemailer = require("nodemailer");

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "david.roncancio@gmail.com",
        pass: "acbfgvalhreksubn"  //Application specific password
    }
});

// setup e-mail data with unicode symbols
var mailOptions = {
    from: "David Roncancio ✔ <david.roncancio@gmail.com>", // sender address
    to: "david@codetag.me, david@roncancio.me", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world ✔", // plaintext body
    html: "<b>Hello world ✔</b>" // html body
};

// send mail with defined transport object
smtpTransport.sendMail(mailOptions, function(error, response){
    if(error){
        console.log(error);
    }else{
        console.log("Message sent: " + response.message);
    }

    // if you don't want to use this transport object anymore, uncomment following line
    //smtpTransport.close(); // shut down the connection pool, no more messages
});