var io = require("socket.io");
var request = require("request");

module.exports = function(server) {
	io(server).on('connection', function (socket) {
		console.log("A user connected");
		socket.on('stock code', function(code){
			console.log(code);

			// Get Stock information 
			request({
				method: "GET",
				url: "https://www.alphavantage.co/query?" + 
				"function=TIME_SERIES_MONTHLY&symbol=" + code +
				"&apikey=FJYHHOJC0F72H1GC"
			}, (error, response, body) => {
				body = JSON.parse(body);
				console.log("BODY:", body["Meta Data"]);
				//io(server).sockets.emit('stock code', body);
				io(server).sockets.send(body);
			});

			
		});
	});	
}
