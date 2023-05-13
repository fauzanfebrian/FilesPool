import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import JSZip from 'jszip'
import ngrok from 'ngrok'
import path from 'path'
import range from 'range-parser'
import mime from 'mime'

export const filesUri = 'files'
// change this variable if you want change the exposed directory
export const filesDirectoryPath = path.join(process.cwd(), 'files')

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

export const zipping = async (req: Request, res: Response) => {
    try {
        const directoryPath = path.join(filesDirectoryPath, req.params.subFolder || '')
        const zip = await zipDirectory(directoryPath)

        res.set({
            'Content-disposition': `attachment; filename=FilesPool-${new Date().getTime()}.zip`,
            'Content-Type': 'application/zip',
            'Content-Length': zip.length,
            'Accept-Ranges': 'bytes',
        })

        const ranges = !!req.headers.range && range(zip.length, req.headers.range, { combine: true })

        if (Array.isArray(ranges)) res.set('Content-Range', `bytes ${ranges[0].start}-${ranges[0].end}/${zip.length}`)

        fs.ReadStream.from(zip).pipe(res)
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
}

export const staticFile = (req: Request, res: Response, next: NextFunction) => {
    try {
        const pathName = path.join(filesDirectoryPath, req.path)

        if (!fs.existsSync(pathName)) return res.status(404).send(`cannot ${req.method} ${req.path}`)

        const isDirectory = fs.lstatSync(pathName).isDirectory()
        if (isDirectory) {
            const redirectTo = `${req.path[0] !== '/' ? '/' : ''}${req.path}`
            return res.redirect(redirectTo)
        }

        const file = fs.readFileSync(pathName)
        const fileName = path.basename(pathName)

        res.set({
            'Content-disposition': `attachment; filename=${fileName}`,
            'Content-Type': mime.lookup(pathName) || 'text/plain',
            'Content-Length': file.length,
            'Accept-Ranges': 'bytes',
        })

        if (req.headers.range) {
            const ranges = range(file.length, req.headers.range, { combine: true }) as range.Ranges
            res.set('Content-Range', `bytes ${ranges[0].start}-${ranges[0].end}/${file.length}`)
        }

        fs.ReadStream.from(file).pipe(res)
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
}

export const homePage = async (req: Request, res: Response) => {
    try {
        const subFolder = typeof req.params.subFolder === 'string' ? req.params.subFolder : ''
        const directoryPath = path.join(filesDirectoryPath, subFolder)
        const filesName = fs.readdirSync(directoryPath)

        const subFolderUrl = subFolder && subFolder[0] !== '/' ? `/${subFolder}` : subFolder

        const files = filesName
            .filter(file => file !== 'nodata')
            .map(file => ({
                name: file,
                url: `/${filesUri}${subFolderUrl}/${file}`,
            }))
        const filesZipUrl = `/${filesUri}${subFolderUrl}/zip`

        const data = {
            files,
            filesZipUrl,
            subFolder: !!subFolder,
        }

        res.render('pages/home.ejs', data)
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
}

export const startNgrok = async (port: number) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`Server start on port ${port}, http://localhost:${port}`)
        return
    }
    try {
        const url = await ngrok.connect({ addr: port, authtoken: process.env.NGROK_AUTH_TOKEN })

        console.log('Your FilesPool URL:', url)
        console.log('Copy & Paste the url to your browser')

        process.on('SIGINT', async () => {
            await ngrok.disconnect()
            await ngrok.kill()
            process.exit(0)
        })
    } catch (error) {
        console.error('Tunnel start error', error)
    }
}
