export const getSubFolder = (subFolder: any) => {
    if (!subFolder || typeof subFolder !== 'string') return ''

    const sanitizedSubFolder = decodeURIComponent(subFolder).replace(/\.\.(\/|\%2F)?/g, '/')

    return sanitizedSubFolder && sanitizedSubFolder[0] !== '/' ? `/${sanitizedSubFolder}` : sanitizedSubFolder
}
