var config = require("./config");

var IoTManagerConfiguration = [];

// First line
var widget   = "anydata";
var id       = "0"
IoTManagerConfiguration[id] = {
  id     : id,
  page   : "Heating",
  pageId : 1,
  widget : widget,
  class1 : "item no-border",
  style2 : "font-size:16px;",
  topic  : config.prefix + "/" + config.deviceID + "/" + widget + id,
  class3 : "calm text-center",
  style3 : "font-size:20px;",
  status : "Office Heating"
};


// -
widget    = "simple-btn";
id        = "1"
IoTManagerConfiguration[id] = {
  id     : id,
  page   : "Heating",
  pageId : 1,
  widget : widget,
  class1 : "col-xs-4",
  class2 : "calm",
  topic  : config.prefix + "/" + config.deviceID + "/" + widget + id,
  class3 : "button button-calm icon ion-minus",
  style3 : "height:70px;",
};

// temp
widget    = "display-value";
id        = "2"
IoTManagerConfiguration[id] = {
  id     : id,
  page   : "Heating",
  pageId : 1,
  widget : widget,
  class1 : "no-padding-left col-xs-4",
  topic  : config.prefix + "/" + config.deviceID + "/" + widget + id,
  height : "70",
  color  : "#58b7ff",
  inactive_color : "#414141",
  digits_count   : 2
};

// +
widget    = "simple-btn";
id        = "3"
IoTManagerConfiguration[id] = {
  id     : id,
  page   : "Heating",
  pageId : 1,
  widget : widget,
  class1 : "col-xs-4",
  style1 : "",
  class2 : "calm",
  topic  : config.prefix + "/" + config.deviceID + "/" + widget + id,
  class3 : "button button-calm icon ion-plus",
  style3 : "height:70px;",
};

// Current temp
widget    = "anydata";
id        = "4"
IoTManagerConfiguration[id] = {
  id     : id,
  page   : "Heating",
  pageId : 1,
  widget : widget,
  class1 : "item no-border",
  style2 : "font-size:16px;float:left",
  descr  : "Current air temp",
  topic  : config.prefix + "/" + config.deviceID + "/" + widget + id,
  class3 : "assertive",
  style3 : "font-size:40px;font-weight:bold;float:right",
};

// Heater status
widget    = "anydata";
id        = "5"
IoTManagerConfiguration[id] = {
  id     : id,
  page   : "Heating",
  pageId : 1,
  widget : widget,
  class1 : "item no-border",
  style2 : "font-size:16px;float:left",
  descr  : "Heater status",
  topic  : config.prefix + "/" + config.deviceID + "/" + widget + id,
  class3 : "light padding-left padding-right rounded",
  style3 : "font-size:20px;font-weight:bold;float:right",
};

var widget   = "anydata";
var id       = "6"
IoTManagerConfiguration[id] = {
  id     : id,
  page   : "Lighting",
  pageId : 1,
  widget : widget,
  class1 : "item no-border",
  style2 : "font-size:16px;",
  topic  : config.prefix + "/" + config.deviceID + "/" + widget + id,
  class3 : "calm text-center",
  style3 : "font-size:20px;",
  status : "Office Lighting"
};


// -
widget    = "simple-btn";
id        = "7"
IoTManagerConfiguration[id] = {
  id     : id,
  page   : "Lighting",
  pageId : 1,
  widget : widget,
  class1 : "item no-border",
  descr  : "Lights",
  class2 : "stable padding-top",
  style2 : "float:left; font-size:16px",
  topic  : config.prefix + "/" + config.deviceID + "/" + widget + id,
  class3 : "button button-fab icon ion-power",
  style3 : "float:right;",
  widgetConfig : {
    //fill: lightingStatus ? "#00FF99" : "#CC3300",
    fill: "#00FF99",
  }
};

// Stop
/*widget    = "simple-btn";
id        = "6"
IoTManagerConfiguration[6] = {
  id     : id,
  page   : "Office",
  pageId : 1,
  widget : widget,
  topic  : config.prefix + "/" + config.deviceID + "/" + widget + id,
  class1 : "item no-border padding-bottom",
  descr  : "Stop heating",
  class2 : "assertive padding-top",
  style2 : "float:left;",
  class3 : "button icon ion-checkmark-circled",
  style3 : "float:right;",
  widgetConfig : {
    fill : "#FF5050",
    fillPressed : "#FF7070",
    label: "#FFFFFF",
    labelPressed: "#000000",
    alertText     : "Are you sure?", // confirmation will be show after button pressed
    alertTitle    : "Stop heating",
  }
/*
  widgetConfig : {
    fill          : "#FF5050",     // You can use any HTML colors
    fillPressed   : "#00FF00",
    labelPressed  : "#0000FF",
    label         : "#FFFFFF",
    title         : "1",
    alertText     : "A you sure?", // confirmation will be show after button pressed
    alertTitle    : "Stop heating",
  }
*/
//};

module.exports = IoTManagerConfiguration;
