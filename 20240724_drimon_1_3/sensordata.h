struct SensorData {
  float bmeTemp;
  float bmeHumidity;
  float ahtTemp;
  float ahtHumidity;

  float pressure;
  float lux;

  float temp1w1;
  float temp1w2;
  float temp1w3;

  int soil1;
  int soil2;
  int soil3;

  int rssi;

  float batteryVoltage;
  float batteryPercentage;

  int batteryPercentageInt;
  int pressureInt;
  int luxInt;

  float temperature;
  float humidity;

  String status;
  long timeUsed;
};