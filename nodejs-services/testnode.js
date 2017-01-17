var bodyParser = require('body-parser')
var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');
var app = express();
app.use(bodyParser.json({limit:"1mb"}));
app.use(bodyParser.urlencoded({limit:"1mb", extended: true}));
var MariaClient = require('mariasql');
var mariadbClient = new MariaClient({
  host: '127.0.0.1',
  user: 'root',
  password: '&SOMEWHEREONLYWEKNOWthisisabookPEACEFUL$71339416@',
  db: 'hct_database'
});
var examResultPdfFolderPath = "exam_result_pdf";
var bcrypt = require('bcrypt');

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    var allowedOrigins = ['http://main.clickeexam.in', 'http://hct.clickeexam.in',
                          'http://abc.clickeexam.in', 'http://xyz.clickeexam.in',
                          'https://main.clickeexam.in', 'https://hct.clickeexam.in',
                          'https://abc.clickeexam.in', 'https://xyz.clickeexam.in'];
    var origin = req.headers.origin;
    if (allowedOrigins.indexOf(origin) > -1) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

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

var httpsOptions  = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
//var server = http.createServer(app);
var server = https.createServer(httpsOptions, app);
server.listen(8443, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)
});


function writeBase64StringToFilePath(base64Str, filePath) {
  var buf = new Buffer(base64Str, 'base64');
  fs.writeFile(filePath, buf, function(err){
    if (err) {
      console.log('write file error');
      console.log(err);
    } else {
      console.log('write file complete');
    }
  });
}

function readBase64StringFromFilePath(filePath) {
  if (fs.existsSync(filePath)) {
    var fileData = fs.readFileSync(filePath);
    var base64Str = new Buffer(fileData).toString('base64');
    return base64Str;
  } else {
    console.log('read file fail, file not exist : ' + filePath);
    return null;
  }
}

function generateExamResultPdfFileName(examDateTime, citizenId) {
  var tmpDateStr = examDateTime.replace(/:/g, '-');
  tmpDateStr = tmpDateStr.replace(/\s/g, '_');
  var max = 9999;
  var min = 1000;
  var randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return tmpDateStr + '_' + citizenId + '_' + randomNumber;
}

app.get('/getExamResultPdf', function (req, res) {
  var recordId = req.query['record_id'];
  mariadbClient.query('SELECT exam_result_pdf_filename FROM exam_history WHERE record_id = :param1',
                    {param1: recordId},
                    function(err, rows) {
    if (err)
      throw err;

    var pdfBase64String = '';
    for (var i = 0; i < rows.length; i++) {
      var fileName = rows[i].exam_result_pdf_filename;
      var filePath = examResultPdfFolderPath + '/' + fileName;
      var base64Str = readBase64StringFromFilePath(filePath);
      if (base64Str != null) {
        pdfBase64String = base64Str;
      }
      break;
    }
    res.end(pdfBase64String);
  });
  mariadbClient.end();
});

