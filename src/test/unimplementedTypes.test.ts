import { describe, test, expect } from 'vitest';
import { convertAndParse, findRowByName } from './helpers';

describe('Unimplemented XLSForm Types Validation', () => {
	describe('Geo Types', () => {
		test('throws error for unimplemented geopoint type', async () => {
			const survey = [
				{ type: 'geopoint', name: 'location', label: 'Location' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'geopoint\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented geotrace type', async () => {
			const survey = [
				{ type: 'geotrace', name: 'path', label: 'Path' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'geotrace\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented geoshape type', async () => {
			const survey = [
				{ type: 'geoshape', name: 'area', label: 'Area' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'geoshape\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented start-geopoint type', async () => {
			const survey = [
				{ type: 'start-geopoint', name: 'start_loc', label: 'Start Location' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'start-geopoint\'. This type is not currently supported.'
			);
		});
	});

	describe('Media Types', () => {
		test('throws error for unimplemented image type', async () => {
			const survey = [
				{ type: 'image', name: 'photo', label: 'Photo' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'image\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented audio type', async () => {
			const survey = [
				{ type: 'audio', name: 'recording', label: 'Recording' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'audio\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented video type', async () => {
			const survey = [
				{ type: 'video', name: 'clip', label: 'Video' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'video\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented file type', async () => {
			const survey = [
				{ type: 'file', name: 'attachment', label: 'File' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'file\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented barcode type', async () => {
			const survey = [
				{ type: 'barcode', name: 'code', label: 'Barcode' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'barcode\'. This type is not currently supported.'
			);
		});
	});

	describe('Other Types', () => {
		test('throws error for unimplemented background-audio type', async () => {
			const survey = [
				{ type: 'background-audio', name: 'bg_audio', label: 'Background Audio' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'background-audio\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented csv-external type', async () => {
			const survey = [
				{ type: 'csv-external', name: 'csv_data', label: 'CSV Data' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'csv-external\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented phonenumber type', async () => {
			const survey = [
				{ type: 'phonenumber', name: 'phone', label: 'Phone' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'phonenumber\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented email type', async () => {
			const survey = [
				{ type: 'email', name: 'email_addr', label: 'Email' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'email\'. This type is not currently supported.'
			);
		});
	});

	describe('Record Types', () => {
		test('throws error for unimplemented start type', async () => {
			const survey = [
				{ type: 'start', name: 'start_time', label: 'Start time' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'start\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented end type', async () => {
			const survey = [
				{ type: 'end', name: 'end_time', label: 'End time' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'end\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented today type', async () => {
			const survey = [
				{ type: 'today', name: 'today_date', label: 'Today date' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'today\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented deviceid type', async () => {
			const survey = [
				{ type: 'deviceid', name: 'device_id', label: 'Device ID' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'deviceid\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented username type', async () => {
			const survey = [
				{ type: 'username', name: 'user_name', label: 'Username' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'username\'. This type is not currently supported.'
			);
		});
	});

	describe('Other Types', () => {
		test('throws error for unimplemented audit type', async () => {
			const survey = [
				{ type: 'audit', name: 'audit_q', label: 'Audit Question' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'audit\'. This type is not currently supported.'
			);
		});
	});

	describe('Calculation Types', () => {
		test('throws error for unimplemented calculate type', async () => {
			const survey = [
				{ type: 'calculate', name: 'calc_q', label: 'Calculation', calculation: '${a} + ${b}' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'calculate\'. This type is not currently supported.'
			);
		});

		test('throws error for unimplemented hidden type', async () => {
			const survey = [
				{ type: 'hidden', name: 'hidden_q', label: 'Hidden Field', calculation: 'uuid()' }
			];

			await expect(() => convertAndParse(survey)).rejects.toThrow(
				'Unimplemented XLSForm type: \'hidden\'. This type is not currently supported.'
			);
		});
	});

	describe('Edge Cases', () => {
		test('handles unknown type gracefully with fallback', async () => {
			const survey = [
				{ type: 'unknown_type', name: 'q1', label: 'Question' }
			];

			// Unknown types (not in UNIMPLEMENTED_TYPES) fall back to text type
			const rows = await convertAndParse(survey);
			const question = findRowByName(rows, 'q1');

			expect(question?.['type/scale']).toBe('S'); // Default fallback to text
		});
	});
});