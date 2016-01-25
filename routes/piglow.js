/* INCLUDES */
var request                 = require("request");
var fs 			            = require('fs');
var readline 	            = require('readline');
var google 		            = require('googleapis');
var googleAuth              = require('google-auth-library');
var moment                  = require('moment');
var http                    = require('http');

/* GOOGLE CAL */
var SCOPES                  = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR               = '/var/www/node/heeyou/tmp/credentials/';
var TOKEN_PATH              = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

/* FORECAST */
var longitude				= 52.3091520;
var latitude				= 4.6295910;
var forecast_apikey	 		= "9a89014f9df21a10fd9d229919ce5ae9";
var forecast_url 			= "https://api.forecast.io/forecast/" + forecast_apikey + "/" + longitude + "," + latitude;
var node_tmp_dir			= "/var/www/node/heeyou/public/tmp";
var current_weather_string 	= '';
var Forecast                = require('forecast');

/* TTS */
var pico_lang				= 'en-US';
var Pico                    = require('picotts');

/* PiGlow */
var piGlow = require('piglow');
var piglow = require('piglow-animations');

/* iCloud calender */
var icloud_calender_host = "http://www.vanderstad.nl:8888";
var icloud_calender_path = "/data/icloud-cal.json";
 
var voicerrs_api_key = "4890c824fee047d7b31e8a872f863351"; 


function saySomething(text_to_speach)
{
    Pico.say(text_to_speach, pico_lang, function(err) {
        if (!err) {
            piGlow(function(error, pi) {
                pi.all=0;
            });            
        }
    });
}

function saySomethingExtended(text_to_speach)
{
    piGlow(function(error, pi) {
        pi.all=0;
    });

    var animation = piglow.animation;
    var pi = piglow.piGlowInterface;     
    var startAni = animation()
        .set().to(pi(['red'])).after('0.4s')
        .set().to(pi(['blue'])).after('0.4s')
        .start();

    Pico.say(text_to_speach, pico_lang, function(err) {
        if (!err) {
            startAni.stop();

            piGlow(function(error, pi) {
                pi.all=0;
            });

        } else {
            startAni.stop();

            piGlow(function(error, pi) {
                pi.all=0;
            });

            animation()
                .set().to(pi(['red'])).after('0.4s')
                .set().to(pi(['blue'])).after('0.4s')
                .repeat(30)
                .fade().to(pi()).after('0.5s')
                .start(function() {
                    piGlow(function(error, pi) {
                        pi.all=0;
                    });

                });

        }
    });
}

function readWeather(type)
{

    // Initialize 
    var forecast = new Forecast({
        service: 'forecast.io',
        key: forecast_apikey,
        units: 'celcius', // Only the first letter is parsed 
        lang: 'en', // Return languag
        cache: false,      // Cache API requests? 
        ttl: {            // How long to cache requests. Uses syntax from moment.js: http://momentjs.com/docs/#/durations/creating/ 
            minutes: 60,
            seconds: 0
        }
    });
 
    // Retrieve weather information from coordinates (Sydney, Australia) 
    forecast.get([longitude, latitude], function(err, weather) {
        if(err) 
        {
            console.dir("Sorry! I can not write the weather forecast!");
            return "ERROR";
        }
        var jsonContent = weather;
        if (type == 'rain')
        {
            switch(jsonContent.currently.precipType)
            {
                case "rain":
                    var what_to_say = "I am sorry to say it is going to RAIN today";
                break;
                
                case "sleet":
                    var what_to_say = "Even worse. I see it is going to be wintery!";
                break;
                
                case "snow":
                    var what_to_say = "Yes, but it will be frozen. It is going to SNOW!";
                break;
                
                case "hail":
                    var what_to_say = "Even worse. I see it is going to be frozen rain!";
                break;
                
                default:
                    var what_to_say = "No, it is not going to rain today!";
                break;
            }
        }
        else
        { 
            var what_to_say = "The weather for today is " + jsonContent.hourly.summary + ". The temperature is aroud   " + Math.round(jsonContent.currently.temperature) + " degrees Celcius"
        }        

        saySomething(what_to_say);
        return what_to_say;
    });
}

