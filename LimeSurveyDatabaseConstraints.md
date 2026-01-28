# LimeSurvey Database Schema Constraints

LLM generated from: https://github.com/LimeSurvey/LimeSurvey/blob/master/installer/create-database.php

This document summarizes the database field constraints for tables involved in TSV survey import. These constraints define maximum field lengths and data types that must be respected when generating TSV files for import.

---

## Critical Length Constraints

### Answer Codes (Most Common Issue)
- **Answer codes (`answers.code`)**: **5 characters maximum** ⚠️
- **Question titles (`questions.title`)**: **20 characters maximum** ⚠️
- **Quota member codes (`quota_members.code`)**: **11 characters maximum**

---

## Table Schemas

### 1. Surveys (`{{surveys}}`)

Main survey-level settings.

| Field | Type | Length | Constraints | Notes |
|-------|------|--------|-------------|-------|
| `sid` | integer | - | PRIMARY KEY | Survey ID |
| `owner_id` | integer | - | NOT NULL | User who owns survey |
| `gsid` | integer | - | DEFAULT 1 | Survey group ID |
| `admin` | string | **50** | - | Administrator name |
| `active` | string | **1** | NOT NULL, DEFAULT 'N' | Survey active status (Y/N) |
| `expires` | datetime | - | - | Expiration date |
| `startdate` | datetime | - | - | Start date |
| `adminemail` | string | **254** | - | Administrator email |
| `anonymized` | string | **1** | NOT NULL, DEFAULT 'N' | Anonymized responses (Y/N) |
| `language` | string | **50** | - | Base language code |
| `additional_languages` | text | - | - | Additional language codes |
| `datestamp` | string | **1** | NOT NULL, DEFAULT 'Y' | Save submission date (Y/N) |
| `usecookie` | string | **1** | NOT NULL, DEFAULT 'N' | Use cookies (Y/N) |
| `allowregister` | string | **1** | NOT NULL, DEFAULT 'N' | Allow public registration (Y/N) |
| `allowsave` | string | **1** | NOT NULL, DEFAULT 'Y' | Allow save and continue (Y/N) |
| `autonumber_start` | integer | - | NOT NULL, DEFAULT 0 | Starting number for autonumbering |
| `usetokens` | string | **1** | NOT NULL, DEFAULT 'N' | Use participant tokens (Y/N) |
| `bounce_email` | string | **254** | - | Bounce email address |

---

### 2. Survey Language Settings (`{{surveys_languagesettings}}`)

Multilingual survey text and settings per language.

| Field | Type | Length | Constraints | Notes |
|-------|------|--------|-------------|-------|
| `surveyls_survey_id` | integer | - | NOT NULL | References survey ID |
| `surveyls_language` | string | **45** | NOT NULL, DEFAULT 'en' | Language code |
| `surveyls_title` | string | **200** | NOT NULL | Survey title |
| `surveyls_description` | mediumtext | - | - | Survey description |
| `surveyls_welcometext` | mediumtext | - | - | Welcome message |
| `surveyls_endtext` | mediumtext | - | - | End message |
| `surveyls_url` | text | - | - | End URL |
| `surveyls_urldescription` | string | **255** | - | End URL description |
| `surveyls_alias` | string | **100** | - | Survey alias |

---

### 3. Groups (`{{groups}}`)

Question groups (pages in survey).

| Field | Type | Length | Constraints | Notes |
|-------|------|--------|-------------|-------|
| `gid` | integer | - | PRIMARY KEY | Group ID |
| `sid` | integer | - | NOT NULL, DEFAULT 0 | Survey ID |
| `group_order` | integer | - | NOT NULL, DEFAULT 0 | Display order |
| `randomization_group` | string | **20** | NOT NULL, DEFAULT '' | Randomization group name |
| `grelevance` | text | - | - | Group relevance equation |

**Note**: Group names/identifiers are stored in `groups_languagesettings` table (not shown here).

---

### 4. Questions (`{{questions}}`)

Main survey questions and subquestions.

