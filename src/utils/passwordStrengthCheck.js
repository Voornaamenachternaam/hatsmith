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

/**
 * Enhanced password validation following NIST SP 800-63B guidelines
 * Checks for minimum entropy and security requirements
 */
const validatePasswordSecurity = (password) => {
  // Minimum length check (16 characters for strong security)
  if (password.length < 16) {
    return {
      isValid: false,
      reason: "Password must be at least 16 characters long"
    };
  }

  // Check for common weak patterns
  const weakPatterns = [
    /^(.)\1+$/, // All same character
    /^(..)\1+$/, // Repeated pairs
    /^123456/, // Sequential numbers
    /^abcdef/i, // Sequential letters
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(password)) {
      return { isValid: false, reason: "Password contains weak patterns" };
    }
  }

  return { isValid: true };
};

const passwordStrengthCheck = (password) => {
  
  let strengthResult = zxcvbn(password);
  console.log(strengthResult);
  let score = strengthResult.score;
  let crackTimeInSeconds = strengthResult.crackTimesSeconds.offlineSlowHashing1e4PerSecond;
  let crackTime = display_time(crackTimeInSeconds);

  // Enhanced validation
  const validation = validatePasswordSecurity(password);
  
  // If password fails basic security checks, override score
  if (!validation.isValid) {
    return [t("very_weak"), t("less_second"), validation.reason];
  }

  // Require minimum score of 2 for passwords shorter than 20 characters
  if (password.length < 20 && score < 2) {
    return [t("weak"), crackTime, "Consider using a longer password or passphrase"];
  }

  return [strength[score], crackTime];
};

export default passwordStrengthCheck;