function getEvents()
{
    // Load client secrets from a local file.
    fs.readFile('/var/www/node/heeyou/client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // Authorize a client with the loaded credentials, then call the
        // Google Calendar API.
        authorize(JSON.parse(content), listEvents);
    });
}
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
    var calendar = google.calendar('v3');
    calendar.events.list({
        auth: auth,
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 2,
        singleEvents: true,
        orderBy: 'startTime'
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        var events = response.items;
        if (events.length <= 0) {
            var what_to_say = 'No upcoming events found.';
            console.log(what_to_say);
            saySomething(what_to_say);
            return what_to_say;

        } else {
            console.log('Upcoming 10 events:');
            console.dir(events);
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                var start = event.start.dateTime || event.start.date;
                console.log(start);
                var what_to_say = "You have the appointment " + event.summary + " at " + moment(start).calendar();
                saySomething(what_to_say);
                return what_to_say;
            }
        }
    });
}

function getMeetings()
{
    var icloud_url = {
        host: icloud_calender_host,
        path: icloud_calender_path
    }
    
    request({
        url: icloud_calender_host + icloud_calender_path,
        json: true
    }, function (error, response, body) {
    
        if (!error && response.statusCode === 200) {
            var events = body;
    
            for (var j = 0; j < events.length; j++) {
                var event = events[j];
                var myStringArray = event.localStartDate;
                var arrayLength = myStringArray.length;
                var start;
                for (var i = 0; i < arrayLength; i++) {
                    if (i === 1)
                    {
                        start = myStringArray[i];     
                    }
                    if (i === 2)
                    {
                        if (myStringArray[i] < 10)
                        {
                            myStringArray[i] = "0" + myStringArray[i];
                        }
                        start = start + "-" + myStringArray[i];
                    }
                    if (i === 3)
                    {
                        if (myStringArray[i] < 10)
                        {
                            myStringArray[i] = "0" + myStringArray[i];
                        }
                        start = start + "-" + myStringArray[i];
                    }
                    if (i === 4)
                    {
                        //2016-01-23T12:00:00+01:00
                        start = start + "T";
                        if (myStringArray[i] < 10)
                        {
                            myStringArray[i] = "0" + myStringArray[i];
                        }
                        start = start + myStringArray[i];
                    }
                    if (i === 5)
                    {
                        if (myStringArray[i] < 10)
                        {
                            myStringArray[i] = "0" + myStringArray[i];
                        }
                        start = start + ":" + myStringArray[i];                 
                        start = start + ":00+00:00";
                    }
    
                }
                var now = new Date();
                var che = new Date(start);
                if (now < che)
                {      
                    var what_to_say = "You have the appointment " + event.title + " at " + moment(start, 'YYYY-MM-DD-HH-II-SS').calendar();
                    saySomething(what_to_say);
                    return what_to_say;
                }
            }        
        }
    });
}


var express = require('express');
var router = express.Router();

/* GET: Get the wheather forecast and speak up!. */
router.get('/weather', function(req, res, next) {
  var response_text = readWeather('forecast'); 
  res.render('index', { title: 'Weather', response: response_text });
});

/* GET: Tell everyone I'm up! */
router.get('/reboot', function(req, res, next) {
  response_text = saySomething("Hee You! I did a reboot");  
  res.render('index', { title: 'Reboot', response: "Hee You! I did a reboot" });
});

/* GET: Get the wheather forecast and speak up!. */
router.get('/raining', function(req, res, next) {
  var response_text = readWeather('rain');  
  res.render('index', { title: 'Raining?', response: response_text });
});

/* GET: Get the wheather forecast and speak up!. */
router.get('/googlecal', function(req, res, next) {
  var response_text = getEvents();  
  res.render('index', { title: 'google calender', response: response_text });
});

/* GET: Get the wheather forecast and speak up!. */
router.get('/icloudcal', function(req, res, next) {
  var response_text = getMeetings();
  res.render('index', { title: 'iCloud calender', response: response_text });
});

router.get('/piglow', function(req, res, next) {
   //callback fires when board is initialized 

    piGlow(function(error, pi) {
        pi.all=0;
    });

    var animation = piglow.animation;
    var pi = piglow.piGlowInterface;     
    animation()
        .set().to(pi(['red'])).after('0.4s')
        .set().to(pi(['blue'])).after('0.4s')
        .repeat(3)
        .start(function() {
            animation()
                .fade().to(pi()).after('0.4s')
                .start(function() {
                    console.log("Done");
                });
            console.log("Done");
        });
    res.send('respond with: done');

});
module.exports = router;
