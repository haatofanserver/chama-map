import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import i18n from '@/lib/i18n';

describe('Return to Japan Internationalization Tests', () => {
  beforeEach(() => {
    // Reset to English before each test
    i18n.changeLanguage('en');
  });

  describe('Translation Key Usage and Fallbacks', () => {
    it('should use correct translation keys for Return to Japan tooltip in English', () => {
      i18n.changeLanguage('en');

      // Check that the English translation is used
      expect(i18n.t('returnToJapan.tooltip')).toBe('Return to Japan');
    });

    it('should use correct translation keys for Return to Japan tooltip in Japanese', () => {
      i18n.changeLanguage('ja');

      // Check that the Japanese translation is used
      expect(i18n.t('returnToJapan.tooltip')).toBe('日本に戻る');
    });

    it('should use correct translation keys for Return to Japan ARIA label in English', () => {
      i18n.changeLanguage('en');

      expect(i18n.t('returnToJapan.ariaLabel')).toBe('Return to Japan view');
    });

    it('should use correct translation keys for Return to Japan ARIA label in Japanese', () => {
      i18n.changeLanguage('ja');

      expect(i18n.t('returnToJapan.ariaLabel')).toBe('日本の地図に戻る');
    });

    it('should have all required Return to Japan translation keys', () => {
      // Test that all required translation keys exist
      const requiredKeys = [
        'returnToJapan.tooltip',
        'returnToJapan.ariaLabel'
      ];

      requiredKeys.forEach(key => {
        // Test English
        i18n.changeLanguage('en');
        const enTranslation = i18n.t(key as any);
        expect(enTranslation).not.toBe(key); // Should not return the key itself
        expect(enTranslation).toBeTruthy();

        // Test Japanese
        i18n.changeLanguage('ja');
        const jaTranslation = i18n.t(key as any);
        expect(jaTranslation).not.toBe(key); // Should not return the key itself
        expect(jaTranslation).toBeTruthy();
        expect(jaTranslation).not.toBe(enTranslation); // Should be different from English
      });
    });
  });

  describe('Language Switching Behavior', () => {
    it('should update translations when language is switched from English to Japanese', () => {
      // Start with English
      i18n.changeLanguage('en');
      expect(i18n.t('returnToJapan.tooltip')).toBe('Return to Japan');

      // Switch to Japanese
      i18n.changeLanguage('ja');
      expect(i18n.t('returnToJapan.tooltip')).toBe('日本に戻る');
    });

    it('should update translations when language is switched from Japanese to English', () => {
      // Start with Japanese
      i18n.changeLanguage('ja');
      expect(i18n.t('returnToJapan.ariaLabel')).toBe('日本の地図に戻る');

      // Switch to English
      i18n.changeLanguage('en');
      expect(i18n.t('returnToJapan.ariaLabel')).toBe('Return to Japan view');
    });

    it('should maintain translation consistency across multiple switches', () => {
      const testCycles = 3;

      for (let i = 0; i < testCycles; i++) {
        // Switch to English
        i18n.changeLanguage('en');
        expect(i18n.t('returnToJapan.tooltip')).toBe('Return to Japan');

        // Switch to Japanese
        i18n.changeLanguage('ja');
        expect(i18n.t('returnToJapan.tooltip')).toBe('日本に戻る');
      }
    });
  });

  describe('Integration with Common Translations', () => {
    it('should work correctly with common loading translation in English', () => {
      i18n.changeLanguage('en');

      expect(i18n.t('common.loading')).toBe('Loading...');
    });

    it('should work correctly with common loading translation in Japanese', () => {
      i18n.changeLanguage('ja');

      expect(i18n.t('common.loading')).toBe('読み込み中...');
    });
  });

  /**
   * Property 6: Comprehensive localization
   * Feature: return-to-japan, Property 6: Comprehensive localization
   * Validates: Requirements 4.4, 5.3, 5.5
   */
  describe('Property 6: Comprehensive localization', () => {
    it('should maintain consistent localization across all language settings and translation keys', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('en'),
            fc.constant('ja')
          ), // language setting
          fc.oneof(
            fc.constant('returnToJapan.tooltip'),
            fc.constant('returnToJapan.ariaLabel'),
            fc.constant('common.loading')
          ), // translation key
          fc.integer({ min: 1, max: 5 }), // number of language switches to test
          (language, translationKey, switchCount) => {
            // Test that translations are consistent across multiple language switches
            for (let i = 0; i < switchCount; i++) {
              // Switch to the test language
              i18n.changeLanguage(language);

              // Get the translation
              const translation = i18n.t(translationKey as any);

              // Verify translation exists and is not the key itself (fallback)
              expect(translation).toBeTruthy();
              expect(translation).not.toBe(translationKey);
              expect(typeof translation).toBe('string');
              expect(translation.length).toBeGreaterThan(0);

              // Verify language-specific expectations
              if (language === 'en') {
                expect(i18n.language).toBe('en');

                // Verify English translations
                if (translationKey === 'returnToJapan.tooltip') {
                  expect(translation).toBe('Return to Japan');
                } else if (translationKey === 'returnToJapan.ariaLabel') {
                  expect(translation).toBe('Return to Japan view');
                } else if (translationKey === 'common.loading') {
                  expect(translation).toBe('Loading...');
                }

                // English translations should not contain Japanese characters
                expect(translation).not.toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/);
              } else if (language === 'ja') {
                expect(i18n.language).toBe('ja');

                // Verify Japanese translations
                if (translationKey === 'returnToJapan.tooltip') {
                  expect(translation).toBe('日本に戻る');
                } else if (translationKey === 'returnToJapan.ariaLabel') {
                  expect(translation).toBe('日本の地図に戻る');
                } else if (translationKey === 'common.loading') {
                  expect(translation).toBe('読み込み中...');
                }

                // Japanese translations should contain Japanese characters
                expect(translation).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/);
              }

              // Switch to the other language and verify it changes
              const otherLanguage = language === 'en' ? 'ja' : 'en';
              i18n.changeLanguage(otherLanguage);
              const otherTranslation = i18n.t(translationKey as any);

              // Translations should be different between languages
              expect(otherTranslation).not.toBe(translation);
              expect(otherTranslation).toBeTruthy();
              expect(typeof otherTranslation).toBe('string');

              // Switch back to original language for next iteration
              i18n.changeLanguage(language);
              const backTranslation = i18n.t(translationKey as any);

              // Should get the same translation when switching back
              expect(backTranslation).toBe(translation);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle language switching with all Return to Japan translation keys simultaneously', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant('en'),
            fc.constant('ja')
          ), // starting language
          fc.integer({ min: 2, max: 10 }), // number of language switches
          (startLanguage, switchCount) => {
            // Start with the specified language
            i18n.changeLanguage(startLanguage);

            // Get all Return to Japan translations in the starting language
            const initialTooltip = i18n.t('returnToJapan.tooltip');
            const initialAriaLabel = i18n.t('returnToJapan.ariaLabel');
            const initialLoading = i18n.t('common.loading');

            // Verify initial translations are valid
            expect(initialTooltip).toBeTruthy();
            expect(initialAriaLabel).toBeTruthy();
            expect(initialLoading).toBeTruthy();

            // Perform multiple language switches
            let currentLanguage = startLanguage;
            for (let i = 0; i < switchCount; i++) {
              // Switch to the other language
              const nextLanguage = currentLanguage === 'en' ? 'ja' : 'en';
              i18n.changeLanguage(nextLanguage);

              // Get translations in the new language
              const newTooltip = i18n.t('returnToJapan.tooltip');
              const newAriaLabel = i18n.t('returnToJapan.ariaLabel');
              const newLoading = i18n.t('common.loading');

              // Verify all translations are valid and different from previous language
              expect(newTooltip).toBeTruthy();
              expect(newAriaLabel).toBeTruthy();
              expect(newLoading).toBeTruthy();

              if (nextLanguage !== startLanguage) {
                expect(newTooltip).not.toBe(initialTooltip);
                expect(newAriaLabel).not.toBe(initialAriaLabel);
                expect(newLoading).not.toBe(initialLoading);
              }

              // Verify language-specific content
              if (nextLanguage === 'en') {
                expect(newTooltip).toBe('Return to Japan');
                expect(newAriaLabel).toBe('Return to Japan view');
                expect(newLoading).toBe('Loading...');

                // English should not contain Japanese characters
                expect(newTooltip).not.toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/);
                expect(newAriaLabel).not.toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/);
              } else if (nextLanguage === 'ja') {
                expect(newTooltip).toBe('日本に戻る');
                expect(newAriaLabel).toBe('日本の地図に戻る');
                expect(newLoading).toBe('読み込み中...');

                // Japanese should contain Japanese characters
                expect(newTooltip).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/);
                expect(newAriaLabel).toMatch(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/);
              }

              currentLanguage = nextLanguage;
            }

            // Switch back to starting language and verify consistency
            i18n.changeLanguage(startLanguage);
            const finalTooltip = i18n.t('returnToJapan.tooltip');
            const finalAriaLabel = i18n.t('returnToJapan.ariaLabel');
            const finalLoading = i18n.t('common.loading');

            // Should match initial translations
            expect(finalTooltip).toBe(initialTooltip);
            expect(finalAriaLabel).toBe(initialAriaLabel);
            expect(finalLoading).toBe(initialLoading);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain translation integrity across rapid language switches', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.constant('en'),
              fc.constant('ja')
            ),
            { minLength: 5, maxLength: 20 }
          ), // sequence of language switches
          (languageSequence) => {
            // Test rapid language switching
            for (const language of languageSequence) {
              i18n.changeLanguage(language);

              // Verify all translations are immediately available and correct
              const tooltip = i18n.t('returnToJapan.tooltip');
              const ariaLabel = i18n.t('returnToJapan.ariaLabel');
              const loading = i18n.t('common.loading');

              // Basic validation
              expect(tooltip).toBeTruthy();
              expect(ariaLabel).toBeTruthy();
              expect(loading).toBeTruthy();
              expect(typeof tooltip).toBe('string');
              expect(typeof ariaLabel).toBe('string');
              expect(typeof loading).toBe('string');

              // Language-specific validation
              if (language === 'en') {
                expect(tooltip).toBe('Return to Japan');
                expect(ariaLabel).toBe('Return to Japan view');
                expect(loading).toBe('Loading...');
              } else if (language === 'ja') {
                expect(tooltip).toBe('日本に戻る');
                expect(ariaLabel).toBe('日本の地図に戻る');
                expect(loading).toBe('読み込み中...');
              }

              // Verify current language is set correctly
              expect(i18n.language).toBe(language);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});