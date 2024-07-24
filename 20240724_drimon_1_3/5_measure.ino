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
  int total_soil1 = 0;
  int total_soil2 = 0;
  int total_soil3 = 0;
  float total_termo1 = 0.0;
  float total_termo2 = 0.0;
  float total_termo3 = 0.0;
  int total_distance = 0;

  for (int i = 0; i < NUM_READINGS; i++) {
    tof.rangingTest(&tofData, false);  // pass in 'true' to get debug data printout!
    total_distance += tofData.RangeMilliMeter;

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

    int t1 = analogRead(SOIL_1_PIN);
    int t2 = analogRead(SOIL_2_PIN);
    int t3 = analogRead(SOIL_3_PIN);
    total_soil1 += constrain(map(t1, 2690, 776, 0, 100), 0, 100);
    total_soil2 += constrain(map(t2, 2768, 994, 0, 100), 0, 100);
    total_soil3 += constrain(map(t3, 2600, 1009, 0, 100), 0, 100);

    sensors.requestTemperatures();  // Send the command to get temperatures
    total_termo1 += sensors.getTempC(termo1);
    total_termo2 += sensors.getTempC(termo2);
    total_termo3 += sensors.getTempC(termo3);

    delay(SLEEP_BETWEEN_READINGS);  // Short delay between readings
  }

  data.distance = total_distance / NUM_READINGS;
  data.bmeTemp = total_bmeTemp / NUM_READINGS;
  data.bmeHumidity = total_bmeHumidity / NUM_READINGS;
  data.ahtTemp = total_ahtTemp / NUM_READINGS;
  data.ahtHumidity = total_ahtHumidity / NUM_READINGS;
  data.pressure = total_pressure / NUM_READINGS;
  data.lux = total_lux / NUM_READINGS;
  data.soil1 = total_soil1 / NUM_READINGS;
  data.soil2 = total_soil2 / NUM_READINGS;
  data.soil3 = total_soil3 / NUM_READINGS;
  data.termo1 = total_termo1 / NUM_READINGS;
  data.termo2 = total_termo2 / NUM_READINGS;
  data.termo3 = total_termo3 / NUM_READINGS;

  data.batteryVoltage = total_batteryVoltage / NUM_READINGS;
  data.batteryPercentage = total_batteryPercentage / NUM_READINGS;




  data.temperature = (2.0 * data.bmeTemp + data.ahtTemp + data.termo2) / 4.0;
  data.humidity = (2.0 * data.bmeHumidity + data.ahtHumidity) / 3.0;

  data.batteryPercentageInt = (int)data.batteryPercentage;
  data.luxInt = (int)data.lux;
  data.pressureInt = (int)data.pressure;

  data.rssi = total_rssi / NUM_READINGS;

  data.status = status(data);
  data.timeUsed = millis() - start;

  return data;
}