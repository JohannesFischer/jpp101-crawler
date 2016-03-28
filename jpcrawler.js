'use strict';

var cheerio = require('cheerio');
var request = require('request');
var cookieJar = request.jar();

class Jpcrawler {
  
  constructor() {
    this.host = 'http://www.japanesepod101.com';
    this.userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) ' +
                     'Gecko/20100101 Firefox/10.0';
  }

  followMetaRedirect(error, response, body, callback) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(body);
      var regex = /<meta http-equiv="Refresh" CONTENT="1; URL=([^"]+)[^>]+>/;
      var match = regex.exec(response.body);
      
      if (match !== null) {
        this.getPage(this.host + match[1], function(error, response, body) {
          var uri = response.request.uri.href;
          if (uri === 'http://www.japanesepod101.com/index.php') {
            console.log('[LOG]: Log in successful!');

            if (callback !== undefined) {
              callback();
            }
          } else {
            console.log('[ERROR]: Something went wrong. Got redirected to: ' + url);
          }
        });
      } else {
        if (response.request.uri.href === this.host + '/member/login_new.php') {
          var errorBox = $('.error_box div');
          var msg = errorBox[0].children[0].data || '';
          console.log('[ERROR]: ' + msg.replace('\n', ''));
        } else {
          // redirect but not meat redirect found
          console.log('[EROR]: No meta redirect found');
        }
      }
    }
  }

  getPage(url, callback) {
    request.get({
      headers: {
        'User-Agent': this.userAgent,
      },
      jar: cookieJar,
      url: url,
    }, (error, response, body) => {
      callback(error, response, body);
    });
  }
  
  getLoginFormData(something) {
    // here
  }
  
  login(loginPage, loginData, response, callback) {
    
    // move this to getLoginFormData
    
    var cookies = response.headers['set-cookie'];
    var cookieStr = '';
    var _this = this;
  
    for(var i = 0; i < cookies.length; i++) {
      cookieStr += cookies[i].split(';')[0];
    }
    
    cookieJar.setCookie(cookieStr, '.japanesepod101.com');
    
    request.post({
      followAllRedirects: true,
      form: loginData,
      header: {
        'User-Agent': this.userAgent,
      },
      jar: cookieJar,
      url: loginPage,
    }, function(error, response, body) {
      _this.followMetaRedirect(error, response, body, callback);
    }); 
  }
};

module.exports = Jpcrawler;