import { Request, Response } from 'express'
import fs from 'fs'
import { filesDirectoryPath } from 'src/config'
import * as controllers from 'src/controllers'
import { zipDirectory } from 'src/utils/zip'

describe('zipping', () => {
    it('should stream zip file', async () => {
        const mockPipe = jest.fn()
        const mockReadStreamFrom = jest.fn().mockReturnValue({ pipe: mockPipe })
        jest.spyOn(fs.ReadStream, 'from').mockImplementation(mockReadStreamFrom)

        const req = { params: {}, headers: {} } as Request
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

        const req = { params: {}, headers: { range: 'bytes=200-1000, 2000-6576, 19000-' } } as Request
        const res = { pipe: mockPipe, set: mockResSet } as unknown as Response

        await controllers.zipping(req, res)

        await zipDirectory(filesDirectoryPath)

        expect(mockResSet).toHaveBeenCalledWith('Content-Range', expect.stringMatching(/bytes \d+-\d+\/\d+/))

        jest.resetAllMocks()
    })
})
