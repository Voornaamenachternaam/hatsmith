export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  hashes: {
    md5?: string;
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

  static async computeHash(algo: 'SHA-256', buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest(algo, buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  static async getFileInfo(file: File): Promise<FileInfo> {
    const buffer = await this.readFileAsArrayBuffer(file);

    // Only use SHA-256 for cryptographic integrity verification (CWE-327)
    const sha256 = await Promise.all([
      this.computeHash('SHA-256', buffer),
    ]);

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      hashes: { sha256 },
      hashes: { sha256, sha1, md5 },
    };
  }
}
