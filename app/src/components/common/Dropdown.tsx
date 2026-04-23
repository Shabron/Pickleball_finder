/**
 * Dropdown — Accessible selection dropdown
 *
 * Theme-aware with surfaceContainerHighest background.
 * Touch targets at least 56px for senior accessibility.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  ViewStyle,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { borderRadius, spacing, sizes } from '../../theme/spacing';

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
  style?: ViewStyle;
  triggerStyle?: ViewStyle;
}

export default function Dropdown({
  label,
  placeholder = 'Select...',
  options,
  value,
  onSelect,
  style,
  triggerStyle,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { colors, typography } = useTheme();

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = useCallback(
    (optValue: string) => {
      onSelect(optValue);
      setIsOpen(false);
    },
    [onSelect],
  );

  return (
    <View style={style}>
      {label && (
        <Text style={[typography.titleSmall, { color: colors.onSurface, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsOpen(true)}
        style={[
          styles.trigger,
          { 
            backgroundColor: '#FFFFFF',
            borderColor: '#D1D5DB',
            borderWidth: 1,
          },
          triggerStyle,
        ]}
      >
        <Text
          style={[
            typography.bodyLarge,
            {
              color: selectedOption ? colors.onSurface : colors.onSurfaceVariant,
              flex: 1,
            },
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown color={colors.onSurfaceVariant} size={sizes.iconDefault} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.dropdownList,
              { backgroundColor: '#FFFFFF' },
            ]}
          >
            {label && (
              <Text
                style={[
                  typography.titleMedium,
                  { color: colors.onSurface, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
                ]}
              >
                {label}
              </Text>
            )}
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.value)}
                    style={[
                      styles.option,
                      isSelected && { backgroundColor: colors.primaryContainer + '40' },
                    ]}
                  >
                    <Text
                      style={[
                        typography.bodyLarge,
                        {
                          color: isSelected ? colors.primary : colors.onSurface,
                          flex: 1,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Check color={colors.primary} size={sizes.iconSmall} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  dropdownList: {
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.sm,
    maxHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.touchTargetMin,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
