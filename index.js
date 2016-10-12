'use strict';

const cheerio = require('cheerio');
const prompt = require('cli-prompt');
const Jpcrawler = require('./jpcrawler.js');

const host = 'http://www.japanesepod101.com';
const pages = {
  lessons: `${host}/index.php?cat=Introduction`,
  login: `${host}/member/login_new.php`
};

const crawler = new Jpcrawler(host, pages.login);

// const loginPage = host + '/member/login_new.php';
// const episodeList = host + '/index.php?cat=1';
// const lessonPage = host + '/index.php?cat=Introduction';

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
], (input) => {
  crawler.getPage(pages.login, (error, response, body) => {
    const $ = cheerio.load(body);
    $('input[name=amember_login]').val(input.username);
    $('input[name=amember_pass]').val(input.password);
    const formData = $('form[name=login]').serializeArray();
    formData[3].value = formData[3].value.replace(' ', '+');

    const loginData = {};
    formData.forEach((el) => {
      loginData[el.name] = el.value;
    });

    crawler.log(`Logging in as ${input.username}`);

    crawler.login(loginData, response, () => {
      crawler.getPage(pages.lessons, (error, response, body) => {
        // Put available categories
        const $ = cheerio.load(body);
        const levels = $('a.ill-level-title');

        if (levels.length > 0) {
          console.log('Levels available:');
          for (let i = 0; i < levels.length; i++) {
            console.log(`  [${i + 1}] ${levels[i].children[0].data}`);
          }
          prompt('Select a level: ', (input) => {
            crawler.log(`You picked ${input}`);

            const level = levels[input - 1];
            const children = $(level).parent().find('div a');

            console.log('Select a category to download:');
            let cnt = 1;
            const options = [];

            for (let i = 0; i < children.length; i++) {
              console.log('  [' + cnt + '] ' + $(children[i]).text());
              options.push(i);
              cnt += 1;
            }

            console.log('  [TODO]: Select "X" to go to the level selection');

            prompt('Pick a category: ', (input) => {
              if (input.toLowerCase() === 'x') {
                crawler.log('Return to level selection');
                return false;
              }

              const index = parseInt(input) - 1;
              const title = $(children[index]).text();
              console.log('You picked: ' + input);
              console.log(title);
              console.log('-'.repeat(title.length));
              const href = $(children[options[index]]).attr('href');

              crawler.getEpisodeLinks(href);
            });
          });
        }
      });
    });
  });
});