| Field | Type | Length | Constraints | Notes |
|-------|------|--------|-------------|-------|
| `qid` | integer | - | PRIMARY KEY | Question ID |
| `parent_qid` | integer | - | NOT NULL, DEFAULT 0 | Parent question ID (0 = parent question) |
| `sid` | integer | - | NOT NULL, DEFAULT 0 | Survey ID |
| `gid` | integer | - | NOT NULL, DEFAULT 0 | Group ID |
| `type` | string | **30** | NOT NULL, DEFAULT 'T' | Question type code |
| `title` | string | **20** ⚠️ | NOT NULL, DEFAULT '' | **Question code (max 20 chars)** |
| `preg` | text | - | - | Validation regex |
| `other` | string | **1** | NOT NULL, DEFAULT 'N' | Has "Other" option (Y/N) |
| `mandatory` | string | **1** | - | Mandatory question (Y/N) |
| `encrypted` | string | **1** | DEFAULT 'N' | Encrypted responses (Y/N) |
| `question_order` | integer | - | NOT NULL | Display order within group |
| `scale_id` | integer | - | NOT NULL, DEFAULT 0 | Scale ID for subquestions |
| `relevance` | text | - | - | Relevance/display condition equation |
| `question_theme_name` | string | **150** | - | Question theme name |

**Critical Constraint**: Question titles (codes) are limited to **20 characters**.

---

### 5. Answers (`{{answers}}`)

Answer options for closed questions (list, radio, dropdown, etc.).

| Field | Type | Length | Constraints | Notes |
|-------|------|--------|-------------|-------|
| `aid` | integer | - | PRIMARY KEY | Answer ID |
| `qid` | integer | - | NOT NULL | Question ID |
| `code` | string | **5** ⚠️ | NOT NULL | **Answer code (max 5 chars)** |
| `sortorder` | integer | - | NOT NULL | Display order |
| `assessment_value` | integer | - | NOT NULL, DEFAULT 0 | Assessment/scoring value |
| `scale_id` | integer | - | NOT NULL, DEFAULT 0 | Scale ID (for dual-scale questions) |

**Critical Constraint**: Answer codes are limited to **5 characters**. This is the most common cause of missing answer options during import.

**Note**: Answer text/labels are stored in `answer_l10ns` table (not shown here).

---

### 6. Question Attributes (`{{question_attributes}}`)

Extended question settings and properties.

| Field | Type | Length | Constraints | Notes |
|-------|------|--------|-------------|-------|
| `qaid` | integer | - | PRIMARY KEY | Attribute ID |
| `qid` | integer | - | NOT NULL, DEFAULT 0 | Question ID |
| `attribute` | string | **50** | - | Attribute name |
| `value` | mediumtext | - | - | Attribute value |
| `language` | string | **20** | - | Language (null = all languages) |

---

### 7. Assessments (`{{assessments}}`)

Assessment/scoring rules for surveys.

| Field | Type | Length | Constraints | Notes |
|-------|------|--------|-------------|-------|
| `id` | integer | - | PRIMARY KEY | Assessment ID |
| `sid` | integer | - | NOT NULL, DEFAULT 0 | Survey ID |
| `scope` | string | **5** | NOT NULL | Scope (total/group) |
| `gid` | integer | - | NOT NULL, DEFAULT 0 | Group ID (0 = total) |
| `name` | text | - | NOT NULL | Assessment name |
| `minimum` | string | **50** | NOT NULL | Minimum score |
| `maximum` | string | **50** | NOT NULL | Maximum score |
| `message` | mediumtext | - | NOT NULL | Assessment message |
| `language` | string | **20** | NOT NULL, DEFAULT 'en' | Language code |

---

### 8. Quota (`{{quota}}`)

Quota definitions for limiting responses.

| Field | Type | Length | Constraints | Notes |
|-------|------|--------|-------------|-------|
| `id` | integer | - | PRIMARY KEY | Quota ID |
| `sid` | integer | - | - | Survey ID |
| `name` | string | **255** | - | Quota name |
| `qlimit` | integer | - | - | Response limit |
| `action` | integer | - | - | Action when quota full |
| `active` | integer | - | NOT NULL, DEFAULT 1 | Quota active (1/0) |

---

### 9. Quota Members (`{{quota_members}}`)

Associates quotas with specific question answers.

| Field | Type | Length | Constraints | Notes |
|-------|------|--------|-------------|-------|
| `id` | integer | - | PRIMARY KEY | Member ID |
| `sid` | integer | - | - | Survey ID |
| `qid` | integer | - | - | Question ID |
| `quota_id` | integer | - | - | Quota ID |
| `code` | string | **11** | - | Answer code |