app.get('/listExamHistory', function (req, res) {
  var courseType = req.query['courseType_param'];
  var startDate = req.query['startDate_param'];
  var endDate = req.query['endDate_param'];
  var targetSchoolCertNo = req.query['targetSchoolCertNo_param'];

  if (targetSchoolCertNo == null) {
    console.log('targetSchoolCertNo is null');
    res.end('[]');
    return;
  }

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

  var columnQueryString = ' fullname, citizen_id, course_type, exam_score,' +
                          'exam_datetime, exam_number, exam_time, exam_result,' +
                          'record_id, school_cert_no ';
  mariadbClient.query('SELECT' + columnQueryString + 'FROM exam_history' + extendedQueryStr +
                      ' AND exam_datetime >= :param1 AND exam_datetime <= :param2 AND school_cert_no = :param3',
                      {param1:newStartDateStr, param2:newEndDateStr, param3:targetSchoolCertNo},
          function(err, rows) {
    if (err)
      throw err;

    var str = '';
    for (var i = 0; i < rows.length; i++) {
      var courseName = '';
      if (rows[i].course_type == '1') courseName = 'หลักสูตรสอนขับรถยนต์';
      if (rows[i].course_type == '2') courseName = 'หลักสูตรสอนขับรถจักรยานยนต์';

      var examResultFlag = rows[i].exam_result ;

      var examResult = '';
      if (rows[i].exam_result == 'Y')
        examResult = 'สอบผ่าน (คะแนน ' + rows[i].exam_score + ' / 50)';
      else if (rows[i].exam_result == 'N')
        examResult = 'สอบไม่ผ่าน (คะแนน ' + rows[i].exam_score + ' / 50)';
      else if (rows[i].exam_result == 'X')
        examResult = 'ทำข้อสอบไม่เสร็จ';
      else
        examResult = '-';

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
                '"ExamTime":' + '"' + rows[i].exam_time + '",' +
                '"ExamResultFlag":' + '"' + examResultFlag + '",' +
                '"RecordId":' + '"' + rows[i].record_id + '"' +
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
  var schoolCertNo = req.body.schoolCertNo;
  var examResultPdfBase64String = req.body.examResultPdfBase64String;

  var examResultPdfFileName = generateExamResultPdfFileName(examDateTime, citizenId);
  var examResultPdfFilePath = examResultPdfFolderPath + '/' + examResultPdfFileName;
  writeBase64StringToFilePath(examResultPdfBase64String, examResultPdfFilePath);

  mariadbClient.query('INSERT INTO exam_history ' +
          '(fullname, citizen_id, exam_number, exam_time, exam_score, course_type, ' +
          ' exam_datetime, exam_result, school_cert_no, exam_result_pdf_filename)' +
          ' VALUES (:param1, :param2, :param3, :param4, :param5, :param6, :param7, :param8, :param9, :param10)',
          {param1: fullname, param2: citizenId, param3: examNumber, param4: examTime,
           param5: examScore, param6: courseType, param7: examDateTime, param8: examResult,
           param9: schoolCertNo, param10: examResultPdfFileName},
          function(err, rows) {
    if (err)
      throw err;

    var str = 'Add Exam History DONE';

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
          res.end('SUCCESS,' + rows[0].school_abbr + ',' + rows[0].school_cert_no);
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

app.post('/getSchoolDetail', function (req, res) {
  var schoolAbbr = req.body.schoolAbbr;

  console.dir('schoolAbbr = ' + schoolAbbr);

  mariadbClient.query('SELECT * FROM all_schools ' +
          ' WHERE school_abbr = :param1',
          {param1: schoolAbbr},
          function(err, rows) {
    if (err)
      throw err;

    if (rows.length > 0) {
      var tmp = '[ {' +
                '"SchoolAbbr":' + '"' + rows[0].school_abbr + '",' +
                '"SchoolCertNo":' + '"' + rows[0].school_cert_no + '",' +
                '"SchoolFullName":' + '"' + rows[0].school_full_name + '"' +
                '} ]';
      res.end(tmp);
    } else {
      res.end('[]');
    }
  });
  mariadbClient.end();
});

app.post('/createUser', function (req, res) {
  var username = req.body.username_param;
  var password = req.body.password_param;
  var saltRounds = 10;
  var schoolAbbr = req.body.school_abbr;
  var schoolCertNo = req.body.school_cert_no;
  bcrypt.hash(password, saltRounds, function(err, hashedPassword) {
    console.dir('User='+username+'  Pass='+password+ '  Bcrypt='+hashedPassword);
    console.dir('schoolAbbr=' + schoolAbbr + ' schoolCertNo=' + schoolCertNo);

    mariadbClient.query('INSERT INTO all_users (username, password, school_abbr, school_cert_no)' +
            ' VALUES (:param1, :param2, :param3, :param4)',
            {param1: username, param2: hashedPassword, param3: schoolAbbr, param4: schoolCertNo},
            function(err, rows) {
      if (err)
        throw err;

      res.end('SUCCESS');
    });
    mariadbClient.end();
  });
});
