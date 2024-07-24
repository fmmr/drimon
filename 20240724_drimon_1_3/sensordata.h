struct SensorData {
  int distance;

  float bmeTemp;
  float bmeHumidity;
  float ahtTemp;
  float ahtHumidity;

  float pressure;
  float lux;

  int soil1;
  int soil2;
  int soil3;

  float termo1;
  float termo2;
  float termo3;

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