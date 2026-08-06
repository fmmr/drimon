#include <ThingSpeak.h>
#include <functional>

// Codes worth retrying — transient network/TCP conditions the ThingSpeak lib returns when a POST didn't
// cleanly complete. HTTP-shaped errors (200 = OK, 4xx/5xx = real API failure) are NOT retried.
static bool isTransientPostError(int code) {
  return code == 0 || code == -301 || code == -302 || code == -303 || code == -304;
}

// Attempt one channel POST with retry on transient errors. The setFields callable is invoked before
// EVERY attempt because ThingSpeak.writeFields() clears its internal field buffer on both success and
// failure paths (see resetWriteFields() call inside writeFields/abortWriteRaw in the library).
static int postChannel(unsigned long chId, const char* apiKey, int chNum, const String& status,
                       std::function<void()> setFields, uint8_t& retryCount) {
  retryCount = 0;
  int result;
  while (true) {
    setFields();
    ThingSpeak.setStatus(status);
    Serial.printf("  Thingspeak: Channel %d attempt %u of %u...\n", chNum, retryCount + 1, MAX_POST_RETRY + 1);
    result = ThingSpeak.writeFields(chId, apiKey);
    if (result == 200 || retryCount >= MAX_POST_RETRY || !isTransientPostError(result)) break;
    Serial.printf("  Thingspeak: Ch%d got %d — retrying after %d ms\n", chNum, result, POST_RETRY_DELAY_MS);
    client.stop();
    delay(POST_RETRY_DELAY_MS);
    retryCount++;
  }
  if (result == 200) Serial.printf("  Thingspeak: Channel %d update successful.\n", chNum);
  else Serial.printf("  Thingspeak: Problem updating channel %d. HTTP error code %d\n", chNum, result);
  return result;
}

void postThingSpeak(SensorData& data) {
  digitalWrite(BLUE_LED_PIN, HIGH);
  ThingSpeak.begin(client);
  Serial.println("Posting data to ThingSpeak...");
  bool anyPostOk = false;
  bool chOk[3] = {false, false, false};

  lastPostResults[0] = postChannel(THINGSPEAK_1_CHANNEL, THINGSPEAK_1_API, 1, data.status, [&]() {
    ThingSpeak.setField(1, data.temperature);
    ThingSpeak.setField(2, data.humidity);
    ThingSpeak.setField(3, data.rssi);
    ThingSpeak.setField(4, data.distance);
    ThingSpeak.setField(5, data.batteryVoltage);
    ThingSpeak.setField(6, data.batteryPercentage);
    ThingSpeak.setField(7, data.pressure);
    ThingSpeak.setField(8, data.lux);
  }, postRetryCounts[0]);
  if (lastPostResults[0] == 200) { chOk[0] = true; anyPostOk = true; }

  client.stop();
  delay(THINGSPEAK_INTER_POST_MS);

  lastPostResults[1] = postChannel(THINGSPEAK_2_CHANNEL, THINGSPEAK_2_API, 2, data.status, [&]() {
    ThingSpeak.setField(1, data.bmeTemp);
    ThingSpeak.setField(2, data.ahtTemp);
    ThingSpeak.setField(3, data.termo1);
    ThingSpeak.setField(4, data.termo2);
    ThingSpeak.setField(5, data.termo3);
    ThingSpeak.setField(6, data.soil1);
    ThingSpeak.setField(7, data.soil2);
    ThingSpeak.setField(8, data.soil3);
  }, postRetryCounts[1]);
  if (lastPostResults[1] == 200) { chOk[1] = true; anyPostOk = true; }

  client.stop();
  delay(THINGSPEAK_INTER_POST_MS);

  lastPostResults[2] = postChannel(THINGSPEAK_3_CHANNEL, THINGSPEAK_3_API, 3, data.status, [&]() {
    ThingSpeak.setField(1, data.rssi);
    ThingSpeak.setField(2, data.batteryVoltage);
    ThingSpeak.setField(3, data.batteryPercentage);
    ThingSpeak.setField(4, data.timeUsed);
    ThingSpeak.setField(5, data.lux_int);
  }, postRetryCounts[2]);
  if (lastPostResults[2] == 200) { chOk[2] = true; anyPostOk = true; }

  if (anyPostOk) {
    wifiFailStreak = 0;   // at least one channel persisted the pre-reset FC; safe to clear for next wake
    postFailStreak = 0;   // same idea for PF: a live post got through, clear the silent-post-fail streak
  } else {
    // WiFi was OK (we got here) but every POST failed → silent wake, nothing written to ThingSpeak
    if (postFailStreak != UINT16_MAX) postFailStreak++;
  }

  digitalWrite(BLUE_LED_PIN, LOW);

  // Per-channel result: green for OK, red for FAIL, flashed in channel order (1, 2, 3)
  Serial.printf("  Thingspeak: results %s %s %s (retries %u %u %u)\n",
                chOk[0] ? "OK" : "FAIL", chOk[1] ? "OK" : "FAIL", chOk[2] ? "OK" : "FAIL",
                postRetryCounts[0], postRetryCounts[1], postRetryCounts[2]);
  for (int i = 0; i < 3; i++) flashLED(chOk[i] ? GREEN_LED_PIN : RED_LED_PIN, 1, POST_FLASH_ON_MS);

  Serial.println("Done Posting data to ThingSpeak...");
}
