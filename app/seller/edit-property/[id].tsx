import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { X, Camera, Plus, DollarSign, Bed, Bath, Square, Wifi, WifiOff, Upload, AlertCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { usePropertyStore } from '@/store/property-store';
import { Property, PropertyType, PropertyStatus } from '@/types/property';

export default function EditPropertyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { 
    updateProperty, 
    isLoading, 
    getPropertyById, 
    clearError,
    isOfflineMode,
    pendingUploads
  } = usePropertyStore();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [price, setPrice] = useState('');
  const [beds, setBeds] = useState('');
  const [baths, setBaths] = useState('');
  const [sqm, setSqm] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('house');
  const [status, setStatus] = useState<PropertyStatus>('for_sale');
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [has3DTour, setHas3DTour] = useState(false);
  const [tourUrl, setTourUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionEnabled, setCompressionEnabled] = useState(true);
  const [imageQuality, setImageQuality] = useState<'low' | 'medium' | 'high'>('medium');

  const propertyTypes: PropertyType[] = ['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial'];
  const propertyStatuses: PropertyStatus[] = ['for_sale', 'for_rent', 'pending', 'sold'];

  // Check if this property has pending uploads
  const hasPendingUploads = pendingUploads.some(upload => upload.id === id);

  // Network status detection
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    const loadProperty = async () => {
      if (id) {
        try {
          clearError();
          const foundProperty = await getPropertyById(id);
          if (foundProperty) {
            setProperty(foundProperty);
            setTitle(foundProperty.title);
            setDescription(foundProperty.description);
            setAddress(foundProperty.address);
            setCity(foundProperty.city);
            setState(foundProperty.state);
            setPrice(foundProperty.price.toString());
            setBeds(foundProperty.beds.toString());
            setBaths(foundProperty.baths.toString());
            setSqm(foundProperty.sqm?.toString() || '');
            setYearBuilt(foundProperty.yearBuilt?.toString() || '');
            setPropertyType(foundProperty.type);
            setStatus(foundProperty.status);
            setFeatures(foundProperty.features || []);
            setHas3DTour(foundProperty.has3DTour);
            setTourUrl(foundProperty.tourUrl || '');
            setImages(foundProperty.images || []);
          } else {
            Alert.alert('Error', 'Property not found');
            router.back();
          }
        } catch (error) {
          console.error('Error loading property:', error);
          Alert.alert('Error', 'Failed to load property');
          router.back();
        } finally {
          setLoading(false);
        }
      }
    };

    loadProperty();
  }, [id]);

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to add images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: imageQuality === 'high' ? 1.0 : imageQuality === 'medium' ? 0.8 : 0.6,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImageUris = result.assets.map(asset => asset.uri);
        setNewImages([...newImages, ...newImageUris]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
  };

  const addFeature = () => {
    if (newFeature.trim() !== '') {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !property) {
      Alert.alert('Error', 'You must be logged in to update a property');
      return;
    }

    // Validate required fields
    if (!title || !description || !address || !city || !state || !price || !beds || !baths || !sqm) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (images.length === 0 && newImages.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    // Show offline warning if applicable
    if (!isOnline || isOfflineMode) {
      Alert.alert(
        'Offline Mode',
        'Your changes will be saved locally and synced when you come back online.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save Offline', onPress: () => performUpdate() }
        ]
      );
    } else {
      performUpdate();
    }
  };

  const performUpdate = async () => {
    try {
      clearError();
      
      const updatedProperty = {
        title,
        description,
        address,
        city,
        state,
        price: parseFloat(price),
        beds: parseInt(beds),
        baths: parseFloat(baths),
        sqm: parseInt(sqm),
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : undefined,
        type: propertyType,
        status,
        features,
        has3DTour,
        tourUrl: has3DTour && tourUrl ? tourUrl : undefined,
        images, // Keep existing images
        isOfflineReady: true,
      };

      // Enhanced progress tracking
      const progressCallback = (progress: number) => {
        setUploadProgress(progress);
      };

      await updateProperty(
        property!.id, 
        updatedProperty, 
        newImages.length > 0 ? newImages : undefined
      );

      const successMessage = isOfflineMode || !isOnline 
        ? 'Property saved offline successfully. Changes will sync when online.'
        : 'Property updated successfully';

      Alert.alert('Success', successMessage, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error updating property:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to update property. Please try again.';
      
      if (error.message?.includes('retry-limit-exceeded')) {
        errorMessage = 'Upload failed due to poor connection. Your changes have been saved offline and will sync automatically when connection improves.';
      } else if (error.message?.includes('storage/')) {
        errorMessage = 'Image upload failed. Please check your internet connection and try again.';
      } else if (error.message?.includes('permission-denied')) {
        errorMessage = 'You do not have permission to update this property.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading property...</Text>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Property not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Edit Property' }} />

      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          {isOnline && !isOfflineMode ? (
            <Wifi size={16} color={colors.success} />
          ) : (
            <WifiOff size={16} color={colors.warning} />
          )}
          <Text style={styles.statusText}>
            {isOnline && !isOfflineMode ? 'Online' : 'Offline Mode'}
          </Text>
        </View>
        
        {hasPendingUploads && (
          <View style={styles.pendingIndicator}>
            <Upload size={16} color={colors.warning} />
            <Text style={styles.pendingText}>Pending Sync</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Offline warning */}
        {(!isOnline || isOfflineMode) && (
          <View style={styles.offlineWarning}>
            <AlertCircle size={20} color={colors.warning} />
            <Text style={styles.offlineWarningText}>
              Changes will be saved offline and synced when connection is restored
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Images</Text>
          
          {/* Image quality selector */}
          <View style={styles.qualitySelector}>
            <Text style={styles.qualityLabel}>Image Quality:</Text>
            <View style={styles.qualityButtons}>
              {(['low', 'medium', 'high'] as const).map((quality) => (
                <TouchableOpacity
                  key={quality}
                  style={[
                    styles.qualityButton,
                    imageQuality === quality && styles.activeQualityButton
                  ]}
                  onPress={() => setImageQuality(quality)}
                >
                  <Text style={[
                    styles.qualityButtonText,
                    imageQuality === quality && styles.activeQualityButtonText
                  ]}>
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <Text style={styles.sectionSubtitle}>Existing Images</Text>
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <X size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          
          {newImages.length > 0 && (
            <>
              <Text style={styles.sectionSubtitle}>New Images</Text>
              <View style={styles.imagesContainer}>
                {newImages.map((image, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri: image }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeNewImage(index)}
                    >
                      <X size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}
          
          <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
            <Camera size={24} color={colors.primary} />
            <Text style={styles.addImageText}>Add New Images</Text>
          </TouchableOpacity>
          
          {/* Upload progress */}
          {uploadProgress > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(uploadProgress)}% uploaded</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title*</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Beautiful 3-Bedroom House"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description*</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your property..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address*</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Street address"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>City*</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="City"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>State*</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={setState}
                placeholder="State"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price*</Text>
            <View style={styles.priceInput}>
              <DollarSign size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingLeft: 32 }]}
                value={price}
                onChangeText={setPrice}
                placeholder="Price"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Beds*</Text>
              <View style={styles.iconInput}>
                <Bed size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingLeft: 32 }]}
                  value={beds}
                  onChangeText={setBeds}
                  placeholder="Beds"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Baths*</Text>
              <View style={styles.iconInput}>
                <Bath size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingLeft: 32 }]}
                  value={baths}
                  onChangeText={setBaths}
                  placeholder="Baths"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Square Metres*</Text>
              <View style={styles.iconInput}>
                <Square size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingLeft: 32 }]}
                  value={sqm}
                  onChangeText={setSqm}
                  placeholder="Sqm"
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Year Built</Text>
              <TextInput
                style={styles.input}
                value={yearBuilt}
                onChangeText={setYearBuilt}
                placeholder="Year"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Property Type*</Text>
            <View style={styles.optionsContainer}>
              {propertyTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.optionButton,
                    propertyType === type && styles.optionButtonSelected,
                  ]}
                  onPress={() => setPropertyType(type)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      propertyType === type && styles.optionTextSelected,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status*</Text>
            <View style={styles.optionsContainer}>
              {propertyStatuses.map((statusOption) => (
                <TouchableOpacity
                  key={statusOption}
                  style={[
                    styles.optionButton,
                    status === statusOption && styles.optionButtonSelected,
                  ]}
                  onPress={() => setStatus(statusOption)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      status === statusOption && styles.optionTextSelected,
                    ]}
                  >
                    {statusOption === 'for_sale'
                      ? 'For Sale'
                      : statusOption === 'for_rent'
                      ? 'For Rent'
                      : statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureTag}>
                <Text style={styles.featureText}>{feature}</Text>
                <TouchableOpacity onPress={() => removeFeature(index)}>
                  <X size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.addFeatureContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newFeature}
              onChangeText={setNewFeature}
              placeholder="Add a feature (e.g. Garage, Pool)"
            />
            <TouchableOpacity style={styles.addFeatureButton} onPress={addFeature}>
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Has 3D Tour</Text>
            <Switch
              value={has3DTour}
              onValueChange={setHas3DTour}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={has3DTour ? colors.primary : colors.textLight}
            />
          </View>
          {has3DTour && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tour URL</Text>
              <TextInput
                style={styles.input}
                value={tourUrl}
                onChangeText={setTourUrl}
                placeholder="Enter 3D tour URL"
                keyboardType="url"
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              {(!isOnline || isOfflineMode) && <Upload size={20} color="white" />}
              <Text style={styles.submitButtonText}>
                {(!isOnline || isOfflineMode) ? 'Save Offline' : 'Update Property'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
  },
  pendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingText: {
    fontSize: 12,
    color: colors.warning,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  offlineWarningText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textLight,
    marginBottom: 8,
  },
  qualitySelector: {
    marginBottom: 16,
  },
  qualityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeQualityButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  qualityButtonText: {
    fontSize: 12,
    color: colors.text,
  },
  activeQualityButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    flexDirection: 'row',
    gap: 8,
  },
  addImageText: {
    fontSize: 14,
    color: colors.primary,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceInput: {
    position: 'relative',
  },
  iconInput: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 8,
    top: 12,
    zIndex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  optionTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.primary,
  },
  addFeatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addFeatureButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});