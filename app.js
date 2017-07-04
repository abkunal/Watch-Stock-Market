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

mongoose.connect("mongodb://abkunal:abkunalMlab@ds127132.mlab.com:27132/backend");
var db = mongoose.connection;

var Stock = require("./models/stocks");

// Routes
var index = require("./routes/index");

// view engine
app.set("views", path.join(__dirname, "views"));
app.engine("handlebars", exphbs({"defaultLayout": "layout"}));
app.set("view engine", "handlebars");

app.use(express.static(path.join(__dirname, "/public")));

//require("./socket")(http);

io.on('connection', function(socket) {

	var stockCodeList = [];
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
					// You can get your free API key from alphavantage.co
				}, function(error, response, body) {
					body = JSON.parse(body);
					body.sofar = stockCodeList;
					socket.emit('stock code', body);
				});	
			}
		}
	});

	console.log("A user connected");
	socket.on('stock code', function(code) {
		console.log(code);
		request({
			method: "GET", 
			url: "https://www.alphavantage.co/query?" + 
				"function=TIME_SERIES_MONTHLY&symbol=" + code[0] +
				"&apikey=FJYHHOJC0F72H1GC"
		}, function(error, response, body) {
			body = JSON.parse(body);
			console.log(code);
			console.log("BODY: ", body["Meta Data"]["2. Symbol"]);

			// if stock code is invalid, inform the user who entered it
			if (body["Error Message"]) {
				body.sofar = code[1];
				socket.emit('stock code', body);
			}
			// if stock code is valid, send to all users
			else {
				code[1].push(code[0]);
				body.sofar = code[1];
				io.emit('stock code', body);	

				//
				let newStock = new Stock({code: code[0]});
				Stock.addStock(newStock, (err, msg) => {
					if (err) throw err;
					console.log(msg);
				});
			}

		});
	});

	socket.on('deleteStock', (response) => {
		console.log("ID: ",response[0]);
		console.log("List: ", response[1]);

		stockCodeList = response[1];

		socket.broadcast.emit('removeStock', {code: response[0], list: stockCodeList});

		Stock.deleteStock(response[0], (err, msg) => {
			if (err) throw err;
			//console.log(msg);
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