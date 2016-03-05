function Heater(mqttClient, logger){
  this._mqttClient = mqttClient;
  this._isHeaterOn = false;
  this._logger = logger;
  this._powerTopic = "Office/Heating/Heater/power";
}

Heater.prototype.isHeaterOn = function(){
  return this._isHeaterOn;
}

Heater.prototype.turnOn = function(){
  this._logger.log("Heater is now On");
  this._mqttClient.publish(this._powerTopic, JSON.stringify(true));
}

Heater.prototype.turnOff = function(){
  this._logger.log("Heater is now Off");
  this._mqttClient.publish(this._powerTopic, JSON.stringify(false));
}

module.exports = Heater;
