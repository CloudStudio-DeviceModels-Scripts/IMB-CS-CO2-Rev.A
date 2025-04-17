function getConfiguration(config)
{
  config.addressLabel = {en: "DevEUI", es: "DevEUI"};
}

function getEndpoints(deviceAddress, endpoints)
{
  endpoints.addEndpoint("1", "Temperature sensor", endpointType.temperatureSensor);
  endpoints.addEndpoint("2", "Humidity sensor", endpointType.humiditySensor);
  endpoints.addEndpoint("3", "CO₂ sensor", endpointType.ppmConcentrationSensor, ppmConcentrationSensorSubType.carbonDioxide);
  endpoints.addEndpoint("4", "Presence sensor", endpointType.iasSensor, iasEndpointSubType.presenceSensor);
}

function validateDeviceAddress(address, result)
{
  if (address.length != 16) {
    result.ok = false;
    result.errorMessage = {
      en: "The address must be 16 characters long", 
      es: "La dirección debe tener exactamente 16 caracteres"
    };
  }
}

function updateDeviceUIRules(device, rules)
{
  rules.canCreateEndpoints = false;
}

function updateEndpointUIRules(endpoint, rules)
{
  // This function allows you to specify UI rules at the endpoint level.
  // For instance, you can make it possible to delete certain endpoints, 
  // or edit their endpoint subtype, if applicable.
  rules.canDelete = false;
  rules.canEditSubType = false;
}
