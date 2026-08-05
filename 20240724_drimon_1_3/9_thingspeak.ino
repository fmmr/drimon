#include <ThingSpeak.h>

void postThingSpeak(SensorData& data) {
  digitalWrite(BLUE_LED_PIN, HIGH);
  ThingSpeak.begin(client);
  Serial.println("Posting data to ThingSpeak...");
  int result = 0;
  bool anyPostOk = false;

  ThingSpeak.setField(1, data.temperature);
  ThingSpeak.setField(2, data.humidity);
  ThingSpeak.setField(3, data.rssi);
  ThingSpeak.setField(4, data.distance);
  ThingSpeak.setField(5, data.batteryVoltage);
  ThingSpeak.setField(6, data.batteryPercentage);
  ThingSpeak.setField(7, data.pressure);
  ThingSpeak.setField(8, data.lux);

  // Set the status
  ThingSpeak.setStatus(data.status);

  bool ch1Ok = false, ch2Ok = false, ch3Ok = false;

  Serial.println("  Thingspeak: Attempting to update ThingSpeak Channel 1...");
  result = ThingSpeak.writeFields(THINGSPEAK_1_CHANNEL, THINGSPEAK_1_API);
  if (result == 200) {
    Serial.println("  Thingspeak: Channel 1 update successful.");
    ch1Ok = true;
    anyPostOk = true;
  } else {
    Serial.println("  Thingspeak: Problem updating channel 1. HTTP error code " + String(result));
  }

  ThingSpeak.setField(1, data.bmeTemp);
  ThingSpeak.setField(2, data.ahtTemp);
  ThingSpeak.setField(3, data.termo1);
  ThingSpeak.setField(4, data.termo2);
  ThingSpeak.setField(5, data.termo3);
  ThingSpeak.setField(6, data.soil1);
  ThingSpeak.setField(7, data.soil2);
  ThingSpeak.setField(8, data.soil3);

  // Set the status
  ThingSpeak.setStatus(data.status);

  Serial.println("  Thingspeak: Attempting to update ThingSpeak Channel 2...");
  result = ThingSpeak.writeFields(THINGSPEAK_2_CHANNEL, THINGSPEAK_2_API);
  if (result == 200) {
    Serial.println("  Thingspeak: Channel 2 update successful.");
    ch2Ok = true;
    anyPostOk = true;
  } else {
    Serial.println("  Thingspeak: Problem updating channel 2. HTTP error code " + String(result));
  }


  ThingSpeak.setField(1, data.rssi);
  ThingSpeak.setField(2, data.batteryVoltage);
  ThingSpeak.setField(3, data.batteryPercentage);
  ThingSpeak.setField(4, data.timeUsed);
  ThingSpeak.setField(5, data.lux_int);
  // Set the status
  ThingSpeak.setStatus(data.status);

  Serial.println("  Thingspeak: Attempting to update ThingSpeak Channel 3...");
  result = ThingSpeak.writeFields(THINGSPEAK_3_CHANNEL, THINGSPEAK_3_API);
  if (result == 200) {
    Serial.println("  Thingspeak: Channel 3 update successful.");
    ch3Ok = true;
    anyPostOk = true;
  } else {
    Serial.println("  Thingspeak: Problem updating channel 3. HTTP error code " + String(result));
  }

  if (anyPostOk) {
    wifiFailStreak = 0;  // at least one channel persisted the pre-reset FC; safe to clear for next wake
  }

  digitalWrite(BLUE_LED_PIN, LOW);

  // Per-channel result: green for OK, red for FAIL, flashed in channel order (1, 2, 3)
  Serial.printf("  Thingspeak: results %s %s %s\n",
                ch1Ok ? "OK" : "FAIL", ch2Ok ? "OK" : "FAIL", ch3Ok ? "OK" : "FAIL");
  flashLED(ch1Ok ? GREEN_LED_PIN : RED_LED_PIN, 1);
  flashLED(ch2Ok ? GREEN_LED_PIN : RED_LED_PIN, 1);
  flashLED(ch3Ok ? GREEN_LED_PIN : RED_LED_PIN, 1);

  Serial.println("Done Posting data to ThingSpeak...");
}