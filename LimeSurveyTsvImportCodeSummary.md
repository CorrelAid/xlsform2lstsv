# LimeSurvey TSV Import Logic Summary

LLM generated from: https://github.com/LimeSurvey/LimeSurvey/blob/50870a0767a3b132344a195bcaa354be82eecddf/application/helpers/admin/import_helper.php#L3836

----

## Overview
The `TSVImportSurvey()` function in LimeSurvey imports survey structures from TSV (Tab-Separated Values) files. It parses the TSV file, organizes data by row class types, and converts it to XML format for final import.

## File Processing

### Input Handling
- Converts file to UTF-8 using `fileCsvToUtf8()`
- Reads TSV with tab delimiter and double-quote enclosure
- Removes BOM (Byte Order Mark) from first header cell
- Handles Excel-style quote escaping (doubled internal quotes)

### TSV Structure
- First row contains column headers
- Subsequent rows contain data with a `class` column determining row type
- Each row represents different survey elements based on the `class` value

## Row Classes and Data Organization

### Survey Level (`S`)
- Survey-level settings (except `datecreated`)
- Stored in `$surveyinfo` array

### Survey Language Settings (`SL`)
- Multilingual survey text/settings per language
- Stored in `$surveyls` array indexed by language

### Groups (`G`)
- Survey question groups
- Fields: `gid`, `sid`, `group_name`, `grelevance`, `description`, `language`, `randomization_group`, `group_order`
- Group ID handling:
  - Uses `id` from file if numeric and not duplicate
  - Otherwise generates sequential IDs
  - Maintains same `gid` across languages for multilingual surveys

### Questions (`Q`)
- Main survey questions
- Fields: `qid`, `sid`, `gid`, `type`, `title`, `question`, `relevance`, `preg` (validation), `help`, `language`, `mandatory`, `encrypted`, `other`, `same_default`, `question_theme_name`, `same_script`
- Question ID handling: Similar to groups (file ID or auto-increment)
- Question attributes are extracted and stored separately
- Default values stored in `$defaultvalues` array

### Subquestions (`SQ`)
- Sub-questions for matrix/array type questions
- Fields: `qid` (references parent), `parent_qid`, `title`, `question`, `scale_id`, `question_order`
- Special handling for:
  - "other" option when `lastother == 'Y'`
  - Comment fields (`Question::QT_O_LIST_WITH_COMMENT`)
  - File upload count (`Question::QT_VERTICAL_FILE_UPLOAD`)
- Subquestion IDs treated as question IDs (share same ID space)

### Answers (`A`)
- Answer options for closed questions
- Fields: `qid`, `code`, `answer`, `scale_id`, `language`, `assessment_value`, `sortorder`

### Assessments (`AS`)
- Assessment rules
- Fields: `sid`, `scope`, `gid`, `name`, `minimum`, `maximum`, `message`, `language`, `id`

### Quotas (`QTA`, `QTAM`, `QTALS`)
- **QTA**: Quota definitions
  - Fields: `id`, `sid`, `name`, `qlimit`, `action`, `active`, `autoload_url`
- **QTAM**: Quota members (quota-question-answer associations)
  - Fields: `quota_id`, `sid`, `qid`, `code`
- **QTALS**: Quota language settings
  - Fields: `quotals_quota_id`, `quotals_language`, `quotals_message`, `quotals_url`, `quotals_urldescrip`

### Conditions (`C`)
- Question display conditions
- Fields: `qid`, `scenario`, `cqid`, `cfieldname`, `method`, `value`

## Key Processing Logic

### Survey Creation
- Sets `startdate` to null and `active` to 'N'
- Sets `gsid` (survey group ID) to 1
- Uses existing `sid` from file or generates random 6-digit ID

### ID Management
- **Groups**: Tracks assigned group IDs in `$groupIds` array
- **Questions/Subquestions**: Tracks in `$questionsIds` array (shared ID space)
- Prefers IDs from TSV file if numeric and unique
- Falls back to auto-increment for missing/duplicate IDs

### Multilingual Support
- Base language defaults to 'en' or from survey settings
- Same `gid`/`qid` used across all languages for a group/question
- Group counter resets per language for old-style files without group IDs
- Language-specific attributes marked with `language` field, others set to null

### Sequence Tracking
- `$gseq`: Group order counter
- `$qseq`: Question order within group (resets per group)
- `$sqseq`: Subquestion order (resets per question)
- `$aseq`: Answer sort order (resets per question)

### Question Attributes
- Dynamically extracted from row data (columns not matching standard fields)
- Uses `QuestionAttribute::getQuestionAttributesSettings()` to determine if attribute is i18n
- i18n attributes get language tag, others set to null

### Default Values
- Stored for questions, subquestions, and "other" options
- Includes `qid`, `sqid`, `scale_id`, `language`, and `defaultvalue`

## Output Generation

### Data Structure
The function builds an `$output` array with sections:
- `surveys`: Survey-level settings
- `surveys_languagesettings`: Multilingual survey text
- `groups`: Question groups
- `questions`: Main questions
- `question_attributes`: Question attributes
- `defaultvalues`: Default answer values
- `subquestions`: Sub-questions
- `answers`: Answer options
- `assessments`: Assessment rules
- `quota`, `quota_members`, `quota_languagesettings`: Quota system
- `conditions`: Display conditions

Each section contains:
- `fields.fieldname`: Array of column names
- `rows.row`: Array of data rows

### XML Conversion
- `createXMLfromData($output)` converts array to XML
- `XMLImportSurvey('null', $xml)` performs final import
- Returns import result

## Important Notes

1. **BOM Handling**: Multiple attempts to remove BOM, including special handling for 'class' header
2. **Excel Compatibility**: Handles Excel's quote escaping (doubled internal quotes within quoted strings)
3. **Backward Compatibility**: Supports old-style TSV files without explicit group/question IDs
4. **Name-based Tracking**: Uses composite keys (e.g., 'G{gid}_{qname}', 'G{gid}Q{qid}_{scale}_{sqname}') for multilingual consistency
5. **Missing Data**: Uses null coalescing operator (`??`) with sensible defaults throughout
