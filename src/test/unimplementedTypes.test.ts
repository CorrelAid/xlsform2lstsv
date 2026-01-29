import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowByName } from './helpers';

describe('Unimplemented XLSForm Types Validation', () => {
	describe('Geo Types', () => {
		test('throws error for unimplemented geopoint type', () => {
			const survey = [
				{ type: 'geopoint', name: 'location', label: 'Location' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'geopoint\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented geotrace type', () => {
			const survey = [
				{ type: 'geotrace', name: 'path', label: 'Path' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'geotrace\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented geoshape type', () => {
			const survey = [
				{ type: 'geoshape', name: 'area', label: 'Area' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'geoshape\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented start-geopoint type', () => {
			const survey = [
				{ type: 'start-geopoint', name: 'start_loc', label: 'Start Location' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'start-geopoint\'. This type is not currently supported.'
			);
		});
	});

	describe('Media Types', () => {
		test('throws error for unimplemented image type', () => {
			const survey = [
				{ type: 'image', name: 'photo', label: 'Photo' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'image\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented audio type', () => {
			const survey = [
				{ type: 'audio', name: 'recording', label: 'Recording' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'audio\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented video type', () => {
			const survey = [
				{ type: 'video', name: 'clip', label: 'Video' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'video\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented file type', () => {
			const survey = [
				{ type: 'file', name: 'attachment', label: 'File' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'file\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented barcode type', () => {
			const survey = [
				{ type: 'barcode', name: 'code', label: 'Barcode' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'barcode\'. This type is not currently supported.'
			);
		});
	});

	describe('Other Types', () => {
		test('throws error for unimplemented background-audio type', () => {
			const survey = [
				{ type: 'background-audio', name: 'bg_audio', label: 'Background Audio' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'background-audio\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented csv-external type', () => {
			const survey = [
				{ type: 'csv-external', name: 'csv_data', label: 'CSV Data' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'csv-external\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented phonenumber type', () => {
			const survey = [
				{ type: 'phonenumber', name: 'phone', label: 'Phone' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'phonenumber\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented email type', () => {
			const survey = [
				{ type: 'email', name: 'email_addr', label: 'Email' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'email\'. This type is not currently supported.'
			);
		});
	});

	describe('Record Types', () => {
		test('throws error for unimplemented start type', () => {
			const survey = [
				{ type: 'start', name: 'start_time', label: 'Start time' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'start\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented end type', () => {
			const survey = [
				{ type: 'end', name: 'end_time', label: 'End time' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'end\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented today type', () => {
			const survey = [
				{ type: 'today', name: 'today_date', label: 'Today date' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'today\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented deviceid type', () => {
			const survey = [
				{ type: 'deviceid', name: 'device_id', label: 'Device ID' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'deviceid\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented username type', () => {
			const survey = [
				{ type: 'username', name: 'user_name', label: 'Username' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'username\'. This type is not currently supported.'
			);
		});
	});

	describe('Other Types', () => {
		test('throws error for unimplemented audit type', () => {
			const survey = [
				{ type: 'audit', name: 'audit_q', label: 'Audit Question' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'audit\'. This type is not currently supported.'
			);
		});
	});

	describe('Calculation Types', () => {
		test('throws error for unimplemented calculate type', () => {
			const survey = [
				{ type: 'calculate', name: 'calc_q', label: 'Calculation', calculation: '${a} + ${b}' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'calculate\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented hidden type', () => {
			const survey = [
				{ type: 'hidden', name: 'hidden_q', label: 'Hidden Field', calculation: 'uuid()' }
			];

			expect(() => convertAndParse(survey)).toThrow(
				'Unimplemented XLSForm type: \'hidden\'. This type is not currently supported.'
			);
		});
	});

	describe('Edge Cases', () => {
		test('handles unknown type gracefully with fallback', () => {
			const survey = [
				{ type: 'unknown_type', name: 'q1', label: 'Question' }
			];

			// Unknown types (not in UNIMPLEMENTED_TYPES) fall back to text type
			const rows = convertAndParse(survey);
			const question = findRowByName(rows, 'q1');

			expect(question?.['type/scale']).toBe('S'); // Default fallback to text
		});
	});
});