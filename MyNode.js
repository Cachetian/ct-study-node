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

  function MyNodeBrower() {
    console.log("Client start");
    $(document).ready(function() {
      console.log("Client ready");
      sap.ui.getCore().attachInit(function() {
        // create a mobile app and display page1 initially
        var app = new sap.m.App("myApp", {
          initialPage: "page1"
        });

        // create the first page
        var page1 = new sap.m.Page("page1", {
          title: "Hello World",
          showNavButton: false,
          content: new sap.m.Button({
            text: "Go to Page 2",
            press: function() {
              // navigate to page2
              app.to("page2");
            }
          })
        });

        // create the second page with a back button
        var page2 = new sap.m.Page("page2", {
          title: "Hello Page 2",
          showNavButton: true,
          navButtonPress: function() {
            // go back to the previous page
            app.back();
          }
        });

        // add both pages to the app
        app.addPage(page1).addPage(page2);
        // place the app into the HTML document
        app.placeAt("content");
      });
    });

  }

  MyNode();

})();
