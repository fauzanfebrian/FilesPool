import path from 'path'

export const filesUri = 'files'
// change this variable if you want change the exposed directory
export const filesDirectoryPath = path.join(process.cwd(), filesUri)
