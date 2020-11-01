import * as fs from 'fs'
import { promises as fsp } from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import * as child_process from 'child_process'

export async function activate() {
	const output = vscode.window.createOutputChannel('Testr')

	const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0)
	statusBarItem.command = 'testr.edit'
	statusBarItem.show()

	function isEnabled() {
		const enable = vscode.workspace.getConfiguration().inspect<boolean>('testr.enable')

		return enable?.workspaceFolderValue ?? enable?.workspaceValue ?? enable?.globalValue
	}

	vscode.commands.registerCommand('testr.edit', async () => {
		const config = vscode.workspace.getConfiguration()

		if (isEnabled() === undefined) {
			// init config

			if (vscode.workspace.workspaceFolders?.length !== 1)
				return extFail('Testr only supports one workspace')

			const workspace = vscode.workspace.workspaceFolders?.[0].uri.fsPath

			if (!workspace) return

			const dotvscode = path.join(workspace, '.vscode')
			const settings = path.join(dotvscode, 'settings.json')
			const extensions = path.join(dotvscode, 'extensions.json')

			if (!fs.existsSync(dotvscode))
				fs.mkdirSync(dotvscode)

			if (!fs.existsSync(settings))
				fs.writeFileSync(settings, '{}')

			config.update('testr.enable', true, vscode.ConfigurationTarget.Workspace)
			config.update('testr.autoTest', 1700, vscode.ConfigurationTarget.Workspace)
			config.update('testr.successExitCodes', [0], vscode.ConfigurationTarget.Workspace)
			config.update('testr.runWith', 'terminal', vscode.ConfigurationTarget.Workspace)

			if (!fs.existsSync(extensions))
				fs.writeFileSync(extensions, JSON.stringify({
					recommendations: [
						'tscpp.testr',
						'tscpp.node-dependencies'
					]
				}))

			await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(settings))
		}
		else
			output.show()
	})

	function extFail(tooltip: string | undefined) {
		statusBarItem.text = '$(circle-slash) TESTR'
		// statusBarItem.color = new vscode.ThemeColor('errorForeground')
		statusBarItem.tooltip = tooltip
	}

	function testFail(exitcode?: number) {
		statusBarItem.text = '$(alert) TESTR'
		statusBarItem.color = new vscode.ThemeColor('errorForeground')
		statusBarItem.tooltip = 'Tests has failed. Test will trigger after cooldown after save.'
		timeout = undefined

		if (exitcode)
			statusBarItem.tooltip += ` Exited with code ${exitcode}.`
	}

	function testSuccess(unsure = false) {
		statusBarItem.text = '$(check-all) TESTR'
		statusBarItem.color = undefined
		statusBarItem.tooltip = 'All tests has succeeded. Test will trigger after cooldown after save.'

		if (unsure)
			statusBarItem.tooltip += ' The result may be inaccurate, consider switching \'testr.runWith\' to terminal.'

		timeout = undefined
	}

	async function update() {
		if (isEnabled() === false)
			statusBarItem.hide()
		else
			statusBarItem.show()

		if (isEnabled() === undefined)
			return extFail('Testr is not set up. Click here to setup Testr config.')

		statusBarItem.text = '$(loading) TESTR'
		statusBarItem.color = undefined
		statusBarItem.tooltip = 'Running tests'

		if (vscode.workspace.workspaceFolders?.length !== 1)
			return extFail('Testr only supports one workspace')

		const workspace = vscode.workspace.workspaceFolders[0].uri.fsPath
		const runWith = vscode.workspace.getConfiguration().get<'npm' | 'terminal'>('testr.runWith')

		const packagePath = path.join(workspace, 'package.json')
		let packageData: undefined | unknown[] | Record<string | number, unknown> = undefined

		try {
			packageData = JSON.parse((await fsp.readFile(packagePath)).toString())
		} catch (err) {
			extFail('Failed to read/parse package.json')
			console.error(err)
			return
		}

		if (!(typeof packageData === 'object' && !Array.isArray(packageData)))
			return extFail('Failed to read/parse package.json')

		if (!(packageData.scripts && typeof packageData.scripts === 'object' && (packageData.scripts as Record<string | number, unknown>).test && typeof (packageData.scripts as Record<string | number, unknown>).test === 'string'))
			return extFail('package.json does not have a test script')

		const testScript = (packageData.scripts as Record<string, string>).test

		if (runWith === 'terminal') {
			let startTime = Date.now()
			const cprocess = child_process.exec(testScript, { cwd: workspace })

			cprocess.stdout?.on('data', (chunk) => output.append(typeof chunk === 'object' && 'toString' in chunk ? chunk.toString() : String(chunk)))
			cprocess.stderr?.on('data', (chunk) => output.append(typeof chunk === 'object' && 'toString' in chunk ? chunk.toString() : String(chunk)))

			let error = false
			cprocess.on('error', err => {
				error = true

				return testFail()
			})

			cprocess.on('exit', code => {
				if (error) return

				if (Date.now() - startTime > 3000 && isEnabled() === undefined) {
					vscode.window.showInformationMessage('The timeout took more than 3 seconds. Would you like to setup a Testr config?', 'Yes', 'Never').then(action => {
						if (action === 'Yes')
							vscode.commands.executeCommand('testr.edit')
					})
				}

				if (code === 0 || !code)
					return testSuccess()
				else if (vscode.workspace.getConfiguration().get<number[]>('testr.successExitCodes')?.includes(code))
					return testSuccess()
				else
					return testFail(code)
			})
		} else {
			let startTime = Date.now()
			const cprocess = child_process.exec(`npm run-script test`, { cwd: workspace })

			cprocess.stdout?.on('data', (chunk) => output.append(typeof chunk === 'object' && 'toString' in chunk ? chunk.toString() : String(chunk)))
			cprocess.stderr?.on('data', (chunk) => output.append(typeof chunk === 'object' && 'toString' in chunk ? chunk.toString() : String(chunk)))

			let error = false
			cprocess.on('error', err => {
				error = true

				return testFail()
			})

			cprocess.on('exit', code => {
				if (error) return

				const config = vscode.workspace.getConfiguration()

				if (Date.now() - startTime > 5000 && isEnabled() === undefined && config.get('testr.promptConfig')) {
					vscode.window.showInformationMessage('The timeout took more than 5 seconds. Would you like to setup a Testr config?', 'Yes', 'Never').then(action => {
						if (action === 'Yes')
							vscode.commands.executeCommand('testr.edit')
						else
							config.update('testr.promptConfig', false, vscode.ConfigurationTarget.Global)
					})
				}

				if (code === 0 || !code)
					return testSuccess()
				else if (config.get<number[]>('testr.successExitCodes')?.concat(4294963238)?.includes(code))
					return testSuccess(true)
				else
					return testFail(code)
			})
		}
	}

	update()

	let allowCancelTimeout = true
	let timeout: NodeJS.Timeout | undefined
	vscode.workspace.onDidChangeTextDocument(event => {
		if (event.document.uri.fsPath.startsWith('extension-output') || !allowCancelTimeout) return

		if (timeout)
			clearTimeout(timeout)

		const config = vscode.workspace.getConfiguration().inspect<boolean | number>('testr.autoTest')
		const autoTest = config?.workspaceFolderValue ?? config?.workspaceValue ?? config?.globalValue
		const ms = typeof autoTest === 'number' ? autoTest : undefined

		if (ms !== undefined || autoTest) {
			statusBarItem.text = '$(clock) TESTR'
			statusBarItem.color = undefined
			statusBarItem.tooltip = 'Waiting for timeout...'

			timeout = setTimeout(() => {
				allowCancelTimeout = false
				update()
				allowCancelTimeout = true
			}, ms ?? 2000)
		}
	})
}
