export const formatPrice = (price: number): string => {
  // For prices over 1 million, format as $X.XM
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  
  // For rental prices under 10000, assume it's monthly rent
  if (price < 10000) {
    return `$${price.toLocaleString()}/mo`;
  }
  
  // Otherwise format with commas
  return `$${price.toLocaleString()}`;
};

export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatAddress = (property: { address: string; city: string; state: string }): string => {
  return `${property.address}, ${property.city}, ${property.state}`;
};