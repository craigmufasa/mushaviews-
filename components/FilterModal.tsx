import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  Switch
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { PropertyFilter } from '@/types/property';
import { usePropertyStore } from '@/store/property-store';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose }) => {
  const { filter, updateFilter, resetFilter } = usePropertyStore();
  
  // Local state for the form
  const [localFilter, setLocalFilter] = useState<PropertyFilter>({ ...filter });

  const handleApply = () => {
    updateFilter(localFilter);
    onClose();
  };

  const handleReset = () => {
    resetFilter();
    setLocalFilter({});
  };

  const handleClose = () => {
    // Reset local state to current filter
    setLocalFilter({ ...filter });
    onClose();
  };

  const updateLocalFilter = (key: keyof PropertyFilter, value: any) => {
    setLocalFilter(prev => ({ ...prev, [key]: value }));
  };

  const togglePropertyType = (type: 'house' | 'apartment' | 'condo' | 'townhouse') => {
    const currentTypes = localFilter.type || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    updateLocalFilter('type', newTypes.length > 0 ? newTypes : undefined);
  };

  const toggleStatus = (status: 'for_sale' | 'for_rent') => {
    const currentStatus = localFilter.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status];
    
    updateLocalFilter('status', newStatus.length > 0 ? newStatus : undefined);
  };

  const isTypeSelected = (type: 'house' | 'apartment' | 'condo' | 'townhouse') => {
    return localFilter.type?.includes(type) || false;
  };

  const isStatusSelected = (status: 'for_sale' | 'for_rent') => {
    return localFilter.status?.includes(status) || false;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Filters</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.content}>
                {/* Price Range */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Price Range</Text>
                  <View style={styles.priceInputs}>
                    <TouchableOpacity 
                      style={[
                        styles.priceButton, 
                        localFilter.priceMin === 500000 && styles.selectedButton
                      ]}
                      onPress={() => updateLocalFilter('priceMin', 500000)}
                    >
                      <Text style={styles.priceButtonText}>$500k+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.priceButton, 
                        localFilter.priceMin === 750000 && styles.selectedButton
                      ]}
                      onPress={() => updateLocalFilter('priceMin', 750000)}
                    >
                      <Text style={styles.priceButtonText}>$750k+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.priceButton, 
                        localFilter.priceMin === 1000000 && styles.selectedButton
                      ]}
                      onPress={() => updateLocalFilter('priceMin', 1000000)}
                    >
                      <Text style={styles.priceButtonText}>$1M+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.priceButton, 
                        localFilter.priceMin === 1500000 && styles.selectedButton
                      ]}
                      onPress={() => updateLocalFilter('priceMin', 1500000)}
                    >
                      <Text style={styles.priceButtonText}>$1.5M+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Beds */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Beds</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity 
                      style={[
                        styles.optionButton, 
                        localFilter.bedsMin === 1 && styles.selectedButton
                      ]}
                      onPress={() => updateLocalFilter('bedsMin', 1)}
                    >
                      <Text style={styles.optionButtonText}>1+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.optionButton, 
                        localFilter.bedsMin === 2 && styles.selectedButton
                      ]}
                      onPress={() => updateLocalFilter('bedsMin', 2)}
                    >
                      <Text style={styles.optionButtonText}>2+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.optionButton, 
                        localFilter.bedsMin === 3 && styles.selectedButton
                      ]}
                      onPress={() => updateLocalFilter('bedsMin', 3)}
                    >
                      <Text style={styles.optionButtonText}>3+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.optionButton, 
                        localFilter.bedsMin === 4 && styles.selectedButton
                      ]}
                      onPress={() => updateLocalFilter('bedsMin', 4)}
                    >
                      <Text style={styles.optionButtonText}>4+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Baths */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Baths</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity 
                      style={[
                        styles.optionButton, 
                        localFilter.bathsMin === 1 && styles.selectedButton
                      ]}
                      onPress={() => updateLocalFilter('bathsMin', 1)}
                    >
                      <Text style={styles.optionButtonText}>1+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.optionButton, 
                        localFilter.bathsMin === 2 && styles.selectedButton
                      ]}
                      onPress={() => updateLocalFilter('bathsMin', 2)}
                    >
                      <Text style={styles.optionButtonText}>2+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.optionButton, 
                        localFilter.bathsMin === 3 && styles.selectedButton
                      ]}
                      onPress={() => updateLocalFilter('bathsMin', 3)}
                    >
                      <Text style={styles.optionButtonText}>3+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Property Type */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Property Type</Text>
                  <View style={styles.typeContainer}>
                    <TouchableOpacity 
                      style={[
                        styles.typeButton, 
                        isTypeSelected('house') && styles.selectedButton
                      ]}
                      onPress={() => togglePropertyType('house')}
                    >
                      <Text style={styles.typeButtonText}>House</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.typeButton, 
                        isTypeSelected('apartment') && styles.selectedButton
                      ]}
                      onPress={() => togglePropertyType('apartment')}
                    >
                      <Text style={styles.typeButtonText}>Apartment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.typeButton, 
                        isTypeSelected('condo') && styles.selectedButton
                      ]}
                      onPress={() => togglePropertyType('condo')}
                    >
                      <Text style={styles.typeButtonText}>Condo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.typeButton, 
                        isTypeSelected('townhouse') && styles.selectedButton
                      ]}
                      onPress={() => togglePropertyType('townhouse')}
                    >
                      <Text style={styles.typeButtonText}>Townhouse</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Status */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Status</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity 
                      style={[
                        styles.statusButton, 
                        isStatusSelected('for_sale') && styles.selectedButton
                      ]}
                      onPress={() => toggleStatus('for_sale')}
                    >
                      <Text style={styles.statusButtonText}>For Sale</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.statusButton, 
                        isStatusSelected('for_rent') && styles.selectedButton
                      ]}
                      onPress={() => toggleStatus('for_rent')}
                    >
                      <Text style={styles.statusButtonText}>For Rent</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 3D Tour */}
                <View style={styles.section}>
                  <View style={styles.switchRow}>
                    <Text style={styles.sectionTitle}>3D Tour Available</Text>
                    <Switch
                      value={localFilter.has3DTour || false}
                      onValueChange={(value) => updateLocalFilter('has3DTour', value)}
                      trackColor={{ false: colors.border, true: colors.primaryLight }}
                      thumbColor={localFilter.has3DTour ? colors.primary : '#f4f3f4'}
                    />
                  </View>
                  <Text style={styles.switchDescription}>
                    Only show properties with 3D virtual tours
                  </Text>
                </View>
              </ScrollView>
              
              <View style={styles.footer}>
                <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        paddingBottom: 30, // For iOS home indicator
      },
      android: {
        paddingBottom: 16,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  priceButtonText: {
    color: colors.text,
    fontSize: 14,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  optionButtonText: {
    color: colors.text,
    fontSize: 14,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  typeButtonText: {
    color: colors.text,
    fontSize: 14,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  statusButtonText: {
    color: colors.text,
    fontSize: 14,
  },
  selectedButton: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchDescription: {
    fontSize: 14,
    color: colors.textLight,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});