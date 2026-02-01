/**
 * @file Main entrypoint of this library.
 */
import { XLSLoader } from './XLSLoader.js';
export class XLSFormParser {
    /**
     * Convert XLS/XLSX file to TSV using the main converter
     * @param filePath Path to XLS or XLSX file
     * @param config Optional configuration
     * @returns TSV string
     */
    static async convertXLSFileToTSV(filePath, config) {
        const { XLSFormToTSVConverter } = await import('../xlsformConverter.js');
        // Load data (validation is included by default)
        const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSFile(filePath);
        const converter = new XLSFormToTSVConverter(config);
        return await converter.convert(surveyData, choicesData, settingsData);
    }
    /**
     * Convert XLS/XLSX data to TSV using the main converter
     * @param data XLS or XLSX file data
     * @param config Optional configuration
     * @returns TSV string
     */
    static async convertXLSDataToTSV(data, config) {
        const { XLSFormToTSVConverter } = await import('../xlsformConverter.js');
        // Load data (validation is included by default)
        const { surveyData, choicesData, settingsData } = XLSLoader.parseXLSData(data);
        const converter = new XLSFormToTSVConverter(config);
        return await converter.convert(surveyData, choicesData, settingsData);
    }
}
