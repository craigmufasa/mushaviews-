import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Home, Search } from 'lucide-react-native';
import { colors } from '@/constants/colors';

interface EmptyStateProps {
  type?: 'search' | 'favorites';
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  type, 
  icon, 
  title, 
  description, 
  actionText, 
  onAction 
}) => {
  const getContent = () => {
    if (icon && title && description) {
      return {
        icon,
        title,
        message: description,
        actionText: actionText || 'Take Action',
      };
    }

    switch (type) {
      case 'search':
        return {
          icon: <Search size={48} color={colors.textLight} />,
          title: 'No properties found',
          message: 'Try adjusting your search filters to find more properties.',
          actionText: 'Reset Filters',
        };
      case 'favorites':
        return {
          icon: <Home size={48} color={colors.textLight} />,
          title: 'No saved homes yet',
          message: 'Save your favorite properties to view them here.',
          actionText: 'Browse Properties',
        };
      default:
        return {
          icon: <Home size={48} color={colors.textLight} />,
          title: 'Nothing to show',
          message: 'There are no items to display at this time.',
          actionText: 'Go Back',
        };
    }
  };

  const content = getContent();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{content.icon}</View>
      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.message}>{content.message}</Text>
      {onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{content.actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});