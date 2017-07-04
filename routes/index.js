var express = require("express");
var router = express.Router();
var Stock = require("../models/stocks");
var http = require("http").Server(express());
var io = require("socket.io")(http);

router.get("/", (req, res) => {
	res.render("index");
});



module.exports = router;