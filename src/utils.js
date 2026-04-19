/**
 * Utility to get value from nested object using dot notation
 */
export function getValueByPath(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}
