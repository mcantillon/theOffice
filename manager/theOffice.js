////////////////////////////////////////////////
//
// Demo device emulator "Boiler: thermostat with adjustable hysteresis"
//
//
//
// IoT Manager https://play.google.com/store/apps/details?id=ru.esp8266.iotmanager
//
// version     : 1.0
// IoT Manager : 1.4.8 and above
//
////////////////////////////////////////////////

////////////////////////////////////////////////
var config = require("./config");
var mqtt = require('mqtt');
var IoTManagerConfiguration = require('./IoTManagerConfiguration');
var host = config.host;
var port = config.port;
var user = config.user;
var pass = config.pass;
var protocol = config.protocol;
////////////////////////////////////////////////
var mqttUrl = 'ws://XXXX:9090/';
var opt = {
  host       : host,
  port       : port,
  username   : user,
  password   : pass,
  clientId   : 'mqtt-js_' + Math.random().toString(16).substr(2, 8),
  protocolId : protocol,
  connectTimeout: 3000
};


var isHeaterOn = false;
var airTemp = 15;
var hiTemp    = 18;
var hysteresis= 4;
var lowTemp   = hiTemp - hysteresis;
var manualStop= false;
var lastHeater= true;
var lastAlert = false;
var lightingStatus = true;

//var config   = [];
//var client   = mqtt.connect(mqttUrl);
var client   = mqtt.connect(opt);

var logger = { log: function(value) { console.log(value)}};

var theHeaterObj = require("./heater");
var theAirTemperatureSensorObj = require("./airTemperatureSensor");
var theHeater = new theHeaterObj(client, logger);
var theAirTemperatureSensor = new theAirTemperatureSensorObj(client, logger, handleNewAirTemperature);

client.on('connect', function () {
  logger.log('Broker connected');
  client.subscribe(config.prefix, { qos : 1 }); // HELLO expected
  client.subscribe(config.prefix + "/" + config.deviceID +"/+/control", { qos : 1 }); // all command
  client.subscribe("Office/+/status", { qos: 1}); // messages from the sensors
  //client.subscribe("Office/+/temperature", { qos: 1}); // messages from the sensors
  publishIoTManagerConfiguration();
});

client.on('error', function () {
  logger.log('error');
});

client.on('offline', function () {
  logger.log('! offline');
});

client.on('message', function (topic, message) {

  logger.log("msg: " + topic.toString() + " => " + message.toString());

  if (topic.toString() === config.prefix && message.toString() == "HELLO" ){
    logger.log('HELLO detected');
    publishIoTManagerConfiguration();
  }
  if (topic.toString() === IoTManagerConfiguration[1].topic + "/control" ){
    logger.log("Receive command: max temp dec");
    decrementDesiredTemperature();
    pubControlTempStatus();
    requestAirTemperature();
  }
  if (topic.toString() === IoTManagerConfiguration[3].topic + "/control" ){
    logger.log("Receive command: max temp inc");
    incrementDesiredTemperature();
    /*if (manualStop) {
       publishMessage(IoTManagerConfiguration[6].topic + "/status", JSON.stringify(IoTManagerConfiguration[6]),{ qos : 1 });
    }*/
    pubControlTempStatus();
    requestAirTemperature();
  }
  if (topic.toString() === IoTManagerConfiguration[7].topic + "/control" ){
    logger.log("Receive command: light toggle");
    lightingStatus = !lightingStatus;
    logger.log("New lighting status:" + lightingStatus);
    pubControlLightingStatus();
  }

  if(topic.toString() === "/theOffice/lighting/status"){
      var lightStatusFromSensor = message.toString();
      logger.log("Got a light status of " + lightStatusFromSensor + " from the sensor");
      if(lightStatusFromSensor.toLowerCase() === "true"){
        lightingStatus = true;
      } else {
        lightingStatus = false;
      }
      logger.log("Lighting status is now " + lightingStatus);
      pubControlLightingStatus();
  }

  /*if (topic.toString() === IoTManagerConfiguration[6].topic + "/control" ){
    logger.log("!!! Receive command: manualStop heater control");

    var newStyle = {
        descr  : "Heating is off",
//        class3 : "button button-light icon ion-close-circled"
    }
    publishMessage(IoTManagerConfiguration[6].topic + "/status", JSON.stringify(newStyle),{ qos : 1 });

    manualStop = true;
    isHeaterOn = false;
    pubControlTempStatus();
    pubHeaterStatus();
  }*/
});
////////////////////////////////////////////////
function publishIoTManagerConfiguration() {
    publishMessage( config.prefix, config.deviceID );
    IoTManagerConfiguration.forEach(function(item, i, arr) {
      publishMessage(config.prefix + "/" + config.deviceID + "/config", JSON.stringify(item),{ qos : 1 });
    });
    setTimeout(function() {
       pubControlTempStatus();
       pubHeaterStatus(true);
       requestAirTemperature();
    }, 500);
}

