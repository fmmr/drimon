#include <ThingSpeak.h>

WiFiClient client;
void postThingSpeak(SensorData& data) {
  ThingSpeak.begin(client);
  Serial.println("Posting data to ThingSpeak...");
  digitalWrite(BLUE_LED_PIN, HIGH);
  int result = 0;

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

  Serial.println("  Attempting to update ThingSpeak Channel 1...");
  result = ThingSpeak.writeFields(THINGSPEAK_1_CHANNEL, THINGSPEAK_1_API);
  if (result == 200) {
    Serial.println("  Channel 1 update successful.");
  } else {
    Serial.println("Problem updating channel . HTTP error code " + String(result));
    flashLED(RED_LED_PIN, 1);
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

  Serial.println("  Attempting to update ThingSpeak Channel 2...");
  result = ThingSpeak.writeFields(THINGSPEAK_2_CHANNEL, THINGSPEAK_2_API);
  if (result == 200) {
    Serial.println("  Channel 2 update successful.");
  } else {
    Serial.println("Problem updating channel. HTTP error code " + String(result));
    flashLED(RED_LED_PIN, 2);
  }


  ThingSpeak.setField(1, data.rssi);
  ThingSpeak.setField(2, data.batteryVoltage);
  ThingSpeak.setField(3, data.batteryPercentage);
  ThingSpeak.setField(4, data.timeUsed);

  // Set the status
  ThingSpeak.setStatus(data.status);

  Serial.println("  Attempting to update ThingSpeak Channel 3...");
  result = ThingSpeak.writeFields(THINGSPEAK_3_CHANNEL, THINGSPEAK_3_API);
  if (result == 200) {
    Serial.println("  Channel 3 update successful.");
  } else {
    Serial.println("Problem updating channel 3. HTTP error code " + String(result));
    flashLED(RED_LED_PIN, 3);
  }

  digitalWrite(BLUE_LED_PIN, LOW);
  Serial.println("Done Posting data to ThingSpeak...");
}