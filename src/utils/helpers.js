/**
 * Deep merge objects - merges properties from source into target recursively
 */
export function deepMerge(target, ...sources) {
    if (!sources.length)
        return target;
    const source = sources.shift();
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) {
                    target[key] = {};
                }
                deepMerge(target[key], source[key]);
            }
            else {
                target[key] = source[key];
            }
        }
    }
    return deepMerge(target, ...sources);
}
function isObject(item) {
    return item !== null && typeof item === 'object' && !Array.isArray(item);
}
/**
 * Sanitize field names for LimeSurvey compatibility
 * Removes underscores and truncates to 20 characters (LimeSurvey question title limit)
 */
export function sanitizeFieldName(name) {
    let result = name;
    // Always remove underscores (LimeSurvey removes them automatically)
    result = result.replace(/_/g, '');
    // Limit to 20 characters (LimeSurvey questions.title field limit)
    const maxLength = 20;
    if (result.length > maxLength) {
        const truncated = result.substring(0, maxLength);
        console.warn(`Field name "${name}" exceeds maximum length of ${maxLength} characters and will be truncated to "${truncated}"`);
        return truncated;
    }
    return result;
}
