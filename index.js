var async = require('async');
var cheerio = require('cheerio');
var request = require('request');
var cookieJar = request.jar();
var prompt = require('cli-prompt');
var Jpcrawler = require('./jpcrawler.js');
var crawler = new Jpcrawler();

var host = 'http://www.japanesepod101.com';
var loginPage = host + '/member/login_new.php';
var episodeList = host + '/index.php?cat=1';
var lessonPage = host + '/index.php?cat=Introduction';

// prompt to input username & password
prompt.multi([
  {
    label: 'Enter your username',
    key: 'username'
  },
  {
    label: 'Enter your password',
    key: 'password',
    type: 'password'
  }
], function(input) {
  crawler.getPage(loginPage, function(error, response, body) {
    var $ = cheerio.load(body);
    $('input[name=amember_login]').val(input.username);
    $('input[name=amember_pass]').val(input.password);
    var formData = $('form[name=login]').serializeArray();
    formData[3].value = formData[3].value.replace(' ', '+');
    
    var loginData = {};
    formData.forEach(function(el) {
      loginData[el.name] = el.value;
    });
    
    console.log('Logging in as ' + input.username);

    crawler.login(loginPage, loginData, response, function() {
      crawler.getPage(lessonPage, function(error, response, body) {
        // put available categories
        var $ = cheerio.load(body);
        var categories = $('a.ill-level-title');
        if (categories.length > 0) {
          console.log('Please select a category:');
          for (var i = 0; i < categories.length; i++) {
            console.log(`  [${i + 1}] ${categories[i].children[0].data}`); 
          }
          prompt('Put in the category number to continue: ', (input) => {
            console.log('You picked ' + input);
          });
        }
      });
    });
  });
});

var downloadList = [];

var getEpisodeLinks = function(linkList, num) {
  getPage(linkList[num], function(error, response, body) {
    console.log('Grabbing episode page: ' + linkList[num]);
    var $ = cheerio.load(body);
    var downloadLink = $('a.media-download');
    if (downloadLink !== undefined) {
      for(var i = 0; i < downloadLink.length; i++) {
        var attribs = downloadLink[i].attribs;

        if (attribs.class.indexOf('locked') === -1) {
          var target = downloadLink[i].attribs.href;
          console.log('Lesson MP3 found: ', target);
          downloadList.push(target);
        }
      }
      
      if (num < linkList.length) {
        getEpisodeLinks(linkList, num + 1);
      } else {
        console.log('Finished grabbing links');
      }
    }
  });
}