import fs from 'fs'
import JSZip from 'jszip'
import path from 'path'
import { filesDirectoryPath } from '../config'
import { zipDirectory } from './zip'

describe('zipDirectory', () => {
    it('zip & return the buffer data', async () => {
        const buffer = await zipDirectory(filesDirectoryPath)

        expect(buffer).toBeInstanceOf(Buffer)
    })

    it('should not zip "nodata" file', async () => {
        const mockFile = jest.fn()
        const mockFolder = jest.fn().mockReturnValue({ file: mockFile })

        jest.spyOn(JSZip.prototype, 'folder').mockImplementation(mockFolder)
        jest.spyOn(JSZip.prototype, 'file').mockImplementation(mockFile)

        const nodataPath = path.join(filesDirectoryPath, 'nodata')
        const nodataBuffer = fs.readFileSync(nodataPath)

        await zipDirectory(filesDirectoryPath)

        expect(mockFile).not.toHaveBeenCalledWith('nodata', nodataBuffer)

        jest.restoreAllMocks()
    })
})
