var nodemailer = require('nodemailer');
var url = require('url');
var request = require('superagent');
var db = require('redis').createClient();


//Worried about this scope
var smtpTransport = '';
var access_token = '';
var refresh_token = '';
var user = '';


exports.login = function(req, res){
  var google_auth = {
    protocol: 'https',
    host: 'accounts.google.com/o/oauth2/auth',
    query: {
      scope: 'https://mail.google.com https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      redirect_uri: 'http://localhost:3000/oauth2callback',
      response_type:'code',
      client_id: '189084383123.apps.googleusercontent.com',
      access_type: 'offline'
    }
  };
  var href = url.format(google_auth);
  res.send("<a href="+href+">Login</a>");
};

var config = {
  client_id: '189084383123.apps.googleusercontent.com',
  client_secret:'bq7rXcxSUqo-lZ7PntMsBqN1',
  redirect_uri: 'http://localhost:3000/oauth2callback',
  grant_type: 'authorization_code'
};

exports.oauthcallback = function(req, res){
  config.code = req.query.code;
  getTokens(res);
};

function getTokens(res){
  request
    .post('https://accounts.google.com/o/oauth2/token')
    .type('form')
    .send(config)
    .end(function(error, response){
      if (!error && response.statusCode == 200) {
        access_token = response.body.access_token;
        refresh_token = response.body.refresh_token;
        verifyTokens(res);
      }else {
        res.send(500, error);
      }
  });
}

function verifyTokens(res){
  request.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token='+access_token,
    function(error, response){
      if (!error && response.statusCode == 200) {
        user = response.body;
        if(refresh_token){
          db.set(user.email, refresh_token);
        } else {
          refresh_token = db.get(user.email);
        }
        getTransport(res);
      }else {
        res.send(500, error);
      }
    }
  );
}

function getTransport(res){
  var XOAuth2 = {
    user: user.email,
    clientId: config.client_id,
    clientSecret: config.client_secret,
    refreshToken: refresh_token,
    accessToken: access_token
  };

  smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {XOAuth2: XOAuth2}
  });
  res.render('mail', { title: 'Mass Personal Mailer' });
}

exports.index = function(req, res){
  res.render('index', { title: 'Mass Personal Mailer' });
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