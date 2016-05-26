var bodyParser = require('body-parser')
var express = require('express');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
var MariaClient = require('mariasql');
var mariadbClient = new MariaClient({
  host: '127.0.0.1',
  user: 'root',
  password: '1prinya;',
  db: 'hct_database'
});

var bcrypt = require('bcrypt');

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

});

app.get('/listExamHistory', function (req, res) {
  var courseType = req.query['courseType'];
  var extendedQueryStr = '';
  if (courseType == '1') extendedQueryStr = ' WHERE course_type = "1"';
  if (courseType == '2') extendedQueryStr = ' WHERE course_type = "2"';

  mariadbClient.query('SELECT * FROM exam_history' + extendedQueryStr,
          function(err, rows) {
    if (err)
      throw err;

    var str = '';
    for (var i = 0; i < rows.length; i++) {
      var courseName = '';
      if (rows[i].course_type == '1') courseName = 'หลักสูตรสอบขับรถยนต์';
      if (rows[i].course_type == '2') courseName = 'หลักสูตรสอบขับรถจักรยานยนต์';

      var SCORE_TO_PASS = 40;
      var examResult = '';
      if (rows[i].exam_score >= SCORE_TO_PASS)
        examResult = 'สอบผ่าน (คะแนน ' + rows[i].exam_score + ' / 50)';
      else
        examResult = 'สอบไม่ผ่าน (คะแนน ' + rows[i].exam_score + ' / 50)';

      var tmp = '{' +
                '"Fullname":' + '"' + rows[i].fullname + '",' +
                '"CitizenID":' + '"' + rows[i].citizen_id + '",' +
                '"CourseName":' + '"' + courseName + '",' +
                '"ExamResult":' + '"' + examResult + '",' +
                '"ExamDatetime":' + '"' + rows[i].exam_datetime + '",' +
                '"ExamNumber":' + '"' + rows[i].exam_number + '",' +
                '"ExamTime":' + '"' + rows[i].exam_time + '"' +
                '}';
      str += tmp;
      if (i != rows.length - 1) {
        str += ',';
      }
    }
    str = '[' + str + ']';
    res.end(str);
  });
  mariadbClient.end();
});

app.get('/addExamHistory', function (req, res) {
  mariadbClient.query('INSERT INTO exam_history ' +
          '(fullname, citizen_id, exam_number, exam_time, exam_score, course_type, exam_datetime)' +
          ' VALUES (:param1, :param2, :param3, :param4, :param5, :param6, :param7)',
          {param1: 'สมศักดิ์ ค้าแก้ว', param2: '123456789', param3: '34', param4: 45, param5:47, param6:1, param7: '2016-05-23 08:30:01'},
          function(err, rows) {
    if (err)
      throw err;

    var str = '';

    console.dir(str);
    res.end(str);
  });
  mariadbClient.end();
});

app.post('/login', function (req, res) {
  var username = req.body.username_param;
  var password = req.body.password_param;

  console.dir('User='+username+'  Pass='+password);

  mariadbClient.query('SELECT * FROM all_users ' +
          ' WHERE username = :param1',
          {param1: username},
          function(err, rows) {
    if (err)
      throw err;

    if (rows.length > 0) {
      var hashedPassword = rows[0].password;
      bcrypt.compare(password, hashedPassword, function(err, result) {
        if (result == true) {
          res.end('SUCCESS');
        } else {
          res.end('FAIL');
        }
      });
    } else {
      res.end('FAIL');
    }
  });
  mariadbClient.end();
});

app.post('/createUser', function (req, res) {
  var username = req.body.username_param;
  var password = req.body.password_param;
  var saltRounds = 10;

  bcrypt.hash(password, saltRounds, function(err, hashedPassword) {
    console.dir('User='+username+'  Pass='+password+ '  Bcrypt='+hashedPassword);

    mariadbClient.query('INSERT INTO all_users (username, password)' +
            ' VALUES (:param1, :param2)',
            {param1: username, param2: hashedPassword},
            function(err, rows) {
      if (err)
        throw err;

        res.end('SUCCESS');
    });
    mariadbClient.end();
  });
});
