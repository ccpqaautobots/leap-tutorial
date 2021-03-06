const fs = require('fs');
const path = require('path');
const seleniumConfig = require('../../../config/selenium');

const config = {
  "src_folders" : [""],
  "output_folder" : "",
  "custom_commands_path" : "",
  "page_objects_path" : "",
  "custom_assertions_path" : "",
  "globals_path" : "",
  "live_output" : false,
  "parallel_process_delay" : 10,
  "disable_colors": true,
  "test_workers" : false,
  "selenium" : {
    "start_process" : false,
    "server_path" : "",
    "log_path" : "",
    "host" : seleniumConfig.host,
    "port" : seleniumConfig.port,
    "cli_args" : {
      "webdriver.chrome.driver" : "",
      "webdriver.ie.driver" : "",
      "webdriver.firefox.profile" : ""
    }
  },
  "test_settings" : {
    "default" : {
      "launch_url" : "http://" + seleniumConfig.host,
      "selenium_host" : seleniumConfig.host,
      "selenium_port" : seleniumConfig.port,
      "silent" : true,
      "disable_colors": false,
      "screenshots" : {
        "enabled" : false,
        "path" : ""
      },
      "desiredCapabilities" : {
        "browserName" : "firefox",
        "javascriptEnabled" : true,
        "acceptSslCerts" : true
      }
    },
    "browserstack" : {
      "selenium_host" : "hub-cloud.browserstack.com",
      "selenium_port" : 80,
      "desiredCapabilities" : {
        "browserstack.user": "krizzchannemerci1",
        "browserstack.key": "gNhtLSVpWqsZvj5fUqzx",
        'browserName': 'iPhone',
        'platform': 'MAC',
        'device': 'iPhone 7 Plus'
      }
    },
    "saucelabs" : {
      "selenium_host" : "ondemand.saucelabs.com",
      "selenium_port" : 80,
      "username" : "${SAUCE_USERNAME}",
      "access_key" : "${SAUCE_ACCESS_KEY}",
      "use_ssl" : false,
      "silent" : true,
      "output" : true,
      "screenshots" : {
        "enabled" : false,
        "on_failure" : true,
        "path" : ""
      },
      "desiredCapabilities": {
        "name" : "test-example",
        "browserName": "firefox"
      },
      "globals" : {
        "myGlobal" : "some_sauce_global"
      },
      "selenium" : {
        "start_process" : false
      }
    },
    "phantomjs" : {
      "desiredCapabilities" : {
        "browserName" : "phantomjs",
        "javascriptEnabled" : true,
        "acceptSslCerts" : true,
        "phantomjs.binary.path" : "/path/to/phantomjs"
      }
    },
    "browserstack" : {
      "selenium" : {
        "start_process" : false
      },
      "selenium_host" : "hub.browserstack.com",
      "selenium_port" : 80,
      "silent" : true,
      "desiredCapabilities": {
        "name" : "test-example",
        "browserName": "firefox",
        "browserstack.user" : "...",
        "browserstack.key" : "..."
      }
    },
    "testingbot" : {
      "selenium_host" : "hub.testingbot.com",
      "selenium_port" : 80,
      "apiKey" : "${TB_KEY}",
      "apiSecret" : "${TB_SECRET}",
      "silent" : true,
      "output" : true,
      "screenshots" : {
        "enabled" : false,
        "on_failure" : true,
        "path" : ""
      },
      "desiredCapabilities": {
        "name" : "test-example",
        "browserName": "firefox"
      },
      "selenium" : {
        "start_process" : false
      }
    }
  }
};

module.exports = (callback) => {
    // write json file in same directory
    fs.writeFile(path.join(__dirname, 'nightwatch.json'), JSON.stringify(config, null, 2), callback);
};