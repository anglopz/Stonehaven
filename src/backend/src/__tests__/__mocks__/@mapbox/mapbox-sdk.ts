const mockForwardGeocode = jest.fn().mockReturnValue({
  send: jest.fn().mockResolvedValue({
    body: {
      features: [
        {
          geometry: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749],
          },
        },
      ],
    },
  }),
});

const mockGeocoding = jest.fn(() => ({
  forwardGeocode: mockForwardGeocode,
}));

const mapboxSdk = jest.fn(() => ({
  geocoding: mockGeocoding(),
}));

export default mapboxSdk;
