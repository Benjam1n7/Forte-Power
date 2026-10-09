import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '../constants/brand';

interface Props {
  quantity: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  accessibilityLabelSuffix?: string;
}

/** Touch-friendly +/- quantity control (44pt minimum targets). */
export const QuantityStepper: React.FC<Props> = ({
  quantity,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  accessibilityLabelSuffix = '',
}) => {
  const decDisabled = disabled || quantity <= min;
  const incDisabled = disabled || quantity >= max;
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => !decDisabled && onChange(quantity - 1)}
        disabled={decDisabled}
        style={[styles.button, decDisabled && styles.buttonDisabled]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Decrease quantity${accessibilityLabelSuffix ? ` ${accessibilityLabelSuffix}` : ''}`}
        accessibilityState={{ disabled: decDisabled }}
      >
        <Text style={styles.sign}>−</Text>
      </Pressable>
      <Text style={styles.quantity} accessibilityLabel={`Quantity ${quantity}`}>
        {quantity}
      </Text>
      <Pressable
        onPress={() => !incDisabled && onChange(quantity + 1)}
        disabled={incDisabled}
        style={[styles.button, incDisabled && styles.buttonDisabled]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Increase quantity${accessibilityLabelSuffix ? ` ${accessibilityLabelSuffix}` : ''}`}
        accessibilityState={{ disabled: incDisabled }}
      >
        <Text style={styles.sign}>+</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 999,
    paddingHorizontal: 4,
  },
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  sign: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.ink,
    lineHeight: 22,
  },
  quantity: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: Brand.ink,
  },
});
