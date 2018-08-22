(function() {
  "use strict";

  function MyNode() {
    if (typeof window === 'undefined') {
      MyNodeServer();
    } else {
      MyNodeBrower();
    }
  }

  function MyNodeServer() {
    console.log("Server start");
    var sqlite3 = require('sqlite3');
    var db = new sqlite3.Database('MyNode.db', function() {
      db.run("CREATE TABLE IF NOT EXISTS MY_NODE (id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar(36), value varchar(255));", function(res) {
        var http = require('http');
        var url = require('url');
        var fs = require('fs');
        var mime = require('mime-types');
        var port = 8080;
        http.createServer(function(req, res) {
          console.log(req.url);
          var q = url.parse(req.url, true);
          // apis
          if (q.pathname === "/shutdown") {
            console.log("process exit!");
            process.exit();
          }
          if (q.pathname === "/api/hello") {
            res.write("hello");
            return res.end();
          }
          // web server
          if (q.pathname === "/") {
            res.write("<!DOCTYPE html>" +
              "<html>" +
              "<head>" +
              "<meta charset=\"utf-8\">" +
              "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
              "<title>My Node</title>" +
              "<script src=\"https://code.jquery.com/jquery-3.3.1.min.js\" integrity=\"sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=\" crossorigin=\"anonymous\"></script>" +
              "<script src=\"https://maxcdn.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js\"></script>" +
              "<link rel=\"stylesheet\" href=\"https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css\" integrity=\"sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO\" crossorigin=\"anonymous\">" +
              "</head>" +
              "<body>" +
              "<div class=\"container\">" +
              "</div>" +
              "</body>" +
              "<script src=\"/MyNode.js\"></script>" +
              "</html>");
            return res.end();
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
      });
    });
  }

  function MyNodeBrower() {
    console.log("Client start");
    $(document).ready(function() {
      console.log("Client ready");
      var element = document.getElementsByClassName("container")[0];

      var head = document.createElement("h1");
      var headNode = document.createTextNode("My First Bootstrap Page.");
      head.appendChild(headNode);
      element.appendChild(head);

      var para = document.createElement("p");
      var paraNode = document.createTextNode("This is some text.");
      para.appendChild(paraNode);
      element.appendChild(para);

      var button = document.createElement("button");
      button.className = "btn";
      button.type = "button";
      var buttonNode = document.createTextNode("click");
      button.appendChild(buttonNode);
      element.appendChild(button);
    });

  }

  MyNode();

})();
