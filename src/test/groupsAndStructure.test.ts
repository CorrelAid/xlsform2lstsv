import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowsByClass, findRowByName } from './helpers';

describe('Groups and Survey Structure', () => {
	describe('explicit groups', () => {
		test('converts begin_group and end_group', async () => {
			const survey = [
				{ type: 'begin_group', name: 'demo', label: 'Demographics' },
				{ type: 'text', name: 'name', label: 'Name' },
				{ type: 'integer', name: 'age', label: 'Age' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			expect(groups.length).toBeGreaterThan(0);
			const demoGroup = findRowByName(rows, 'demo');
			expect(demoGroup?.text).toBe('Demographics');
		});

		

		test('auto-generates group name if missing', async () => {
			const survey = [
				{ type: 'begin_group', label: 'Unnamed Group' },
				{ type: 'text', name: 'q1', label: 'Question' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			// Should have auto-generated group name
			const autoGroup = groups.find(g => g.name.match(/^G\d+$/));
			expect(autoGroup).toBeDefined();
			expect(autoGroup?.text).toBe('Unnamed Group');
		});

		test('handles multiple groups', async () => {
			const survey = [
				{ type: 'begin_group', name: 'g1', label: 'Group 1' },
				{ type: 'text', name: 'q1', label: 'Q1' },
				{ type: 'end_group' },
				{ type: 'begin_group', name: 'g2', label: 'Group 2' },
				{ type: 'text', name: 'q2', label: 'Q2' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			// Should have at least 2 groups (plus possible default)
			expect(groups.length).toBeGreaterThanOrEqual(2);
			expect(findRowByName(rows, 'g1')).toBeDefined();
			expect(findRowByName(rows, 'g2')).toBeDefined();
		});

		test('converts group with hint', async () => {
			const survey = [
				{
					type: 'begin_group',
					name: 'pers',
					label: 'Personal Info',
					hint: 'Please provide your personal information'
				},
				{ type: 'text', name: 'name', label: 'Name' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const group = findRowByName(rows, 'pers');

			expect(group?.help).toBe('Please provide your personal information');
		});

		test('converts group with relevance', async () => {
			const survey = [
				{ type: 'select_one yesno', name: 'hasinfo', label: 'Provide info?' },
				{
					type: 'begin_group',
					name: 'det',
					label: 'Details',
					relevant: "${has_info} = 'yes'"
				},
				{ type: 'text', name: 'det', label: 'Detail' },
				{ type: 'end_group' }
			];

			const choices = [
				{ list_name: 'yesno', name: 'yes', label: 'Yes' },
				{ list_name: 'yesno', name: 'no', label: 'No' }
			];

			const rows = await convertAndParse(survey, choices);
			const group = findRowByName(rows, 'det');

			expect(group?.relevance).toContain('hasinfo'); // Underscores removed
		});
	});

	describe('nested groups (flattening)', () => {
		test('flattens parent-only groups into note questions', async () => {
			const survey = [
				{ type: 'begin_group', name: 'outer', label: 'Outer Group' },
				{ type: 'text', name: 'q1', label: 'Question 1' },
				{ type: 'begin_group', name: 'parent_only', label: 'Section Header' },
				{ type: 'begin_group', name: 'inner', label: 'Inner Group' },
				{ type: 'text', name: 'q2', label: 'Question 2' },
				{ type: 'end_group' },
				{ type: 'end_group' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');
			const groupNames = groups.map(g => g.name);

			// parent_only should NOT be a group (it has no direct questions)
			expect(groupNames).not.toContain('parentonly');

			// outer and inner should be groups
			expect(groupNames).toContain('outer');
			expect(groupNames).toContain('inner');

			// parent_only should appear as a note question (type X)
			const noteRow = rows.find(r => r.class === 'Q' && r.name === 'parentonly');
			expect(noteRow).toBeDefined();
			expect(noteRow!['type/scale']).toBe('X');
			expect(noteRow!.text).toBe('Section Header');
		});

		test('keeps groups with direct questions as G rows', async () => {
			const survey = [
				{ type: 'begin_group', name: 'g1', label: 'Group With Questions' },
				{ type: 'text', name: 'q1', label: 'Q1' },
				{ type: 'begin_group', name: 'g2', label: 'Nested Group' },
				{ type: 'text', name: 'q2', label: 'Q2' },
				{ type: 'end_group' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');
			const groupNames = groups.map(g => g.name);

			// Both should be groups (both have direct questions)
			expect(groupNames).toContain('g1');
			expect(groupNames).toContain('g2');
		});

		test('restores parent group context after nested group ends', async () => {
			const survey = [
				{ type: 'begin_group', name: 'parent', label: 'Parent' },
				{ type: 'text', name: 'q1', label: 'Before nested' },
				{ type: 'begin_group', name: 'child', label: 'Child' },
				{ type: 'text', name: 'q2', label: 'In child' },
				{ type: 'end_group' },
				{ type: 'begin_group', name: 'sibling', label: 'Sibling' },
				{ type: 'text', name: 'q3', label: 'In sibling' },
				{ type: 'end_group' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');
			const groupNames = groups.map(g => g.name);

			expect(groupNames).toContain('parent');
			expect(groupNames).toContain('child');
			expect(groupNames).toContain('sibling');
		});

		test('handles deeply nested parent-only groups', async () => {
			const survey = [
				{ type: 'begin_group', name: 'level1', label: 'Level 1 Header' },
				{ type: 'begin_group', name: 'level2', label: 'Level 2 Header' },
				{ type: 'begin_group', name: 'leaf', label: 'Leaf Group' },
				{ type: 'text', name: 'q1', label: 'Question' },
				{ type: 'end_group' },
				{ type: 'end_group' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');
			const groupNames = groups.map(g => g.name);

			// Only leaf should be a group
			expect(groupNames).toContain('leaf');
			expect(groupNames).not.toContain('level1');
			expect(groupNames).not.toContain('level2');

			// Both parent-only groups should be note questions
			const level1Note = rows.find(r => r.class === 'Q' && r.name === 'level1');
			const level2Note = rows.find(r => r.class === 'Q' && r.name === 'level2');
			expect(level1Note).toBeDefined();
			expect(level1Note!['type/scale']).toBe('X');
			expect(level2Note).toBeDefined();
			expect(level2Note!['type/scale']).toBe('X');
		});

		test('flattens 3-layer nesting with mixed content across branches', async () => {
			// Structure:
			//   section (parent-only)
			//     subsectionA (parent-only)
			//       leafA (has questions)
			//         q1, q2
			//     subsectionB (has questions)
			//       q3
			//       leafB (has questions)
			//         q4
			const survey = [
				{ type: 'begin_group', name: 'section', label: 'Main Section' },
				{ type: 'begin_group', name: 'subsection_a', label: 'Subsection A' },
				{ type: 'begin_group', name: 'leaf_a', label: 'Leaf A' },
				{ type: 'text', name: 'q1', label: 'Question 1' },
				{ type: 'text', name: 'q2', label: 'Question 2' },
				{ type: 'end_group' },
				{ type: 'end_group' },
				{ type: 'begin_group', name: 'subsection_b', label: 'Subsection B' },
				{ type: 'text', name: 'q3', label: 'Question 3' },
				{ type: 'begin_group', name: 'leaf_b', label: 'Leaf B' },
				{ type: 'text', name: 'q4', label: 'Question 4' },
				{ type: 'end_group' },
				{ type: 'end_group' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');
			const groupNames = groups.map(g => g.name);

			// section and subsection_a are parent-only → flattened to notes
			expect(groupNames).not.toContain('section');
			expect(groupNames).not.toContain('subsectiona');

			// leaf_a, subsection_b (has direct q3), leaf_b → kept as groups
			expect(groupNames).toContain('leafa');
			expect(groupNames).toContain('subsectionb');
			expect(groupNames).toContain('leafb');

			// Flattened groups become note questions (type X)
			const sectionNote = rows.find(r => r.class === 'Q' && r.name === 'section');
			expect(sectionNote).toBeDefined();
			expect(sectionNote!['type/scale']).toBe('X');
			expect(sectionNote!.text).toBe('Main Section');

			const subANote = rows.find(r => r.class === 'Q' && r.name === 'subsectiona');
			expect(subANote).toBeDefined();
			expect(subANote!['type/scale']).toBe('X');
			expect(subANote!.text).toBe('Subsection A');

			// Notes should appear inside the first child group they precede
			const allRows = rows.filter(r => r.class === 'G' || r.class === 'Q');
			const leafAGroupIdx = allRows.findIndex(r => r.class === 'G' && r.name === 'leafa');
			const sectionNoteIdx = allRows.findIndex(r => r.class === 'Q' && r.name === 'section');
			const subANoteIdx = allRows.findIndex(r => r.class === 'Q' && r.name === 'subsectiona');

			// Both notes should come after the leaf_a group row (they're emitted into that group)
			expect(sectionNoteIdx).toBeGreaterThan(leafAGroupIdx);
			expect(subANoteIdx).toBeGreaterThan(leafAGroupIdx);

			// All 4 questions should be present
			const questions = rows.filter(r => r.class === 'Q' && r['type/scale'] !== 'X');
			const qNames = questions.map(q => q.name);
			expect(qNames).toContain('q1');
			expect(qNames).toContain('q2');
			expect(qNames).toContain('q3');
			expect(qNames).toContain('q4');
		});

		test('flattens 3 layers of parent-only groups preserving order', async () => {
			// 3 levels of nesting, all parent-only except the innermost
			const survey = [
				{ type: 'begin_group', name: 'l1', label: 'Layer 1' },
				{ type: 'begin_group', name: 'l2', label: 'Layer 2' },
				{ type: 'begin_group', name: 'l3', label: 'Layer 3' },
				{ type: 'text', name: 'deep_q', label: 'Deep Question' },
				{ type: 'end_group' },
				{ type: 'end_group' },
				{ type: 'end_group' },
				{ type: 'begin_group', name: 'flat', label: 'Flat Group' },
				{ type: 'text', name: 'flat_q', label: 'Flat Question' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');
			const groupNames = groups.map(g => g.name);

			// Only l3 and flat should be groups
			expect(groupNames).toContain('l3');
			expect(groupNames).toContain('flat');
			expect(groupNames).not.toContain('l1');
			expect(groupNames).not.toContain('l2');
			expect(groups).toHaveLength(2);

			// l1 and l2 should be note questions inside l3
			const notes = rows.filter(r => r.class === 'Q' && r['type/scale'] === 'X');
			const noteNames = notes.map(n => n.name);
			expect(noteNames).toContain('l1');
			expect(noteNames).toContain('l2');

			// Notes for l1 and l2 should appear before the deep_q question
			const allQ = rows.filter(r => r.class === 'Q');
			const l1Idx = allQ.findIndex(r => r.name === 'l1');
			const l2Idx = allQ.findIndex(r => r.name === 'l2');
			const deepQIdx = allQ.findIndex(r => r.name === 'deepq');
			expect(l1Idx).toBeLessThan(deepQIdx);
			expect(l2Idx).toBeLessThan(deepQIdx);

			// l3 group should come before flat group
			const l3Idx = groups.findIndex(g => g.name === 'l3');
			const flatIdx = groups.findIndex(g => g.name === 'flat');
			expect(l3Idx).toBeLessThan(flatIdx);
		});

		test('flattens multilingual 3-layer nesting with translations', async () => {
			const survey = [
				{
					type: 'begin_group', name: 'outer', label: { en: 'Outer', de: 'Äußere' },
					_languages: ['en', 'de']
				},
				{
					type: 'begin_group', name: 'middle', label: { en: 'Middle', de: 'Mittlere' },
					_languages: ['en', 'de']
				},
				{
					type: 'begin_group', name: 'inner', label: { en: 'Inner', de: 'Innere' },
					_languages: ['en', 'de']
				},
				{
					type: 'text', name: 'q1', label: { en: 'Question', de: 'Frage' },
					_languages: ['en', 'de']
				},
				{ type: 'end_group' },
				{ type: 'end_group' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');
			const groupNames = groups.map(g => g.name);

			// Only inner should be a group (outer and middle are parent-only)
			expect(groupNames).toContain('inner');
			expect(groupNames).not.toContain('outer');
			expect(groupNames).not.toContain('middle');

			// inner group should have multilingual G rows via type/scale key
			const innerGroups = groups.filter(g => g.name === 'inner');
			expect(innerGroups).toHaveLength(2);
			const innerEn = innerGroups.find(g => g.language === 'en');
			const innerDe = innerGroups.find(g => g.language === 'de');
			expect(innerEn?.text).toBe('Inner');
			expect(innerDe?.text).toBe('Innere');

			// Both share the same type/scale (group sequence key)
			expect(innerEn!['type/scale']).toBe(innerDe!['type/scale']);

			// Flattened parent-only groups become multilingual notes
			const outerNotes = rows.filter(r => r.class === 'Q' && r.name === 'outer');
			expect(outerNotes).toHaveLength(2);
			expect(outerNotes.find(n => n.language === 'en')?.text).toBe('Outer');
			expect(outerNotes.find(n => n.language === 'de')?.text).toBe('Äußere');

			const middleNotes = rows.filter(r => r.class === 'Q' && r.name === 'middle');
			expect(middleNotes).toHaveLength(2);
			expect(middleNotes.find(n => n.language === 'en')?.text).toBe('Middle');
			expect(middleNotes.find(n => n.language === 'de')?.text).toBe('Mittlere');
		});
	});

	describe('default group', () => {
		test('creates default group when no groups defined', async () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question 1' },
				{ type: 'text', name: 'q2', label: 'Question 2' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			// Should have a default group
			expect(groups.length).toBeGreaterThan(0);
			expect(groups[0].text).toBe('Questions');
		});

		test('does not create default group when explicit groups exist', async () => {
			const survey = [
				{ type: 'begin_group', name: 'g1', label: 'Group 1' },
				{ type: 'text', name: 'q1', label: 'Q1' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const groups = findRowsByClass(rows, 'G');

			// Should not have a default "Questions" group
			const defaultGroup = groups.find(g => g.text === 'Questions' && g.name === 'Questions');
			expect(defaultGroup).toBeUndefined();
		});
	});

	describe('survey settings', () => {
		test('creates survey settings rows', async () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question' }
			];

			const settings = [
				{ form_title: 'My Test Survey', default_language: 'en' }
			];

			const rows = await convertAndParse(survey, [], settings);
			const settingsRows = findRowsByClass(rows, 'S');
			const langRows = findRowsByClass(rows, 'SL');

			expect(settingsRows.length).toBeGreaterThan(0);
			expect(langRows.length).toBeGreaterThan(0);

			// Check title
			const titleRow = langRows.find(r => r.name === 'surveyls_title');
			expect(titleRow?.text).toBe('My Test Survey');

			// Check language
			const langRow = settingsRows.find(r => r.name === 'language');
			expect(langRow?.text).toBe('en');
		});

		test('uses default values for missing settings', async () => {
			const survey = [
				{ type: 'text', name: 'q1', label: 'Question' }
			];

			const rows = await convertAndParse(survey, [], [{}]);
			const langRows = findRowsByClass(rows, 'SL');

			const titleRow = langRows.find(r => r.name === 'surveyls_title');
			expect(titleRow?.text).toBe('Untitled Survey');
		});


	});

	describe('overall structure', () => {
		test('creates complete survey structure', async () => {
			const survey = [
				{ type: 'note', name: 'intro', label: 'Welcome!' },
				{ type: 'begin_group', name: 'demo', label: 'Demographics' },
				{ type: 'text', name: 'name', label: 'Name' },
				{ type: 'integer', name: 'age', label: 'Age' },
				{ type: 'end_group' },
				{ type: 'begin_group', name: 'feed', label: 'Feedback' },
				{ type: 'text', name: 'comm', label: 'Comments' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);

			// Should have S (settings), SL (language settings), G (groups), Q (questions)
			expect(findRowsByClass(rows, 'S').length).toBeGreaterThan(0);
			expect(findRowsByClass(rows, 'SL').length).toBeGreaterThan(0);
			expect(findRowsByClass(rows, 'G').length).toBeGreaterThanOrEqual(2);
			expect(findRowsByClass(rows, 'Q').length).toBeGreaterThanOrEqual(4);
		});

		test('preserves question order within groups', async () => {
			const survey = [
				{ type: 'begin_group', name: 'g1', label: 'Group' },
				{ type: 'text', name: 'q1', label: 'First' },
				{ type: 'text', name: 'q2', label: 'Second' },
				{ type: 'text', name: 'q3', label: 'Third' },
				{ type: 'end_group' }
			];

			const rows = await convertAndParse(survey);
			const questions = findRowsByClass(rows, 'Q');

			const q1Index = questions.findIndex(q => q.name === 'q1');
			const q2Index = questions.findIndex(q => q.name === 'q2');
			const q3Index = questions.findIndex(q => q.name === 'q3');

			expect(q1Index).toBeLessThan(q2Index);
			expect(q2Index).toBeLessThan(q3Index);
		});

		test('retains order of mixed question types across multiple groups', async () => {
			const survey = [
				{ type: 'begin_group', name: 'g1', label: 'Group 1' },
				{ type: 'note', name: 'intro', label: 'Welcome note' },
				{ type: 'text', name: 'name', label: 'Your name' },
				{ type: 'select_one yesno', name: 'agree', label: 'Do you agree?' },
				{ type: 'integer', name: 'count', label: 'How many?' },
				{ type: 'end_group' },
				{ type: 'begin_group', name: 'g2', label: 'Group 2' },
				{ type: 'text', name: 'addr', label: 'Address' },
				{ type: 'select_multiple colors', name: 'favcolors', label: 'Favorite colors' },
				{ type: 'note', name: 'outro', label: 'Thank you' },
				{ type: 'end_group' }
			];

			const choices = [
				{ list_name: 'yesno', name: 'yes', label: 'Yes' },
				{ list_name: 'yesno', name: 'no', label: 'No' },
				{ list_name: 'colors', name: 'red', label: 'Red' },
				{ list_name: 'colors', name: 'blue', label: 'Blue' }
			];

			const rows = await convertAndParse(survey, choices);
			const questions = findRowsByClass(rows, 'Q');

			// Questions within g1 should retain their defined order
			const introIdx = questions.findIndex(q => q.name === 'intro');
			const nameIdx = questions.findIndex(q => q.name === 'name');
			const agreeIdx = questions.findIndex(q => q.name === 'agree');
			const countIdx = questions.findIndex(q => q.name === 'count');

			expect(introIdx).toBeLessThan(nameIdx);
			expect(nameIdx).toBeLessThan(agreeIdx);
			expect(agreeIdx).toBeLessThan(countIdx);

			// Questions within g2 should retain their defined order
			const addrIdx = questions.findIndex(q => q.name === 'addr');
			const favcolorsIdx = questions.findIndex(q => q.name === 'favcolors');
			const outroIdx = questions.findIndex(q => q.name === 'outro');

			expect(addrIdx).toBeLessThan(favcolorsIdx);
			expect(favcolorsIdx).toBeLessThan(outroIdx);

			// g1 questions should all come before g2 questions
			expect(countIdx).toBeLessThan(addrIdx);
		});

		test('retains order with nested groups and flattened notes', async () => {
			const survey = [
				{ type: 'begin_group', name: 'wrapper', label: 'Wrapper' },
				{ type: 'begin_group', name: 'inner', label: 'Inner Group' },
				{ type: 'text', name: 'q1', label: 'First' },
				{ type: 'text', name: 'q2', label: 'Second' },
				{ type: 'end_group' },
				{ type: 'end_group' },
				{ type: 'begin_group', name: 'second', label: 'Second Group' },
				{ type: 'text', name: 'q3', label: 'Third' },
				{ type: 'select_one yn', name: 'q4', label: 'Fourth' },
				{ type: 'text', name: 'q5', label: 'Fifth' },
				{ type: 'end_group' }
			];

			const choices = [
				{ list_name: 'yn', name: 'y', label: 'Yes' },
				{ list_name: 'yn', name: 'n', label: 'No' }
			];

			const rows = await convertAndParse(survey, choices);
			const questions = findRowsByClass(rows, 'Q');

			// wrapper is parent-only, so it becomes a note inside inner
			const wrapperNote = questions.find(q => q.name === 'wrapper');
			expect(wrapperNote).toBeDefined();
			expect(wrapperNote!['type/scale']).toBe('X');

			// The flattened note should come before q1 and q2 within inner group
			const wrapperIdx = questions.findIndex(q => q.name === 'wrapper');
			const q1Idx = questions.findIndex(q => q.name === 'q1');
			const q2Idx = questions.findIndex(q => q.name === 'q2');

			expect(wrapperIdx).toBeLessThan(q1Idx);
			expect(q1Idx).toBeLessThan(q2Idx);

			// Second group questions retain order
			const q3Idx = questions.findIndex(q => q.name === 'q3');
			const q4Idx = questions.findIndex(q => q.name === 'q4');
			const q5Idx = questions.findIndex(q => q.name === 'q5');

			expect(q3Idx).toBeLessThan(q4Idx);
			expect(q4Idx).toBeLessThan(q5Idx);

			// inner group questions come before second group questions
			expect(q2Idx).toBeLessThan(q3Idx);
		});
	});
});
