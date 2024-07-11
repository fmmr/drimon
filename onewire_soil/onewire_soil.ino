// Include the libraries we need
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>


// Data wire is plugged into port 2 on the Arduino
#define ONE_WIRE_BUS 23

#define soil1 34
#define soil2 36
#define soil3 39

// Setup a oneWire instance to communicate with any OneWire devices (not just Maxim/Dallas temperature ICs)
OneWire oneWire(ONE_WIRE_BUS);

// Pass our oneWire reference to Dallas Temperature.
DallasTemperature sensors(&oneWire);

// arrays to hold device address
DeviceAddress termo1 = { 0x28, 0xAD, 0x1B, 0x46, 0xD4, 0x4D, 0x17, 0x66 };  // closest
DeviceAddress termo2 = { 0x28, 0x0E, 0xE5, 0x6A, 0x00, 0x00, 0x00, 0x8E };  // middle
DeviceAddress termo3 = { 0x28, 0xBE, 0x62, 0x6B, 0x00, 0x00, 0x00, 0x9C };  // farthest

/*
 * Setup function. Here we do the basics
 */
void setup(void) {
  Serial.begin(115200);


  Serial.println("Dallas Temperature IC Control Library Demo");

  // locate devices on the bus
  Serial.print("Locating devices...");
  sensors.begin();
  Serial.print("Found ");
  Serial.print(sensors.getDeviceCount(), DEC);
  Serial.println(" devices.");

  // show the addresses we found on the bus
  Serial.print("termo1 Address: ");
  printAddress(termo1);
  Serial.println();

  Serial.print("termo2 Address: ");
  printAddress(termo2);
  Serial.println();

  Serial.println("termo3 Address: ");
  printAddress(termo3);
  Serial.println();

  // set the resolution to 9 bit (Each Dallas/Maxim device is capable of several different resolutions)
  sensors.setResolution(termo1, 10);
  sensors.setResolution(termo2, 10);
  sensors.setResolution(termo3, 10);

  Serial.print("Device 0 Resolution: ");
  Serial.print(sensors.getResolution(termo1), DEC);
  Serial.println();
}

// function to print the temperature for a device
void printTemperature(DeviceAddress deviceAddress) {
  // method 1 - slower
  //Serial.print("Temp C: ");
  //Serial.print(sensors.getTempC(deviceAddress));
  //Serial.print(" Temp F: ");
  //Serial.print(sensors.getTempF(deviceAddress)); // Makes a second call to getTempC and then converts to Fahrenheit

  // method 2 - faster
  float tempC = sensors.getTempC(deviceAddress);
  if (tempC == DEVICE_DISCONNECTED_C) {
    Serial.println("Error: Could not read temperature data");
    return;
  }
  Serial.println(tempC,2);
}
/*
 * Main function. It will request the tempC from the sensors and display on Serial.
 */
void loop(void) {
  Serial.println("Add Vcc");
  delay(3000);


  // call sensors.requestTemperatures() to issue a global temperature
  // request to all devices on the bus
  Serial.print("Requesting temperatures...");
  sensors.requestTemperatures();  // Send the command to get temperatures
  Serial.println("DONE");

  // It responds almost immediately. Let's print out the data
  Serial.print("Temp termo1 C: ");
  printTemperature(termo1);  // Use a simple function to print out the data
  Serial.print("Temp termo2 C: ");
  printTemperature(termo2);  // Use a simple function to print out the data
  Serial.print("Temp termo3 C: ");
  printTemperature(termo3);  // Use a simple function to print out the data

  Serial.println();


  int s1 = analogRead(soil1);
  int s2 = analogRead(soil2);
  int s3 = analogRead(soil3);

  int m1 = map(s1, 2559, 728, 0, 100);
  int m2 = map(s2, 2653, 946, 0, 100);
  int m3 = map(s3, 2559, 728, 0, 100);

  Serial.print("soil1: ");
  Serial.print(s1);
  Serial.print("   ");
  Serial.println(m1);

  Serial.print("soil2: ");
  Serial.print(s2);
  Serial.print("   ");
  Serial.println(m2);

  Serial.print("soil3: ");
  Serial.print(s3);
  Serial.print("   ");
  Serial.println(m3);

  Serial.println("remove Vcc");
  delay(2000);
}

// function to print a device address
void printAddress(DeviceAddress deviceAddress) {
  for (uint8_t i = 0; i < 8; i++) {
    if (deviceAddress[i] < 16) Serial.print("0");
    Serial.print(deviceAddress[i], HEX);
  }
}
