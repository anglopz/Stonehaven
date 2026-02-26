import type { IImageStorage } from '../../../application/ports';
import { cloudinary } from '../../../config/cloudinary';

export class CloudinaryImageAdapter implements IImageStorage {
  async delete(filename: string): Promise<void> {
    await cloudinary.uploader.destroy(filename).catch(() => {});
  }
}
