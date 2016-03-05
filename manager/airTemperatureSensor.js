function AirTemperatureSensor(mqttClient, logger, newTemperatureCallback){
  this._mqttClient = mqttClient;
  this._logger = logger;
  this._requestTopic = "Office/Heating/temperature/request";
  this._replyTopic = "Office/Heating/temperature";
  this._replyCallback = newTemperatureCallback;
  this._lastTemperature = 0;
  this._mqttClient.subscribe(this._replyTopic, { qos: 1});
  this._mqttClient.on('message', this._handleMqttMessage.bind(this));
}

AirTemperatureSensor.prototype._handleMqttMessage = function(topic, message){
  if(topic == this._replyTopic){
    var airTempFromSensor = parseInt(message.toString());
    this._lastTemperature = airTempFromSensor;
    if(typeof this._replyCallback == 'function'){
      this._replyCallback(airTempFromSensor);
    }
  }
}

AirTemperatureSensor.prototype.lastTemperature = function(callback){
  return this._lastTemperature;
}

AirTemperatureSensor.prototype.requestTemperature = function(){
  this._logger.log("Air Temperature requested from sensor");
  this._mqttClient.publish(this._requestTopic, "");
}

module.exports = AirTemperatureSensor;
