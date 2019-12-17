/**
 * MyNode.js
 *
 * The goal is that sometimes you want to quickly implement a end to end app.
 * Full-stack technique in one file, db > service > ui, that is MyNode.js
 * db use sqlite
 * service use http
 * ui use ui5
 *
 * (c) Copyright 2009-2019 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
(function() {
  "use strict";

  function MyNode(dir) {
    var _dir = dir;

    // Decide server or broser mode. (if window object found means in Broswer environment)
    if (typeof window === 'undefined') {
      MyServer(dir);
    } else {
      MyBrower();
    }

    /**
     * Broswer side
     */
    function MyBrower() {
      console.log("MyNode->MyBrower start");
      $(document).ready(function() {
        sap.ui.getCore().attachInit(function() {
          // MVC - M Models
          var oViewModel = new sap.ui.model.json.JSONModel({
            info: {
              textCount: 0
            },
            buttons: {
              CreateMyNode: {
                visible: false
              },
              GetMyNode: {
                visible: false
              },
              SelectAllText: {
                visible: false
              },
              SaveText: {
                visible: false
              },
              Refresh: {
                visible: false
              }
            }
          });
          sap.ui.getCore().setModel(oViewModel, "appView");
          var oDataModel = new sap.ui.model.json.JSONModel("/api/model_data");
          sap.ui.getCore().setModel(oDataModel, "appData");
          var oFilesModel = new sap.ui.model.json.JSONModel("/api/file_data");
          sap.ui.getCore().setModel(oFilesModel, "appFiles");
          var oConfigModel = new sap.ui.model.json.JSONModel("/api/config_data");
          sap.ui.getCore().setModel(oConfigModel, "appConfig");

          oDataModel.dataLoaded().then(function() {
            oViewModel.setProperty("/info/textCount", oDataModel.getProperty("/myText").length);
          });

          oConfigModel.dataLoaded().then(function() {
            var aBtns = oConfigModel.getProperty("/VISIBLE_BUTTONS");
            for (var i = 0; i < aBtns.length; i++) {
              oViewModel.setProperty("/buttons/" + aBtns[i], true);
            }
          });

          var oController = {
            events: {
              onAfterRendering: function() {}
            },
            actions: {
              get_files: function() {},
              get_model_data: function(oEvent) {
                jQuery.get("/api/model_data", function(data) {
                  oDataModel.setData(JSON.parse(data));
                  oFilesModel.refresh();
                });
                jQuery.get("/api/file_data", function(data) {
                  oFilesModel.setData(JSON.parse(data));
                  oFilesModel.refresh();
                });
              }
            }
          };

          // MCV - V&C View and Controller
          var myApp = new sap.m.App("myApp", {
            pages: [
              new sap.m.Page("myPage", {
                title: "{appConfig>/APP_TITLE}",
                showHeader: true,
                showNavButton: false,
                headerContent: [
                  new sap.m.Button({
                    icon: "sap-icon://refresh",
                    visible: "{appView>/buttons/Refresh/visible}",
                    press: oController.actions.get_model_data.bind(this)
                  })
                ],
                content: [
                  new sap.m.TextArea("myTextArea", {
                    width: "100%",
                    rows: 24,
                    maxLength: 4096,
                    value: "{appData>/myText}",
                    liveChange: function(oEvent) {
                      oViewModel.setProperty("/info/textCount", oEvent.getParameter("value").length);
                      oViewModel.refresh();
                    }
                  }),
                  new sap.m.UploadCollection("myUploadCollection", {
                    maximumFileSize: 16384,
                    uploadEnabled: true,
                    uploadUrl: "/api/file_data",
                    beforeUploadStarts: function(oEvent) {
                      // Header Slug
                      var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
                        name: "slug",
                        value: encodeURIComponent(oEvent.getParameter("fileName"))
                      });
                      oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
                    },
                    uploadComplete: function(oEvent) {
                      jQuery.get("/api/file_data", function(data) {
                        oFilesModel.setData(JSON.parse(data));
                        oFilesModel.refresh();
                      });
                    }
                  })
                ],
                footer: new sap.m.OverflowToolbar({
                  content: [
                    new sap.m.Text({
                      text: "Total words:"
                    }),
                    new sap.m.Text({
                      text: "{appView>/info/textCount}"
                    }),
                    new sap.m.ToolbarSpacer(),
                    new sap.m.Button({
                      text: "Create MyNode",
                      visible: "{appView>/buttons/CreateMyNode/visible}",
                      press: function() {
                        jQuery.post("/api/my_node", JSON.stringify({
                          "name": "myName",
                          "value": "myValue"
                        }), function(res) {
                          sap.m.MessageToast.show(res);
                        });
                      }
                    }), new sap.m.Button({
                      text: "Get MyNode",
                      visible: "{appView>/buttons/GetMyNode/visible}",
                      press: function() {
                        jQuery.get("/api/my_node", function(data) {
                          sap.m.MessageToast.show(data);
                        });
                      },
                    }), new sap.m.Button({
                      text: "Post Text",
                      visible: "{appView>/buttons/SaveText/visible}",
                      press: function(oEvent) {
                        jQuery.post("/api/model_data", JSON.stringify(oDataModel.getData()), function(res) {
                          sap.m.MessageToast.show(JSON.parse(res).result);
                        });
                      },
                    }), new sap.m.Button({
                      text: "Select All Text and Copy",
                      visible: "{appView>/buttons/SelectAllText/visible}",
                      press: function(oEvent) {
                        sap.ui.getCore().byId("myTextArea").getDomRef().firstChild.firstChild.select();
                        document.execCommand("copy");
                        sap.m.MessageToast.show("Copied");
                      },
                    })
                  ]
                })
              })
            ]
          });
          myApp.addEventDelegate({
            onAfterRendering: function() {
              sap.ui.getCore().byId("myUploadCollection").bindItems({
                path: "appFiles>/items",
                factory: function(id, context) {
                  return new sap.m.UploadCollectionItem(id, {
                    fileName: "{appFiles>fileName}",
                    mimeType: "{appFiles>mimeType}",
                    url: "{appFiles>url}",
                    visibleEdit: false,
                    multiple: false,
                    deletePress: function(oEvent) {
                      var oItem = oEvent.getSource();
                      sap.m.MessageBox.confirm("delete?", {
                        onClose: function(sAction) {
                          if (sAction === sap.m.MessageBox.Action.OK) {
                            jQuery.ajax({
                              url: "/api/file_data('" + oItem.getFileName() + "')",
                              type: 'DELETE',
                              success: function(data) {
                                sap.m.MessageToast.show(JSON.parse(data).result);
                                jQuery.get("/api/file_data", function(data) {
                                  oFilesModel.setData(JSON.parse(data));
                                  oFilesModel.refresh();
                                });
                              }
                            });
                          }
                        }
                      });
                    }
                  });
                }
              });
            }.bind(this)
          });
          myApp.placeAt("content");
        });
      });
    }
  }

  /**
   * Server side
   */
  function MyServer(dir) {
    console.log("MyNode->MyServer start");
    var
      sqlite3 = require('sqlite3'),
      http = require('http'),
      httpProxy = require('http-proxy'),
      url = require('url'),
      fs = require('fs'),
      mime = require('mime-types'),
      path = require('path');
    const
      SQL_CREATE = " CREATE TABLE IF NOT EXISTS MY_NODE (id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar(36), value varchar(255)) ",
      SQL_UPDATE = " INSERT INTO MY_NODE(name,value) VALUES (?,?) ",
      SQL_DELETE = " DELETE FROM MY_NODE WHERE name = (?) ",
      SQL_QUERY = " SELECT * FROM MY_NODE ";
    var RT_SETTINGS = {
      APP_CONFIG: {
        APP_TITLE: "MyNode.js",
        VISIBLE_BUTTONS: ["CreateMyNode", "GetMyNode", "SelectAllText", "SaveText", "Refresh"]
      },
      LOC_UI5: {
        ENABLED: false,
        LIB_PATH: "."
      },
      LOC_SRC: {
        ENABLED: false,
        SRC_PATH: "/MyNode.js"
      },
      UPLOAD_PATH: "./uploads/"
    };
    try {
      var curDir = __dirname;
      if (dir) {
        curDir = dir;
      }
      var rtPath = path.resolve(curDir, "RT_SETTINGS.json");
      console.log(rtPath);
      var RT_SETTINGS_JSON = JSON.parse(fs.readFileSync(rtPath, 'utf8'));
      RT_SETTINGS.APP_CONFIG.APP_TITLE = RT_SETTINGS_JSON.APP_CONFIG.APP_TITLE;
      if (RT_SETTINGS_JSON.APP_CONFIG.VISIBLE_BUTTONS) {
        RT_SETTINGS.APP_CONFIG.VISIBLE_BUTTONS.length = 0;
        RT_SETTINGS.APP_CONFIG.VISIBLE_BUTTONS = RT_SETTINGS_JSON.APP_CONFIG.VISIBLE_BUTTONS;
      }
      if (RT_SETTINGS_JSON.LOC_UI5) {
        RT_SETTINGS.LOC_UI5.ENABLED = RT_SETTINGS_JSON.LOC_UI5.ENABLED;
        RT_SETTINGS.LOC_UI5.LIB_PATH = RT_SETTINGS_JSON.LOC_UI5.LIB_PATH;
      }
      if (RT_SETTINGS_JSON.LOC_SRC) {
        RT_SETTINGS.LOC_SRC.ENABLED = RT_SETTINGS_JSON.LOC_SRC.ENABLED;
        RT_SETTINGS.LOC_SRC.SRC_PATH = RT_SETTINGS_JSON.LOC_SRC.SRC_PATH;
      }
      if (RT_SETTINGS_JSON.UPLOAD_PATH) {
        RT_SETTINGS.UPLOAD_PATH = RT_SETTINGS_JSON.UPLOAD_PATH;
      }
      if (!fs.existsSync(RT_SETTINGS.UPLOAD_PATH)) {
        fs.mkdirSync(RT_SETTINGS.UPLOAD_PATH);
      }
    } catch (e) {
      console.log("no RT_SETTINGS.json found. " + e);
    }
    var RT_DATA = {
      APP_DATA: {
        modelData: {
          myText: "Type your text here ..."
        }
      }
    };
    var db = new sqlite3.Database(':memory:', function() {
      db.run(SQL_CREATE, function() {
        var port = 8086;
        var hproxy = httpProxy.createProxyServer();
        http.createServer(function(req, res) {
          console.log(req.url);
          var q = url.parse(req.url, true);
          // REST APIs - Admin/hello/CRUD
          if (q.pathname === "/api/app") {
            if (req.method == 'DELETE') {
              console.log("process exit!");
              process.exit();
            }
          } else if (q.pathname === "/api/my_node") {
            if (req.method == 'POST') {
              var data = '';
              req.on('data', function(chunk) {
                data += chunk.toString();
              });
              req.on('end', function() {
                console.log(data);
                var oData = JSON.parse(data);
                db.run(SQL_UPDATE, oData.name, oData.value, function(err) {
                  console.log(this.lastID);
                  res.write(JSON.stringify({
                    result: "success",
                    objectId: this.lastID
                  }));
                  res.end();
                });
              });
              return;
            } else if (req.method == 'GET') {
              db.all(SQL_QUERY, function(err, rows) {
                console.log(rows);
                res.write(JSON.stringify(rows));
                res.end();
              });
              return;
            }
          } else if (q.pathname.startsWith("/api/file_data")) {
            if (req.method == 'POST') {
              var data = [];
              req.on('data', function(chunk) {
                data.push(chunk);
              });
              req.on('end', function() {
                var buffer = Buffer.concat(data);
                console.log(req.headers);
                fs.writeFileSync(RT_SETTINGS.UPLOAD_PATH + decodeURIComponent(req.headers["slug"], buffer));
                res.write(JSON.stringify({
                  result: "success"
                }));
                res.end();
              });
              return;
            } else if (req.method == 'DELETE') {
              var reg = /\('(.+?)'\)/;
              var fileName = reg.exec(decodeURIComponent(q.pathname))[1];
              fs.unlinkSync(RT_SETTINGS.UPLOAD_PATH + fileName);
              res.write(JSON.stringify({
                result: "success"
              }));
              res.end();
              return;
            } else if (req.method == 'GET') {
              if (q.pathname === "/api/file_data") {
                var filedata = {
                  items: []
                };
                fs.readdir(RT_SETTINGS.UPLOAD_PATH, function(err, files) {
                  //handling error
                  if (err) {
                    return console.log('Unable to scan directory: ' + err);
                  }
                  //listing all files using forEach
                  files.forEach(function(file) {
                    // Do whatever you want to do with the file
                    console.log(file);
                    filedata.items.push({
                      fileName: file,
                      url: "/api/file_data('" + file + "')/$value"
                    });
                  });
                  res.write(JSON.stringify(filedata));
                  res.end();
                });
                return;
              } else if (q.pathname.endsWith("/$value")) {
                var reg = /\('(.+?)'\)/;
                var fileName = reg.exec(decodeURIComponent(q.pathname))[1];
                fs.readFile(RT_SETTINGS.UPLOAD_PATH + fileName, function(err, data) {
                  if (err) {
                    res.writeHead(404, {
                      'Content-Type': 'text/html'
                    });
                    return res.end("404 Not Found");
                  }
                  res.writeHead(200, {
                    'Content-Type': mime.lookup(fileName),
                    'Content-Disposition': 'attachment; filename="' + encodeURIComponent(fileName) + '"'
                  });
                  res.write(data);
                  return res.end();
                });
                return;
              }
            }
          } else if (q.pathname === "/api/model_data") {
            if (req.method == 'POST') {
              var data = '';
              req.on('data', function(chunk) {
                data += chunk.toString();
              });
              req.on('end', function() {
                console.log(data);
                var oData = JSON.parse(data);
                RT_DATA.APP_DATA.modelData.myText = oData.myText;
                res.write(JSON.stringify({
                  result: "success"
                }));
                res.end();
              });
              return;
            } else if (req.method == 'GET') {
              res.write(JSON.stringify(RT_DATA.APP_DATA.modelData));
              res.end();
              return;
            }
          } else if (q.pathname === "/api/config_data" && req.method == 'GET') {
            res.write(JSON.stringify(RT_SETTINGS.APP_CONFIG));
            res.end();
            return;
          } else if (q.pathname === "/") {
            // index html
            var LIB_PATH = "https://openui5.hana.ondemand.com";
            if (RT_SETTINGS.LOC_UI5.ENABLED) {
              LIB_PATH = "";
            }
            var SRC_PATH = "/MyNode.js";
            if (RT_SETTINGS.LOC_SRC.ENABLED) {
              SRC_PATH = RT_SETTINGS.LOC_SRC.SRC_PATH;
            }
            // console.log(LIB_PATH);
            var index_html = Buffer.from("PCFET0NUWVBFIGh0bWw+PGh0bWw+PGhlYWQ+PG1ldGEgaHR0cC1lcXVpdj0iWC1VQS1Db21wYXRpYmxlIiBjb250ZW50PSJJRT1lZGdlIj48bWV0YSBjaGFyc2V0PSJ1dGYtOCI+PHRpdGxlPkFQUF9USVRMRTwvdGl0bGU+PHNjcmlwdCBpZD0ic2FwLXVpLWJvb3RzdHJhcCJzcmM9IkxJQl9QQVRIL3Jlc291cmNlcy9zYXAtdWktY29yZS5qcyJkYXRhLXNhcC11aS10aGVtZT0ic2FwX2JlbGl6ZSJkYXRhLXNhcC11aS1iaW5kaW5nU3ludGF4PSJjb21wbGV4ImRhdGEtc2FwLXVpLWxpYnM9InNhcC5tImRhdGEtc2FwLXVpLXByZWxvYWQ9ImFzeW5jIj48L3NjcmlwdD48L2hlYWQ+PGJvZHkgY2xhc3M9InNhcFVpQm9keSIgaWQ9ImNvbnRlbnQiPjwvYm9keT48c2NyaXB0IHNyYz0iU1JDX1BBVEgiPjwvc2NyaXB0PjwvaHRtbD4=", 'base64').toString();
            index_html = index_html.replace(/LIB_PATH/g, LIB_PATH);
            index_html = index_html.replace(/SRC_PATH/g, SRC_PATH);
            index_html = index_html.replace(/APP_TITLE/g, RT_SETTINGS.APP_CONFIG.APP_TITLE);
            res.write(index_html);
            return res.end();
          }
          // Reverse proxy - proxy N paths by defining prefixes to 1 target
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
          // Web server - under current folder
          // var filename = "." + q.pathname;
          var filename = curDir + q.pathname;
          // Local UI5 library enablement
          if (RT_SETTINGS.LOC_UI5.ENABLED) {
            if (q.pathname.startsWith("/resources")) {
              filename = RT_SETTINGS.LOC_UI5.LIB_PATH + q.pathname;
            }
            const SDK_PREFIX = "/sdk";
            if (q.pathname.startsWith(SDK_PREFIX)) {
              filename = RT_SETTINGS.LOC_UI5.LIB_PATH + q.pathname.substr(SDK_PREFIX.length);
            }
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

  // Decide server or broser mode. (if window object found means in Broswer environment)
  // if (typeof window === 'undefined') {
  //   module.exports = MyNode;
  // } else {
  //   MyNode();
  // }
  try {
    module.exports = MyNode;
  } catch (e) {
    new MyNode();
  }
})();
