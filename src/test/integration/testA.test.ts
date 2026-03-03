import { describe, it, expect } from 'vitest';
import { XLSLoader, XLSFormToTSVConverter } from '../../index';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testFilePath = path.join(__dirname, '../../../docker_tests/fixtures/testA.xlsx');

const fileExists = fs.existsSync(testFilePath);
const testFileData = fileExists ? fs.readFileSync(testFilePath) : Buffer.alloc(0);

describe('Integration: testA.xlsx', () => {
	it.skipIf(!fileExists)('should load and validate the xlsx file', () => {
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(testFileData);

		expect(surveyData.length).toBeGreaterThan(0);
		expect(choicesData.length).toBeGreaterThan(0);
		expect(settingsData.length).toBeGreaterThan(0);
	});

	it.skipIf(!fileExists)('should throw on unimplemented range type during conversion', async () => {
		const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(testFileData);

		const converter = new XLSFormToTSVConverter();
		await expect(
			converter.convert(surveyData, choicesData, settingsData)
		).rejects.toThrow(/Unimplemented XLSForm type: 'range'/);
	});
});
