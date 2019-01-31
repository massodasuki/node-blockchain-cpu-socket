var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http); //, {'transports': ['websocket', 'xhr-polling']});
var cpu = require('./cpu.js');

var interval = 1000;

var port = process.env.PORT || 3000; //3500 to localhost

var bodyParser = require('body-parser');
var path = require('path');

var cpuStat = require('cpu-stat');
var os = require('os');

/*
var logger = function(req, res, next){
  console.log('Logging..')
}
app.use(logger);
*/
const XLSX = require('xlsx');

var workbook = XLSX.readFile('./assets/dataset.xlsx');// ./assets is where your relative path directory where excel file is, if your excuting js file and excel file in same directory just igore that part
var sheet_name_list = workbook.SheetNames; // SheetNames is an ordered list of the sheets in the workbook
data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]); //if you have multiple sheet
//View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//BoyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

//Set Static path
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  var title = 'Customers';
  res.render('index', {
      title:'Customers',
      dataset : JSON.stringify(data)
  });
});


setInterval(function(){
	 cpu.getPercentageUsage(interval, function(percentage){
	 	io.emit('cpu_usage', percentage);
	 });
}, interval);

http.listen(port, function(){
  console.log('Listening on port :' + port);
});
