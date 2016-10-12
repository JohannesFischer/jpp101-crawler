'use strict';

// const async = require('async');
const cheerio = require('cheerio');
const request = require('request');
const cookieJar = request.jar();

// TODO: add --debug-mode param check

class Jpcrawler {

  constructor(host, loginPage) {
    this.host = host;
    this.loginPage = loginPage;
    this.userAgent = 'Mozilla/5.0 (X11; Linux x86_64; rv:10.0) ' +
                     'Gecko/20100101 Firefox/10.0';
  }

  downloadList(links) {
    for (let i = 0; i < links.length; i++) {
      this.log('download: ' + links[i]);
    }
  }

  followMetaRedirect(error, response, body, callback) {
    if (!error && response.statusCode == 200) {
      const regex = /<meta http-equiv="Refresh" CONTENT="1; URL=([^"]+)[^>]+>/;
      const match = regex.exec(response.body);

      if (match !== null) {
        this.getPage(this.host + match[1], (error, response) => {
          const uri = response.request.uri.href;
          if (uri === this.host + '/index.php') {
            this.log('Log in successful!');

            if (callback !== undefined) {
              callback();
            }
          } else {
            console.log('[ERROR]: Something went wrong. Redirected to: ' + uri);
          }
        });
      } else {
        if (response.request.uri.href === this.loginPage) {
          // const errorBox = $('.error_box div');
          // const msg = errorBox[0].children[0].data || '';
          console.log('[ERROR]: Login failed');
        } else {
          // Redirect but no meta redirect found
          console.log('[ERROR]: No meta redirect found');
        }
      }
    } else {
      return this.logError(error);
    }
  }

  getEpisodeLinks(url) {
    this.getPage(url, (error, response, body) => {
      const $ = cheerio.load(body);
      const epsisodeLinks = $('a.lesson-title');
      const links = [];

      for (let i = 0; i < epsisodeLinks.length; i++) {
        links.push(epsisodeLinks[i].attribs.href);
      }

      this.log(`Found ${links.length} episode links`);
      this.downloadList(links);
    });
  }

  getDownloadLink(url, callback) {
    this.getPage(url, (error, response, body) => {
      const $ = cheerio.load(body);
      const downloadLink = $('a.media-download');

      if (downloadLink !== undefined) {
        const links = [];

        for (let i = 0; i < downloadLink.length; i++) {
          // Use hasClass
          const attribs = downloadLink[i].attribs;

          if (attribs.class.indexOf('locked') === -1) {
            const target = downloadLink[i].attribs.href;
            this.log('Lesson MP3 found: ', target);
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
    this.log(`Opening page: ${url}`);
    request.get({
      headers: {
        'User-Agent': this.userAgent,
      },
      jar: cookieJar,
      url: url,
    }, (error, response, body) => {
      if (error) {
        return this.logError(error);
      }

      callback(error, response, body);
    });
  }

  getLoginFormData() {
    // Here
  }

  log(message) {
    console.log(`[LOG]: ${message}`);
  }

  logError(error) {
    console.error('[Error]: An error occured');
    console.log(error);
    return false;
  }

  login(loginData, response, callback) {
    // Move this to getLoginFormData

    const cookies = response.headers['set-cookie'];
    let cookieStr = '';

    for (let i = 0; i < cookies.length; i++) {
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
      if (error) return this.logError(error);
      this.followMetaRedirect(error, response, body, callback);
    });
  }
}

module.exports = Jpcrawler;
