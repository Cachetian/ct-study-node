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
            // APIs
            // Mock API
            if (q.pathname === '/sap/bc/lrep/flex/data/huawei.cbs.zcbsder001role.Component') {
              var lrepRes = '';
              res.write(lrepRes);
              return res.end();
            }
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
            // Admin UI
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
            // Proxy v2
            var proxy_cfg = {
              // the prefix you use to call your backend functions via the proxy server
              prefix: "/LOC/",
              // the host of your backend server
              host: "localhost",
              // port of your backend server
              port: "8088"
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

              // We have to set the host of the request to the our remote server
              // It currently contains localhost... which leads to problems on some
              // servers
              req.headers.host = proxy_cfg.host;
              // cut the prefix from the beginning of the url
              // request.url = request.url.slice(request.url.indexOf("/", 1));
              req.url = req.url.slice(proxy_cfg.prefix.length);
              hproxy.web(req, res, {
                // cause we use this script only during development and testing we
                // have a http connection. For https we have to do some additional
                // proxy configuration
                target: 'http://' + proxy_cfg.host + (proxy_cfg.port ? ':' + proxy_cfg.port : '') + '/'
              });
              return;
            }
            // Prox v1 has content type incorrect issue
            // var PROXY_ROOT = "/LOC";
            // if (q.pathname.startsWith(PROXY_ROOT)) {
            //   var options = {
            //     hostname: 'localhost',
            //     port: 8088,
            //     path: req.url.substr(PROXY_ROOT.length),
            //     method: req.method
            //   };
            //   var proxy = http.request(options, function (pres) {
            //     pres.pipe(res, {
            //       end: true
            //     });
            //   });
            //   req.pipe(proxy, {
            //     end: true
            //   });
            //   return;
            // }
            // web server
            var filename = "." + q.pathname;
            // UI5
            var UI5_RESOURCE_ROOT = "C:/SAP/WebIDE/sap-webide-personal-edition-1.53.5-trial-win32.win32.x86_64/eclipse/plugins/com.sap.webide.orionplugin_1.53.5/ui5/1.52.18/";
            if (q.pathname.startsWith("/resources")) {
              filename = UI5_RESOURCE_ROOT + filename;
            }
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
        console.log("Client ready");
        sap.ui.getCore().attachInit(function() {
          var myApp = new sap.m.App("myApp", {
            pages: [
              new sap.m.Page("myPage", {
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
              })
            ]
          });
          myApp.placeAt("content");
        });
      });
    }
  }
})();
