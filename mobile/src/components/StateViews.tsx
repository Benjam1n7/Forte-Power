import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand } from '../constants/brand';

/** Full-area loading indicator with an accessible label. */
export const LoadingState: React.FC<{ label?: string }> = ({
  label = 'Loading…',
}) => (
  <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label}>
    <ActivityIndicator size="large" color={Brand.ink} />
    <Text style={styles.muted}>{label}</Text>
  </View>
);

/** Empty-state block with an optional call to action. */
export const EmptyState: React.FC<{
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon = 'cart-outline', title, message, actionLabel, onAction }) => (
  <View style={styles.center}>
    <View style={styles.iconBubble}>
      <Ionicons name={icon} size={26} color={Brand.muted} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.mutedCentered}>{message}</Text> : null}
    {actionLabel && onAction ? (
      <Pressable
        onPress={onAction}
        style={styles.action}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

/** Error-state block with retry. */
export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}> = ({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again' }) => (
  <View style={styles.center}>
    <View style={[styles.iconBubble, styles.iconBubbleError]}>
      <Ionicons name="alert-circle-outline" size={26} color={Brand.danger} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.mutedCentered}>{message}</Text>
    {onRetry ? (
      <Pressable
        onPress={onRetry}
        style={styles.action}
        accessibilityRole="button"
        accessibilityLabel={retryLabel}
      >
        <Text style={styles.actionText}>{retryLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

/** Inline banner used for sync/offline notices. */
export const NoticeBanner: React.FC<{
  tone?: 'info' | 'warning' | 'error' | 'success';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ tone = 'info', message, actionLabel, onAction }) => {
  const colors: Record<string, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
    info: { bg: '#EAF0FF', fg: Brand.blue, icon: 'information-circle-outline' },
    warning: { bg: '#FEF3C7', fg: '#B45309', icon: 'cloud-offline-outline' },
    error: { bg: '#FEE2E2', fg: Brand.danger, icon: 'alert-circle-outline' },
    success: { bg: '#DCFCE7', fg: Brand.success, icon: 'checkmark-circle-outline' },
  };
  const c = colors[tone] ?? colors.info;
  return (
    <View style={[styles.banner, { backgroundColor: c.bg }]}>
      <Ionicons name={c.icon} size={16} color={c.fg} style={{ flexShrink: 0 }} />
      <Text style={[styles.bannerText, { color: c.fg }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel} hitSlop={8}>
          <Text style={[styles.bannerAction, { color: c.fg }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: 'rgba(27,27,26,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleError: {
    backgroundColor: '#FEE2E2',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Brand.ink,
    textAlign: 'center',
  },
  muted: {
    fontSize: 13,
    color: Brand.muted,
  },
  mutedCentered: {
    fontSize: 13,
    color: Brand.muted,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
  },
  action: {
    marginTop: 8,
    backgroundColor: Brand.ink,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    color: Brand.white,
    fontWeight: '700',
    fontSize: 14,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  bannerAction: {
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
