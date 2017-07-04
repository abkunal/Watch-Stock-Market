var mongoose = require("mongoose");

var StockSchema = mongoose.Schema({
	code: String
});

var Stock = module.exports = mongoose.model("stock", StockSchema);

module.exports.getAllStocks = (callback) => {
	Stock.find().exec(callback);
}

module.exports.addStock = (newStock, callback) => {
	newStock.save(callback);
}

module.exports.deleteStock = (code, callback) => {
	Stock.remove({code: code}, callback);
}