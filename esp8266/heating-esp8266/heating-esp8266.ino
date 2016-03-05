#include <PubSubClient.h>
#include <ESP8266WiFi.h>
#include <OneWire.h>
#include <DallasTemperature.h>

//////////////////////////Added toggling led with any topic publish "1"  /////

const char* ssid = "XXXX";
const char* password = "XXXX";
const char* mqtt_username = "XXXX";
const char* mqtt_password = "XXXX";
const char* mqtt_clientId = "arduinoClient";

char const* topic = "Office/Heating/#";     //  using wildcard to monitor all traffic from mqtt server
char const* heater_control_topic = "Office/Heating/Heater/power";
char const* sensor_status_topic = "Office/Heating/Sensor/status";
char const* temp_report_topic = "Office/Heating/temperature";
char const* temp_request_topic = "Office/Heating/temperature/request";
char const* server = "noboxcloud.cloudapp.net";  // Address of my server on my network, substitute yours!

char message_buff[100];   // initialise storage buffer (i haven't tested to this capacity.)
float oldTemp;
long lastReconnectAttempt = 0;

#define ONE_WIRE_BUS 2  // DS18B20 on GPIO2
#define SSR_PIN 0 // Solid State Relay on GPIO0

#define DEBUG;

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature DS18B20(&oneWire);

WiFiClient wifiClient;
PubSubClient client(server, 9090, callback, wifiClient);

void setup() {
  Serial.begin(115200);
  delay(10);
  oldTemp = -1;

    // prepare GPIO2 *********************************************************************
  pinMode(SSR_PIN, OUTPUT);   // i am using gpio2 as output to toggle an LED
  digitalWrite(SSR_PIN, 0);  //*****************************************************************

  printLineToSerial("");
  printLineToSerial("");
  printToSerial("Connecting to ", false);
  printLineToSerial(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    printToSerial(".", false);
  }
  printLineToSerial("");
  printLineToSerial("WiFi connected");
  printLineToSerial("IP address: ");
  Serial.print(WiFi.localIP());

  //  connection to broker script.
  initiateMQTTConnection();
}

void loop() {
  float temp;
  do {
    temp = getCurrentTemperature();
  } while (temp == 85.0 || temp == (-127.0));

  if(!areWeConnectedToTheMQTTServer()){
    long now = millis();
    if(now - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = now;
      if(reconnect()){
        lastReconnectAttempt = 0;
      }
    }
  } else {
    if ((int)temp != (int)oldTemp)
    {
      publishTemperature(temp);
      oldTemp = temp;
    }
    client.loop();
  }
}

float getCurrentTemperature(){
  DS18B20.requestTemperatures();
  float temp = DS18B20.getTempCByIndex(0);
    printToSerial("Temperature: ", false);
    printLineToSerial(temp);
  return temp;
}

void publishTemperature(float temp){
  char tempAsChar[5];
  dtostrf(temp,5, 2, tempAsChar);
  if(!publishMessage(temp_report_topic, tempAsChar)){
    printLineToSerial("Failed to publish temperature to MQTT server");
  }
}

void displayMQTTMessageOnSerial(char* localTopic, String msg, unsigned int payloadLength){
    printLineToSerial("Message arrived:  topic: " + String(localTopic));
    printLineToSerial("Length: " + String(payloadLength,DEC));
    printLineToSerial("Payload: " + msg);
}

String getMessageFromPayload(byte* payload, unsigned int payloadLength){
  // create character buffer with ending null terminator (string)
  int i = 0;
  for(i=0; i<payloadLength; i++) {
    message_buff[i] = payload[i];
  }
  message_buff[i] = '\0';

  return String(message_buff);
}

void setSSRState(int value){
  digitalWrite(SSR_PIN, value);
    if(value == 1){
      printLineToSerial("Switching SSR On");
    } else {
      printLineToSerial("Switching SSR Off");
    }
}

int getSSRState(){
  return digitalRead(SSR_PIN);
}

void callback(char* localTopic, byte* payload, unsigned int payloadLength) {

  String msgString = getMessageFromPayload(payload, payloadLength);

  if (msgString == "true" && strcmp(localTopic, heater_control_topic) == 0){    // if there is a "1" published to any topic (#) on the broker then:
    displayMQTTMessageOnSerial(localTopic, msgString, payloadLength);
    setSSRState(1);
  }
  if (msgString == "false" && strcmp(localTopic, heater_control_topic) == 0){    // if there is a "1" published to any topic (#) on the broker then:
    displayMQTTMessageOnSerial(localTopic, msgString, payloadLength);
    setSSRState(0);
  }
  if (msgString == "Toggle" && strcmp(localTopic, heater_control_topic) == 0){    // if there is a "1" published to any topic (#) on the broker then:
    displayMQTTMessageOnSerial(localTopic, msgString, payloadLength);
    setSSRState(!getSSRState());
  }
  if(strcmp(localTopic, temp_request_topic) == 0){
    publishTemperature(getCurrentTemperature());
  }
}

boolean initiateMQTTConnection(){
  if (connectToMQTTServer()) {
    publishOnlineMessage();
    subscribeToRequiredTopics();
    return true;
  } else {
    return false;
  }
}

boolean connectToMQTTServer(){
  return client.connect(mqtt_clientId, mqtt_username, mqtt_password);
}

void publishOnlineMessage(){
  publishMessage(sensor_status_topic,"Online");
}

boolean publishMessage(const char* topic, const char* payload){
  if(!areWeConnectedToTheMQTTServer()){
    reconnect();
  }
  return client.publish(topic, payload);
}

void subscribeToRequiredTopics(){
  client.subscribe(topic);
}

boolean areWeConnectedToTheMQTTServer(){
  return client.connected();
}

void printLineToSerial(const char* message){
  printToSerial(message, true);
}

void printLineToSerial(float value){
  #ifdef DEBUG
    Serial.println(value);
  #endif
}

void printLineToSerial(String message){
  #ifdef DEBUG
    Serial.println(message);
  #endif
}

void printToSerial(const char* message, boolean newLine){
  #ifdef DEBUG
  if(newLine){
    Serial.println(message);
  } else {
    Serial.print(message);
  }
  #endif
}

void printToSerial(int value, boolean newLine){
  #ifdef DEBUG
  if(newLine){
    Serial.println(value);
  } else {
    Serial.print(value);
  }
  #endif
}

boolean reconnect() {
  // Loop until we're reconnected
  printLineToSerial("Attempting MQTT connection...");
  // Attempt to connect
  if(initiateMQTTConnection()){
    printLineToSerial("Connected");
    return true;
  } else {
    printLineToSerial("failed, rc=");
    printToSerial(client.state(), false);
    return false;
  }
}
