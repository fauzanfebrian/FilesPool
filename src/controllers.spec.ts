import { Request, Response } from 'express'
import fs from 'fs'
import { filesDirectoryPath, filesUri } from './config'
import * as controllers from './controllers'
import { zipDirectory } from './utils/zip'
import ngrok from 'ngrok'
import path from 'path'

describe('zipping', () => {
    it('should stream zip file', async () => {
        const mockPipe = jest.fn()
        const mockReadStreamFrom = jest.fn().mockReturnValue({ pipe: mockPipe })
        jest.spyOn(fs.ReadStream, 'from').mockImplementation(mockReadStreamFrom)

        const req = { query: {}, headers: {} } as Request
        const res = { pipe: mockPipe, set: jest.fn() } as unknown as Response

        await controllers.zipping(req, res)

        const zip = await zipDirectory(filesDirectoryPath)

        expect(mockPipe).toBeCalledWith(res)
        expect(mockReadStreamFrom).toHaveBeenCalledWith(zip)

        jest.resetAllMocks()
    })

    it('should accept ranges', async () => {
        const mockPipe = jest.fn()
        const mockResSet = jest.fn()
        const mockReadStreamFrom = jest.fn().mockReturnValue({ pipe: mockPipe })
        jest.spyOn(fs.ReadStream, 'from').mockImplementation(mockReadStreamFrom)

        const req = { headers: { range: 'bytes=200-1000, 2000-6576, 19000-' }, query: {} } as Request
        const res = { pipe: mockPipe, set: mockResSet } as unknown as Response

        await controllers.zipping(req, res)

        expect(mockResSet).toHaveBeenCalledWith('Content-Range', expect.stringMatching(/bytes \d+-\d+\/\d+/))

        jest.resetAllMocks()
    })
})

describe('staticFile', () => {
    it('disposition of file should be an attachment', async () => {
        const mockPipe = jest.fn()
        const mockResSet = jest.fn()
        const mockReadStreamFrom = jest.fn().mockReturnValue({ pipe: mockPipe })
        jest.spyOn(fs.ReadStream, 'from').mockImplementation(mockReadStreamFrom)

        const req = {
            path: '/hell.txt',
            query: {},
            headers: {},
        } as Request
        const res = { pipe: mockPipe, set: mockResSet } as unknown as Response

        controllers.staticFile(req, res)

        expect(mockResSet).toHaveBeenCalledWith(
            expect.objectContaining({ 'Content-disposition': expect.stringMatching(/attachment; filename=.*/) })
        )

        jest.resetAllMocks()
    })

    it('should accept ranges', async () => {
        const mockPipe = jest.fn()
        const mockResSet = jest.fn()
        const mockReadStreamFrom = jest.fn().mockReturnValue({ pipe: mockPipe })
        jest.spyOn(fs.ReadStream, 'from').mockImplementation(mockReadStreamFrom)

        const req = {
            path: '/hell.txt',
            query: {},
            headers: { range: 'bytes=1-3' },
        } as Request
        const res = { pipe: mockPipe, set: mockResSet } as unknown as Response

        controllers.staticFile(req, res)

        expect(mockResSet).toHaveBeenCalledWith('Content-Range', expect.stringMatching(/bytes \d+-\d+\/\d+/))

        jest.resetAllMocks()
    })
})

describe('homePage', () => {
    it('should render pages/home.ejs with correct data', () => {
        const filesName = ['ok.txt']
        const files = filesName.map(file => ({ name: file, url: `/${filesUri}/${file}` }))
        const filesZipUrl = `/${filesUri}/zip`

        jest.spyOn(fs, 'readdirSync').mockReturnValue(filesName as unknown as fs.Dirent[])

        const req = { path: '/', params: {}, headers: {} } as Request
        const res = { render: jest.fn() } as unknown as Response

        controllers.homePage(req, res)

        expect(res.render).toHaveBeenCalledWith('pages/home.ejs', { files, filesZipUrl, subFolder: false })

        jest.resetAllMocks()
    })

    it('should render pages/home.ejs with correct data when query subFolder provided', () => {
        const filesName = ['ok.txt']
        const subFolder = '/subfolder'
        const files = filesName.map(file => ({ name: file, url: `/${filesUri}${subFolder}/${file}` }))
        const filesZipUrl = `/${filesUri}${subFolder}/zip`
        const mockPathJoin = jest.fn()

        jest.spyOn(path, 'join').mockImplementation(mockPathJoin)
        jest.spyOn(fs, 'readdirSync').mockReturnValue(filesName as unknown as fs.Dirent[])

        const req = { path: '/', params: { subFolder }, headers: {} } as unknown as Request
        const res = { render: jest.fn() } as unknown as Response

        controllers.homePage(req, res)

        expect(mockPathJoin).toHaveBeenCalledWith(expect.stringContaining(''), subFolder)
        expect(res.render).toHaveBeenCalledWith('pages/home.ejs', { files, filesZipUrl, subFolder: true })

        jest.resetAllMocks()
    })
})

describe('startNgrok', () => {
    it('should return uri localhost & port when NODE_ENV in development mode', async () => {
        const port = 8089
        const consoleLogMock = jest.fn()

        jest.spyOn(console, 'log').mockImplementation(consoleLogMock)

        process.env.NODE_ENV = 'development'
        await controllers.startNgrok(port)

        expect(consoleLogMock).toHaveBeenCalledWith(`Server start on port ${port}, http://localhost:${port}`)

        jest.resetAllMocks()
    })

    it('should return uri of ngrok when NODE_ENV not in development mode', async () => {
        const port = 8089
        const consoleLogMock = jest.fn()

        jest.spyOn(console, 'log').mockImplementation(consoleLogMock)
        jest.spyOn(ngrok, 'connect').mockImplementation(jest.fn().mockReturnValue('https://filespool.ngrok.app'))

        process.env.NODE_ENV = 'production'
        await controllers.startNgrok(port)

        expect(consoleLogMock).toHaveBeenCalledWith('Your FilesPool URL:', 'https://filespool.ngrok.app')

        jest.resetAllMocks()
    })
})
