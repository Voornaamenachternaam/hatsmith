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
  // Enhanced password validation (CWE-521)
  if (!password || password.length < 16) {
    return [strength[0], t('less_second')]; // Very weak for passwords under 16 chars
  }
  
  // Check for complexity requirements (at least 3 different character types)
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const characterTypes = [hasLowercase, hasUppercase, hasNumbers, hasSpecialChars].filter(Boolean).length;
  
  // Detect common weak patterns
  const weakPatterns = [
    /^(.)\1+$/, // All same character
    /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i, // Sequential
    /^(password|123456|qwerty|admin|letmein|welcome|monkey|dragon)/i, // Common passwords
    /^(.{1,3})\1+$/, // Repeated short patterns
  ];
  
  const hasWeakPattern = weakPatterns.some(pattern => pattern.test(password));
  
  // Apply penalties for weak characteristics
  let strengthResult = zxcvbn(password);
  let score = strengthResult.score;
  
  // Penalize for insufficient character type diversity
  if (characterTypes < 3) {
    score = Math.max(0, score - 1);
  }
  
  // Penalize for weak patterns
  if (hasWeakPattern) {
    score = Math.max(0, score - 2);
  }
  
  // Bonus for very long passwords with good diversity
  if (password.length >= 20 && characterTypes >= 4) {
    score = Math.min(4, score + 1);
  }
  
  let crackTimeInSeconds = strengthResult.crackTimesSeconds.offlineSlowHashing1e4PerSecond;
  let crackTime = display_time(crackTimeInSeconds);

  return [strength[score], crackTime];
};

export default passwordStrengthCheck;
