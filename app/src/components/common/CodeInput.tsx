/**
 * CodeInput — six digit boxes backed by one hidden TextInput.
 * Paste and SMS/one-time-code autofill work because it is a single input.
 * Used by Verify Email and Reset Password.
 */
import React, { forwardRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius } from '../../theme/spacing';

interface Props {
  value: string;
  onChange: (digits: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

const CodeInput = forwardRef<TextInput, Props>(
  ({ value, onChange, length = 6, error, disabled, autoFocus }, ref) => {
    const { colors, typography } = useTheme();
    const [focused, setFocused] = useState(false);
    const inner = React.useRef<TextInput>(null);
    React.useImperativeHandle(ref, () => inner.current as TextInput);
    const activeIndex = Math.min(value.length, length - 1);

    return (
      <Pressable style={styles.row} onPress={() => inner.current?.focus()}>
        {Array.from({ length }).map((_, i) => {
          const isActive = focused && i === activeIndex && !disabled;
          return (
            <View
              key={i}
              style={[
                styles.box,
                {
                  backgroundColor: colors.surfaceContainer,
                  borderColor: error ? colors.error : isActive ? colors.primary : 'transparent',
                },
              ]}
            >
              <Text style={[typography.headlineSmall, { color: colors.onSurface, fontWeight: '700' }]}>
                {value[i] || ''}
              </Text>
            </View>
          );
        })}
        <TextInput
          ref={inner}
          value={value}
          onChangeText={t => onChange(t.replace(/[^0-9]/g, '').slice(0, length))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={length}
          autoFocus={autoFocus}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.hidden}
          caretHidden
          accessibilityLabel={`${length}-digit code`}
        />
      </Pressable>
    );
  },
);

export default CodeInput;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    width: 44,
    height: 54,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hidden: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.01,
    color: 'transparent',
  },
});
