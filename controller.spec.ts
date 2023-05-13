import { Request, Response } from 'express'
import fs from 'fs'
import JSZip from 'jszip'
import path from 'path'
import * as controllers from './controllers'

describe('zipDirectory', () => {
    it('zip & return the buffer data', async () => {
        const buffer = await controllers.zipDirectory(controllers.filesDirectoryPath)

        expect(buffer).toBeInstanceOf(Buffer)
    })

    it('should not zip "nodata" file', async () => {
        const mockFile = jest.fn()
        const mockFolder = jest.fn().mockReturnValue({ file: mockFile })

        jest.spyOn(JSZip.prototype, 'folder').mockImplementation(mockFolder)
        jest.spyOn(JSZip.prototype, 'file').mockImplementation(mockFile)

        const nodataPath = path.join(controllers.filesDirectoryPath, 'nodata')
        const nodataBuffer = fs.readFileSync(nodataPath)

        await controllers.zipDirectory(controllers.filesDirectoryPath)

        expect(mockFile).not.toHaveBeenCalledWith('nodata', nodataBuffer)

        jest.restoreAllMocks()
    })
})

describe('zipping', () => {
    it('should stream zip file', async () => {
        const mockPipe = jest.fn()
        const mockReadStreamFrom = jest.fn().mockReturnValue({ pipe: mockPipe })
        jest.spyOn(fs.ReadStream, 'from').mockImplementation(mockReadStreamFrom)

        const req = { params: {}, headers: {} } as Request
        const res = { pipe: mockPipe, set: jest.fn() } as unknown as Response

        await controllers.zipping(req, res)

        const zip = await controllers.zipDirectory(controllers.filesDirectoryPath)

        expect(mockPipe).toBeCalledWith(res)
        expect(mockReadStreamFrom).toHaveBeenCalledWith(zip)

        jest.resetAllMocks()
    })

    it('should accept ranges', async () => {
        const mockPipe = jest.fn()
        const mockResSet = jest.fn()
        const mockReadStreamFrom = jest.fn().mockReturnValue({ pipe: mockPipe })
        jest.spyOn(fs.ReadStream, 'from').mockImplementation(mockReadStreamFrom)

        const req = { params: {}, headers: { range: 'bytes=200-1000, 2000-6576, 19000-' } } as Request
        const res = { pipe: mockPipe, set: mockResSet } as unknown as Response

        await controllers.zipping(req, res)

        await controllers.zipDirectory(controllers.filesDirectoryPath)

        expect(mockResSet).toHaveBeenCalledWith('Content-Range', expect.stringMatching(/bytes \d+-\d+\/\d+/))

        jest.resetAllMocks()
    })
})
