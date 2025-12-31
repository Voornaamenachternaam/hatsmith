import { getTranslations as t } from "../../locales";

import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common'
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en'

// Enhanced password requirements for 2025 security standards
const MIN_PASSWORD_LENGTH = 16; // Increased from 12
const MIN_PASSPHRASE_WORDS = 6; // Increased from 5

const minute = 60,
      hour = minute * 60,
      day = hour * 24,
      month = day * 31,
      year = month * 12,
      century = year * 100;

// Enhanced strength categories with stricter requirements
const strength = {
  0: t("very_weak"),
  1: t("weak"),
  2: t("moderate"),
  3: t("good"),
  4: t("strong"),
  5: t("very_strong") // Added for enhanced passwords
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

// Enhanced password validation for 2025 security standards
const validatePasswordComplexity = (password) => {
  const issues = [];
  
  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push(`Minimum ${MIN_PASSWORD_LENGTH} characters required`);
  }
  
  // Check for character diversity (enhanced requirements)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const charTypes = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  
  if (charTypes < 3) {
    issues.push("Must contain at least 3 character types (lowercase, uppercase, digits, symbols)");
  }
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    issues.push("Avoid repeating characters");
  }
  
  if (/123|abc|qwe|password|admin/i.test(password)) {
    issues.push("Avoid common patterns and words");
  }
  
  return issues;
};

const passwordStrengthCheck = (password) => {
  // Enhanced password strength checking
  let strengthResult = zxcvbn(password);
  let score = strengthResult.score;
  let crackTimeInSeconds = strengthResult.crackTimesSeconds.offlineSlowHashing1e4PerSecond;
  let crackTime = display_time(crackTimeInSeconds);
  
  // Apply additional complexity validation
  const complexityIssues = validatePasswordComplexity(password);
  
  // Reduce score if complexity requirements aren't met
  if (complexityIssues.length > 0) {
    score = Math.max(0, score - 1);
  }
  
  // Bonus for very long passwords (>20 chars) with good entropy
  if (password.length >= 20 && score >= 3) {
    score = Math.min(4, score + 1);
  }

  return [strength[score], crackTime, complexityIssues];
};

export default passwordStrengthCheck;
