var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var app = express();
var http = require('http').Server(app);
var request = require("request");
var io = require("socket.io")(http);

mongoose.connect("mongodb://localhost/chartStocks");
var db = mongoose.connection;

// database schema
var Stock = require("./models/stocks");

// Routes
var index = require("./routes/index");

// view engine
app.set("views", path.join(__dirname, "views"));
app.engine("handlebars", exphbs({"defaultLayout": "layout"}));
app.set("view engine", "handlebars");

app.use(express.static(path.join(__dirname, "/public")));

io.on('connection', function(socket) {
	console.log("A user connected");

	var stockCodeList = [];

	// When a user makes the connection for the first time, send stock data 
	// stored in database to client
	Stock.getAllStocks(function(err, stocks) {
		if (err) throw err;

		console.log(stocks);
		if (stocks != []) {
			
			for (let i in stocks) {
				stockCodeList.push(stocks[i].code);
				request({
					method: "GET",
					url: "https://www.alphavantage.co/query?" + 
					"function=TIME_SERIES_MONTHLY&symbol=" + stocks[i].code +
					"&apikey=FJYHHOJC0F72H1GC"
				}, function(error, response, body) {
					body = JSON.parse(body);
					body.sofar = stockCodeList;
					socket.emit('stock code', body);
				});	
			}
		}
	});

	// user has entered a stock code
	socket.on('stock code', function(code) {
		console.log(code);
		request({
			method: "GET", 
			url: "https://www.alphavantage.co/query?" + 
				"function=TIME_SERIES_MONTHLY&symbol=" + code[0] +
				"&apikey=FJYHHOJC0F72H1GC"
		}, function(error, response, body) {
			body = JSON.parse(body);

			// if stock code is invalid, inform the user who entered it
			if (body["Error Message"]) {
				body.sofar = code[1];
				socket.emit('stock code', body);
			}
			// if stock code is valid, send to all users
			else {
				let index = stockCodeList.indexOf(code[0]);
				if (index == -1) {
					stockCodeList = code[0];
					body.sofar = code[1];
					io.emit('stock code', body);	


					let newStock = new Stock({code: code[0]});
					Stock.addStock(newStock, (err, msg) => {
						if (err) throw err;
						console.log(msg);
					});
				}
				
			}

		});
	});

	// user has deleted a stock
	socket.on('deleteStock', (response) => {
		console.log("ID: ",response[0]);
		console.log("List: ", response[1]);

		stockCodeList = response[1];

		socket.broadcast.emit('removeStock', {code: response[0], list: stockCodeList});

		Stock.deleteStock(response[0], (err, msg) => {
			if (err) throw err;
			console.log(msg);
		});


	});

});

app.get("/", index);

app.use((req, res) => {
	res.render("404");
});

http.listen(3000, () => {
	console.log("Server running at port 3000");
});