/**
 * One-off script to generate docker_tests/fixtures/all_types_survey.xlsx
 * from structured XLSForm data. Run with: node scripts/create_all_types_xlsx.mjs
 */
import * as XLSX from 'xlsx';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../docker_tests/fixtures/all_types_survey.xlsx');

// ── survey sheet ──
const survey = [
	{ type: 'start', name: 'start' },
	{ type: 'end', name: 'end' },
	{ type: 'today', name: 'today' },
	{ type: 'deviceid', name: 'deviceid' },
	{ type: 'username', name: 'username' },
	{ type: 'calculate', name: 'calc1', calculation: '1+1' },
	{ type: 'hidden', name: 'hidden1' },
	{ type: 'audit', name: 'audit' },

	{ type: 'text', name: 'orphan_before', label: 'Wie lautet Ihre Teilnehmer-ID?' },

	{ type: 'begin_group', name: 'basic_types', label: 'Persönliche Angaben' },
	{ type: 'text', name: 'q_text', label: 'Wie heißen Sie (Vor- und Nachname)?' },
	{ type: 'string', name: 'q_string', label: 'Wie lautet Ihre E-Mail-Adresse?' },
	{ type: 'integer', name: 'q_integer', label: 'An wie vielen Workshops haben Sie bisher teilgenommen?' },
	{ type: 'int', name: 'q_int', label: 'An wie vielen Sessions haben Sie heute teilgenommen?' },
	{ type: 'decimal', name: 'q_decimal', label: 'Wie bewerten Sie den Workshop auf einer Skala von 1,0 bis 10,0?' },
	{ type: 'date', name: 'q_date', label: 'Wann sind Sie geboren?' },
	{ type: 'time', name: 'q_time', label: 'Um wie viel Uhr sind Sie angekommen?' },
	{ type: 'datetime', name: 'q_datetime', label: 'Wann haben Sie Ihre Anmeldung abgeschlossen?' },
	{ type: 'select_one yesno', name: 'q_select_one', label: 'Würden Sie diesen Workshop weiterempfehlen?' },
	{ type: 'select_multiple topics', name: 'q_select_multi', label: 'An welchen Tracks haben Sie teilgenommen?' },
	{ type: 'rank aspects', name: 'q_rank', label: 'Ordnen Sie die folgenden Aspekte nach Wichtigkeit' },
	{ type: 'note', name: 'q_note', label: 'Im nächsten Abschnitt bitten wir Sie um Ihr ausführliches Feedback. Bitte nehmen Sie sich Zeit.' },
	{ type: 'end_group' },

	{ type: 'begin_group', name: 'appearances', label: 'Ausführliches Feedback' },
	{ type: 'text', name: 'q_multiline_text', label: 'Beschreiben Sie bitte Ihre Erfahrungen beim Workshop', appearance: 'multiline' },
	{ type: 'string', name: 'q_multiline_string', label: 'Welche Verbesserungsvorschläge haben Sie für künftige Veranstaltungen?', appearance: 'multiline' },
	{ type: 'select_one satisfaction', name: 'q_likert', label: 'Wie zufrieden waren Sie mit der Organisation insgesamt?', appearance: 'likert' },
	{ type: 'end_group' },

	{ type: 'begin_group', name: 'matrix_wrapper', label: 'Selbsteinschätzung technischer Fähigkeiten' },
	{ type: 'begin_group', name: 'matrix_inner', label: 'Programmierkenntnisse', appearance: 'field-list' },
	{ type: 'select_one proficiency', name: 'matrix_header', label: 'Wie schätzen Sie Ihre Kenntnisse ein?', appearance: 'label' },
	{ type: 'select_one proficiency', name: 'skill_python', label: 'Python', appearance: 'list-nolabel' },
	{ type: 'select_one proficiency', name: 'skill_js', label: 'JavaScript', appearance: 'list-nolabel' },
	{ type: 'select_one proficiency', name: 'skill_sql', label: 'SQL', appearance: 'list-nolabel' },
	{ type: 'end_group' },
	{ type: 'end_group' },

	{ type: 'begin_group', name: 'or_other_types', label: 'Weitere Fragen' },
	{ type: 'select_one topics or_other', name: 'q_sel1_other', label: 'Welcher Track hat Ihnen am besten gefallen?' },
	{ type: 'select_multiple topics or_other', name: 'q_selm_other', label: 'Welche Tracks würden Sie erneut besuchen?' },
	{ type: 'rank aspects or_other', name: 'q_rank_other', label: 'Was hat Ihnen an der Veranstaltung am meisten gebracht?' },
	{ type: 'end_group' },

	{ type: 'begin_group', name: 'features', label: 'Anmeldedaten' },
	{ type: 'text', name: 'q_mandatory', label: 'Wie lautet Ihre E-Mail-Adresse?', required: 'yes' },
	{ type: 'text', name: 'q_hint', label: 'Wie lautet Ihre Telefonnummer?', hint: 'Format: +49 123 456789' },
	{ type: 'integer', name: 'q_constraint', label: 'Wie alt sind Sie?', constraint: '. >= 18 and . <= 120', constraint_message: 'Bitte geben Sie ein gültiges Alter zwischen 18 und 120 ein' },
	{ type: 'text', name: 'q_default', label: 'In welchem Land leben Sie?', default: 'Deutschland' },
	{ type: 'text', name: 'q_relevant', label: 'Wie sollen wir Sie kontaktieren?', relevant: "${q_mandatory} != ''" },
	{ type: 'text', name: 'q_all_features', label: 'Haben Sie noch Anmerkungen?', required: 'yes', hint: 'Freiwillig, aber willkommen', default: 'Keine Anmerkungen', relevant: "${q_mandatory} != ''" },
	{ type: 'end_group' },

	{ type: 'note', name: 'orphan_after', label: 'Vielen Dank für Ihre Teilnahme an dieser Umfrage!' },
];

// ── choices sheet ──
const choices = [
	{ list_name: 'yesno', name: 'yes', label: 'Ja' },
	{ list_name: 'yesno', name: 'no', label: 'Nein' },

	{ list_name: 'topics', name: 'red', label: 'Frontend-Entwicklung' },
	{ list_name: 'topics', name: 'blue', label: 'Backend-Entwicklung' },
	{ list_name: 'topics', name: 'green', label: 'Data Science' },

	{ list_name: 'satisfaction', name: 'low', label: 'Schlecht' },
	{ list_name: 'satisfaction', name: 'mid', label: 'Mittelmäßig' },
	{ list_name: 'satisfaction', name: 'high', label: 'Ausgezeichnet' },

	{ list_name: 'aspects', name: 'fam', label: 'Vernetzung' },
	{ list_name: 'aspects', name: 'work', label: 'Fachliche Inhalte' },
	{ list_name: 'aspects', name: 'fun', label: 'Location & Verpflegung' },

	{ list_name: 'proficiency', name: 'none', label: 'Keine' },
	{ list_name: 'proficiency', name: 'basic', label: 'Grundkenntnisse' },
	{ list_name: 'proficiency', name: 'adv', label: 'Fortgeschritten' },
	{ list_name: 'proficiency', name: 'exp', label: 'Experte' },
];

// ── settings sheet ──
const settings = [
	{ form_title: 'Workshop-Feedback-Umfrage', form_id: 'all_types', default_language: 'de' },
];

// ── build workbook ──
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(survey), 'survey');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(choices), 'choices');
XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(settings), 'settings');

import * as fs from 'fs';
const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
fs.writeFileSync(outPath, buf);
console.log(`Created ${outPath}`);
