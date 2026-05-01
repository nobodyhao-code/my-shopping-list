import { Platform } from 'react-native';

export function getMapUrl(latitude, longitude) {
  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?ll=${latitude},${longitude}`;
  }
  return `https://maps.google.com/?q=${latitude},${longitude}`;
}