---

### 10. Quota Language Settings (`{{quota_languagesettings}}`)

Multilingual quota messages.

| Field | Type | Length | Constraints | Notes |
|-------|------|--------|-------------|-------|
| `quotals_id` | integer | - | PRIMARY KEY | Language setting ID |
| `quotals_quota_id` | integer | - | NOT NULL, DEFAULT 0 | Quota ID |
| `quotals_language` | string | **45** | NOT NULL, DEFAULT 'en' | Language code |
| `quotals_name` | string | **255** | - | Quota name |
| `quotals_message` | mediumtext | - | NOT NULL | Quota full message |
| `quotals_url` | string | **255** | - | Redirect URL |

---

### 11. Conditions (`{{conditions}}`)

Display conditions for questions (legacy, mostly replaced by relevance equations).

| Field | Type | Length | Constraints | Notes |
|-------|------|--------|-------------|-------|
| `cid` | integer | - | PRIMARY KEY | Condition ID |
| `qid` | integer | - | NOT NULL, DEFAULT 0 | Question ID to show/hide |
| `cqid` | integer | - | NOT NULL, DEFAULT 0 | Controlling question ID |
| `cfieldname` | string | **50** | NOT NULL, DEFAULT '' | Controlling field name |
| `method` | string | **5** | NOT NULL, DEFAULT '' | Comparison method (==, !=, etc.) |
| `value` | string | **255** | NOT NULL, DEFAULT '' | Comparison value |
| `scenario` | integer | - | NOT NULL, DEFAULT 1 | Scenario/group number |

---

## Summary of Critical Constraints for TSV Generation

When generating TSV files for LimeSurvey import, ensure the following limits are respected:

### High-Priority (Commonly Exceeded)
1. **Answer codes**: Max **5 characters** (`answers.code`)
2. **Question codes/titles**: Max **20 characters** (`questions.title`)

### Medium-Priority
3. **Survey title**: Max **200 characters** (`surveys_languagesettings.surveyls_title`)
4. **Survey language**: Max **45 characters** (`surveys_languagesettings.surveyls_language`)
5. **Question theme name**: Max **150 characters** (`questions.question_theme_name`)
6. **Question attribute name**: Max **50 characters** (`question_attributes.attribute`)

### Less Commonly Exceeded
7. **Admin name**: Max **50 characters** (`surveys.admin`)
8. **Email addresses**: Max **254 characters** (`surveys.adminemail`, `surveys.bounce_email`)
9. **Randomization group**: Max **20 characters** (`groups.randomization_group`)
10. **Question type**: Max **30 characters** (`questions.type`)
11. **Quota member code**: Max **11 characters** (`quota_members.code`)
12. **URL description**: Max **255 characters** (`surveys_languagesettings.surveyls_urldescription`)

### Boolean/Single Character Fields
- All Y/N fields are **1 character** strings (not boolean)
- Values: 'Y' or 'N' (case-sensitive)

---

## Import Behavior

### Silent Truncation vs. Silent Dropping

**Silent Dropping** (most problematic):
- **Answer codes** exceeding 5 characters are completely **ignored/dropped** during import
- The TSV row is skipped without error

**Database-Level Truncation**:
- Other string fields may be truncated at the database level
- MySQL/PostgreSQL will truncate excess characters to fit VARCHAR limits
- This can cause data loss but at least preserves partial data

### Recommendations

1. **Always validate field lengths** before TSV generation
2. **Truncate proactively** with warnings rather than letting import fail silently
3. **Use meaningful truncation** (e.g., "unhappy" → "unhap" rather than random truncation)
4. **Log warnings** when truncation occurs so users are aware
5. **Consider using hash suffixes** for uniqueness if codes would collide after truncation

---

## Database Field Type Reference

From LimeSurvey's database abstraction layer:

- `pk` → Auto-incrementing primary key integer
- `autoincrement` → Auto-incrementing integer (not necessarily primary key)
- `integer` → Integer/bigint
- `string(N)` → VARCHAR(N)
- `text` → TEXT (65,535 bytes)
- `mediumtext` → MEDIUMTEXT (16,777,215 bytes)
- `datetime` → DATETIME/TIMESTAMP
