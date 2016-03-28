'use strict';

var cheerio = require('cheerio');
var request = require('request');
var cookieJar = request.jar();

class Jpcrawler {

  constructor() {
    this.host = 'http://www.japanesepod101.com';
    this.loginPage = this.host + '/member/login_new.php';
    this.userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) ' +
                     'Gecko/20100101 Firefox/10.0';
  }

  followMetaRedirect(error, response, body, callback) {
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(body);
      var regex = /<meta http-equiv="Refresh" CONTENT="1; URL=([^"]+)[^>]+>/;
      var match = regex.exec(response.body);

      if (match !== null) {
        this.getPage(this.host + match[1], (error, response, body) => {
          var uri = response.request.uri.href;
          if (uri === 'http://www.japanesepod101.com/index.php') {
            console.log('[LOG]: Log in successful!');

            if (callback !== undefined) {
              callback();
            }
          } else {
            console.log('[ERROR]: Something went wrong. Redirected to: ' + url);
          }
        });
      } else {
        if (response.request.uri.href === this.loginPage) {
          var errorBox = $('.error_box div');
          var msg = errorBox[0].children[0].data || '';
          console.log('[ERROR]: ' + msg.replace('\n', ''));
        } else {
          // Redirect but not meat redirect found
          console.log('[EROR]: No meta redirect found');
        }
      }
    }
  }

  getEpisodeLinks(url, callback) {
    // TODO: Log page title

    this.getPage(url, function(error, response, body) {
      console.log('Grabbing episode page: ' + url);

      var $ = cheerio.load(body);
      var downloadLink = $('a.media-download');

      if (downloadLink !== undefined) {
        var links = [];

        for (var i = 0; i < downloadLink.length; i++) {
          // Use hasClass
          var attribs = downloadLink[i].attribs;

          if (attribs.class.indexOf('locked') === -1) {
            var target = downloadLink[i].attribs.href;
            console.log('Lesson MP3 found: ', target);
            links.push(target);
            // DownloadList.push(target);
          }
        }

        if (callback !== undefined) {
          callback(links);
        }

        /*
        If (num < linkList.length) {
          this.getEpisodeLinks(linkList, num + 1);
        } else {
          console.log('Finished grabbing links');
        }
        */
      }
    });
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
    // Here
  }

  login(loginData, response, callback) {
    // Move this to getLoginFormData

    var cookies = response.headers['set-cookie'];
    var cookieStr = '';
    var _this = this;

    for (var i = 0; i < cookies.length; i++) {
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
      url: this.loginPage,
    }, (error, response, body) => {
      _this.followMetaRedirect(error, response, body, callback);
    });
  }
};

module.exports = Jpcrawler;