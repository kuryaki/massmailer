var nodemailer = require("nodemailer");

var smtpTransport = '';

exports.index = function(req, res){
  res.render('index', { title: 'Mass Personal Mailer' });
};

exports.transport = function(req, res){

    smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        name: req.body.name,
        user: req.body.auth_user,
        pass: req.body.auth_password  //Application specific password
    }
  });

  res.render('mail', { title: 'Mass Personal Mailer' });
};

exports.send_email = function(req, res){
  var email_data = JSON.parse(req.body.json_body.split('\'').join('"'));
  email_data.forEach(function(element){

    var email_body = req.body.email_body;
    email_body = email_body.split('|name|').join(element.name).split('|repo|').join(element.repo); //replace for all
    email_subject = req.body.subject.split('|name|').join(element.name).split('|repo|').join(element.repo);

    var mailOptions = {
      from: smtpTransport.options.auth.name + "<" + smtpTransport.options.auth.user + ">", // sender address
      to: element.email, // list of receivers
      subject: email_subject, // Subject line
      text: email_body + '\n\n\n' +req.body.signature // plaintext body
    };

    // send mail with defined transport object
    setTimeout(
      smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
          console.log(error);
          res.send(error);
        }else{
          console.log(response.message);
          res.send("Message sent: " + response.message);
        }
          // if you don't want to use this transport object anymore, uncomment following line
          //smtpTransport.close(); // shut down the connection pool, no more messages
      }), 2000);
  });


};