readChannelID = 2568299;
[data,timestamp] = thingSpeakRead(readChannelID,Fields=[1,2]);
temp = data(1);
hum = data(2);
hour_ago = datetime('now') - hours(1);

url = 'https://api.met.no/weatherapi/nowcast/2.0/complete?lat=59.532213&lon=10.418231';

writeChannelID = 2626867;
writeAPIKey = 'CHANGEME';

%% Fetch MET.no nowcast as JSON and look up fields by name.
%% Positional extraction (previous urlfilter approach) broke twice as MET added
%% new fields (UV in July, apparent_air_temperature in Sept) — name lookup is
%% immune to future additions.
options = weboptions('UserAgent', 'drimon-scraper github.com/frodland/drimon fredrik@rodland.no', 'ContentType', 'json', 'Timeout', 30);
response = webread(url, options);
details = response.properties.timeseries(1).data.instant.details;

metTemp       = details.air_temperature;
metHum        = details.relative_humidity;
precipitation = details.precipitation_rate;
wind          = details.wind_speed;
uvIndex       = details.ultraviolet_index_clear_sky;
apparentTemp  = details.apparent_air_temperature;
tempDiff = temp - metTemp;
humDiff  = hum  - metHum;

%% Per-field plausibility gate — reject the whole write if anything is out of range.
sane = metTemp       > -30 && metTemp       <  40 && ...
       metHum        >=  0 && metHum        <= 100 && ...
       precipitation >=  0 && precipitation <  50  && ...
       wind          >=  0 && wind          <  60  && ...
       uvIndex       >=  0 && uvIndex       <  15  && ...
       apparentTemp  > -50 && apparentTemp  <  50  && ...
       timestamp > hour_ago;

if sane
    thingSpeakWrite(writeChannelID,'Fields',[1,2,3,4,5,6,7,8],'Values',{metTemp, metHum, tempDiff, humDiff, wind, precipitation, apparentTemp, uvIndex},'WriteKey',writeAPIKey)
end
