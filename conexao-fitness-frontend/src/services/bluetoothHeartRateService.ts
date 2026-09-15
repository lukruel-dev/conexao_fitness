/**
 * Serviço de Conexão com Monitores Cardíacos e Relógios via Web Bluetooth API
 * Padrão GATT Heart Rate Service (UUID 0x180D) e Characteristic (UUID 0x2A37)
 */

export interface BluetoothHeartRateDevice {
  id: string;
  name: string;
  connected: boolean;
}

export type HeartRateCallback = (bpm: number) => void;
export type DisconnectCallback = () => void;

let activeDevice: any = null;
let activeServer: any = null;
let activeCharacteristic: any = null;

/**
 * Verifica se o navegador atual suporta a Web Bluetooth API
 */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Decodifica o valor de batimento cardíaco da característica BLE Heart Rate Measurement
 */
export function parseHeartRate(dataView: DataView): number {
  if (!dataView || dataView.byteLength < 2) return 0;
  const flags = dataView.getUint8(0);
  const is16Bit = (flags & 0x01) !== 0;

  if (is16Bit && dataView.byteLength >= 3) {
    return dataView.getUint16(1, /* littleEndian = */ true);
  }
  return dataView.getUint8(1);
}

/**
 * Solicita pareamento com sensor cardíaco Bluetooth Low Energy (BLE)
 */
export async function connectBluetoothHeartRate(
  onHeartRate: HeartRateCallback,
  onDisconnect?: DisconnectCallback
): Promise<BluetoothHeartRateDevice> {
  if (!isWebBluetoothSupported()) {
    throw new Error('A Web Bluetooth API não é suportada neste navegador. Recomendamos o Google Chrome ou Edge.');
  }

  try {
    // Desconecta dispositivo anterior se houver
    disconnectBluetoothHeartRate();

    const nav = navigator as any;
    const device = await nav.bluetooth.requestDevice({
      filters: [
        { services: ['heart_rate'] },
      ],
      optionalServices: ['battery_service', 0x180d],
    });

    if (!device) {
      throw new Error('Nenhum dispositivo selecionado.');
    }

    activeDevice = device;

    device.addEventListener('gattserverdisconnected', () => {
      activeDevice = null;
      activeServer = null;
      activeCharacteristic = null;
      if (onDisconnect) onDisconnect();
    });

    const server = await device.gatt.connect();
    activeServer = server;

    const service = await server.getPrimaryService('heart_rate');
    const characteristic = await service.getCharacteristic('heart_rate_measurement');
    activeCharacteristic = characteristic;

    await characteristic.startNotifications();

    characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
      const target = event.target;
      if (target && target.value) {
        const bpm = parseHeartRate(target.value);
        if (bpm > 30 && bpm < 250) {
          onHeartRate(bpm);
        }
      }
    });

    return {
      id: device.id,
      name: device.name || 'Sensor Cardíaco Bluetooth',
      connected: true,
    };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      throw new Error('Busca de dispositivos Bluetooth cancelada.');
    }
    if (err.name === 'SecurityError') {
      throw new Error('Permissão Bluetooth negada pelo usuário ou navegador.');
    }
    throw err;
  }
}

/**
 * Desconecta o dispositivo ativo atual
 */
export function disconnectBluetoothHeartRate(): void {
  try {
    if (activeCharacteristic) {
      activeCharacteristic.stopNotifications().catch(() => {});
      activeCharacteristic = null;
    }
    if (activeServer && activeServer.connected) {
      activeServer.disconnect();
      activeServer = null;
    }
    if (activeDevice && activeDevice.gatt && activeDevice.gatt.connected) {
      activeDevice.gatt.disconnect();
      activeDevice = null;
    }
  } catch {
    // Silently ignore cleanup errors
  }
}

/**
 * Retorna o status de conexão ativa
 */
export function isBluetoothConnected(): boolean {
  return !!(activeServer && activeServer.connected);
}
