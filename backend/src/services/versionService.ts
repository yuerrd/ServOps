export class VersionService {
  /**
   * 自动升级版本号
   * @param currentVersion 当前版本号 (例如: "1.2.3")
   * @returns 新版本号
   */
  static upgradeVersion(currentVersion: string): string {
    if (!currentVersion || !/^\d+\.\d+\.\d+$/.test(currentVersion)) {
      return '0.0.1';
    }

    const [major, minor, patch] = currentVersion.split('.').map(Number);

    // 版本升级逻辑：patch < 20 时递增patch，否则递增minor，minor >= 10时递增major
    if (patch < 20) {
      return `${major}.${minor}.${patch + 1}`;
    } else {
      if (minor < 9) {
        return `${major}.${minor + 1}.0`;
      } else {
        return `${major + 1}.0.0`;
      }
    }
  }

  /**
   * 比较版本号
   * @param version1 版本1
   * @param version2 版本2
   * @returns 1: version1 > version2, -1: version1 < version2, 0: equal
   */
  static compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if (v1Parts[i] > v2Parts[i]) return 1;
      if (v1Parts[i] < v2Parts[i]) return -1;
    }
    return 0;
  }

  /**
   * 验证版本号格式
   * @param version 版本号
   * @returns 是否有效
   */
  static isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version);
  }
}