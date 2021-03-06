var express         = require('express');
var path            = require('path');
var favicon         = require('serve-favicon');
var logger          = require('morgan');
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var fs              = require('fs');
var stringy         = require('stringy');
//var ejsLayouts = require("express-ejs-layouts");

var MongoClient 	= require('mongodb').MongoClient;
var MONGODB_URI 	= 'mongodb://localhost:27017/heeyou';

var routes 			= require('./routes/index');
var users 			= require('./routes/users');
var heeyou 			= require('./routes/heeyou');

var app = express();

MongoClient.connect(MONGODB_URI, function(err, database) {
	if(err) throw err;
	
	db = database;
	coll = db.collection('logentries');

});
	//app.use(ejsLayouts);
	
	// view engine setup
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'ejs');
	
	// uncomment after placing your favicon in /public
	//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(express.static(path.join(__dirname, 'public')));
	
	app.use('/', routes);
	app.use('/users', users);
	app.use('/heeyou', heeyou);
	
	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});
	
	// error handlers
	
	// development error handler
	// will print stacktrace
	if (app.get('env') === 'development') {
		app.use(function(err, req, res, next) {
			console.dir("Req: "+req);
			console.dir("Res: "+res);
			console.dir("Nxt: "+next);
			console.dir("Msg: "+err.message);
			res.status(err.status || 500);
			res.render('error', {
				message: err.message,
				error: err
			});
		});
	}
	
	// production error handler
	// no stacktraces leaked to user
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: {}
		});
	});
	
module.exports = app;