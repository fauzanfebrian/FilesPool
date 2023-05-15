import fs from 'fs'
import JSZip from 'jszip'
import path from 'path'

export const zipDirectory = async (directoryPath: string) => {
    const zip = new JSZip()

    const processDirectory = async (zip: JSZip, directoryPath: string, basePath?: string) => {
        const fullPath = basePath ? path.join(directoryPath, basePath) : directoryPath
        const directoryContents = fs.readdirSync(fullPath)

        for (const item of directoryContents) {
            if (item === 'nodata') continue

            const itemPath = basePath ? path.join(basePath, item) : item
            const fullPath = path.join(directoryPath, itemPath)

            if (fs.lstatSync(fullPath).isDirectory()) {
                const folder = zip.folder(itemPath)
                await processDirectory(folder, directoryPath, itemPath)
                continue
            }

            const fileBuffer = fs.readFileSync(fullPath)
            zip.file(itemPath, fileBuffer)
        }
    }

    await processDirectory(zip, directoryPath)

    return zip.generateAsync({ type: 'nodebuffer' })
}
