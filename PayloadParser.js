function readInt8(payload, index)
{
    var int8 = payload[index];

    if(int8 & 0x80){
        int8 = - (0x100 - int8);
    }

    return int8;
}

function readUInt16BE(payload, index)
{
    return (payload[index] << 8) + payload[++index];
}

function toHEXString(payload, index, length)
{
    var HEXString = '';

    for(var i = 0; i < length; i++){
        if(payload[index + i] < 16){
            HEXString = HEXString + '0';
        }
        HEXString = HEXString + payload[index + i].toString(16);
    }

    return HEXString;
}

function parseComfortSensor(payload, portDecoding)
{
    var payload_variant = payload[1];

    var deviceData = {
        //received_at: new Date().toISOString(),        //Not supported on TTN
        device_type_identifier: payload[0],
        device_type: 'Comfort Sensor CO2',
        device_type_variant: payload[1],
        device_id: toHEXString(payload, 2, 6),
        battery_voltage: readUInt16BE(payload, 9) / 100,
        rssi: readInt8(payload, 11)
    };

    switch(payload_variant){
        case 1:     //NB-IoT Payload
            if(payload.length != 19) return {};
            deviceData.temperature = readInt16BE(payload, payload.length - 7) / 100;
            deviceData.humidity = readUInt16BE(payload, payload.length - 5) / 100;
            deviceData.presence = payload[payload.length - 1];
            deviceData.co2 = readUInt16BE(payload, payload.length - 3);
            return deviceData;
        case 2:     //NB-IoT Payload
            if(payload.length != 25) return {};
            // var datetime = Date.UTC(
            //     unbcd(payload[12] * 100 + unbcd(payload[13])),
            //     unbcd(payload[14] - 1),
            //     unbcd(payload[15]),
            //     unbcd(payload[16]),
            //     unbcd(payload[17]),
            //     unbcd(payload[18]),
            //     0
            // );
            // deviceData.datetime = datetime.toISOString();        //Not supported on TTN
            deviceData.temperature = readInt16BE(payload, payload.length - 7) / 100;
            deviceData.humidity = readUInt16BE(payload, payload.length - 5) / 100;
            deviceData.presence = payload[payload.length - 1];
            deviceData.co2 = readUInt16BE(payload, payload.length - 3);
            return deviceData;
        case 3:
            if(payload.length != 20) return {};
            deviceData.device_id = toHEXString(payload, 2, 8);
            deviceData.device_status = payload[10];
            deviceData.battery_voltage = readUInt16BE(payload, 11) / 100;
            delete deviceData.rssi;
            deviceData.temperature = readUInt16BE(payload, payload.length - 7) / 100;
            deviceData.humidity = readUInt16BE(payload, payload.length - 5) / 100;
            deviceData.presence = payload[payload.length - 1];
            deviceData.co2 = readUInt16BE(payload, payload.length - 3);
            //deviceData.pressure = readUInt16BE(payload , 20);
            //deviceData.ligth = //To be implemented
            return deviceData;
    }

    return {};
}

function parseUplink(device, payload)
{
	var bytes = payload.asBytes();

    var port = payload.port;
    var data = parseComfortSensor(bytes, port);
    // env.log('Parsed data: ', JSON.stringify(data));
    // env.log('Parsed data: ', data.battery_voltage);

	// Parse and store temperature
	var temperatureSensor = device.endpoints.byType(endpointType.temperatureSensor);
	if (temperatureSensor != null)
		temperatureSensor.updateTemperatureSensorStatus(data.temperature);

	// Parse and store humidity
	var humiditySensor = device.endpoints.byType(endpointType.humiditySensor);
	if (humiditySensor != null)
		humiditySensor.updateHumiditySensorStatus(data.humidity);
	
	// Parse and store CO2
	var co2Sensor = device.endpoints.byType(endpointType.ppmConcentrationSensor, ppmConcentrationSensorSubType.carbonDioxide);
	if (co2Sensor != null)
		co2Sensor.updatePpmConcentrationSensorStatus(data.co2);

	// Parse and store presence
	var presenceSensor = device.endpoints.byType(endpointType.iasSensor, iasEndpointSubType.presenceSensor);
	if (presenceSensor != null)
		presenceSensor.updateIASSensorStatus(data.presence == 1 ? iasSensorState.active : iasSensorState.idle);

	// Parse and store battery voltage
	device.updateDeviceBattery({ voltage: data.battery_voltage });
}

function buildDownlink(device, endpoint, command, payload) 
{ 
	// This function allows you to convert a command from the platform 
	// into a payload to be sent to the device.
	// Learn more at https://wiki.cloud.studio/page/200

	// The parameters in this function are:
	// - device: object representing the device to which the command will
	//   be sent. 
	// - endpoint: endpoint object representing the endpoint to which the 
	//   command will be sent. May be null if the command is to be sent to 
	//   the device, and not to an individual endpoint within the device.
	// - command: object containing the command that needs to be sent. More
	//   information at https://wiki.cloud.studio/page/1195.

	// This example is written assuming a device that contains a single endpoint, 
	// of type appliance, that can be turned on, off, and toggled. 
	// It is assumed that a single byte must be sent in the payload, 
	// which indicates the type of operation.

/*
	 payload.port = 25; 	 	 // This device receives commands on LoRaWAN port 25 
	 payload.buildResult = downlinkBuildResult.ok; 

	 switch (command.type) { 
	 	 case commandType.onOff: 
	 	 	 switch (command.onOff.type) { 
	 	 	 	 case onOffCommandType.turnOn: 
	 	 	 	 	 payload.setAsBytes([30]); 	 	 // Command ID 30 is "turn on" 
	 	 	 	 	 break; 
	 	 	 	 case onOffCommandType.turnOff: 
	 	 	 	 	 payload.setAsBytes([31]); 	 	 // Command ID 31 is "turn off" 
	 	 	 	 	 break; 
	 	 	 	 case onOffCommandType.toggle: 
	 	 	 	 	 payload.setAsBytes([32]); 	 	 // Command ID 32 is "toggle" 
	 	 	 	 	 break; 
	 	 	 	 default: 
	 	 	 	 	 payload.buildResult = downlinkBuildResult.unsupported; 
	 	 	 	 	 break; 
	 	 	 } 
	 	 	 break; 
	 	 default: 
	 	 	 payload.buildResult = downlinkBuildResult.unsupported; 
	 	 	 break; 
	 }
*/

}