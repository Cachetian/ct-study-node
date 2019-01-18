/**
 * MyNode.js
 *
 * The goal is that sometimes you want to quickly implement a end to end app.
 * Full-stack technique in one file, db > service > ui, that is MyNode.js
 *
 */
(function() {
  "use strict";

  // run it!
  return MyNode();

  function MyNode() {
    // if window object found, means in Broswer environment
    if (typeof window === 'undefined') {
      MyServer();
    } else {
      MyBrower();
    }

    /**
     * Server side
     */
    function MyServer() {
      console.log("Server start");
      var sqlite3 = require('sqlite3'),
        http = require('http'),
        httpProxy = require('http-proxy'),
        url = require('url'),
        fs = require('fs'),
        mime = require('mime-types');
      var db = new sqlite3.Database(':memory:', function() {
        db.run("CREATE TABLE IF NOT EXISTS MY_NODE (id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar(36), value varchar(255))", function() {
          var port = 8086;
          var hproxy = httpProxy.createProxyServer();
          http.createServer(function(req, res) {
            console.log(req.url);
            var q = url.parse(req.url, true);
            // REST APIs
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
            // Index.html
            if (q.pathname === "/") {
              res.write(Buffer.from("PCFET0NUWVBFIGh0bWw+PGh0bWw+PGhlYWQ+PG1ldGEgaHR0cC1lcXVpdj0iWC1VQS1Db21wYXRpYmxlIiBjb250ZW50PSJJRT1lZGdlIj48bWV0YSBjaGFyc2V0PSJ1dGYtOCI+PHRpdGxlPk15IE5vZGU8L3RpdGxlPjxzY3JpcHQgaWQ9InNhcC11aS1ib290c3RyYXAic3JjPSJodHRwczovL29wZW51aTUuaGFuYS5vbmRlbWFuZC5jb20vcmVzb3VyY2VzL3NhcC11aS1jb3JlLmpzImRhdGEtc2FwLXVpLXRoZW1lPSJzYXBfYmVsaXplImRhdGEtc2FwLXVpLWxpYnM9InNhcC5tImRhdGEtc2FwLXVpLXByZWxvYWQ9ImFzeW5jIj48L3NjcmlwdD48L2hlYWQ+PGJvZHkgY2xhc3M9InNhcFVpQm9keSIgaWQ9ImNvbnRlbnQiPjwvYm9keT48c2NyaXB0IHNyYz0iL015Tm9kZS5qcyI+PC9zY3JpcHQ+PC9odG1sPg==", 'base64').toString());
              return res.end();
            }
            // Reverse proxy
            var aPrefixes = [
              "/proxy/"
            ]
            for (var iPrefix in aPrefixes) {
              var proxy_cfg = {
                // the prefix you use to call your backend functions via the proxy server
                prefix: aPrefixes[iPrefix],
                // the host of your backend server
                host: "proxy",
                // port of your backend server
                port: "8080"
              };
              if (q.pathname.startsWith(proxy_cfg.prefix)) {
                hproxy.on('error', function(err, preq, pres) {
                  console.log("backend error");
                  console.log(err);
                });
                hproxy.on('proxyRes', function(proxyRes, preq, pres) {
                  console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
                });
                hproxy.on('close', function(preq, socket, head) {
                  // view disconnected websocket connections
                  console.log('Client disconnected');
                });
                req.headers.host = proxy_cfg.host;
                req.url = req.url.slice(proxy_cfg.prefix.length);
                hproxy.web(req, res, {
                  target: 'http://' + proxy_cfg.host + (proxy_cfg.port ? ':' + proxy_cfg.port : '') + '/'
                });
                return;
              }
            }
            // Web server
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

    /**
     * Broswer side
     */
    function MyBrower() {
      console.log("Client start");
      $(document).ready(function() {
        sap.ui.getCore().attachInit(function() {
          // Model
          var oViewModel = new sap.ui.model.json.JSONModel({});
          sap.ui.getCore().setModel(oViewModel, "viewModel");
          // View
          var myApp = new sap.m.App("myApp", {
            pages: [
              new sap.m.Page("myPage", {
                title: "MyNode.js",
                showHeader: true,
                showNavButton: false,
                content: [],
                footer: new sap.m.OverflowToolbar({
                  content: [
                    new sap.m.ToolbarSpacer(),
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
                })
              })
            ]
          });
          myApp.placeAt("content");
        });
      });
    }
  }
})();
