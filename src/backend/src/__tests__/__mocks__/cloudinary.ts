export const v2 = {
  config: jest.fn(),
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/v1/test.jpg',
      public_id: 'test_public_id',
    }),
    destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
  },
};
