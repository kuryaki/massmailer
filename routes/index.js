var nodemailer = require('nodemailer');
var url = require('url');
var request = require('superagent');
var db = require('redis').createClient();

//App configuration
var config = {
  client_id: '189084383123.apps.googleusercontent.com',
  client_secret:'bq7rXcxSUqo-lZ7PntMsBqN1',
  redirect_uri: 'http://localhost:3000/oauth2callback',
  grant_type: 'authorization_code'
};

//Worried about this scope
var smtpTransport = '';
var access_token = '';
var refresh_token = '';
var user = '';



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
  res.redirect('campaign');
}

exports.campaign = function(req, res){
  res.render('mail', { title: 'Mass Personal Mailer' });
};

exports.index = function(req, res){
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
  var auth_url = url.format(google_auth);
  res.render('index', { title: 'Personal Mails - Avalanche', href:auth_url });
};

exports.send_email = function(req, res){
  var email_data = JSON.parse(req.body.json_body); // The U split should not be done...JSON not pydict

  email_data.forEach(function(element){
    var email_body = req.body.email_body;
    var email_subject = req.body.subject;
    var email_signature = '\n\n'+req.body.signature;
    var email_address = '';

    for(var key in element){
      // Needs to be removed here just to process the current structure given or parsed with a different structure...
      if(key==='user_name'){
        element[key] = element[key].split(' ')[0];
      }
      if(key==='best_repo'){
        element[key] = element[key].split('/')[1];
      }
      if(key==='user_email'){
        try{
          email_address = element[key] ? element[key] : element['user_emails'][0];
        } catch(e){
          console.log(e+' -> ');
          console.log(element);
        }
      }
      email_body = email_body.split('|'+key+'|').join(element[key]);
      email_subject = email_subject.split('|'+key+'|').join(element[key]);
    }

    var mailOptions = {
      from: user.name + "<" + user.email + ">", // sender address
      // to: element.email, // list of receivers
      to: email_address,
      subject: email_subject, // Subject line
      text: email_body + email_signature // plaintext body
    };

    if(mailOptions.to){
      // send mail with defined transport object

      try{
        setTimeout(
          smtpTransport.sendMail(mailOptions, function(error, response){
            if(error){
              console.log(mailOptions);
              console.log(error);
            }else{
              console.log(response.message);
            }
              // if you don't want to use this transport object anymore, uncomment following line
              //smtpTransport.close(); // shut down the connection pool, no more messages
          }), 2000);

      }catch(error){
        console.log(mailOptions);
        console.log(error);

      }
    }else{
      console.log('Nope!');
      console.log(mailOptions);
    }

  });


};