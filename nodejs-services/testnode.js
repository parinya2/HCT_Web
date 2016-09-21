var bodyParser = require('body-parser')
var express = require('express');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
var MariaClient = require('mariasql');
var mariadbClient = new MariaClient({
  host: '127.0.0.1',
  user: 'root',
  password: '&SOMEWHEREONLYWEKNOWthisisabookPEACEFUL$71339416@',
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
  var courseType = req.query['courseType_param'];
  var startDate = req.query['startDate_param'];
  var endDate = req.query['endDate_param'];
console.log('a='+startDate+'b='+endDate);
  var extendedQueryStr = ' WHERE 1=1 ';
  if (courseType == '1') extendedQueryStr = ' WHERE course_type = "1" ';
  if (courseType == '2') extendedQueryStr = ' WHERE course_type = "2" ';

  var newStartDateStr = '1970-01-01 00:00:01';
  var newEndDateStr = '9999-01-01 23:59:59';

  if (startDate.indexOf('/') > -1) {
    var tmpArr = startDate.split('/');
    if (tmpArr.length == 3) {
      newStartDateStr = tmpArr[2]+'-'+tmpArr[1]+'-'+tmpArr[0]+" 00:00:01";
    }
  }

  if (endDate.indexOf('/') > -1) {
    var tmpArr = endDate.split('/');
    if (tmpArr.length == 3) {
      newEndDateStr = tmpArr[2]+'-'+tmpArr[1]+'-'+tmpArr[0]+" 23:59:59";
    }
  }

  mariadbClient.query('SELECT * FROM exam_history' + extendedQueryStr +
                      ' AND exam_datetime >= :param1 AND exam_datetime <= :param2',
                      {param1:newStartDateStr, param2:newEndDateStr},
          function(err, rows) {
    if (err)
      throw err;

    var str = '';
    for (var i = 0; i < rows.length; i++) {
      var courseName = '';
      if (rows[i].course_type == '1') courseName = 'หลักสูตรสอบขับรถยนต์';
      if (rows[i].course_type == '2') courseName = 'หลักสูตรสอบขับรถจักรยานยนต์';

      var examResult = '';
      if (rows[i].exam_result == 'Y')
        examResult = 'สอบผ่าน (คะแนน ' + rows[i].exam_score + ' / 50)';
      else
        examResult = 'สอบไม่ผ่าน (คะแนน ' + rows[i].exam_score + ' / 50)';

      var exam_datetime = '';
      var rawExamDatetime = '' + rows[i].exam_datetime;
      if (rawExamDatetime.length > 0) {
        var tmpArr1 = rawExamDatetime.split(' ');
        if (tmpArr1.length == 2) {
          var timeStr = tmpArr1[1];
          var dateStr = tmpArr1[0];
          var tmpArr2 = dateStr.split('-');
          dateStr = tmpArr2[2] + '/' + tmpArr2[1] + '/' + tmpArr2[0];
          exam_datetime = dateStr + ' เวลา ' + timeStr + ' น.';
        }
      }

      var tmp = '{' +
                '"Fullname":' + '"' + rows[i].fullname + '",' +
                '"CitizenID":' + '"' + rows[i].citizen_id + '",' +
                '"CourseName":' + '"' + courseName + '",' +
                '"ExamResult":' + '"' + examResult + '",' +
                '"ExamDatetime":' + '"' + exam_datetime + '",' +
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

app.post('/addExamHistory', function (req, res) {
  var fullname = req.body.fullname;
  var citizenId = req.body.citizenId;
  var examNumber = req.body.examNumber;
  var examTime = req.body.examTime;
  var examScore = req.body.examScore;
  var courseType = req.body.courseType;
  var examDateTime = req.body.examDateTime;
  var examResult = req.body.examResult;

  /*
    mariadbClient.query('INSERT INTO exam_history ' +
          '(fullname, citizen_id, exam_number, exam_time, exam_score, course_type, exam_datetime)' +
          ' VALUES (:param1, :param2, :param3, :param4, :param5, :param6, :param7)',
          {param1: 'สมศักดิ์ ค้าแก้ว', param2: '123456789', param3: '34', param4: 45, param5:47, param6:1, param7: '2016-05-23T08:30:01'},
          function(err, rows) {
  */

  mariadbClient.query('INSERT INTO exam_history ' +
          '(fullname, citizen_id, exam_number, exam_time, exam_score, course_type, exam_datetime, exam_result)' +
          ' VALUES (:param1, :param2, :param3, :param4, :param5, :param6, :param7, :param8)',
          {param1: fullname, param2: citizenId, param3: examNumber, param4: examTime, 
           param5: examScore, param6: courseType, param7: examDateTime, param8: examResult},
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