function decrementDesiredTemperature(){
  hiTemp = hiTemp - 1;
  lowTemp = lowTemp - 1;
  manualStop = false;
  logger.log("New Desired Temperature:" + hiTemp);
}

function incrementDesiredTemperature(){
  hiTemp = hiTemp + 1;
  lowTemp = lowTemp + 1;
  manualStop = false;
  logger.log("New Desired Temperature:" + hiTemp);
}

function handleNewAirTemperature(newAirTemp){
  airTemp = newAirTemp;
  if (airTemp < hiTemp && !isHeaterOn) {
     if (airTemp < lowTemp && !manualStop) {
        isHeaterOn = true;
     }
  }
  if (airTemp < lowTemp && !manualStop) {
     isHeaterOn = true;
  }
  if (airTemp > hiTemp ) {
     isHeaterOn = false;
  }
  pubHeaterStatus();
  pubAlert();
  pubAirTempStatus();
}

////////////////////////////////////////////////
function pubAlert() {
   widget = "anydata";
   id     = "7"
   var cfgAlert = {
     id     : id,
     page   : "Heating",
     pageId : 1,
     widget : widget,
     class1 : "item rounded text-center no-padding",
     class2 : "assertive-bg light",
     style2 : "font-size:20px;font-weight:bold",
     descr  : "FREEZE ALERT !!!",
     topic  : config.prefix + "/" + config.deviceID + "/" + widget + id
   };
   cfgNoAlert = {
     id     : id
   };
   if (airTemp <= 5) {
      if (airTemp < 0) airTemp = 0;
      if (lastAlert) {
          publishMessage(config.prefix + "/" + config.deviceID + "/config", JSON.stringify(cfgAlert),{ qos : 1 });
          logger.log("Pub Alert!")
          lastAlert = !lastAlert
      }
   } else {
      if (!lastAlert) {
          publishMessage(config.prefix + "/" + config.deviceID + "/config", JSON.stringify(cfgNoAlert),{ qos : 1 });
          logger.log("Pub no alert")
          lastAlert = !lastAlert
      }
   }
}
////////////////////////////////////////////////
function pubAirTempStatus() {
  var newStyle = {status: airTemp + "°C"};
  if(airTemp > hiTemp){
    newStyle.class3 = "assertive";
  }
  if(airTemp <= hiTemp && airTemp >= lowTemp){
    newStyle.class3 = "balanced";
  }
  if(airTemp < lowTemp){
    newStyle.class3 = "positive";
  }
  publishMessage( IoTManagerConfiguration[4].topic+"/status", JSON.stringify(newStyle));
}
////////////////////////////////////////////////
function pubControlTempStatus() {
  publishMessage( IoTManagerConfiguration[2].topic+"/status", JSON.stringify({ status: hiTemp }) );
}
////////////////////////////////////////////////
function pubControlLightingStatus() {
  var newStyle = {};
  if(lightingStatus){
    newStyle.widgetConfig = {
          fill: "#00FF99", // Lights On
        };
  } else {
    newStyle.widgetConfig = {
          fill: "#CC3300", // Lights Off
        };
  }
  publishMessage( IoTManagerConfiguration[7].topic + "/status", JSON.stringify(newStyle));
}
////////////////////////////////////////////////
function requestAirTemperature(){
  theAirTemperatureSensor.requestTemperature();
}
function switchHeaterPower(turnOn){
  if(turnOn){
    theHeater.turnOn();
  } else {
    theHeater.turnOff();
  }
}

function pubHeaterStatus( force ) {
  if (lastHeater !== isHeaterOn || force) {
    switchHeaterPower(isHeaterOn);
    var newStyle;
    var newStyle1;
    if (isHeaterOn) {
        newStyle = { status : "ON",  class3 : "assertive-bg light padding-left padding-right rounded" }
        newStyle1 = {
            descr  : "Turn heating off",
            class2 : "assertive",
            class3 : "button icon ion-checkmark-circled",
            widgetConfig : {
            fill        : "#FF5050",
            fillPressed : "#FF7070",
            disabled: 0
          }
        }
    } else {
        newStyle = { status : "OFF", class3 : "calm-bg light padding-left padding-right rounded" }
        newStyle1 = {
            descr  : "Heating is off",
            class2 : "calm",
            class3 : "button icon ion-close-circled",
            widgetConfig : {
             fill : "#AAAAAA",
             fillPressed: "#EEEEEE",
             disabled: 1
            }
        }
    }
    lastHeater = isHeaterOn;
    //publishMessage( IoTManagerConfiguration[5].topic + "/status", JSON.stringify(newStyle));
    publishMessage( IoTManagerConfiguration[5].topic + "/status", JSON.stringify(newStyle));
  }
}

function publishMessage(topic, message){
  client.publish(topic, message);
}

////////////////////////////////////////////////
// run main
logger.log('Start');
pubAlert();
