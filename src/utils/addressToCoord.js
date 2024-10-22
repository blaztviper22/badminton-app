const axios = require('axios');

async function geocodeAddress(address) {
  console.log(address);
  const proxyUrl = `https://simple-proxy.mayor.workers.dev/?destination=${encodeURIComponent(
    'https://nominatim.openstreetmap.org/search?q=' + address + '&format=json&limit=1'
  )}`;

  try {
    const response = await axios.get(proxyUrl);

    // Check if the address was found
    const data = response.data;
    if (data.length > 0) {
      const { lat, lon } = data[0];
      return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
    } else {
      throw new Error('Address not found');
    }
  } catch (error) {
    console.error('Failed to fetch geocoding data via proxy:', error.message);
    throw new Error('Failed to fetch geocoding data');
  }
}

module.exports = { geocodeAddress };
