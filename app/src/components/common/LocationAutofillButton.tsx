/**
 * LocationAutofillButton — "Use My Current Location" pill
 *
 * One reusable piece used identically in onboarding, profile edit, and the
 * Search screen's Nearby mode: request permission → get a GPS fix →
 * resolve it to city/state/zip via the backend's offline reverse-geocode
 * lookup. All permission/GPS/network failure handling lives here so none
 * of the three call sites duplicate it.
 */
import React, { useState } from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { MapPin, CircleCheck } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, borderRadius } from '../../theme/spacing';
import { requestLocationPermission, getCurrentCoords } from '../../services/location';
import { profileApi } from '../../services/api';

export interface LocatedResult {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface LocationAutofillButtonProps {
  onLocated: (result: LocatedResult) => void;
  label?: string;
  style?: ViewStyle;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function LocationAutofillButton({
  onLocated,
  label = '📍 Use My Current Location',
  style,
}: LocationAutofillButtonProps) {
  const { colors, typography } = useTheme();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePress = async () => {
    setStatus('loading');
    setErrorMessage(null);

    const granted = await requestLocationPermission();
    if (!granted) {
      setStatus('error');
      setErrorMessage('Turn on location access in Settings, or enter your area below.');
      return;
    }

    const coords = await getCurrentCoords();
    if (!coords) {
      setStatus('error');
      setErrorMessage("Couldn't detect your location — enter it below.");
      return;
    }

    let resolved: LocatedResult = { latitude: coords.latitude, longitude: coords.longitude };
    try {
      const res = await profileApi.reverseGeocode(coords.latitude, coords.longitude);
      if (res.success && res.data) {
        resolved = {
          ...resolved,
          city: res.data.city || undefined,
          state: res.data.state || undefined,
          zipCode: res.data.zipCode || undefined,
        };
      }
    } catch {
      // Reverse-geocode failed, but we still have real coordinates —
      // proceed with those and let the user fill in city/state/zip.
    }

    onLocated(resolved);
    setStatus('success');
    setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <View style={style}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={status === 'loading'}
        style={[
          styles.button,
          {
            backgroundColor: colors.primaryContainer,
            opacity: status === 'loading' ? 0.7 : 1,
          },
        ]}
      >
        {status === 'loading' ? (
          <>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[typography.labelMedium, { color: colors.primary, fontWeight: '700', marginLeft: spacing.sm }]}>
              Locating…
            </Text>
          </>
        ) : status === 'success' ? (
          <>
            <CircleCheck size={18} color={colors.success} />
            <Text style={[typography.labelMedium, { color: colors.success, fontWeight: '700', marginLeft: spacing.sm }]}>
              Location found
            </Text>
          </>
        ) : (
          <>
            <MapPin size={18} color={colors.primary} />
            <Text style={[typography.labelMedium, { color: colors.primary, fontWeight: '700', marginLeft: spacing.sm }]}>
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {status === 'error' && errorMessage && (
        <Text style={[typography.bodySmall, { color: colors.error, marginTop: spacing.xs }]}>
          {errorMessage}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
});
