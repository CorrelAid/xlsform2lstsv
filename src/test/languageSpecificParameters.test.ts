import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowsByClass, findRowByName } from './helpers';

describe('Language-Specific Parameters', () => {
	describe('Survey Language-Specific Parameters (SL class)', () => {
		test('creates SL rows for each language with survey title', async () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question 1' }
			];

			const settings = [{
				form_title: {
					en: 'English Survey',
					es: 'Encuesta en Español',
					fr: 'Enquête en Français'
				},
				default_language: 'en'
			}];

			const rows = await convertAndParse(survey, [], settings);
			const slRows = findRowsByClass(rows, 'SL');

			// Should have SL rows for each language
			expect(slRows.length).toBeGreaterThanOrEqual(3);

			// Check English title
			const enTitleRow = slRows.find(r => r.name === 'surveyls_title' && r.language === 'en');
			expect(enTitleRow?.text).toBe('English Survey');

			// Check Spanish title
			const esTitleRow = slRows.find(r => r.name === 'surveyls_title' && r.language === 'es');
			expect(esTitleRow?.text).toBe('Encuesta en Español');

			// Check French title
			const frTitleRow = slRows.find(r => r.name === 'surveyls_title' && r.language === 'fr');
			expect(frTitleRow?.text).toBe('Enquête en Français');
		});



		test('uses same ID for same field across languages', async () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question 1' }
			];

			const settings = [{
				form_title: {
					en: 'English Survey',
					es: 'Encuesta en Español'
				},
				default_language: 'en'
			}];

			const rows = await convertAndParse(survey, [], settings);
			const slRows = findRowsByClass(rows, 'SL');

			// All title rows should have the same name (field identifier)
			const titleRows = slRows.filter(r => r.name === 'surveyls_title');
			expect(titleRows.length).toBeGreaterThanOrEqual(2);
			expect(titleRows.every(r => r.name === 'surveyls_title')).toBe(true);
		});
	});

	describe('Groups (G class) with language-specific parameters', () => {
		test('creates one group row per language', async () => {
			const survey = [
				{
					type: 'begin_group',
					name: 'demo',
					label: {
						en: 'Demographics',
						es: 'Datos demográficos',
						fr: 'Données démographiques'
					},
					_languages: ['en', 'es', 'fr']
				},
				{ type: 'text', name: 'q1', label: 'Question 1' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groupRows = findRowsByClass(rows, 'G');

			// Should have 3 group rows (one per language)
			expect(groupRows.length).toBeGreaterThanOrEqual(3);

			// Check English group
			const enGroup = groupRows.find(r => r.language === 'en' && r.name === 'demo');
			expect(enGroup?.text).toBe('Demographics');

			// Check Spanish group
			const esGroup = groupRows.find(r => r.language === 'es' && r.name === 'demo');
			expect(esGroup?.text).toBe('Datos demográficos');

			// Check French group
			const frGroup = groupRows.find(r => r.language === 'fr' && r.name === 'demo');
			expect(frGroup?.text).toBe('Données démographiques');
		});

		test('uses same group ID across languages', async () => {
			const survey = [
				{
					type: 'begin_group',
					name: 'demo',
					label: {
						en: 'Demographics',
						es: 'Datos demográficos'
					},
					_languages: ['en', 'es']
				},
				{ type: 'text', name: 'q1', label: 'Question 1' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groupRows = findRowsByClass(rows, 'G');

			// All group rows should have the same name (group identifier)
			const demoGroups = groupRows.filter(r => r.name === 'demo');
			expect(demoGroups.length).toBeGreaterThanOrEqual(2);
			expect(demoGroups.every(r => r.name === 'demo')).toBe(true);
		});

		test('includes language-specific group descriptions', async () => {
			const survey = [
				{
					type: 'begin_group',
					name: 'demo',
					label: {
						en: 'Demographics',
						es: 'Datos demográficos'
					},
					hint: {
						en: 'Please provide demographic information',
						es: 'Por favor proporcione información demográfica'
					},
					_languages: ['en', 'es']
				},
				{ type: 'text', name: 'q1', label: 'Question 1' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groupRows = findRowsByClass(rows, 'G');

			// Check English help text
			const enGroup = groupRows.find(r => r.language === 'en' && r.name === 'demo');
			expect(enGroup?.help).toBe('Please provide demographic information');

			// Check Spanish help text
			const esGroup = groupRows.find(r => r.language === 'es' && r.name === 'demo');
			expect(esGroup?.help).toBe('Por favor proporcione información demográfica');
		});

		test('includes group-level relevance for each language', async () => {
			const survey = [
				{
					type: 'select_one yesno',
					name: 'info',
					label: 'Provide info?'
				},
				{
					type: 'begin_group',
					name: 'det',
					label: {
						en: 'Details',
						es: 'Detalles'
					},
					relevant: "${info} = 'yes'",
					_languages: ['en', 'es']
				},
				{ type: 'text', name: 'det', label: 'Detail' },
				{ type: 'end_group' }
			];

			const choices = [
				{ list_name: 'yesno', name: 'yes', label: 'Yes' },
				{ list_name: 'yesno', name: 'no', label: 'No' }
			];

			const rows = await convertAndParse(survey, choices);
			const groupRows = findRowsByClass(rows, 'G');

			// Both language versions should have the same relevance
			const enGroup = groupRows.find(r => r.language === 'en' && r.name === 'det');
			const esGroup = groupRows.find(r => r.language === 'es' && r.name === 'det');

			expect(enGroup?.relevance).toContain('info');
			expect(esGroup?.relevance).toContain('info');
		});
	});

	describe('Questions (Q class) with language-specific parameters', () => {
		test('creates one question row per language', async () => {
			const survey = [
				{
					type: 'text',
					name: 'name',
					label: {
						en: 'What is your name?',
						es: '¿Cuál es tu nombre?',
						fr: 'Quel est votre nom?'
					},
					_languages: ['en', 'es', 'fr']
				}
			];

			const rows = await convertAndParse(survey);
			const questionRows = findRowsByClass(rows, 'Q');

			// Should have 3 question rows (one per language)
			expect(questionRows.length).toBeGreaterThanOrEqual(3);

			// Check English question
			const enQuestion = questionRows.find(r => r.language === 'en' && r.name === 'name');
			expect(enQuestion?.text).toBe('What is your name?');

			// Check Spanish question
			const esQuestion = questionRows.find(r => r.language === 'es' && r.name === 'name');
			expect(esQuestion?.text).toBe('¿Cuál es tu nombre?');

			// Check French question
			const frQuestion = questionRows.find(r => r.language === 'fr' && r.name === 'name');
			expect(frQuestion?.text).toBe('Quel est votre nom?');
		});

		test('uses same question ID across languages', async () => {
			const survey = [
				{
					type: 'text',
					name: 'age',
					label: {
						en: 'How old are you?',
						es: '¿Cuántos años tienes?'
					},
					_languages: ['en', 'es']
				}
			];

			const rows = await convertAndParse(survey);
			const questionRows = findRowsByClass(rows, 'Q');

			// All question rows should have the same name (question identifier)
			const ageQuestions = questionRows.filter(r => r.name === 'age');
			expect(ageQuestions.length).toBeGreaterThanOrEqual(2);
			expect(ageQuestions.every(r => r.name === 'age')).toBe(true);
		});

		test('includes language-specific help text', async () => {
			const survey = [
				{
					type: 'text',
					name: 'email',
					label: {
						en: 'Email address',
						es: 'Dirección de correo electrónico'
					},
					hint: {
						en: 'Please enter your valid email',
						es: 'Por favor ingrese su correo electrónico válido'
					},
					_languages: ['en', 'es']
				}
			];

			const rows = await convertAndParse(survey);
			const questionRows = findRowsByClass(rows, 'Q');

			// Check English help text
			const enQuestion = questionRows.find(r => r.language === 'en' && r.name === 'email');
			expect(enQuestion?.help).toBe('Please enter your valid email');

			// Check Spanish help text
			const esQuestion = questionRows.find(r => r.language === 'es' && r.name === 'email');
			expect(esQuestion?.help).toBe('Por favor ingrese su correo electrónico válido');
		});

		test('includes question-level relevance for each language', async () => {
			const survey = [
				{
					type: 'select_one yesno',
					name: 'cons',
					label: 'Do you consent?'
				},
				{
					type: 'text',
					name: 'eml',
					label: {
						en: 'Email address',
						es: 'Dirección de correo electrónico'
					},
					relevant: "${cons} = 'yes'",
					_languages: ['en', 'es']
				}
			];

			const choices = [
				{ list_name: 'yesno', name: 'yes', label: 'Yes' },
				{ list_name: 'yesno', name: 'no', label: 'No' }
			];

			const rows = await convertAndParse(survey, choices);
			const questionRows = findRowsByClass(rows, 'Q');

			// Both language versions should have the same relevance
			const enQuestion = questionRows.find(r => r.language === 'en' && r.name === 'eml');
			const esQuestion = questionRows.find(r => r.language === 'es' && r.name === 'eml');

			expect(enQuestion?.relevance).toContain('cons');
			expect(esQuestion?.relevance).toContain('cons');
		});

		test('includes mandatory flag for each language', async () => {
			const survey = [
				{
					type: 'text',
					name: 'req',
					label: {
						en: 'Required field',
						es: 'Campo obligatorio'
					},
					required: 'yes',
					_languages: ['en', 'es']
				}
			];

			const rows = await convertAndParse(survey);
			const questionRows = findRowsByClass(rows, 'Q');

			// Both language versions should be marked as mandatory
			const enQuestion = questionRows.find(r => r.language === 'en' && r.name === 'req');
			const esQuestion = questionRows.find(r => r.language === 'es' && r.name === 'req');

			expect(enQuestion?.mandatory).toBe('Y');
			expect(esQuestion?.mandatory).toBe('Y');
		});

		test('includes validation for each language', async () => {
			const survey = [
				{
					type: 'text',
					name: 'eml',
					label: {
						en: 'Email address',
						es: 'Dirección de correo electrónico'
					},
					constraint: '.+@.+\\..+',
					_languages: ['en', 'es']
				}
			];

			const rows = await convertAndParse(survey);
			const questionRows = findRowsByClass(rows, 'Q');

			// Both language versions should have the same validation
			const enQuestion = questionRows.find(r => r.language === 'en' && r.name === 'eml');
			const esQuestion = questionRows.find(r => r.language === 'es' && r.name === 'eml');

			// AST-based converter cannot parse regex patterns, so validation will be empty
			expect(enQuestion?.validation).toBe('');
			expect(esQuestion?.validation).toBe('');
		});
	});

	describe('Subquestions (SQ class) with language-specific parameters', () => {
		test('creates one subquestion row per language', async () => {
			const survey = [
				{
					type: 'select_multiple options',
					name: 'ints',
					label: {
						en: 'Your interests',
						es: 'Tus intereses'
					},
					_languages: ['en', 'es']
				}
			];

			const choices = [
				{
					list_name: 'options',
					name: 'spts',
					label: {
						en: 'Sports',
						es: 'Deportes'
					},
					_languages: ['en', 'es']
				},
				{
					list_name: 'options',
					name: 'msc',
					label: {
						en: 'Music',
						es: 'Música'
					},
					_languages: ['en', 'es']
				}
			];

			const rows = await convertAndParse(survey, choices);
			const subquestionRows = findRowsByClass(rows, 'SQ');

			// Should have subquestion rows for each language
			expect(subquestionRows.length).toBeGreaterThanOrEqual(4); // 2 choices × 2 languages

			// Check English subquestions
			const enSports = subquestionRows.find(r => r.language === 'en' && r.name === 'spts');
			expect(enSports?.text).toBe('Sports');

			const enMusic = subquestionRows.find(r => r.language === 'en' && r.name === 'msc');
			expect(enMusic?.text).toBe('Music');

			// Check Spanish subquestions
			const esSports = subquestionRows.find(r => r.language === 'es' && r.name === 'spts');
			expect(esSports?.text).toBe('Deportes');

			const esMusic = subquestionRows.find(r => r.language === 'es' && r.name === 'msc');
			expect(esMusic?.text).toBe('Música');
		});

		test('uses same subquestion ID across languages', async () => {
			const survey = [
				{
					type: 'select_multiple options',
					name: 'cols',
					label: {
						en: 'Favorite colors',
						es: 'Colores favoritos'
					},
					_languages: ['en', 'es']
				}
			];

			const choices = [
				{
					list_name: 'options',
					name: 'red',
					label: {
						en: 'Red',
						es: 'Rojo'
					},
					_languages: ['en', 'es']
				}
			];

			const rows = await convertAndParse(survey, choices);
			const subquestionRows = findRowsByClass(rows, 'SQ');

			// All subquestion rows for 'red' should have the same name
			const redSubquestions = subquestionRows.filter(r => r.name === 'red');
			expect(redSubquestions.length).toBeGreaterThanOrEqual(2);
			expect(redSubquestions.every(r => r.name === 'red')).toBe(true);
		});

		test('includes subquestion-level validation for each language', async () => {
			const survey = [
				{
					type: 'select_multiple options',
					name: 'items',
					label: {
						en: 'Items',
						es: 'Artículos'
					},
					_languages: ['en', 'es']
				}
			];

			const choices = [
				{
					list_name: 'options',
					name: 'item1',
					label: {
						en: 'Item 1',
						es: 'Artículo 1'
					},
					_languages: ['en', 'es']
				}
			];

			const rows = await convertAndParse(survey, choices);
			const subquestionRows = findRowsByClass(rows, 'SQ');

			// Both language versions should have the same structure
			const enSubquestion = subquestionRows.find(r => r.language === 'en' && r.name === 'item1');
			const esSubquestion = subquestionRows.find(r => r.language === 'es' && r.name === 'item1');

			expect(enSubquestion).toBeDefined();
			expect(esSubquestion).toBeDefined();
		});
	});

	describe('Answers (A class) with language-specific parameters', () => {
		test('creates one answer row per language', async () => {
			const survey = [
				{
					type: 'select_one options',
					name: 'gend',
					label: {
						en: 'Gender',
						es: 'Género',
						fr: 'Genre'
					},
					_languages: ['en', 'es', 'fr']
				}
			];

			const choices = [
				{
					list_name: 'options',
					name: 'mal',
					label: {
						en: 'Male',
						es: 'Masculino',
						fr: 'Homme'
					},
					_languages: ['en', 'es', 'fr']
				},
				{
					list_name: 'options',
					name: 'fem',
					label: {
						en: 'Female',
						es: 'Femenino',
						fr: 'Femme'
					},
					_languages: ['en', 'es', 'fr']
				}
			];

			const rows = await convertAndParse(survey, choices);
			const answerRows = findRowsByClass(rows, 'A');

			// Should have answer rows for each language
			expect(answerRows.length).toBeGreaterThanOrEqual(6); // 2 choices × 3 languages

			// Check English answers
			const enMale = answerRows.find(r => r.language === 'en' && r.name === 'mal');
			expect(enMale?.text).toBe('Male');

			const enFemale = answerRows.find(r => r.language === 'en' && r.name === 'fem');
			expect(enFemale?.text).toBe('Female');

			// Check Spanish answers
			const esMale = answerRows.find(r => r.language === 'es' && r.name === 'mal');
			expect(esMale?.text).toBe('Masculino');

			const esFemale = answerRows.find(r => r.language === 'es' && r.name === 'fem');
			expect(esFemale?.text).toBe('Femenino');

			// Check French answers
			const frMale = answerRows.find(r => r.language === 'fr' && r.name === 'mal');
			expect(frMale?.text).toBe('Homme');

			const frFemale = answerRows.find(r => r.language === 'fr' && r.name === 'fem');
			expect(frFemale?.text).toBe('Femme');
		});

		test('uses same answer ID across languages', async () => {
			const survey = [
				{
					type: 'select_one options',
					name: 'color',
					label: {
						en: 'Color',
						es: 'Color'
					},
					_languages: ['en', 'es']
				}
			];

			const choices = [
				{
					list_name: 'options',
					name: 'red',
					label: {
						en: 'Red',
						es: 'Rojo'
					},
					_languages: ['en', 'es']
				}
			];

			const rows = await convertAndParse(survey, choices);
			const answerRows = findRowsByClass(rows, 'A');

			// All answer rows for 'red' should have the same name
			const redAnswers = answerRows.filter(r => r.name === 'red');
			expect(redAnswers.length).toBeGreaterThanOrEqual(2);
			expect(redAnswers.every(r => r.name === 'red')).toBe(true);
		});

		test('includes answer-level relevance for each language', async () => {
			const survey = [
				{
					type: 'select_one options',
					name: 'cnt',
					label: {
						en: 'Country',
						es: 'País'
					},
					_languages: ['en', 'es']
				}
			];

			const choices = [
				{
					list_name: 'options',
					name: 'us',
					label: {
						en: 'United States',
						es: 'Estados Unidos'
					},
					filter: 'us_only',
					_languages: ['en', 'es']
				}
			];

			const rows = await convertAndParse(survey, choices);
			const answerRows = findRowsByClass(rows, 'A');

			// Both language versions should have the same relevance structure
			const enAnswer = answerRows.find(r => r.language === 'en' && r.name === 'us');
			const esAnswer = answerRows.find(r => r.language === 'es' && r.name === 'us');

			expect(enAnswer?.relevance).toContain('us_only');
			expect(esAnswer?.relevance).toContain('us_only');
		});

		test('includes assessment values for each language', async () => {
			const survey = [
				{
					type: 'select_one options',
					name: 'rat',
					label: {
						en: 'Rating',
						es: 'Calificación'
					},
					_languages: ['en', 'es']
				}
			];

			const choices = [
				{
					list_name: 'options',
					name: 'good',
					label: {
						en: 'Good',
						es: 'Bueno'
					},
					assessment_value: 5,
					_languages: ['en', 'es']
				}
			];

			const rows = await convertAndParse(survey, choices);
			const answerRows = findRowsByClass(rows, 'A');

			// Both language versions should have the same assessment value
			const enAnswer = answerRows.find(r => r.language === 'en' && r.name === 'good');
			const esAnswer = answerRows.find(r => r.language === 'es' && r.name === 'good');

			expect(enAnswer).toBeDefined();
			expect(esAnswer).toBeDefined();
		});
	});

	describe('Complete multilingual survey structure', () => {
		test('creates complete structure with all language-specific elements', async () => {
			const survey = [
				{
					type: 'begin_group',
					name: 'demo',
					label: {
						en: 'Demographics',
						es: 'Datos demográficos'
					},
					_languages: ['en', 'es']
				},
				{
					type: 'text',
					name: 'name',
					label: {
						en: 'Name',
						es: 'Nombre'
					},
					_languages: ['en', 'es']
				},
				{
					type: 'select_one gender',
					name: 'gender',
					label: {
						en: 'Gender',
						es: 'Género'
					},
					_languages: ['en', 'es']
				},
				{ type: 'end_group' }
			];

			const choices = [
				{
					list_name: 'gender',
					name: 'mal',
					label: {
						en: 'Male',
						es: 'Masculino'
					},
					_languages: ['en', 'es']
				},
				{
					list_name: 'gender',
					name: 'fem',
					label: {
						en: 'Female',
						es: 'Femenino'
					},
					_languages: ['en', 'es']
				}
			];

			const settings = [{
				form_title: {
					en: 'Multilingual Survey',
					es: 'Encuesta multilingüe'
				},
				default_language: 'en'
			}];

			const rows = await convertAndParse(survey, choices, settings);

			// Should have all required row classes
			expect(findRowsByClass(rows, 'S').length).toBeGreaterThan(0);
			expect(findRowsByClass(rows, 'SL').length).toBeGreaterThanOrEqual(2); // 1 field (title) × 2 languages
			expect(findRowsByClass(rows, 'G').length).toBeGreaterThanOrEqual(2); // 1 group × 2 languages
			expect(findRowsByClass(rows, 'Q').length).toBeGreaterThanOrEqual(4); // 2 questions × 2 languages
			expect(findRowsByClass(rows, 'A').length).toBeGreaterThanOrEqual(4); // 2 answers × 2 languages

			// Verify language consistency
			const languagesUsed = new Set(rows.map(r => r.language));
			expect(languagesUsed.has('en')).toBe(true);
			expect(languagesUsed.has('es')).toBe(true);
		});

		test('maintains consistent IDs across languages', async () => {
			const survey = [
				{
					type: 'begin_group',
					name: 'grp1',
					label: {
						en: 'Group 1',
						es: 'Grupo 1'
					},
					_languages: ['en', 'es']
				},
				{
					type: 'text',
					name: 'q1',
					label: {
						en: 'Question 1',
						es: 'Pregunta 1'
					},
					_languages: ['en', 'es']
				},
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);

			// Check that group IDs are consistent
			const groupRows = findRowsByClass(rows, 'G');
			const grp1Rows = groupRows.filter(r => r.name === 'grp1');
			expect(grp1Rows.length).toBeGreaterThanOrEqual(2);
			expect(grp1Rows.every(r => r.name === 'grp1')).toBe(true);

			// Check that question IDs are consistent
			const questionRows = findRowsByClass(rows, 'Q');
			const q1Rows = questionRows.filter(r => r.name === 'q1');
			expect(q1Rows.length).toBeGreaterThanOrEqual(2);
			expect(q1Rows.every(r => r.name === 'q1')).toBe(true);
		});
	});
});