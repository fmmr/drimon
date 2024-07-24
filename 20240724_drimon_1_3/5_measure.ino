String status(SensorData& data) {
  return "OK";
}

SensorData measure(long start) {
  SensorData data;

  float total_bmeTemp = 0.0;
  float total_bmeHumidity = 0.0;
  float total_ahtTemp = 0.0;
  float total_ahtHumidity = 0.0;
  float total_pressure = 0.0;
  float total_lux = 0.0;
  float total_batteryVoltage = 0.0;
  float total_batteryPercentage = 0.0;
  int total_rssi = 0;

  for (int i = 0; i < NUM_READINGS; i++) {
    total_bmeTemp += bme.readTemperature();
    total_bmeHumidity += bme.readHumidity();
    total_pressure += (bme.readPressure() / 100.0F) + (12 * HEIGHT_ABOVE_SEE_LEVEL / 100.0);

    sensors_event_t ahtHumidity, ahtTemp;
    aht.getEvent(&ahtHumidity, &ahtTemp);
    total_ahtTemp += ahtTemp.temperature;
    total_ahtHumidity += ahtHumidity.relative_humidity;

    total_lux += lightMeter.readLightLevel();

    total_batteryVoltage += batteryMonitor.readVoltage() / 1000.0;
    total_batteryPercentage += batteryMonitor.readPercentage();
    total_rssi += WiFi.RSSI();

    delay(SLEEP_BETWEEN_READINGS);  // Short delay between readings
  }

  data.bmeTemp = total_bmeTemp / NUM_READINGS;
  data.bmeHumidity = total_bmeHumidity / NUM_READINGS;
  data.ahtTemp = total_ahtTemp / NUM_READINGS;
  data.ahtHumidity = total_ahtHumidity / NUM_READINGS;
  data.pressure = total_pressure / NUM_READINGS;
  data.lux = total_lux / NUM_READINGS;

  data.batteryVoltage = total_batteryVoltage / NUM_READINGS;
  data.batteryPercentage = total_batteryPercentage / NUM_READINGS;

  data.temperature = (2.0 * data.bmeTemp + data.ahtTemp) / 3.0;
  data.humidity = (2.0 * data.bmeHumidity + data.ahtHumidity) / 3.0;

  data.batteryPercentageInt = (int)data.batteryPercentage;
  data.luxInt = (int)data.lux;
  data.pressureInt = (int)data.pressure;

  data.rssi = total_rssi / NUM_READINGS;

  data.status = status(data);
  data.timeUsed = millis() - start;

  return data;
}