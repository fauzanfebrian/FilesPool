import fs from 'fs'
import JSZip from 'jszip'
import path from 'path'

const fileBuffer = (itemPath: string) => fs.readFileSync(itemPath)
const getDirectoryContents = (path: string) => {
    try {
        return fs.readdirSync(path)
    } catch (error) {
        return []
    }
}

export const zipDirectory = async (directoryPath: string) => {
    const processDirectory = async (zip: JSZip, subFolderPath?: string) => {
        const fullPath = subFolderPath ? path.join(directoryPath, subFolderPath) : directoryPath

        for (const item of getDirectoryContents(fullPath)) {
            if (item === 'nodata') continue

            const itemPath = path.join(fullPath, item)

            if (fs.lstatSync(itemPath).isDirectory()) {
                const subFolderRoot = path.join(subFolderPath || '', item)
                await processDirectory(zip.folder(item), subFolderRoot)
                continue
            }

            zip.file(item, fileBuffer(itemPath))
        }
    }

    const zip = new JSZip()

    await processDirectory(zip)

    return zip.generateAsync({ type: 'nodebuffer' })
}
