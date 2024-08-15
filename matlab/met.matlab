readChannelID = 2568299;
[data,timestamp] = thingSpeakRead(readChannelID,Fields=[1,2]);
temp = data(1);
hum = data(2);
hour_ago = datetime('now') - hours(1);

url = 'https://api.met.no/weatherapi/nowcast/2.0/complete?lat=59.532213&lon=10.418231';

targetString = 'details":{"air_temperature":';

writeChannelID = 2626867;
writeAPIKey = 'CHANGEME';

%% Scrape the webpage %%
% Read data from the URL and scrape the first numeric value after the 
% targetString
% {"air_temperature":18.4,"precipitation_rate":0.0,"relative_humidity":95.2,"wind_from_direction":170.6,"wind_speed":3.0,"wind_speed_of_gust":6.5}}
metData = urlfilter(url, targetString, 5);
metTemp = metData(1);
precipitation = metData(2);
metHum = metData(3);
wind = metData(5);
tempDiff = temp - metTemp;
humDiff = hum - metHum;
% analyzedData = data;
if metTemp > -30 && metTemp < 40 && timestamp > hour_ago
    % fprintf('hour_ago: %s\n', hour_ago);
    % fprintf('timestamp: %s\n', timestamp);
    thingSpeakWrite(writeChannelID,'Fields',[1,2,3,4,5,6],'Values',{metTemp, metHum, tempDiff, humDiff, wind, precipitation},'WriteKey',writeAPIKey)
end