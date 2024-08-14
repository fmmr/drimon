struct SensorData {
  int distance;

  float bmeTemp;
  float bmeHumidity;
  float ahtTemp;
  float ahtHumidity;

  float pressure;
  float lux;
  float lux_int;

  int soil1;
  int soil2;
  int soil3;

  float termo1;
  float termo2;
  float termo3;

  float soilTerm;

  int rssi;

  float batteryVoltage;
  float batteryPercentage;

  int batteryPercentageInt;
  int pressureInt;
  int luxInt;

  float temperature;
  float humidity;

  float metTemp;
  float metHumidity;
  float tempDiff;
  float humidityDiff;

  String status;
  long timeUsed;
};