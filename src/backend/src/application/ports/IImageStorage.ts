export interface IImageStorage {
  delete(filename: string): Promise<void>;
}
