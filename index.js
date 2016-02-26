var cheerio = require('cheerio');
var request = require('request');

var loginPage = 'http://www.japanesepod101.com/member/login_new.php';
var episodeList = 'http://www.japanesepod101.com/index.php?cat=1';
var loginData = {};
var username = process.argv[2];
var password = process.argv[3];
var userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) ' +
                'Gecko/20100101 Firefox/10.0';

request.get({
  headers: {
    'User-Agent': userAgent,
  },
  jar: true,
  url: loginPage,
}, function(error, response, body) {
  var $ = cheerio.load(body);
  $('input[name=amember_login]').val(username);
  $('input[name=amember_pass]').val(password);
  var formData = $('form[name=login]').serializeArray();

  console.log('trying to login using: ', formData);
  login(formData);
});

function login(loginData) {
  request.post({
    form: loginData,
    headers: {
      'User-Agent': userAgent,
    },
    jar: true,
    url: loginPage,
  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log(response);
    }
  });
}
