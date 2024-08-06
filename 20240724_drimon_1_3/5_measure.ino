VL53L0X_RangingMeasurementData_t tofData;

String status(SensorData& data) {
  String stat = "";
  if (data.temperature < 14) stat = stat + "T-COLD";
  else if (data.temperature > 40) stat = stat + "T-HOT";
  else stat = stat + "T-OK";

  if (data.lux < 2) stat = stat + "_NIGHT";
  else if (data.lux < DUSK_LEVEL) stat = stat + "_DUSK";
  else if (data.lux < SHADE_LEVEL) stat = stat + "_SHADE";
  else stat = stat + "_SUN";

  if (data.distance < WINDOW_CLOSE) stat = stat + "_W-CLOSE";
  else stat = stat + "_W-OPEN";

  if (data.batteryPercentage < BATTERY_LOW) stat = stat + "_B-LOW";
  else stat = stat + "_B-OK";

  if (data.pressure < PRESSURE_LOW) stat = stat + "_P-LOW";
  else if (data.pressure > PRESSURE_HIGH) stat = stat + "_P-HIGH";
  else stat = stat + "_P-OK";

  return stat;
}

SensorData measure(long start) {
  SensorData data;

  float total_bmeTemp = 0.0;
  float total_bmeHumidity = 0.0;
  float total_ahtTemp = 0.0;
  float total_ahtHumidity = 0.0;
  float total_pressure = 0.0;
  float total_lux = 0.0;
  float total_lux_int = 0.0;
  float total_batteryVoltage = 0.0;
  float total_batteryPercentage = 0.0;
  int total_rssi = 0;
  int total_soil1 = 0;
  int total_soil2 = 0;
  int total_soil3 = 0;
  float total_termo1 = 0.0;
  float total_termo2 = 0.0;
  float total_termo3 = 0.0;

  if (TOF_OK) {
    int total_distance = 0;
    int count = 0;
    for (int i = 0; i < NUM_DISTANCE_READINGS; i++) {
      tof.rangingTest(&tofData, false);  // pass in 'true' to get debug data printout!
      int dist = tofData.RangeMilliMeter;
      if (dist > 0 && dist < 8000) {
        total_distance += tofData.RangeMilliMeter;
        count++;
      }
      delay(12);
    }
    if (count > 0) {
      data.distance = total_distance / count;
    }
  }
  for (int i = 0; i < NUM_READINGS; i++) {

    total_bmeTemp += bme.readTemperature();
    total_bmeHumidity += bme.readHumidity();
    total_pressure += (bme.readPressure() / 100.0F) + (12 * HEIGHT_ABOVE_SEE_LEVEL / 100.0);

    sensors_event_t ahtHumidity, ahtTemp;
    aht.getEvent(&ahtHumidity, &ahtTemp);
    total_ahtTemp += ahtTemp.temperature;
    total_ahtHumidity += ahtHumidity.relative_humidity;

    total_lux += lightMeter.readLightLevel();
    total_lux_int += lightMeter_int.readLightLevel();

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

  data.bmeTemp = total_bmeTemp / NUM_READINGS;
  data.bmeHumidity = total_bmeHumidity / NUM_READINGS;
  data.ahtTemp = total_ahtTemp / NUM_READINGS;
  data.ahtHumidity = total_ahtHumidity / NUM_READINGS;
  data.pressure = total_pressure / NUM_READINGS;
  data.lux = total_lux / NUM_READINGS;
  data.lux_int = total_lux_int / NUM_READINGS;

  data.soil1 = total_soil1 / NUM_READINGS;
  data.soil2 = total_soil2 / NUM_READINGS;
  data.soil3 = total_soil3 / NUM_READINGS;
  data.termo1 = total_termo1 / NUM_READINGS;
  data.termo2 = total_termo2 / NUM_READINGS;
  data.termo3 = total_termo3 / NUM_READINGS;

  data.batteryVoltage = total_batteryVoltage / NUM_READINGS;
  data.batteryPercentage = total_batteryPercentage / NUM_READINGS;

  if (data.termo2 > 0.0) {
    data.temperature = (2.0 * data.bmeTemp + data.ahtTemp + data.termo2) / 4.0;
  } else {
    data.temperature = (2.0 * data.bmeTemp + data.ahtTemp) / 3.0;
  }

  data.humidity = (2.0 * data.bmeHumidity + data.ahtHumidity) / 3.0;

  data.batteryPercentageInt = (int)data.batteryPercentage;
  data.luxInt = (int)data.lux;
  data.pressureInt = (int)data.pressure;

  data.rssi = total_rssi / NUM_READINGS;

  data.status = status(data);
  data.timeUsed = millis() - start;

  return data;
}