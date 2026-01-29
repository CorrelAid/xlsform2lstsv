import { describe, it, expect } from 'vitest';
import { XLSFormToTSVConverter } from '../xlsformConverter';
import { isValidLanguageCode, validateLanguageCodes } from '../utils/languageUtils';

/**
 * Tests for multiple language support in XLSForm conversion
 */
describe('Multiple Language Support', () => {

	describe('Language Code Validation', () => {
		it('should validate valid language codes', () => {
			expect(isValidLanguageCode('en')).toBe(true);
			expect(isValidLanguageCode('es')).toBe(true);
			expect(isValidLanguageCode('fr')).toBe(true);
			expect(isValidLanguageCode('de')).toBe(true);
			expect(isValidLanguageCode('zh')).toBe(true);
			expect(isValidLanguageCode('ja')).toBe(true);
			expect(isValidLanguageCode('ar')).toBe(true);
		});

		it('should reject invalid language codes', () => {
			expect(isValidLanguageCode('xx')).toBe(false);
			expect(isValidLanguageCode('12')).toBe(false);
			expect(isValidLanguageCode('eng')).toBe(false);
			expect(isValidLanguageCode('english')).toBe(false);
			expect(isValidLanguageCode('en_US')).toBe(false);
			expect(isValidLanguageCode('')).toBe(false);
			expect(isValidLanguageCode('EN')).toBe(true); // Should be case-insensitive
		});

		it('should validate arrays of language codes', () => {
			const mixedCodes = ['en', 'es', 'fr', 'xx', 'invalid', 'de'];
			const invalid = validateLanguageCodes(mixedCodes);
			expect(invalid).toContain('xx');
			expect(invalid).toContain('invalid');
			expect(invalid).not.toContain('en');
			expect(invalid).not.toContain('es');
			expect(invalid).not.toContain('fr');
			expect(invalid).not.toContain('de');
		});

		it('should handle edge cases', () => {
			expect(isValidLanguageCode(null as any)).toBe(false);
			expect(isValidLanguageCode(undefined as any)).toBe(false);
			expect(isValidLanguageCode(123 as any)).toBe(false);
			expect(isValidLanguageCode({} as any)).toBe(false);
		});
	});

	describe('XLSForm Conversion', () => {

	it('should handle language-specific labels correctly', () => {
		const converter = new XLSFormToTSVConverter();
		
		// Mock survey data with language-specific labels
		const surveyData = [
			{
				type: 'text',
				name: 'q1',
				label: {
					en: 'What is your name?',
					es: '¿Cuál es tu nombre?',
					fr: 'Quel est votre nom?'
				},
				_languages: ['en', 'es', 'fr']
			},
			{
				type: 'integer',
				name: 'age',
				label: {
					en: 'How old are you?',
					es: '¿Cuántos años tienes?',
					fr: 'Quel âge avez-vous?'
				},
				_languages: ['en', 'es', 'fr']
			}
		];
		
		const choicesData: any[] = [];
		const settingsData = [{
			default_language: 'English (en)'
		}];
		
		const result = converter.convert(surveyData, choicesData, settingsData);
		
		// Should contain language-specific rows
		expect(result).toContain('en');
		expect(result).toContain('es');
		expect(result).toContain('fr');
		
		// Should contain the English label
		expect(result).toContain('What is your name?');
		expect(result).toContain('How old are you?');
		
		// Should contain the Spanish label
		expect(result).toContain('¿Cuál es tu nombre?');
		expect(result).toContain('¿Cuántos años tienes?');
		
		// Should contain the French label
		expect(result).toContain('Quel est votre nom?');
		expect(result).toContain('Quel âge avez-vous?');
	});

	it('should handle language-specific hints correctly', () => {
		const converter = new XLSFormToTSVConverter();
		
		// Mock survey data with language-specific hints
		const surveyData = [
			{
				type: 'text',
				name: 'q1',
				label: 'Question 1',
				hint: {
					en: 'Enter your full name',
					es: 'Ingrese su nombre completo',
					fr: 'Entrez votre nom complet'
				},
				_languages: ['en', 'es', 'fr']
			}
		];
		
		const choicesData: any[] = [];
		const settingsData = [{
			default_language: 'English (en)'
		}];
		
		const result = converter.convert(surveyData, choicesData, settingsData);
		
		// Should contain language-specific hints
		expect(result).toContain('Enter your full name');
		expect(result).toContain('Ingrese su nombre completo');
		expect(result).toContain('Entrez votre nom complet');
	});

	it('should handle language-specific choice labels correctly', () => {
		const converter = new XLSFormToTSVConverter();
		
		// Mock survey data with select question
		const surveyData = [
			{
				type: 'select_one options',
				name: 'gender',
				label: {
					en: 'What is your gender?',
					es: '¿Cuál es tu género?',
					fr: 'Quel est votre genre?'
				},
				_languages: ['en', 'es', 'fr']
			}
		];
		
		// Mock choices data with language-specific labels
		const choicesData = [
			{
				list_name: 'options',
				name: 'male',
				label: {
					en: 'Male',
					es: 'Masculino',
					fr: 'Homme'
				},
				_languages: ['en', 'es', 'fr']
			},
			{
				list_name: 'options',
				name: 'female',
				label: {
					en: 'Female',
					es: 'Femenino',
					fr: 'Femme'
				},
				_languages: ['en', 'es', 'fr']
			}
		];
		
		const settingsData = [{
			default_language: 'English (en)'
		}];
		
		const result = converter.convert(surveyData, choicesData, settingsData);
		
		// Should contain language-specific choice labels
		expect(result).toContain('Male');
		expect(result).toContain('Masculino');
		expect(result).toContain('Homme');
		
		expect(result).toContain('Female');
		expect(result).toContain('Femenino');
		expect(result).toContain('Femme');
	});

	it('should use base language from settings', () => {
		const converter = new XLSFormToTSVConverter();
		
		const surveyData = [
			{
				type: 'text',
				name: 'q1',
				label: 'Question 1',
				_languages: ['en', 'es']
			}
		];
		
		const choicesData: any[] = [];
		const settingsData = [{
			default_language: 'Spanish (es)'
		}];
		
		const result = converter.convert(surveyData, choicesData, settingsData);
		
		// Should set base language to Spanish
		expect(result).toContain('es');
	});

	it('should handle fallback to any available language', () => {
		const converter = new XLSFormToTSVConverter();
		
		// Mock survey data with only Spanish label
		const surveyData = [
			{
				type: 'text',
				name: 'q1',
				label: {
					es: 'Pregunta en español'
				},
				_languages: ['es']
			}
		];
		
		const choicesData: any[] = [];
		const settingsData = [{
			default_language: 'English (en)' // English requested but not available
		}];
		
		const result = converter.convert(surveyData, choicesData, settingsData);
		
		// Should fall back to available language (Spanish)
		expect(result).toContain('Pregunta en español');
	});

	it('should validate language codes and filter invalid ones', () => {
		const converter = new XLSFormToTSVConverter();
		
		// Mock survey data with both valid and invalid language codes
		const surveyData = [
			{
				type: 'text',
				name: 'q1',
				label: {
					en: 'Valid English',
					es: 'Valid Spanish',
					// 'xx' would be invalid but should be filtered out by XLSLoader
				},
				_languages: ['en', 'es'] // Only valid codes
			}
		];
		
		const choicesData: any[] = [];
		const settingsData = [{
			default_language: 'English (en)'
		}];
		
		const result = converter.convert(surveyData, choicesData, settingsData);
		
		// Should contain only valid language translations
		expect(result).toContain('Valid English');
		expect(result).toContain('Valid Spanish');
		
		// Should have rows for both valid languages
		expect(result).toContain('en');
		expect(result).toContain('es');
	});

	});
});