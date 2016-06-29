'use strict';

var cheerio = require('cheerio');
var prompt = require('cli-prompt');
var Jpcrawler = require('./jpcrawler.js');
var crawler = new Jpcrawler();

var host = 'http://www.japanesepod101.com';
var loginPage = host + '/member/login_new.php';
// var episodeList = host + '/index.php?cat=1';
var lessonPage = host + '/index.php?cat=Introduction';

// Prompt to input username & password
prompt.multi([
  {
    label: 'Enter your username',
    key: 'username',
  },
  {
    label: 'Enter your password',
    key: 'password',
    type: 'password',
  },
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

    console.log('[LOG]: Logging in as ' + input.username);

    crawler.login(loginData, response, function() {
      crawler.getPage(lessonPage, function(error, response, body) {
        // Put available categories
        var $ = cheerio.load(body);
        var levels = $('a.ill-level-title');

        if (levels.length > 0) {
          console.log('Levels available:');
          for (var i = 0; i < levels.length; i++) {
            console.log(`  [${i + 1}] ${levels[i].children[0].data}`);
          }
          prompt('Select a level: ', (input) => {
            console.log('[LOG]: You picked ' + input);

            var level = levels[input - 1];

            var children = $(level).parent().find('div a');

            console.log('Select a category to download:');
            var cnt = 1;
            var options = [];

            for (var i = 0; i < children.length; i++) {
              console.log('  [' + cnt + '] ' + $(children[i]).text());
              options.push(i);
              cnt += 1;
            }

            console.log('  [TODO]: Select "X" to go to the level selection');

            prompt('Pick a category: ', (input) => {
              console.log('You picked: ' + input);
              // var href = $(children[options[input - 1]]).attr('href');

              // var links = crawler.getEpisodeLinks(href);
            });
          });
        }
      });
    });
  });
});


// Move this to jpcrawler.js

// var downloadList = [];
