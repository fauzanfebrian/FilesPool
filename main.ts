import dotenv from 'dotenv'
import express from 'express'
import localtunnel from 'localtunnel'
import path from 'path'
import { readdir, readFile } from 'fs/promises'
import JSZip from 'jszip'
import fs from 'fs'

dotenv.config()

const app = express()

const filesUri = 'files'
// change this variable if you want change the exposed directory
const filesDirectoryPath = path.resolve(process.cwd(), 'files')

app.set('view engine', 'ejs')

app.get(`/${filesUri}/zip`, async (_req, res) => {
    try {
        const zip = new JSZip()
        const filesName = await readdir(filesDirectoryPath)

        for (const file of filesName) {
            if (file === 'nodata') continue

            const filePath = path.resolve(filesDirectoryPath, file)
            const buffer = readFile(filePath)

            zip.file(file, buffer)
        }

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
        const totalSize = zipBuffer.length

        res.setHeader('Content-disposition', `attachment; filename=FilesPool-${new Date().getTime()}.zip`)
        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Length', totalSize)

        const stream = fs.WriteStream.Readable.from(zipBuffer)
        stream.pipe(res)
    } catch (error) {
        res.status(500).send(error?.message || 'Internal Server Error')
    }
})

app.use(`/${filesUri}`, express.static(filesDirectoryPath))

app.get('/', async (_req, res) => {
    try {
        const filesName = await readdir(filesDirectoryPath)

        const files: { name: string; url: string }[] = filesName
            .filter(file => file !== 'nodata')
            .map(file => ({
                name: file,
                url: `/${filesUri}/${file}`,
            }))
        const filesZipUrl = `/${filesUri}/zip`

        res.render('pages/home.ejs', { files, filesZipUrl })
    } catch (error) {
        res.status(500).send(error?.message || 'Internal Server Error')
    }
})

const port = +process.env.PORT || 8098
app.listen(port, async () => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`Server start on port ${port}, http://localhost:${port}`)
        return
    }
    try {
        const tunnel = await localtunnel(port)

        console.log('Your FilesPool URL:', tunnel.url)
        console.log('Copy & Paste the link to your browser')

        tunnel.on('close', () => console.log('FilesPool Tunnel closed'))
        process.on('SIGINT', () => {
            tunnel.close()
            process.exit(0)
        })
    } catch (error) {
        console.error('Tunnel start error', error)
    }
})
