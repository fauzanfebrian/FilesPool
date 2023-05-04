import { exec } from 'child_process'

async function executeCommand(command: string) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdOut, stdErr) => {
            if (error || stdErr) return reject(error || stdErr)
            return resolve(stdOut)
        })
    })
}

async function Build() {
    console.log('Removing filespool build')
    await executeCommand('rm -r filespool*')
    console.log('Build filespool')
    const stdOut = await executeCommand('pkg --compress GZip .')
    console.log(stdOut)
}
Build()
