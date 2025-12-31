// import zxcvbn from "zxcvbn";
import { getTranslations as t } from "../../locales";

import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common'
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en'


const minute = 60,
      hour = minute * 60,
      day = hour * 24,
      month = day * 31,
      year = month * 12,
      century = year * 100;

const strength = {
  0: t("very_weak"),
  1: t("weak"),
  2: t("moderate"),
  3: t("good"),
  4: t("strong"),
};

const display_time = (seconds) => {
  let base, display_str, ref;

  (ref =
    seconds < 1
      ? [null, `${t('less_second')}`]
      : seconds < minute
      ? ((base = Math.round(seconds)), [base, base + ` ${t('seconds')}`])
      : seconds < hour
      ? ((base = Math.round(seconds / minute)), [base, base + ` ${t('minutes')}`])
      : seconds < day
      ? ((base = Math.round(seconds / hour)), [base, base + ` ${t('hours')}`])
      : seconds < month
      ? ((base = Math.round(seconds / day)), [base, base + ` ${t('days')}`])
      : seconds < year
      ? ((base = Math.round(seconds / month)), [base, base + ` ${t('months')}`])
      : seconds < century
      ? ((base = Math.round(seconds / year)), [base, base + ` ${t('years')}`])
      : [null, t('centuries')]),
    (display_str = ref[1]);
  return display_str;
};

const options = {
  translations: zxcvbnEnPackage.translations,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
}
zxcvbnOptions.setOptions(options)

const passwordStrengthCheck = (password) => {
  // Enhanced password validation with complexity requirements (CWE-521)
  if (!password || password.length < 16) {
    return [t("very_weak"), t("less_second")];
  }

  // Check for complexity requirements (3+ character types)
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  
  const characterTypes = [hasLowercase, hasUppercase, hasNumbers, hasSymbols].filter(Boolean).length;
  
  // Require at least 3 character types for passwords 16+ chars
  if (characterTypes < 3) {
    return [t("weak"), t("less_second")];
  }

  // Check for common weak patterns
  if (isWeakPattern(password)) {
    return [t("weak"), t("minutes")];
  }

  let strengthResult = zxcvbn(password);
  let score = strengthResult.score;
  let crackTimeInSeconds = strengthResult.crackTimesSeconds.offlineSlowHashing1e4PerSecond;
  let crackTime = display_time(crackTimeInSeconds);

  // Boost score for meeting complexity requirements
  if (characterTypes >= 4 && password.length >= 20) {
    score = Math.min(4, score + 1);
  }

  return [strength[score], crackTime];
};

// Enhanced pattern detection for weak passwords (CWE-521)
const isWeakPattern = (password) => {
  const weakPatterns = [
    // Common patterns
    /^(.)\1{3,}/, // Repeated characters (aaaa, 1111, etc.)
    /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
    /^(987|876|765|654|543|432|321|210|zyx|yxw|xwv|wvu|vut|uts|tsr|srq|rqp|qpo|pon|onm|nml|mlk|lkj|kji|jih|ihg|hgf|gfe|fed|edc|dcb|cba)/i,
    // Keyboard patterns
    /qwerty|asdf|zxcv|1234|password|admin|login|welcome|letmein/i,
    // Date patterns
    /19\d{2}|20\d{2}/, // Years
    /\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/, // Dates
    // Simple substitutions
    /p@ssw0rd|passw0rd|p4ssword|admin123|welcome123/i
  ];

  return weakPatterns.some(pattern => pattern.test(password));
};

// Validate password meets minimum security requirements
export const validatePasswordSecurity = (password) => {
  if (!password || password.length < 16) {
    return { valid: false, message: "Password must be at least 16 characters long" };
  }
  
  const [strength] = passwordStrengthCheck(password);
  if (strength === t("very_weak") || strength === t("weak")) {
    return { valid: false, message: "Password is too weak. Use a mix of uppercase, lowercase, numbers, and symbols." };
  }
  
  return { valid: true, message: "" };
};

export default passwordStrengthCheck;
