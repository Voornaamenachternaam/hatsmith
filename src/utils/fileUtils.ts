import SparkMD5 from 'spark-md5';

// Maximum file size for security (1GB)
const MAX_SAFE_FILE_SIZE = 1024 * 1024 * 1024;

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  hashes: {
    sha256?: string;
    sha1?: string;
    md5?: string;
  };
}

export class FileUtils {
  /**
   * Validates file before processing to prevent security issues
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (file.size > MAX_SAFE_FILE_SIZE) {
      return { isValid: false, error: 'File size exceeds maximum limit (1GB)' };
    }
    if (file.size === 0) {
      return { isValid: false, error: 'File is empty' };
    }
    return { isValid: true };
  }

  static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      // Validate file before processing
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        reject(new Error(validation.error));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  static async computeHash(algo: 'SHA-256' | 'SHA-1', buffer: ArrayBuffer): Promise<string> {
    // Validate input buffer
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Invalid buffer for hash computation');
    }

    const hashBuffer = await crypto.subtle.digest(algo, buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static computeMD5(buffer: ArrayBuffer): string {
    // Validate input buffer
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Invalid buffer for MD5 computation');
    }

    const spark = new SparkMD5.ArrayBuffer();
    spark.append(buffer);
    return spark.end();
  }

  static async getFileInfo(file: File): Promise<FileInfo> {
    const buffer = await this.readFileAsArrayBuffer(file);
    
    // Additional validation after reading
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Failed to read file content');
    }

    const [sha256, sha1] = await Promise.all([
      this.computeHash('SHA-256', buffer),
      this.computeHash('SHA-1', buffer),
    ]);
    const md5 = this.computeMD5(buffer);

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
      hashes: { sha256, sha1, md5 },
    };
  }
}
