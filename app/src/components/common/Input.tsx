import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
  isPassword?: boolean;
}

export default function Input({ icon, isPassword, style, ...props }: InputProps) {
  const [secureText, setSecureText] = useState(isPassword);
  
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={secureText}
        autoCapitalize="none"
        {...props}
      />
      
      {isPassword && (
        <TouchableOpacity 
          style={styles.rightIconContainer} 
          onPress={() => setSecureText(!secureText)}
        >
          {secureText ? (
            <EyeOff color={colors.textSecondary} size={20} />
          ) : (
            <Eye color={colors.textSecondary} size={20} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E1E6', // Slightly darker than primaryLight for border
    minHeight: 50,
    paddingHorizontal: spacing.m,
  },
  iconContainer: {
    marginRight: spacing.s,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.s,
  },
  rightIconContainer: {
    marginLeft: spacing.s,
    padding: spacing.xs,
  },
});
