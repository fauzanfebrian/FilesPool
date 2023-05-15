export const getSubFolder = (subFolder: any) => {
    if (typeof subFolder !== 'string') return ''

    return decodeURIComponent(subFolder).replace(/\.\.(\/|\%2F)?/g, '/')
}
