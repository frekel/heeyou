/* INCLUDES */
var request                 = require("request");
var fs 			            = require('fs');
var readline 	            = require('readline');
var google 		            = require('googleapis');
var googleAuth              = require('google-auth-library');
var moment                  = require('moment');
var http                    = require('http');
var async                   = require('async');


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


/* iCloud calender */
var icloud_calender_host = "http://www.vanderstad.nl:8888";
var icloud_calender_path = "/data/icloud-cal.json";
 
var voicerrs_api_key = "4890c824fee047d7b31e8a872f863351"; 

var locals = {
        title: 		 'HeeYou',
        description: 'A site dedicated to HeeYou',
        author: 	 'Frank van der Stad',
        _layoutFile: true
};

function saySomething(text_to_speech, callback) {
    console.log(text_to_speech);
    Pico.say(text_to_speech, pico_lang, function(err) {
        if (!err) {   
            console.log("I have said:" + text_to_speech);
            callback(null, text_to_speech);
        }
        else
        {
            console.log("I cound not say:" + text_to_speech);
            return callback(new Error(err));
        }
    });     
}

function readWeather(type, callback) {

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
    forecast.get([longitude, latitude], function(err, weather)
    {
        if(err) 
        {
            console.dir("Sorry! I can not write the weather forecast!");
 			return callback(new Error(err));
        }
        var jsonContent = weather;
        if (type == 'raining')
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
        console.log(what_to_say);
        callback(null, what_to_say);
    });
}

var express = require('express');
var router = express.Router();

/* GET: Get the wheather forecast and speak up!. */
router.get('/weather', function(req, res, next) {
    async.waterfall([
        async.apply(readWeather, 'weather'),
        saySomething,
    ], function (err, result) {
        if (err) {
            res.render('error', {message: err});
        } else {
            locals.title    =   'What\'s the weather?';
            locals.response =   result;  
            saveToDatabase('logentries', locals);
			coll.find({}).toArray(function(err, docs) {
				if (err)
				{
					res.json('error', err);
				}
				else
				{
					locals.logitems = docs;
					res.json('index', locals);		
				}
			});	

        }
    });
});

/* GET: Check if it is going to rain.... */
router.get('/raining', function(req, res, next) {
    async.waterfall([
        async.apply(readWeather, 'raining'),
        saySomething,
    ], function (err, result) {
        if (err) {
            res.render('error', {message: err});
        } else {
            locals.title = 'Is it going to rain?';
            locals.response =   result;  
            saveToDatabase('logentries', locals);
			coll.find({}).toArray(function(err, docs) {
				if (err)
				{
					res.json('error', err);
				}
				else
				{
					locals.logitems = docs;
					res.json('index', locals);		
				}
			});	

        }
    });
});

/* GET: Tell everyone I'm up! */
router.get('/reboot', function(req, res, next) {
    async.waterfall([
        async.apply(saySomething, 'Hee You! I did a reboot!'),
		getLog,
    ], function (err, result) {
        if (err) {
            res.render('error', {message: err});
        } else {
            locals.title    = 'Hee You! I did a reboot!';
            locals.response =   result;  
            saveToDatabase('logentries', locals);
			coll.find({}).toArray(function(err, docs) {
				if (err)
				{
					res.json('error', err);
				}
				else
				{
					locals.logitems = docs;
					res.json('index', locals);		
				}
			});	

        }
    });
});

/* GET: Get the wheather forecast and speak up!. */
router.get('/icloudcal', function(req, res, next) {
    async.waterfall([
        getMeetings,
        saySomething,
    ], function (err, result) {
        if (err) {
            res.render('error', {message: err});
        } else {
            locals.title    = 'iCloud calender';
            locals.response =   result;  
            saveToDatabase('logentries', locals);
			coll.find({}).toArray(function(err, docs) {
				if (err)
				{
					res.json('error', err);
				}
				else
				{
					locals.logitems = docs;
					res.json('index', locals);		
				}
			});			
        }
    });
});

router.get('/piglow', function(req, res, next) {
    //callback fires when board is initialized 
    locals.title    = 'piGlow is depricaded';
    locals.response = 'piGlow is depricaded';  
    res.render('error', locals);   
});

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
			
			if (typeof(events) === 'undefined')
			{
				var what_to_say = "You have no appointments";
				callback(null, what_to_say);
			}
			else
			{
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
						callback(null, what_to_say);
					}
				}        
			}
        }
    });
}


function saveToDatabase(collection,locals)
{
	locals.time     =   moment().format("HH:mm");
	locals.date     =   moment().format("DD/MM/YYYY");  
	locals.datetime =   moment().calendar(null, {
							sameDay: '[Today]',
							nextDay: '[Tomorrow]',
							nextWeek: 'dddd',
							lastDay: '[Yesterday]',
							lastWeek: '[Last] dddd',
							sameElse: 'DD/MM/YYYY'
						});  	
	coll.insertOne(locals, function(err, result)
	{
		if (err)
		{
			console.log('r351:'+collection);
			console.log('r352:'+locals);
			console.log('r353:'+url);
			console.log('r354:'+err);
		}
		else
		{
			console.log("Inserted a document into the collection.");
			return result;
		}
	});


}

module.exports = router;
