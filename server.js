//V1.0
var http = require('http');
var url = require('url');
var fs = require('fs');
var mime = require('mime-types');
var port = 8080;
http.createServer(function(req, res) {
  console.log(req.url);
  var q = url.parse(req.url, true);
  if (q.pathname === "/shutdown") {
    console.log("process exit!");
    process.exit();
  }
  var filename = "." + q.pathname;
  fs.readFile(filename, function(err, data) {
    if (err) {
      res.writeHead(404, {
        'Content-Type': 'text/html'
      });
      return res.end("404 Not Found");
    }
    res.writeHead(200, {
      'Content-Type': mime.lookup(filename)
    });
    res.write(data);
    return res.end();
  });
}).listen(port);
console.log("listen port: " + port + " ...");
