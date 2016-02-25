var agent = require('superagent');
var cheerio = require('cheerio');

var loginPage = 'http://www.japanesepod101.com/member/login_new.php';
var episodeList = 'http://www.japanesepod101.com/index.php?cat=1';
var loginData = {
  amember_login: '',
  amember_pass: ''
};

agent
  .get(loginPage)
  .end(function(err, res) {
    var $ = cheerio.load(res.text);
    var loginAttemptId = $('form[name=login] input[name=login_attempt_id]');
    loginData.login_attempt_id = loginAttemptId[0].attribs.value;

    var requestId = $('form[name=login] input[name=request_id]');
    loginData.request_id = loginAttemptId[0].attribs.value;

    console.log(loginData);
  });

// agent
//   .post(loginPage)
//   .send(loginData)
//   .end(function(err, res) {
//     if (err || !res.ok) {
//       console.log('Oh no! error');
//     } else {
//       //console.log('yay got ', res);
//     }
//   });

/*
agent
.get(episodeList)
.end(function(err, res) {
  if (err || !res.ok) {
    console.log('Oh no! error');
  } else {
    console.log('yay got ', res);
    //   var $ = cheerio.load(body);
    //   var list = $('div.ill-lessons-list');
  }
});
*/
