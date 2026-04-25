jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid'),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid'),
  validate: jest.fn(() => true), 
}));