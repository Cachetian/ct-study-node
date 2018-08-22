/**
 * MyNode.js
 *
 * The goal is that sometimes you want to quickly implement a end to end app.
 * Full-stack technique in one file, db > service > ui, that is MyNode.js
 *
 */
(function() {
  "use strict";
  MyNode();

  function MyNode() {
    if (typeof window === 'undefined') {
      MyServer();
    } else {
      MyBrower();
    }

    function MyServer() {
      console.log("Server start");
      var sqlite3 = require('sqlite3');
      var http = require('http');
      var url = require('url');
      var fs = require('fs');
      var mime = require('mime-types');
      var db = new sqlite3.Database(':memory:', function() {
        db.run("CREATE TABLE IF NOT EXISTS MY_NODE (id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar(36), value varchar(255))", function() {
          var port = 8080;
          http.createServer(function(req, res) {
            console.log(req.url);
            var q = url.parse(req.url, true);
            // APIs
            if (q.pathname === "/shutdown") {
              console.log("process exit!");
              process.exit();
            }
            if (q.pathname === "/api/hello") {
              res.write("hello");
              return res.end();
            }
            if (q.pathname === "/api/create" && req.method == 'POST') {
              var data = '';
              req.on('data', function(chunk) {
                data += chunk.toString();
              });
              req.on('end', function() {
                console.log(data);
                var oData = JSON.parse(data);
                db.run("INSERT INTO MY_NODE(name,value) VALUES (?,?)", oData.name, oData.value, function(err) {
                  console.log(this.lastID);
                  res.write(JSON.stringify({
                    result: "success",
                    objectId: this.lastID
                  }));
                  res.end();
                });

              });
              return;
            }
            if (q.pathname === "/api/get") {
              db.all("SELECT * FROM MY_NODE", function(err, rows) {
                console.log(rows);
                res.write(JSON.stringify(rows));
                res.end();
              });
              return;
            }
            // web server
            if (q.pathname === "/") {
              res.write("<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">" +
                "<meta charset=\"utf-8\">" +
                "<title>My Node</title>" +
                "<script " +
                "id=\"sap-ui-bootstrap\"" +
                "src=\"https://openui5.hana.ondemand.com/resources/sap-ui-core.js\"" +
                "data-sap-ui-theme=\"sap_belize\"" +
                "data-sap-ui-libs=\"sap.m\"" +
                "data-sap-ui-preload=\"async\">" +
                "</script>" +
                "</head>" +
                "<body class=\"sapUiBody\" id=\"content\">" +
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

    function MyBrower() {
      console.log("Client start");
      $(document).ready(function() {
        console.log("Client ready");
        sap.ui.getCore().attachInit(function() {
          var myApp = new sap.m.App("myApp");
          var myPage = new sap.m.Page("myPage", {
            title: "Home",
            showNavButton: false,
            content: [
              new sap.m.Button({
                text: "Hello",
                press: function() {
                  jQuery.get("/api/hello", function(data) {
                    sap.m.MessageToast.show(data);
                  });
                }
              }), new sap.m.Button({
                text: "Create",
                press: function() {
                  jQuery.post("/api/create", JSON.stringify({
                    "name": "myName",
                    "value": "myValue"
                  }), function(res) {
                    sap.m.MessageToast.show(res);
                  });
                }
              }), new sap.m.Button({
                text: "Get",
                press: function() {
                  jQuery.get("/api/get", function(res) {
                    sap.m.MessageToast.show(res);
                  });
                }
              })
            ]
          });
          myApp.addPage(myPage);
          myApp.placeAt("content");
        });
      });
    }
  }
})();
