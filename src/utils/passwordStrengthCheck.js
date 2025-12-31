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
  // Enhanced password requirements validation (CWE-521)
  if (!isPasswordCompliant(password)) {
    return [t("very_weak"), t("does_not_meet_requirements")];
  }
  
  let strengthResult = zxcvbn(password);
  console.log(strengthResult);
  let score = strengthResult.score;
  let crackTimeInSeconds = strengthResult.crackTimesSeconds.offlineSlowHashing1e4PerSecond;
  let crackTime = display_time(crackTimeInSeconds);

  return [strength[score], crackTime];
};

// Enhanced password compliance check (CWE-521)
const isPasswordCompliant = (password) => {
  // Minimum length increased from 12 to 16 characters (CWE-521)
  if (password.length < 16) {
    return false;
  }
  
  // Check for complexity requirements (3+ character types required)
  let characterTypes = 0;
  
  // Check for lowercase letters
  if (/[a-z]/.test(password)) {
    characterTypes++;
  }
  
  // Check for uppercase letters
  if (/[A-Z]/.test(password)) {
    characterTypes++;
  }
  
  // Check for digits
  if (/[0-9]/.test(password)) {
    characterTypes++;
  }
  
  // Check for special characters
  if (/[^a-zA-Z0-9]/.test(password)) {
    characterTypes++;
  }
  
  // Require at least 3 different character types (CWE-521)
  if (characterTypes < 3) {
    return false;
  }
  
  // Enhanced pattern detection against common weak passwords (CWE-521)
  const weakPatterns = [
    /^(.)\1+$/, // All same character
    /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i, // Sequential patterns
    /^(password|123456|qwerty|admin|login|welcome|secret)/i, // Common weak passwords
  ];
  
  for (let pattern of weakPatterns) {
    if (pattern.test(password)) {
      return false;
    }
  }
  
  return true;
};

export default passwordStrengthCheck;
