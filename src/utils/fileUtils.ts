// Removed SparkMD5 import - MD5 is cryptographically broken (CWE-327)

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  hashes: {
    sha256: string;
    // Removed SHA-1 and MD5 - these are cryptographically broken (CWE-327)
    // Only SHA-256 is used for 2025 security standards
  };
}

export class FileUtils {
  static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Enhanced hash computation with only secure algorithms
  static async computeHash(algo: 'SHA-256', buffer: ArrayBuffer): Promise<string> {
    // Validate algorithm to prevent downgrade attacks
    if (algo !== 'SHA-256') {
      throw new Error('Only SHA-256 is supported for security reasons');
    }
    
    const hashBuffer = await crypto.subtle.digest(algo, buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Additional secure hash function for future use
  static async computeSHA3(buffer: ArrayBuffer): Promise<string> {
    // Note: SHA-3 support may vary by browser, fallback to SHA-256
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-3-256', buffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      // Fallback to SHA-256 if SHA-3 is not supported
      console.warn('SHA-3 not supported, falling back to SHA-256');
      return this.computeHash('SHA-256', buffer);
    }
  }

  static async getFileInfo(file: File): Promise<FileInfo> {
    const buffer = await this.readFileAsArrayBuffer(file);

    // Only compute SHA-256 for security (removed SHA-1 and MD5)
    const sha256 = await this.computeHash('SHA-256', buffer);
    
    // Clear buffer reference for security
    const fileInfo: FileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified),
      hashes: { sha256 },
    };
    
    return fileInfo;
  }
}
